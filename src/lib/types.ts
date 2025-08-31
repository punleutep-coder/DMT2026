

export type Theme = 'dark' | 'light'

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
  office: string | null;
  status: string;
  initialDepartment: string;
  assignedDepartment: string | null;
  lastUpdate: string;
  secondaryId: string | null;
  tertiaryId: string | null;
  quaternaryId: string | null;
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
  id: string;
  firestoreId: string;
  username: string;
  passwordHash: string;
  role: 'Admin' | 'User';
  permissions: { [key: string]: boolean };
  departmentPermissions: string[];
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  documents: Document[];
  logs: Log[];
  departments: string[];
  filter: {
    mainFilter: string;
    departmentSpecificFilter: string;
    search: string;
    startDate: Date | null;
    endDate: Date | null;
    assignedDepartment: string;
    periodValue: number;
    periodUnit: 'days' | 'hours' | 'minutes';
    periodDepartment: string;
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
  theme: Theme;
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
}

export type ModalType =
  | 'addUser'
  | 'editUser'
  | 'addDocument'
  | 'editDocument'
  | 'viewLog'
  | 'myActivityLog'
  | 'manageDepartments'
  | 'manageColumns'
  | 'combineDocuments'
  | 'splitDocument'
  | 'delayDocument'
  | 'editNote'
  | 'advanceDocument'
  | 'completeDocument'
  | null;

export interface ModalState {
  type: ModalType;
  docId?: string;
  userId?: string;
  firestoreId?: string;
}
