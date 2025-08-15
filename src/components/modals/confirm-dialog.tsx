'use client'

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

export default function ConfirmDialog() {
  const { state, dispatch } = useAppContext()
  const { isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isAlert } = state.dialog

  const handleCancel = () => {
    if (onCancel) onCancel();
    dispatch({ type: 'CLOSE_DIALOG' })
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    dispatch({ type: 'CLOSE_DIALOG' })
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
        <AlertDialogFooter>
          {!isAlert && (
             <AlertDialogCancel onClick={handleCancel}>
                {cancelText || 'Cancel'}
             </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText || 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
