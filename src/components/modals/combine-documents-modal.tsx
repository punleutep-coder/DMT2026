'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { Badge } from '../ui/badge'

const formSchema = z.object({
  newDocId: z.string().min(1, 'New Document ID is required.'),
  newDocName: z.string().min(1, 'New Document Name is required.'),
  note: z.string().optional(),
})

interface CombineDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CombineDocumentsModal({ isOpen, onClose }: CombineDocumentsModalProps) {
  const { state, dispatch } = useAppContext()
  const { selectedDocIds } = state
  const docsToCombine = state.documents.filter(d => selectedDocIds.includes(d.id));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocId: '',
      newDocName: '',
      note: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (state.documents.some(d => d.id === values.newDocId)) {
        form.setError('newDocId', { message: 'This Document ID already exists.' });
        return;
    }

    const now = new Date().toISOString();
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : 'N/A';
    
    const newDoc = {
        id: values.newDocId,
        name: values.newDocName,
        office: null,
        status: initialDepartment,
        initialDepartment: initialDepartment,
        assignedDepartment: null,
        lastUpdate: now,
        secondaryId: null,
        tertiaryId: null,
        quaternaryId: null,
        documentLink: [] as string[],
        history: [{ department: initialDepartment, start: now, end: null, receiver: state.currentUser!.username, note: values.note || `Combined from ${selectedDocIds.join(', ')}` }],
        tags: [] as string[],
        isDelayed: false,
        releaseDate: null,
        keywords: '',
        combinedFrom: selectedDocIds,
    };
    
    const updatedDocs = state.documents.map(d => {
        if (selectedDocIds.includes(d.id)) {
            return { ...d, status: 'Combined', lastUpdate: now };
        }
        return d;
    });

    dispatch({ type: 'UPDATE_DOCUMENTS', payload: [newDoc, ...updatedDocs] });
    dispatch({
        type: 'UPDATE_LOGS',
        payload: [
            { docId: newDoc.id, oldStatus: 'N/A', newStatus: 'Created via Combination', user: state.currentUser!.username, timestamp: now },
            ...selectedDocIds.map(id => ({ docId: id, oldStatus: state.documents.find(d=>d.id === id)!.status, newStatus: 'Combined', user: state.currentUser!.username, timestamp: now }))
        ]
    });
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Combine Documents</DialogTitle>
          <DialogDescription>Combine {selectedDocIds.length} selected documents into a new one.</DialogDescription>
        </DialogHeader>
        <div className="text-sm">
            <p className="font-medium mb-2">Documents to be combined:</p>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md">
                {docsToCombine.map(d => <Badge key={d.id} variant="secondary">{d.id} - {d.name}</Badge>)}
            </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[40vh] p-4">
              <div className="space-y-4">
                <FormField control={form.control} name="newDocId" render={({ field }) => ( <FormItem><FormLabel>New Document ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="newDocName" render={({ field }) => ( <FormItem><FormLabel>New Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Combine</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
