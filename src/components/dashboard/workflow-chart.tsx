
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
import { useTranslation } from '@/lib/i18n'
import { hasDepartmentPermission } from '@/lib/permissions'

export default function WorkflowChart() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const { departments, filter, departmentColors, currentUser, lastViewedDepartments } = state
  const t = useTranslation();

  const chartData = useMemo(() => {
    // Use filteredDocs to make the chart dynamic
    const activeDocs = filteredDocs.filter(d => d.status !== 'Combined' && d.status !== 'Split');
    
    // Filter departments based on user permissions
    const accessibleDepartments = departments.filter(dept => hasDepartmentPermission(currentUser, dept));

    const now = new Date().getTime();
    const recentThreshold = now - (2 * 60 * 60 * 1000); // Documents moved in within the last 2 hours are potentially "New"

    const counts = accessibleDepartments.map(dept => {
      const docsInDept = activeDocs.filter(doc => doc.status === dept);
      
      const lastViewedTime = lastViewedDepartments[dept] ? new Date(lastViewedDepartments[dept]).getTime() : 0;

      const hasRecentArrival = docsInDept.some(doc => {
        if (!doc.history || doc.history.length === 0) return false;
        const lastEntry = doc.history[doc.history.length - 1];
        if (!lastEntry || lastEntry.end) return false;
        
        const arrivalTime = new Date(lastEntry.start).getTime();
        // It's "New" if it arrived within 2 hours AND after the user last clicked/viewed this department bar
        return arrivalTime > recentThreshold && arrivalTime > lastViewedTime;
      });

      return {
        name: dept.replace('Department ', ''),
        fullName: dept,
        total: docsInDept.length,
        isNew: hasRecentArrival && docsInDept.length > 0
      };
    });

    return counts;

  }, [filteredDocs, departments, currentUser, lastViewedDepartments])

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const departmentName = data.activePayload[0].payload.fullName
      
      // Mark department as viewed to clear the "NEW" sign
      dispatch({ type: 'MARK_DEPARTMENT_VIEWED', payload: departmentName });

      // Preserve the 'Exceeding Period' filter if it's active
      const newMainFilter = filter.mainFilter === 'Exceeding Period' ? 'Exceeding Period' : 'All';
      dispatch({ type: 'SET_FILTER', payload: { departmentSpecificFilter: departmentName, mainFilter: newMainFilter }})
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-[18px] text-[#000066] font-body [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]">{t('workflowStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 50, right: 20, bottom: 60, left: 0 }}>
             <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.2)" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#000000"
              fontSize={16}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={100}
              className="font-body"
            />
            <YAxis
              stroke="#000000"
              fontSize={16}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(10, Math.ceil((dataMax * 1.2) / 5) * 5)]} // Dynamic Y-axis
              className="font-body"
            />
             <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    fontFamily: 'inherit'
                }}
                cursor={{ fill: 'hsla(var(--primary) / 0.1)' }}
                itemStyle={{ fontFamily: 'inherit' }}
                labelStyle={{ fontFamily: 'inherit', fontWeight: 'bold' }}
             />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              filter="url(#shadow)"
            >
              {chartData.map((entry, index) => {
                const color = departmentColors[entry.fullName] || 'hsl(var(--chart-4))';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
              <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={25} fontWeight="bold" className="font-body" offset={10} />
              <LabelList 
                dataKey="isNew" 
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (!value) return null;
                  return (
                    <g className="animate-pulse">
                      <rect 
                        x={x + width / 2 - 25} 
                        y={y - 55} 
                        width={50} 
                        height={24} 
                        rx={12} 
                        fill="#ef4444" 
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                      />
                      <text 
                        x={x + width / 2} 
                        y={y - 39} 
                        fill="#ffffff" 
                        fontSize={11} 
                        fontWeight="900" 
                        textAnchor="middle"
                        style={{ pointerEvents: 'none', letterSpacing: '0.5px' }}
                      >
                        NEW
                      </text>
                    </g>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
