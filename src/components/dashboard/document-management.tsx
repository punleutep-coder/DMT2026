
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
  Trash2,
  FileDigit,
  FileCog,
  FileOutput,
  Redo2,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import { ref, set } from 'firebase/database'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function DocumentManagement() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { currentUser, selectedDocIds } = state
  const { toast } = useToast()
  const t = useTranslation();

  const openModal = (type: any, docId?: string, firestoreId?: string) => {
    dispatch({ type: 'SET_MODAL', payload: { type, docId, firestoreId } })
  }
  
  const handleImportClick = () => {
    const fileInput = document.getElementById('json-file-input')
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = e.target?.result
        if (typeof result === 'string') {
          const importedData = JSON.parse(result)

          dispatch({
            type: 'SET_DIALOG',
            payload: {
              isOpen: true,
              title: t('importData'),
              message:
                'This will ERASE all current data and replace it with the content of the JSON file. This action cannot be undone. Are you sure you want to proceed?',
              onConfirm: () => {
                try {
                  toast({ title: "Importing...", description: "Please wait while we import your data." });
                  
                  // Sanitize document keys before setting them in Firebase
                  if (importedData.documents) {
                    const sanitizedDocuments: { [key: string]: any } = {};
                    for (const key in importedData.documents) {
                      const sanitizedKey = sanitizeFirebaseKey(key);
                      sanitizedDocuments[sanitizedKey] = importedData.documents[key];
                    }
                    importedData.documents = sanitizedDocuments;
                  }

                  // Instead of dispatching, we write directly to Firebase
                  set(ref(db), importedData).then(() => {
                    toast({ title: t('success'), description: 'Data imported successfully.' })
                  }).catch(error => {
                     console.error('Error during import:', error)
                     toast({
                       title: t('error'),
                       description: 'Failed to import data to Firebase.',
                       variant: 'destructive',
                     })
                  });
                } catch (error) {
                  console.error('Error during import:', error)
                  toast({
                    title: t('error'),
                    description: 'Failed to import data.',
                    variant: 'destructive',
                  })
                }
              },
            },
          })
        }
      } catch (error) {
        console.error(error)
        toast({
          title: t('error'),
          description: 'Failed to parse JSON file.',
          variant: 'destructive',
        })
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleExport = async () => {
     try {
      toast({ title: "Exporting...", description: "Gathering data." });

      const dataToExport = {
        documents: state.documents.reduce((acc, doc) => ({ ...acc, [doc.id]: { ...doc, id: undefined } }), {}),
        logs: state.logs.reduce((acc, log) => ({ ...acc, [log.id]: { ...log, id: undefined } }), {}),
        users: state.users.reduce((acc, user) => ({ ...acc, [user.id]: { ...user, id: undefined } }), {}),
        departments: state.departments,
        documentTypes: state.documentTypes,
        assignedDepartments: state.assignedDepartments,
        columnVisibility: state.columnVisibility,
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docuflow_export_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Complete", description: "Your data has been downloaded." });

    } catch (error) {
      console.error("Failed to export data:", error);
      toast({ title: t('error'), description: "Could not export data.", variant: "destructive" });
    }
  }

  const handleDeleteSelected = () => {
    dispatch({
      type: 'SET_DIALOG',
      payload: {
        isOpen: true,
        title: t('deleteXDocuments', { count: selectedDocIds.length }),
        message: t('areYouSureDelete', { count: selectedDocIds.length }),
        confirmText: t('deleteSelected'),
        onConfirm: () => {
          dispatch({ type: 'DELETE_SELECTED_DOCUMENTS', payload: selectedDocIds });
          toast({ title: t('success'), description: t('documentsDeleted', { count: selectedDocIds.length }) });
        },
      },
    })
  }

  const processFlowButtons = useMemo(() => {
    const buttons = [
        { label: t('all'), filter: 'All' },
        ...state.departments.map(dept => ({ label: dept.replace('Department ', ''), filter: dept})),
        { label: 'Completed', filter: 'Completed' }
    ];
    return buttons;
  }, [state.departments, t]);


  const handleProcessFlowClick = (filterValue: string) => {
    if (filterValue === 'Completed') {
        dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'Completed', departmentSpecificFilter: 'All' }})
    } else {
        dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'All', departmentSpecificFilter: filterValue }})
    }
  }
  
  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All' || state.filter.mainFilter !== 'All' || state.filter.departmentSpecificFilter !== 'All';

  return (
    <section className="glassmorphic-card space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground" style={{fontFamily: "'Khmer OS Battambang', serif", fontSize: '18px'}}>
            {t('documentManagement')}
            {isFiltered && <span className="text-base font-normal text-muted-foreground ml-2">({filteredDocs.length} {t('results')})</span>}
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasPermission(currentUser, 'canMoveDocument') && (
          <Button onClick={() => openModal('bulkAdvance')} disabled={state.selectedDocIds.length === 0} className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Redo2 /> {t('bulkAdvance')}
          </Button>
        )}
        {hasPermission(currentUser, 'canCombineDocuments') && (
          <Button onClick={() => openModal('combineDocuments')} disabled={state.selectedDocIds.length < 2} className="bg-blue-800 hover:bg-blue-800/90 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Combine /> {t('combineSelected')}
          </Button>
        )}
        {hasPermission(currentUser, 'canDeleteDocument') && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={state.selectedDocIds.length === 0}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Trash2 /> {t('deleteSelected')}
          </Button>
        )}
        {currentUser?.role === 'Admin' && (
          <>
            <Button variant="secondary" onClick={() => openModal('manageDepartments')} className="bg-indigo-800 hover:bg-indigo-800/90 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Library /> {t('manageWorkflowDepts')}
            </Button>
            <Button variant="secondary" onClick={() => openModal('manageDocumentTypes')} className="bg-cyan-800 hover:bg-cyan-800/90 text-white shadow-lg hover:shadow-xl transition-shadow">
                <FileDigit /> {t('manageDocTypes')}
            </Button>
            <Button variant="secondary" onClick={() => openModal('manageAssignedDepartments')} className="bg-teal-800 hover:bg-teal-800/90 text-white shadow-lg hover:shadow-xl transition-shadow">
                <FileCog /> {t('manageAssignedDepts')}
            </Button>
          </>
        )}
        {hasPermission(currentUser, 'canManageColumns') && (
            <Button variant="secondary" onClick={() => openModal('manageColumns')} className="bg-purple-800 hover:bg-purple-800/90 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Columns /> {t('manageColumns')}
            </Button>
        )}
         {hasPermission(currentUser, 'canExportData') && (
            <>
              <Button variant="outline" onClick={handleExport} className="shadow-lg hover:shadow-xl transition-shadow">
                  <Download /> {t('exportData')}
              </Button>
              <Button variant="outline" onClick={() => openModal('exportXLSX')} disabled={state.selectedDocIds.length === 0} className="shadow-lg hover:shadow-xl transition-shadow">
                <FileOutput /> Export (XLSX)
              </Button>
            </>
        )}
         {currentUser?.role === 'Admin' && (
            <>
                <Button variant="outline" onClick={handleImportClick} className="shadow-lg hover:shadow-xl transition-shadow">
                    <Upload /> {t('importData')}
                </Button>
                <input type="file" id="json-file-input" accept=".json" className="hidden" onChange={handleImportFile} />
            </>
        )}
      </div>

      <SearchAndFilter />
      
      <div className="overflow-x-auto rounded-lg border-2 border-gray-400/50 dark:border-gray-600/50">
        <DocumentTable />
      </div>
    </section>
  )
}
