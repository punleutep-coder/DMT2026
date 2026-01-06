
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
import AddNoteModal from "./add-note-modal"
import AdvanceDocumentModal from "./advance-document-modal"
import CompleteDocumentModal from "./complete-document-modal"
import MyActivityLogModal from "./my-activity-log-modal"
import ReportingModal from "./reporting-modal"
import ManageDocumentTypesModal from "./manage-document-types-modal"
import ManageAssignedDepartmentsModal from "./manage-assigned-departments-modal"
import GlobalActivityLogModal from "./global-activity-log-modal"
import ExportXLSXModal from "./export-xlsx-modal"
import BulkAdvanceModal from "./bulk-advance-modal"
import ManageLabelsModal from "./manage-labels-modal"

export default function ModalManager() {
    const { state, dispatch } = useAppContext();
    const { type, docId, userId, firestoreId } = state.modal;

    if (!type) return null;

    const handleClose = () => {
        dispatch({ type: 'SET_MODAL', payload: { type: null } });
    }

    switch(type) {
        case 'addDocument':
            return <AddDocumentModal isOpen={true} onClose={handleClose} />
        case 'editDocument':
            return <EditDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'viewLog':
            return <LogModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'myActivityLog':
            return <MyActivityLogModal isOpen={true} onClose={handleClose} />
        case 'globalActivityLog':
            return <GlobalActivityLogModal isOpen={true} onClose={handleClose} />
        case 'reporting':
            return <ReportingModal isOpen={true} onClose={handleClose} />
        case 'addUser':
            return <UserManagementModal isOpen={true} onClose={handleClose} />
        case 'editUser':
            return <UserManagementModal isOpen={true} onClose={handleClose} userId={userId} />
        case 'manageDepartments':
            return <ManageDepartmentsModal isOpen={true} onClose={handleClose} />
        case 'manageDocumentTypes':
            return <ManageDocumentTypesModal isOpen={true} onClose={handleClose} />
        case 'manageAssignedDepartments':
            return <ManageAssignedDepartmentsModal isOpen={true} onClose={handleClose} />
        case 'manageLabels':
            return <ManageLabelsModal isOpen={true} onClose={handleClose} />
        case 'manageColumns':
            return <ManageColumnsModal isOpen={true} onClose={handleClose} />
        case 'combineDocuments':
            return <CombineDocumentsModal isOpen={true} onClose={handleClose} />
        case 'splitDocument':
            return <SplitDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'delayDocument':
            return <DelayDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'addNote':
            return <AddNoteModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'advanceDocument':
            return <AdvanceDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'completeDocument':
            return <CompleteDocumentModal isOpen={true} onClose={handleClose} docId={docId!} firestoreId={firestoreId!} />
        case 'exportXLSX':
            return <ExportXLSXModal isOpen={true} onClose={handleClose} />
        case 'bulkAdvance':
            return <BulkAdvanceModal isOpen={true} onClose={handleClose} />
        default:
            return null;
    }
}
