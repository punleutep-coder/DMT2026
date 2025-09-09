
'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  Home,
  Users,
  LogOut,
  Workflow,
  FileCog,
  FileJson,
  FileText,
  Combine,
  Columns,
  BarChart3,
  Languages,
} from 'lucide-react'
import { useAppContext } from '@/hooks/use-app-context'
import { hasPermission } from '@/lib/permissions'
import { useTranslation, languages } from '@/lib/i18n'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

const LanguageSwitcher = () => {
    const { state, dispatch } = useAppContext();
    const { language } = state;
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex flex-col gap-1">
                    {languages.map(lang => (
                        <Button
                            key={lang.code}
                            variant={language === lang.code ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start"
                            onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: lang.code })}
                        >
                            {lang.name}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}


export default function DashboardSidebar() {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state
  const t = useTranslation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  const openModal = (type: any) => {
    dispatch({ type: 'SET_MODAL', payload: { type } })
  }

  if (!currentUser) return null;

  return (
    <Sidebar>
      <SidebarHeader className="shadow-md">
        <div className="flex items-center gap-2">
          <Workflow className="size-8 text-[#000066]" />
          <h2 className="font-bold text-[#000066]" style={{fontFamily: "'Khmer Rotanak Traiy B', serif", fontSize: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>ប្រព័ន្ធគ្រប់គ្រងឯកសារ</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip={t('dashboard')} 
              isActive={state.filter.mainFilter === 'All' && state.filter.departmentSpecificFilter === 'All'}
              onClick={() => dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'All', departmentSpecificFilter: 'All' } })}
            >
              <Home />
              <span>{t('dashboard')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('myActivity')} onClick={() => openModal('myActivityLog')}>
              <FileText />
              <span>{t('myActivity')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('reporting')} onClick={() => openModal('reporting')}>
              <BarChart3 />
              <span>{t('reporting')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {currentUser.role === 'Admin' && (
             <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('userManagement')} onClick={() => openModal('addUser')}>
                <Users />
                <span>{t('userManagement')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <div className="text-center text-muted-foreground text-sm">
              {t('loggedInAs')}:{' '}
              <strong className="text-primary">{currentUser.username}</strong>
            </div>
             <LanguageSwitcher />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} variant="outline">
              <LogOut />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
