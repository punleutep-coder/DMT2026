'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { useToast } from '@/hooks/use-toast'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { Link as LinkIcon, Fingerprint, ChevronLeft, Save, X } from 'lucide-react'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils'

const formSchema = z.object({
  id: z.string().min(1, 'Document ID is required.'),
  name: z.string().min(1, 'Document name is required.'),
  documentType: z.string().optional(),
  label: z.string().optional(),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  quinaryId: z.string().optional(),
  senaryId: z.string().optional(),
  septenaryId: z.string().optional(),
  octonaryId: z.string().optional(),
  nonaryId: z.string().optional(),
  denaryId: z.string().optional(),
  documentLink1: z.string().url().optional().or(z.literal('')),
  documentLink2: z.string().url().optional().or(z.literal('')),
  documentLink3: z.string().url().optional().or(z.literal('')),
  documentLink4: z.string().url().optional().or(z.literal('')),
  documentLink5: z.string().url().optional().or(z.literal('')),
  documentLink6: z.string().url().optional().or(z.literal('')),
  documentLink7: z.string().url().optional().or(z.literal('')),
  documentLink8: z.string().url().optional().or(z.literal('')),
  documentLink9: z.string().url().optional().or(z.literal('')),
  documentLink10: z.string().url().optional().or(z.literal('')),
  assignedDepartment: z.string().optional(),
  keywords: z.string().optional(),
  docTags: z.string().optional(),
})

type EditDocumentFormValues = z.infer<typeof formSchema>;

export default function EditDocumentView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
  const docToUpdate = state.documents.find(d => d.id === docId)
  const { currentUser, documentTypes, assignedDepartments, labels } = state
  const { toast } = useToast()
  const t = useTranslation()

  const form = useForm<EditDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: docToUpdate?.id || '',
      name: docToUpdate?.name || '',
      documentType: docToUpdate?.documentType || '',
      label: docToUpdate?.label || '',
      secondaryId: docToUpdate?.secondaryId || '',
      tertiaryId: docToUpdate?.tertiaryId || '',
      quaternaryId: docToUpdate?.quaternaryId || '',
      quinaryId: docToUpdate?.quinaryId || '',
      senaryId: docToUpdate?.senaryId || '',
      septenaryId: docToUpdate?.septenaryId || '',
      octonaryId: docToUpdate?.octonaryId || '',
      nonaryId: docToUpdate?.nonaryId || '',
      denaryId: docToUpdate?.denaryId || '',
      documentLink1: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[0] || '' : '',
      documentLink2: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[1] || '' : '',
      documentLink3: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[2] || '' : '',
      documentLink4: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[3] || '' : '',
      documentLink5: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[4] || '' : '',
      documentLink6: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[5] || '' : '',
      documentLink7: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[6] || '' : '',
      documentLink8: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[7] || '' : '',
      documentLink9: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[8] || '' : '',
      documentLink10: Array.isArray(docToUpdate?.documentLink) ? docToUpdate?.documentLink[9] || '' : '',
      assignedDepartment: docToUpdate?.assignedDepartment || '',
      keywords: docToUpdate?.keywords || '',
      docTags: Array.isArray(docToUpdate?.tags) ? docToUpdate.tags.join(', ') : '',
    },
  })

  if (!docToUpdate) return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
          <X className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-6">The document you are trying to edit could not be located or has been deleted.</p>
          <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
      </div>
  )
  
  const handleCreateAssignedDepartment = (deptName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: t('permissionDenied' as any), description: t('adminOnlyPermission' as any), variant: "destructive" });
      return;
    }
    if (assignedDepartments.some(d => d.toLowerCase() === deptName.toLowerCase())) {
        toast({ title: t('duplicate' as any), description: t('itemAlreadyExists' as any), variant: "destructive" });
        return;
    }
    
    const newAssignedDepartments = [...assignedDepartments, deptName];
    dispatch({ type: 'SET_ASSIGNED_DEPARTMENTS', payload: newAssignedDepartments });
    form.setValue('assignedDepartment', deptName);
    toast({ title: t('created' as any), description: `${deptName}` });
  }

  const handleCreateLabel = (labelName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: t('permissionDenied' as any), description: t('adminOnlyPermission' as any), variant: "destructive" });
      return;
    }
    if (labels.some(l => l.toLowerCase() === labelName.toLowerCase())) {
        toast({ title: t('duplicate' as any), description: t('itemAlreadyExists' as any), variant: "destructive" });
        return;
    }
    
    const newLabels = [...labels, labelName];
    dispatch({ type: 'SET_LABELS', payload: newLabels });
    form.setValue('label', labelName);
    toast({ title: t('created' as any), description: `${labelName}` });
  }

  const onSubmit = async (values: EditDocumentFormValues) => {
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
            label: values.label || null,
            assignedDepartment: values.assignedDepartment || null,
            secondaryId: values.secondaryId || null,
            tertiaryId: values.tertiaryId || null,
            quaternaryId: values.quaternaryId || null,
            quinaryId: values.quinaryId || null,
            senaryId: values.senaryId || null,
            septenaryId: values.septenaryId || null,
            octonaryId: values.octonaryId || null,
            nonaryId: values.nonaryId || null,
            denaryId: values.denaryId || null,
            documentLink: [
                values.documentLink1 || '', values.documentLink2 || '', values.documentLink3 || '', values.documentLink4 || '',
                values.documentLink5 || '', values.documentLink6 || '', values.documentLink7 || '', values.documentLink8 || '',
                values.documentLink9 || '', values.documentLink10 || ''
            ],
            keywords: values.keywords || '',
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
        if (hasPermission(currentUser, 'canEditLabel') && values.label !== (docToUpdate.label || '')) {
            updatedFields.label = values.label || null;
            compareAndPush('Label', docToUpdate.label, values.label);
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
        if (hasPermission(currentUser, 'canEditQuinaryId') && values.quinaryId !== (docToUpdate.quinaryId || '')) {
            updatedFields.quinaryId = values.quinaryId || null;
            compareAndPush('Quinary ID', docToUpdate.quinaryId, values.quinaryId);
        }
        if (hasPermission(currentUser, 'canEditSenaryId') && values.senaryId !== (docToUpdate.senaryId || '')) {
            updatedFields.senaryId = values.senaryId || null;
            compareAndPush('Senary ID', docToUpdate.senaryId, values.senaryId);
        }
        if (hasPermission(currentUser, 'canEditSeptenaryId') && values.septenaryId !== (docToUpdate.septenaryId || '')) {
            updatedFields.septenaryId = values.septenaryId || null;
            compareAndPush('Septenary ID', docToUpdate.septenaryId, values.septenaryId);
        }
        if (hasPermission(currentUser, 'canEditOctonaryId') && values.octonaryId !== (docToUpdate.octonaryId || '')) {
            updatedFields.octonaryId = values.octonaryId || null;
            compareAndPush('Octonary ID', docToUpdate.octonaryId, values.octonaryId);
        }
        if (hasPermission(currentUser, 'canEditNonaryId') && values.nonaryId !== (docToUpdate.nonaryId || '')) {
            updatedFields.nonaryId = values.nonaryId || null;
            compareAndPush('Nonary ID', docToUpdate.nonaryId, values.nonaryId);
        }
        if (hasPermission(currentUser, 'canEditDenaryId') && values.denaryId !== (docToUpdate.denaryId || '')) {
            updatedFields.denaryId = values.denaryId || null;
            compareAndPush('Denary ID', docToUpdate.denaryId, values.denaryId);
        }
         if (hasPermission(currentUser, 'canEditKeywords') && values.keywords !== (docToUpdate.keywords || '')) {
            updatedFields.keywords = values.keywords || '';
            compareAndPush('Keywords', docToUpdate.keywords, values.keywords);
        }

        const newTags = values.docTags?.split(',').map(t => t.trim()).filter(Boolean) || [];
        const oldTags = docToUpdate.tags || [];
        if (hasPermission(currentUser, 'canEditTags') && JSON.stringify(newTags) !== JSON.stringify(oldTags)) {
            updatedFields.tags = newTags;
            compareAndPush('Tags', oldTags.join(', '), newTags.join(', '));
        }
        
        const newLinks = [
            values.documentLink1 || '', values.documentLink2 || '', values.documentLink3 || '', values.documentLink4 || '',
            values.documentLink5 || '', values.documentLink6 || '', values.documentLink7 || '', values.documentLink8 || '',
            values.documentLink9 || '', values.documentLink10 || ''
        ];
        const oldLinks = docToUpdate.documentLink || [];
        if (JSON.stringify(newLinks) !== JSON.stringify(oldLinks)) {
            updatedFields.documentLink = newLinks;
            compareAndPush('Document Links', oldLinks.filter(Boolean).join(', '), newLinks.filter(Boolean).join(', '));
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
    
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white/50 hover:bg-white shadow-sm border border-white/20"
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
          >
            <ChevronLeft className="h-5 w-5 text-[#000066]" />
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#000066]">{t('editDocument')}: <span className="text-destructive">{docToUpdate.id}</span></h2>
        </div>
      </div>

      <div className="glassmorphic-card p-6 sm:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
              {/* Primary Details Section */}
              <div className="grid grid-cols-1 gap-8">
                {hasPermission(currentUser, 'canEditDocumentName') && (
                  <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => ( 
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('docName')}</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                className="min-h-[120px] sm:min-h-[150px] text-base sm:text-lg py-3 rounded-xl" 
                                placeholder={t('docNamePlaceholder' as any)}
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem> 
                    )} 
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {hasPermission(currentUser, 'canEditDocumentId') && (
                      <FormField 
                        control={form.control} 
                        name="id" 
                        render={({ field }) => ( 
                          <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('docIdPrimary')}</FormLabel>
                            <FormControl><Input {...field} className="h-12 sm:h-14 text-base sm:text-lg rounded-xl" /></FormControl>
                            <FormMessage />
                          </FormItem> 
                        )} 
                      />
                    )}

                    {hasPermission(currentUser, 'canEditDocumentType') && (
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('documentType')}</FormLabel>
                            <Combobox
                                options={documentTypeOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectDocType')}
                                searchPlaceholder={t('searchDocType')}
                                notFoundText={t('noDocTypeFound')}
                                className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    )}

                    {hasPermission(currentUser, 'canEditLabel') && (
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('label')}</FormLabel>
                                <Combobox
                                    options={labelOptions}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder={t('selectLabel')}
                                    searchPlaceholder={t('searchLabel')}
                                    notFoundText={t('noLabelFound')}
                                    onCreate={currentUser?.role === 'Admin' ? handleCreateLabel : undefined}
                                    className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {hasPermission(currentUser, 'canEditAssignedDepartment') && (
                    <FormField
                        control={form.control}
                        name="assignedDepartment"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('assignedDepartment')}</FormLabel>
                            <Combobox
                                options={assignedDepartmentOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectAssignedDept')}
                                searchPlaceholder={t('searchAssignedDept')}
                                onCreate={currentUser?.role === 'Admin' ? handleCreateAssignedDepartment : undefined}
                                className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    )}
                </div>
              </div>
              
              {/* Extra IDs Section */}
              <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 sm:px-8 bg-white/30">
                <AccordionItem value="extra-ids" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-6 sm:py-8">
                    <div className="flex items-center gap-4">
                      <Fingerprint className="h-6 w-6 text-emerald-600" />
                      <span className="font-bold text-xl text-emerald-600 uppercase tracking-tight">{t('documentExtraIds')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-8 sm:pb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {[
                        { name: 'secondaryId', perm: 'canEditSecondaryId' },
                        { name: 'tertiaryId', perm: 'canEditTertiaryId' },
                        { name: 'quaternaryId', perm: 'canEditQuaternaryId' },
                        { name: 'quinaryId', perm: 'canEditQuinaryId' },
                        { name: 'senaryId', perm: 'canEditSenaryId' },
                        { name: 'septenaryId', perm: 'canEditSeptenaryId' },
                        { name: 'octonaryId', perm: 'canEditOctonaryId' },
                        { name: 'nonaryId', perm: 'canEditNonaryId' },
                        { name: 'denaryId', perm: 'canEditDenaryId' },
                      ].map((extraId) => (
                        hasPermission(currentUser, extraId.perm as any) && (
                          <FormField 
                            key={extraId.name}
                            control={form.control} 
                            name={extraId.name as any} 
                            render={({ field }) => ( 
                              <FormItem>
                                <FormLabel className="text-base font-semibold block mb-1.5">{t(extraId.name as any)}</FormLabel>
                                <FormControl><Input {...field} className="h-12 text-base rounded-xl" /></FormControl>
                                <FormMessage />
                              </FormItem> 
                            )} 
                          />
                        )
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Document Links Section */}
              <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 sm:px-8 bg-white/30">
                <AccordionItem value="links" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-6 sm:py-8">
                    <div className="flex items-center gap-4">
                      <LinkIcon className="h-6 w-6 text-blue-600" />
                      <span className="font-bold text-xl text-blue-600 uppercase tracking-tight">{t('documentLinks')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-8 sm:pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const linkKey = `documentLink${num}` as keyof EditDocumentFormValues;
                        const editPerm = `canEditDocumentLink${num}` as any;
                        return hasPermission(currentUser, editPerm) && (
                          <FormField 
                            key={num}
                            control={form.control} 
                            name={linkKey} 
                            render={({ field }) => ( 
                              <FormItem>
                                <FormLabel className={num === 1 ? 'text-[#1D41D5] text-base font-bold block mb-1.5' : 'text-base font-semibold block mb-1.5'}>
                                    {t(`docLink${num}` as any)}
                                </FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://..." {...field} className="h-12 text-base rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem> 
                            )} 
                          />
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Keywords and Tags Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {hasPermission(currentUser, 'canEditKeywords') && (
                  <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold block mb-1.5">{t('keywords')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('keywordsPlaceholder')} {...field} className="h-12 text-base rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      )}
                  />
                  )}

                  {hasPermission(currentUser, 'canEditTags') && <FormField control={form.control} name="docTags" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1D41D5] text-base font-semibold block mb-1.5">{t('tagsLabel')}</FormLabel>
                    <FormControl><Input placeholder="tag1, tag2, ..." {...field} className="h-12 text-base rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                  )} />}
              </div>
            </div>

            <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-4 mt-auto">
              <Button type="button" variant="outline" className="h-12 px-8 text-base font-bold shadow-sm" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                className="h-12 px-10 text-base font-bold bg-[#000066] hover:bg-[#000099] text-white shadow-lg transition-all active:scale-95"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
