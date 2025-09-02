
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'
import type { Document } from '@/lib/types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Split } from 'lucide-react'

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  docId: string
  firestoreId: string
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


export default function LogModal({ isOpen, onClose, docId, firestoreId }: LogModalProps) {
  const { state, dispatch } = useAppContext()
  const docLogs = state.logs.filter(log => log.docId === docId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const document = state.documents.find(doc => doc.id === docId)

  const sourceDocuments = document?.combinedFrom
    ? document.combinedFrom.map(id => state.documents.find(d => d.id === id)).filter((d): d is Document => !!d)
    : [];

  const splitSourceDocument = document?.splitFrom
    ? state.documents.find(d => d.id === document.splitFrom)
    : null;

  const handleSourceDocClick = (sourceDocId: string, sourceFirestoreId: string) => {
    onClose(); // Close the current modal
    // Dispatch needs a moment to allow the UI to close the modal before opening a new one.
    setTimeout(() => {
      dispatch({ type: 'SET_MODAL', payload: { type: 'viewLog', docId: sourceDocId, firestoreId: sourceFirestoreId }});
    }, 100);
  }
  
  const handleSplitAgain = (sourceDoc: Document) => {
    onClose();
    setTimeout(() => {
      dispatch({ type: 'SET_MODAL', payload: { type: 'splitDocument', docId: sourceDoc.id, firestoreId: sourceDoc.firestoreId }});
    }, 100);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle className="leading-relaxed">History for {document?.id} / {document?.name}</DialogTitle>
          <DialogDescription>
            Review the complete journey and all changes made to this document.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-4">
          {sourceDocuments.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-foreground">Source Documents</h3>
                <div className="space-y-4">
                    {sourceDocuments.map(sourceDoc => sourceDoc && (
                        <div key={sourceDoc.id} className="relative p-4 bg-muted/30 rounded-lg border-l-4" style={{ borderColor: '#33CCCC' }}>
                           <h4 className="font-semibold text-foreground mb-1 cursor-pointer hover:underline" onClick={() => handleSourceDocClick(sourceDoc.id, sourceDoc.firestoreId)}>
                             <span style={{ color: '#33CCCC' }}>{sourceDoc.id}</span> - {sourceDoc.name}
                           </h4>
                           <p className="text-sm text-muted-foreground">Department: {sourceDoc.assignedDepartment}</p>
                           {sourceDoc.secondaryId && <p className="text-sm text-muted-foreground mt-2 inline-block bg-background/50 px-2 py-1 rounded">{sourceDoc.secondaryId}</p>}
                        </div>
                    ))}
                </div>
              </div>
          )}

          {splitSourceDocument && (
              <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-foreground">Source Document</h3>
                  <div className="relative p-4 bg-muted/30 rounded-lg border-l-4" style={{ borderColor: '#33CCCC' }}>
                      <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-semibold text-foreground mb-1 cursor-pointer hover:underline" onClick={() => handleSourceDocClick(splitSourceDocument.id, splitSourceDocument.firestoreId)}>
                                  <span style={{ color: '#33CCCC' }}>{splitSourceDocument.id}</span> - {splitSourceDocument.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">Department: {splitSourceDocument.assignedDepartment}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {splitSourceDocument.secondaryId && <Badge variant="secondary">{splitSourceDocument.secondaryId}</Badge>}
                                {splitSourceDocument.tertiaryId && <Badge variant="secondary">{splitSourceDocument.tertiaryId}</Badge>}
                              </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleSplitAgain(splitSourceDocument)} title="Split Again">
                            <Split className="h-5 w-5" />
                          </Button>
                      </div>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Department History Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Department Timestamps & Details</h3>
              <div className="space-y-4">
                {document?.history?.map((entry, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-bold text-[#33CCCC] mb-2">{entry.department}</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                       <p><strong className="text-foreground/80">Start:</strong> {entry.start ? format(new Date(entry.start), 'PPp') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">End:</strong> {entry.end ? format(new Date(entry.end), 'PPp') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">Period:</strong> <span className="text-[#33CCCC] font-medium">{formatDuration(entry.start, entry.end)}</span></p>
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
              <div className="relative space-y-6 border-l-2 border-[#33CCCC]/30 pl-6">
                 {docLogs.length > 0 ? docLogs.map((log, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-[30px] top-1.5 h-4 w-4 rounded-full bg-[#33CCCC] ring-4 ring-background" />
                        <p className="font-medium text-foreground">
                            From <span className="text-[#33CCCC]">{log.oldStatus}</span> to <span className="text-[#33CCCC]">{log.newStatus}</span>
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

    