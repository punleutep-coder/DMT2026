'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'

const isDocumentExceedingPeriod = (doc: any, value: number, unit: string) => {
  let thresholdInMs = 0;
  switch (unit) {
      case 'minutes': thresholdInMs = value * 60 * 1000; break;
      case 'hours': thresholdInMs = value * 60 * 60 * 1000; break;
      case 'days': thresholdInMs = value * 24 * 60 * 60 * 1000; break;
      default: return false;
  }

  const now = new Date().getTime();
  if (!doc.status.startsWith('Completed') && doc.status !== 'Combined' && doc.status !== 'Split' && !doc.isDelayed) {
      const lastHistoryEntry = doc.history[doc.history.length - 1];
      if (lastHistoryEntry && lastHistoryEntry.end === null) {
          const startTime = new Date(lastHistoryEntry.start).getTime();
          const duration = now - startTime;
          return duration > thresholdInMs;
      }
  }
  return false;
}


const MetricCard = ({ title, value, filter, icon }: { title: string; value: number | string; filter: string; icon?: React.ReactNode }) => {
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
        <div className="text-4xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function Metrics() {
  const { state } = useAppContext()

  const metrics = useMemo(() => {
    const activeDocs = state.documents.filter(d => d.status !== 'Combined' && d.status !== 'Split')
    const inProgress = activeDocs.filter(d => !d.isDelayed && !d.status.startsWith('Completed')).length
    const delayed = activeDocs.filter(d => d.isDelayed && !d.releaseDateReached).length
    const releaseReached = activeDocs.filter(d => d.releaseDateReached).length
    const completedSuccess = activeDocs.filter(d => d.status === 'Completed (Success)').length
    const completedUnsuccess = activeDocs.filter(d => d.status === 'Completed (Unsuccess)').length
    const totalCompleted = completedSuccess + completedUnsuccess

    // Exceeding period calculation is always global for its metric box
    const exceedingCount = state.documents.filter(doc => isDocumentExceedingPeriod(doc, 3, 'days')).length;


    return {
      total: activeDocs.length,
      inProgress,
      delayed,
      releaseReached,
      completed: totalCompleted,
      completedSuccess,
      completedUnsuccess,
      exceeding: exceedingCount,
    }
  }, [state.documents])

  const metricItems = [
    { title: 'Total Documents', value: metrics.total, filter: 'All' },
    { title: 'In Progress', value: metrics.inProgress, filter: 'In Progress' },
    { title: 'Delayed', value: metrics.delayed, filter: 'Delayed' },
    { title: 'Release Reached', value: metrics.releaseReached, filter: 'Release Date Reached' },
    { title: 'Completed', value: metrics.completed, filter: 'Completed' },
    { title: 'Completed (Success)', value: metrics.completedSuccess, filter: 'Completed (Success)' },
    { title: 'Completed (Unsuccess)', value: metrics.completedUnsuccess, filter: 'Completed (Unsuccess)' },
    { title: 'Exceeding Period', value: metrics.exceeding, filter: 'Exceeding Period', icon: <Clock className="h-5 w-5 text-muted-foreground" /> },
  ]

  return (
    <section className="glassmorphic-card">
      <h2 className="text-2xl font-bold text-foreground mb-6">System Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {metricItems.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={item.value}
            filter={item.filter}
            icon={item.icon}
          />
        ))}
      </div>
    </section>
  )
}
