
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { isDocumentExceedingPeriod } from '@/lib/document-utils';
import { useTranslation } from '@/lib/i18n'

const MetricCard = ({ title, value, filter, icon, valueColorClass = 'text-primary' }: { title: string; value: number | string; filter: string; icon?: React.ReactNode; valueColorClass?: string; }) => {
  const { state, dispatch } = useAppContext()
  const isActive = state.filter.mainFilter === filter

  const handleClick = () => {
    dispatch({ type: 'SET_FILTER', payload: { mainFilter: filter, departmentSpecificFilter: 'All' } })
  }

  return (
    <Card
      className={`dashboard-metric-box ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold ${valueColorClass}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

export default function Metrics() {
  const { metrics } = useAppContext()
  const t = useTranslation()

  const metricItems = [
    { title: t('totalDocuments'), filter: 'All', metric: metrics.total, valueColorClass: 'text-[#000066]' },
    { title: t('inProgress'), filter: 'In Progress', metric: metrics.inProgress, valueColorClass: 'text-[#000066]' },
    { title: t('delayed'), filter: 'Delayed', metric: metrics.delayed, valueColorClass: 'text-[#000066]' },
    { title: t('releaseDateReached'), filter: 'Release Date Reached', metric: metrics.releaseReached, valueColorClass: 'text-red-500' },
    { title: t('completed'), filter: 'Completed', metric: metrics.completed, valueColorClass: 'text-green-400' },
    { title: t('completedSuccess'), filter: 'Completed (Success)', metric: metrics.completedSuccess, valueColorClass: 'text-green-400' },
    { title: t('completedUnsuccess'), filter: 'Completed (Unsuccess)', metric: metrics.completedUnsuccess, valueColorClass: 'text-red-500' },
    { title: t('exceedingPeriod'), filter: 'Exceeding Period', metric: metrics.exceeding, icon: <Clock className="h-5 w-5 text-muted-foreground" />, valueColorClass: 'text-orange-400' },
  ]

  return (
    <section>
      <div className="grid gap-4 grid-cols-4">
        {metricItems.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={item.metric}
            filter={item.filter}
            icon={item.icon}
            valueColorClass={item.valueColorClass}
          />
        ))}
      </div>
    </section>
  )
}
