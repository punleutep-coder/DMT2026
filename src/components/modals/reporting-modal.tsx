
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
  const { state } = useAppContext()
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
        splitTypesBreakdown: {} 
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

    return { 
        totalDocs, 
        totalTypes: Object.keys(typesBreakdown).length,
        typesBreakdown: Object.fromEntries(sortedTypesBreakdown),
        totalCombined: combinedDocs.length,
        totalSplit: splitDocs.length,
        combinedTypesBreakdown: Object.fromEntries(Object.entries(combinedTypesBreakdown).sort(([a], [b]) => a.localeCompare(b))),
        splitTypesBreakdown: Object.fromEntries(Object.entries(splitTypesBreakdown).sort(([a], [b]) => a.localeCompare(b))),
    };
  }, [reportData, filteredDocsForReport]);

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
                                  <TableRow key={type}>
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
                <div className="mt-6 pt-4 border-t-2 border-primary/50">
                  <h3 className="font-bold text-xl mb-4 text-primary">Grand Total</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-base">
                      <div className="flex justify-between font-semibold border-b pb-2">
                          <span>Total Documents:</span>
                          <span>{reportTotals.totalDocs}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-b pb-2">
                          <span>Total Unique Document Types:</span>
                          <span>{reportTotals.totalTypes}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-b pb-2">
                          <span>Total Combined Documents:</span>
                          <span className="text-blue-600">{reportTotals.totalCombined}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-b pb-2">
                          <span>Total Split Documents:</span>
                          <span className="text-purple-600">{reportTotals.totalSplit}</span>
                      </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                     <div>
                        <h4 className="font-semibold text-lg mb-2">Documents per Type:</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            {Object.entries(reportTotals.typesBreakdown).map(([type, count]) => (
                            <div key={type} className="flex justify-between">
                                <span className="text-muted-foreground">{type}:</span>
                                <span className="font-medium">{count}</span>
                            </div>
                            ))}
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-y-4 mt-4 md:mt-0">
                        <div>
                            <h4 className="font-semibold text-lg mb-2 text-blue-600">Combined Docs by Type:</h4>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                {Object.keys(reportTotals.combinedTypesBreakdown).length > 0 ? Object.entries(reportTotals.combinedTypesBreakdown).map(([type, count]) => (
                                <div key={type} className="flex justify-between">
                                    <span className="text-muted-foreground">{type}:</span>
                                    <span className="font-medium">{count}</span>
                                </div>
                                )) : <p className="text-sm text-muted-foreground col-span-2">None</p>}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-lg mb-2 text-purple-600">Split Docs by Type:</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                {Object.keys(reportTotals.splitTypesBreakdown).length > 0 ? Object.entries(reportTotals.splitTypesBreakdown).map(([type, count]) => (
                                <div key={type} className="flex justify-between">
                                    <span className="text-muted-foreground">{type}:</span>
                                    <span className="font-medium">{count}</span>
                                </div>
                                )) : <p className="text-sm text-muted-foreground col-span-2">None</p>}
                            </div>
                        </div>
                     </div>
                  </div>
                </div>
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
