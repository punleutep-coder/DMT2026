'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { format } from 'date-fns'
import { ChevronLeft, StickyNote, Save, X, MessageSquarePlus, History } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  newNote: z.string().min(1, 'Note cannot be empty.'),
})

export default function AddNoteView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
  const docToUpdate = state.documents.find(d => d.id === docId)
  const t = useTranslation()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newNote: '',
    },
  })

  if (!docToUpdate) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document you are trying to add a note to could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

  const currentNode = docToUpdate.history[docToUpdate.history.length - 1];
  const currentNote = currentNode?.note || ''

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const now = new Date();
    const newHistory = [...docToUpdate.history];
    const lastEntry = newHistory[newHistory.length - 1];
    
    if (lastEntry) {
        const formattedDate = format(now, 'dd/MM/yyyy HH:mm');
        const appendedNote = currentNote ? `${currentNote}\n--- (${formattedDate}) ---\n${values.newNote}` : values.newNote;
        lastEntry.note = appendedNote;
    }

    const updatedFields: Partial<Document> & {id: string} = { 
        id: docId!,
        history: newHistory, 
        lastUpdate: now.toISOString() 
    };

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ 
        type: 'ADD_LOG', 
        payload: {
            docId: docId!, 
            oldStatus: docToUpdate.status, 
            newStatus: `Note Added in ${docToUpdate.status}`, 
            user: state.currentUser!.username, 
            timestamp: now.toISOString(), 
            reason: `New note added: ${values.newNote}` 
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
            {t('addNote' as any)}: <span className="text-destructive">{docToUpdate.id}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{docToUpdate.status}</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3">
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('addNote' as any)}</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-white/10">
          <div className="p-6 sm:p-12 max-w-4xl mx-auto w-full space-y-12">
              {/* Current Note History */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2">
                       <History className="h-4 w-4 text-primary/60" />
                       <h3 className="text-sm uppercase font-black tracking-widest text-primary/60">{t('currentNote' as any)}</h3>
                  </div>
                   <div className="p-6 rounded-2xl bg-white/40 border border-white/20 shadow-inner">
                        {currentNote ? (
                            <p className="text-base font-bold text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {currentNote}
                            </p>
                        ) : (
                            <div className="py-4 text-muted-foreground/30 italic text-center">
                                <p>{t('noExistingNote' as any)}</p>
                            </div>
                        )}
                   </div>
              </div>

              {/* Form to add new note */}
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField control={form.control} name="newNote" render={({ field }) => ( 
                          <FormItem className="space-y-3">
                              <FormLabel className="text-lg font-bold text-primary uppercase tracking-tight">{t('newNoteToAdd' as any)}</FormLabel>
                              <FormControl>
                                   <Textarea 
                                        {...field} 
                                        className="min-h-[200px] text-lg font-medium py-6 px-8 rounded-2xl bg-white/50 border-white/30 shadow-inner" 
                                        placeholder={t('writeNotePlaceholder' as any)}
                                    />
                              </FormControl>
                              <FormMessage />
                          </FormItem> 
                      )} />
                  </form>
              </Form>
          </div>
      </ScrollArea>
      
      <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-6 sm:px-10 font-bold">
              {t('cancel')}
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              {t('addNote' as any)}
          </Button>
      </div>
    </div>
  )
}
