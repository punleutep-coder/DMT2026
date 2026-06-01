'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { Combobox } from '../ui/combobox'
import { useToast } from '@/hooks/use-toast'
import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { hasDepartmentPermission } from '@/lib/permissions'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ArrowRight, Save, X, FastForward, User } from 'lucide-react'

const formSchema = z.object({
  nextDepartment: z.string().min(1, 'Please select a department.'),
  receiver: z.string().min(1, 'Receiver name is required.'),
  note: z.string().optional(),
})

type AdvanceDocumentFormValues = z.infer<typeof formSchema>;

export default function AdvanceDocumentView() {
  const { state, dispatch } = useAppContext()
  const docId = state.modal.docId
  const { doc, currentUser, receivers } = useMemo(() => ({
    doc: state.documents.find(d => d.id === docId),
    currentUser: state.currentUser,
    receivers: state.receivers
  }), [state.documents, state.currentUser, state.receivers, docId]);
  
  const { toast } = useToast();
  const t = useTranslation();

  const form = useForm<AdvanceDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nextDepartment: '',
      receiver: '',
      note: '',
    },
  })

  if (!doc) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document you are trying to move could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

  const availableNextDepts = state.departments.filter(dept => 
    dept !== doc.status && hasDepartmentPermission(currentUser, dept)
  )

  const selectedNextDept = form.watch('nextDepartment');
  const receiverOptions = useMemo(() => {
    if (!selectedNextDept) return [];
    return receivers
      .filter(receiverName => {
        const matchingUser = state.users.find(u => u.username === receiverName);
        if (matchingUser) {
          return hasDepartmentPermission(matchingUser, selectedNextDept);
        }
        return true;
      })
      .sort()
      .map(r => ({ value: r, label: r }));
  }, [receivers, state.users, selectedNextDept]);
  
  const handleCreateReceiver = (receiverName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: t('permissionDenied' as any), description: t('adminOnlyPermission' as any), variant: "destructive" });
      return;
    }
    
    if (receivers.some(r => r.toLowerCase() === receiverName.toLowerCase())) {
        toast({ title: t('duplicate' as any), description: t('itemAlreadyExists' as any), variant: "destructive" });
        return;
    }
    
    const newReceivers = [...receivers, receiverName].sort();
    dispatch({ type: 'SET_RECEIVERS', payload: newReceivers });
    form.setValue('receiver', receiverName);
    toast({ title: t('created' as any), description: `${receiverName}` });
  }

  const onSubmit = async (values: AdvanceDocumentFormValues) => {
    const now = new Date().toISOString()
    const oldStatus = doc.status
    
    const newHistory = [...doc.history]
    const lastEntry = newHistory[newHistory.length - 1]
    if (lastEntry) {
      lastEntry.end = now
    }
    newHistory.push({ department: values.nextDepartment, start: now, end: null, receiver: values.receiver, note: values.note || '' })
    
    const updatedFields: Partial<Document> & { id: string } = {
      id: docId!,
      status: values.nextDepartment,
      lastUpdate: now,
      history: newHistory,
      isDelayed: false, 
      releaseDate: null, 
      releaseDateReached: false
    }

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ type: 'ADD_LOG', payload: { docId: docId!, oldStatus, newStatus: values.nextDepartment, user: state.currentUser!.username, timestamp: now } });

    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white/50 hover:bg-white shadow-sm border border-white/20"
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
          >
            <ChevronLeft className="h-5 w-5 text-[#000066]" />
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#000066]">{t('advance' as any)}: <span className="text-destructive">{doc.id}</span></h2>
        </div>
      </div>

      <div className="glassmorphic-card p-6 sm:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="nextDepartment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('nextDepartment' as any)}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg rounded-xl">
                                        <SelectValue placeholder={t('selectNextDept' as any)} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableNextDepts.map(dept => (
                                        <SelectItem key={dept} value={dept} className="text-base py-2">{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="receiver"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('receiverName')}</FormLabel>
                      <Combobox
                          options={receiverOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('selectReceiver')}
                          searchPlaceholder={t('searchReceiver')}
                          notFoundText={t('noReceiverFound')}
                          onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
                          className="h-12 sm:h-14 text-base sm:text-lg rounded-xl"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField 
                    control={form.control} 
                    name="note" 
                    render={({ field }) => ( 
                        <FormItem>
                            <FormLabel className="text-[#1D41D5] text-base sm:text-lg font-bold block mb-1.5">{t('note' as any)}</FormLabel>
                            <FormControl><Textarea placeholder={t('notePlaceholder' as any)} {...field} className="min-h-[120px] text-base sm:text-lg py-3 rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )} 
                />
            </div>

            <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-end gap-4 mt-auto">
              <Button type="button" variant="outline" className="h-12 px-8 text-base font-bold shadow-sm" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                className="h-12 px-10 text-base font-bold bg-[#000066] hover:bg-[#000099] text-white shadow-lg transition-all active:scale-95"
              >
                {t('moveDocument' as any)}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
