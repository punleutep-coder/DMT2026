'use client'

import { Button } from '@/components/ui/button'
import DocumentTable from './document-table'
import { useAppContext } from '@/hooks/use-app-context'
import SearchAndFilter from './search-and-filter'
import {
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
  Tags,
  Users2,
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-[18px] font-bold text-foreground font-body">
            {t('documentManagement')}
          </h2>
          {isFiltered && <span className="text-base font-normal text-muted-foreground">({filteredDocs.length} {t('results')})</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasPermission(currentUser, 'canMoveDocumentAdvance') && (
          <Button onClick={() => openModal('bulkAdvance')} disabled={state.selectedDocIds.length === 0} size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
            <Redo2 className="w-4 h-4" /> {t('bulkAdvance')}
          </Button>
        )}
        {hasPermission(currentUser, 'canCombineDocuments') && (
          <Button onClick={() => openModal('combineDocuments')} disabled={state.selectedDocIds.length < 2} size="sm" className="bg-blue-800 hover:bg-blue-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
            <Combine className="w-4 h-4" /> {t('combineSelected')}
          </Button>
        )}
        {hasPermission(currentUser, 'canDeleteDocument') && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={state.selectedDocIds.length === 0}
            className="shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9"
          >
            <Trash2 className="w-4 h-4" /> {t('deleteSelected')}
          </Button>
        )}
        
        <div className="w-full h-px bg-border my-1 sm:hidden" />

        {currentUser?.role === 'Admin' && (
          <>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageDepartments')} className="bg-indigo-800 hover:bg-indigo-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <Library className="w-4 h-4" /> {t('manageWorkflowDepts')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageDocumentTypes')} className="bg-cyan-800 hover:bg-cyan-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <FileDigit className="w-4 h-4" /> {t('manageDocTypes')}
            </Button>
             <Button variant="secondary" size="sm" onClick={() => openModal('manageLabels')} className="bg-rose-800 hover:bg-rose-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <Tags className="w-4 h-4" /> {t('manageLabels')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageReceivers')} className="bg-orange-800 hover:bg-orange-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <Users2 className="w-4 h-4" /> {t('manageReceivers')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageAssignedDepartments')} className="bg-teal-800 hover:bg-teal-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <FileCog className="w-4 h-4" /> {t('manageAssignedDepts')}
            </Button>
          </>
        )}
        
        <div className="w-full h-px bg-border my-1 sm:hidden" />

        {hasPermission(currentUser, 'canManageColumns') && (
            <Button variant="secondary" size="sm" onClick={() => openModal('manageColumns')} className="bg-purple-800 hover:bg-purple-800/90 text-white shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <Columns className="w-4 h-4" /> {t('manageColumns')}
            </Button>
        )}
         {hasPermission(currentUser, 'canExportData') && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport} className="shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                  <Download className="w-4 h-4" /> {t('exportData')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => openModal('exportXLSX')} disabled={state.selectedDocIds.length === 0} className="shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                <FileOutput className="w-4 h-4" /> Export (XLSX)
              </Button>
            </>
        )}
         {currentUser?.role === 'Admin' && (
            <>
                <Button variant="outline" size="sm" onClick={handleImportClick} className="shadow-lg font-body flex-1 sm:flex-none h-11 sm:h-9">
                    <Upload className="w-4 h-4" /> {t('importData')}
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