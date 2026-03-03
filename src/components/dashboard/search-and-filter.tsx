'use client'

import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz';
import { useTranslation } from '@/lib/i18n'
import { Search } from 'lucide-react'


export default function SearchAndFilter() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const t = useTranslation()
  const [searchTerm, setSearchTerm] = useState(state.filter.search);
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodValue, setPeriodValue] = useState(state.filter.periodValue);
  const [periodUnit, setPeriodUnit] = useState<'days' | 'hours' | 'minutes'>(state.filter.periodUnit);
  const [periodDepartment, setPeriodDepartment] = useState(state.filter.periodDepartment);

  useEffect(() => {
    setSearchTerm(state.filter.search);
    const timeZone = 'UTC';
    setDateFrom(state.filter.startDate ? formatInTimeZone(state.filter.startDate, timeZone, 'yyyy-MM-dd') : '');
    setDateTo(state.filter.endDate ? formatInTimeZone(state.filter.endDate, timeZone, 'yyyy-MM-dd') : '');
    setPeriodValue(state.filter.periodValue);
    setPeriodUnit(state.filter.periodUnit);
    setPeriodDepartment(state.filter.periodDepartment);
  }, [state.filter]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch({ type: 'SET_FILTER', payload: { search: searchTerm } })
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, dispatch]);


  const handleDateFilter = () => {
    if (dateFrom && dateTo) {
      // Construct date strings at midnight UTC to avoid timezone shifts
      const start = new Date(`${dateFrom}T00:00:00Z`);
      const end = new Date(`${dateTo}T23:59:59.999Z`);
      dispatch({ type: 'SET_FILTER', payload: { startDate: start, endDate: end } })
    }
  }

  const clearDateFilter = () => {
    setDateFrom('')
    setDateTo('')
    dispatch({ type: 'SET_FILTER', payload: { startDate: null, endDate: null } })
  }
  
  const handleCalculatePeriod = () => {
    dispatch({ type: 'SET_FILTER', payload: { periodValue, periodUnit, periodDepartment, mainFilter: 'Exceeding Period', departmentSpecificFilter: 'All' } })
  }
  
  const clearPeriodFilter = () => {
    dispatch({ type: 'SET_FILTER', payload: { 
        mainFilter: 'All',
        periodValue: 3,
        periodUnit: 'days',
        periodDepartment: 'All'
     } });
  }

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
         <div className='space-y-2'>
          <Label htmlFor="date-from">{t('historyFrom')}</Label>
          <Input type="date" id="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full shadow-md h-11" />
        </div>
        <div className='space-y-2'>
          <Label htmlFor="date-to">{t('historyTo')}</Label>
          <Input type="date" id="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full shadow-md h-11" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDateFilter} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-md h-11">{t('filterByDate')}</Button>
          <Button variant="outline" onClick={clearDateFilter} className="flex-1 shadow-md h-11">{t('clear')}</Button>
        </div>
      </div>
      
      <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border/60">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
            <Label className="whitespace-nowrap">{t('docsExceeding')}</Label>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input type="number" value={periodValue} onChange={e => setPeriodValue(Number(e.target.value))} min="1" className="w-full sm:w-20 bg-card shadow-md h-11" />
                <Select value={periodUnit} onValueChange={v => setPeriodUnit(v as 'days' | 'hours' | 'minutes')}>
                    <SelectTrigger className="w-full sm:w-[120px] bg-card shadow-md h-11">
                        <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="days">{t('days')}</SelectItem>
                        <SelectItem value="hours">{t('hours')}</SelectItem>
                        <SelectItem value="minutes">{t('minutes')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Label>{t('in')}</Label>
            <Select value={periodDepartment} onValueChange={setPeriodDepartment}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card shadow-md h-11">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">{t('allDepartments')}</SelectItem>
                    {state.departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={handleCalculatePeriod} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md h-11 px-6">{t('calculate')}</Button>
                <Button variant="outline" onClick={clearPeriodFilter} className="flex-1 sm:flex-none shadow-md h-11 px-6">{t('clear')}</Button>
            </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search-id"
            type="text"
            placeholder={t('search')}
            className="w-full pr-24 pl-10 shadow-md bg-[#EAEAEA] h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFiltered && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {filteredDocs.length} {t('results')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}