
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
          <Button 
            onClick={() => openModal('addDocument')} 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary/80 hover:bg-primary/90 text-[#000066] shadow-2xl hover:shadow-xl transition-all duration-300 z-50 p-0 flex items-center justify-center"
            title={t('addDocument')}
          >
            <FilePlus className="h-14 w-14" />
          </Button>
        )}
      </div>
      {state.dialog.isOpen && <ConfirmDialog />}
      {state.modal.type && <ModalManager />}
    </SidebarProvider>
  )
}
