
'use client'

import { SidebarTrigger } from '../ui/sidebar'
import { Menu } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useAppContext } from '@/hooks/use-app-context'

export default function DashboardHeader() {
  const t = useTranslation();

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-4 border-b border-white/20 bg-white/40 px-4 backdrop-blur-xl sm:px-6 shadow-sm transition-all duration-300">
      <SidebarTrigger className="md:flex bg-white/50 text-primary hover:bg-primary hover:text-white h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl shadow-inner transition-all duration-300">
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </SidebarTrigger>
      
      <div className="text-left flex-1">
        <h1 className="text-lg sm:text-2xl font-black text-primary font-headline tracking-tight uppercase">
          {t('overview')}
        </h1>
      </div>
    </header>
  )
}
