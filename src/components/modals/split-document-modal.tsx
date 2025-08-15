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
import { doc, writeBatch, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Document } from '@/lib/types'

const splitDocumentSchema = z.object({
    id: z.string().min(1, 'Document ID is required'),
    name: z.string().min(1, 'Document Name is required'),
});

const formSchema = z.object({
  newDocuments: z.array(splitDocumentSchema).min(1, 'At least one new document is required.'),
  note: z.string().optional(),
})

interface SplitDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function SplitDocumentModal({ isOpen, onClose, docId }: SplitDocumentModalProps) {
  const { state } = useAppContext()
  const docToSplit = state.documents.find(d => d.id === docId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocuments: [{ id: '', name: '' }],
      note: '',
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "newDocuments"
  });

  if (!docToSplit) return null;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const allDocIds = new Set(state.documents.map(d => d.id));
    const newDocIds = values.newDocuments.map(d => d.id);
    if (newDocIds.some(id => allDocIds.has(id))) {
        form.setError('newDocuments', { message: 'One or more new Document IDs already exist.' });
        return;
    }
     if (!docToSplit.firestoreId) {
        console.error("Document is missing Firestore ID");
        return;
    }

    const now = new Date().toISOString();
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : 'N/A';
    
    const newDocsData: Omit<Document, 'firestoreId'>[] = values.newDocuments.map(newDocData => ({
        id: newDocData.id,
        name: newDocData.name,
        office: docToSplit.office,
        status: initialDepartment,
        initialDepartment: initialDepartment,
        assignedDepartment: docToSplit.assignedDepartment,
        lastUpdate: now,
        secondaryId: null,
        tertiaryId: null,
        quaternaryId: null,
        documentLink: [] as string[],
        history: [{ department: initialDepartment, start: now, end: null, receiver: state.currentUser!.username, note: `Split from ${docId}. ${values.note || ''}` }],
        tags: [...docToSplit.tags],
        isDelayed: false,
        releaseDate: null,
        keywords: docToSplit.keywords,
        splitFrom: docId,
    }));
    
    try {
        const batch = writeBatch(db);

        // Update the original document
        const originalDocRef = doc(db, "documents", docToSplit.firestoreId);
        const splitHistory = docToSplit.splitHistory || [];
        splitHistory.push({ timestamp: now, splitTo: newDocIds });
        batch.update(originalDocRef, { status: 'Split', lastUpdate: now, splitHistory });

        // Add log for splitting the original document
        const originalDocLog = {
            docId, oldStatus: docToSplit.status, newStatus: 'Split', user: state.currentUser!.username, timestamp: now, reason: `Split into: ${newDocIds.join(', ')}`
        };
        const logRef1 = doc(collection(db, 'logs'));
        batch.set(logRef1, originalDocLog);
        
        // Add new documents and their logs
        newDocsData.forEach(nd => {
            const newDocRef = doc(collection(db, "documents"));
            batch.set(newDocRef, nd);
            
            const newDocLog = { docId: nd.id, oldStatus: 'N/A', newStatus: 'Created via Split', user: state.currentUser!.username, timestamp: now };
            const logRef2 = doc(collection(db, 'logs'));
            batch.set(logRef2, newDocLog);
        });
        
        await batch.commit();
        onClose();
    } catch(error) {
        console.error("Error splitting document: ", error);
    }
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
                        <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                                <FormField control={form.control} name={`newDocuments.${index}.id`} render={({ field }) => ( <FormItem><FormLabel>New Document ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name={`newDocuments.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>New Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="mt-6">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({id: '', name: ''})} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Document
                    </Button>
                    {form.formState.errors.newDocuments && <p className="text-sm font-medium text-destructive">{form.formState.errors.newDocuments.message}</p>}
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
