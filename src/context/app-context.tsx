'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log } from '@/lib/types'
import {
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  LS_USERS_KEY,
  LS_DOCUMENTS_KEY,
  LS_LOGS_KEY,
  LS_DEPARTMENTS_KEY,
  LS_COLUMNS_KEY,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'

type Action =
  | { type: 'INITIALIZE_STATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<Document> }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SET_MODAL'; payload: AppState['modal'] }
  | { type: 'SET_DIALOG'; payload: Partial<AppState['dialog']> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'ADD_LOG'; payload: Log }
  | { type: 'SET_DEPARTMENTS'; payload: string[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
  | { type: 'SET_SELECTED_DOC_IDS'; payload: string[] }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_LOGS'; payload: Log[] }
  | { type: 'CHECK_DELAYED_DOCUMENTS' }

const initialState: AppState = {
  users: [],
  currentUser: null,
  documents: [],
  logs: [],
  departments: [],
  filter: {
    mainFilter: 'All',
    departmentSpecificFilter: 'All',
    search: '',
    startDate: null,
    endDate: null,
    assignedDepartment: 'All',
    periodValue: 3,
    periodUnit: 'days',
  },
  columnVisibility: initialColumnVisibility,
  selectedDocIds: [],
  isInitialized: false,
  dialog: { isOpen: false, title: '', message: '' },
  modal: { type: null },
}

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'INITIALIZE_STATE':
        return { ...state, ...action.payload, isInitialized: true };
    case 'LOGIN':
      return { ...state, currentUser: action.payload }
    case 'LOGOUT':
      return { ...state, currentUser: null }
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } }
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] }
    case 'UPDATE_DOCUMENT':
        return { ...state, documents: state.documents.map(doc => doc.id === action.payload.id ? { ...doc, ...action.payload } : doc) }
    case 'DELETE_DOCUMENT':
        return { ...state, documents: state.documents.filter(doc => doc.id !== action.payload) }
    case 'SET_MODAL':
      return { ...state, modal: action.payload }
    case 'SET_DIALOG':
      return { ...state, dialog: { ...initialState.dialog, ...action.payload, isOpen: true } }
    case 'CLOSE_DIALOG':
        return { ...state, dialog: { ...state.dialog, isOpen: false } }
    case 'ADD_LOG':
        return { ...state, logs: [...state.logs, action.payload] }
    case 'SET_DEPARTMENTS':
        return { ...state, departments: action.payload };
    case 'ADD_USER':
        return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
        return { ...state, users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u) }
    case 'DELETE_USER':
        return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'SET_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload };
    case 'SET_SELECTED_DOC_IDS':
        return { ...state, selectedDocIds: action.payload }
    case 'SET_DOCUMENTS':
        return { ...state, documents: action.payload };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'SET_LOGS':
        return { ...state, logs: action.payload };
    case 'CHECK_DELAYED_DOCUMENTS':
        const today = new Date().setHours(0, 0, 0, 0);
        let changed = false;
        const updatedDocs = state.documents.map(doc => {
            if (doc.isDelayed && doc.releaseDate) {
                const releaseDate = new Date(doc.releaseDate).setHours(0,0,0,0);
                if (today >= releaseDate && !doc.releaseDateReached) {
                    changed = true;
                    return { ...doc, releaseDateReached: true, justReleased: true };
                }
            }
            // remove highlight after one render cycle
            if (doc.justReleased) {
                changed = true;
                return { ...doc, justReleased: false }
            }
            return doc;
        });

        if (changed) {
            return { ...state, documents: updatedDocs };
        }
        return state;
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  filteredDocs: Document[];
}

export const AppContext = createContext<AppContextValue>({
  state: initialState,
  dispatch: () => null,
  filteredDocs: [],
})

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  const filteredDocs = useMemo(() => {
    let docs = state.documents

    docs = docs.filter(doc => {
      const searchLower = state.filter.search.toLowerCase()
      const searchMatch =
        !searchLower ||
        doc.id.toLowerCase().includes(searchLower) ||
        doc.name.toLowerCase().includes(searchLower) ||
        (doc.office && doc.office.toLowerCase().includes(searchLower)) ||
        (doc.secondaryId && doc.secondaryId.toLowerCase().includes(searchLower)) ||
        (doc.tertiaryId && doc.tertiaryId.toLowerCase().includes(searchLower)) ||
        (doc.quaternaryId && doc.quaternaryId.toLowerCase().includes(searchLower)) ||
        (doc.assignedDepartment && doc.assignedDepartment.toLowerCase().includes(searchLower)) ||
        (doc.keywords && doc.keywords.toLowerCase().includes(searchLower)) ||
        doc.tags.join(', ').toLowerCase().includes(searchLower)

      let dateMatch = true
      if (state.filter.startDate && state.filter.endDate) {
        dateMatch = false
        if (doc.history && Array.isArray(doc.history)) {
          for (const entry of doc.history) {
            const entryStart = new Date(entry.start)
            const entryEnd = entry.end ? new Date(entry.end) : new Date()
            const overlap =
              entryStart <= state.filter.endDate! && entryEnd >= state.filter.startDate!
            if (overlap) {
              dateMatch = true
              break
            }
          }
        }
      }

      const assignedDeptMatch =
        state.filter.assignedDepartment === 'All' ||
        doc.assignedDepartment === state.filter.assignedDepartment
      
      return searchMatch && dateMatch && assignedDeptMatch
    })

    if (state.filter.mainFilter !== 'All') {
        if (state.filter.mainFilter === 'Exceeding Period') {
            docs = docs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit));
        } else if (state.filter.mainFilter === 'In Progress') {
            docs = docs.filter(d => !d.isDelayed && !d.status.startsWith('Completed') && d.status !== 'Combined' && d.status !== 'Split');
        } else if (state.filter.mainFilter === 'Delayed') {
            docs = docs.filter(d => d.isDelayed && !d.releaseDateReached);
        } else if (state.filter.mainFilter === 'Release Date Reached') {
            docs = docs.filter(d => d.releaseDateReached === true);
        } else if (state.filter.mainFilter === 'Completed') {
            docs = docs.filter(d => d.status.startsWith('Completed'));
        } else if (state.filter.mainFilter.startsWith('Completed (')) {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        } else if (state.filter.mainFilter === 'Combined' || state.filter.mainFilter === 'Split') {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        }
    } else {
        docs = docs.filter(doc => doc.status !== 'Combined' && doc.status !== 'Split');
    }

    if (state.filter.departmentSpecificFilter !== 'All') {
        docs = docs.filter(doc => doc.status === state.filter.departmentSpecificFilter);
    }
    
    docs = docs.filter(doc => hasDepartmentPermission(state.currentUser, doc.status))

    return docs
  }, [state.documents, state.filter, state.currentUser])


  useEffect(() => {
    const loadState = async () => {
        try {
            const lsUsers = localStorage.getItem(LS_USERS_KEY);
            const lsDocs = localStorage.getItem(LS_DOCUMENTS_KEY);
            const lsLogs = localStorage.getItem(LS_LOGS_KEY);
            const lsDepartments = localStorage.getItem(LS_DEPARTMENTS_KEY);
            const lsColumns = localStorage.getItem(LS_COLUMNS_KEY);

            const users = lsUsers ? JSON.parse(lsUsers) : [];
            if (users.length === 0) {
                const hashedPassword = await hashPassword('admin');
                users.push({
                    id: `user-${Date.now()}`,
                    username: 'admin',
                    passwordHash: hashedPassword,
                    role: 'Admin',
                    permissions: {},
                    departmentPermissions: []
                });
            }

            dispatch({ type: 'INITIALIZE_STATE', payload: {
                users: users,
                documents: lsDocs ? JSON.parse(lsDocs) : DEFAULT_DOCS,
                logs: lsLogs ? JSON.parse(lsLogs) : DEFAULT_LOGS,
                departments: lsDepartments ? JSON.parse(lsDepartments) : DEFAULT_DEPARTMENTS,
                columnVisibility: lsColumns ? JSON.parse(lsColumns) : initialColumnVisibility
            }});
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
            dispatch({ type: 'INITIALIZE_STATE', payload: {
                users: [],
                documents: DEFAULT_DOCS,
                logs: DEFAULT_LOGS,
                departments: DEFAULT_DEPARTMENTS,
                columnVisibility: initialColumnVisibility
            }});
        }
    }
    loadState();
  }, []);

  useEffect(() => {
    if (state.isInitialized) {
        localStorage.setItem(LS_USERS_KEY, JSON.stringify(state.users));
        localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(state.documents));
        localStorage.setItem(LS_LOGS_KEY, JSON.stringify(state.logs));
        localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(state.departments));
        localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(state.columnVisibility));
    }
  }, [state]);
  
  useEffect(() => {
    if (state.isInitialized) {
        const interval = setInterval(() => {
            dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }
  }, [state.isInitialized]);

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
