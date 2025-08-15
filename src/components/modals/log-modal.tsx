'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

export default function LogModal({ isOpen, onClose, docId }: LogModalProps) {
  const { state } = useAppContext()
  const docLogs = state.logs.filter(log => log.docId === docId)
  const document = state.documents.find(doc => doc.id === docId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Activity Log for Document: {docId}</DialogTitle>
          <DialogDescription>{document?.name}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Reason / Note</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {docLogs.map((log, index) => (
                        <TableRow key={index}>
                            <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>
                                <span className="font-medium">{log.newStatus}</span>
                                {log.oldStatus && <span className="text-muted-foreground"> (from {log.oldStatus})</span>}
                            </TableCell>
                            <TableCell>{log.reason}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
