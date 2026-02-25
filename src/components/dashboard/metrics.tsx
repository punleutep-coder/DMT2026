
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  valueColorClass = 'text-[#000066]',
  accentColorClass = 'bg-primary'
}: { 
  title: string; 
  value: number | string; 
  filter: string; 
  icon: any; 
  valueColorClass?: string;
  accentColorClass?: string;
}) => {
  const { state, dispatch } = useAppContext()
  const isActive = state.filter.mainFilter === filter

  const handleClick = () => {
    dispatch({ type: 'SET_FILTER', payload: { mainFilter: filter, departmentSpecificFilter: 'All' } })
  }

  return (
    <Card
      className={cn(
        "dashboard-metric-box relative overflow-hidden group",
        isActive && "active"
      )}
      onClick={handleClick}
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full", accentColorClass)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg bg-background/50 group-hover:scale-110 transition-transform duration-300", valueColorClass.replace('text-', 'text-'))}>
           <Icon className={cn("h-4 w-4", valueColorClass)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-black tracking-tight", valueColorClass)}>{value}</div>
      </CardContent>
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
      valueColorClass: 'text-[#000066]',
      accentColorClass: 'bg-[#000066]'
    },
    { 
      title: t('inProgress'), 
      filter: 'In Progress', 
      metric: metrics.inProgress, 
      icon: Activity,
      valueColorClass: 'text-teal-600',
      accentColorClass: 'bg-teal-600'
    },
    { 
      title: t('delayed'), 
      filter: 'Delayed', 
      metric: metrics.delayed, 
      icon: Clock,
      valueColorClass: 'text-amber-600',
      accentColorClass: 'bg-amber-600'
    },
    { 
      title: t('releaseDateReached'), 
      filter: 'Release Date Reached', 
      metric: metrics.releaseReached, 
      icon: AlertCircle,
      valueColorClass: 'text-red-600',
      accentColorClass: 'bg-red-600'
    },
    { 
      title: t('completed'), 
      filter: 'Completed', 
      metric: metrics.completed, 
      icon: CheckCircle2,
      valueColorClass: 'text-green-600',
      accentColorClass: 'bg-green-600'
    },
    { 
      title: t('completedSuccess'), 
      filter: 'Completed (Success)', 
      metric: metrics.completedSuccess, 
      icon: ShieldCheck,
      valueColorClass: 'text-emerald-600',
      accentColorClass: 'bg-emerald-600'
    },
    { 
      title: t('completedUnsuccess'), 
      filter: 'Completed (Unsuccess)', 
      metric: metrics.completedUnsuccess, 
      icon: ShieldAlert,
      valueColorClass: 'text-rose-600',
      accentColorClass: 'bg-rose-600'
    },
    { 
      title: t('exceedingPeriod'), 
      filter: 'Exceeding Period', 
      metric: metrics.exceeding, 
      icon: Timer,
      valueColorClass: 'text-orange-600',
      accentColorClass: 'bg-orange-600'
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
            valueColorClass={item.valueColorClass}
            accentColorClass={item.accentColorClass}
          />
        ))}
      </div>
    </section>
  )
}
