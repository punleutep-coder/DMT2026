'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Combobox } from '../ui/combobox'
import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { hasDepartmentPermission } from '@/lib/permissions'

const formSchema = z.object({
  nextDepartment: z.string().min(1, 'Please select a department.'),
  receiver: z.string().min(1, 'Receiver name is required.'),
  note: z.string().optional(),
})

type BulkAdvanceFormValues = z.infer<typeof formSchema>

interface BulkAdvanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkAdvanceModal({
  isOpen,
  onClose,
}: BulkAdvanceModalProps) {
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

  // We should not be able to advance to a department that any selected document is currently in.
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
        return true; // Keep unregistered receivers
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
        title: 'Success',
        description: `${docsToAdvance.length} documents have been moved to ${values.nextDepartment}.`
    });

    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Bulk Advance Documents</DialogTitle>
          <DialogDescription>
            Move {selectedDocIds.length} selected documents to a new department.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  <h4 className="text-sm font-medium">Selected Documents:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {docsToAdvance.map((d) => (
                      <li key={d.id}>
                        <span className="font-medium text-foreground">{d.id}</span> - {d.name} ({d.status})
                      </li>
                    ))}
                  </ul>
                </div>
            <FormField
              control={form.control}
              name="nextDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select next department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableNextDepts.map((dept) => (
                        <SelectItem key={dept} value={dept}>
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
                 <FormItem className="flex flex-col">
                  <FormLabel>{t('receiverName')}</FormLabel>
                  <Combobox
                    options={receiverOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('selectReceiver')}
                    searchPlaceholder={t('searchReceiver')}
                    notFoundText={t('noReceiverFound')}
                    onCreate={currentUser?.role === 'Admin' ? handleCreateReceiver : undefined}
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
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="This note will be applied to all documents." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Move Documents</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
