'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { suggestTagsAction } from '@/app/actions/ai'
import { Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  docId: z.string().min(1, 'Document ID is required.'),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  assignedDepartment: z.string().optional(),
  docName: z.string().min(1, 'Document Name is required.'),
  office: z.string().optional(),
  documentLink1: z.string().url().optional().or(z.literal('')),
  documentLink2: z.string().url().optional().or(z.literal('')),
  documentLink3: z.string().url().optional().or(z.literal('')),
  documentLink4: z.string().url().optional().or(z.literal('')),
  keywords: z.string().optional(),
  docTags: z.string().optional(),
  initialReceiver: z.string().min(1, 'Initial Receiver is required.'),
  initialNote: z.string().optional(),
})

interface AddDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddDocumentModal({ isOpen, onClose }: AddDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const [isSuggesting, setIsSuggesting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docId: '',
      secondaryId: '',
      tertiaryId: '',
      quaternaryId: '',
      assignedDepartment: '',
      docName: '',
      office: '',
      documentLink1: '',
      documentLink2: '',
      documentLink3: '',
      documentLink4: '',
      keywords: '',
      docTags: '',
      initialReceiver: '',
      initialNote: '',
    },
  })

  const handleSuggestTags = async () => {
    const docName = form.getValues('docName')
    if (!docName) {
      form.setError('docName', { message: 'Please enter a name first.' })
      return
    }
    setIsSuggesting(true)
    try {
      const tags = await suggestTagsAction(docName)
      form.setValue('docTags', tags.join(', '))
    } catch (error) {
      console.error('Failed to suggest tags', error)
    } finally {
      setIsSuggesting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (state.documents.some(d => d.id === values.docId)) {
        form.setError('docId', { message: 'This Document ID already exists.' });
        return;
    }
    
    const initialDepartment = state.departments.length > 0 ? state.departments[0] : null
    if (!initialDepartment) {
        toast({
            title: 'Error: No Departments',
            description: 'Please define at least one department in "Manage Departments" before adding a document.',
            variant: 'destructive',
        })
        return;
    }

    const now = new Date().toISOString()
    const newDoc = {
        id: values.docId,
        firestoreId: `doc-${Date.now()}`,
        name: values.docName,
        office: values.office || null,
        status: initialDepartment,
        initialDepartment: initialDepartment,
        assignedDepartment: values.assignedDepartment || null,
        lastUpdate: now,
        secondaryId: values.secondaryId || null,
        tertiaryId: values.tertiaryId || null,
        quaternaryId: values.quaternaryId || null,
        documentLink: [values.documentLink1, values.documentLink2, values.documentLink3, values.documentLink4].filter(Boolean) as string[],
        history: [{ department: initialDepartment, start: now, end: null, receiver: values.initialReceiver, note: values.initialNote || '' }],
        tags: values.docTags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        isDelayed: false,
        releaseDate: null,
        releaseDateReached: false,
        justReleased: false,
        keywords: values.keywords || ''
    }

    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
    dispatch({ type: 'ADD_LOG', payload: { id: `log-${Date.now()}`, firestoreId: `log-${Date.now()}`, docId: newDoc.id, oldStatus: 'New', newStatus: initialDepartment, user: state.currentUser!.username, timestamp: now } });
    
    toast({ title: "Success", description: "Document added successfully." });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4">
                <FormField control={form.control} name="docId" render={({ field }) => ( <FormItem><FormLabel>Document ID (Primary)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="docName" render={({ field }) => ( <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="secondaryId" render={({ field }) => ( <FormItem><FormLabel>Secondary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="tertiaryId" render={({ field }) => ( <FormItem><FormLabel>Tertiary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="quaternaryId" render={({ field }) => ( <FormItem><FormLabel>Quaternary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="assignedDepartment" render={({ field }) => ( <FormItem><FormLabel>Assigned Department</FormLabel><FormControl><Input placeholder="e.g. Finance" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="office" render={({ field }) => ( <FormItem><FormLabel>Office</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="initialReceiver" render={({ field }) => ( <FormItem><FormLabel>Initial Receiver Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="documentLink1" render={({ field }) => ( <FormItem><FormLabel>Document Link 1</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="documentLink2" render={({ field }) => ( <FormItem><FormLabel>Document Link 2</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="documentLink3" render={({ field }) => ( <FormItem><FormLabel>Document Link 3</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="documentLink4" render={({ field }) => ( <FormItem><FormLabel>Document Link 4</FormLabel><FormControl><Input type="url" placeholder="https://://" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="keywords" render={({ field }) => ( <FormItem><FormLabel>Keywords</FormLabel><FormControl><Input placeholder="For better search results..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="docTags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} /></FormControl>
                      <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isSuggesting}>
                        <Sparkles className="mr-2 h-4 w-4" /> {isSuggesting ? 'Suggesting...' : 'Suggest'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="initialNote" render={({ field }) => ( <FormItem><FormLabel>Initial Note</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!state.isInitialized}>Add Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
