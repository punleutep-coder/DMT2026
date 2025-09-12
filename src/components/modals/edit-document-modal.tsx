
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { useToast } from '@/hooks/use-toast'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { suggestTagsAction } from '@/app/actions/ai'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  id: z.string().min(1, 'Document ID is required.'),
  name: z.string().min(1, 'Document name is required.'),
  documentType: z.string().optional(),
  office: z.string().optional(),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  documentLink1: z.string().url().optional().or(z.literal('')),
  documentLink2: z.string().url().optional().or(z.literal('')),
  documentLink3: z.string().url().optional().or(z.literal('')),
  documentLink4: z.string().url().optional().or(z.literal('')),
  assignedDepartment: z.string().optional(),
  docTags: z.string().optional(),
})

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
}

export default function EditDocumentModal({ isOpen, onClose, docId, firestoreId }: EditDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)
  const { currentUser, documentTypes, assignedDepartments } = state
  const { toast } = useToast()
  const [isSuggesting, setIsSuggesting] = useState(false)
  const t = useTranslation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: docToUpdate?.id || '',
      name: docToUpdate?.name || '',
      documentType: docToUpdate?.documentType || '',
      office: docToUpdate?.office || '',
      secondaryId: docToUpdate?.secondaryId || '',
      tertiaryId: docToUpdate?.tertiaryId || '',
      quaternaryId: docToUpdate?.quaternaryId || '',
      documentLink1: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[0] || '' : '',
      documentLink2: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[1] || '' : '',
      documentLink3: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[2] || '' : '',
      documentLink4: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[3] || '' : '',
      assignedDepartment: docToUpdate?.assignedDepartment || '',
      docTags: Array.isArray(docToUpdate?.tags) ? docToUpdate.tags.join(', ') : '',
    },
  })

  if (!docToUpdate) return null
  
  const handleSuggestTags = async () => {
    const docName = form.getValues('name')
    if (!docName) {
      form.setError('name', { message: 'Please enter a name first.' })
      return
    }
    setIsSuggesting(true)
    try {
      const tags = await suggestTagsAction(docName)
      form.setValue('docTags', tags.join(', '))
    } catch (error) {
      console.error('Failed to suggest tags', error)
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleCreateAssignedDepartment = (deptName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can create new assigned departments.", variant: "destructive" });
      return;
    }
    if (assignedDepartments.some(d => d.toLowerCase() === deptName.toLowerCase())) {
        toast({ title: "Duplicate Department", description: "This assigned department already exists.", variant: "destructive" });
        return;
    }
    
    const newAssignedDepartments = [...assignedDepartments, deptName];
    dispatch({ type: 'SET_ASSIGNED_DEPARTMENTS', payload: newAssignedDepartments });
    form.setValue('assignedDepartment', deptName);
    toast({ title: "Assigned Department Created", description: `"${deptName}" has been added.` });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const sanitizedId = sanitizeFirebaseKey(values.id);
    if (sanitizedId !== sanitizeFirebaseKey(docToUpdate.id) && state.documents.some(d => sanitizeFirebaseKey(d.id) === sanitizedId)) {
        form.setError('id', { message: 'This Document ID already exists.' });
        return;
    }
    
    if (sanitizedId !== sanitizeFirebaseKey(docToUpdate.id)) {
        const newDoc: Document = {
            ...docToUpdate,
            id: values.id,
            name: values.name,
            documentType: values.documentType || null,
            office: values.office || null,
            assignedDepartment: values.assignedDepartment || null,
            secondaryId: values.secondaryId || null,
            tertiaryId: values.tertiaryId || null,
            quaternaryId: values.quaternaryId || null,
            documentLink: [values.documentLink1, values.documentLink2, values.documentLink3, values.documentLink4].filter(Boolean) as string[],
            tags: values.docTags?.split(',').map(t => t.trim()).filter(Boolean) || [],
            lastUpdate: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
        dispatch({ type: 'DELETE_DOCUMENT', payload: { id: docToUpdate.id } });
        dispatch({
            type: 'ADD_LOG',
            payload: {
                docId: values.id,
                oldStatus: 'ID Changed',
                newStatus: `ID changed from ${docToUpdate.id}`,
                user: currentUser!.username,
                timestamp: new Date().toISOString(),
                reason: `Document ID was changed from ${docToUpdate.id} to ${values.id}. A new record was created.`
            }
        });
        toast({ title: "Success", description: `Document ID changed to ${values.id}.` });
    } else {
        const changes: string[] = [];
        const updatedFields: Partial<Document> & {id: string} = {
            id: docToUpdate.id,
            lastUpdate: new Date().toISOString(),
        };

        const compareAndPush = (fieldName: string, oldValue: any, newValue: any) => {
            if (oldValue !== newValue) {
                changes.push(`${fieldName} changed from "${oldValue || 'N/A'}" to "${newValue || 'N/A'}".`);
            }
        };

        if (hasPermission(currentUser, 'canEditDocumentName') && values.name !== docToUpdate.name) {
            updatedFields.name = values.name;
            compareAndPush('Name', docToUpdate.name, values.name);
        }
        if (hasPermission(currentUser, 'canEditDocumentType') && values.documentType !== (docToUpdate.documentType || '')) {
            updatedFields.documentType = values.documentType || null;
            compareAndPush('Document Type', docToUpdate.documentType, values.documentType);
        }
        if (hasPermission(currentUser, 'canEditOffice') && values.office !== (docToUpdate.office || '')) {
            updatedFields.office = values.office || null;
            compareAndPush('Office', docToUpdate.office, values.office);
        }
        if (hasPermission(currentUser, 'canEditAssignedDepartment') && values.assignedDepartment !== (docToUpdate.assignedDepartment || '')) {
            updatedFields.assignedDepartment = values.assignedDepartment || null;
            compareAndPush('Assigned Department', docToUpdate.assignedDepartment, values.assignedDepartment);
        }
        if (hasPermission(currentUser, 'canEditSecondaryId') && values.secondaryId !== (docToUpdate.secondaryId || '')) {
            updatedFields.secondaryId = values.secondaryId || null;
            compareAndPush('Secondary ID', docToUpdate.secondaryId, values.secondaryId);
        }
        if (hasPermission(currentUser, 'canEditTertiaryId') && values.tertiaryId !== (docToUpdate.tertiaryId || '')) {
            updatedFields.tertiaryId = values.tertiaryId || null;
            compareAndPush('Tertiary ID', docToUpdate.tertiaryId, values.tertiaryId);
        }
        if (hasPermission(currentUser, 'canEditQuaternaryId') && values.quaternaryId !== (docToUpdate.quaternaryId || '')) {
            updatedFields.quaternaryId = values.quaternaryId || null;
            compareAndPush('Quaternary ID', docToUpdate.quaternaryId, values.quaternaryId);
        }

        const newTags = values.docTags?.split(',').map(t => t.trim()).filter(Boolean) || [];
        const oldTags = docToUpdate.tags || [];
        if (hasPermission(currentUser, 'canEditTags') && JSON.stringify(newTags) !== JSON.stringify(oldTags)) {
            updatedFields.tags = newTags;
            compareAndPush('Tags', oldTags.join(', '), newTags.join(', '));
        }
        
        const newLinks = [values.documentLink1, values.documentLink2, values.documentLink3, values.documentLink4].filter(Boolean) as string[];
        const oldLinks = docToUpdate.documentLink || [];
        if (JSON.stringify(newLinks) !== JSON.stringify(oldLinks)) {
            updatedFields.documentLink = newLinks;
            compareAndPush('Document Links', oldLinks.join(', '), newLinks.join(', '));
        }
        
        if (changes.length > 0) {
            dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
            dispatch({
                type: 'ADD_LOG',
                payload: {
                    docId: docToUpdate.id,
                    oldStatus: docToUpdate.status,
                    newStatus: 'Details Edited',
                    user: currentUser!.username,
                    timestamp: new Date().toISOString(),
                    reason: changes.join('\n')
                }
            });
            toast({ title: "Success", description: "Document details saved." });
        } else {
            toast({ title: "No Changes", description: "No changes were made to the document." });
        }
    }
    
    onClose();
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>
            {t('editDocument')}: <span className="text-primary">{docToUpdate.id}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4">
                {hasPermission(currentUser, 'canEditDocumentId') && <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel>{t('docIdPrimary')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditDocumentName') && <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('docName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditDocumentType') && (
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('documentType')}</FormLabel>
                        <Combobox
                          options={documentTypeOptions}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={t('selectDocType')}
                          searchPlaceholder={t('searchDocType')}
                          notFoundText={t('noDocTypeFound')}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {hasPermission(currentUser, 'canEditOffice') && <FormField control={form.control} name="office" render={({ field }) => ( <FormItem><FormLabel>{t('office')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditAssignedDepartment') && (
                  <FormField
                    control={form.control}
                    name="assignedDepartment"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('assignedDepartment')}</FormLabel>
                        <Combobox
                          options={assignedDepartmentOptions}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={t('selectAssignedDept')}
                          searchPlaceholder={t('searchAssignedDept')}
                          notFoundText={t('noAssignedDeptFound')}
                          onCreate={currentUser?.role === 'Admin' ? handleCreateAssignedDepartment : undefined}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hasPermission(currentUser, 'canEditSecondaryId') && <FormField control={form.control} name="secondaryId" render={({ field }) => ( <FormItem><FormLabel>{t('secondaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditTertiaryId') && <FormField control={form.control} name="tertiaryId" render={({ field }) => ( <FormItem><FormLabel>{t('tertiaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditQuaternaryId') && <FormField control={form.control} name="quaternaryId" render={({ field }) => ( <FormItem><FormLabel>{t('quaternaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                </div>

                {hasPermission(currentUser, 'canEditTags') && <FormField control={form.control} name="docTags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tagsLabel')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} /></FormControl>
                      <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isSuggesting}>
                        <Sparkles className="mr-2 h-4 w-4" /> {isSuggesting ? t('suggesting') : t('suggest')}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasPermission(currentUser, 'canEditDocumentLink1') && <FormField control={form.control} name="documentLink1" render={({ field }) => ( <FormItem><FormLabel>{t('docLink1')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink2') && <FormField control={form.control} name="documentLink2" render={({ field }) => ( <FormItem><FormLabel>{t('docLink2')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink3') && <FormField control={form.control} name="documentLink3" render={({ field }) => ( <FormItem><FormLabel>{t('docLink3')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink4') && <FormField control={form.control} name="documentLink4" render={({ field }) => ( <FormItem><FormLabel>{t('docLink4')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit">{t('saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

    

    

    