
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'
import type { Document } from '@/lib/types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Split, Link } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

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
    
    const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    const days = Math.floor(seconds / (3600 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    
    // If less than a day, show as "Less than a day" or similar.
    return 'Less than a day';
};


export default function LogModal({ isOpen, onClose, docId, firestoreId }: LogModalProps) {
  const { state, dispatch } = useAppContext()
  const t = useTranslation()
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
      <DialogContent 
        className="max-w-3xl"
        style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
        >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="leading-relaxed" style={{ color: '#000099', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{t('documentHistory')} <span style={{ color: '#FF6600' }}>{document?.id}</span> / {document?.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-4">
          {sourceDocuments.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-foreground">{t('sourceDocuments')}</h3>
                <div className="space-y-4">
                    {sourceDocuments.map(sourceDoc => sourceDoc && (
                        <div key={sourceDoc.id} className="relative p-4 bg-muted/30 rounded-lg border-l-4 border-border flex flex-col">
                           <div className="flex-grow">
                             <h4 className="font-semibold text-foreground mb-1 cursor-pointer hover:underline" onClick={() => handleSourceDocClick(sourceDoc.id, sourceDoc.firestoreId)}>
                               <span style={{color: '#0000E2'}}>{sourceDoc.id}</span> - {sourceDoc.name}
                             </h4>
                             <p className="text-sm text-foreground">{t('department')}: {sourceDoc.assignedDepartment}</p>
                             {sourceDoc.secondaryId && <p className="text-sm text-foreground mt-2 inline-block bg-background/50 px-2 py-1 rounded">{sourceDoc.secondaryId}</p>}
                           </div>
                            {sourceDoc.documentLink && sourceDoc.documentLink.length > 0 && (
                              <div className="mt-2 self-end">
                                  <a href={sourceDoc.documentLink[0]} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm">
                                          <Link className="mr-2 h-4 w-4" />
                                          {t('docLink1')}
                                      </Button>
                                  </a>
                              </div>
                             )}
                        </div>
                    ))}
                </div>
              </div>
          )}

          {splitSourceDocument && (
              <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-foreground">{t('sourceDocuments')}</h3>
                  <div className="relative p-4 bg-muted/30 rounded-lg border-l-4 border-border">
                      <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-semibold text-foreground mb-1 cursor-pointer hover:underline" onClick={() => handleSourceDocClick(splitSourceDocument.id, splitSourceDocument.firestoreId)}>
                                  <span style={{color: '#0000E2'}}>{splitSourceDocument.id}</span> - {splitSourceDocument.name}
                              </h4>
                              <p className="text-sm text-foreground">{t('department')}: {splitSourceDocument.assignedDepartment}</p>
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
              <h3 className="text-lg font-semibold text-foreground">{t('departmentTimestamps')}</h3>
              <div className="space-y-4">
                {document?.history?.map((entry, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-bold text-foreground mb-2" style={{color: '#0000E2'}}>{entry.department}</h4>
                    <div className="text-sm space-y-1">
                       <p><strong className="text-foreground/80">{t('start')}:</strong> {entry.start ? format(new Date(entry.start), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">{t('end')}:</strong> {entry.end ? format(new Date(entry.end), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                       <p><strong className="text-foreground/80">{t('period')}:</strong> <span className="text-foreground font-medium" style={{color: '#0000E2'}}>{formatDuration(entry.start, entry.end)}</span></p>
                       <p><strong className="text-foreground/80">{t('receiverName')}:</strong> {entry.receiver}</p>
                       <p><strong className="text-foreground/80">{t('note')}:</strong> {entry.note || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Change Log Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">{t('statusChangeLog')}</h3>
              <div className="relative space-y-6 border-l-2 pl-6" style={{borderColor: 'rgba(0, 0, 226, 0.3)'}}>
                 {docLogs.length > 0 ? docLogs.map((log, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-[30px] top-1.5 h-4 w-4 rounded-full ring-4 ring-background" style={{backgroundColor: '#0000E2'}} />
                        <p className="font-medium text-foreground">
                            {t('from')} <span style={{color: '#0000E2'}}>{log.oldStatus}</span> {t('to')} <span style={{color: '#0000E2'}}>{log.newStatus}</span>
                        </p>
                        <p className="text-xs text-foreground">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')} by {log.user}</p>
                        {log.reason && (
                            <p className="text-sm mt-2 p-2 bg-muted/20 rounded-md border border-border/30">
                                <strong className="text-foreground/80">{t('reason')}:</strong> {log.reason}
                            </p>
                        )}
                    </div>
                )) : (
                    <p className="text-foreground">{t('noStatusChanges')}</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
