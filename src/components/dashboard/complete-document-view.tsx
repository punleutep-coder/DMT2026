'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAppContext } from '@/hooks/use-app-context'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, CheckCircle, Save, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { useTranslation } from '@/lib/i18n'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z.object({
  status: z.enum(['Completed (Success)', 'Completed (Unsuccess)'], {
    required_error: "You need to select a completion status."
  }),
  note: z.string().optional(),
  customDate: z.date().optional(),
})

type CompleteDocumentFormValues = z.infer<typeof formSchema>

export default function CompleteDocumentView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
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

  if (!docToUpdate) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document you are trying to complete could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

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
        id: docId!,
        status: values.status,
        lastUpdate: now,
        history: newHistory,
    };

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ 
        type: 'ADD_LOG', 
        payload: {
            docId: docId!, 
            oldStatus: docToUpdate.status, 
            newStatus: values.status, 
            user: state.currentUser!.username, 
            timestamp: now, 
            reason: values.note 
        }
    });
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

  const selectedStatus = form.watch('status');

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/20 bg-white/40 sticky top-0 z-10">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="rounded-full hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight truncate">
            {t('completeDocument')}: <span className="text-destructive">{docToUpdate.id}</span>
          </h2>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('markAsComplete')}</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white/10">
          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-12 max-w-4xl mx-auto w-full">
                <div className="bg-white/30 p-8 sm:p-12 rounded-[2.5rem] border border-white/20 shadow-xl space-y-12">
                   <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-8">
                             <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                                <FormLabel className="text-xl font-black text-emerald-600 uppercase tracking-tighter font-headline">{t('completionStatus')}</FormLabel>
                             </div>
                             <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                                >
                                  <FormItem className={cn(
                                      "flex flex-col items-center justify-center p-6 sm:p-10 rounded-[2rem] border-2 transition-all cursor-pointer group",
                                      field.value === 'Completed (Success)' 
                                        ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                                        : "bg-white/40 border-transparent hover:border-emerald-200"
                                  )} onClick={() => field.onChange('Completed (Success)')}>
                                    <FormControl>
                                      <RadioGroupItem value="Completed (Success)" className="sr-only" />
                                    </FormControl>
                                    <div className={cn(
                                        "h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-all",
                                        field.value === 'Completed (Success)' ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-500"
                                    )}>
                                        <ThumbsUp className="h-8 w-8" />
                                    </div>
                                    <FormLabel className="font-black text-xl sm:text-2xl cursor-pointer">
                                      {t('success')}
                                    </FormLabel>
                                  </FormItem>

                                  <FormItem className={cn(
                                      "flex flex-col items-center justify-center p-6 sm:p-10 rounded-[2rem] border-2 transition-all cursor-pointer group",
                                      field.value === 'Completed (Unsuccess)' 
                                        ? "bg-destructive/10 border-destructive shadow-lg shadow-destructive/10" 
                                        : "bg-white/40 border-transparent hover:border-destructive/20"
                                  )} onClick={() => field.onChange('Completed (Unsuccess)')}>
                                    <FormControl>
                                      <RadioGroupItem value="Completed (Unsuccess)" className="sr-only" />
                                    </FormControl>
                                    <div className={cn(
                                        "h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-all",
                                        field.value === 'Completed (Unsuccess)' ? "bg-destructive text-white" : "bg-destructive/10 text-destructive"
                                    )}>
                                        <ThumbsDown className="h-8 w-8" />
                                    </div>
                                    <FormLabel className="font-black text-xl sm:text-2xl cursor-pointer">
                                      {t('unsuccess')}
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                             </FormControl>
                             <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="customDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-muted-foreground/30 rounded-full" />
                                <FormLabel className="text-lg font-black text-muted-foreground uppercase tracking-tighter font-headline">{t('customDate')}</FormLabel>
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'h-14 sm:h-16 px-6 text-left text-lg font-black rounded-2xl bg-white/50 border-white/30 font-body',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, 'PPP')
                                      ) : (
                                        <span>{t('pickDate')} ({t('today' as any)})</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0 rounded-3xl"
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

                        <FormField
                          control={form.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-muted-foreground/30 rounded-full" />
                                <FormLabel className="text-lg font-black text-muted-foreground uppercase tracking-tighter font-headline">{t('finalNote')}</FormLabel>
                              </div>
                              <FormControl>
                                <Textarea placeholder={t('completionNotePlaceholder' as any)} {...field} className="min-h-[120px] text-lg font-medium rounded-2xl bg-white/50 border-white/30 py-4 px-6 shadow-inner font-body" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-6 sm:px-10 font-bold font-body">
                  {t('cancel')}
              </Button>
              <Button type="submit" className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white font-body">
                  {t('markAsComplete')}
              </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
