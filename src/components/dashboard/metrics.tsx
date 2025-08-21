
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { isDocumentExceedingPeriod } from '@/lib/document-utils';
import type { Document } from '@/lib/types';

const MetricCard = ({ title, value, filter, icon, valueColorClass = 'text-primary', documents }: { title: string; value: number | string; filter: string; icon?: React.ReactNode; valueColorClass?: string; documents: Document[] }) => {
  const { state, dispatch } = useAppContext()
  const isActive = state.filter.mainFilter === filter

  const handleClick = () => {
    // First, set the main filter for the table
    dispatch({ type: 'SET_FILTER', payload: { mainFilter: filter, departmentSpecificFilter: 'All' } })
    // Then, open the chat bar with the relevant documents
    dispatch({ type: 'OPEN_CHAT_BAR', payload: { title, documents } })
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
  const { state, filteredDocs } = useAppContext()

  const metrics = useMemo(() => {
    const docs = filteredDocs;

    const activeDocs = docs.filter(d => d.status !== 'Combined' && d.status !== 'Split')
    const inProgressDocs = activeDocs.filter(d => !d.isDelayed && !d.status.startsWith('Completed'))
    const delayedDocs = activeDocs.filter(d => d.isDelayed && !d.releaseDateReached)
    const releaseReachedDocs = activeDocs.filter(d => d.releaseDateReached)
    const completedSuccessDocs = activeDocs.filter(d => d.status === 'Completed (Success)')
    const completedUnsuccessDocs = activeDocs.filter(d => d.status === 'Completed (Unsuccess)')
    const completedDocs = [...completedSuccessDocs, ...completedUnsuccessDocs]

    const exceedingDocs = docs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit));

    return {
      total: { value: activeDocs.length, docs: activeDocs },
      inProgress: { value: inProgressDocs.length, docs: inProgressDocs },
      delayed: { value: delayedDocs.length, docs: delayedDocs },
      releaseReached: { value: releaseReachedDocs.length, docs: releaseReachedDocs },
      completed: { value: completedDocs.length, docs: completedDocs },
      completedSuccess: { value: completedSuccessDocs.length, docs: completedSuccessDocs },
      completedUnsuccess: { value: completedUnsuccessDocs.length, docs: completedUnsuccessDocs },
      exceeding: { value: exceedingDocs.length, docs: exceedingDocs },
    }
  }, [filteredDocs, state.filter.periodValue, state.filter.periodUnit])

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {metricItems.map((item) => (
          <MetricCard
            key={item.title}
            title={item.title}
            value={item.metric.value}
            filter={item.filter}
            icon={item.icon}
            valueColorClass={item.valueColorClass}
            documents={item.metric.docs}
          />
        ))}
      </div>
    </section>
  )
}
