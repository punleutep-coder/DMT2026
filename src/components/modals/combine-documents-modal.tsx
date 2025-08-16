'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'

const formSchema = z.object({
  newDocId: z.string().min(1, 'New Document ID is required.'),
  newDocName: z.string().min(1, 'New Document Name is required.'),
  assignedDepartment: z.string().optional(),
  office: z.string().optional(),
  targetDepartment: z.string().min(1, 'Please select a target department.'),
  receiverName: z.string().min(1, 'Receiver name is required.'),
  customDate: z.date().optional(),
  note: z.string().optional(),
})

interface CombineDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CombineDocumentsModal({
  isOpen,
  onClose,
}: CombineDocumentsModalProps) {
  const { state, dispatch } = useAppContext()
  const { selectedDocIds, departments, currentUser } = state
  const docsToCombine = state.documents.filter((d) =>
    selectedDocIds.includes(d.id)
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocId: '',
      newDocName: '',
      assignedDepartment: '',
      office: '',
      targetDepartment: '',
      receiverName: '',
      customDate: undefined,
      note: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (state.documents.some((d) => d.id === values.newDocId)) {
      form.setError('newDocId', { message: 'This Document ID already exists.' })
      return
    }

    const now = new Date()
    const startDate = values.customDate ? values.customDate.toISOString() : now.toISOString()

    const allTags = new Set<string>()
    const allKeywords = new Set<string>()
    docsToCombine.forEach(doc => {
      doc.tags.forEach(tag => allTags.add(tag));
      doc.keywords?.split(' ').forEach(kw => kw && allKeywords.add(kw));
    });

    const newDoc: Document = {
      id: values.newDocId,
      name: values.newDocName,
      office: values.office || null,
      status: values.targetDepartment,
      initialDepartment: values.targetDepartment,
      assignedDepartment: values.assignedDepartment || null,
      lastUpdate: now.toISOString(),
      secondaryId: null,
      tertiaryId: null,
      quaternaryId: null,
      documentLink: [] as string[],
      history: [
        {
          department: values.targetDepartment,
          start: startDate,
          end: null,
          receiver: values.receiverName,
          note:
            values.note || `Combined from ${selectedDocIds.join(', ')}`,
        },
      ],
      tags: Array.from(allTags),
      isDelayed: false,
      releaseDate: null,
      keywords: Array.from(allKeywords).join(' '),
      combinedFrom: selectedDocIds,
    }

    // Create the new combined document
    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc })
    // Log the creation
    dispatch({ type: 'ADD_LOG', payload: {
        docId: newDoc.id,
        oldStatus: 'N/A',
        newStatus: 'Created via Combination',
        user: currentUser!.username,
        timestamp: now.toISOString(),
    }})

    // Update the original documents
    docsToCombine.forEach(doc => {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: doc.id, status: 'Combined', lastUpdate: now.toISOString() }})
        dispatch({ type: 'ADD_LOG', payload: {
            docId: doc.id,
            oldStatus: doc.status,
            newStatus: 'Combined',
            user: currentUser!.username,
            timestamp: now.toISOString(),
        }})
    })
    
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Combine Documents</DialogTitle>
          <DialogDescription>
            Combine {selectedDocIds.length} selected documents into a new one.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] -mx-6 px-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    Documents to be Combined:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 rounded-md border p-4 text-sm text-muted-foreground">
                    {docsToCombine.map((d) => (
                      <li key={d.id}>
                        <span className="font-medium text-foreground">{d.id}</span> - {d.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">New Combined Document Details:</h3>
                    <FormField control={form.control} name="newDocId" render={({ field }) => ( <FormItem><FormLabel>Document ID (Primary)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="newDocName" render={({ field }) => ( <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="assignedDepartment" render={({ field }) => ( <FormItem><FormLabel>Department (Assigned to Document)</FormLabel><FormControl><Input placeholder="e.g., Finance, HR, Legal" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="office" render={({ field }) => ( <FormItem><FormLabel>Office</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="targetDepartment" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Target Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the initial department for the new document" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="receiverName" render={({ field }) => ( <FormItem><FormLabel>Receiver Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField
                      control={form.control}
                      name="customDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Custom Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a start date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
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
                    <FormField control={form.control} name="note" render={({ field }) => ( <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Create Combined Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
