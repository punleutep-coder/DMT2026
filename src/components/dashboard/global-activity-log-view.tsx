'use client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppContext } from '@/hooks/use-app-context'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { CalendarIcon, ChevronLeft, Search, Filter, X, Download, User, Clock, ArrowRight, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { MessageSquare } from 'lucide-react'

export default function GlobalActivityLogView() {
  const { state, dispatch } = useAppContext()
  const { logs, users } = state
  const t = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState('All')
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined })
  const [fromTime, setFromTime] = useState('00:00')
  const [toTime, setToTime] = useState('23:59')

  const filteredLogs = useMemo(() => {
    let tempLogs = logs;

    if (selectedUser !== 'All') {
      tempLogs = tempLogs.filter(log => log.user === selectedUser);
    }
    
    if (dateRange.from && dateRange.to) {
        const combinedFrom = new Date(dateRange.from);
        const [fH, fM] = fromTime.split(':').map(Number);
        combinedFrom.setHours(fH || 0, fM || 0, 0, 0);

        const combinedTo = new Date(dateRange.to);
        const [tH, tM] = toTime.split(':').map(Number);
        combinedTo.setHours(tH || 23, tM || 59, 59, 999);

        tempLogs = tempLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= combinedFrom && logDate <= combinedTo;
        });
    }

    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        tempLogs = tempLogs.filter(log => 
            log.docId.toLowerCase().includes(lowercasedFilter) ||
            log.oldStatus.toLowerCase().includes(lowercasedFilter) ||
            log.newStatus.toLowerCase().includes(lowercasedFilter) ||
            (log.reason && log.reason.toLowerCase().includes(lowercasedFilter))
        );
    }
      
    return tempLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [logs, searchTerm, selectedUser, dateRange, fromTime, toTime])

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
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('All');
    setDateRange({ from: undefined, to: undefined });
    setFromTime('00:00');
    setToTime('23:59');
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
              <History className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-black text-primary font-headline uppercase tracking-tight truncate">
                {t('globalActivityLog')}
              </h2>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('globalActivityLogDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full gap-2 bg-white/50 border-white/40 px-6 font-bold hidden sm:flex">
                <Download className="h-4 w-4" />
                {t('export' as any)}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} className="rounded-full hover:bg-white/20 lg:hidden">
                <X className="h-6 w-6" />
            </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
          {/* Filters Bar */}
          <div className="p-4 sm:p-6 bg-white/30 border-b border-white/20 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2 lg:col-span-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">{t('search')}</Label>
                      <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input 
                              placeholder={t('searchPlaceholder')}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="h-12 pl-12 bg-white/50 border-white/30 rounded-2xl font-bold focus:shadow-lg transition-all"
                          />
                      </div>
                  </div>
                  
                  <div className="space-y-2 lg:col-span-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">{t('user')}</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="h-12 bg-white/50 border-white/30 rounded-2xl font-bold">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <SelectValue placeholder={t('selectUser')} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/20">
                              <SelectItem value="All" className="font-bold">{t('allUsers')}</SelectItem>
                              {users.map(user => (
                                  <SelectItem key={user.id} value={user.username} className="font-bold">{user.username}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">{t('timeRange' as any)}</Label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("flex-1 h-12 bg-white/50 border-white/30 rounded-2xl justify-start font-bold", !dateRange.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "dd MMM yyyy") : <span>{t('pickStartDate')}</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                                        <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-24 sm:w-32 h-12 bg-white/50 border-white/30 rounded-2xl font-bold" />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("flex-1 h-12 bg-white/50 border-white/30 rounded-2xl justify-start font-bold", !dateRange.to && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "dd MMM yyyy") : <span>{t('pickEndDate')}</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                                        <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-24 sm:w-32 h-12 bg-white/50 border-white/30 rounded-2xl font-bold" />
                            </div>
                       </div>
                  </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant={dateRange.from && format(dateRange.from, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "default" : "outline"} onClick={() => handleSetDateRange('today')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest shadow-sm">
                          {t('today')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSetDateRange('week')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest shadow-sm">
                          {t('thisWeek')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSetDateRange('month')} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest shadow-sm">
                          {t('thisMonth')}
                      </Button>
                      {(searchTerm || selectedUser !== 'All' || dateRange.from) && (
                          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full text-destructive font-black uppercase text-[10px] tracking-widest ml-2 px-4 hover:bg-destructive/10">
                              <X className="h-3 w-3 mr-1" /> {t('clearAllFilters')}
                          </Button>
                      )}
                  </div>
                  
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      {filteredLogs.length} {t('resultsFound' as any)}
                  </div>
              </div>
          </div>

          {/* Logs Table Area */}
          <ScrollArea className="flex-1 bg-white/10">
              <div className="p-4 sm:p-8 max-w-[1600px] mx-auto">
                  <div className="rounded-[2.5rem] border border-white/20 bg-white/40 shadow-2xl overflow-hidden backdrop-blur-xl">
                      <Table>
                          <TableHeader className="bg-white/60">
                              <TableRow className="hover:bg-transparent border-white/20 border-b-2">
                                  <TableHead className="h-16 px-8 font-black text-primary uppercase text-[11px] tracking-widest">{t('timestamp')}</TableHead>
                                  <TableHead className="h-16 px-8 font-black text-primary uppercase text-[11px] tracking-widest">{t('user')}</TableHead>
                                  <TableHead className="h-16 px-8 font-black text-primary uppercase text-[11px] tracking-widest">{t('documentId')}</TableHead>
                                  <TableHead className="h-16 px-8 font-black text-primary uppercase text-[11px] tracking-widest">{t('action')}</TableHead>
                                  <TableHead className="h-16 px-8 font-black text-primary uppercase text-[11px] tracking-widest">{t('details')}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredLogs.length > 0 ? filteredLogs.map((log, index) => (
                                  <TableRow key={`${log.id}-${index}`} className="hover:bg-white/50 border-white/10 transition-all group">
                                      <TableCell className="px-8 py-5">
                                          <div className="flex flex-col">
                                              <span className="text-sm font-black text-primary">{format(new Date(log.timestamp), 'dd/MM/yyyy')}</span>
                                              <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="px-8 py-5">
                                          <div className="flex items-center gap-2">
                                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                  <User className="h-4 w-4 text-primary" />
                                              </div>
                                              <span className="text-sm font-black text-foreground">{log.user}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="px-8 py-5">
                                          <Badge className="bg-white/80 border-white/60 text-primary font-black py-1 px-4 rounded-full shadow-sm">
                                              {log.docId}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="px-8 py-5">
                                          <div className="flex items-center gap-2">
                                              <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 font-bold px-3 py-1 rounded-lg text-[10px] uppercase">{log.oldStatus}</Badge>
                                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                              <Badge className="bg-emerald-500 text-white font-black px-3 py-1 rounded-lg text-[10px] uppercase shadow-md shadow-emerald-500/10">{log.newStatus}</Badge>
                                          </div>
                                      </TableCell>
                                      <TableCell className="px-8 py-5">
                                          <div className="flex items-center gap-2 max-w-[400px]">
                                              {log.reason ? (
                                                  <div className="flex items-start gap-2 p-3 bg-black/5 rounded-2xl w-full border border-black/5 group-hover:bg-black/10 transition-colors">
                                                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                                                      <p className="text-sm font-medium text-foreground italic whitespace-normal leading-relaxed">
                                                          {log.reason}
                                                      </p>
                                                  </div>
                                              ) : (
                                                  <span className="text-muted-foreground/30 italic text-xs">No details</span>
                                              )}
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center h-[500px]">
                                          <div className="flex flex-col items-center justify-center space-y-6 opacity-30">
                                              <div className="h-24 w-24 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                                  <History className="h-12 w-12" />
                                              </div>
                                              <div className="space-y-2">
                                                  <p className="text-2xl font-black uppercase tracking-tighter">{t('noActivityFoundFilters')}</p>
                                                  <p className="text-sm font-bold uppercase tracking-widest">{t('tryAdjustingFilters' as any)}</p>
                                              </div>
                                              <Button variant="outline" onClick={clearFilters} className="rounded-full font-black uppercase text-xs tracking-widest px-8">
                                                  {t('resetFilters' as any)}
                                              </Button>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
              </div>
          </ScrollArea>
      </div>
    </div>
  )
}
