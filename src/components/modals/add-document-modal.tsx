'use client'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { suggestTagsAction } from '@/app/actions/ai'
import { Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Document } from '@/lib/types';
import { sanitizeFirebaseKey } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  id: z.string().min(1, 'Document ID is required.'),
  name: z.string().min(1, 'Document Name is required.'),
  documentType: z.string().min(1, 'Please select a document type.'),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  assignedDepartment: z.string().optional(),
  label: z.string().optional(),
  documentLink1: z.string().url().optional().or(z.literal('')),
  documentLink2: z.string().url().optional().or(z.literal('')),
  documentLink3: z.string().url().optional().or(z.literal('')),
  documentLink4: z.string().url().optional().or(z.literal('')),
  keywords: z.string().optional(),
  docTags: z.string().optional(),
  initialReceiver: z.string().min(1, 'Initial Receiver is required.'),
  initialNote: z.string().optional(),
})

type AddDocumentFormValues = z.infer<typeof formSchema>;

interface AddDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddDocumentModal({ isOpen, onClose }: AddDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const { currentUser, documentTypes, assignedDepartments, departments, labels, users, receivers } = state
  const [isSuggesting, setIsSuggesting] = useState(false)
  const { toast } = useToast()
  const t = useTranslation()

  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      documentType: '',
      secondaryId: '',
      tertiaryId: '',
      quaternaryId: '',
      assignedDepartment: '',
      label: '',
      documentLink1: '',
      documentLink2: '',
      documentLink3: '',
      documentLink4: '',
      keywords: '',
      docTags: '',
      initialReceiver: '',
      initialNote: '',
    },
  })
  
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

  const handleCreateLabel = (labelName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can create new labels.", variant: "destructive" });
      return;
    }
    if (labels.some(l => l.toLowerCase() === labelName.toLowerCase())) {
        toast({ title: "Duplicate Label", description: "This label already exists.", variant: "destructive" });
        return;
    }
    
    const newLabels = [...labels, labelName];
    dispatch({ type: 'SET_LABELS', payload: newLabels });
    form.setValue('label', labelName);
    toast({ title: "Label Created", description: `"${labelName}" has been added.` });
  }

  const handleCreateReceiver = (receiverName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can create new receiver names.", variant: "destructive" });
      return;
    }
    
    if (receivers.some(r => r.toLowerCase() === receiverName.toLowerCase())) {
        toast({ title: "Duplicate Receiver", description: "This receiver name already exists.", variant: "destructive" });
        return;
    }
    
    const newReceivers = [...receivers, receiverName].sort();
    dispatch({ type: 'SET_RECEIVERS', payload: newReceivers });
    form.setValue('initialReceiver', receiverName);
    toast({ title: "Receiver Created", description: `"${receiverName}" has been added.` });
  }

  const onSubmit = async (values: AddDocumentFormValues) => {
    const sanitizedId = sanitizeFirebaseKey(values.id);
    if (state.documents.some(d => sanitizeFirebaseKey(d.id) === sanitizedId)) {
        form.setError('id', { message: 'This Document ID already exists.' });
        return;
    }
    
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : null
    if (!initialDepartment) {
        toast({
            title: 'Error: No Departments',
            description: 'Please define at least one department in "Manage Departments" before adding a document.',
            variant: 'destructive',
        })
        return;
    }

    const now = new Date().toISOString()
    const newDoc: Document = {
        id: values.id, // Store original ID, ensuring no duplicates.
        firestoreId: `doc-${Date.now()}`,
        name: values.name,
        documentType: values.documentType || null,
        label: values.label || null,
        status: initialDepartment,
        initialDepartment: initialDepartment,
        assignedDepartment: values.assignedDepartment || null,
        lastUpdate: now,
        secondaryId: values.secondaryId || null,
        tertiaryId: values.tertiaryId || null,
        quaternaryId: values.quaternaryId || null,
        documentLink: [values.documentLink1, values.documentLink2, values.documentLink3, values.documentLink4].filter(Boolean) as string[],
        history: [{ department: initialDepartment, start: now, end: null, receiver: values.initialReceiver, note: values.initialNote || '' }],
        tags: values.docTags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        isDelayed: false,
        releaseDate: null,
        releaseDateReached: false,
        justReleased: false,
        keywords: values.keywords || ''
    }

    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
    dispatch({ type: 'ADD_LOG', payload: { docId: newDoc.id, oldStatus: 'New', newStatus: initialDepartment, user: state.currentUser!.username, timestamp: now } });
    
    toast({ title: "Success", description: "Document added successfully." });
    onClose();
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));
  const receiverOptions = useMemo(() => {
    return receivers.sort().map(r => ({ value: r, label: r }));
  }, [receivers]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>{t('addNewDocument')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4">
                {hasPermission(currentUser, 'canEditDocumentName') && 
                  <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel style={{ color: '#1D41D5' }}>{t('docName')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem> 
                    )} 
                  />
                }
                {hasPermission(currentUser, 'canEditDocumentId') && <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel style={{ color: '#1D41D5' }}>{t('docIdPrimary')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasPermission(currentUser, 'canEditDocumentType') && (
                      <FormField
                          control={form.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel style={{ color: '#1D41D5' }}>{t('documentType')}</FormLabel>
                              <Combobox
                                options={documentTypeOptions}
                                value={field.value}
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
                    {hasPermission(currentUser, 'canEditSecondaryId') && <FormField control={form.control} name="secondaryId" render={({ field }) => ( <FormItem><FormLabel>{t('secondaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditTertiaryId') && <FormField control={form.control} name="tertiaryId" render={({ field }) => ( <FormItem><FormLabel>{t('tertiaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditQuaternaryId') && <FormField control={form.control} name="quaternaryId" render={({ field }) => ( <FormItem><FormLabel>{t('quaternaryId')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditAssignedDepartment') && (
                      <FormField
                        control={form.control}
                        name="assignedDepartment"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel style={{ color: '#1D41D5' }}>{t('assignedDepartment')}</FormLabel>
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
                    {hasPermission(currentUser, 'canEditLabel') && (
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel style={{ color: '#1D41D5' }}>{t('label')}</FormLabel>
                                <Combobox
                                    options={labelOptions}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder={t('selectLabel')}
                                    searchPlaceholder={t('searchLabel')}
                                    notFoundText={t('noLabelFound')}
                                    onCreate={currentUser?.role === 'Admin' ? handleCreateLabel : undefined}
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <FormField
                      control={form.control}
                      name="initialReceiver"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel style={{ color: '#1D41D5' }}>{t('initialReceiver')}</FormLabel>
                          <Combobox
                            options={receiverOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('selectReceiver')}
                            searchPlaceholder={t('searchReceiver')}
                            notFoundText={t('noReceiverFound')}
                            onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasPermission(currentUser, 'canEditDocumentLink1') && <FormField control={form.control} name="documentLink1" render={({ field }) => ( <FormItem><FormLabel style={{ color: '#1D41D5' }}>{t('docLink1')}</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink2') && <FormField control={form.control} name="documentLink2" render={({ field }) => ( <FormItem><FormLabel>{t('docLink2')}</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink3') && <FormField control={form.control} name="documentLink3" render={({ field }) => ( <FormItem><FormLabel>{t('docLink3')}</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink4') && <FormField control={form.control} name="documentLink4" render={({ field }) => ( <FormItem><FormLabel>{t('docLink4')}</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                </div>
                {hasPermission(currentUser, 'canEditKeywords') && <FormField control={form.control} name="keywords" render={({ field }) => ( <FormItem><FormLabel>{t('keywords')}</FormLabel><FormControl><Input placeholder={t('keywordsPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditTags') && <FormField control={form.control} name="docTags" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#1D41D5' }}>{t('tagsLabel')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} /></FormControl>
                      <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isSuggesting}>
                        <Sparkles className="mr-2 h-4 w-4" /> {isSuggesting ? t('suggesting') : t('suggest')}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />}
                {hasPermission(currentUser, 'canEditInitialNote') && <FormField control={form.control} name="initialNote" render={({ field }) => ( <FormItem><FormLabel>{t('initialNote')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit" disabled={!state.isInitialized}>{t('addDocument')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
