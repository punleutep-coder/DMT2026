'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { useAppContext } from '@/hooks/use-app-context'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface ReportingModalProps {
  isOpen: boolean
  onClose: () => void
}

type ReportData = {
  [department: string]: {
    totalDocs: number
    docTypes: {
      [type: string]: number
    }
  }
}

export default function ReportingModal({ isOpen, onClose }: ReportingModalProps) {
  const { state, dispatch } = useAppContext()
  const { documents } = state
  const t = useTranslation()
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
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
      to = endOfMonth(now)
    } else {
      // month
      from = startOfMonth(now)
      to = endOfMonth(now)
    }
    setDateRange({ from, to })
  }

  const generateReport = () => {
    if (!dateRange.from || !dateRange.to) {
      console.log('Please select a date range.')
      return
    }

    const filteredDocs = documents.filter((doc) => {
      const docDate = new Date(doc.history[0]?.start || doc.lastUpdate)
      return docDate >= dateRange.from! && docDate <= dateRange.to!
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
      onClose();
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
    onClose();
  };

  const clearReport = () => {
    setDateRange({})
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] glassmorphic-card flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('documentReports')}</DialogTitle>
          <DialogDescription>
            {t('documentReportsDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-none p-4 border-b">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : <span>{t('pickStartDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(d) => setDateRange((prev) => ({ ...prev, from: d }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">{t('to')}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !dateRange.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : <span>{t('pickEndDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(d) => setDateRange((prev) => ({ ...prev, to: d }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('today')}>
              {t('today')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('week')}>
              {t('thisWeek')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('month')}>
              {t('thisMonth')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={!dateRange.from || !dateRange.to}>
              {t('generateReport')}
            </Button>
            <Button variant="ghost" onClick={clearReport}>
              {t('cancel')}
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-grow">
          <div className="p-4">
            {reportData ? (
              <>
                <div className="mb-6 pb-4 border-b-2 border-primary/50">
                  <h3 className="font-bold text-xl mb-4 text-primary">{t('grandTotal')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-base">
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
                  <div className="mt-4">
                        <h4 className="font-semibold text-lg mb-2">{t('docsPerType')}:</h4>
                        <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={reportTotals.chartData} 
                                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                                    onClick={handleBarClick}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} style={{ fontSize: '12px' }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                        }}
                                    />
                                    <Bar dataKey="count" barSize={30}>
                                        {reportTotals.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                        ))}
                                        <LabelList dataKey="count" position="top" className="fill-foreground font-bold" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                  </div>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                     <div>
                        <h4 className="font-semibold text-lg mb-2 text-blue-600">{t('combinedDocsByType')}:</h4>
                         <div className="grid grid-cols-1 gap-y-1 text-sm">
                            {Object.keys(reportTotals.combinedTypesBreakdown).length > 0 ? Object.entries(reportTotals.combinedTypesBreakdown).map(([type, count]) => (
                            <div key={type} className="flex justify-between border-b py-1">
                                <span className="text-muted-foreground">{type}:</span>
                                <span className="font-medium">{count}</span>
                            </div>
                            )) : <p className="text-sm text-muted-foreground">{t('none')}</p>}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2 text-purple-600">{t('splitDocsByType')}:</h4>
                        <div className="grid grid-cols-1 gap-y-1 text-sm">
                            {Object.keys(reportTotals.splitTypesBreakdown).length > 0 ? Object.entries(reportTotals.splitTypesBreakdown).map(([type, count]) => (
                            <div key={type} className="flex justify-between border-b py-1">
                                <span className="text-muted-foreground">{type}:</span>
                                <span className="font-medium">{count}</span>
                            </div>
                            )) : <p className="text-sm text-muted-foreground">{t('none')}</p>}
                        </div>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {sortedDepartments.map(dept => (
                      <AccordionItem value={dept} key={dept}>
                          <AccordionTrigger>
                              <div className="flex justify-between w-full pr-4">
                                  <span className="font-semibold text-lg">{dept}</span>
                                  <span className="text-muted-foreground">{t('totalDocs')}: {reportData[dept].totalDocs} | {t('types')}: {Object.keys(reportData[dept].docTypes).length}</span>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                  <TableRow>
                                  <TableHead>{t('documentType')}</TableHead>
                                  <TableHead className="text-right">{t('count')}</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {Object.entries(reportData[dept].docTypes).sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => (
                                  <TableRow key={type} onClick={() => handleTableRowClick(dept, type)} className="cursor-pointer hover:bg-muted/50">
                                      <TableCell>{type}</TableCell>
                                      <TableCell className="text-right">{count}</TableCell>
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
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>{t('pleaseSelectDateRange')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
