
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppContext } from '@/hooks/use-app-context'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Log } from '@/lib/types'

interface MyActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyActivityLogModal({ isOpen, onClose }: MyActivityLogModalProps) {
  const { state } = useAppContext()
  const { logs, currentUser } = state
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined })
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
  }

  const generateReport = () => {
    if (!dateRange.from || !dateRange.to) {
        // Maybe show a toast message? For now, just console log.
        console.log("Please select a date range.");
        return;
    }

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return log.user === currentUser?.username && logDate >= dateRange.from! && logDate <= dateRange.to!;
    });
    
    const uniqueDocIds = new Set(filteredLogs.map(log => log.docId));
    setReportResult({ count: uniqueDocIds.size, from: dateRange.from, to: dateRange.to });
  }

  const clearReport = () => {
      setDateRange({ from: undefined, to: undefined });
      setReportResult(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>My Activity Log</DialogTitle>
          <DialogDescription>
            Review your actions or generate a report on documents you've handled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
            {/* Reporting Section */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Generate Report</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-[240px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a start date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">to</span>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-[240px] justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick an end date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('today')}>Today</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('week')}>This Week</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleSetDateRange('month')}>This Month</Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={generateReport} disabled={!dateRange.from || !dateRange.to}>Generate Report</Button>
                    <Button variant="ghost" onClick={clearReport}>Clear</Button>
                </div>
                 {reportResult && (
                    <div className="p-4 bg-primary/10 rounded-md text-center">
                        <p className="text-muted-foreground">
                            You handled <span className="font-bold text-xl text-primary">{reportResult.count}</span> unique documents
                        </p>
                        <p className="text-xs text-muted-foreground">
                            from {format(reportResult.from, "PPP")} to {format(reportResult.to, "PPP")}
                        </p>
                    </div>
                )}
            </div>
            {/* Search Section */}
            <div className="space-y-4 p-4 border rounded-lg">
                 <h3 className="font-semibold text-lg">Search Activity Log</h3>
                 <p className="text-sm text-muted-foreground">Search through all your past activities by Document ID.</p>
                 <Input 
                    placeholder="Search by Document ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>
        </div>

        <ScrollArea className="h-[30vh] border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Document ID</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {userLogs.length > 0 ? userLogs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                            <TableCell>{log.docId}</TableCell>
                            <TableCell>
                                From <span className="font-bold text-primary/90">{log.oldStatus}</span> to <span className="font-bold text-primary">{log.newStatus}</span>
                            </TableCell>
                            <TableCell>{log.reason || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No activity found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
