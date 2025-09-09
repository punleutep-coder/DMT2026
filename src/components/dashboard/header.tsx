
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
        <h1 className="text-2xl font-bold text-[#000066]" style={{fontFamily: "'Khmer Moul', serif", fontSize: '25px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>
          {t('overview')}
        </h1>
      </div>
    </header>
  )
}
