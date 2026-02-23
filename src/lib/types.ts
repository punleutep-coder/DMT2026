
export interface HistoryEntry {
  department: string;
  start: string;
  end: string | null;
  receiver: string;
  note: string;
}

export interface SplitHistoryEntry {
  timestamp: string;
  splitTo: string[];
}

export interface Document {
  id: string;
  firestoreId: string;
  name: string;
  label: string | null;
  documentType: string | null;
  status: string;
  initialDepartment: string;
  assignedDepartment: string | null;
  lastUpdate: string;
  secondaryId: string | null;
  tertiaryId: string | null;
  quaternaryId: string | null;
  quinaryId?: string | null;
  senaryId?: string | null;
  septenaryId?: string | null;
  octonaryId?: string | null;
  nonaryId?: string | null;
  denaryId?: string | null;
  documentLink: string[];
  history: HistoryEntry[];
  tags: string[];
  isDelayed: boolean;
  releaseDate: string | null;
  keywords?: string;
  releaseDateReached?: boolean;
  justReleased?: boolean;
  combinedFrom?: string[];
  splitFrom?: string;
  splitHistory?: SplitHistoryEntry[];
}

export interface Log {
  id: string;
  firestoreId: string;
  docId: string;
  oldStatus: string;
  newStatus: string;
  user: string;
  timestamp: string;
  reason?: string | null;
}

export interface User {
  id: string; // This should be the Firebase Auth UID
  firestoreId: string; // Legacy or for other DBs, can be same as id
  username: string;
  email: string;
  passwordHash: string; // This should NOT be stored or used. Only for initial data shape.
  role: 'Admin' | 'User';
  permissions: { [key: string]: boolean };
  departmentPermissions: string[];
  labelPermissions: string[];
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  documents: Document[];
  logs: Log[];
  departments: string[];
  departmentColors: { [key: string]: string };
  documentTypes: string[];
  assignedDepartments: string[];
  labels: string[];
  receivers: string[];
  filter: {
    mainFilter: string;
    departmentSpecificFilter: string;
    search: string;
    startDate: Date | null;
    endDate: Date | null;
    assignedDepartment: string;
    documentType: string;
    label: string;
    periodValue: number;
    periodUnit: 'days' | 'hours' | 'minutes';
    periodDepartment: string;
    lastUpdateStart: Date | null;
    lastUpdateEnd: Date | null;
  };
  pagination: {
    currentPage: number;
    rowsPerPage: number;
  };
  columnVisibility: { [key: string]: boolean };
  selectedDocIds: string[];
  isInitialized: boolean;
  dialog: DialogState;
  modal: ModalState;
  language: 'en' | 'km';
}

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
  requiresConfirmationText?: boolean;
}

export type ModalType =
  | 'addUser'
  | 'editUser'
  | 'addDocument'
  | 'editDocument'
  | 'viewLog'
  | 'myActivityLog'
  | 'globalActivityLog'
  | 'reporting'
  | 'manageDepartments'
  | 'manageDocumentTypes'
  | 'manageAssignedDepartments'
  | 'manageLabels'
  | 'manageReceivers'
  | 'manageColumns'
  | 'combineDocuments'
  | 'splitDocument'
  | 'delayDocument'
  | 'addNote'
  | 'advanceDocument'
  | 'completeDocument'
  | 'exportXLSX'
  | 'bulkAdvance'
  | null;

export interface ModalState {
  type: ModalType;
  docId?: string;
  userId?: string;
  firestoreId?: string;
}
