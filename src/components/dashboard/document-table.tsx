
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo, useState } from 'react'
import DocumentTableRow from './document-table-row'
import { Checkbox } from '../ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '../ui/button'
import { ListFilter, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'

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
                    <p className="text-muted-foreground">Your filter settings did not match any documents.</p>
                    <Button variant="outline" onClick={handleClearFilter}>Clear All Filters</Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function DocumentTable() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { columnVisibility, selectedDocIds, pagination } = state

  const totalPages = Math.ceil(filteredDocs.length / pagination.rowsPerPage);
  const paginatedDocs = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const endIndex = startIndex + pagination.rowsPerPage;
    return filteredDocs.slice(startIndex, endIndex);
  }, [filteredDocs, pagination.currentPage, pagination.rowsPerPage]);

  const handleSelectAllOnPage = (checked: boolean) => {
    const pageIds = paginatedDocs.map(d => d.id);
    let newSelectedIds = [...selectedDocIds];
    if (checked) {
      newSelectedIds = [...new Set([...newSelectedIds, ...pageIds])];
    } else {
      newSelectedIds = newSelectedIds.filter(id => !pageIds.includes(id));
    }
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: newSelectedIds });
  };
  

  const handleSelectAllFiltered = () => {
    const ids = filteredDocs.map(d => d.id)
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: ids });
  };

  const handleDeselectAll = () => {
    dispatch({ type: 'SET_SELECTED_DOC_IDS', payload: [] });
  }
  
  const uniqueAssignedDepts = useMemo(() => {
    return [...new Set(state.documents.map(d => d.assignedDepartment).filter(Boolean))].sort()
  }, [state.documents])

  const handleAssignedDeptFilterChange = (dept: string) => {
    const newDept = state.filter.assignedDepartment === dept ? 'All' : dept
    dispatch({ type: 'SET_FILTER', payload: { assignedDepartment: newDept }})
  }

  const handleRowsPerPageChange = (value: string) => {
    dispatch({ type: 'SET_PAGINATION', payload: { rowsPerPage: parseInt(value, 10), currentPage: 1 }});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        dispatch({ type: 'SET_PAGINATION', payload: { currentPage: newPage }});
    }
  };

  const areAllOnPageSelected = paginatedDocs.length > 0 && paginatedDocs.every(doc => selectedDocIds.includes(doc.id));

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
    <>
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => (
            columnVisibility[col.key] && (
              <TableHead key={col.key} className={col.key === 'actions' ? 'text-right' : ''}>
                <div className="flex items-center gap-2">
                  {col.key === 'select' ? (
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Checkbox
                            checked={areAllOnPageSelected}
                            onCheckedChange={() => handleSelectAllOnPage(!areAllOnPageSelected)}
                            aria-label="Select all documents on this page"
                          />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => handleSelectAllOnPage(true)}>Select all on this page ({paginatedDocs.length})</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleSelectAllFiltered}>Select all matching filter ({filteredDocs.length})</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDeselectAll}>Deselect all ({selectedDocIds.length})</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        {paginatedDocs.length > 0 ? (
          paginatedDocs.map((doc, index) => (
            <DocumentTableRow key={doc.id} doc={doc} index={index} />
          ))
        ) : (
          <EmptyState />
        )}
      </TableBody>
    </Table>
    <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground">
          {state.selectedDocIds.length} of {filteredDocs.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                    value={`${pagination.rowsPerPage}`}
                    onValueChange={handleRowsPerPageChange}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pagination.rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 30, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {pagination.currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === totalPages}
                >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    </div>
    </>
  )
}
