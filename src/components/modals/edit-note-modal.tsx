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
  note: z.string().min(1, 'Note cannot be empty.'),
})

interface EditNoteModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function EditNoteModal({ isOpen, onClose, docId }: EditNoteModalProps) {
  const { state, dispatch } = useAppContext()
  const doc = state.documents.find(d => d.id === docId)
  const currentNote = doc?.history[doc.history.length - 1]?.note || ''

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: currentNote,
    },
  })

  if (!doc) return null

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const now = new Date().toISOString()
    const updatedDocs = state.documents.map(d => {
      if (d.id === docId) {
        const newHistory = [...d.history]
        const lastEntry = newHistory[newHistory.length - 1]
        if (lastEntry) {
          lastEntry.note = values.note
        }
        return { ...d, history: newHistory, lastUpdate: now } as Document
      }
      return d
    })

    dispatch({ type: 'UPDATE_DOCUMENTS', payload: updatedDocs })
    dispatch({ type: 'UPDATE_LOGS', payload: [{ docId, oldStatus: doc.status, newStatus: `Note Edited in ${doc.status}`, user: state.currentUser!.username, timestamp: now, reason: values.note }, ...state.logs] })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Edit Note for {doc.id}</DialogTitle>
          <DialogDescription>Current Status: {doc.status}</DialogDescription>
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
