'use client'

import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useMemo } from 'react'

export default function SearchAndFilter() {
  const { state, dispatch } = useAppContext()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodValue, setPeriodValue] = useState(3)
  const [periodUnit, setPeriodUnit] = useState('days')

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
    // This is mainly for updating the "Exceeding Period" metric box.
    // The actual filtering logic will use these values when the filter is active.
    // We can dispatch an action to trigger a re-calculation if needed.
    if (state.filter.mainFilter === 'Exceeding Period') {
        dispatch({ type: 'SET_FILTER', payload: { ...state.filter } }) // Re-trigger filter
    }
  }
  
  const documentsWithAssignedDept = useMemo(() => {
    return [...new Set(state.documents.map(d => d.assignedDepartment).filter(Boolean))]
  }, [state.documents]);


  return (
    <div className="p-3 border rounded-lg bg-background/50 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Search by Document ID, Name, Tags..."
            className="w-full"
            value={state.filter.search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          <Label htmlFor="date-from">From:</Label>
          <Input type="date" id="date-from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto" />
          <Label htmlFor="date-to">To:</Label>
          <Input type="date" id="date-to" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto" />
          <Button onClick={handleDateFilter}>Filter</Button>
          <Button variant="ghost" onClick={clearDateFilter}>Clear</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full pt-4 border-t">
        <Label>Exceeding:</Label>
        <Input type="number" value={periodValue} onChange={e => setPeriodValue(Number(e.target.value))} min="1" className="w-20" />
        <Select value={periodUnit} onValueChange={setPeriodUnit}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
            </SelectContent>
        </Select>
        <Button onClick={handleCalculatePeriod} variant="secondary">Calculate</Button>
      </div>
    </div>
  )
}
