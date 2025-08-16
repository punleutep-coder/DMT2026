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
import { db } from '@/lib/firebase'
import { doc, collection, writeBatch, getDocs, query, where, updateDoc } from 'firebase/firestore'

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
  const { state, dispatch } = useAppContext()
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

  if (!docToSplit || !docToSplit.firestoreId) return null;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const newDocIds = values.newDocuments.map(d => d.id);
    const existingDocsQuery = query(collection(db, 'documents'), where('id', 'in', newDocIds));
    const existingDocsSnapshot = await getDocs(existingDocsQuery);

    if (!existingDocsSnapshot.empty) {
        const existingIds = existingDocsSnapshot.docs.map(d => d.data().id);
        form.setError('newDocuments', { message: `The following IDs already exist: ${existingIds.join(', ')}` });
        return;
    }

    const now = new Date().toISOString();
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : 'N/A';
    
    const newDocs: Omit<Document, 'firestoreId'>[] = values.newDocuments.map(newDocData => ({
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
        releaseDateReached: false,
        justReleased: false,
        keywords: docToSplit.keywords,
        splitFrom: docId,
    }));
    
    const batch = writeBatch(db);

    // Update original document
    const originalDocRef = doc(db, 'documents', docToSplit.firestoreId);
    const splitHistory = docToSplit.splitHistory || [];
    splitHistory.push({ timestamp: now, splitTo: newDocIds });
    batch.update(originalDocRef, { status: 'Split', lastUpdate: now, splitHistory });

    const originalLogRef = doc(collection(db, 'logs'));
    batch.set(originalLogRef, { docId, oldStatus: docToSplit.status, newStatus: 'Split', user: state.currentUser!.username, timestamp: now, reason: `Split into: ${newDocIds.join(', ')}` });

    // Add new documents and their logs
    newDocs.forEach(nd => {
        const newDocRef = doc(collection(db, 'documents'));
        batch.set(newDocRef, nd);
        const newLogRef = doc(collection(db, 'logs'));
        batch.set(newLogRef, { docId: nd.id, oldStatus: 'N/A', newStatus: 'Created via Split', user: state.currentUser!.username, timestamp: now });
    });
    
    await batch.commit();
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
