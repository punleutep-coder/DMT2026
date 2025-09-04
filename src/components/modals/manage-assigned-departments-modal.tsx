
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppContext } from '@/hooks/use-app-context'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ManageAssignedDepartmentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageAssignedDepartmentsModal({ isOpen, onClose }: ManageAssignedDepartmentsModalProps) {
  const { state, dispatch } = useAppContext()
  const { toast } = useToast()
  const [assignedDepartments, setAssignedDepartments] = useState([...state.assignedDepartments])
  const [newDepartment, setNewDepartment] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    setAssignedDepartments([...state.assignedDepartments]);
  }, [state.assignedDepartments]);

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !assignedDepartments.includes(newDepartment.trim())) {
      setAssignedDepartments([...assignedDepartments, newDepartment.trim()])
      setNewDepartment('')
    }
  }

  const handleDeleteDepartment = (index: number) => {
    setAssignedDepartments(assignedDepartments.filter((_, i) => i !== index))
  }

  const handleStartEditing = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditingValue(currentValue);
  }

  const handleCancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
  }

  const handleConfirmEdit = (index: number) => {
    if (!editingValue.trim()) {
        toast({ title: 'Error', description: 'Department name cannot be empty.', variant: 'destructive' });
        return;
    }
    if (assignedDepartments.includes(editingValue.trim()) && assignedDepartments[index] !== editingValue.trim()) {
        toast({ title: 'Error', description: 'Department name already exists.', variant: 'destructive' });
        return;
    }

    const updatedDepts = [...assignedDepartments];
    updatedDepts[index] = editingValue.trim();
    setAssignedDepartments(updatedDepts);
    handleCancelEditing();
  }

  const handleSave = () => {
    dispatch({ type: 'SET_ASSIGNED_DEPARTMENTS', payload: assignedDepartments.sort() })
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Manage Assigned Departments</DialogTitle>
          <DialogDescription>Add, edit, or remove the assigned departments available in dropdowns.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <ScrollArea className="h-[40vh] p-4 border rounded-md">
                <ul className="space-y-2">
                    {assignedDepartments.map((dept, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            {editingIndex === index ? (
                                <Input 
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="flex-grow h-8"
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit(index)}
                                />
                            ) : (
                                <span className="flex-grow">{dept}</span>
                            )}
                            
                            {editingIndex === index ? (
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" onClick={() => handleConfirmEdit(index)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleCancelEditing}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEditing(index, dept)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDepartment(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </ScrollArea>

            <div className="mt-6 flex gap-2">
                <Input 
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="New assigned department"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                />
                <Button onClick={handleAddDepartment}>Add</Button>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
