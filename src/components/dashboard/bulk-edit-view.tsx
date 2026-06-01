'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'
import { Link as LinkIcon, ChevronLeft, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  documentType: z.string().optional(),
  label: z.string().optional(),
  assignedDepartment: z.string().optional(),
  keywords: z.string().optional(),
  docTags: z.string().optional(),
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
})

type BulkEditFormValues = z.infer<typeof formSchema>;

export default function BulkEditView() {
  const { state, dispatch } = useAppContext()
  const { currentUser, documentTypes, assignedDepartments, labels, selectedDocIds, documents } = state
  const { toast } = useToast()
  const t = useTranslation()

  const docsToUpdate = documents.filter(d => selectedDocIds.includes(d.id));

  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: '',
      label: '',
      assignedDepartment: '',
      keywords: '',
      docTags: '',
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
    },
  })

  const onSubmit = async (values: BulkEditFormValues) => {
    const now = new Date().toISOString();
    let totalUpdated = 0;

    docsToUpdate.forEach(doc => {
        const updatesToApply: Partial<Document> = {};
        const changesDescription: string[] = [];

        if (values.documentType) {
            updatesToApply.documentType = values.documentType;
            changesDescription.push(`Type: ${values.documentType}`);
        }
        if (values.label) {
            updatesToApply.label = values.label;
            changesDescription.push(`Label: ${values.label}`);
        }
        if (values.assignedDepartment) {
            updatesToApply.assignedDepartment = values.assignedDepartment;
            changesDescription.push(`Assigned Dept: ${values.assignedDepartment}`);
        }
        if (values.keywords) {
            updatesToApply.keywords = values.keywords;
            changesDescription.push(`Keywords updated`);
        }
        if (values.docTags) {
            updatesToApply.tags = values.docTags.split(',').map(t => t.trim()).filter(Boolean);
            changesDescription.push(`Tags updated`);
        }

        const currentLinks = Array.isArray(doc.documentLink) ? [...doc.documentLink] : new Array(10).fill('');
        let linksChanged = false;
        for (let i = 1; i <= 10; i++) {
            const linkVal = (values as any)[`documentLink${i}`];
            if (linkVal !== undefined && linkVal !== '') {
                currentLinks[i - 1] = linkVal;
                linksChanged = true;
            }
        }
        if (linksChanged) {
            updatesToApply.documentLink = currentLinks;
            changesDescription.push(`Links updated`);
        }

        if (Object.keys(updatesToApply).length > 0) {
            dispatch({
                type: 'UPDATE_DOCUMENT',
                payload: { ...updatesToApply, id: doc.id, lastUpdate: now }
            });
            dispatch({
                type: 'ADD_LOG',
                payload: {
                    docId: doc.id,
                    oldStatus: doc.status,
                    newStatus: 'Bulk Edit',
                    user: currentUser!.username,
                    timestamp: now,
                    reason: `Bulk Update: ${changesDescription.join(', ')}`
                }
            });
            totalUpdated++;
        }
    });

    if (totalUpdated > 0) {
        toast({ title: t('success'), description: `Updated ${totalUpdated} documents.` });
        dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
        dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    } else {
        toast({ title: t('noChanges' as any), description: t('fillAtLeastOneField' as any), variant: "destructive" });
    }
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));

  if (docsToUpdate.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">No Documents Selected</h2>
        <p className="text-muted-foreground mb-6">Please select one or more documents to bulk edit.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/20 bg-white/40 sticky top-0 z-10">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="rounded-full hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight truncate">
            {t('bulkEdit')}: <span className="text-destructive">{docsToUpdate.length} {t('results' as any)}</span>
          </h2>
        </div>
        <div className="flex gap-2">
            <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{t('saveChanges')}</span>
            </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white/10">
          <ScrollArea className="flex-1">
            <div className="p-6 sm:p-12 max-w-5xl mx-auto w-full space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('documentType')}</FormLabel>
                            <Combobox
                                options={documentTypeOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectDocType')}
                                searchPlaceholder={t('searchDocType')}
                                className="h-14 text-lg font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('label')}</FormLabel>
                            <Combobox
                                options={labelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectLabel')}
                                searchPlaceholder={t('searchLabel')}
                                className="h-14 text-lg font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6"
                            />
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="assignedDepartment"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('assignedDepartment')}</FormLabel>
                            <Combobox
                                options={assignedDepartmentOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectAssignedDept')}
                                searchPlaceholder={t('searchAssignedDept')}
                                className="h-14 text-lg font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('keywords')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('keywordsPlaceholder')} {...field} className="h-14 text-lg font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-8 p-10 bg-white/30 rounded-[3rem] border border-white/20">
                    <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-black text-primary uppercase">
                            {t('documentLinks')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const linkKey = `documentLink${num}` as keyof BulkEditFormValues;
                            return (
                                <FormField 
                                    key={num}
                                    control={form.control} 
                                    name={linkKey} 
                                    render={({ field }) => ( 
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">{t(`docLink${num}` as any)}</FormLabel>
                                            <FormControl>
                                                <Input type="url" placeholder="https://://" {...field} className="h-12 text-base font-bold rounded-xl bg-white/50 border-white/30 shadow-sm transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} 
                                />
                            );
                        })}
                    </div>
                </div>

                <FormField control={form.control} name="docTags" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('tagsLabel')}</FormLabel>
                        <FormControl>
                            <Input {...field} className="h-14 text-lg font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6" placeholder="tag1, tag2, tag3" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
          </ScrollArea>
          
          <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-6 sm:px-10 font-bold">
                  {t('cancel')}
              </Button>
              <Button type="button" onClick={form.handleSubmit(onSubmit)} className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex gap-3">
                  <Save className="h-5 w-5" />
                  {t('saveChanges')} {docsToUpdate.length} Docs
              </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
