
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

export default function Dashboard() {
  const { state } = useAppContext()
  const { currentUser } = state

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
      </div>
      {state.dialog.isOpen && <ConfirmDialog />}
      {state.modal.type && <ModalManager />}
    </SidebarProvider>
  )
}
