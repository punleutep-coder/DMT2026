
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { isDocumentExceedingPeriod } from '@/lib/document-utils';

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

  const metricItems = [
    { title: 'Total Documents', filter: 'All', metric: metrics.total, valueColorClass: 'text-blue-400' },
    { title: 'In Progress', filter: 'In Progress', metric: metrics.inProgress, valueColorClass: 'text-yellow-400' },
    { title: 'Delayed', filter: 'Delayed', metric: metrics.delayed, valueColorClass: 'text-yellow-400' },
    { title: 'Release Date Reached', filter: 'Release Date Reached', metric: metrics.releaseReached, valueColorClass: 'text-red-500' },
    { title: 'Completed', filter: 'Completed', metric: metrics.completed, valueColorClass: 'text-green-400' },
    { title: 'Completed (Success)', filter: 'Completed (Success)', metric: metrics.completedSuccess, valueColorClass: 'text-green-400' },
    { title: 'Completed (Unsuccess)', filter: 'Completed (Unsuccess)', metric: metrics.completedUnsuccess, valueColorClass: 'text-red-500' },
    { title: 'Exceeding Period', filter: 'Exceeding Period', metric: metrics.exceeding, icon: <Clock className="h-5 w-5 text-muted-foreground" />, valueColorClass: 'text-orange-400' },
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
