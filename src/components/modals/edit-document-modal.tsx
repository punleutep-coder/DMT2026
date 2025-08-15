'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import type { Document } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'

const formSchema = z.object({
  id: z.string().min(1, 'Document ID is required.'),
  name: z.string().min(1, 'Document name is required.'),
  office: z.string().optional(),
  secondaryId: z.string().optional(),
  tertiaryId: z.string().optional(),
  quaternaryId: z.string().optional(),
  documentLink1: z.string().url().optional().or(z.literal('')),
  documentLink2: z.string().url().optional().or(z.literal('')),
  documentLink3: z.string().url().optional().or(z.literal('')),
  documentLink4: z.string().url().optional().or(z.literal('')),
  assignedDepartment: z.string().optional(),
})

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function EditDocumentModal({ isOpen, onClose, docId }: EditDocumentModalProps) {
  const { state, dispatch } = useAppContext()
  const doc = state.documents.find(d => d.id === docId)
  const { currentUser } = state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: doc?.id || '',
      name: doc?.name || '',
      office: doc?.office || '',
      secondaryId: doc?.secondaryId || '',
      tertiaryId: doc?.tertiaryId || '',
      quaternaryId: doc?.quaternaryId || '',
      documentLink1: Array.isArray(doc?.documentLink) ? doc?.documentLink[0] || '' : '',
      documentLink2: Array.isArray(doc?.documentLink) ? doc?.documentLink[1] || '' : '',
      documentLink3: Array.isArray(doc?.documentLink) ? doc?.documentLink[2] || '' : '',
      documentLink4: Array.isArray(doc?.documentLink) ? doc?.documentLink[3] || '' : '',
      assignedDepartment: doc?.assignedDepartment || '',
    },
  })

  if (!doc) return null

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.id !== doc.id && state.documents.some(d => d.id === values.id)) {
        form.setError('id', { message: 'This Document ID already exists.' });
        return;
    }

    const updatedDocs = state.documents.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          id: values.id,
          name: values.name,
          office: values.office || null,
          secondaryId: values.secondaryId || null,
          tertiaryId: values.tertiaryId || null,
          quaternaryId: values.quaternaryId || null,
          documentLink: [values.documentLink1, values.documentLink2, values.documentLink3, values.documentLink4].filter(Boolean) as string[],
          assignedDepartment: values.assignedDepartment || null,
          lastUpdate: new Date().toISOString(),
        } as Document
      }
      return d
    })

    dispatch({ type: 'UPDATE_DOCUMENTS', payload: updatedDocs })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Edit Document: {doc.id}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4">
                {hasPermission(currentUser, 'canEditDocumentId') && <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel>Document ID (Primary)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditDocumentName') && <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditOffice') && <FormField control={form.control} name="office" render={({ field }) => ( <FormItem><FormLabel>Office</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                {hasPermission(currentUser, 'canEditAssignedDepartment') && <FormField control={form.control} name="assignedDepartment" render={({ field }) => ( <FormItem><FormLabel>Assigned Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hasPermission(currentUser, 'canEditSecondaryId') && <FormField control={form.control} name="secondaryId" render={({ field }) => ( <FormItem><FormLabel>Secondary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditTertiaryId') && <FormField control={form.control} name="tertiaryId" render={({ field }) => ( <FormItem><FormLabel>Tertiary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditQuaternaryId') && <FormField control={form.control} name="quaternaryId" render={({ field }) => ( <FormItem><FormLabel>Quaternary ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasPermission(currentUser, 'canEditDocumentLink1') && <FormField control={form.control} name="documentLink1" render={({ field }) => ( <FormItem><FormLabel>Document Link 1</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink2') && <FormField control={form.control} name="documentLink2" render={({ field }) => ( <FormItem><FormLabel>Document Link 2</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink3') && <FormField control={form.control} name="documentLink3" render={({ field }) => ( <FormItem><FormLabel>Document Link 3</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                    {hasPermission(currentUser, 'canEditDocumentLink4') && <FormField control={form.control} name="documentLink4" render={({ field }) => ( <FormItem><FormLabel>Document Link 4</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
