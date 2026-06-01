'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Document, AppState } from '@/lib/types'
import { useAppContext } from '@/hooks/use-app-context'
import {
  FileText,
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  CheckCircle2,
  FileSymlink,
  Clock,
  Play,
  FilePlus,
  Split,
  MoreVertical,
  Combine,
  ExternalLink,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/lib/i18n'

interface DocumentTableRowProps {
  doc: Document
  index: number
}

const getStatusBadgeVariant = (status: string, isDelayed: boolean, releaseDateReached?: boolean): 'default' | 'destructive' | 'secondary' | 'outline' | 'status' | 'decision' => {
    if (releaseDateReached) return 'destructive'
    if (isDelayed) return 'outline'
    if (status === 'Completed (Success)') return 'default'
    if (status === 'Completed (Unsuccess)') return 'destructive'
    if (status === 'Combined' || status === 'Split') return 'secondary'
    if (status === 'ឯកសារសម្រេច') return 'decision'
    return 'status'
}

export default function DocumentTableRow({ doc, index }: DocumentTableRowProps) {
  const { state, dispatch } = useAppContext()
  const { columnVisibility, selectedDocIds, currentUser } = state
  const t = useTranslation();

  const getStatusText = (doc: Document) => {
    if (doc.releaseDateReached) return t('releaseDateReached');
    if (doc.isDelayed) return t('delayedUntil', { date: format(new Date(doc.releaseDate!), 'MMM d, yyyy') });
    return doc.status;
  }

  const isSelected = selectedDocIds.includes(doc.id)

  const handleSelect = (checked: boolean | 'indeterminate') => {
    const newSelectedIds = checked
      ? [...selectedDocIds, doc.id]
      : selectedDocIds.filter((id) => id !== doc.id)
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: newSelectedIds })
  }

  const handleAction = (type: string, docId: string, firestoreId: string) => {
    if (type === 'deleteDocument') {
        dispatch({
            type: 'SET_DIALOG',
            payload: {
                isOpen: true,
                title: t('deleteDocument'),
                message: t('areYouSureDeleteDoc', { docId: doc.id }),
                confirmText: t('delete'),
                onConfirm: () => {
                    dispatch({ type: 'DELETE_DOCUMENT', payload: { id: docId } });
                }
            }
        });
    } else if (type === 'releaseDocument') {
        const updatedDoc = {
            id: docId,
            isDelayed: false,
            releaseDate: null,
            releaseDateReached: false,
            lastUpdate: new Date().toISOString()
        };
        dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedDoc });
        dispatch({ type: 'ADD_LOG', payload: { docId: doc.id, oldStatus: t('delayed'), newStatus: doc.status, user: currentUser!.username, timestamp: new Date().toISOString(), reason: 'Document manually released from delay.' } });

    } else if (type === 'back') {
      const currentDeptIndex = state.departments.indexOf(doc.status)
      const isTerminalState = doc.status.startsWith('Completed') || doc.status === 'Combined' || doc.status === 'Split';
      
      if (currentDeptIndex > 0 || isTerminalState) {
        let newStatus: string;
        let newHistory = [...doc.history];
        
        if (isTerminalState) {
            newStatus = state.departments[0];
            newHistory = [{
                department: newStatus,
                start: new Date().toISOString(),
                end: null,
                receiver: currentUser!.username,
                note: 'Document re-opened by admin.'
            }];

        } else {
            newHistory.pop() 
            const prevHistoryEntry = newHistory[newHistory.length - 1]
            if (prevHistoryEntry) {
                prevHistoryEntry.end = null
            }
            newStatus = prevHistoryEntry ? prevHistoryEntry.department : state.departments[0];
        }

        const updatedFields = {
          id: docId,
          status: newStatus,
          history: newHistory,
          lastUpdate: new Date().toISOString(),
          isDelayed: false, 
          releaseDate: null, 
          releaseDateReached: false
        }
        dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedFields });
        dispatch({ type: 'ADD_LOG', payload: { docId, oldStatus: doc.status, newStatus, user: currentUser!.username, timestamp: new Date().toISOString(), reason: 'Moved back to previous step.' } });
      }
    } else {
        const viewMap: {[key: string]: AppState['currentView']} = {
            'viewLog': 'viewLog',
            'editDocument': 'editDocument',
            'splitDocument': 'splitDocument',
            'delayDocument': 'delayDocument',
            'advanceDocument': 'advanceDocument',
            'completeDocument': 'completeDocument',
            'addNote': 'addNote',
            'combineDocuments': 'combineDocuments'
        };

        if (viewMap[type]) {
            dispatch({ type: 'SET_VIEW', payload: viewMap[type] });
            dispatch({ type: 'SET_MODAL', payload: { type: type as any, docId: docId as string, firestoreId: firestoreId as string }});
        } else {
            dispatch({ type: 'SET_MODAL', payload: { type: type as any, docId: docId as string, firestoreId: firestoreId as string }})
        }
    }
  }

  const isCompleted = doc.status && doc.status.startsWith('Completed');
  const isCombined = doc.status === 'Combined';
  const isSplit = doc.status === 'Split';
  const isCombinedOrSplit = isCombined || isSplit;
  const isTerminal = isCompleted || isCombinedOrSplit;
  
  const editPermissions = [
      'canEditDocumentId', 'canEditDocumentName', 'canEditDocumentType', 'canEditLabel', 
      'canEditSecondaryId', 'canEditTertiaryId', 'canEditQuaternaryId', 
      'canEditQuinaryId', 'canEditSenaryId', 'canEditSeptenaryId', 'canEditOctonaryId', 'canEditNonaryId', 'canEditDenaryId',
      'canEditDocumentLink1', 'canEditDocumentLink2', 'canEditDocumentLink3', 'canEditDocumentLink4', 
      'canEditDocumentLink5', 'canEditDocumentLink6', 'canEditDocumentLink7', 'canEditDocumentLink8', 'canEditDocumentLink9', 'canEditDocumentLink10',
      'canEditAssignedDepartment'
  ];
  const canEditDetails = editPermissions.some(p => hasPermission(currentUser, p as any));

  const extraIds = [
    { key: 'secondaryId', label: 'Sec', linkIdx: 1, perm: 'canOpenDocumentLink2' },
    { key: 'tertiaryId', label: 'Ter', linkIdx: 2, perm: 'canOpenDocumentLink3' },
    { key: 'quaternaryId', label: 'Qua', linkIdx: 3, perm: 'canOpenDocumentLink4' },
    { key: 'quinaryId', label: 'Qui', linkIdx: 4, perm: 'canOpenDocumentLink5' },
    { key: 'senaryId', label: 'Sen', linkIdx: 5, perm: 'canOpenDocumentLink6' },
    { key: 'septenaryId', label: 'Sep', linkIdx: 6, perm: 'canOpenDocumentLink7' },
    { key: 'octonaryId', label: 'Oct', linkIdx: 7, perm: 'canOpenDocumentLink8' },
    { key: 'nonaryId', label: 'Non', linkIdx: 8, perm: 'canOpenDocumentLink9' },
    { key: 'denaryId', label: 'Den', linkIdx: 9, perm: 'canOpenDocumentLink10' },
  ];

  const primaryLink = Array.isArray(doc.documentLink) ? doc.documentLink[0] : null;
  const canOpenPrimary = hasPermission(currentUser, 'canOpenDocumentLink1');

  return (
    <TableRow
      data-state={isSelected && 'selected'}
      className={`fade-in-row ${doc.justReleased ? 'row-highlight' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {columnVisibility.select && (
        <TableCell className="py-1.5 sm:py-2 h-auto">
          <Checkbox checked={isSelected} onCheckedChange={handleSelect} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </TableCell>
      )}
      {columnVisibility.documentId && (
        <TableCell className="py-1.5 sm:py-2 h-auto">
            {primaryLink && canOpenPrimary ? (
                <a href={primaryLink} target="_blank" rel="noopener noreferrer" className="block w-fit group mb-1 sm:mb-1.5">
                    <div className="font-black text-blue-700 text-sm sm:text-base tracking-tight group-hover:text-blue-600 transition-colors">
                        {doc.id}
                    </div>
                </a>
            ) : (
                <div className="font-black text-blue-700 text-sm sm:text-base tracking-tight mb-1 sm:mb-1.5">{doc.id}</div>
            )}
            
            <div className="flex flex-col gap-1 sm:gap-1.5">
                {extraIds.map((extra) => {
                    const value = doc[extra.key as keyof Document];
                    if (!value || typeof value !== 'string') return null;
                    
                    const link = Array.isArray(doc.documentLink) ? doc.documentLink[extra.linkIdx] : null;
                    const canOpen = hasPermission(currentUser, extra.perm as any);

                    const content = (
                        <div key={extra.key} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] bg-blue-500/10 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded sm:rounded-md border border-blue-200/50 w-fit transition-all hover:bg-blue-500/20 hover:border-blue-300/60 hover:scale-[1.02] active:scale-95 group/item shadow-sm">
                            <span className="font-black text-[7px] sm:text-[8px] uppercase tracking-widest text-blue-600/80 bg-white/60 px-1 py-0.5 rounded-[2px] sm:rounded-[3px] border border-blue-100/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                {extra.label}
                            </span>
                            <span className="font-bold text-blue-800 group-hover/item:text-blue-600 tracking-tight tabular-nums">{value}</span>
                        </div>
                    );

                    if (link && canOpen) {
                        return (
                            <a key={extra.key} href={link} target="_blank" rel="noopener noreferrer" className="block w-fit">
                                {content}
                            </a>
                        );
                    }
                    return content;
                })}
            </div>
            <div className="flex flex-wrap gap-1 mt-2 sm:mt-2.5">
                {Array.isArray(doc.tags) && doc.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[7px] sm:text-[9px] font-black uppercase tracking-tight px-1 py-0 sm:px-1.5 sm:py-0 bg-white/40 border-slate-200 text-slate-600">
                        {tag}
                    </Badge>
                ))}
            </div>
        </TableCell>
      )}
      {columnVisibility.assignedDepartment && (
        <TableCell className="text-foreground text-xs sm:text-sm font-medium py-1.5 sm:py-2 h-auto">{doc.assignedDepartment || 'N/A'}</TableCell>
      )}
      {columnVisibility.name && <TableCell className="text-foreground min-w-[300px] lg:min-w-[400px] text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
        <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="flex items-start gap-1.5 sm:gap-2">
                {isCombined && <Combine className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 shrink-0" />}
                {isSplit && <Split className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 shrink-0" />}
                <span className="font-medium whitespace-normal break-words leading-tight sm:leading-snug">{doc.name}</span>
            </div>
        </div>
      </TableCell>}
      {columnVisibility.documentType && (
        <TableCell className="text-foreground text-[10px] sm:text-xs py-1.5 sm:py-2 h-auto">{doc.documentType || 'N/A'}</TableCell>
      )}
      {columnVisibility.label && (
        <TableCell className="text-foreground text-[10px] sm:text-xs py-1.5 sm:py-2 h-auto">{doc.label || 'N/A'}</TableCell>
      )}
      {columnVisibility.currentStatus && (
        <TableCell className="py-1.5 sm:py-2 h-auto">
          <Badge className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 font-bold shadow-sm" variant={getStatusBadgeVariant(doc.status, doc.isDelayed, doc.releaseDateReached)}>
            {getStatusText(doc)}
          </Badge>
        </TableCell>
      )}
      {columnVisibility.lastUpdate && (
        <TableCell className="text-foreground text-[10px] sm:text-xs font-medium tabular-nums py-1.5 sm:py-2 h-auto">{format(new Date(doc.lastUpdate), 'dd.MM.yyyy')}</TableCell>
      )}
      {columnVisibility.actions && (
        <TableCell className="py-1.5 sm:py-2 h-auto text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-white/40">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px] sm:min-w-[180px] backdrop-blur-md bg-white/80 text-[11px] sm:text-[13px]">
                    {hasPermission(currentUser, 'canViewLog') && (
                        <DropdownMenuItem onClick={() => handleAction('viewLog', doc.id, doc.firestoreId)} className="text-blue-600 font-semibold py-1.5 sm:py-2">
                            <FileText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('viewLog')}
                        </DropdownMenuItem>
                    )}
                    
                    {!isTerminal && canEditDetails && (
                        <DropdownMenuItem onClick={() => handleAction('editDocument', doc.id, doc.firestoreId)} className="text-green-800 py-1.5 sm:py-2">
                            <Pencil className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('editDetails')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canSplitDocument') && (
                        <DropdownMenuItem onClick={() => handleAction('splitDocument', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <Split className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('splitDocument')}
                        </DropdownMenuItem>
                    )}
                    
                    {!isTerminal && hasPermission(currentUser, 'canDelayDocument') && !doc.isDelayed && (
                        <DropdownMenuItem onClick={() => handleAction('delayDocument', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <Clock className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('delay')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canReleaseDocument') && doc.isDelayed && (
                        <DropdownMenuItem onClick={() => handleAction('releaseDocument', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <Play className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />{t('releaseNow')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canEditCurrentNote') && (
                        <DropdownMenuItem className="text-destructive py-1.5 sm:py-2" onClick={() => handleAction('addNote', doc.id, doc.firestoreId)}>
                            <FilePlus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('addNote')}
                        </DropdownMenuItem>
                    )}
                    
                    {(hasPermission(currentUser, 'canMoveDocumentAdvance') || hasPermission(currentUser, 'canMoveDocumentBack') || hasPermission(currentUser, 'canCompleteDocument')) && !isTerminal && <DropdownMenuSeparator />}
                    
                    {!isTerminal && hasPermission(currentUser, 'canMoveDocumentBack') && Array.isArray(doc.history) && doc.history.length > 1 && (
                        <DropdownMenuItem onClick={() => handleAction('back', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <Undo2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('moveBack')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canMoveDocumentAdvance') && (
                        <DropdownMenuItem onClick={() => handleAction('advanceDocument', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <Redo2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('advance')}
                        </DropdownMenuItem>
                    )}
                    
                    {!isTerminal && hasPermission(currentUser, 'canCompleteDocument') && (
                         <DropdownMenuItem onClick={() => handleAction('completeDocument', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-400" />{t('complete')}
                        </DropdownMenuItem>
                    )}

                    {isTerminal && hasPermission(currentUser, 'canMoveDocumentBack') && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction('back', doc.id, doc.firestoreId)} className="py-1.5 sm:py-2">
                                <Undo2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"/>{t('reopen')}
                            </DropdownMenuItem>
                        </>
                    )}
                    
                    {hasPermission(currentUser, 'canDeleteDocument') && !isCombinedOrSplit && (
                        <>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-destructive py-1.5 sm:py-2" onClick={() => handleAction('deleteDocument', doc.id, doc.firestoreId)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{t('deleteDocument')}
                           </DropdownMenuItem>
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  )
}
