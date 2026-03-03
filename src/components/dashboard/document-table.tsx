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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '../ui/button'
import { ListFilter, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const EmptyState = () => {
    const { dispatch } = useAppContext();
    const t = useTranslation();
    const handleClearFilter = () => {
        dispatch({ type: 'SET_FILTER', payload: {
            mainFilter: 'All',
            departmentSpecificFilter: 'All',
            search: '',
            startDate: null,
            endDate: null,
            assignedDepartment: 'All',
            documentType: 'All',
            label: 'All',
            lastUpdateStart: null,
            lastUpdateEnd: null,
        }});
    }

    return (
        <TableRow>
            <TableCell colSpan={9} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                    <SearchX className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold text-foreground font-body">{t('noDocumentsFound')}</h3>
                    <p className="text-muted-foreground font-body">{t('filterDidNotMatch')}</p>
                    <Button variant="outline" onClick={handleClearFilter} className="font-body">{t('clearAllFilters')}</Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function DocumentTable() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { columnVisibility, selectedDocIds, pagination, documentTypes, labels } = state
  const t = useTranslation();

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

  const handleDocumentTypeFilterChange = (type: string) => {
    const newType = state.filter.documentType === type ? 'All' : type;
    dispatch({ type: 'SET_FILTER', payload: { documentType: newType } });
  }
  
  const handleLabelFilterChange = (label: string) => {
    const newLabel = state.filter.label === label ? 'All' : label;
    dispatch({ type: 'SET_FILTER', payload: { label: newLabel } });
  };

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
    { key: 'documentId', name: t('documentId') },
    { key: 'assignedDepartment', name: t('assignedDepartment') },
    { key: 'name', name: t('name') },
    { key: 'documentType', name: t('documentType') },
    { key: 'label', name: t('label') },
    { key: 'currentStatus', name: t('currentStatus') },
    { key: 'lastUpdate', name: t('lastUpdate') },
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
                      <DropdownMenuContent align="start" className="font-body">
                        <DropdownMenuItem onSelect={() => handleSelectAllOnPage(true)}>Select all on this page ({paginatedDocs.length})</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleSelectAllFiltered}>Select all matching filter ({filteredDocs.length})</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDeselectAll}>Deselect all ({selectedDocIds.length})</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="font-body text-[#000099] whitespace-nowrap">{col.name}</span>
                  )}
                   {col.key === 'documentType' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ListFilter className="h-4 w-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="font-body">
                        <DropdownMenuCheckboxItem
                            checked={state.filter.documentType === 'All'}
                            onCheckedChange={() => handleDocumentTypeFilterChange('All')}
                        >
                            {t('all')}
                        </DropdownMenuCheckboxItem>
                        {documentTypes.map(type => (
                           <DropdownMenuCheckboxItem
                                key={type}
                                checked={state.filter.documentType === type}
                                onCheckedChange={() => handleDocumentTypeFilterChange(type)}
                            >
                                {type}
                           </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {col.key === 'assignedDepartment' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ListFilter className="h-4 w-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="font-body">
                        <DropdownMenuCheckboxItem
                            checked={state.filter.assignedDepartment === 'All'}
                            onCheckedChange={() => handleAssignedDeptFilterChange('All')}
                        >
                            {t('all')}
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
                  {col.key === 'label' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ListFilter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="font-body">
                        <DropdownMenuCheckboxItem
                          checked={state.filter.label === 'All'}
                          onCheckedChange={() => handleLabelFilterChange('All')}
                        >
                          {t('all')}
                        </DropdownMenuCheckboxItem>
                        {labels.map((label) => (
                          <DropdownMenuCheckboxItem
                            key={label}
                            checked={state.filter.label === label}
                            onCheckedChange={() => handleLabelFilterChange(label)}
                          >
                            {label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {col.key === 'lastUpdate' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ListFilter className={cn("h-4 w-4", (state.filter.lastUpdateStart || state.filter.lastUpdateEnd) ? "text-blue-600" : "text-muted-foreground")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 font-body" align="end">
                        <div className="p-4 bg-muted/20 border-b">
                            <h4 className="font-medium text-sm">Filter by Last Update</h4>
                        </div>
                        <Calendar
                          initialFocus
                          mode="range"
                          selected={{
                            from: state.filter.lastUpdateStart || undefined,
                            to: state.filter.lastUpdateEnd || undefined,
                          }}
                          onSelect={(range) => {
                            dispatch({
                              type: 'SET_FILTER',
                              payload: {
                                lastUpdateStart: range?.from || null,
                                lastUpdateEnd: range?.to || null,
                              },
                            });
                          }}
                          numberOfMonths={2}
                        />
                        <div className="p-2 border-t flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => dispatch({ type: 'SET_FILTER', payload: { lastUpdateStart: null, lastUpdateEnd: null }})}
                            >
                                {t('clear')}
                            </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
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
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-t font-body">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {t('xOfYRowSelected', { selected: state.selectedDocIds.length, total: filteredDocs.length })}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium whitespace-nowrap">{t('rowsPerPage')}</p>
                <Select
                    value={`${pagination.rowsPerPage}`}
                    onValueChange={handleRowsPerPageChange}
                >
                    <SelectTrigger className="h-9 w-[70px]">
                        <SelectValue placeholder={pagination.rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top" className="font-body">
                        {[10, 30, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium whitespace-nowrap">
                {t('pageXOfY', { current: pagination.currentPage, total: totalPages })}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="h-9 w-9 p-0"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-9 w-9 p-0"
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