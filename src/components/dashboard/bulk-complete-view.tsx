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
import { CalendarIcon, ChevronLeft, CheckCircle2, MessageSquare, Calendar as CalendarLucide, ListChecks, X, Save } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { useTranslation } from '@/lib/i18n'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Document } from '@/lib/types'

const formSchema = z.object({
  status: z.enum(['Completed (Success)', 'Completed (Unsuccess)'], {
    required_error: "You need to select a completion status."
  }),
  note: z.string().optional(),
  customDate: z.date().optional(),
})

type BulkCompleteFormValues = z.infer<typeof formSchema>

export default function BulkCompleteView() {
  const { state, dispatch } = useAppContext()
  const { selectedDocIds, documents, currentUser } = state
  const t = useTranslation()

  const docsToComplete = documents.filter(d => selectedDocIds.includes(d.id));

  const form = useForm<BulkCompleteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Completed (Success)',
      note: '',
      customDate: undefined,
    },
  })

  const onSubmit = async (values: BulkCompleteFormValues) => {
    const now = values.customDate ? values.customDate.toISOString() : new Date().toISOString();
    
    docsToComplete.forEach(doc => {
        const newHistory = [...doc.history];
        const lastEntry = newHistory[newHistory.length - 1];
        if (lastEntry) {
            lastEntry.end = now;
            if (values.note) {
                lastEntry.note = `${lastEntry.note || ''}\nBulk Completion Note: ${values.note}`.trim();
            }
        }

        dispatch({
            type: 'UPDATE_DOCUMENT',
            payload: { id: doc.id, status: values.status, lastUpdate: now, history: newHistory }
        });
        dispatch({
            type: 'ADD_LOG',
            payload: {
                docId: doc.id,
                oldStatus: doc.status,
                newStatus: values.status,
                user: currentUser!.username,
                timestamp: now,
                reason: `Bulk Complete: ${values.note || 'N/A'}`
            }
        });
    });

    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

  if (docsToComplete.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">No Documents Selected</h2>
        <p className="text-muted-foreground mb-6">Please select one or more documents to mark as complete.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  );

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
            {t('bulkComplete')}: <span className="text-destructive">{docsToComplete.length} {t('results' as any)}</span>
          </h2>
        </div>
        <div className="flex gap-2">
            <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('markAsComplete')}</span>
            </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white/10">
          <ScrollArea className="flex-1">
            <div className="p-6 sm:p-12 max-w-4xl mx-auto w-full space-y-12">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('completionStatus')}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    <FormItem className="flex items-center space-x-0 space-y-0 relative">
                                        <FormControl>
                                            <RadioGroupItem value="Completed (Success)" className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel className="flex flex-col items-center justify-center p-6 bg-white/40 border-2 border-white/20 rounded-3xl cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50/50 hover:bg-white/60 transition-all w-full text-center group">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-lg font-black uppercase tracking-tight text-emerald-700">{t('success')}</span>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-0 space-y-0 relative">
                                        <FormControl>
                                            <RadioGroupItem value="Completed (Unsuccess)" className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel className="flex flex-col items-center justify-center p-6 bg-white/40 border-2 border-white/20 rounded-3xl cursor-pointer peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/5 hover:bg-white/60 transition-all w-full text-center group">
                                            <X className="h-8 w-8 text-destructive mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-lg font-black uppercase tracking-tight text-destructive">{t('unsuccess')}</span>
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
                        <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('finalNote')}</FormLabel>
                            <FormControl>
                                <Textarea 
                                    {...field} 
                                    className="min-h-[200px] text-lg font-bold p-8 rounded-3xl bg-white/60 border-white/40 shadow-inner"
                                    placeholder="Add a final note to all selected documents..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="customDate"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('customDate')}</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={'outline'}
                                            className={cn(
                                                'h-14 w-full px-6 text-left font-bold text-lg rounded-2xl bg-white/60 border-white/40 shadow-inner',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, 'PPP')
                                            ) : (
                                                <span>{t('pickDate')}</span>
                                            )}
                                            <CalendarLucide className="ml-auto h-5 w-5 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl border-white/20 shadow-2xl" align="start">
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
            </div>
          </ScrollArea>
          
          <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-6 sm:px-10 font-bold font-body">
                  {t('cancel')}
              </Button>
              <Button type="button" onClick={form.handleSubmit(onSubmit)} className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 font-body flex gap-3">
                  <Save className="h-5 w-5" />
                  {t('markAsComplete')} {docsToComplete.length} Docs
              </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
