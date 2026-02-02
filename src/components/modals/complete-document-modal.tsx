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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  status: z.enum(['Completed (Success)', 'Completed (Unsuccess)'], {
    required_error: "You need to select a completion status."
  }),
  note: z.string().optional(),
  customDate: z.date().optional(),
})

type CompleteDocumentFormValues = z.infer<typeof formSchema>

interface CompleteDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
}

export default function CompleteDocumentModal({ isOpen, onClose, docId, firestoreId }: CompleteDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const docToUpdate = state.documents.find(d => d.id === docId)
  const t = useTranslation()

  const form = useForm<CompleteDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Completed (Success)',
      note: '',
      customDate: undefined,
    },
  })

  if (!docToUpdate) return null

  const onSubmit = async (values: CompleteDocumentFormValues) => {
    const now = values.customDate ? values.customDate.toISOString() : new Date().toISOString();
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
          <DialogTitle>{t('completeDocument')}: {docToUpdate.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('completionStatus')}</FormLabel>
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
                          {t('success')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Completed (Unsuccess)" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('unsuccess')}
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
                  <FormLabel>{t('finalNote')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('customDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{t('pickDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit">{t('markAsComplete')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
