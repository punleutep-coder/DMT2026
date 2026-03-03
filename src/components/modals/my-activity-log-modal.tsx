'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppContext } from '@/hooks/use-app-context'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Log } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface MyActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyActivityLogModal({ isOpen, onClose }: MyActivityLogModalProps) {
  const { state } = useAppContext()
  const { logs, currentUser } = state
  const t = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined })
  const [fromTime, setFromTime] = useState('00:00')
  const [toTime, setToTime] = useState('23:59')
  const [reportResult, setReportResult] = useState<{count: number, from: Date, to: Date} | null>(null)

  const userLogs = useMemo(() => {
    if (!currentUser) return []
    
    let filteredLogs = logs
      .filter(log => log.user === currentUser.username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.docId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
      
    return filteredLogs
  }, [logs, currentUser, searchTerm])

  const handleSetDateRange = (period: 'today' | 'week' | 'month') => {
      const now = new Date();
      let from: Date, to: Date;
      if (period === 'today') {
          from = startOfDay(now);
          to = endOfDay(now);
      } else if (period === 'week') {
          from = startOfWeek(now);
          to = endOfWeek(now);
      } else { // month
          from = startOfMonth(now);
          to = endOfMonth(now);
      }
      setDateRange({ from, to });
      setFromTime('00:00');
      setToTime('23:59');
  }

  const generateReport = () => {
    if (!dateRange.from || !dateRange.to) {
        return;
    }

    const combinedFrom = new Date(dateRange.from);
    const [fH, fM] = fromTime.split(':').map(Number);
    combinedFrom.setHours(fH || 0, fM || 0, 0, 0);

    const combinedTo = new Date(dateRange.to);
    const [tH, tM] = toTime.split(':').map(Number);
    combinedTo.setHours(tH || 23, tM || 59, 59, 999);

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return log.user === currentUser?.username && logDate >= combinedFrom && logDate <= combinedTo;
    });
    
    const uniqueDocIds = new Set(filteredLogs.map(log => log.docId));
    setReportResult({ count: uniqueDocIds.size, from: combinedFrom, to: combinedTo });
  }

  const clearReport = () => {
      setDateRange({ from: undefined, to: undefined });
      setFromTime('00:00');
      setToTime('23:59');
      setReportResult(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>{t('myActivityLog')}</DialogTitle>
          <DialogDescription>
            {t('myActivityLogDesc')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">{t('searchLog')}</TabsTrigger>
                <TabsTrigger value="report">{t('generateReport')}</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="pt-4">
                 <Input 
                    placeholder={t('searchByDocId')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </TabsContent>
            <TabsContent value="report">
                <div className="space-y-4 p-4 border rounded-lg mt-4">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold text-muted-foreground">{t('startTime')}</Label>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-[200px] justify-start text-left font-normal h-11", !dateRange.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "PPP") : <span>{t('pickStartDate')}</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-32 h-11" />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold text-muted-foreground">{t('endTime')}</Label>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-[200px] justify-start text-left font-normal h-11", !dateRange.to && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "PPP") : <span>{t('pickEndDate')}</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-32 h-11" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('today')}>{t('today')}</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('week')}>{t('thisWeek')}</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('month')}>{t('thisMonth')}</Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={generateReport} disabled={!dateRange.from || !dateRange.to}>{t('generateReport')}</Button>
                        <Button variant="ghost" onClick={clearReport}>{t('cancel')}</Button>
                    </div>
                    {reportResult && (
                        <div className="p-4 bg-primary/10 rounded-md text-center">
                            <p className="text-muted-foreground">
                                {t('reportResult', { count: reportResult.count })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('from')} {format(reportResult.from, "PPP p")} {t('to')} {format(reportResult.to, "PPP p")}
                            </p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>

        <ScrollArea className="h-[40vh] border rounded-lg mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('timestamp')}</TableHead>
                        <TableHead>{t('documentId')}</TableHead>
                        <TableHead>{t('action')}</TableHead>
                        <TableHead>{t('details')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {userLogs.length > 0 ? userLogs.map((log, index) => (
                        <TableRow key={`${log.id}-${index}`}>
                            <TableCell>{format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm')}</TableCell>
                            <TableCell>{log.docId}</TableCell>
                            <TableCell>
                                {t('from')} <span className="text-destructive">{log.oldStatus}</span> {t('to')} <span className="text-destructive">{log.newStatus}</span>
                            </TableCell>
                            <TableCell>{log.reason || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">{t('noActivityFound')}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}