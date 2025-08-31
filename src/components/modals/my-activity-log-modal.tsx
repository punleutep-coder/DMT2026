
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'

interface MyActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyActivityLogModal({ isOpen, onClose }: MyActivityLogModalProps) {
  const { state } = useAppContext()
  const { logs, currentUser } = state
  const [searchTerm, setSearchTerm] = useState('')

  const userLogs = useMemo(() => {
    if (!currentUser) return []
    
    let filteredLogs = logs
      .filter(log => log.user === currentUser.username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.docId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
      
    return filteredLogs
  }, [logs, currentUser, searchTerm])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>My Activity Log</DialogTitle>
          <DialogDescription>
            A record of all the actions you have performed in the system.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Input 
                placeholder="Search by Document ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
            />
        </div>
        <ScrollArea className="h-[50vh]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Document ID</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {userLogs.length > 0 ? userLogs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                            <TableCell>{log.docId}</TableCell>
                            <TableCell>
                                From <span className="font-bold text-primary/90">{log.oldStatus}</span> to <span className="font-bold text-primary">{log.newStatus}</span>
                            </TableCell>
                            <TableCell>{log.reason || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No activity found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
