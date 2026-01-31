'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Document } from '@/lib/types'
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
        dispatch({ type: 'ADD_LOG', payload: { id: `log-${Date.now()}`, firestoreId: `log-${Date.now()}`, docId: doc.id, oldStatus: t('delayed'), newStatus: doc.status, user: currentUser!.username, timestamp: new Date().toISOString(), reason: 'Document manually released from delay.' } });

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
        dispatch({ type: 'ADD_LOG', payload: { id: `log-${Date.now()}`, firestoreId: `log-${Date.now()}`, docId, oldStatus: doc.status, newStatus, user: currentUser!.username, timestamp: new Date().toISOString(), reason: 'Moved back to previous step.' } });
      }
    } else {
        dispatch({ type: 'SET_MODAL', payload: { type, docId, firestoreId }})
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
      'canEditDocumentLink1', 'canEditDocumentLink2', 'canEditDocumentLink3', 'canEditDocumentLink4', 
      'canEditAssignedDepartment'
  ];
  const canEditDetails = editPermissions.some(p => hasPermission(currentUser, p as any));

  return (
    <TableRow
      data-state={isSelected && 'selected'}
      className={`fade-in-row ${doc.justReleased ? 'row-highlight' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {columnVisibility.select && (
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={handleSelect} />
        </TableCell>
      )}
      {columnVisibility.documentId && (
        <TableCell>
            <div className="text-foreground">{doc.id}</div>
            {doc.secondaryId && <div className="text-xs text-muted-foreground">Sec: {doc.secondaryId}</div>}
            {doc.tertiaryId && <div className="text-xs text-muted-foreground">Ter: {doc.tertiaryId}</div>}
            {doc.quaternaryId && <div className="text-xs text-muted-foreground">Qua: {doc.quaternaryId}</div>}
            <div className="flex flex-wrap gap-1 mt-2">
                {Array.isArray(doc.tags) && doc.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs whitespace-nowrap">{tag}</Badge>)}
            </div>
        </TableCell>
      )}
      {columnVisibility.assignedDepartment && (
        <TableCell className="text-foreground">{doc.assignedDepartment || 'N/A'}</TableCell>
      )}
      {columnVisibility.name && <TableCell className="text-foreground">
        <div className="flex items-center gap-2">
            {isCombined && <Combine className="h-5 w-5 text-blue-500" title="Combined Document" />}
            {isSplit && <Split className="h-5 w-5 text-purple-500" title="Split Document" />}
            <span>{doc.name}</span>
        </div>
      </TableCell>}
      {columnVisibility.documentType && (
        <TableCell className="text-foreground">{doc.documentType || 'N/A'}</TableCell>
      )}
      {columnVisibility.label && (
        <TableCell className="text-foreground">{doc.label || 'N/A'}</TableCell>
      )}
      {columnVisibility.currentStatus && (
        <TableCell>
          <Badge variant={getStatusBadgeVariant(doc.status, doc.isDelayed, doc.releaseDateReached)}>
            {getStatusText(doc)}
          </Badge>
        </TableCell>
      )}
      {columnVisibility.lastUpdate && (
        <TableCell className="text-foreground">{format(new Date(doc.lastUpdate), 'dd.MM.yyyy')}</TableCell>
      )}
      {columnVisibility.actions && (
        <TableCell>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {hasPermission(currentUser, 'canViewLog') && (
                        <DropdownMenuItem onClick={() => handleAction('viewLog', doc.id, doc.firestoreId)} className="text-blue-600">
                            <FileText className="mr-2 h-4 w-4" />{t('viewLog')}
                        </DropdownMenuItem>
                    )}
                    
                    {Array.isArray(doc.documentLink) && doc.documentLink.map((link, i) => (
                        hasPermission(currentUser, `canOpenDocumentLink${i+1}` as any) && link ?
                        <DropdownMenuItem key={i} asChild>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                                <FileSymlink className="mr-2 h-4 w-4"/>
                                {t(`docLink${i + 1}` as any, { defaultValue: `Open Link ${i+1}` })}
                            </a>
                        </DropdownMenuItem> : null
                    ))}

                    {!isTerminal && canEditDetails && (
                        <DropdownMenuItem onClick={() => handleAction('editDocument', doc.id, doc.firestoreId)} className="text-green-800">
                            <Pencil className="mr-2 h-4 w-4" />{t('editDetails')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canSplitDocument') && (
                        <DropdownMenuItem onClick={() => handleAction('splitDocument', doc.id, doc.firestoreId)}>
                            <Split className="mr-2 h-4 w-4" />{t('splitDocument')}
                        </DropdownMenuItem>
                    )}
                    
                    {!isTerminal && hasPermission(currentUser, 'canDelayDocument') && !doc.isDelayed && (
                        <DropdownMenuItem onClick={() => handleAction('delayDocument', doc.id, doc.firestoreId)}>
                            <Clock className="mr-2 h-4 w-4" />{t('delay')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canReleaseDocument') && doc.isDelayed && (
                        <DropdownMenuItem onClick={() => handleAction('releaseDocument', doc.id, doc.firestoreId)}>
                            <Play className="mr-2 h-4 w-4 text-yellow-400" />{t('releaseNow')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canEditCurrentNote') && (
                        <DropdownMenuItem className="text-destructive" onClick={() => handleAction('addNote', doc.id, doc.firestoreId)}>
                            <FilePlus className="mr-2 h-4 w-4" />{t('addNote')}
                        </DropdownMenuItem>
                    )}
                    
                    {(hasPermission(currentUser, 'canMoveDocument') || hasPermission(currentUser, 'canCompleteDocument')) && !isTerminal && <DropdownMenuSeparator />}
                    
                    {!isTerminal && hasPermission(currentUser, 'canMoveDocument') && Array.isArray(doc.history) && doc.history.length > 1 && (
                        <DropdownMenuItem onClick={() => handleAction('back', doc.id, doc.firestoreId)}>
                            <Undo2 className="mr-2 h-4 w-4" />{t('moveBack')}
                        </DropdownMenuItem>
                    )}

                    {!isTerminal && hasPermission(currentUser, 'canMoveDocument') && (
                        <DropdownMenuItem onClick={() => handleAction('advanceDocument', doc.id, doc.firestoreId)}>
                            <Redo2 className="mr-2 h-4 w-4" />{t('advance')}
                        </DropdownMenuItem>
                    )}
                    
                    {!isTerminal && hasPermission(currentUser, 'canCompleteDocument') && (
                         <DropdownMenuItem onClick={() => handleAction('completeDocument', doc.id, doc.firestoreId)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-teal-400" />{t('complete')}
                        </DropdownMenuItem>
                    )}

                    {isTerminal && hasPermission(currentUser, 'canMoveDocument') && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction('back', doc.id, doc.firestoreId)}>
                                <Undo2 className="mr-2 h-4 w-4"/>{t('reopen')}
                            </DropdownMenuItem>
                        </>
                    )}
                    
                    {hasPermission(currentUser, 'canDeleteDocument') && !isCombinedOrSplit && (
                        <>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-destructive" onClick={() => handleAction('deleteDocument', doc.id, doc.firestoreId)}>
                                <Trash2 className="mr-2 h-4 w-4" />{t('deleteDocument')}
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
