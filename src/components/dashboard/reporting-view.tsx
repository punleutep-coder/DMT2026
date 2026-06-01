'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppContext } from '@/hooks/use-app-context'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { CalendarIcon, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

type ReportData = {
  [department: string]: {
    totalDocs: number
    docTypes: {
      [type: string]: number
    }
  }
}

export default function ReportingView() {
  const { state, dispatch } = useAppContext()
  const { documents } = state
  const t = useTranslation()
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [fromTime, setFromTime] = useState('00:00')
  const [toTime, setToTime] = useState('23:59')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [filteredDocsForReport, setFilteredDocsForReport] = useState<Document[]>([])

  const handleSetDateRange = (period: 'today' | 'week' | 'month') => {
    const now = new Date()
    let from: Date, to: Date
    if (period === 'today') {
      from = startOfDay(now)
      to = endOfDay(now)
    } else if (period === 'week') {
      from = startOfWeek(now)
      to = endOfWeek(now)
    } else {
      // month
      from = startOfMonth(now)
      to = endOfMonth(now)
    }
    setDateRange({ from, to })
    setFromTime('00:00')
    setToTime('23:59')
  }

  const generateReport = () => {
    if (!dateRange.from || !dateRange.to) {
      console.log('Please select a date range.')
      return
    }

    const combinedFrom = new Date(dateRange.from);
    const [fH, fM] = fromTime.split(':').map(Number);
    combinedFrom.setHours(fH || 0, fM || 0, 0, 0);

    const combinedTo = new Date(dateRange.to);
    const [tH, tM] = toTime.split(':').map(Number);
    combinedTo.setHours(tH || 23, tM || 59, 59, 999);

    const filteredDocs = documents.filter((doc) => {
      const docDate = new Date(doc.history[0]?.start || doc.lastUpdate)
      return docDate >= combinedFrom && docDate <= combinedTo
    })
    setFilteredDocsForReport(filteredDocs)

    const data = filteredDocs.reduce<ReportData>((acc, doc) => {
      const dept = doc.assignedDepartment || 'Unassigned'
      const type = doc.documentType || 'No Type'

      if (!acc[dept]) {
        acc[dept] = { totalDocs: 0, docTypes: {} }
      }

      acc[dept].totalDocs += 1
      acc[dept].docTypes[type] = (acc[dept].docTypes[type] || 0) + 1

      return acc
    }, {})

    setReportData(data)
  }
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const documentType = data.activePayload[0].payload.name;
      dispatch({ 
        type: 'SET_FILTER', 
        payload: { 
          documentType, 
          mainFilter: 'All', 
          departmentSpecificFilter: 'All',
          assignedDepartment: 'All',
          search: '',
          startDate: null,
          endDate: null,
        }
      });
      dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    }
  }

  const handleTableRowClick = (department: string, documentType: string) => {
    dispatch({
      type: 'SET_FILTER',
      payload: {
        documentType: documentType === 'No Type' ? 'All' : documentType,
        assignedDepartment: department === 'Unassigned' ? 'All' : department,
        mainFilter: 'All',
        departmentSpecificFilter: 'All',
        search: '',
        startDate: null,
        endDate: null
      }
    });
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  };

  const clearReport = () => {
    setDateRange({})
    setFromTime('00:00')
    setToTime('23:59')
    setReportData(null)
    setFilteredDocsForReport([])
  }
  
  const sortedDepartments = useMemo(() => {
    if (!reportData) return [];
    return Object.keys(reportData).sort();
  }, [reportData]);

  const reportTotals = useMemo(() => {
    if (!reportData) return { 
        totalDocs: 0, 
        totalTypes: 0, 
        typesBreakdown: {}, 
        totalCombined: 0,
        totalSplit: 0,
        combinedTypesBreakdown: {},
        splitTypesBreakdown: {},
        chartData: []
    };

    let totalDocs = 0;
    const typesBreakdown: { [key: string]: number } = {};

    Object.values(reportData).forEach(deptData => {
      totalDocs += deptData.totalDocs;
      Object.entries(deptData.docTypes).forEach(([type, count]) => {
        typesBreakdown[type] = (typesBreakdown[type] || 0) + count;
      });
    });
    
    const sortedTypesBreakdown = Object.entries(typesBreakdown).sort(([a], [b]) => a.localeCompare(b));
    
    const combinedDocs = filteredDocsForReport.filter(d => d.combinedFrom && d.combinedFrom.length > 0);
    const splitDocs = filteredDocsForReport.filter(d => d.splitFrom);
    
    const combinedTypesBreakdown = combinedDocs.reduce((acc, doc) => {
        const type = doc.documentType || 'No Type';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as {[key:string]: number});

    const splitTypesBreakdown = splitDocs.reduce((acc, doc) => {
        const type = doc.documentType || 'No Type';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as {[key:string]: number});
    
    const chartData = sortedTypesBreakdown.map(([name, count]) => ({ name, count }));

    return { 
        totalDocs, 
        totalTypes: Object.keys(typesBreakdown).length,
        typesBreakdown: Object.fromEntries(sortedTypesBreakdown),
        totalCombined: combinedDocs.length,
        totalSplit: splitDocs.length,
        combinedTypesBreakdown: Object.fromEntries(Object.entries(combinedTypesBreakdown).sort(([a], [b]) => a.localeCompare(b))),
        splitTypesBreakdown: Object.fromEntries(Object.entries(splitTypesBreakdown).sort(([a], [b]) => a.localeCompare(b))),
        chartData
    };
  }, [reportData, filteredDocsForReport]);

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 p-6 border-b border-white/20 bg-white/40">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
          className="rounded-full hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-2xl font-black text-primary font-headline uppercase tracking-tight">{t('documentReports')}</h2>
          <p className="text-sm font-body font-medium text-muted-foreground">
            {t('documentReportsDesc')}
          </p>
        </div>
      </div>

      <div className="flex-none p-6 border-b border-white/20 space-y-6 bg-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground font-body">{t('historyFrom')}</Label>
              <div className="flex items-center gap-2">
                  <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={'outline'}
                      className={cn(
                          'flex-1 justify-start text-left font-bold h-11 bg-white/50 border-white/20 rounded-xl text-sm',
                          !dateRange.from && 'text-muted-foreground'
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'PPP') : <span>{t('pickStartDate')}</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                      <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(d) => setDateRange((prev) => ({ ...prev, from: d }))}
                      initialFocus
                      />
                  </PopoverContent>
                  </Popover>
                  <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-32 h-11 bg-white/50 border-white/20 rounded-xl font-bold text-sm" />
              </div>
          </div>
          
          <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground font-body">{t('historyTo')}</Label>
              <div className="flex items-center gap-2">
                  <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={'outline'}
                      className={cn(
                          'flex-1 justify-start text-left font-bold h-11 bg-white/50 border-white/20 rounded-xl text-sm',
                          !dateRange.to && 'text-muted-foreground'
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'PPP') : <span>{t('pickEndDate')}</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                      <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(d) => setDateRange((prev) => ({ ...prev, to: d }))}
                      initialFocus
                      />
                  </PopoverContent>
                  </Popover>
                  <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-32 h-11 bg-white/50 border-white/20 rounded-xl font-bold text-sm" />
              </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-9 rounded-full font-bold px-4 hover:bg-primary hover:text-white transition-all font-body text-xs" onClick={() => handleSetDateRange('today')}>
              {t('today')}
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-full font-bold px-4 hover:bg-primary hover:text-white transition-all font-body text-xs" onClick={() => handleSetDateRange('week')}>
              {t('thisWeek')}
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-full font-bold px-4 hover:bg-primary hover:text-white transition-all font-body text-xs" onClick={() => handleSetDateRange('month')}>
              {t('thisMonth')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl h-11 px-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 font-body text-sm" onClick={generateReport} disabled={!dateRange.from || !dateRange.to}>
              {t('generateReport')}
            </Button>
            <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-muted-foreground font-body text-sm" onClick={clearReport}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="p-6">
          {reportData ? (
            <>
              <div className="mb-6 pb-4 border-b-2 border-primary/50">
                <h3 className="font-bold text-xl mb-4 text-primary font-headline tracking-tight uppercase">{t('grandTotal')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-base font-body">
                    <div className="flex justify-between font-semibold border-b pb-2">
                        <span>{t('totalDocuments')}:</span>
                        <span>{reportTotals.totalDocs}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-b pb-2">
                        <span>{t('totalUniqueDocTypes')}:</span>
                        <span>{reportTotals.totalTypes}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-b pb-2">
                        <span>{t('totalCombinedDocs')}:</span>
                        <span className="text-blue-600">{reportTotals.totalCombined}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-b pb-2">
                        <span>{t('totalSplitDocs')}:</span>
                        <span className="text-purple-600">{reportTotals.totalSplit}</span>
                    </div>
                </div>
                <div className="mt-6">
                      <h4 className="font-bold text-lg mb-2 font-headline uppercase tracking-tight text-muted-foreground">{t('docsPerType')}:</h4>
                      <div className="h-[400px] w-full mt-4 bg-white/30 rounded-2xl p-4 border border-white/20">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                  data={reportTotals.chartData} 
                                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                                  onClick={handleBarClick}
                                  className="cursor-pointer"
                              >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                                  <YAxis allowDecimals={false} style={{ fontSize: '12px' }} />
                                  <Tooltip
                                      contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          borderRadius: '12px',
                                          border: 'none',
                                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                          fontFamily: 'inherit'
                                      }}
                                  />
                                  <Bar dataKey="count" barSize={30} radius={[6, 6, 0, 0]}>
                                      {reportTotals.chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                      ))}
                                      <LabelList dataKey="count" position="top" className="fill-primary font-black text-xs" />
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                   <div>
                      <h4 className="font-bold text-lg mb-2 text-blue-800 font-headline uppercase tracking-tight">{t('combinedDocsByType')}:</h4>
                       <div className="grid grid-cols-1 gap-y-1 text-sm font-body">
                          {Object.keys(reportTotals.combinedTypesBreakdown).length > 0 ? Object.entries(reportTotals.combinedTypesBreakdown).map(([type, count]) => (
                          <div key={type} className="flex justify-between border-b py-2 hover:bg-black/5 px-2 transition-colors">
                              <span className="text-muted-foreground font-medium">{type}:</span>
                              <span className="font-black text-blue-800">{count}</span>
                          </div>
                          )) : <p className="text-sm text-muted-foreground p-2">{t('none')}</p>}
                      </div>
                  </div>
                   <div>
                      <h4 className="font-bold text-lg mb-2 text-purple-800 font-headline uppercase tracking-tight">{t('splitDocsByType')}:</h4>
                      <div className="grid grid-cols-1 gap-y-1 text-sm font-body">
                          {Object.keys(reportTotals.splitTypesBreakdown).length > 0 ? Object.entries(reportTotals.splitTypesBreakdown).map(([type, count]) => (
                          <div key={type} className="flex justify-between border-b py-2 hover:bg-black/5 px-2 transition-colors">
                              <span className="text-muted-foreground font-medium">{type}:</span>
                              <span className="font-black text-purple-800">{count}</span>
                          </div>
                          )) : <p className="text-sm text-muted-foreground p-2">{t('none')}</p>}
                      </div>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-2">
                {sortedDepartments.map((dept, index) => (
                    <AccordionItem value={dept} key={dept} className="border-none bg-white/20 rounded-xl overflow-hidden">
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/30 transition-all font-body no-underline hover:no-underline">
                            <div className="flex justify-between w-full pr-4 text-left">
                                <span className="font-black text-primary uppercase tracking-tighter text-base">{index + 1}. {dept}</span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('totalDocs')}: {reportData[dept].totalDocs}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 bg-white/50">
                          <Table>
                            <TableHeader>
                                <TableRow className="border-primary/20">
                                <TableHead className="font-black text-xs uppercase tracking-widest text-primary">{t('documentType')}</TableHead>
                                <TableHead className="text-right font-black text-xs uppercase tracking-widest text-primary">{t('count')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(reportData[dept].docTypes).sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => (
                                <TableRow key={type} onClick={() => handleTableRowClick(dept, type)} className="cursor-pointer hover:bg-primary/5 border-primary/10 transition-colors font-body text-sm">
                                    <TableCell className="font-bold py-2">{type}</TableCell>
                                    <TableCell className="text-right font-black font-headline text-primary py-2">{count}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50 space-y-4 font-body font-bold uppercase tracking-widest text-center">
              <CalendarIcon className="w-16 h-16" />
              <p className="text-base px-6 text-balance">{t('pleaseSelectDateRange')}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
