
'use client'

import { SidebarTrigger } from '../ui/sidebar'
import { Menu, MessageSquare, Bell } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo } from 'react'
import { hasDepartmentPermission } from '@/lib/permissions'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export default function DashboardHeader() {
  const { state, dispatch } = useAppContext();
  const { documents, departments, currentUser, lastViewedDepartments } = state;
  const t = useTranslation();

  const newArrivals = useMemo(() => {
    if (!currentUser) return [];
    
    const now = new Date().getTime();
    const recentThreshold = now - (2 * 60 * 60 * 1000);
    
    const activeDocs = documents.filter(d => d.status !== 'Combined' && d.status !== 'Split');
    const accessibleDepartments = departments.filter(dept => hasDepartmentPermission(currentUser, dept));

    const freshDepts = accessibleDepartments.filter(dept => {
        const docsInDept = activeDocs.filter(doc => doc.status === dept);
        const lastViewedTime = lastViewedDepartments[dept] ? new Date(lastViewedDepartments[dept]).getTime() : 0;

        return docsInDept.some(doc => {
            const lastEntry = doc.history[doc.history.length - 1];
            if (!lastEntry || lastEntry.end) return false;
            const arrivalTime = new Date(lastEntry.start).getTime();
            return arrivalTime > recentThreshold && arrivalTime > lastViewedTime;
        });
    });

    return freshDepts;
  }, [documents, departments, currentUser, lastViewedDepartments]);

  const handleDeptClick = (dept: string) => {
      dispatch({ type: 'MARK_DEPARTMENT_VIEWED', payload: dept });
      dispatch({ type: 'SET_FILTER', payload: { departmentSpecificFilter: dept, mainFilter: 'All' } });
  }

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b border-border/20 bg-transparent px-4 backdrop-blur-sm sm:px-8 shadow-md">
      <SidebarTrigger className="md:flex bg-transparent text-[#000066] hover:bg-primary/10 h-12 w-12">
        <Menu className="h-8 w-8" />
      </SidebarTrigger>
      
      <div className="text-left flex-1">
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#000066] font-moul [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]">
          {t('overview')}
        </h1>
      </div>

      <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
                <div className="relative cursor-pointer group">
                    <div className="p-3 rounded-full bg-white/20 hover:bg-white/40 transition-all border border-white/30">
                        <MessageSquare className="h-7 w-7 text-[#000066]" />
                    </div>
                    {newArrivals.length > 0 && (
                        <div className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white animate-pulse shadow-lg ring-2 ring-white">
                            NEW
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden glassmorphic-card" align="end">
                <div className="p-4 border-b bg-white/40 backdrop-blur-md">
                    <h3 className="font-bold text-[#000066] flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Recent Activity
                    </h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {newArrivals.length > 0 ? (
                        <div className="p-2 space-y-1">
                            {newArrivals.map(dept => (
                                <button 
                                    key={dept} 
                                    onClick={() => handleDeptClick(dept)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-white/60 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{dept}</span>
                                        <span className="text-xs text-muted-foreground">New documents received</span>
                                    </div>
                                    <Badge className="bg-red-500 text-white text-[10px]">NEW</Badge>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground italic">
                            <p className="text-sm">No fresh document movements recorded in the last 2 hours.</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
          </Popover>
      </div>
    </header>
  )
}
