
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
  Cell,
} from 'recharts'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAppContext } from '@/hooks/use-app-context'
import { useMemo } from 'react'

export default function WorkflowChart() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { departments } = state

  const chartData = useMemo(() => {
    // Use filteredDocs to make the chart dynamic
    const activeDocs = filteredDocs.filter(d => d.status !== 'Combined' && d.status !== 'Split');
    
    const counts = departments.map(dept => ({
      name: dept.replace('Department ', ''),
      fullName: dept,
      total: activeDocs.filter(doc => doc.status === dept).length,
    }));

    return counts;

  }, [filteredDocs, departments])

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const departmentName = data.activePayload[0].payload.fullName
      dispatch({ type: 'SET_FILTER', payload: { departmentSpecificFilter: departmentName, mainFilter: 'All' }})
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-[#000066]" style={{fontFamily: "'Khmer OS Battambang', serif", fontSize: '18px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>ស្ថានភាពលំហូឯកសារ</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 20, right: 20, bottom: 60, left: 0 }}>
             <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.2)" />
              </filter>
            </defs>
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
              domain={[0, (dataMax: number) => Math.max(10, Math.ceil((dataMax * 1.2) / 5) * 5)]} // Dynamic Y-axis
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
              radius={[4, 4, 0, 0]}
              filter="url(#shadow)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'ឯកសារសម្រេច' ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-4))'} />
              ))}
              <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={14} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
