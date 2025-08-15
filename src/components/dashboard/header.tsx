'use client'

import { SidebarTrigger } from '../ui/sidebar'
import { Menu } from 'lucide-react'

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-8">
      <SidebarTrigger className="md:hidden bg-primary/20 text-primary hover:bg-primary/30 h-10 w-10">
        <Menu />
      </SidebarTrigger>
      <div className="text-center md:text-left flex-1">
        <h1 className="text-3xl font-bold text-foreground">
          DocuFlow
        </h1>
        <p className="text-sm text-muted-foreground hidden md:block">
          A real-time overview of your document tracking system.
        </p>
      </div>
    </header>
  )
}
