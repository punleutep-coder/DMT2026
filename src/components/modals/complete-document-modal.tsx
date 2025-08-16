'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAppContext } from '@/hooks/use-app-context'

const formSchema = z.object({
  status: z.enum(['Completed (Success)', 'Completed (Unsuccess)'], {
    required_error: "You need to select a completion status."
  }),
  note: z.string().optional(),
})

interface CompleteDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function CompleteDocumentModal({ isOpen, onClose, docId }: CompleteDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Completed (Success)',
      note: '',
    },
  })

  if (!docToUpdate) return null

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const now = new Date().toISOString();
    const newHistory = [...docToUpdate.history];
    const lastEntry = newHistory[newHistory.length - 1];
    if (lastEntry) {
        lastEntry.end = now;
        if (values.note) {
            lastEntry.note = `${lastEntry.note || ''}\nCompletion Note: ${values.note}`.trim();
        }
    }

    const updatedFields = {
        id: docId,
        status: values.status,
        lastUpdate: now,
        history: newHistory,
    };

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ 
        type: 'ADD_LOG', 
        payload: {
            docId, 
            oldStatus: docToUpdate.status, 
            newStatus: values.status, 
            user: state.currentUser!.username, 
            timestamp: now, 
            reason: values.note 
        }
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Complete Document: {docToUpdate.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Completion Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Completed (Success)" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Success
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Completed (Unsuccess)" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Unsuccess
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Final Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Mark as Complete</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
