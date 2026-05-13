'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { Combobox } from '../ui/combobox'
import { useToast } from '@/hooks/use-toast'
import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { hasDepartmentPermission } from '@/lib/permissions'

const formSchema = z.object({
  nextDepartment: z.string().min(1, 'Please select a department.'),
  receiver: z.string().min(1, 'Receiver name is required.'),
  note: z.string().optional(),
})

type AdvanceDocumentFormValues = z.infer<typeof formSchema>;

interface AdvanceDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
}

export default function AdvanceDocumentModal({ isOpen, onClose, docId, firestoreId }: AdvanceDocumentModalProps) {
  const { state, dispatch } = useAppContext()
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

  if (!doc) return null

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
      toast({ title: "Permission Denied", description: "Only Admins can create new receiver names.", variant: "destructive" });
      return;
    }
    
    if (receivers.some(r => r.toLowerCase() === receiverName.toLowerCase())) {
        toast({ title: "Duplicate Receiver", description: "This receiver name already exists.", variant: "destructive" });
        return;
    }
    
    const newReceivers = [...receivers, receiverName].sort();
    dispatch({ type: 'SET_RECEIVERS', payload: newReceivers });
    form.setValue('receiver', receiverName);
    toast({ title: "Receiver Created", description: `"${receiverName}" has been added.` });
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
      id: docId,
      status: values.nextDepartment,
      lastUpdate: now,
      history: newHistory,
      isDelayed: false, 
      releaseDate: null, 
      releaseDateReached: false
    }

    dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
    dispatch({ type: 'ADD_LOG', payload: { docId, oldStatus, newStatus: values.nextDepartment, user: state.currentUser!.username, timestamp: now } });

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-lg:w-screen max-lg:h-screen max-lg:max-w-none max-lg:max-h-none max-lg:top-0 max-lg:left-0 max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none lg:w-[90vw] lg:max-w-7xl lg:h-[95vh] glassmorphic-card p-6 sm:p-12 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="mb-10 flex-none">
          <DialogTitle className="text-5xl font-bold">{t('advance')}: {doc.id}</DialogTitle>
          <DialogDescription className="text-3xl mt-4">Current department: {doc.status}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-10 -mr-10">
              <div className="space-y-12 pb-16">
                <FormField
                  control={form.control}
                  name="nextDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-2xl font-bold block mb-3">Next Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-20 text-2xl">
                            <SelectValue placeholder="Select next department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableNextDepts.map(dept => (
                            <SelectItem key={dept} value={dept} className="text-xl">{dept}</SelectItem>
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
                      <FormLabel className="text-2xl font-bold block mb-3">{t('receiverName')}</FormLabel>
                      <Combobox
                        options={receiverOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('selectReceiver')}
                        searchPlaceholder={t('searchReceiver')}
                        notFoundText={t('noReceiverFound')}
                        onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
                        className="h-20 text-2xl"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel className="text-2xl font-bold block mb-3">Note</FormLabel><FormControl><Textarea {...field} className="min-h-[180px] text-2xl" /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-10 flex-none gap-8">
              <Button type="button" variant="ghost" className="flex-1 h-24 text-3xl font-bold" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1 h-24 text-3xl font-bold">Move Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
