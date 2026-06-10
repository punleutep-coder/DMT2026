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
    blue: { 
      text: 'text-[#000066]', 
      bg: 'bg-[#000066]/10', 
      border: 'border-[#000066]/15', 
      borderHover: 'group-hover:border-[#000066]/35',
      borderActive: 'border-[#000066]/60',
      accent: 'bg-[#000066]' 
    },
    teal: { 
      text: 'text-teal-600', 
      bg: 'bg-teal-600/10', 
      border: 'border-teal-600/15', 
      borderHover: 'group-hover:border-teal-600/35',
      borderActive: 'border-teal-600/60',
      accent: 'bg-teal-600' 
    },
    amber: { 
      text: 'text-amber-600', 
      bg: 'bg-amber-600/10', 
      border: 'border-amber-600/15', 
      borderHover: 'group-hover:border-amber-600/35',
      borderActive: 'border-amber-600/60',
      accent: 'bg-amber-600' 
    },
    red: { 
      text: 'text-red-600', 
      bg: 'bg-red-600/10', 
      border: 'border-red-600/15', 
      borderHover: 'group-hover:border-red-600/35',
      borderActive: 'border-red-600/60',
      accent: 'bg-red-600' 
    },
    green: { 
      text: 'text-green-600', 
      bg: 'bg-green-600/10', 
      border: 'border-green-600/15', 
      borderHover: 'group-hover:border-green-600/35',
      borderActive: 'border-green-600/60',
      accent: 'bg-green-600' 
    },
    emerald: { 
      text: 'text-emerald-600', 
      bg: 'bg-emerald-600/10', 
      border: 'border-emerald-600/15', 
      borderHover: 'group-hover:border-emerald-600/35',
      borderActive: 'border-emerald-600/60',
      accent: 'bg-emerald-600' 
    },
    rose: { 
      text: 'text-rose-600', 
      bg: 'bg-rose-600/10', 
      border: 'border-rose-600/15', 
      borderHover: 'group-hover:border-rose-600/35',
      borderActive: 'border-rose-600/60',
      accent: 'bg-rose-600' 
    },
    orange: { 
      text: 'text-orange-600', 
      bg: 'bg-orange-600/10', 
      border: 'border-orange-600/15', 
      borderHover: 'group-hover:border-orange-600/35',
      borderActive: 'border-orange-600/60',
      accent: 'bg-orange-600' 
    },
  };

  const colors = colorMap[baseColor];

  return (
    <Card
      className={cn(
        "dashboard-metric-box relative overflow-hidden group border transition-all duration-500 rounded-xl min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]",
        isActive 
          ? cn("active", colors.borderActive) 
          : cn(colors.border, colors.borderHover)
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 sm:p-5 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="space-y-1 overflow-hidden flex-1">
            <p 
              className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-tight text-[#000099] leading-tight font-body"
              title={title}
            >
              {title}
            </p>
            <h3 className={cn("text-2xl sm:text-3xl lg:text-5xl font-black tabular-nums font-body", colors.text)}>
              {value}
            </h3>
          </div>
          <div className={cn(
            "p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner shrink-0",
            colors.bg
          )}>
            <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10", colors.text)} />
          </div>
        </div>
        
        <div className="w-full h-1 sm:h-1.5 bg-black/5 rounded-full overflow-hidden mt-auto">
          <div 
            className={cn("h-full transition-all duration-1000 ease-in-out", colors.accent)} 
            style={{ width: isActive ? '100%' : '30%' }}
          />
        </div>
      </CardContent>
      
      <div className={cn(
        "absolute -bottom-16 -right-16 w-32 h-32 blur-[40px] transition-opacity duration-500 rounded-full",
        isActive ? "opacity-35" : "opacity-0 group-hover:opacity-20",
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
