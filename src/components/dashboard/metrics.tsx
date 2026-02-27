
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileStack, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Timer 
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const MetricCard = ({ 
  title, 
  value, 
  filter, 
  icon: Icon, 
  baseColor = 'blue'
}: { 
  title: string; 
  value: number | string; 
  filter: string; 
  icon: any; 
  baseColor: 'blue' | 'teal' | 'amber' | 'red' | 'green' | 'emerald' | 'rose' | 'orange';
}) => {
  const { state, dispatch } = useAppContext()
  const isActive = state.filter.mainFilter === filter

  const handleClick = () => {
    dispatch({ type: 'SET_FILTER', payload: { mainFilter: filter, departmentSpecificFilter: 'All' } })
  }

  const colorMap = {
    blue: { text: 'text-[#000066]', bg: 'bg-[#000066]/10', accent: 'bg-[#000066]' },
    teal: { text: 'text-teal-600', bg: 'bg-teal-600/10', accent: 'bg-teal-600' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-600/10', accent: 'bg-amber-600' },
    red: { text: 'text-red-600', bg: 'bg-red-600/10', accent: 'bg-red-600' },
    green: { text: 'text-green-600', bg: 'bg-green-600/10', accent: 'bg-green-600' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600/10', accent: 'bg-emerald-600' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-600/10', accent: 'bg-rose-600' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-600/10', accent: 'bg-orange-600' },
  };

  const colors = colorMap[baseColor];

  return (
    <Card
      className={cn(
        "dashboard-metric-box relative overflow-hidden group border border-gray-600 transition-all duration-500",
        isActive && "active"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-1.5 sm:p-4 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-1 sm:mb-3">
          <div className="space-y-0 sm:space-y-1 overflow-hidden">
            <p 
              className="text-[9px] sm:text-sm font-bold uppercase tracking-tight sm:tracking-wide text-[#000099] leading-[1.1] sm:leading-normal truncate sm:whitespace-normal font-body"
              title={title}
            >
              {title}
            </p>
            <h3 className={cn("text-xs sm:text-3xl font-black tabular-nums", colors.text)}>
              {value}
            </h3>
          </div>
          <div className={cn(
            "p-0.5 sm:p-2.5 rounded-md sm:rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
            colors.bg
          )}>
            <Icon className={cn("h-3 w-3 sm:h-6 sm:w-6", colors.text)} />
          </div>
        </div>
        
        {/* Decorative Progress Bar */}
        <div className="w-full h-0.5 sm:h-1.5 bg-black/5 rounded-full overflow-hidden mt-auto">
          <div 
            className={cn("h-full transition-all duration-1000 ease-in-out", colors.accent)} 
            style={{ width: isActive ? '100%' : '30%' }}
          />
        </div>
      </CardContent>
      
      {/* Background Glow */}
      <div className={cn(
        "absolute -bottom-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full",
        colors.accent
      )} />
    </Card>
  )
}

export default function Metrics() {
  const { metrics } = useAppContext()
  const t = useTranslation()

  const metricItems = [
    { 
      title: t('totalDocuments'), 
      filter: 'All', 
      metric: metrics.total, 
      icon: FileStack,
      baseColor: 'blue' as const
    },
    { 
      title: t('inProgress'), 
      filter: 'In Progress', 
      metric: metrics.inProgress, 
      icon: Activity,
      baseColor: 'teal' as const
    },
    { 
      title: t('delayed'), 
      filter: 'Delayed', 
      metric: metrics.delayed, 
      icon: Clock,
      baseColor: 'amber' as const
    },
    { 
      title: t('releaseDateReached'), 
      filter: 'Release Date Reached', 
      metric: metrics.releaseReached, 
      icon: AlertCircle,
      baseColor: 'red' as const
    },
    { 
      title: t('completed'), 
      filter: 'Completed', 
      metric: metrics.completed, 
      icon: CheckCircle2,
      baseColor: 'green' as const
    },
    { 
      title: t('completedSuccess'), 
      filter: 'Completed (Success)', 
      metric: metrics.completedSuccess, 
      icon: ShieldCheck,
      baseColor: 'emerald' as const
    },
    { 
      title: t('completedUnsuccess'), 
      filter: 'Completed (Unsuccess)', 
      metric: metrics.completedUnsuccess, 
      icon: ShieldAlert,
      baseColor: 'rose' as const
    },
    { 
      title: t('exceedingPeriod'), 
      filter: 'Exceeding Period', 
      metric: metrics.exceeding, 
      icon: Timer,
      baseColor: 'orange' as const
    },
  ]

  return (
    <section>
      <div className="grid gap-1 sm:gap-3 grid-cols-4">
        {metricItems.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={item.metric}
            filter={item.filter}
            icon={item.icon}
            baseColor={item.baseColor}
          />
        ))}
      </div>
    </section>
  )
}
