'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, ChevronLeft, Merge, Save, X, PlusCircle, User, ListChecks } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'
import { Combobox } from '../ui/combobox'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  newDocId: z.string().min(1, 'New Document ID is required.'),
  newDocName: z.string().min(1, 'New Document Name is required.'),
  documentType: z.string().min(1, 'Document type is required.'),
  assignedDepartment: z.string().optional(),
  label: z.string().optional(),
  targetDepartment: z.string().min(1, 'Please select a target department.'),
  receiverName: z.string().min(1, 'Receiver name is required.'),
  customDate: z.date().optional(),
  note: z.string().optional(),
})

export default function CombineDocumentsView() {
  const { state, dispatch } = useAppContext()
  const { selectedDocIds, departments, currentUser, documentTypes, assignedDepartments, labels } = state
  const { toast } = useToast()
  const t = useTranslation()
  const docsToCombine = state.documents.filter((d) =>
    selectedDocIds.includes(d.id)
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocId: '',
      newDocName: '',
      documentType: '',
      assignedDepartment: '',
      label: '',
      targetDepartment: '',
      receiverName: '',
      customDate: undefined,
      note: '',
    },
  })

  if (docsToCombine.length < 2) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Insufficient Documents</h2>
        <p className="text-muted-foreground mb-6">At least two documents must be selected to combine them.</p>
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (state.documents.some(d => d.id === values.newDocId)) {
        form.setError('newDocId', { message: 'This Document ID already exists.' });
        return;
    }

    const now = new Date()
    const startDate = values.customDate ? values.customDate.toISOString() : now.toISOString()

    const allTags = new Set<string>()
    const allKeywords = new Set<string>()
    const allLinks = new Set<string>()

    docsToCombine.forEach(doc => {
      doc.tags?.forEach(tag => allTags.add(tag));
      doc.documentLink?.forEach(link => allLinks.add(link));

      const fieldsToAggregate = [
        doc.name,
        doc.keywords,
        doc.label,
        doc.assignedDepartment,
        doc.secondaryId,
        doc.tertiaryId,
        doc.quaternaryId,
        doc.quinaryId,
        doc.senaryId,
        doc.septenaryId,
        doc.octonaryId,
        doc.nonaryId,
        doc.denaryId,
      ];

      fieldsToAggregate.forEach(field => {
        if(field) {
            field.split(/[\s,]+/).forEach(part => part && allKeywords.add(part.trim()));
        }
      });
    });

    const newDoc: Document = {
      id: values.newDocId,
      firestoreId: `doc-${Date.now()}`,
      name: values.newDocName,
      documentType: values.documentType,
      label: values.label || null,
      status: values.targetDepartment,
      initialDepartment: values.targetDepartment,
      assignedDepartment: values.assignedDepartment || null,
      lastUpdate: now.toISOString(),
      secondaryId: null,
      tertiaryId: null,
      quaternaryId: null,
      documentLink: Array.from(allLinks),
      history: [
        {
          department: values.targetDepartment,
          start: startDate,
          end: null,
          receiver: values.receiverName,
          note:
            values.note || `Combined from ${selectedDocIds.join(', ')}`,
        },
      ],
      tags: Array.from(allTags),
      isDelayed: false,
      releaseDate: null,
      releaseDateReached: false,
      justReleased: false,
      keywords: Array.from(allKeywords).join(' '),
      combinedFrom: selectedDocIds,
    }

    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
    dispatch({
        type: 'ADD_LOG',
        payload: {
            docId: newDoc.id,
            oldStatus: 'N/A',
            newStatus: 'Created via Combination',
            user: currentUser!.username,
            timestamp: now.toISOString(),
        }
    });

    docsToCombine.forEach(doc => {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: doc.id, status: 'Combined', lastUpdate: now.toISOString() } });
        dispatch({
            type: 'ADD_LOG',
            payload: {
                docId: doc.id,
                oldStatus: doc.status,
                newStatus: 'Combined',
                user: currentUser!.username,
                timestamp: now.toISOString(),
            }
        });
    });
    
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] })
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' })
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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#000066]">{t('combineDocuments' as any)}</h2>
        </div>
      </div>

      <div className="glassmorphic-card p-6 sm:p-10 space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#000066] uppercase tracking-tight">{t('documentsToCombine' as any)}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docsToCombine.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl bg-[#000066]/5 border border-[#000066]/10 shadow-sm flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-[#000066]">{d.id}</span>
                        <span className="text-sm font-medium truncate text-gray-700">{d.name}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="h-px bg-gray-100" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <FormField control={form.control} name="newDocId" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('docId' as any)} (Primary)</FormLabel>
                            <FormControl><Input {...field} className="h-12 text-base rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )} />
                    <FormField control={form.control} name="newDocName" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('docName' as any)}</FormLabel>
                            <FormControl><Input {...field} className="h-12 text-base rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )} />
                    
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('documentType' as any)}</FormLabel>
                            <Combobox
                            options={documentTypeOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('selectDocType')}
                            searchPlaceholder={t('searchDocType')}
                            className="h-12 text-base rounded-xl"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('label' as any)}</FormLabel>
                            <Combobox
                                options={labelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectLabel')}
                                searchPlaceholder={t('searchLabel')}
                                onCreate={currentUser?.role === 'Admin' ? handleCreateLabel : undefined}
                                className="h-12 text-base rounded-xl"
                            />
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="assignedDepartment"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('assignedDepartment' as any)}</FormLabel>
                            <Combobox
                                options={assignedDepartmentOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectAssignedDept')}
                                searchPlaceholder={t('searchAssignedDept')}
                                onCreate={currentUser?.role === 'Admin' ? handleCreateAssignedDepartment : undefined}
                                className="h-12 text-base rounded-xl"
                            />
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField control={form.control} name="targetDepartment" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('targetDepartment' as any)}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-12 text-base rounded-xl">
                                <SelectValue placeholder={t('selectTargetDept' as any)} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField control={form.control} name="receiverName" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('receiverName' as any)}</FormLabel>
                            <FormControl>
                                <Input {...field} className="h-12 text-base rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem> 
                    )} />

                    <FormField
                        control={form.control}
                        name="customDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('customDate' as any)}</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'h-12 text-left text-base rounded-xl',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, 'PPP')
                                    ) : (
                                    <span>{t('pickDate' as any)}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormField control={form.control} name="note" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('note' as any)}</FormLabel>
                        <FormControl><Textarea placeholder={t('notePlaceholder' as any)} {...field} className="min-h-[100px] text-base rounded-xl py-3" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
            </div>

            <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-4 mt-auto">
              <Button type="button" variant="outline" className="h-12 px-8 text-base font-bold shadow-sm" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                className="h-12 px-10 text-base font-bold bg-[#000066] hover:bg-[#000099] text-white shadow-lg transition-all active:scale-95"
              >
                {t('combineDocuments' as any)}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
