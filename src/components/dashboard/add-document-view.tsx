'use client'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { Link as LinkIcon, Fingerprint, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Document } from '@/lib/types';
import { sanitizeFirebaseKey } from '@/lib/utils'
import { hasPermission, hasDepartmentPermission } from '@/lib/permissions'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Badge } from '../ui/badge'

const formSchema = z.object({
  id: z.string().min(1, 'Document ID is required.'),
  name: z.string().min(1, 'Document Name is required.'),
  documentType: z.string().min(1, 'Please select a document type.'),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  quinaryId: z.string().optional(),
  senaryId: z.string().optional(),
  septenaryId: z.string().optional(),
  octonaryId: z.string().optional(),
  nonaryId: z.string().optional(),
  denaryId: z.string().optional(),
  assignedDepartment: z.string().optional(),
  label: z.string().optional(),
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
  keywords: z.string().optional(),
  docTags: z.string().optional(),
  initialReceiver: z.string().min(1, 'Initial Receiver is required.'),
  initialNote: z.string().optional(),
})

type AddDocumentFormValues = z.infer<typeof formSchema>;

export default function AddDocumentView() {
  const { state, dispatch } = useAppContext()
  const { currentUser, documentTypes, assignedDepartments, departments, labels, users, receivers } = state
  const { toast } = useToast()
  const t = useTranslation()
  const [addAnother, setAddAnother] = useState(false)

  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      documentType: '',
      secondaryId: '',
      tertiaryId: '',
      quaternaryId: '',
      quinaryId: '',
      senaryId: '',
      septenaryId: '',
      octonaryId: '',
      nonaryId: '',
      denaryId: '',
      assignedDepartment: '',
      label: '',
      documentLink1: '',
      documentLink2: '',
      documentLink3: '',
      documentLink4: '',
      documentLink5: '',
      documentLink6: '',
      documentLink7: '',
      documentLink8: '',
      documentLink9: '',
      documentLink10: '',
      keywords: '',
      docTags: '',
      initialReceiver: '',
      initialNote: '',
    },
  })

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
        id: values.id,
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
    
    toast({ title: t('success'), description: "Document added successfully." });
    
    if (addAnother) {
        form.reset({
            ...form.getValues(),
            id: '',
            name: '',
            secondaryId: '',
            tertiaryId: '',
            quaternaryId: '',
            quinaryId: '',
            senaryId: '',
            septenaryId: '',
            octonaryId: '',
            nonaryId: '',
            denaryId: '',
            documentLink1: '',
            documentLink2: '',
            documentLink3: '',
            documentLink4: '',
            documentLink5: '',
            documentLink6: '',
            documentLink7: '',
            documentLink8: '',
            documentLink9: '',
            documentLink10: '',
            keywords: '',
            docTags: '',
            initialNote: '',
        });
        setAddAnother(false);
    } else {
        dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    }
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));
  
  const initialDepartment = state.departments.length > 0 ? state.departments[0] : null;
  const receiverOptions = useMemo(() => {
    if (!initialDepartment) return [];
    return receivers
      .filter(receiverName => {
        const matchingUser = users.find(u => u.username === receiverName);
        if (matchingUser) {
          return hasDepartmentPermission(matchingUser, initialDepartment);
        }
        return true;
      })
      .sort()
      .map(r => ({ value: r, label: r }));
  }, [receivers, users, initialDepartment]);


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
            <ArrowLeft className="h-5 w-5 text-[#000066]" />
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold font-rotanak text-[#000066]">{t('addNewDocument')}</h2>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-[#000066]/5 border-[#000066]/20 text-[#000066] font-bold">
          HTML Formulation Entry
        </Badge>
      </div>

      <div className="glassmorphic-card p-6 sm:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
              <div className="space-y-6">
                  {hasPermission(currentUser, 'canEditDocumentName') && 
                  <FormField 
                      control={form.control} 
                      name="name" 
                      render={({ field }) => ( 
                      <FormItem>
                          <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('docName')}</FormLabel>
                          <FormControl><Textarea {...field} className="min-h-[120px] sm:min-h-[150px] text-base sm:text-lg py-3" /></FormControl>
                          <FormMessage />
                      </FormItem> 
                      )} 
                  />
                  }
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {hasPermission(currentUser, 'canEditDocumentId') && (
                        <FormField 
                          control={form.control} 
                          name="id" 
                          render={({ field }) => ( 
                            <FormItem>
                              <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('docIdPrimary')}</FormLabel>
                              <FormControl><Input {...field} className="h-12 sm:h-14 text-base sm:text-lg" /></FormControl>
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
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('initialReceiver')}</FormLabel>
                            <Combobox
                              options={receiverOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t('selectReceiver')}
                              searchPlaceholder={t('searchReceiver')}
                              notFoundText={t('noReceiverFound')}
                              onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
                              className="h-12 sm:h-14 text-base sm:text-lg"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 sm:px-8 bg-white/30">
                <AccordionItem value="extra-ids" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-6 sm:py-8">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <Fingerprint className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
                      <span className="font-bold text-xl sm:text-2xl text-emerald-600 uppercase tracking-tight">{t('documentExtraIds')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-8 sm:pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
                                <FormControl><Input {...field} className="h-12 text-base sm:text-lg" /></FormControl>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {hasPermission(currentUser, 'canEditDocumentType') && (
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('documentType')}</FormLabel>
                            <Combobox
                              options={documentTypeOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t('selectDocType')}
                              searchPlaceholder={t('searchDocType')}
                              notFoundText={t('noDocTypeFound')}
                              className="h-12 sm:h-14 text-base sm:text-lg"
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
                            notFoundText={t('noAssignedDeptFound')}
                            onCreate={currentUser?.role === 'Admin' ? handleCreateAssignedDepartment : undefined}
                            className="h-12 sm:h-14 text-base sm:text-lg"
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
                                  className="h-12 sm:h-14 text-base sm:text-lg"
                              />
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  )}
              </div>

              <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 sm:px-8 bg-white/30">
                <AccordionItem value="links" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-6 sm:py-8">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <LinkIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                      <span className="font-bold text-xl sm:text-2xl text-blue-600 uppercase tracking-tight">{t('documentLinks')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-8 sm:pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const linkKey = `documentLink${num}` as keyof AddDocumentFormValues;
                        const editPerm = `canEditDocumentLink${num}` as any;
                        return hasPermission(currentUser, editPerm) && (
                          <FormField 
                            key={num}
                            control={form.control} 
                            name={linkKey} 
                            render={({ field }) => ( 
                              <FormItem>
                                <FormLabel className={num === 1 ? 'text-[#1D41D5] text-base font-bold block mb-1.5' : 'text-base font-semibold block mb-1.5'}>{t(`docLink${num}` as any)}</FormLabel>
                                <FormControl><Input type="url" placeholder="https://://" {...field} className="h-12 text-base sm:text-lg" /></FormControl>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {hasPermission(currentUser, 'canEditKeywords') && <FormField control={form.control} name="keywords" render={({ field }) => ( <FormItem><FormLabel className="text-base sm:text-lg font-bold block mb-1.5">{t('keywords')}</FormLabel><FormControl><Input placeholder={t('keywordsPlaceholder')} {...field} className="h-12 sm:h-14 text-base sm:text-lg" /></FormControl><FormMessage /></FormItem> )} />}
                  {hasPermission(currentUser, 'canEditTags') && <FormField control={form.control} name="docTags" render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('tagsLabel')}</FormLabel>
                      <FormControl><Input {...field} className="h-12 sm:h-14 text-base sm:text-lg" /></FormControl>
                      <FormMessage />
                  </FormItem>
                  )} />}
              </div>
              
              {hasPermission(currentUser, 'canEditInitialNote') && <FormField control={form.control} name="initialNote" render={({ field }) => ( <FormItem><FormLabel className="text-base sm:text-lg font-bold block mb-1.5">{t('initialNote')}</FormLabel><FormControl><Textarea {...field} className="min-h-[120px] sm:min-h-[150px] text-base sm:text-lg" /></FormControl><FormMessage /></FormItem> )} />}
            </div>

            <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-4 mt-auto">
              <Button type="button" variant="outline" className="h-12 sm:h-14 px-8 text-base font-bold shadow-sm" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                variant="outline"
                className="h-12 sm:h-14 px-8 text-base font-bold bg-white/50 shadow-sm" 
                onClick={() => setAddAnother(true)}
                disabled={!state.isInitialized}
              >
                {t('saveAndAddAnother')}
              </Button>
              <Button 
                type="submit" 
                className="h-12 sm:h-14 px-10 text-base font-bold bg-[#000066] hover:bg-[#000099] shadow-lg transition-all active:scale-95" 
                onClick={() => setAddAnother(false)}
                disabled={!state.isInitialized}
              >
                {t('addDocument')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
