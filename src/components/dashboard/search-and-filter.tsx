'use client'

import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { format } from 'date-fns';


export default function SearchAndFilter() {
  const { state, dispatch, filteredDocs } = useAppContext()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodValue, setPeriodValue] = useState(state.filter.periodValue);
  const [periodUnit, setPeriodUnit] = useState(state.filter.periodUnit);

  useEffect(() => {
    setDateFrom(state.filter.startDate ? format(state.filter.startDate, 'yyyy-MM-dd') : '');
    setDateTo(state.filter.endDate ? format(state.filter.endDate, 'yyyy-MM-dd') : '');
    setPeriodValue(state.filter.periodValue);
    setPeriodUnit(state.filter.periodUnit);
  }, [state.filter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FILTER', payload: { search: e.target.value } })
  }

  const handleDateFilter = () => {
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      dispatch({ type: 'SET_FILTER', payload: { startDate: start, endDate: end } })
    }
  }

  const clearDateFilter = () => {
    setDateFrom('')
    setDateTo('')
    dispatch({ type: 'SET_FILTER', payload: { startDate: null, endDate: null } })
  }
  
  const handleCalculatePeriod = () => {
    dispatch({ type: 'SET_FILTER', payload: { periodValue, periodUnit, mainFilter: 'Exceeding Period' } })
  }

  const isFiltered = state.filter.search || state.filter.startDate || state.filter.assignedDepartment !== 'All';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="search-id">Search by Document ID, Name, Tags...</Label>
          <div className="relative">
            <Input
              id="search-id"
              type="text"
              placeholder="Search..."
              className="w-full pr-24"
              value={state.filter.search}
              onChange={handleSearchChange}
            />
            {isFiltered && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-sm text-muted-foreground">
                  {filteredDocs.length} found
                </span>
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="date-from">History From:</Label>
          <Input type="date" id="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full" />
        </div>
        <div>
          <Label htmlFor="date-to">History To:</Label>
          <Input type="date" id="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
            <Label>Documents exceeding:</Label>
            <Input type="number" value={periodValue} onChange={e => setPeriodValue(Number(e.target.value))} min="1" className="w-20 bg-card" />
            <Select value={periodUnit} onValueChange={setPeriodUnit}>
                <SelectTrigger className="w-[120px] bg-card">
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleCalculatePeriod} className="bg-blue-600 hover:bg-blue-700 text-white">Calculate</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDateFilter} className="bg-teal-600 hover:bg-teal-700 text-white">Filter</Button>
          <Button variant="ghost" onClick={clearDateFilter}>Clear</Button>
        </div>
      </div>
    </div>
  )
}
