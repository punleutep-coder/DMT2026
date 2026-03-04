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
import { Combobox } from '../ui/combobox'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  newDocId: z.string().min(1, 'New Document ID is required.'),
  newDocName: z.string().min(1, 'New Document Name is required.'),
  documentType: z.string().min(1, 'Document type is required.'),
  assignedDepartment: z.string().optional(),
  label: z.string().optional(),
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
  const { selectedDocIds, departments, currentUser, documentTypes, assignedDepartments, labels } = state
  const { toast } = useToast()
  const t = useTranslation()
  const docsToCombine = state.documents.filter((d) =>
    selectedDocIds.includes(d.id)
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDocId: '',
      newDocName: '',
      documentType: '',
      assignedDepartment: '',
      label: '',
      targetDepartment: '',
      receiverName: '',
      customDate: undefined,
      note: '',
    },
  })

  const handleCreateAssignedDepartment = (deptName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can create new assigned departments.", variant: "destructive" });
      return;
    }
    if (assignedDepartments.some(d => d.toLowerCase() === deptName.toLowerCase())) {
        toast({ title: "Duplicate Department", description: "This assigned department already exists.", variant: "destructive" });
        return;
    }
    
    const newAssignedDepartments = [...assignedDepartments, deptName];
    dispatch({ type: 'SET_ASSIGNED_DEPARTMENTS', payload: newAssignedDepartments });
    form.setValue('assignedDepartment', deptName);
    toast({ title: "Assigned Department Created", description: `"${deptName}" has been added.` });
  }

  const handleCreateLabel = (labelName: string) => {
    if (currentUser?.role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only Admins can create new labels.", variant: "destructive" });
      return;
    }
    if (labels.some(l => l.toLowerCase() === labelName.toLowerCase())) {
        toast({ title: "Duplicate Label", description: "This label already exists.", variant: "destructive" });
        return;
    }
    
    const newLabels = [...labels, labelName];
    dispatch({ type: 'SET_LABELS', payload: newLabels });
    form.setValue('label', labelName);
    toast({ title: "Label Created", description: `"${labelName}" has been added.` });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (state.documents.some(d => d.id === values.newDocId)) {
        form.setError('newDocId', { message: 'This Document ID already exists.' });
        return;
    }

    const now = new Date()
    const startDate = values.customDate ? values.customDate.toISOString() : now.toISOString()

    const allTags = new Set<string>()
    const allKeywords = new Set<string>()
    const allLinks = new Set<string>()
    const allNames = new Set<string>()

    docsToCombine.forEach(doc => {
      // Aggregate tags, links, and names
      doc.tags?.forEach(tag => allTags.add(tag));
      doc.documentLink?.forEach(link => allLinks.add(link));
      allNames.add(doc.name);

      // Aggregate all searchable text fields into keywords
      const fieldsToAggregate = [
        doc.name,
        doc.keywords,
        doc.label,
        doc.assignedDepartment,
        doc.secondaryId,
        doc.tertiaryId,
        doc.quaternaryId,
        doc.quinaryId,
        doc.senaryId,
        doc.septenaryId,
        doc.octonaryId,
        doc.nonaryId,
        doc.denaryId,
      ];

      fieldsToAggregate.forEach(field => {
        if(field) {
            field.split(/[\s,]+/).forEach(part => part && allKeywords.add(part.trim()));
        }
      });
    });

    const newDoc: Document = {
      id: values.newDocId,
      firestoreId: `doc-${Date.now()}`,
      name: values.newDocName,
      documentType: values.documentType,
      label: values.label || null,
      status: values.targetDepartment,
      initialDepartment: values.targetDepartment,
      assignedDepartment: values.assignedDepartment || null,
      lastUpdate: now.toISOString(),
      secondaryId: null,
      tertiaryId: null,
      quaternaryId: null,
      quinaryId: null,
      senaryId: null,
      septenaryId: null,
      octonaryId: null,
      nonaryId: null,
      denaryId: null,
      documentLink: Array.from(allLinks),
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
      releaseDateReached: false,
      justReleased: false,
      keywords: Array.from(allKeywords).join(' '),
      combinedFrom: selectedDocIds,
    }

    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
    dispatch({
        type: 'ADD_LOG',
        payload: {
            docId: newDoc.id,
            oldStatus: 'N/A',
            newStatus: 'Created via Combination',
            user: currentUser!.username,
            timestamp: now.toISOString(),
        }
    });

    docsToCombine.forEach(doc => {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: doc.id, status: 'Combined', lastUpdate: now.toISOString() } });
        dispatch({
            type: 'ADD_LOG',
            payload: {
                docId: doc.id,
                oldStatus: doc.status,
                newStatus: 'Combined',
                user: currentUser!.username,
                timestamp: now.toISOString(),
            }
        });
    });
    
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] })
    onClose()
  }
  
  const documentTypeOptions = documentTypes.map(type => ({ value: type, label: type }));
  const assignedDepartmentOptions = assignedDepartments.map(dept => ({ value: dept, label: dept }));
  const labelOptions = labels.map(label => ({ value: label, label: label }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] lg:max-w-2xl glassmorphic-card">
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
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Document Type</FormLabel>
                          <Combobox
                            options={documentTypeOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select document type..."
                            searchPlaceholder="Search types..."
                            notFoundText="No types found."
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assignedDepartment"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('assignedDepartment')}</FormLabel>
                          <Combobox
                            options={assignedDepartmentOptions}
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={t('selectAssignedDept')}
                            searchPlaceholder={t('searchAssignedDept')}
                            notFoundText={t('noAssignedDeptFound')}
                            onCreate={currentUser?.role === 'Admin' ? handleCreateAssignedDepartment : undefined}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>{t('label')}</FormLabel>
                            <Combobox
                                options={labelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('selectLabel')}
                                searchPlaceholder={t('searchLabel')}
                                notFoundText={t('noLabelFound')}
                                onCreate={currentUser?.role === 'Admin' ? handleCreateLabel : undefined}
                            />
                            <FormMessage />
                            </FormItem>
                        )}
                    />
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
