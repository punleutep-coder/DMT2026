'use client'

import { useAppContext } from "@/hooks/use-app-context"
import AddDocumentModal from "./add-document-modal"
import EditDocumentModal from "./edit-document-modal"
import LogModal from "./log-modal"
import UserManagementModal from "./user-management-modal"
import ManageDepartmentsModal from "./manage-departments-modal"
import ManageColumnsModal from "./manage-columns-modal"
import CombineDocumentsModal from "./combine-documents-modal"
import SplitDocumentModal from "./split-document-modal"
import DelayDocumentModal from "./delay-document-modal"
import EditNoteModal from "./edit-note-modal"
import AdvanceDocumentModal from "./advance-document-modal"
import CompleteDocumentModal from "./complete-document-modal"

export default function ModalManager() {
    const { state, dispatch } = useAppContext();
    const { type, docId, userId } = state.modal;

    if (!type) return null;

    const handleClose = () => {
        dispatch({ type: 'SET_MODAL', payload: { type: null } });
    }

    switch(type) {
        case 'addDocument':
            return <AddDocumentModal isOpen={true} onClose={handleClose} />
        case 'editDocument':
            return <EditDocumentModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'viewLog':
            return <LogModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'addUser':
        case 'editUser':
            return <UserManagementModal isOpen={true} onClose={handleClose} userId={userId} />
        case 'manageDepartments':
            return <ManageDepartmentsModal isOpen={true} onClose={handleClose} />
        case 'manageColumns':
            return <ManageColumnsModal isOpen={true} onClose={handleClose} />
        case 'combineDocuments':
            return <CombineDocumentsModal isOpen={true} onClose={handleClose} />
        case 'splitDocument':
            return <SplitDocumentModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'delayDocument':
            return <DelayDocumentModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'editNote':
            return <EditNoteModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'advanceDocument':
            return <AdvanceDocumentModal isOpen={true} onClose={handleClose} docId={docId!} />
        case 'completeDocument':
            return <CompleteDocumentModal isOpen={true} onClose={handleClose} docId={docId!} />
        default:
            return null;
    }
}
