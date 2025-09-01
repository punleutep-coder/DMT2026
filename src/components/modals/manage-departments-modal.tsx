
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppContext } from '@/hooks/use-app-context'
import { GripVertical, Trash2, Pencil, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ManageDepartmentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageDepartmentsModal({ isOpen, onClose }: ManageDepartmentsModalProps) {
  const { state, dispatch } = useAppContext()
  const { toast } = useToast()
  const [departments, setDepartments] = useState([...state.departments])
  const [newDepartment, setNewDepartment] = useState('')
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    setDepartments([...state.departments]);
  }, [state.departments]);

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments([...departments, newDepartment.trim()])
      setNewDepartment('')
    }
  }

  const handleDeleteDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index))
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
    if (departments.includes(editingValue.trim()) && departments[index] !== editingValue.trim()) {
        toast({ title: 'Error', description: 'Department name already exists.', variant: 'destructive' });
        return;
    }

    const oldName = departments[index];
    const newName = editingValue.trim();

    if (oldName !== newName) {
        dispatch({ type: 'UPDATE_DEPARTMENT_NAME', payload: { oldName, newName } });
    }

    handleCancelEditing();
  }

  const handleSave = () => {
    // We only need to save the order and new/deleted departments. Edits are handled separately.
    dispatch({ type: 'SET_DEPARTMENTS', payload: departments })
    onClose()
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
      e.preventDefault();
      if (draggedItem === null || draggedItem === index) return;
      const newItems = [...departments];
      const [reorderedItem] = newItems.splice(draggedItem, 1);
      newItems.splice(index, 0, reorderedItem);
      setDraggedItem(index);
      setDepartments(newItems);
  };

  const handleDragEnd = () => {
      setDraggedItem(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphic-card">
        <DialogHeader>
          <DialogTitle>Manage Workflow Departments</DialogTitle>
          <DialogDescription>Add, remove, edit, and reorder the departments in your workflow sequence.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <ScrollArea className="h-[40vh] p-4 border rounded-md">
                <ul className="space-y-2">
                    {departments.map((dept, index) => (
                        <li 
                            key={index} 
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                            draggable={editingIndex === null}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <GripVertical className="cursor-move text-muted-foreground" />
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDepartment(index)} disabled={index === 0}>
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
                    placeholder="New department name"
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
