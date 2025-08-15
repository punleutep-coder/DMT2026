'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo } from 'react'
import DocumentTableRow from './document-table-row'
import { Checkbox } from '../ui/checkbox'
import { hasDepartmentPermission } from '@/lib/permissions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '../ui/button'
import { ListFilter, SearchX } from 'lucide-react'
import type { Document } from '@/lib/types'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'

const EmptyState = () => {
    const { dispatch } = useAppContext();
    const handleClearFilter = () => {
        dispatch({ type: 'SET_FILTER', payload: {
            mainFilter: 'All',
            departmentSpecificFilter: 'All',
            search: '',
            startDate: null,
            endDate: null,
            assignedDepartment: 'All',
        }});
    }

    return (
        <TableRow>
            <TableCell colSpan={8} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                    <SearchX className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold text-foreground">No Documents Found</h3>
                    <p className="text-muted-foreground">Your current filter settings returned no results.</p>
                    <Button variant="outline" onClick={handleClearFilter}>Clear All Filters</Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function DocumentTable() {
  const { state, dispatch } = useAppContext()
  const { columnVisibility, selectedDocIds, currentUser } = state

  const filteredDocs = useMemo(() => {
    let docs = state.documents

    docs = docs.filter(doc => {
      const searchLower = state.filter.search.toLowerCase()
      const searchMatch =
        !searchLower ||
        doc.id.toLowerCase().includes(searchLower) ||
        doc.name.toLowerCase().includes(searchLower) ||
        (doc.office && doc.office.toLowerCase().includes(searchLower)) ||
        (doc.secondaryId && doc.secondaryId.toLowerCase().includes(searchLower)) ||
        (doc.tertiaryId && doc.tertiaryId.toLowerCase().includes(searchLower)) ||
        (doc.quaternaryId && doc.quaternaryId.toLowerCase().includes(searchLower)) ||
        (doc.assignedDepartment && doc.assignedDepartment.toLowerCase().includes(searchLower)) ||
        (doc.keywords && doc.keywords.toLowerCase().includes(searchLower)) ||
        doc.tags.join(', ').toLowerCase().includes(searchLower)

      let dateMatch = true
      if (state.filter.startDate && state.filter.endDate) {
        dateMatch = false
        if (doc.history && Array.isArray(doc.history)) {
          for (const entry of doc.history) {
            const entryStart = new Date(entry.start)
            const entryEnd = entry.end ? new Date(entry.end) : new Date()
            const overlap =
              entryStart <= state.filter.endDate! && entryEnd >= state.filter.startDate!
            if (overlap) {
              dateMatch = true
              break
            }
          }
        }
      }

      const assignedDeptMatch =
        state.filter.assignedDepartment === 'All' ||
        doc.assignedDepartment === state.filter.assignedDepartment
      
      return searchMatch && dateMatch && assignedDeptMatch
    })

    if (state.filter.mainFilter !== 'All') {
        if (state.filter.mainFilter === 'Exceeding Period') {
            docs = docs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit));
        } else if (state.filter.mainFilter === 'In Progress') {
            docs = docs.filter(d => !d.isDelayed && !d.status.startsWith('Completed') && d.status !== 'Combined' && d.status !== 'Split');
        } else if (state.filter.mainFilter === 'Delayed') {
            docs = docs.filter(d => d.isDelayed && !d.releaseDateReached);
        } else if (state.filter.mainFilter === 'Release Date Reached') {
            docs = docs.filter(d => d.releaseDateReached === true);
        } else if (state.filter.mainFilter === 'Completed') {
            docs = docs.filter(d => d.status.startsWith('Completed'));
        } else if (state.filter.mainFilter.startsWith('Completed (')) {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        } else if (state.filter.mainFilter === 'Combined' || state.filter.mainFilter === 'Split') {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        }
    } else {
        docs = docs.filter(doc => doc.status !== 'Combined' && doc.status !== 'Split');
    }

    if (state.filter.departmentSpecificFilter !== 'All') {
        docs = docs.filter(doc => doc.status === state.filter.departmentSpecificFilter);
    }
    
    docs = docs.filter(doc => hasDepartmentPermission(currentUser, doc.status))

    return docs
  }, [state.documents, state.filter, currentUser])

  const handleSelectAll = (checked: boolean) => {
    const ids = checked ? filteredDocs.map(d => d.id) : []
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: ids })
  }

  const uniqueAssignedDepts = useMemo(() => {
    return [...new Set(state.documents.map(d => d.assignedDepartment).filter(Boolean))].sort()
  }, [state.documents])

  const handleAssignedDeptFilterChange = (dept: string) => {
    const newDept = state.filter.assignedDepartment === dept ? 'All' : dept
    dispatch({ type: 'SET_FILTER', payload: { assignedDepartment: newDept }})
  }

  const columns = [
    { key: 'select', name: '' },
    { key: 'documentId', name: 'Document ID' },
    { key: 'department', name: 'Assigned Dept.' },
    { key: 'name', name: 'Name' },
    { key: 'office', name: 'Office' },
    { key: 'currentStatus', name: 'Current Status' },
    { key: 'lastUpdate', name: 'Last Update' },
    { key: 'actions', name: '' },
  ]
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => (
            columnVisibility[col.key] && (
              <TableHead key={col.key} className={col.key === 'actions' ? 'text-right' : ''}>
                <div className="flex items-center gap-2">
                  {col.key === 'select' ? (
                    <Checkbox
                      checked={selectedDocIds.length > 0 && selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  ) : (
                    <span>{col.name}</span>
                  )}
                  {col.key === 'department' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ListFilter className="h-4 w-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                            checked={state.filter.assignedDepartment === 'All'}
                            onCheckedChange={() => handleAssignedDeptFilterChange('All')}
                        >
                            All
                        </DropdownMenuCheckboxItem>
                        {uniqueAssignedDepts.map(dept => (
                           <DropdownMenuCheckboxItem
                                key={dept}
                                checked={state.filter.assignedDepartment === dept}
                                onCheckedChange={() => handleAssignedDeptFilterChange(dept)}
                            >
                                {dept}
                           </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableHead>
            )
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, index) => (
            <DocumentTableRow key={doc.id} doc={doc} index={index} />
          ))
        ) : (
          <EmptyState />
        )}
      </TableBody>
    </Table>
  )
}
