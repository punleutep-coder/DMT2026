
'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import DashboardSidebar from './sidebar'
import DashboardHeader from './header'
import Metrics from './metrics'
import WorkflowChart from './workflow-chart'
import DocumentManagement from './document-management'
import { useAppContext } from '@/hooks/use-app-context'
import ConfirmDialog from '../modals/confirm-dialog'
import ModalManager from '../modals/modal-manager'
import { Skeleton } from '../ui/skeleton'
import { hasPermission } from '@/lib/permissions'
import { Button } from '../ui/button'
import { FilePlus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function Dashboard() {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state
  const t = useTranslation();

  const openModal = (type: any) => {
    dispatch({ type: 'SET_MODAL', payload: { type } })
  }

  if (!state.isInitialized) {
    return (
        <div className="w-full h-screen bg-background flex items-center justify-center p-8">
            <div className="w-full max-w-lg text-center space-y-4">
                <Skeleton className="h-10 w-2/3 mx-auto" />
                <Skeleton className="h-8 w-full" />
                <p className="text-lg text-muted-foreground animate-pulse">Initializing application, please wait...</p>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="relative flex min-h-svh flex-1 flex-col bg-transparent">
        <DashboardHeader />
        <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
          {hasPermission(currentUser, 'canViewMetrics') && <Metrics />}
          {hasPermission(currentUser, 'canViewWorkflowChart') && (
            <div className="glassmorphic-card">
              <WorkflowChart />
            </div>
          )}
          <DocumentManagement />
        </main>
        {hasPermission(currentUser, 'canAddDocument') && (
          <div
            onClick={() => openModal('addDocument')}
            className="fixed bottom-6 right-6 z-50 cursor-pointer"
            title={t('addDocument')}
          >
            <div className="loader relative flex items-center justify-center">
              <FilePlus className="absolute h-10 w-10 text-white/80" style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }} />
              <svg width="100" height="100" viewBox="0 0 100 100">
                <defs>
                  <mask id="clipping">
                    <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                    <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                    <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                  </mask>
                </defs>
              </svg>
              <div className="box"></div>
            </div>
          </div>
        )}
      </div>
      {state.dialog.isOpen && <ConfirmDialog />}
      {state.modal.type && <ModalManager />}
    </SidebarProvider>
  )
}
