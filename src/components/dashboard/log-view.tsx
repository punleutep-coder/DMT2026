'use client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { format } from 'date-fns'
import type { Document } from '@/lib/types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Split, Link, ExternalLink, History as HistoryIcon, Clock, User as UserIcon, MessageSquare, ArrowRight, FileStack, ChevronLeft, X, PlusCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { hasPermission } from '@/lib/permissions'
import { cn } from '@/lib/utils'

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

export default function LogView() {
  const { state, dispatch } = useAppContext()
  const t = useTranslation()
  const docId = state.modal.docId
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
    dispatch({ type: 'SET_MODAL', payload: { type: 'viewLog', docId: sourceDocId, firestoreId: sourceFirestoreId }});
  }
  
  const handleSplitAgain = (sourceDoc: Document) => {
    dispatch({ type: 'SET_VIEW', payload: 'splitDocument' });
    dispatch({ type: 'SET_MODAL', payload: { type: 'splitDocument', docId: sourceDoc.id, firestoreId: sourceDoc.firestoreId }});
  }

  if (!document) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center glassmorphic-card rounded-3xl m-4">
        <X className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">The document history you are trying to view could not be located.</p>
        <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Return to Dashboard</Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/20 bg-white/40 sticky top-0 z-10">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="rounded-full hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight truncate">
                {t('documentHistory')}
              </h2>
              <Badge className="bg-destructive text-white text-sm sm:text-lg px-4 py-0.5 font-black rounded-full shadow-lg ml-2">
                {document.id}
              </Badge>
          </div>
          <p className="text-sm font-bold text-muted-foreground truncate">{document.name}</p>
        </div>
        <Button variant="ghost" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full gap-2 hover:bg-white/20">
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">{t('close')}</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-white/10">
        <div className="p-4 sm:p-8 lg:p-12 space-y-12 max-w-7xl mx-auto w-full">
            
            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Document Links */}
                {Array.isArray(document.documentLink) && document.documentLink.some(l => !!l) && (
                    <div className="lg:col-span-1 p-8 bg-white/40 rounded-[2.5rem] border border-white/20 shadow-xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Link className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black text-primary uppercase font-body">
                                {t('documentLinks')}
                            </h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {document.documentLink.map((link, i) => (
                                hasPermission(currentUser, `canOpenDocumentLink${i+1}` as any) && link ? (
                                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="w-full">
                                        <Button variant="outline" className="w-full justify-between h-14 px-6 text-lg font-bold rounded-2xl bg-white/50 border-white/30 hover:bg-white/80 hover:border-blue-400 transition-all group">
                                            <span className="truncate">{t(`docLink${i + 1}` as any, { defaultValue: `Link ${i+1}` })}</span>
                                            <ExternalLink className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                        </Button>
                                    </a>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}

                {/* Source Documents */}
                {(sourceDocuments.length > 0 || splitSourceDocument) && (
                    <div className={cn("p-8 bg-white/40 rounded-[2.5rem] border border-white/20 shadow-xl space-y-6", (Array.isArray(document.documentLink) && document.documentLink.some(l => !!l)) ? "lg:col-span-2" : "lg:col-span-3")}>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <FileStack className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-black text-primary uppercase font-body">
                                {t('sourceDocuments')}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sourceDocuments.map(sourceDoc => sourceDoc && (
                                <div key={sourceDoc.id} className="p-6 bg-white/50 rounded-[2rem] border border-white/30 shadow-sm flex flex-col justify-between group transition-all hover:bg-white/80 hover:border-emerald-300">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="cursor-pointer group/id" onClick={() => handleSourceDocClick(sourceDoc.id, sourceDoc.firestoreId)}>
                                                <h4 className="font-black text-lg text-emerald-600 flex items-center gap-2 group-hover/id:underline">
                                                    {sourceDoc.id} <ExternalLink className="h-4 w-4 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                                </h4>
                                            </div>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">{sourceDoc.documentType || 'N/A'}</Badge>
                                        </div>
                                        <p className="text-lg font-bold text-foreground line-clamp-2">{sourceDoc.name}</p>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{sourceDoc.assignedDepartment || 'N/A'}</p>
                                    </div>
                                    {sourceDoc.documentLink && sourceDoc.documentLink[0] && (
                                        <a href={sourceDoc.documentLink[0]} target="_blank" rel="noopener noreferrer" className="mt-6 self-end">
                                            <Button variant="ghost" size="sm" className="font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full px-4">
                                                {t('docLink1')} <ExternalLink className="ml-2 h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            ))}
                            {splitSourceDocument && (
                                <div className="p-6 bg-white/50 rounded-[2rem] border border-white/30 shadow-sm flex flex-col justify-between group transition-all hover:bg-white/80 hover:border-purple-300">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="cursor-pointer group/id" onClick={() => handleSourceDocClick(splitSourceDocument.id, splitSourceDocument.firestoreId)}>
                                                <h4 className="font-black text-lg text-purple-600 flex items-center gap-2 group-hover/id:underline">
                                                    {splitSourceDocument.id} <ExternalLink className="h-4 w-4 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                                </h4>
                                            </div>
                                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">{splitSourceDocument.documentType || 'N/A'}</Badge>
                                        </div>
                                        <p className="text-lg font-bold text-foreground line-clamp-2">{splitSourceDocument.name}</p>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{splitSourceDocument.assignedDepartment || 'N/A'}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-6">
                                        <Button variant="ghost" size="sm" className="font-black text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full px-4" onClick={() => handleSplitAgain(splitSourceDocument)}>
                                            <Split className="h-4 w-4 mr-2" /> {t('split')}
                                        </Button>
                                        {splitSourceDocument.documentLink && splitSourceDocument.documentLink[0] && (
                                            <a href={splitSourceDocument.documentLink[0]} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm" className="font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full px-4">
                                                    {t('docLink1')} <ExternalLink className="ml-2 h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Department History Timeline */}
              <div className="lg:col-span-5 space-y-8">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-primary uppercase font-body">
                    {t('departmentTimestamps')}
                  </h3>
                </div>
                
                <div className="space-y-6 relative ml-6 border-l-2 border-primary/10 pl-10 py-4">
                  {document.history?.map((entry, index) => (
                    <div key={index} className="relative p-8 bg-white/40 rounded-[2rem] border border-white/20 shadow-xl transition-all hover:bg-white/60 hover:-translate-y-1 duration-300">
                      {/* Timeline Dot */}
                      <div className={cn(
                          "absolute -left-[51px] top-10 h-10 w-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10",
                          !entry.end ? "bg-emerald-500 animate-pulse" : "bg-primary"
                      )}>
                          {index === 0 ? <PlusCircle className="h-4 w-4 text-white" /> : <ArrowRight className="h-4 w-4 text-white" />}
                      </div>

                      <div className="flex items-center justify-between gap-4 mb-8">
                        <h4 className="font-black text-2xl text-primary font-headline uppercase leading-none truncate">
                            {entry.department}
                        </h4>
                        {!entry.end && <Badge className="bg-emerald-500 text-white font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest shadow-lg">Current</Badge>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('start')}</span>
                                <span className="text-base font-bold text-foreground">
                                    {entry.start ? format(new Date(entry.start), 'dd MMM yyyy, HH:mm') : 'N/A'}
                                </span>
                            </div>
                            {entry.end && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('end')}</span>
                                    <span className="text-base font-bold text-foreground">
                                        {format(new Date(entry.end), 'dd MMM yyyy, HH:mm')}
                                    </span>
                                </div>
                            )}
                         </div>

                         <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('period')}</span>
                                <span className="text-base font-black text-primary bg-primary/5 px-3 py-1 rounded-lg w-fit">
                                    {formatDuration(entry.start, entry.end)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('receiverName')}</span>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-base font-bold text-foreground">
                                        {entry.receiver || 'N/A'}
                                    </span>
                                </div>
                            </div>
                         </div>
                      </div>

                      {entry.note && (
                        <div className="mt-8 p-6 bg-white/50 rounded-2xl border border-white/50 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-destructive/40" />
                                <span className="text-[10px] font-black text-destructive/60 uppercase tracking-widest">{t('note')}</span>
                            </div>
                            <p className="text-base font-medium text-foreground line-clamp-4 whitespace-pre-wrap leading-relaxed italic">
                                {entry.note}
                            </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Change Log Table/List */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <HistoryIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-600 uppercase font-body">
                    {t('statusChangeLog')}
                  </h3>
                </div>

                <div className="bg-white/40 rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden">
                    <div className="divide-y divide-white/20">
                        {docLogs.length > 0 ? docLogs.map((log) => (
                            <div key={log.id} className="p-8 hover:bg-white/30 transition-colors group">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                            <UserIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-foreground">{log.user}</span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                {format(new Date(log.timestamp), 'dd MMMM yyyy, HH:mm:ss')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-white/40 shadow-sm">
                                        <Badge variant="outline" className="bg-white/80 font-bold px-3 py-1 border-white/60 text-muted-foreground text-[10px] uppercase tracking-widest">{log.oldStatus}</Badge>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <Badge className="bg-blue-600 text-white font-black px-3 py-1 text-[10px] uppercase tracking-widest shadow-md">{log.newStatus}</Badge>
                                    </div>
                                </div>

                                {log.reason && (
                                    <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10 flex gap-4">
                                        <MessageSquare className="h-5 w-5 text-destructive/40 shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-destructive/60 uppercase tracking-widest">{t('reason')}</span>
                                            <p className="text-lg font-medium text-destructive leading-relaxed italic">
                                                {log.reason}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/30">
                                <HistoryIcon className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-xl font-black uppercase tracking-widest">{t('noStatusChanges')}</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 sm:p-8 bg-white/30 border-t border-white/20 backdrop-blur-xl flex justify-end">
          <Button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full h-11 sm:h-14 px-8 sm:px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 font-body">
              {t('close')}
          </Button>
      </div>
    </div>
  )
}
