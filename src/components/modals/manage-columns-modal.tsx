'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAppContext } from '@/hooks/use-app-context'
import { COLUMN_CONFIG } from '@/lib/initial-data'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ManageColumnsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageColumnsModal({ isOpen, onClose }: ManageColumnsModalProps) {
  const { state, dispatch } = useAppContext()
  const { columnVisibility } = state

  const handleToggle = async (key: string) => {
    const newVisibility = { ...columnVisibility, [key]: !columnVisibility[key] };
    dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: newVisibility });
    try {
        await setDoc(doc(db, "app-config", "columnVisibility"), newVisibility);
    } catch (error) {
        console.error("Error updating column visibility:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Manage Table Columns</DialogTitle>
          <DialogDescription>Select which columns to display in the document table.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            {Object.entries(COLUMN_CONFIG).map(([key, { name }]) => (
                <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`column-${key}`} className="flex-grow">{name}</Label>
                    <Switch
                        id={`column-${key}`}
                        checked={!!columnVisibility[key]}
                        onCheckedChange={() => handleToggle(key)}
                        disabled={key === 'documentId'}
                    />
                </div>
            ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
