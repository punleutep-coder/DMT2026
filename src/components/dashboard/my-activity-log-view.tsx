'use client'
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
import { CalendarIcon, ChevronLeft, Search, BarChart3, History, X, Download, Clock, ArrowRight, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'

export default function MyActivityLogView() {
  const { state, dispatch } = useAppContext()
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
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/20 bg-white/40 sticky top-0 z-20">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="rounded-full hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight truncate">
                {t('myActivityLog')}
              </h2>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('myActivityLogDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
             <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{currentUser?.username}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{currentUser?.role}</span>
             </div>
             <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full hover:bg-white/20">
                <X className="h-6 w-6" />
            </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-8 flex-1 overflow-hidden">
              <div className="max-w-6xl mx-auto h-full flex flex-col gap-8">
                  <Tabs defaultValue="search" className="flex-1 flex flex-col min-h-0 bg-white/40 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                      <div className="p-6 sm:p-8 bg-white/40 border-b border-white/20">
                          <TabsList className="grid w-full sm:w-[400px] grid-cols-2 rounded-2xl h-12 p-1 bg-white/50">
                              <TabsTrigger value="search" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                                  <Search className="h-3.5 w-3.5 mr-2" />
                                  {t('searchLog')}
                              </TabsTrigger>
                              <TabsTrigger value="report" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                                  <BarChart3 className="h-3.5 w-3.5 mr-2" />
                                  {t('generateReport')}
                              </TabsTrigger>
                          </TabsList>
                      </div>

                      <div className="flex-1 min-h-0 flex flex-col">
                          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 p-0 m-0 animate-in fade-in duration-300">
                               <div className="p-6 sm:p-8 bg-white/20 border-b border-white/10 space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">{t('searchByDocId')}</Label>
                                    <div className="relative group max-w-xl">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            placeholder={t('searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-14 pl-14 text-lg font-bold rounded-2xl bg-white/50 border-white/30 focus:shadow-xl transition-all"
                                        />
                                    </div>
                               </div>
                               <ScrollArea className="flex-1">
                                    <div className="p-6 sm:p-8">
                                        <div className="rounded-3xl border border-white/20 overflow-hidden shadow-xl">
                                            <Table>
                                                <TableHeader className="bg-white/60">
                                                    <TableRow className="hover:bg-transparent border-white/20">
                                                        <TableHead className="h-14 px-6 font-black text-primary uppercase text-[10px] tracking-widest">{t('timestamp')}</TableHead>
                                                        <TableHead className="h-14 px-6 font-black text-primary uppercase text-[10px] tracking-widest">{t('documentId')}</TableHead>
                                                        <TableHead className="h-14 px-6 font-black text-primary uppercase text-[10px] tracking-widest">{t('action')}</TableHead>
                                                        <TableHead className="h-14 px-6 font-black text-primary uppercase text-[10px] tracking-widest">{t('details')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="bg-white/20">
                                                    {userLogs.length > 0 ? userLogs.map((log, index) => (
                                                        <TableRow key={`${log.id}-${index}`} className="hover:bg-white/40 border-white/10 transition-colors">
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-primary">{format(new Date(log.timestamp), 'dd/MM/yyyy')}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(log.timestamp), 'HH:mm')}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <Badge className="bg-white/50 text-foreground font-black px-3 py-1 rounded-full border border-white/40">{log.docId}</Badge>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-[10px] font-bold border-rose-200 text-rose-600 bg-rose-50/30 uppercase">{log.oldStatus}</Badge>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                    <Badge className="text-[10px] font-black bg-emerald-500 text-white uppercase shadow-sm shadow-emerald-500/20">{log.newStatus}</Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <p className="text-sm font-medium text-muted-foreground italic truncate max-w-[200px]">{log.reason || 'No details'}</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center h-48 opacity-30">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <History className="h-10 w-10 mb-2" />
                                                                    <p className="text-lg font-black uppercase tracking-tighter">{t('noActivityFound')}</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                               </ScrollArea>
                          </TabsContent>

                          <TabsContent value="report" className="flex-1 flex flex-col min-h-0 p-0 m-0 animate-in slide-in-from-right-4 duration-300">
                               <ScrollArea className="flex-1">
                                    <div className="p-6 sm:p-12 space-y-12">
                                        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/40 border border-white/20 shadow-xl space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-3">{t('startTime')}</Label>
                                                    <div className="flex gap-2">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="flex-1 h-14 bg-white/50 border-white/30 rounded-2xl font-bold justify-start">
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {dateRange.from ? format(dateRange.from, "PPP") : <span>{t('pickStartDate')}</span>}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                                                                <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} initialFocus />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-28 h-14 bg-white/50 border-white/30 rounded-2xl font-bold" />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-3">{t('endTime')}</Label>
                                                    <div className="flex gap-2">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="flex-1 h-14 bg-white/50 border-white/30 rounded-2xl font-bold justify-start">
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {dateRange.to ? format(dateRange.to, "PPP") : <span>{t('pickEndDate')}</span>}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                                                                <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} initialFocus />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-28 h-14 bg-white/50 border-white/30 rounded-2xl font-bold" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleSetDateRange('today')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest">{t('today')}</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleSetDateRange('week')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest">{t('thisWeek')}</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleSetDateRange('month')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest">{t('thisMonth')}</Button>
                                            </div>

                                            <div className="pt-4 flex gap-4">
                                                <Button onClick={generateReport} disabled={!dateRange.from || !dateRange.to} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    {t('generateReport')}
                                                </Button>
                                                <Button variant="ghost" onClick={clearReport} className="rounded-2xl h-14 font-bold text-muted-foreground">
                                                    {t('cancel')}
                                                </Button>
                                            </div>
                                        </div>

                                        {reportResult && (
                                            <div className="p-10 rounded-[2.5rem] bg-primary text-white shadow-2xl flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-300">
                                                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                                                    <BarChart3 className="h-10 w-10 text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-6xl font-black font-headline tracking-tighter">
                                                        {reportResult.count}
                                                    </p>
                                                    <p className="text-xl font-bold uppercase tracking-widest opacity-80">
                                                        {t('documentsProcessed' as any)}
                                                    </p>
                                                </div>
                                                <div className="h-px w-20 bg-white/20" />
                                                <div className="text-sm font-bold bg-white/10 px-6 py-2 rounded-full border border-white/10">
                                                    {format(reportResult.from, "PPP p")} — {format(reportResult.to, "PPP p")}
                                                </div>
                                                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full gap-2 px-8 font-black uppercase text-xs tracking-widest mt-4">
                                                    <Download className="h-4 w-4" />
                                                    {t('downloadAsPdf' as any)}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                               </ScrollArea>
                          </TabsContent>
                      </div>
                  </Tabs>
              </div>
          </div>
      </div>
    </div>
  )
}
