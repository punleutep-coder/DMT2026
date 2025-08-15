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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '../ui/button'
import { ListFilter, SearchX } from 'lucide-react'

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
  const { state, dispatch, filteredDocs } = useAppContext()
  const { columnVisibility, selectedDocIds } = state

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
