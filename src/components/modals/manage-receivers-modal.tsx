
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useAppContext } from '@/hooks/use-app-context'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from '@/lib/i18n'

interface ManageReceiversModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManageReceiversModal({ isOpen, onClose }: ManageReceiversModalProps) {
  const { state, dispatch } = useAppContext()
  const { toast } = useToast()
  const t = useTranslation()
  const [receivers, setReceivers] = useState([...state.receivers])
  const [newReceiver, setNewReceiver] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    setReceivers([...state.receivers]);
  }, [state.receivers]);

  const handleAddReceiver = () => {
    if (newReceiver.trim() && !receivers.includes(newReceiver.trim())) {
      setReceivers([...receivers, newReceiver.trim()])
      setNewReceiver('')
    }
  }

  const handleDeleteReceiver = (index: number) => {
    setReceivers(receivers.filter((_, i) => i !== index))
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
        toast({ title: 'Error', description: 'Receiver name cannot be empty.', variant: 'destructive' });
        return;
    }
    if (receivers.includes(editingValue.trim()) && receivers[index] !== editingValue.trim()) {
        toast({ title: 'Error', description: 'Receiver name already exists.', variant: 'destructive' });
        return;
    }

    const updatedReceivers = [...receivers];
    updatedReceivers[index] = editingValue.trim();
    setReceivers(updatedReceivers);
    handleCancelEditing();
  }

  const handleSave = () => {
    dispatch({ type: 'SET_RECEIVERS', payload: receivers.sort() })
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphic-card">
        <DialogHeader>
          <DialogTitle>{t('manageReceivers')}</DialogTitle>
          <DialogDescription>{t('manageReceiversDesc')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <ScrollArea className="h-[40vh] p-4 border rounded-md">
                <ul className="space-y-2">
                    {receivers.map((receiver, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            {editingIndex === index ? (
                                <Input 
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="flex-grow h-8"
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit(index)}
                                />
                            ) : (
                                <span className="flex-grow">{receiver}</span>
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEditing(index, receiver)}>
                                        <Pencil className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteReceiver(index)}>
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
                    value={newReceiver}
                    onChange={(e) => setNewReceiver(e.target.value)}
                    placeholder={t('newReceiverName')}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReceiver()}
                />
                <Button onClick={handleAddReceiver}>{t('add')}</Button>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button type="button" onClick={handleSave}>{t('saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
