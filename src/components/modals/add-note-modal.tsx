
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

const formSchema = z.object({
  newNote: z.string().min(1, 'Note cannot be empty.'),
})

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
}

export default function AddNoteModal({ isOpen, onClose, docId, firestoreId }: AddNoteModalProps) {
  const { state, dispatch } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newNote: '',
    },
  })

  if (!docToUpdate) return null

  const currentNote = docToUpdate?.history[docToUpdate.history.length - 1]?.note || ''

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const now = new Date().toISOString();
    const newHistory = [...docToUpdate.history];
    const lastEntry = newHistory[newHistory.length - 1];
    
    if (lastEntry) {
        const appendedNote = currentNote ? `${currentNote}\n--- (new note) ---\n${values.newNote}` : values.newNote;
        lastEntry.note = appendedNote;
    }

    const updatedFields: Partial<Document> & {id: string} = { 
        id: docId,
        history: newHistory, 
        lastUpdate: now 
    };

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ 
        type: 'ADD_LOG', 
        payload: {
            docId, 
            oldStatus: docToUpdate.status, 
            newStatus: `Note Added in ${docToUpdate.status}`, 
            user: state.currentUser!.username, 
            timestamp: now, 
            reason: `New note added: ${values.newNote}` 
        }
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Add Note for {docToUpdate.id}</DialogTitle>
          <DialogDescription>Current Status: {docToUpdate.status}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-64 overflow-y-auto rounded-md border bg-muted/50 p-4">
            <h4 className="font-semibold">Current Note</h4>
            <p className="text-sm whitespace-pre-wrap">{currentNote || 'No existing note.'}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="newNote" render={({ field }) => ( <FormItem><FormLabel>New Note to Add</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
