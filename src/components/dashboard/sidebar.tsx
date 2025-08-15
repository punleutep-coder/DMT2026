'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Home,
  Users,
  LogOut,
  Palette,
  FileCog,
  FileJson,
  FileText,
  Combine,
  Columns,
} from 'lucide-react'
import { useAppContext } from '@/hooks/use-app-context'

export default function DashboardSidebar() {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  const openUserManagement = () => {
    dispatch({ type: 'SET_MODAL', payload: { type: 'addUser' } })
  }
  
  if (!currentUser) return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Palette className="size-8 text-primary" />
          <h2 className="text-2xl font-bold text-primary">DocuFlow</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Dashboard" isActive>
              <Home />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {currentUser.role === 'Admin' && (
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="User Management" onClick={openUserManagement}>
                <Users />
                <span>User Management</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <div className="text-center text-muted-foreground text-sm mb-4">
            Logged in as:{' '}
            <strong className="text-primary">{currentUser.username}</strong> (
            {currentUser.role})
          </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} variant="outline">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
