'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { PlusCircle, Trash, ChevronLeft, Scissors, Save, X } from 'lucide-react'
import type { Document } from '@/lib/types'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'

const splitDocumentSchema = z.object({
    id: z.string().min(1, 'Document ID is required'),
    name: z.string().min(1, 'Document Name is required'),
    documentType: z.string().optional(),
});

const formSchema = z.object({
  newDocuments: z.array(splitDocumentSchema).min(1, 'At least one new document is required.'),
  note: z.string().optional(),
})

type SplitDocumentFormValues = z.infer<typeof formSchema>;

export default function SplitDocumentView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
  const docToSplit = state.documents.find(d => d.id === docId);
  const t = useTranslation();

  const form = useForm<SplitDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocuments: [{ id: '', name: '', documentType: docToSplit?.documentType || '' }],
      note: '',
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "newDocuments"
  });

  if (!docToSplit) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document you are trying to split could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

  const documentTypeOptions = state.documentTypes.map(type => ({ value: type, label: type }));

  const onSubmit = async (values: SplitDocumentFormValues) => {
    const newDocIds = values.newDocuments.map(d => d.id);
    const existingIds = newDocIds.filter(id => state.documents.some(d => d.id === id));

    if (existingIds.length > 0) {
        form.setError('newDocuments', { message: `The following IDs already exist: ${existingIds.join(', ')}` });
        return;
    }

    const now = new Date().toISOString();
    const currentDepartment = docToSplit.status;
    
    const sourceLinks = Array.isArray(docToSplit.documentLink) ? [...docToSplit.documentLink] : [];
    const sourceTags = Array.isArray(docToSplit.tags) ? [...docToSplit.tags] : [];

    const newDocs: Document[] = values.newDocuments.map(newDocData => ({
        id: newDocData.id,
        firestoreId: `doc-${Date.now()}-${newDocData.id}`,
        name: newDocData.name,
        documentType: newDocData.documentType || null,
        label: docToSplit.label,
        status: currentDepartment,
        initialDepartment: currentDepartment,
        assignedDepartment: docToSplit.assignedDepartment,
        lastUpdate: now,
        secondaryId: null,
        tertiaryId: null,
        quaternaryId: null,
        documentLink: sourceLinks,
        history: [{ department: currentDepartment, start: now, end: null, receiver: state.currentUser!.username, note: `Split from ${docId}. ${values.note || ''}` }],
        tags: sourceTags,
        isDelayed: false,
        releaseDate: null,
        releaseDateReached: false,
        justReleased: false,
        keywords: docToSplit.keywords,
        splitFrom: docId,
    }));
    
    const splitHistory = docToSplit.splitHistory || [];
    splitHistory.push({ timestamp: now, splitTo: newDocIds });
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: docToSplit.id, status: 'Split', lastUpdate: now, splitHistory } });
    dispatch({ type: 'ADD_LOG', payload: { docId: docToSplit.id, oldStatus: docToSplit.status, newStatus: 'Split', user: state.currentUser!.username, timestamp: now, reason: `Split into: ${newDocIds.join(', ')}` } });

    newDocs.forEach(nd => {
        dispatch({ type: 'ADD_DOCUMENT', payload: nd });
        dispatch({ type: 'ADD_LOG', payload: { docId: nd.id, oldStatus: 'N/A', newStatus: `Created via Split at ${currentDepartment}`, user: state.currentUser!.username, timestamp: now, reason: `Split from: ${docId}` } });
    });
    
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#000066]">{t('splitDocument' as any)}: <span className="text-destructive">{docToSplit.id}</span></h2>
        </div>
      </div>

      <div className="glassmorphic-card p-6 sm:p-10 space-y-8">
        <div className="bg-[#000066]/5 p-6 rounded-2xl border border-[#000066]/10">
             <p className="text-[#000066]/60 text-xs uppercase font-bold tracking-widest mb-1.5">Original Document</p>
             <p className="text-xl sm:text-2xl font-bold text-[#000066]">{docToSplit.name}</p>
             <p className="text-sm font-medium text-emerald-600 mt-1">Currently at: {docToSplit.status}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold text-[#000066] uppercase tracking-tight">{t('newDocuments' as any)}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({id: '', name: '', documentType: docToSplit.documentType || ''})} className="rounded-xl gap-2 font-bold shadow-sm">
                        <PlusCircle className="h-4 w-4" /> {t('addNewDocument' as any)}
                    </Button>
                </div>

                <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-6 border border-[#000066]/10 rounded-2xl relative bg-white/20 group hover:border-[#000066]/30 transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField 
                                control={form.control} 
                                name={`newDocuments.${index}.id`} 
                                render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('docId' as any)}</FormLabel>
                                        <FormControl><Input {...field} className="h-12 text-base rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} 
                            />
                            <FormField 
                                control={form.control} 
                                name={`newDocuments.${index}.name`} 
                                render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('docName' as any)}</FormLabel>
                                        <FormControl><Input {...field} className="h-12 text-base rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} 
                            />
                            <FormField
                              control={form.control}
                              name={`newDocuments.${index}.documentType`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('documentType' as any)}</FormLabel>
                                  <Combobox
                                    options={documentTypeOptions}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder={t('selectDocType')}
                                    searchPlaceholder={t('searchDocType')}
                                    notFoundText={t('noDocTypeFound')}
                                    className="h-12 text-base rounded-xl"
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md border text-destructive hover:bg-destructive/10 transition-colors">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
                </div>
            </div>

            <FormField 
                control={form.control} 
                name="note" 
                render={({ field }) => ( 
                    <FormItem>
                        <FormLabel className="text-[#1D41D5] text-base font-bold block mb-1.5">{t('noteForSplit' as any)}</FormLabel>
                        <FormControl><Textarea placeholder={t('splitNotePlaceholder' as any)} {...field} className="min-h-[100px] text-base rounded-xl py-3" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} 
            />

            <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-4 mt-auto">
              <Button type="button" variant="outline" className="h-12 px-8 text-base font-bold shadow-sm" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                className="h-12 px-10 text-base font-bold bg-[#000066] hover:bg-[#000099] text-white shadow-lg transition-all active:scale-95"
              >
                {t('splitDocument' as any)}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
