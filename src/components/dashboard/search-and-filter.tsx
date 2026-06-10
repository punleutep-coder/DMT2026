'use client'

import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz';
import { useTranslation } from '@/lib/i18n'
import { Search, SlidersHorizontal } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AdvancedFilterAccordion() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const t = useTranslation()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodValue, setPeriodValue] = useState(state.filter.periodValue);
  const [periodUnit, setPeriodUnit] = useState<'days' | 'hours' | 'minutes'>(state.filter.periodUnit);
  const [periodDepartment, setPeriodDepartment] = useState(state.filter.periodDepartment);

  useEffect(() => {
    const timeZone = 'UTC';
    setDateFrom(state.filter.startDate ? formatInTimeZone(state.filter.startDate, timeZone, 'yyyy-MM-dd') : '');
    setDateTo(state.filter.endDate ? formatInTimeZone(state.filter.endDate, timeZone, 'yyyy-MM-dd') : '');
    setPeriodValue(state.filter.periodValue);
    setPeriodUnit(state.filter.periodUnit);
    setPeriodDepartment(state.filter.periodDepartment);
  }, [state.filter]);

  const handleDateFilter = () => {
    if (dateFrom && dateTo) {
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

  return (
    <Accordion type="single" collapsible className="w-full border rounded-2xl px-6 bg-white/30 border-white/20 shadow-sm">
      <AccordionItem value="advanced-filters" className="border-b-0">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-base text-blue-600 uppercase tracking-tight">{t('advancedFilter')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-6 space-y-6">
          {/* Date Filter Grid (Stacked for narrow spaces) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('historyFrom')}</Label>
              <Input type="date" id="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full shadow-md h-11 bg-white/50 border-white/20 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('historyTo')}</Label>
              <Input type="date" id="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full shadow-md h-11 bg-white/50 border-white/20 rounded-xl" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button onClick={handleDateFilter} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-md h-11 rounded-xl font-bold">{t('filterByDate')}</Button>
              <Button variant="outline" onClick={clearDateFilter} className="flex-1 shadow-md h-11 rounded-xl font-bold">{t('clear')}</Button>
            </div>
          </div>

          {/* Documents Exceeding Period Filter */}
          <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-inner space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="font-bold text-primary text-sm">{t('docsExceeding')}</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={periodValue} onChange={e => setPeriodValue(Number(e.target.value))} min="1" className="w-20 bg-white/50 shadow-md h-11 rounded-xl font-bold text-center" />
                <Select value={periodUnit} onValueChange={v => setPeriodUnit(v as 'days' | 'hours' | 'minutes')}>
                  <SelectTrigger className="flex-1 bg-white/50 shadow-md h-11 rounded-xl font-bold">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="font-body">
                    <SelectItem value="days">{t('days')}</SelectItem>
                    <SelectItem value="hours">{t('hours')}</SelectItem>
                    <SelectItem value="minutes">{t('minutes')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="font-bold text-primary text-sm">{t('in')}</Label>
              <Select value={periodDepartment} onValueChange={setPeriodDepartment}>
                <SelectTrigger className="w-full bg-white/50 shadow-md h-11 rounded-xl font-bold">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="font-body">
                  <SelectItem value="All">{t('allDepartments')}</SelectItem>
                  {state.departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleCalculatePeriod} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md h-11 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 text-xs">{t('calculate')}</Button>
              <Button variant="outline" onClick={clearPeriodFilter} className="flex-1 shadow-md h-11 rounded-xl font-bold transition-all active:scale-95 text-xs">{t('clear')}</Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default function SearchAndFilter() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const t = useTranslation()
  const [searchTerm, setSearchTerm] = useState(state.filter.search);

  useEffect(() => {
    setSearchTerm(state.filter.search);
  }, [state.filter.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch({ type: 'SET_FILTER', payload: { search: searchTerm } })
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, dispatch]);

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All';

  return (
    <div className="space-y-2">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          id="search-id"
          type="text"
          placeholder={t('searchPlaceholder') || t('search')}
          className="w-full pr-24 pl-12 shadow-inner bg-white/40 border-white/20 h-12 rounded-2xl focus:bg-white/80 transition-all font-body font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isFiltered && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">
              {filteredDocs.length} {t('results')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
