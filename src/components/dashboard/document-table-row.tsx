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
  FileEdit,
  Split,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { format } from 'date-fns'

interface DocumentTableRowProps {
  doc: Document
  index: number
}

const getStatusBadgeVariant = (status: string, isDelayed: boolean, releaseDateReached?: boolean): 'default' | 'destructive' | 'secondary' | 'outline' => {
    if (releaseDateReached) return 'destructive'
    if (isDelayed) return 'outline'
    if (status === 'Completed (Success)') return 'default'
    if (status === 'Completed (Unsuccess)') return 'destructive'
    if (status === 'Combined' || status === 'Split') return 'secondary'
    return 'secondary'
}

const getStatusText = (doc: Document) => {
    if (doc.releaseDateReached) return "Release Date Reached!"
    if (doc.isDelayed) return `Delayed until ${format(new Date(doc.releaseDate!), 'MMM d, yyyy')}`
    return doc.status
}


export default function DocumentTableRow({ doc, index }: DocumentTableRowProps) {
  const { state, dispatch } = useAppContext()
  const { columnVisibility, selectedDocIds, currentUser } = state

  const isSelected = selectedDocIds.includes(doc.id)

  const handleSelect = (checked: boolean | 'indeterminate') => {
    const newSelectedIds = checked
      ? [...selectedDocIds, doc.id]
      : selectedDocIds.filter((id) => id !== doc.id)
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: newSelectedIds })
  }

  const handleAction = (type: any, docId: string) => {
    dispatch({ type: 'SET_MODAL', payload: { type, docId }})
  }

  const isCompleted = doc.status.startsWith('Completed');
  const isTerminal = isCompleted || doc.status === 'Combined' || doc.status === 'Split';


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
        <TableCell className="font-medium">
            <div>{doc.id}</div>
            {doc.secondaryId && <div className="text-xs text-muted-foreground">Sec: {doc.secondaryId}</div>}
            {doc.tertiaryId && <div className="text-xs text-muted-foreground">Ter: {doc.tertiaryId}</div>}
            {doc.quaternaryId && <div className="text-xs text-muted-foreground">Qua: {doc.quaternaryId}</div>}
            <div className="flex flex-wrap gap-1 mt-1">
                {doc.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
        </TableCell>
      )}
       {columnVisibility.department && (
        <TableCell>{doc.assignedDepartment || 'N/A'}</TableCell>
      )}
      {columnVisibility.name && <TableCell>{doc.name}</TableCell>}
      {columnVisibility.office && (
        <TableCell>{doc.office || 'N/A'}</TableCell>
      )}
      {columnVisibility.currentStatus && (
        <TableCell>
          <Badge variant={getStatusBadgeVariant(doc.status, doc.isDelayed, doc.releaseDateReached)}>
            {getStatusText(doc)}
          </Badge>
        </TableCell>
      )}
      {columnVisibility.lastUpdate && (
        <TableCell>{format(new Date(doc.lastUpdate), 'PPp')}</TableCell>
      )}
      {columnVisibility.actions && (
        <TableCell>
          <div className="flex items-center gap-1">
            {hasPermission(currentUser, 'canViewLog') && <Button variant="ghost" size="icon" onClick={() => handleAction('viewLog', doc.id)} title="View Log"><FileText className="h-4 w-4" /></Button>}
            {hasPermission(currentUser, 'canEditDocumentDetails') && <Button variant="ghost" size="icon" onClick={() => handleAction('editDocument', doc.id)} title="Edit Document Details"><Pencil className="h-4 w-4" /></Button>}
            
            {doc.isDelayed ? (
                <>
                 {hasPermission(currentUser, 'canReleaseDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('releaseDocument', doc.id)} title="Release Now"><Play className="h-4 w-4 text-yellow-400" /></Button>}
                </>
            ) : !isTerminal ? (
                <>
                    {hasPermission(currentUser, 'canSplitDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('splitDocument', doc.id)} title="Split Document"><Split className="h-4 w-4" /></Button>}
                    {hasPermission(currentUser, 'canDelayDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('delayDocument', doc.id)} title="Delay"><Clock className="h-4 w-4" /></Button>}
                    {hasPermission(currentUser, 'canEditCurrentNote') && <Button variant="ghost" size="icon" onClick={() => handleAction('editNote', doc.id)} title="Edit Current Note"><FileEdit className="h-4 w-4" /></Button>}
                    {hasPermission(currentUser, 'canMoveDocument') && <Button variant="ghost" size="icon" disabled={doc.history.length <= 1} onClick={() => handleAction('back', doc.id)} title="Move Back"><Undo2 className="h-4 w-4" /></Button>}
                    {hasPermission(currentUser, 'canMoveDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('advanceDocument', doc.id)} title="Advance"><Redo2 className="h-4 w-4" /></Button>}
                    {hasPermission(currentUser, 'canCompleteDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('completeDocument', doc.id)} title="Complete"><CheckCircle2 className="h-4 w-4 text-primary" /></Button>}
                </>
            ) : isCompleted ? (
                <>
                 {hasPermission(currentUser, 'canMoveDocument') && <Button variant="ghost" size="icon" onClick={() => handleAction('back', doc.id)} title="Re-open"><Undo2 className="h-4 w-4"/></Button>}
                </>
            ) : null}

            {doc.documentLink.map((link, i) => (
                hasPermission(currentUser, `canOpenDocumentLink${i+1}` as any) && link ?
                <Button key={i} asChild variant="ghost" size="icon" title={`Open Link ${i + 1}`}>
                    <a href={link} target="_blank" rel="noopener noreferrer"><FileSymlink className="h-4 w-4"/></a>
                </Button> : null
            ))}

            {hasPermission(currentUser, 'canDeleteDocument') && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleAction('deleteDocument', doc.id)} title="Delete Document"><Trash2 className="h-4 w-4" /></Button>}

          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
