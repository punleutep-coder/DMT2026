'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
}

const formatDuration = (start: string, end: string | null) => {
    if (!start) return 'N/A';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    
    let seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0 && days < 7) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0 && hours === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    if (parts.length === 0 && days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    
    return parts.join(', ') || '0 minutes';
};


export default function LogModal({ isOpen, onClose, docId }: LogModalProps) {
  const { state } = useAppContext()
  const docLogs = state.logs.filter(log => log.docId === docId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const document = state.documents.find(doc => doc.id === docId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle className="leading-relaxed">History for {document?.id} / {document?.name}</DialogTitle>
          <DialogDescription>
            Review the complete journey and all changes made to this document.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
            {/* Department History Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Department Timestamps & Details</h3>
              <div className="space-y-4">
                {document?.history?.map((entry, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-bold text-primary mb-2">{entry.department}</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                       <p><strong className="text-foreground/80">Start:</strong> {entry.start ? format(new Date(entry.start), 'PPp') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">End:</strong> {entry.end ? format(new Date(entry.end), 'PPp') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">Period:</strong> <span className="text-primary font-medium">{formatDuration(entry.start, entry.end)}</span></p>
                       <p><strong className="text-foreground/80">Receiver Name:</strong> {entry.receiver}</p>
                       <p><strong className="text-foreground/80">Note:</strong> {entry.note || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Change Log Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Status Change Log</h3>
              <div className="relative space-y-6 border-l-2 border-primary/30 pl-6">
                 {docLogs.length > 0 ? docLogs.map((log, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-[30px] top-1.5 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                        <p className="font-medium text-foreground">
                            From <span className="font-bold text-primary/90">{log.oldStatus}</span> to <span className="font-bold text-primary">{log.newStatus}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'PPp')} by {log.user}</p>
                        {log.reason && (
                            <p className="text-sm mt-2 p-2 bg-muted/20 rounded-md border border-border/30">
                                <strong className="text-foreground/80">Reason:</strong> {log.reason}
                            </p>
                        )}
                    </div>
                )) : (
                    <p className="text-muted-foreground">No status changes logged.</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
