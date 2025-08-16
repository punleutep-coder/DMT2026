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
import { db } from '@/lib/firebase'
import { collection, doc, writeBatch, setDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function DocumentManagement() {
  const { state, dispatch } = useAppContext()
  const { currentUser, filteredDocs } = state
  const { toast } = useToast()

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
  
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const importedData = JSON.parse(result);
                
                dispatch({
                    type: 'SET_DIALOG',
                    payload: {
                        isOpen: true,
                        title: 'Confirm Import',
                        message: 'This will overwrite existing data with the content of the JSON file. This action cannot be undone. Are you sure you want to proceed?',
                        onConfirm: async () => {
                            try {
                                const batch = writeBatch(db);
                                // Note: This is a destructive import. We don't delete old data, but new data will get new IDs.
                                // For a true "overwrite", you'd need to delete all existing documents first, which is risky.
                                
                                if (importedData.documents && Array.isArray(importedData.documents)) {
                                    importedData.documents.forEach((document: any) => {
                                        const { firestoreId, ...docData } = document; // Exclude old firestoreId
                                        const docRef = doc(collection(db, "documents"));
                                        batch.set(docRef, docData);
                                    });
                                }
                                if (importedData.logs && Array.isArray(importedData.logs)) {
                                    importedData.logs.forEach((log: any) => {
                                        const { firestoreId, ...logData } = log;
                                        const logRef = doc(collection(db, "logs"));
                                        batch.set(logRef, logData);
                                    });
                                }
                                if (importedData.users && Array.isArray(importedData.users)) {
                                    importedData.users.forEach((user: any) => {
                                      // Security: Passwords cannot be imported this way.
                                      // We import the user structure, but an admin must reset the password.
                                      const { firestoreId, passwordHash, ...userData } = user;
                                      const userRef = doc(collection(db, "users"));
                                      batch.set(userRef, { ...userData, passwordHash: 'imported-user-requires-reset' });
                                    });
                                }
                                
                                await batch.commit();

                                // Non-batched writes for single-doc configs
                                if (importedData.departments && Array.isArray(importedData.departments)) {
                                    await setDoc(doc(db, "app-config", "departments"), { list: importedData.departments });
                                }
                                if (importedData.columnVisibility && typeof importedData.columnVisibility === 'object') {
                                    await setDoc(doc(db, "app-config", "columnVisibility"), importedData.columnVisibility);
                                }


                                toast({ title: "Success", description: "Data imported successfully from JSON file." });
                            } catch(e) {
                                console.error("Error importing data to Firestore: ", e);
                                toast({ title: "Error", description: "Failed to import data. Check the console for details.", variant: 'destructive' });
                            }
                        }
                    }
                })
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to parse JSON file.", variant: 'destructive' });
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
            {isFiltered && <span className="text-base font-normal text-muted-foreground ml-2">({filteredDocs.length} results)</span>}
          </h2>
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
