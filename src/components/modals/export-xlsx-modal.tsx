
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { useToast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

interface ExportXLSXModalProps {
  isOpen: boolean
  onClose: () => void
}

const ALL_COLUMNS = [
    { key: 'id', name: 'Document ID' },
    { key: 'name', name: 'Name' },
    { key: 'documentType', name: 'Document Type' },
    { key: 'assignedDepartment', name: 'Assigned Department' },
    { key: 'office', name: 'Office' },
    { key: 'status', name: 'Current Status' },
    { key: 'lastUpdate', name: 'Last Update' },
    { key: 'secondaryId', name: 'Secondary ID' },
    { key: 'tertiaryId', name: 'Tertiary ID' },
    { key: 'quaternaryId', name: 'Quaternary ID' },
    { key: 'quinaryId', name: 'Quinary ID' },
    { key: 'senaryId', name: 'Senary ID' },
    { key: 'septenaryId', name: 'Septenary ID' },
    { key: 'octonaryId', name: 'Octonary ID' },
    { key: 'nonaryId', name: 'Nonary ID' },
    { key: 'denaryId', name: 'Denary ID' },
    { key: 'tags', name: 'Tags' },
    { key: 'keywords', name: 'Keywords' },
    { key: 'history', name: 'History' },
    { key: 'documentLink', name: 'Document Links' },
]

export default function ExportXLSXModal({ isOpen, onClose }: ExportXLSXModalProps) {
  const { state } = useAppContext()
  const { selectedDocIds, documents } = state
  const { toast } = useToast()
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ALL_COLUMNS.map(c => c.key)
  )

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const handleExport = () => {
    const docsToExport = documents.filter(doc => selectedDocIds.includes(doc.id))

    if (docsToExport.length === 0) {
      toast({ title: "No documents selected", variant: "destructive" })
      return
    }
    if (selectedColumns.length === 0) {
      toast({ title: "No columns selected", variant: "destructive" })
      return
    }

    const data = docsToExport.map(doc => {
      const row: {[key: string]: any} = {}
      selectedColumns.forEach(key => {
        let value = (doc as any)[key]
        if (key === 'lastUpdate' && value) {
            value = format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
        } else if (key === 'tags' && Array.isArray(value)) {
            value = value.join(', ');
        } else if (key === 'documentLink' && Array.isArray(value)) {
            value = value.join(', ');
        } else if (key === 'history' && Array.isArray(value)) {
            value = value.map(h => 
                `[${h.department}] ${format(new Date(h.start), 'yy-MM-dd HH:mm')} by ${h.receiver}${h.note ? `: ${h.note}` : ''}`
            ).join(' -> ');
        }
        row[ALL_COLUMNS.find(c => c.key === key)?.name || key] = value
      })
      return row
    })

    try {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Documents')
    
        // Auto-size columns
        const columnWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => (row[key] || '').toString().length)) + 2
        }));
        worksheet['!cols'] = columnWidths;

        XLSX.writeFile(workbook, `docuflow_export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast({ title: 'Export Successful', description: `${docsToExport.length} documents exported.` })
        onClose()
    } catch(error) {
        console.error("Export failed:", error);
        toast({ title: 'Export Failed', description: 'There was an error creating the XLSX file.', variant: 'destructive' })
    }

  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Export to XLSX</DialogTitle>
          <DialogDescription>
            Select columns to include in the export for {selectedDocIds.length} document(s).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 my-4">
          <div className="space-y-2 p-4">
            {ALL_COLUMNS.map(col => (
              <div key={col.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${col.key}`}
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => handleToggleColumn(col.key)}
                />
                <label
                  htmlFor={`col-${col.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {col.name}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} disabled={selectedColumns.length === 0}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
