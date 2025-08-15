'use client'

import { Button } from '@/components/ui/button'
import DocumentTable from './document-table'
import { useAppContext } from '@/hooks/use-app-context'
import SearchAndFilter from './search-and-filter'
import {
  FilePlus,
  Combine,
  Library,
  Columns,
  Download,
  Upload,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { useMemo } from 'react'

export default function DocumentManagement() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { currentUser } = state

  const openModal = (type: any, docId?: string) => {
    dispatch({ type: 'SET_MODAL', payload: { type, docId } })
  }
  
  const handleImportClick = () => {
    const fileInput = document.getElementById('json-file-input')
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: show confirm dialog
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const importedData = JSON.parse(result);
                if (importedData.departments) dispatch({ type: 'UPDATE_DEPARTMENTS', payload: importedData.departments });
                if (importedData.documents) dispatch({ type: 'UPDATE_DOCUMENTS', payload: importedData.documents });
                if (importedData.logs) dispatch({ type: 'UPDATE_LOGS', payload: importedData.logs });
                if (importedData.users) dispatch({ type: 'UPDATE_USERS', payload: importedData.users });
                if (importedData.columnVisibility) dispatch({ type: 'UPDATE_COLUMN_VISIBILITY', payload: importedData.columnVisibility });
            }
        } catch (error) {
            console.error(error);
            // TODO: show error toast
        } finally {
            event.target.value = '';
        }
    }
    reader.readAsText(file);
  }

  const handleExport = () => {
    const dataToExport = {
      documents: state.documents,
      logs: state.logs,
      departments: state.departments,
      columnVisibility: state.columnVisibility,
      users: state.users,
    }
    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document_workflow_data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const processFlowButtons = useMemo(() => {
    const buttons = [
        { label: 'All', filter: 'All' },
        ...state.departments.map(dept => ({ label: dept.replace('Department ', ''), filter: dept})),
        { label: 'Completed', filter: 'Completed' }
    ];
    return buttons;
  }, [state.departments]);


  const handleProcessFlowClick = (filterValue: string) => {
    if (filterValue === 'Completed') {
        dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'Completed', departmentSpecificFilter: 'All' }})
    } else {
        dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'All', departmentSpecificFilter: filterValue }})
    }
  }

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All';

  return (
    <section className="glassmorphic-card space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            Document Management
          </h2>
          {isFiltered && (
            <span className="text-sm text-muted-foreground font-medium">
              ({filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasPermission(currentUser, 'canAddDocument') && (
          <Button onClick={() => openModal('addDocument')} className="bg-primary/80 hover:bg-primary/90 text-white">
            <FilePlus /> Add New Document
          </Button>
        )}
        {hasPermission(currentUser, 'canCombineDocuments') && (
          <Button onClick={() => openModal('combineDocuments')} disabled={state.selectedDocIds.length < 2} className="bg-blue-800 hover:bg-blue-800/90 text-white">
            <Combine /> Combine Selected
          </Button>
        )}
        {currentUser?.role === 'Admin' && (
            <Button variant="secondary" onClick={() => openModal('manageDepartments')} className="bg-indigo-800 hover:bg-indigo-800/90 text-white">
                <Library /> Manage Departments
            </Button>
        )}
        {hasPermission(currentUser, 'canManageColumns') && (
            <Button variant="secondary" onClick={() => openModal('manageColumns')} className="bg-purple-800 hover:bg-purple-800/90 text-white">
                <Columns /> Manage Columns
            </Button>
        )}
         {hasPermission(currentUser, 'canExportData') && (
            <Button variant="outline" onClick={handleExport}>
                <Download /> Export Data (JSON)
            </Button>
        )}
         {currentUser?.role === 'Admin' && (
            <>
                <Button variant="outline" onClick={handleImportClick}>
                    <Upload /> Import Data (JSON)
                </Button>
                <input type="file" id="json-file-input" accept=".json" className="hidden" onChange={handleImportFile} />
            </>
        )}
      </div>

      <SearchAndFilter />
      
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {processFlowButtons.map(btn => {
            const isActive = state.filter.mainFilter === 'All' && state.filter.departmentSpecificFilter === btn.filter;
            const isCompletedActive = state.filter.mainFilter.startsWith('Completed') && btn.filter === 'Completed';

            return (
                <Button
                    key={btn.filter}
                    variant={(isActive || isCompletedActive) ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleProcessFlowClick(btn.filter)}
                >
                    {btn.label}
                </Button>
            )
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <DocumentTable />
      </div>
    </section>
  )
}
