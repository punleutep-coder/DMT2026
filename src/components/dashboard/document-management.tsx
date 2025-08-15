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
  const { state, dispatch } = useAppContext()
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


  return (
    <section className="glassmorphic-card space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Document Management
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasPermission(currentUser, 'canAddDocument') && (
          <Button onClick={() => openModal('addDocument')} className="bg-[#14a39a] hover:bg-[#14a39a]/90 text-white">
            <FilePlus /> Add New Document
          </Button>
        )}
        {hasPermission(currentUser, 'canCombineDocuments') && (
          <Button onClick={() => openModal('combineDocuments')} disabled={state.selectedDocIds.length < 2} className="bg-[#2c6e63] hover:bg-[#2c6e63]/90 text-white">
            <Combine /> Combine Selected
          </Button>
        )}
        {currentUser?.role === 'Admin' && (
            <Button variant="secondary" onClick={() => openModal('manageDepartments')} className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white">
                <Library /> Manage Departments
            </Button>
        )}
        {hasPermission(currentUser, 'canManageColumns') && (
            <Button variant="secondary" onClick={() => openModal('manageColumns')} className="bg-[#8a4baf] hover:bg-[#8a4baf]/90 text-white">
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
