'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'
import type { Document } from '@/lib/types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Split, Link, ExternalLink, History, Clock, User as UserIcon, MessageSquare, ArrowRight, FileStack } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { hasPermission } from '@/lib/permissions'
import { cn } from '@/lib/utils'

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
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    return 'Less than a minute';
};


export default function LogModal({ isOpen, onClose, docId, firestoreId }: LogModalProps) {
  const { state, dispatch } = useAppContext()
  const t = useTranslation()
  const { currentUser } = state;
  const docLogs = state.logs.filter(log => log.docId === docId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const document = state.documents.find(doc => doc.id === docId)

  const sourceDocuments = document?.combinedFrom
    ? document.combinedFrom.map(id => state.documents.find(d => d.id === id)).filter((d): d is Document => !!d)
    : [];

  const splitSourceDocument = document?.splitFrom
    ? state.documents.find(d => d.id === document.splitFrom)
    : null;

  const handleSourceDocClick = (sourceDocId: string, sourceFirestoreId: string) => {
    onClose(); 
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
        className="max-w-4xl p-0 gap-0 overflow-hidden"
        style={{ background: '#EEDCB4', border: '1px solid rgba(255, 255, 255, 0.3)' }}
        >
        <DialogHeader className="p-5 pb-3 border-b bg-white/20 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#000099]" />
              <DialogTitle className="text-xl font-bold tracking-tight" style={{ color: '#000099' }}>
                  {t('documentHistory')}
              </DialogTitle>
            </div>
            <Badge className="bg-[#FF6600] text-white hover:bg-[#FF6600]/90 text-sm px-2 py-0.5 font-bold shadow-sm">
                {document?.id}
            </Badge>
          </div>
          <div className="mt-1">
            <span className="text-base font-medium text-foreground/80 leading-snug block">
                {document?.name}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="p-5 space-y-6">
            
            {/* Main Document Quick Links */}
            {document && Array.isArray(document.documentLink) && document.documentLink.some(l => !!l) && (
                <div className="p-4 bg-white/40 rounded-lg border border-white/60 shadow-sm">
                    <h3 className="text-base font-bold text-[#000099] mb-3 flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        {t('documentLinks')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {document.documentLink.map((link, i) => (
                            hasPermission(currentUser, `canOpenDocumentLink${i+1}` as any) && link ? (
                                <a key={i} href={link} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="bg-white/60 hover:bg-white hover:border-blue-400 border-white/80 h-8 text-xs transition-all">
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                                        {t(`docLink${i + 1}` as any, { defaultValue: `Link ${i+1}` })}
                                    </Button>
                                </a>
                            ) : null
                        ))}
                    </div>
                </div>
            )}

            {/* Source Documents (If Combined or Split) */}
            {(sourceDocuments.length > 0 || splitSourceDocument) && (
                <div className="p-4 bg-blue-50/30 rounded-lg border border-blue-200/50">
                    <h3 className="text-base font-bold text-[#000099] mb-3 flex items-center gap-2">
                        <FileStack className="h-4 w-4" />
                        {t('sourceDocuments')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sourceDocuments.map(sourceDoc => sourceDoc && (
                            <div key={sourceDoc.id} className="p-3 bg-white/50 rounded-lg border border-white/80 shadow-sm flex flex-col justify-between group transition-all hover:bg-white/70">
                                <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-sm text-[#0000E2] cursor-pointer hover:underline underline-offset-2 flex items-center gap-1" onClick={() => handleSourceDocClick(sourceDoc.id, sourceDoc.firestoreId)}>
                                            {sourceDoc.id} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h4>
                                        <Badge variant="outline" className="text-xs bg-white/50">{sourceDoc.documentType || 'N/A'}</Badge>
                                    </div>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">{sourceDoc.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('department')}: {sourceDoc.assignedDepartment || 'N/A'}</p>
                                </div>
                                {sourceDoc.documentLink && sourceDoc.documentLink[0] && (
                                    <a href={sourceDoc.documentLink[0]} target="_blank" rel="noopener noreferrer" className="self-end">
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600">
                                            {t('docLink1')} <ExternalLink className="ml-1 h-3 w-3" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        ))}
                        {splitSourceDocument && (
                            <div className="p-3 bg-white/50 rounded-lg border border-white/80 shadow-sm flex flex-col justify-between group transition-all hover:bg-white/70">
                                <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-sm text-[#0000E2] cursor-pointer hover:underline underline-offset-2 flex items-center gap-1" onClick={() => handleSourceDocClick(splitSourceDocument.id, splitSourceDocument.firestoreId)}>
                                            {splitSourceDocument.id} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h4>
                                        <Badge variant="outline" className="text-xs bg-white/50">{splitSourceDocument.documentType || 'N/A'}</Badge>
                                    </div>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">{splitSourceDocument.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('department')}: {splitSourceDocument.assignedDepartment || 'N/A'}</p>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => handleSplitAgain(splitSourceDocument)}>
                                        <Split className="h-3 w-3 mr-1" /> {t('splitDocument')}
                                    </Button>
                                    {splitSourceDocument.documentLink && splitSourceDocument.documentLink[0] && (
                                        <a href={splitSourceDocument.documentLink[0]} target="_blank" rel="noopener noreferrer">
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600">
                                                {t('docLink1')} <ExternalLink className="ml-1 h-3 w-3" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Department History Column */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-bold text-[#000099] flex items-center gap-2 px-1">
                  <Clock className="h-4 w-4" />
                  {t('departmentTimestamps')}
                </h3>
                <div className="space-y-3">
                  {document?.history?.map((entry, index) => (
                    <div key={index} className="relative p-4 bg-white/30 rounded-lg border border-white/50 shadow-sm transition-all hover:bg-white/40">
                      <div className="absolute -left-1.5 top-5 w-1 h-6 bg-[#0000E2] rounded-full" />
                      <h4 className="font-bold text-[#0000E2] text-sm mb-2 flex items-center justify-between">
                        {entry.department}
                        {entry.end ? <Badge variant="secondary" className="text-xs font-normal px-1.5 py-0">Completed</Badge> : <Badge className="text-xs bg-green-500 text-white animate-pulse px-1.5 py-0">Current</Badge>}
                      </h4>
                      <div className="grid grid-cols-1 gap-y-1.5 text-sm">
                         <div className="flex items-start gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium">{t('start')}</p>
                                <p className="font-semibold text-foreground">{entry.start ? format(new Date(entry.start), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                            </div>
                         </div>
                         {entry.end && (
                            <div className="flex items-start gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-medium">{t('end')}</p>
                                    <p className="font-semibold text-foreground">{format(new Date(entry.end), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                            </div>
                         )}
                         <div className="flex items-start gap-2">
                            <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium">{t('period')}</p>
                                <p className="font-bold text-[#0000E2]">{formatDuration(entry.start, entry.end)}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-2">
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium">{t('receiverName')}</p>
                                <p className="font-semibold text-foreground">{entry.receiver || 'N/A'}</p>
                            </div>
                         </div>
                         {entry.note && (
                            <div className="flex items-start gap-2 mt-1 p-2 bg-black/5 rounded-md">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-bold">{t('note')}</p>
                                    <p className="text-sm text-destructive italic whitespace-pre-wrap">{entry.note}</p>
                                </div>
                            </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Change Log Column */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-lg font-bold text-[#000099] flex items-center gap-2 px-1">
                  <History className="h-4 w-4" />
                  {t('statusChangeLog')}
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/40">
                   {docLogs.length > 0 ? docLogs.map((log, logIdx) => (
                    <div key={log.id} className="relative group">
                        {/* Timeline Connector Dot */}
                        <div className={cn(
                            "absolute -left-[25px] top-1 h-5 w-5 rounded-full border-2 border-[#EEDCB4] shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                            logIdx === 0 ? "bg-[#0000E2]" : "bg-white/80"
                        )}>
                            <div className={cn("h-1.5 w-1.5 rounded-full", logIdx === 0 ? "bg-white" : "bg-[#0000E2]")} />
                        </div>

                        <div className="p-3 bg-white/20 rounded-lg border border-white/40 shadow-sm transition-all hover:bg-white/30">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
                                <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                                <span className="text-xs text-muted-foreground">by</span>
                                <span className="text-xs font-bold text-[#0000E2]">{log.user}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <Badge variant="outline" className="bg-white/40 text-xs border-white/60 font-medium py-0 h-5">{log.oldStatus}</Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge className="bg-[#0000E2] text-white text-xs font-bold border-none py-0 h-5">{log.newStatus}</Badge>
                            </div>

                            {log.reason && (
                                <div className="mt-1.5 p-2 bg-red-50/30 rounded-md border border-red-100/50">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <MessageSquare className="h-3 w-3 text-red-400" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase">{t('reason')}</span>
                                    </div>
                                    <p className="text-sm text-destructive leading-relaxed whitespace-pre-wrap">
                                        {log.reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <History className="h-10 w-10 mb-2" />
                        <p className="text-sm">{t('noStatusChanges')}</p>
                    </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-3 bg-white/10 border-t flex justify-end">
            <Button onClick={onClose} variant="secondary" className="bg-white/40 hover:bg-white/60 text-[#000099] font-bold px-6 h-9 shadow-sm">
                {t('close')}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
