'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Combobox } from '../ui/combobox'
import { useTranslation } from '@/lib/i18n'
import { Link as LinkIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

interface BulkEditDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkEditDetailsModal({ isOpen, onClose }: BulkEditDetailsModalProps) {
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

        // Handle Links - We merge provided links with existing ones
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
        toast({ title: "Success", description: `Updated ${totalUpdated} documents.` });
        dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
        onClose();
    } else {
        toast({ title: "No Changes", description: "Please fill in at least one field to update.", variant: "destructive" });
    }
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-lg:w-screen max-lg:h-screen max-lg:max-w-none max-lg:max-h-none max-lg:top-0 max-lg:left-0 max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none lg:w-[80vw] lg:max-w-6xl lg:h-[80vh] glassmorphic-card p-4 sm:p-8 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="mb-4 flex-none">
          <DialogTitle className="text-sm font-bold font-rotanak text-[#000066]">{t('bulkEdit')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t('bulkEditDesc', { count: selectedDocIds.length })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-6 -mr-6">
              <div className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-sm block">{t('documentType')}</FormLabel>
                            <Combobox
                            options={documentTypeOptions}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('selectDocType')}
                            searchPlaceholder={t('searchDocType')}
                            className="h-10 text-sm"
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
                            <FormLabel className="text-[#1D41D5] text-sm block">{t('label')}</FormLabel>
                            <Combobox
                                options={labelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectLabel')}
                                searchPlaceholder={t('searchLabel')}
                                className="h-10 text-sm"
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
                            <FormLabel className="text-[#1D41D5] text-sm block">{t('assignedDepartment')}</FormLabel>
                            <Combobox
                            options={assignedDepartmentOptions}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('selectAssignedDept')}
                            searchPlaceholder={t('searchAssignedDept')}
                            className="h-10 text-sm"
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-sm block">{t('keywords')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('keywordsPlaceholder')} {...field} className="h-10 text-sm" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <Accordion type="single" collapsible className="w-full border rounded-lg px-4 bg-white/30">
                  <AccordionItem value="links" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-sm text-blue-600">{t('documentLinks')}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const linkKey = `documentLink${num}` as keyof BulkEditFormValues;
                          return (
                            <FormField 
                              key={num}
                              control={form.control} 
                              name={linkKey} 
                              render={({ field }) => ( 
                                <FormItem>
                                  <FormLabel className="text-sm block">{t(`docLink${num}` as any)}</FormLabel>
                                  <FormControl><Input type="url" placeholder="https://://" {...field} className="h-10 text-sm" /></FormControl>
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

                <FormField control={form.control} name="docTags" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[#1D41D5] text-sm block">{t('tagsLabel')}</FormLabel>
                        <FormControl><Input {...field} className="h-10 text-sm" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 flex-none gap-4">
              <Button type="button" variant="ghost" className="flex-1 h-10 text-sm" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit" className="flex-1 h-10 text-sm">{t('saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
