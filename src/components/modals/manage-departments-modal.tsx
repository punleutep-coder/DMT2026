'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppContext } from '@/hooks/use-app-context'
import { GripVertical, Trash2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

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

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments([...departments, newDepartment.trim()])
      setNewDepartment('')
    }
  }

  const handleDeleteDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
     try {
      const configCollection = collection(db, 'app_config');
      const snapshot = await getDocs(configCollection);
      if (!snapshot.empty) {
        const configDocRef = snapshot.docs[0].ref;
        await updateDoc(configDocRef, { departments: departments });
        toast({ title: "Success", description: "Departments updated." });
        onClose();
      } else {
         throw new Error("App config document not found.");
      }
    } catch (error) {
      console.error("Error updating departments:", error);
      toast({ title: "Error", description: "Could not save departments.", variant: "destructive" });
    }
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
          <DialogDescription>Add, remove, and reorder the departments in your workflow sequence.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ul className="space-y-2">
                {departments.map((dept, index) => (
                    <li 
                        key={index} 
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                    >
                        <GripVertical className="cursor-move text-muted-foreground" />
                        <span className="flex-grow">{dept}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDepartment(index)} disabled={index === 0}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </li>
                ))}
            </ul>

            <div className="mt-6 flex gap-2">
                <Input 
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="New department name"
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
