
'use client'
import React, { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppContext } from '@/hooks/use-app-context'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export default function ConfirmDialog() {
  const { state, dispatch } = useAppContext()
  const { isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isAlert, requiresConfirmationText } = state.dialog
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(!requiresConfirmationText)

  useEffect(() => {
    if (requiresConfirmationText) {
      setIsConfirmed(confirmationInput === 'DELETE');
    }
  }, [confirmationInput, requiresConfirmationText]);

  useEffect(() => {
    // Reset state when dialog opens
    if (isOpen) {
      setConfirmationInput('');
      setIsConfirmed(!requiresConfirmationText);
    }
  }, [isOpen, requiresConfirmationText]);

  const handleCancel = () => {
    if (onCancel) onCancel();
    dispatch({ type: 'CLOSE_DIALOG' })
  }

  const handleConfirm = () => {
    if (isConfirmed) {
      if (onConfirm) onConfirm();
      dispatch({ type: 'CLOSE_DIALOG' })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={() => dispatch({ type: 'CLOSE_DIALOG' })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {requiresConfirmationText && (
          <div className="space-y-2 py-2">
            <Label htmlFor="confirmation-input">Type <span className="font-bold text-destructive">DELETE</span> to confirm.</Label>
            <Input 
              id="confirmation-input"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <AlertDialogFooter>
          {!isAlert && (
             <AlertDialogCancel onClick={handleCancel}>
                {cancelText || 'Cancel'}
             </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm} disabled={!isConfirmed}>
            {confirmText || 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
