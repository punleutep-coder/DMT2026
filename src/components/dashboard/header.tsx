'use client'

import { SidebarTrigger } from '../ui/sidebar'
import { Menu } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function DashboardHeader() {
  const t = useTranslation();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/20 bg-transparent px-4 backdrop-blur-sm sm:px-8 shadow-md">
      <SidebarTrigger className="md:flex bg-transparent text-[#000066] hover:bg-primary/10 h-10 w-10">
        <Menu />
      </SidebarTrigger>
      <div className="text-left flex-1">
        <h1 className="text-[25px] font-bold text-[#000066] font-moul [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]">
          {t('overview')}
        </h1>
      </div>
    </header>
  )
}
