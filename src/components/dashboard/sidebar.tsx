'use client'
import { useState, useEffect } from 'react'
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
  FileText,
  History,
  BarChart3,
  Languages,
  Type,
  Sparkles,
} from 'lucide-react'
import { useAppContext } from '@/hooks/use-app-context'
import { hasPermission } from '@/lib/permissions'
import { useTranslation, languages } from '@/lib/i18n'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { type AppState } from '@/lib/types'
import { cn } from '@/lib/utils'

const LanguageSwitcher = () => {
    const { state, dispatch } = useAppContext();
    const { language } = state;
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Languages className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex flex-col gap-1">
                    {languages.map(lang => (
                        <Button
                            key={lang.code}
                            variant={language === lang.code ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start font-body"
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

const FontSizeSwitcher = () => {
    const { state, dispatch } = useAppContext();
    const { fontSize } = state;
    const t = useTranslation();

    const fontSizes = [
        { code: 'sm', name: t('fontSizeSmall') },
        { code: 'md', name: t('fontSizeMedium') },
        { code: 'lg', name: t('fontSizeLarge') }
    ] as const;
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('changeFontSize')}>
                    <Type className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
                <div className="flex flex-col gap-1">
                    {fontSizes.map(size => (
                        <Button
                            key={size.code}
                            variant={fontSize === size.code ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start font-body"
                            onClick={() => dispatch({ type: 'SET_FONT_SIZE', payload: size.code })}
                        >
                            {size.name}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const BackgroundSwitcher = () => {
    const [bgAnim, setBgAnim] = useState('default');

    useEffect(() => {
        const saved = localStorage.getItem('docuFlow_bgAnim') || 'default';
        setBgAnim(saved);
        applyBgClass(saved);
    }, []);

    const applyBgClass = (type: string) => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        body.classList.remove('bg-anim-orbs', 'bg-anim-fluid', 'bg-anim-particles', 'bg-anim-hue-shift');
        if (type !== 'default') {
            body.classList.add(`bg-anim-${type}`);
        }
    };

    const handleSelect = (type: string) => {
        setBgAnim(type);
        localStorage.setItem('docuFlow_bgAnim', type);
        applyBgClass(type);
    };

    const animOptions = [
        { code: 'default', name: 'Default Warm' },
        { code: 'orbs', name: 'Sunny Beach' },
        { code: 'fluid', name: 'Fluid Waves' },
        { code: 'particles', name: 'Twinkling Stars' },
        { code: 'hue-shift', name: 'Aurora Beach' }
    ] as const;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Background Style">
                    <Sparkles className="h-4 w-4 text-[#000066]" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
                <div className="flex flex-col gap-1">
                    {animOptions.map(option => (
                        <Button
                            key={option.code}
                            variant={bgAnim === option.code ? 'secondary' : 'ghost'}
                            size="sm"
                            className="justify-start font-body text-xs font-bold"
                            onClick={() => handleSelect(option.code)}
                        >
                            {option.name}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default function DashboardSidebar() {
  const { state, dispatch } = useAppContext()
  const { currentUser, currentView } = state
  const t = useTranslation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  const openModal = (type: any) => {
    const viewMap: {[key: string]: AppState['currentView']} = {
      'addDocument': 'addDocument',
      'addUser': 'userManagement',
      'reporting': 'reporting',
      'myActivityLog': 'myActivityLog',
      'globalActivityLog': 'globalActivityLog'
    };

    if (viewMap[type]) {
      dispatch({ type: 'SET_VIEW', payload: viewMap[type] });
    } else {
      dispatch({ type: 'SET_MODAL', payload: { type } })
    }
  }

  if (!currentUser) return null;

  return (
    <Sidebar className="border-r border-white/20 bg-white/40 backdrop-blur-xl">
      <SidebarHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>
          <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg shadow-primary/20">
            <Workflow className="size-5 sm:size-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl font-black text-primary font-moul leading-none">DocuFlow</h2>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground font-body">Management System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3">
        <SidebarMenu className="gap-1 sm:gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip={t('dashboard')} 
              isActive={currentView === 'dashboard' && state.filter.mainFilter === 'All' && state.filter.departmentSpecificFilter === 'All'}
              onClick={() => {
                dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
                dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'All', departmentSpecificFilter: 'All' } });
              }}
              className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
            >
              <Home className="size-4 sm:size-5" />
              <span>{t('dashboard')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('myActivity')} 
                isActive={currentView === 'myActivityLog'}
                onClick={() => openModal('myActivityLog')}
                className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
              >
                <FileText className={cn("size-4 sm:size-5 text-blue-500", currentView === 'myActivityLog' && "text-white")} />
                <span>{t('myActivity')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('reporting')} 
                isActive={currentView === 'reporting'}
                onClick={() => openModal('reporting')}
                className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
              >
                <BarChart3 className={cn("size-4 sm:size-5 text-orange-500", currentView === 'reporting' && "text-white")} />
                <span>{t('reporting')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {hasPermission(currentUser, 'canViewGlobalActivity') && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip={t('globalActivity')} 
                  isActive={currentView === 'globalActivityLog'}
                  onClick={() => openModal('globalActivityLog')}
                  className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
                >
                  <History className={cn("size-4 sm:size-5 text-purple-500", currentView === 'globalActivityLog' && "text-white")} />
                  <span>{t('globalActivity')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          {currentUser.role === 'Admin' && (
             <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip={t('userManagement')} 
                isActive={currentView === 'userManagement'}
                onClick={() => openModal('addUser')}
                className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
              >
                <Users className={cn("size-4 sm:size-5 text-green-500", currentView === 'userManagement' && "text-white")} />
                <span>{t('userManagement')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 sm:p-4 bg-primary/5 border-t border-white/20">
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-2">
          <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground font-body">{t('loggedInAs')}</span>
              <strong className="text-xs sm:text-sm text-primary font-bold font-body truncate max-w-[100px] sm:max-w-[120px]">{currentUser.username}</strong>
            </div>
             <div className="flex items-center gap-1 sm:gap-2">
               <BackgroundSwitcher />
               <FontSizeSwitcher />
               <LanguageSwitcher />
             </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              variant="outline"
              className="h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold font-body border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all duration-300 text-xs sm:text-sm"
            >
              <LogOut className="size-4 sm:size-5" />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}