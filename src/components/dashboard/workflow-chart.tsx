'use client'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  CartesianGrid,
} from 'recharts'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo } from 'react'
import { isDocumentExceedingPeriod } from '@/lib/document-utils';

export default function WorkflowChart() {
  const { state, dispatch } = useAppContext()
  const { documents, filter, departments } = state

  const chartData = useMemo(() => {
    let baseDocsForChart = documents;

    // Apply date filter
    if (filter.startDate && filter.endDate) {
        baseDocsForChart = baseDocsForChart.filter(doc => {
            if (!doc.history || doc.history.length === 0) return false;
            for (const entry of doc.history) {
                const entryStart = new Date(entry.start);
                const entryEnd = entry.end ? new Date(entry.end) : new Date();
                const overlap = entryStart <= filter.endDate! && entryEnd >= filter.startDate!;
                if (overlap) return true;
            }
            return false;
        });
    }

    if (filter.mainFilter !== 'All') {
        if (filter.mainFilter === 'Exceeding Period') {
            baseDocsForChart = baseDocsForChart.filter(doc => isDocumentExceedingPeriod(doc, filter.periodValue, filter.periodUnit));
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
    <>
      <CardHeader>
        <CardTitle>Workflow Status</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 20, right: 20, bottom: 60, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(60, dataMax + 5)]}
              ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]}
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
            >
              <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={14} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
