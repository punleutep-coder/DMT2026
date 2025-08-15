'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import DashboardSidebar from './sidebar'
import DashboardHeader from './header'
import AnimatedBackground from '../ui/animated-background'
import Metrics from './metrics'
import WorkflowChart from './workflow-chart'
import DocumentManagement from './document-management'
import { useAppContext } from '@/hooks/use-app-context'
import ConfirmDialog from '../modals/confirm-dialog'
import ModalManager from '../modals/modal-manager'

export default function Dashboard() {
  const { state } = useAppContext()
  return (
    <SidebarProvider>
      <AnimatedBackground />
      <DashboardSidebar />
      <div className="relative flex min-h-svh flex-1 flex-col bg-background/80 backdrop-blur-sm">
        <DashboardHeader />
        <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
          <Metrics />
          <WorkflowChart />
          <DocumentManagement />
        </main>
      </div>
      {state.dialog.isOpen && <ConfirmDialog />}
      {state.modal.type && <ModalManager />}
    </SidebarProvider>
  )
}
