'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppContext } from '@/hooks/use-app-context'
import { CalendarIcon, ChevronLeft, Clock, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z.object({
  releaseDate: z.date({
    required_error: "A release date is required.",
  }),
  note: z.string().optional(),
})

type DelayDocumentFormValues = z.infer<typeof formSchema>

export default function DelayDocumentView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
  const docToUpdate = state.documents.find(d => d.id === docId)
  const t = useTranslation();

  const form = useForm<DelayDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      releaseDate: undefined,
      note: '',
    },
  })

  if (!docToUpdate) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document you are trying to delay could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

  const onSubmit = async (values: DelayDocumentFormValues) => {
    const now = new Date().toISOString()
    const updatedFields = {
        id: docId!,
        isDelayed: true,
        releaseDate: values.releaseDate.toISOString(),
        lastUpdate: now,
    }

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ 
        type: 'ADD_LOG', 
        payload: {
            docId: docId!, 
            oldStatus: docToUpdate.status, 
            newStatus: 'Delayed', 
            user: state.currentUser!.username, 
            timestamp: now, 
            reason: `Delayed until ${format(values.releaseDate, 'PPP')}. Note: ${values.note}` 
        }
    });
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

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
            {t('delayDocument' as any)}: <span className="text-destructive">{docToUpdate.id}</span>
          </h2>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('delayDocument' as any)}</span>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white/10">
          <ScrollArea className="flex-1">
            <div className="p-6 sm:p-12 max-w-2xl mx-auto w-full space-y-8">
                <div className="bg-white/30 p-8 rounded-[2rem] border border-white/20 shadow-sm space-y-8">
                   <FormField
                      control={form.control}
                      name="releaseDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-3">
                          <FormLabel className="text-lg font-bold text-amber-600 uppercase tracking-tight">{t('releaseDate' as any)}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-14 px-6 text-left text-lg font-bold rounded-xl bg-white/50 border-white/40",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>{t('pickADate' as any)}</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-3xl" align="center">
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

                    <FormField 
                        control={form.control} 
                        name="note" 
                        render={({ field }) => ( 
                            <FormItem className="space-y-3">
                                <FormLabel className="text-lg font-bold text-muted-foreground uppercase tracking-tight">{t('reasonForDelay' as any)}</FormLabel>
                                <FormControl><Textarea placeholder={t('delayReasonPlaceholder' as any)} {...field} className="min-h-[120px] text-lg font-medium rounded-xl bg-white/50 border-white/30 py-4 px-6 shadow-inner" /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} 
                    />
                </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-6 sm:px-10 font-bold font-body">
                  {t('cancel')}
              </Button>
              <Button type="submit" className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 font-body">
                  {t('delayDocument' as any)}
              </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
