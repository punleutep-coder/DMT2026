'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { db } from '@/lib/firebase'
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'

const formSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty.'),
})

interface EditNoteModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function EditNoteModal({ isOpen, onClose, docId }: EditNoteModalProps) {
  const { state, dispatch } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)
  const currentNote = docToUpdate?.history[docToUpdate.history.length - 1]?.note || ''

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: currentNote,
    },
    values: { // Use values to force re-render when currentNote changes
      note: currentNote,
    }
  })

  if (!docToUpdate || !docToUpdate.firestoreId) return null

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const now = new Date().toISOString();
    const newHistory = [...docToUpdate.history];
    const lastEntry = newHistory[newHistory.length - 1];
    if (lastEntry) {
        lastEntry.note = values.note;
    }

    const updatedFields: Partial<Document> = { 
        history: newHistory, 
        lastUpdate: now 
    };

    const newLog = { 
        docId, 
        oldStatus: docToUpdate.status, 
        newStatus: `Note Edited in ${docToUpdate.status}`, 
        user: state.currentUser!.username, 
        timestamp: now, 
        reason: values.note 
    };

    const docRef = doc(db, 'documents', docToUpdate.firestoreId);
    await updateDoc(docRef, updatedFields);
    await addDoc(collection(db, 'logs'), newLog);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Edit Note for {docToUpdate.id}</DialogTitle>
          <DialogDescription>Current Status: {docToUpdate.status}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Current Note</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
