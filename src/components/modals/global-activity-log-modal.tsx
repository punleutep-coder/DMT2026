'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface GlobalActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalActivityLogModal({ isOpen, onClose }: GlobalActivityLogModalProps) {
  const { state } = useAppContext()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Global Activity Log</DialogTitle>
          <DialogDescription>
            Review all actions performed by all users across the application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-none p-4 border-b space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    placeholder="Search by Doc ID, Status, Reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11"
                />
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Users</SelectItem>
                        {users.map(user => (
                            <SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
                                {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick start date</span>}
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
                                {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick end date</span>}
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
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('today')}>Today</Button>
                <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('week')}>This Week</Button>
                <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('month')}>This Month</Button>
                <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
            </div>
        </div>

        <ScrollArea className="flex-grow">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Document ID</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLogs.length > 0 ? filteredLogs.map((log, index) => (
                        <TableRow key={`${log.id}-${index}`}>
                            <TableCell className="text-xs">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.docId}</TableCell>
                            <TableCell>
                                {t('from')} <span className="text-destructive">{log.oldStatus}</span> {t('to')} <span className="text-destructive">{log.newStatus}</span>
                            </TableCell>
                            <TableCell>{log.reason || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No activity found for the selected filters.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}