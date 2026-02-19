'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { PlusCircle, Trash } from 'lucide-react'
import type { Document } from '@/lib/types'
import { Combobox } from '../ui/combobox'

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

interface SplitDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
}

export default function SplitDocumentModal({ isOpen, onClose, docId, firestoreId }: SplitDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const docToSplit = state.documents.find(d => d.id === docId);

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

  if (!docToSplit) return null;

  const documentTypeOptions = state.documentTypes.map(type => ({ value: type, label: type }));

  const onSubmit = async (values: SplitDocumentFormValues) => {
    const newDocIds = values.newDocuments.map(d => d.id);
    const existingIds = newDocIds.filter(id => state.documents.some(d => d.id === id));

    if (existingIds.length > 0) {
        form.setError('newDocuments', { message: `The following IDs already exist: ${existingIds.join(', ')}` });
        return;
    }

    const now = new Date().toISOString();
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : 'N/A';
    
    const newDocs: Document[] = values.newDocuments.map(newDocData => ({
        id: newDocData.id,
        firestoreId: `doc-${Date.now()}-${newDocData.id}`,
        name: newDocData.name,
        documentType: newDocData.documentType || null,
        label: docToSplit.label,
        status: initialDepartment,
        initialDepartment: initialDepartment,
        assignedDepartment: docToSplit.assignedDepartment,
        lastUpdate: now,
        secondaryId: null,
        tertiaryId: null,
        quaternaryId: null,
        documentLink: [] as string[],
        history: [{ department: initialDepartment, start: now, end: null, receiver: state.currentUser!.username, note: `Split from ${docId}. ${values.note || ''}` }],
        tags: Array.isArray(docToSplit.tags) ? [...docToSplit.tags] : [],
        isDelayed: false,
        releaseDate: null,
        releaseDateReached: false,
        justReleased: false,
        keywords: docToSplit.keywords,
        splitFrom: docId,
    }));
    
    // Update original document
    const splitHistory = docToSplit.splitHistory || [];
    splitHistory.push({ timestamp: now, splitTo: newDocIds });
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: docId, status: 'Split', lastUpdate: now, splitHistory } });
    dispatch({ type: 'ADD_LOG', payload: { docId, oldStatus: docToSplit.status, newStatus: 'Split', user: state.currentUser!.username, timestamp: now, reason: `Split into: ${newDocIds.join(', ')}` } });

    // Add new documents and their logs
    newDocs.forEach(nd => {
        dispatch({ type: 'ADD_DOCUMENT', payload: nd });
        dispatch({ type: 'ADD_LOG', payload: { docId: nd.id, oldStatus: 'N/A', newStatus: 'Created via Split', user: state.currentUser!.username, timestamp: now, reason: `Split from: ${docId}` } });
    });
    
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Split Document</DialogTitle>
          <DialogDescription>Splitting document: {docToSplit.id} - {docToSplit.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-2">New Documents</h3>
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative bg-background/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
                                <FormField control={form.control} name={`newDocuments.${index}.id`} render={({ field }) => ( <FormItem><FormLabel>New Document ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name={`newDocuments.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>New Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField
                                  control={form.control}
                                  name={`newDocuments.${index}.documentType`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Document Type</FormLabel>
                                      <Combobox
                                        options={documentTypeOptions}
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Select a document type..."
                                        searchPlaceholder="Search types..."
                                        notFoundText="No matching type found."
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-1 right-1">
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({id: '', name: '', documentType: docToSplit.documentType || ''})} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Document
                    </Button>
                    {form.formState.errors.newDocuments?.message && <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.newDocuments.message}</p>}
                </div>
                <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Note for Split</FormLabel><FormControl><Textarea placeholder="This note will be added to all new documents." {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Split Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
