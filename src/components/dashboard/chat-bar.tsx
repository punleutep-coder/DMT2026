
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, FileText } from 'lucide-react'
import { Badge } from '../ui/badge'

export default function ChatBar() {
  const { state, dispatch } = useAppContext()
  const { isOpen, title, documents } = state.chatBar

  const handleClose = () => {
    dispatch({ type: 'CLOSE_CHAT_BAR' })
  }

  const handleDocumentClick = (docId: string, firestoreId: string) => {
    dispatch({ type: 'SET_MODAL', payload: { type: 'viewLog', docId, firestoreId } })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl glassmorphic-card border-l-0" side="right">
            <SheetHeader className="pr-12">
                <SheetTitle>{title} ({documents.length})</SheetTitle>
            </SheetHeader>
             <SheetClose asChild>
                <Button variant="ghost" className="absolute right-4 top-4 h-8 w-8 p-0" onClick={handleClose}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </Button>
            </SheetClose>
            <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-4">
                {documents.length > 0 ? (
                    documents.map(doc => (
                        <div 
                            key={doc.id} 
                            className="p-4 bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleDocumentClick(doc.id, doc.firestoreId)}
                        >
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-primary mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{doc.id} - {doc.name}</p>
                                    <p className="text-sm text-muted-foreground">{doc.status}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {Array.isArray(doc.tags) && doc.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No documents to display for this category.</p>
                    </div>
                )}
                </div>
            </ScrollArea>
        </SheetContent>
    </Sheet>
  )
}
