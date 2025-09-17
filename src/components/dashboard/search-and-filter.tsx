
'use client'

import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { format as formatDate } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { useTranslation } from '@/lib/i18n'
import { Search } from 'lucide-react'


export default function SearchAndFilter() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const t = useTranslation()
  const [searchTerm, setSearchTerm] = useState(state.filter.search);
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodValue, setPeriodValue] = useState(state.filter.periodValue);
  const [periodUnit, setPeriodUnit] = useState(state.filter.periodUnit);
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
    dispatch({ type: 'SET_FILTER', payload: { mainFilter: 'All' } });
  }

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
         <div className='space-y-2'>
          <Label htmlFor="date-from">{t('historyFrom')}</Label>
          <Input type="date" id="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full shadow-md" />
        </div>
        <div className='space-y-2'>
          <Label htmlFor="date-to">{t('historyTo')}</Label>
          <Input type="date" id="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full shadow-md" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDateFilter} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md">{t('filterByDate')}</Button>
          <Button variant="outline" onClick={clearDateFilter} className="shadow-md">{t('clear')}</Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
          <Label>{t('docsExceeding')}</Label>
          <Input type="number" value={periodValue} onChange={e => setPeriodValue(Number(e.target.value))} min="1" className="w-20 bg-card shadow-md" />
          <Select value={periodUnit} onValueChange={setPeriodUnit}>
              <SelectTrigger className="w-[120px] bg-card shadow-md">
                  <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="days">{t('days')}</SelectItem>
                  <SelectItem value="hours">{t('hours')}</SelectItem>
                  <SelectItem value="minutes">{t('minutes')}</SelectItem>
              </SelectContent>
          </Select>
          <Label>{t('in')}</Label>
          <Select value={periodDepartment} onValueChange={setPeriodDepartment}>
              <SelectTrigger className="w-[180px] bg-card shadow-md">
                  <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="All">{t('allDepartments')}</SelectItem>
                  {state.departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <Button onClick={handleCalculatePeriod} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">{t('calculate')}</Button>
          <Button variant="outline" onClick={clearPeriodFilter} className="shadow-md">{t('clear')}</Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search-id"
            type="text"
            placeholder={t('search')}
            className="w-full pr-24 pl-10 shadow-md bg-[#33CCCC40]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFiltered && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-sm text-muted-foreground">
                {filteredDocs.length} {t('results')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
