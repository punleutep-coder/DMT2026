
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

const formSchema = z.object({
  documentType: z.string().optional(),
  label: z.string().optional(),
  assignedDepartment: z.string().optional(),
  keywords: z.string().optional(),
  docTags: z.string().optional(),
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
    },
  })

  const onSubmit = async (values: BulkEditFormValues) => {
    const now = new Date().toISOString();
    
    // Filter out fields that weren't filled in
    const updatesToApply: Partial<Document> = {};
    const changesDescription: string[] = [];

    if (values.documentType) {
        updatesToApply.documentType = values.documentType;
        changesDescription.push(`Document Type changed to "${values.documentType}"`);
    }
    if (values.label) {
        updatesToApply.label = values.label;
        changesDescription.push(`Label changed to "${values.label}"`);
    }
    if (values.assignedDepartment) {
        updatesToApply.assignedDepartment = values.assignedDepartment;
        changesDescription.push(`Assigned Department changed to "${values.assignedDepartment}"`);
    }
    if (values.keywords) {
        updatesToApply.keywords = values.keywords;
        changesDescription.push(`Keywords updated`);
    }
    if (values.docTags) {
        updatesToApply.tags = values.docTags.split(',').map(t => t.trim()).filter(Boolean);
        changesDescription.push(`Tags updated to: ${values.docTags}`);
    }

    if (Object.keys(updatesToApply).length === 0) {
        toast({ title: "No Changes", description: "Please fill in at least one field to update.", variant: "destructive" });
        return;
    }

    docsToUpdate.forEach(doc => {
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
    });

    toast({ title: "Success", description: `Updated ${docsToUpdate.length} documents.` });
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
    onClose();
  }

  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] glassmorphic-card p-4 sm:p-8 overflow-hidden">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-[20px] font-bold font-rotanak text-[#000066]">{t('bulkEdit')}</DialogTitle>
          <DialogDescription>
            {t('bulkEditDesc', { count: selectedDocIds.length })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[55vh] pr-6 -mr-6">
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-[#1D41D5] text-xl block">{t('documentType')}</FormLabel>
                            <Combobox
                            options={documentTypeOptions}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('selectDocType')}
                            searchPlaceholder={t('searchDocType')}
                            className="h-14 text-xl"
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
                            <FormLabel className="text-[#1D41D5] text-xl block">{t('label')}</FormLabel>
                            <Combobox
                                options={labelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectLabel')}
                                searchPlaceholder={t('searchLabel')}
                                className="h-14 text-xl"
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
                            <FormLabel className="text-[#1D41D5] text-xl block">{t('assignedDepartment')}</FormLabel>
                            <Combobox
                            options={assignedDepartmentOptions}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('selectAssignedDept')}
                            searchPlaceholder={t('searchAssignedDept')}
                            className="h-14 text-xl"
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
                            <FormLabel className="text-[#1D41D5] text-xl block">{t('keywords')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('keywordsPlaceholder')} {...field} className="h-14 text-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormField control={form.control} name="docTags" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[#1D41D5] text-xl block">{t('tagsLabel')}</FormLabel>
                        <FormControl><Input {...field} className="h-14 text-xl" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-10 gap-6">
              <Button type="button" variant="ghost" className="flex-1 h-14 text-xl" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit" className="flex-1 h-14 text-xl">{t('saveChanges')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
