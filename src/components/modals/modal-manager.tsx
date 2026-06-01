
'use client'

import { useAppContext } from "@/hooks/use-app-context"
import LogModal from "./log-modal"
import ManageDepartmentsModal from "./manage-departments-modal"
import ManageColumnsModal from "./manage-columns-modal"
import DelayDocumentModal from "./delay-document-modal"
import AddNoteModal from "./add-note-modal"
import ManageDocumentTypesModal from "./manage-document-types-modal"
import ManageAssignedDepartmentsModal from "./manage-assigned-departments-modal"
import ExportXLSXModal from "./export-xlsx-modal"
import ManageLabelsModal from "./manage-labels-modal"
import ManageReceiversModal from "./manage-receivers-modal"

export default function ModalManager() {
    const { state, dispatch } = useAppContext();
    const { type, docId, userId, firestoreId } = state.modal;

    if (!type) return null;

    const handleClose = () => {
        dispatch({ type: 'SET_MODAL', payload: { type: null } });
    }

    switch(type) {
        case 'viewLog':
            return <LogModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'manageDepartments':
            return <ManageDepartmentsModal isOpen={true} onClose={handleClose} />
        case 'manageDocumentTypes':
            return <ManageDocumentTypesModal isOpen={true} onClose={handleClose} />
        case 'manageAssignedDepartments':
            return <ManageAssignedDepartmentsModal isOpen={true} onClose={handleClose} />
        case 'manageLabels':
            return <ManageLabelsModal isOpen={true} onClose={handleClose} />
        case 'manageReceivers':
            return <ManageReceiversModal isOpen={true} onClose={handleClose} />
        case 'manageColumns':
            return <ManageColumnsModal isOpen={true} onClose={handleClose} />
        case 'delayDocument':
            return <DelayDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'addNote':
            return <AddNoteModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'exportXLSX':
            return <ExportXLSXModal isOpen={true} onClose={handleClose} />
        default:
            // These views are now handled as full-page views in Dashboard.tsx:
            // addDocument, editDocument, myActivityLog, globalActivityLog, reporting, addUser, editUser,
            // combineDocuments, splitDocument, advanceDocument, completeDocument, bulkAdvance, bulkEditDetails, bulkComplete
            return null;
    }
}
