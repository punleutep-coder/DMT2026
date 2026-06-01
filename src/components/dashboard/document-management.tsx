
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
  PencilLine,
  CheckCircle,
  FilePlus,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { AppState } from '@/lib/types'
import { db } from '@/lib/firebase'
import { ref, set } from 'firebase/database'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function DocumentManagement() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { currentUser, selectedDocIds } = state
  const { toast } = useToast()
  const t = useTranslation();

  const openModal = (type: any) => {
    const viewMap: {[key: string]: AppState['currentView']} = {
      'addDocument': 'addDocument',
      'addUser': 'userManagement',
      'reporting': 'reporting',
      'editDocument': 'editDocument',
      'splitDocument': 'splitDocument',
      'advanceDocument': 'advanceDocument',
      'delayDocument': 'delayDocument',
      'completeDocument': 'completeDocument',
      'combineDocuments': 'combineDocuments',
      'addNote': 'addNote',
      'viewLog': 'viewLog',
      'bulkAdvance': 'bulkAdvance',
      'bulkComplete': 'bulkComplete',
      'bulkEditDetails': 'bulkEditDetails'
    };

    if (viewMap[type]) {
      dispatch({ type: 'SET_VIEW', payload: viewMap[type] });
    } else {
      dispatch({ type: 'SET_MODAL', payload: { type } })
    }
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
                  
                  if (importedData.documents) {
                    const sanitizedDocuments: { [key: string]: any } = {};
                    for (const key in importedData.documents) {
                      const sanitizedKey = sanitizeFirebaseKey(key);
                      sanitizedDocuments[sanitizedKey] = importedData.documents[key];
                    }
                    importedData.documents = sanitizedDocuments;
                  }

                  set(ref(db), importedData).then(() => {
                    toast({ title: t('success'), description: 'Data imported successfully.' })
                  }).catch(error => {
                     console.error('Error during import:', error)
                     toast({
                       title: t('error'),
                       description: 'Failed to import data to Firebase.',
                       variant: 'destructive',
                       action: <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
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

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All' || state.filter.mainFilter !== 'All' || state.filter.departmentSpecificFilter !== 'All';

  return (
    <section className="glassmorphic-card space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight">
            {t('documentManagement')}
          </h2>
          {isFiltered && <span className="text-sm font-medium text-muted-foreground hidden sm:inline">({filteredDocs.length} {t('results')})</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {hasPermission(currentUser, 'canAddDocument') && (
          <Button onClick={() => openModal('addDocument')} size="sm" className="bg-[#000066] hover:bg-[#000099] text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
            <FilePlus className="w-3.5 h-3.5 mr-1.5" /> {t('addDocument')}
          </Button>
        )}
        {hasPermission(currentUser, 'canMoveDocumentAdvance') && (
          <Button onClick={() => openModal('bulkAdvance')} disabled={state.selectedDocIds.length === 0} size="sm" className="bg-green-700 hover:bg-green-800 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
            <Redo2 className="w-3.5 h-3.5 mr-1.5" /> {t('bulkAdvance')}
          </Button>
        )}
        {hasPermission(currentUser, 'canEditDocumentName') && (
            <Button onClick={() => openModal('bulkEditDetails')} disabled={state.selectedDocIds.length === 0} size="sm" className="bg-orange-700 hover:bg-orange-800 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <PencilLine className="w-3.5 h-3.5 mr-1.5" /> {t('bulkEdit')}
            </Button>
        )}
        {hasPermission(currentUser, 'canCompleteDocument') && (
            <Button onClick={() => openModal('bulkComplete')} disabled={state.selectedDocIds.length === 0} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {t('bulkComplete')}
            </Button>
        )}
        {hasPermission(currentUser, 'canCombineDocuments') && (
          <Button onClick={() => openModal('combineDocuments')} disabled={state.selectedDocIds.length < 2} size="sm" className="bg-blue-900 hover:bg-blue-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
            <Combine className="w-3.5 h-3.5 mr-1.5" /> {t('combineSelected')}
          </Button>
        )}
        {hasPermission(currentUser, 'canDeleteDocument') && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={state.selectedDocIds.length === 0}
            className="shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t('deleteSelected')}
          </Button>
        )}
        
        {currentUser?.role === 'Admin' && (
          <>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageDepartments')} className="bg-indigo-900 hover:bg-indigo-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <Library className="w-3.5 h-3.5 mr-1.5" /> {t('manageWorkflowDepts')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageDocumentTypes')} className="bg-cyan-900 hover:bg-cyan-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <FileDigit className="w-3.5 h-3.5 mr-1.5" /> {t('manageDocTypes')}
            </Button>
             <Button variant="secondary" size="sm" onClick={() => openModal('manageLabels')} className="bg-rose-900 hover:bg-rose-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <Tags className="w-3.5 h-3.5 mr-1.5" /> {t('manageLabels')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageReceivers')} className="bg-orange-800 hover:bg-orange-900 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <Users2 className="w-3.5 h-3.5 mr-1.5" /> {t('manageReceivers')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('manageAssignedDepartments')} className="bg-teal-900 hover:bg-teal-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <FileCog className="w-3.5 h-3.5 mr-1.5" /> {t('manageAssignedDepts')}
            </Button>
          </>
        )}
        
        {hasPermission(currentUser, 'canManageColumns') && (
            <Button variant="secondary" size="sm" onClick={() => openModal('manageColumns')} className="bg-purple-900 hover:bg-purple-950 text-white shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl transition-all active:scale-95 text-xs">
                <Columns className="w-3.5 h-3.5 mr-1.5" /> {t('manageColumns')}
            </Button>
        )}
         {hasPermission(currentUser, 'canExportData') && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport} className="shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl hover:bg-black/5 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> {t('exportData')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => openModal('exportXLSX')} disabled={state.selectedDocIds.length === 0} className="shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl hover:bg-black/5 text-xs">
                <FileOutput className="w-3.5 h-3.5 mr-1.5" /> Export (XLSX)
              </Button>
            </>
        )}
         {currentUser?.role === 'Admin' && (
            <>
                <Button variant="outline" size="sm" onClick={handleImportClick} className="shadow-lg font-body h-8 sm:h-9 px-3 rounded-xl hover:bg-black/5 text-xs">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> {t('importData')}
                </Button>
                <input type="file" id="json-file-input" accept=".json" className="hidden" onChange={handleImportFile} />
            </>
        )}
      </div>

      <SearchAndFilter />
      
      <div className="overflow-x-auto rounded-xl border border-gray-400/50 bg-white/20 backdrop-blur-sm">
        <DocumentTable />
      </div>
    </section>
  )
}
