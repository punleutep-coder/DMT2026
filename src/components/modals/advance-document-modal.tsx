'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'

const formSchema = z.object({
  nextDepartment: z.string().min(1, 'Please select a department.'),
  receiver: z.string().min(1, 'Receiver name is required.'),
  note: z.string().optional(),
})

interface AdvanceDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function AdvanceDocumentModal({ isOpen, onClose, docId }: AdvanceDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const doc = state.documents.find(d => d.id === docId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nextDepartment: '',
      receiver: '',
      note: '',
    },
  })

  if (!doc) return null

  const currentDeptIndex = state.departments.indexOf(doc.status)
  const availableNextDepts = state.departments.slice(currentDeptIndex + 1)

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const now = new Date().toISOString()
    
    const newHistory = [...doc.history]
    const lastEntry = newHistory[newHistory.length - 1]
    if (lastEntry) {
      lastEntry.end = now
    }
    newHistory.push({ department: values.nextDepartment, start: now, end: null, receiver: values.receiver, note: values.note || '' })
    
    const updatedFields: Partial<Document> = {
      id: doc.id,
      status: values.nextDepartment,
      lastUpdate: now,
      history: newHistory,
    }

    const newLog = { docId, oldStatus: doc.status, newStatus: values.nextDepartment, user: state.currentUser!.username, timestamp: now };

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({type: 'ADD_LOG', payload: newLog });

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Advance Document: {doc.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nextDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select next department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableNextDepts.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="receiver" render={({ field }) => ( <FormItem><FormLabel>Receiver Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Advance</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
