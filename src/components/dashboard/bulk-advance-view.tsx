'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Combobox } from '../ui/combobox'
import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { hasDepartmentPermission } from '@/lib/permissions'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, Redo2, User, MessageSquare, ListChecks, ArrowRight, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formSchema = z.object({
  nextDepartment: z.string().min(1, 'Please select a department.'),
  receiver: z.string().min(1, 'Receiver name is required.'),
  note: z.string().optional(),
})

type BulkAdvanceFormValues = z.infer<typeof formSchema>

export default function BulkAdvanceView() {
  const { state, dispatch } = useAppContext()
  const { selectedDocIds, departments, currentUser, receivers } = state
  const { toast } = useToast()
  const t = useTranslation()
  
  const docsToAdvance = state.documents.filter(d => selectedDocIds.includes(d.id));

  const form = useForm<BulkAdvanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nextDepartment: '',
      receiver: '',
      note: '',
    },
  })

  const currentDepartments = [...new Set(docsToAdvance.map(d => d.status))];
  const availableNextDepts = departments.filter(dept => 
    !currentDepartments.includes(dept) && hasDepartmentPermission(currentUser, dept)
  );

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

  const onSubmit = async (values: BulkAdvanceFormValues) => {
    const now = new Date().toISOString()
    
    docsToAdvance.forEach(doc => {
        const oldStatus = doc.status;
        const newHistory = [...doc.history];
        const lastEntry = newHistory[newHistory.length - 1];
        if (lastEntry) {
            lastEntry.end = now;
        }
        newHistory.push({
            department: values.nextDepartment,
            start: now,
            end: null,
            receiver: values.receiver,
            note: values.note || '',
        });

        const updatedFields: Partial<Document> & { id: string } = {
            id: doc.id,
            status: values.nextDepartment,
            lastUpdate: now,
            history: newHistory,
            isDelayed: false, 
            releaseDate: null, 
            releaseDateReached: false
        };

        dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
        dispatch({
            type: 'ADD_LOG',
            payload: {
                docId: doc.id,
                oldStatus,
                newStatus: values.nextDepartment,
                user: currentUser!.username,
                timestamp: now,
                reason: 'Bulk Advanced'
            }
        });
    });
    
    toast({
        title: t('success'),
        description: `${docsToAdvance.length} documents have been moved to ${values.nextDepartment}.`
    });

    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  }

  if (docsToAdvance.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">No Documents Selected</h2>
        <p className="text-muted-foreground mb-6">Please select one or more documents to advance.</p>
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
            {t('bulkAdvance')}: <span className="text-destructive">{docsToAdvance.length} {t('results' as any)}</span>
          </h2>
        </div>
        <div className="flex gap-2">
            <Button onClick={form.handleSubmit(onSubmit)} className="rounded-full gap-2 shadow-lg shadow-primary/20 max-sm:px-3">
                <Redo2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('advance')}</span>
            </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white/10">
          <ScrollArea className="flex-1">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Side: Selected Documents List */}
              <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/20 p-6 sm:p-8 bg-white/30">
                <div className="flex items-center gap-3 mb-6">
                    <ListChecks className="h-5 w-5 text-primary/60" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 font-body">{t('selectedDocuments' as any)}</h3>
                </div>
                <div className="space-y-3">
                  {docsToAdvance.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-white/50 border border-white/30 shadow-sm flex items-center justify-between group transition-all hover:bg-white/80">
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-sm tracking-tight">{doc.id}</span>
                        <span className="text-xs font-bold text-muted-foreground truncate max-w-[200px]">{doc.name}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-primary/40 group-hover:text-primary/60 px-2 py-1 bg-primary/5 rounded-lg border border-primary/10">{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 p-6 sm:p-12 lg:p-20 max-w-4xl mx-auto w-full space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                  <FormField
                    control={form.control}
                    name="nextDepartment"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="h-1 w-8 bg-primary rounded-full" />
                           <FormLabel className="text-sm uppercase font-black tracking-widest font-body">Next Department</FormLabel>
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 sm:h-16 text-lg sm:text-xl font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6 font-body">
                              <SelectValue placeholder="Select next department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl">
                            {availableNextDepts.map((dept) => (
                              <SelectItem key={dept} value={dept} className="h-12 text-base font-bold font-body">
                                {dept}
                              </SelectItem>
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
                       <FormItem className="space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="h-1 w-8 bg-primary rounded-full" />
                           <FormLabel className="text-sm uppercase font-black tracking-widest font-body">{t('receiverName')}</FormLabel>
                        </div>
                        <Combobox
                          options={receiverOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('selectReceiver')}
                          searchPlaceholder={t('searchReceiver')}
                          notFoundText={t('noReceiverFound')}
                          onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
                          className="h-14 sm:h-16 text-lg sm:text-xl font-bold rounded-2xl bg-white/60 border-white/40 shadow-inner px-6 font-body"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="h-1 w-8 bg-primary rounded-full" />
                         <FormLabel className="text-sm uppercase font-black tracking-widest font-body">Note (Optional)</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea 
                            placeholder="This note will be applied to all documents." 
                            {...field} 
                            className="min-h-[200px] text-lg font-bold p-8 rounded-[2.5rem] bg-white/60 border-white/40 shadow-inner font-body"
                        />
                      </FormControl>
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
              <Button type="submit" className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 font-body flex gap-3">
                  <Save className="h-5 w-5" />
                  {t('advance')} {docsToAdvance.length} Docs
              </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
