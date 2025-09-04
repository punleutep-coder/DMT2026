
import type { Document, Log, User } from './types';

// These keys are no longer used for localStorage but are kept for reference
export const LS_USERS_KEY = 'documentWorkflow_users';
export const LS_DOCUMENTS_KEY = 'documentWorkflow_documents';
export const LS_LOGS_KEY = 'documentWorkflow_logs';
export const LS_DEPARTMENTS_KEY = 'documentWorkflow_departments';
export const LS_COLUMNS_KEY = 'documentWorkflow_columnVisibility';

const DEFAULT_DEPARTMENTS = ['Department A', 'Department B', 'Department C', 'Department D', 'Department E', 'Department F', 'Department G'];

const DEFAULT_DOCS: { [key: string]: Omit<Document, 'id'> } = {
    'CON-001': { firestoreId: 'doc-1', name: 'Contract Review', office: 'Legal Office', status: 'Department C', initialDepartment: 'Department A', assignedDepartment: 'Legal', lastUpdate: '2025-07-16T10:05:00Z', secondaryId: 'SEC-A1', tertiaryId: 'TRT-X1', quaternaryId: null, documentLink: ['https://example.com/contract-review-con001'], history: [{'department':'Department A', start: '2025-07-16T09:00:00Z', end: '2025-07-16T09:30:00Z', receiver: 'Alice Smith', note: 'Initial legal review.'}, {'department': 'Department B', start: '2025-07-16T09:30:00Z', end: '2025-07-16T10:05:00Z', receiver: 'Bob Johnson', note: 'Finance approval pending.'}, {'department':'Department C', start: '2025-07-16T10:05:00Z', end: null, receiver: 'Charlie Brown', note: 'Awaiting executive sign-off.'}], tags: [], isDelayed: false, releaseDate: null, keywords: 'contract legal' },
    'INV-002': { firestoreId: 'doc-2', name: 'Invoice Processing', office: 'Finance Department', status: 'Department A', initialDepartment: 'Department B', assignedDepartment: 'Finance', lastUpdate: '2025-07-16T11:15:00Z', secondaryId: 'SEC-B2', tertiaryId: null, quaternaryId: null, documentLink: ['https://example.com/invoice-inv002', 'https://example.com/invoice-backup-inv002'], history: [{'department':'Department A', start: '2025-07-16T11:15:00Z', end: null, receiver: 'David Lee', note: 'Invoice received and logged.'}], tags: ['Finance'], isDelayed: false, releaseDate: null, keywords: 'invoice finance' },
    'REQ-003': { firestoreId: 'doc-3', name: 'Purchase Requisition', office: 'Procurement Office', status: 'Completed (Success)', initialDepartment: 'Department C', assignedDepartment: 'Procurement', lastUpdate: '2025-07-15T14:00:00Z', secondaryId: null, tertiaryId: 'TRT-Y3', quaternaryId: null, documentLink: [], history: [{'department':'Department A', start: '2025-07-13T10:00:00Z', end: '2025-07-13T12:00:00Z', receiver: 'Eve White', note: 'New requisition created.'},{'department':'Department B', start: '2025-07-13T12:00:00Z', end: '2025-07-14T15:30:00Z', receiver: 'Frank Green', note: 'Vendor selection complete.'},{'department':'Department C', start: '2025-07-14T15:30:00Z', end: '2025-07-14T16:00:00Z', receiver: 'Grace Hall', note: 'Budget verified.'},{'department':'Department D', start: '2025-07-14T16:00:00Z', end: '2025-07-15T11:00:00Z', receiver: 'Henry King', note: 'Final review by manager.'},{'department':'Department E', start: '2025-07-15T11:00:00Z', end: '2025-07-15T12:30:00Z', receiver: 'Ivy Liu', note: 'Approved for purchase.'},{'department':'Department F', start: '2025-07-15T12:30:00Z', end: '2025-07-15T13:45:00Z', receiver: 'Jack Chen', note: 'Order placed.'},{'department':'Department G', start: '2025-07-15T13:45:00Z', end: '2025-07-15T14:00:00Z', receiver: 'Kelly Wu', note: 'Received and closed.'}], tags: ['Procurement', 'Finance'], isDelayed: false, releaseDate: null, keywords: 'purchase procurement' },
    'HR-004': { firestoreId: 'doc-4', name: 'New Hire Onboarding', office: 'HR Department', status: 'Department F', initialDepartment: 'Department A', assignedDepartment: 'Human Resources', lastUpdate: '2025-07-16T13:20:00Z', secondaryId: 'SEC-C4', tertiaryId: 'TRT-Z4', quaternaryId: null, documentLink: ['https://example.com/hr-onboarding-hr004'], history: [{'department':'Department A', start: '2025-07-14T09:00:00Z', end: '2025-07-14T11:00:00Z', receiver: 'Liam Patel', note: 'Initial HR paperwork.'},{'department':'Department B', start: '2025-07-14T11:00:00Z', end: '2025-07-15T10:00:00Z', receiver: 'Mia Singh', note: 'Background check initiated.'},{'department':'Department C', start: '2025-07-15T10:00:00Z', end: '2025-07-15T14:00:00Z', receiver: 'Noah Clark', note: 'Benefits enrollment.'},{'department':'Department D', start: '2025-07-15T14:00:00Z', end: '2025-07-16T09:30:00Z', receiver: 'Olivia Adams', note: 'IT equipment setup.'},{'department':'Department E', start: '2025-07-16T09:30:00Z', end: '2025-07-16T13:20:00Z', receiver: 'Peter Evans', note: 'Welcome kit prepared.'},{'department':'Department F', start: '2025-07-16T13:20:00Z', end: null, receiver: 'Quinn Roberts', note: 'Final check before start date.'}], tags: ['HR', 'Onboarding', 'Employee'], isDelayed: false, releaseDate: null, keywords: 'hr onboarding' },
    'IT-005': { firestoreId: 'doc-5', name: 'Server Patch Request', office: 'IT Operations', status: 'Department B', initialDepartment: 'Department A', assignedDepartment: 'IT', lastUpdate: '2025-07-16T12:00:00Z', secondaryId: null, tertiaryId: null, quaternaryId: null, documentLink: [], history: [{'department':'Department A', start: '2025-07-16T11:45:00Z', end: '2025-07-16T12:00:00Z', receiver: 'Rachel Davis', note: 'Request logged by IT support.'}, {'department':'Department B', start: '2025-07-16T12:00:00Z', end: null, receiver: 'Sam Wilson', note: 'Awaiting patch schedule review.'}], tags: ['IT', 'Server', 'Maintenance'], isDelayed: false, releaseDate: null, keywords: 'it server maintenance' },
};

const DEFAULT_LOGS: { [key: string]: Omit<Log, 'id'> } = {
    'log-1': { firestoreId: 'log-1', docId: 'CON-001', oldStatus: 'Department B', newStatus: 'Department C', user: 'admin', timestamp: '2025-07-16T10:05:00Z' },
    'log-2': { firestoreId: 'log-2', docId: 'CON-001', oldStatus: 'Department A', newStatus: 'Department B', user: 'admin', timestamp: '2025-07-16T09:30:00Z' },
    'log-3': { firestoreId: 'log-3', docId: 'REQ-003', oldStatus: 'Department G', newStatus: 'Completed (Success)', user: 'admin', timestamp: '2025-07-15T14:00:00Z' }
};

const DEFAULT_USERS: { [key: string]: Omit<User, 'id'> } = {
    'user-admin': { firestoreId: 'user-admin', username: 'admin', passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', role: 'Admin', permissions: {}, departmentPermissions: [] }
};

export const COLUMN_CONFIG: { [key: string]: { name: string } } = {
    select: { name: 'Select' },
    documentId: { name: 'Document ID' },
    department: { name: 'Assigned Dept.' },
    name: { name: 'Name' },
    office: { name: 'Office' },
    currentStatus: { name: 'Current Status' },
    lastUpdate: { name: 'Last Update' },
    actions: { name: 'Actions' }
};

export const initialColumnVisibility = Object.keys(COLUMN_CONFIG).reduce((acc, key) => {
    acc[key] = true;
    return acc;
}, {} as { [key: string]: boolean });


export const PERMISSIONS_CONFIG: { [key: string]: string } = {
    canAddDocument: 'Add New Document',
    canCombineDocuments: 'Combine Documents',
    canManageColumns: 'Manage Columns',
    canExportData: 'Export Data',
    canViewLog: 'View Log',
    canViewCompleted: 'View Completed Docs',
    canSplitDocument: 'Split Document',
    canEditCurrentNote: 'Edit Current Note',
    canMoveDocument: 'Move Document (Advance/Back)',
    canDelayDocument: 'Delay Document',
    canReleaseDocument: 'Release Document from Delay',
    canCompleteDocument: 'Complete Document',
    canDeleteDocument: 'Delete Document',
    canOpenDocumentLink1: 'Open Document (Link 1)',
    canOpenDocumentLink2: 'Open Document (Link 2)',
    canOpenDocumentLink3: 'Open Document (Link 3)',
    canOpenDocumentLink4: 'Open Document (Link 4)',
    canEditDocumentId: 'Edit Document ID (Primary)',
    canEditDocumentName: 'Edit Document Name',
    canEditOffice: 'Edit Office',
    canEditAssignedDepartment: 'Edit Assigned Department',
    canEditSecondaryId: 'Edit Secondary ID',
    canEditTertiaryId: 'Edit Tertiary ID',
    canEditQuaternaryId: 'Edit Quaternary ID',
    canEditDocumentLink1: 'Edit Document Link 1',
    canEditDocumentLink2: 'Edit Document Link 2',
    canEditDocumentLink3: 'Edit Document Link 3',
    canEditDocumentLink4: 'Edit Document Link 4',
    canEditKeywords: 'Edit Keywords',
    canEditTags: 'Edit Tags',
    canEditInitialNote: 'Edit Initial Note',
    canManageAdmins: 'Can Manage Admins',
};

export const initialData = {
    documents: DEFAULT_DOCS,
    logs: DEFAULT_LOGS,
    users: DEFAULT_USERS,
    departments: DEFAULT_DEPARTMENTS,
    columnVisibility: initialColumnVisibility,
}
