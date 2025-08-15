'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import type { Document } from '@/lib/types';
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
  const { state } = useAppContext()

  const metrics = useMemo(() => {
    let docs = state.documents;
    if (state.filter.startDate && state.filter.endDate) {
        docs = docs.filter(doc => {
            if (!doc.history || doc.history.length === 0) return false;
            for (const entry of doc.history) {
                const entryStart = new Date(entry.start);
                const entryEnd = entry.end ? new Date(entry.end) : new Date();
                const overlap = entryStart <= state.filter.endDate! && entryEnd >= state.filter.startDate!;
                if (overlap) return true;
            }
            return false;
        });
    }

    const activeDocs = docs.filter(d => d.status !== 'Combined' && d.status !== 'Split')
    const inProgress = activeDocs.filter(d => !d.isDelayed && !d.status.startsWith('Completed')).length
    const delayed = activeDocs.filter(d => d.isDelayed && !d.releaseDateReached).length
    const releaseReached = activeDocs.filter(d => d.releaseDateReached).length
    const completedSuccess = activeDocs.filter(d => d.status === 'Completed (Success)').length
    const completedUnsuccess = activeDocs.filter(d => d.status === 'Completed (Unsuccess)').length
    const totalCompleted = completedSuccess + completedUnsuccess

    const exceedingCount = docs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit)).length;


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
  }, [state.documents, state.filter])

  const metricItems = [
    { title: 'Total Documents', value: metrics.total, filter: 'All', valueColorClass: 'text-teal-400' },
    { title: 'In Progress', value: metrics.inProgress, filter: 'In Progress', valueColorClass: 'text-yellow-400' },
    { title: 'Delayed', value: metrics.delayed, filter: 'Delayed', valueColorClass: 'text-yellow-400' },
    { title: 'Release Date Reached', value: metrics.releaseReached, filter: 'Release Date Reached', valueColorClass: 'text-red-500' },
    { title: 'Completed', value: metrics.completed, filter: 'Completed', valueColorClass: 'text-green-400' },
    { title: 'Completed (Success)', value: metrics.completedSuccess, filter: 'Completed (Success)', valueColorClass: 'text-green-400' },
    { title: 'Completed (Unsuccess)', value: metrics.completedUnsuccess, filter: 'Completed (Unsuccess)', valueColorClass: 'text-red-500' },
    { title: 'Exceeding Period', value: metrics.exceeding, filter: 'Exceeding Period', icon: <Clock className="h-5 w-5 text-muted-foreground" />, valueColorClass: 'text-orange-400' },
  ]

  return (
    <section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {metricItems.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={item.value}
            filter={item.filter}
            icon={item.icon}
            valueColorClass={item.valueColorClass}
          />
        ))}
      </div>
    </section>
  )
}
