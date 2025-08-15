'use client'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo } from 'react'

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

export default function WorkflowChart() {
  const { state, dispatch } = useAppContext()
  const { documents, filter, departments } = state

  const chartData = useMemo(() => {
    let baseDocsForChart = documents;
    if (filter.mainFilter !== 'All') {
        if (filter.mainFilter === 'Exceeding Period') {
            baseDocsForChart = baseDocsForChart.filter(doc => isDocumentExceedingPeriod(doc, 3, 'days'));
        } else if (filter.mainFilter === 'In Progress') {
            baseDocsForChart = baseDocsForChart.filter(d => !d.isDelayed && !d.status.startsWith('Completed') && d.status !== 'Combined' && d.status !== 'Split');
        } else if (filter.mainFilter === 'Delayed') {
            baseDocsForChart = baseDocsForChart.filter(d => d.isDelayed && !d.releaseDateReached);
        } else if (filter.mainFilter === 'Release Date Reached') {
            baseDocsForChart = baseDocsForChart.filter(d => d.releaseDateReached);
        } else if (filter.mainFilter.startsWith('Completed')) {
            baseDocsForChart = baseDocsForChart.filter(d => d.status.startsWith('Completed'));
        }
    }

    if (filter.mainFilter !== 'Combined' && filter.mainFilter !== 'Split') {
        baseDocsForChart = baseDocsForChart.filter(doc => doc.status !== 'Combined' && doc.status !== 'Split');
    }

    const counts = departments.map(dept => ({
      name: dept.replace('Department ', ''),
      fullName: dept,
      total: baseDocsForChart.filter(doc => doc.status === dept).length,
    }));

    return counts;

  }, [documents, filter, departments])

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const department = data.activePayload[0].payload.fullName
      dispatch({ type: 'SET_FILTER', payload: { ...state.filter, departmentSpecificFilter: department }})
    }
  }

  return (
    <Card className="glassmorphic-card">
      <CardHeader>
        <CardTitle>Workflow Status</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} onClick={handleBarClick}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
            />
             <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                }}
                cursor={{ fill: 'hsla(var(--primary) / 0.1)' }}
             />
            <Bar
              dataKey="total"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
