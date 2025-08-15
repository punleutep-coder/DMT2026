'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppContext } from '@/hooks/use-app-context'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const formSchema = z.object({
  releaseDate: z.date({
    required_error: "A release date is required.",
  }),
  note: z.string().optional(),
})

interface DelayDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function DelayDocumentModal({ isOpen, onClose, docId }: DelayDocumentModalProps) {
  const { state } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      releaseDate: undefined,
      note: '',
    },
  })

  if (!docToUpdate) return null

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!docToUpdate.firestoreId) {
        console.error("Document is missing Firestore ID");
        return;
    }
    const now = new Date().toISOString()
    const updatedFields = {
        isDelayed: true,
        releaseDate: values.releaseDate.toISOString(),
        lastUpdate: now,
    }

    const newLog = { 
        docId, 
        oldStatus: docToUpdate.status, 
        newStatus: 'Delayed', 
        user: state.currentUser!.username, 
        timestamp: now, 
        reason: `Delayed until ${format(values.releaseDate, 'PPP')}. Note: ${values.note}` 
    };

    try {
        const docRef = doc(db, "documents", docToUpdate.firestoreId);
        await updateDoc(docRef, updatedFields);
        await addDoc(collection(db, "logs"), newLog);
        onClose();
    } catch(error) {
        console.error("Error delaying document: ", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Delay Document: {docToUpdate.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="releaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Release Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea placeholder="Reason for delay..." {...field} /></FormControl><FormMessage /></FormItem> )} />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Delay Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
