'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
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
  DEFAULT_USERS,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'

type Action =
  | { type: 'SET_INITIALIZED' }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<Document> & { id: string } }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_LOG'; payload: Omit<Log, 'id'> }
  | { type: 'SET_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
  | { type: 'SET_MODAL'; payload: ModalState }
  | { type: 'SET_DIALOG'; payload: Partial<DialogState> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_SELECTED_DOC_IDS'; payload: string[] }
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
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: true };
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'UPDATE_DOCUMENT': {
      const index = state.documents.findIndex(d => d.id === action.payload.id);
      if (index === -1) return state;
      const newDocuments = [...state.documents];
      newDocuments[index] = { ...newDocuments[index], ...action.payload };
      return { ...state, documents: newDocuments };
    }
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
        logs: state.logs.filter(l => l.docId !== action.payload)
      };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER': {
      const userIndex = state.users.findIndex(u => u.id === action.payload.id);
      if (userIndex === -1) return state;
      const newUsers = [...state.users];
      newUsers[userIndex] = action.payload;
      return { ...state, users: newUsers };
    }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'ADD_LOG': {
        const newLog: Log = {
            ...action.payload,
            id: `log-${Date.now()}`
        };
        return { ...state, logs: [...state.logs, newLog] };
    }
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload };
    case 'SET_MODAL':
        return { ...state, modal: action.payload };
    case 'SET_DIALOG':
        return { ...state, dialog: { ...initialState.dialog, ...action.payload, isOpen: true } };
    case 'CLOSE_DIALOG':
        return { ...state, dialog: { ...state.dialog, isOpen: false } };
    case 'SET_SELECTED_DOC_IDS':
        return { ...state, selectedDocIds: action.payload };
    case 'CHECK_DELAYED_DOCUMENTS': {
        const today = new Date().setHours(0, 0, 0, 0);
        let changed = false;
        const newDocuments = state.documents.map(doc => {
            let releaseDateReached = doc.releaseDateReached;
            let justReleased = doc.justReleased;

            if (doc.isDelayed && doc.releaseDate) {
                const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !doc.releaseDateReached) {
                    releaseDateReached = true;
                    justReleased = true;
                    changed = true;
                }
            } else if (doc.justReleased) {
                justReleased = false;
                changed = true;
            }
            return { ...doc, releaseDateReached, justReleased };
        });
        
        return changed ? { ...state, documents: newDocuments } : state;
    }
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

  // Effect to load data from localStorage on mount
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem(LS_USERS_KEY) || JSON.stringify(DEFAULT_USERS))
      const documents = JSON.parse(localStorage.getItem(LS_DOCUMENTS_KEY) || JSON.stringify(DEFAULT_DOCS))
      const logs = JSON.parse(localStorage.getItem(LS_LOGS_KEY) || JSON.stringify(DEFAULT_LOGS))
      const departments = JSON.parse(localStorage.getItem(LS_DEPARTMENTS_KEY) || JSON.stringify(DEFAULT_DEPARTMENTS))
      const columnVisibility = JSON.parse(localStorage.getItem(LS_COLUMNS_KEY) || JSON.stringify(initialColumnVisibility))
      
      dispatch({ type: 'ADD_USER', payload: users[0] });
      documents.forEach((doc: Document) => dispatch({ type: 'ADD_DOCUMENT', payload: doc }));
      logs.forEach((log: Log) => dispatch({ type: 'ADD_LOG', payload: log }));
      dispatch({ type: 'SET_DEPARTMENTS', payload: departments });
      dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: columnVisibility });

      const savedUser = sessionStorage.getItem('currentUser');
      if (savedUser) {
        dispatch({ type: 'LOGIN', payload: JSON.parse(savedUser) });
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error)
    } finally {
      dispatch({ type: 'SET_INITIALIZED' });
    }
  }, []);

  // Effect to save data to localStorage whenever it changes
  useEffect(() => {
    if (state.isInitialized) {
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(state.users));
      localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(state.documents));
      localStorage.setItem(LS_LOGS_KEY, JSON.stringify(state.logs));
      localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(state.departments));
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(state.columnVisibility));
      
      const savedUser = sessionStorage.getItem('currentUser');
      if (savedUser) {
          const user = JSON.parse(savedUser);
          if (user) {
             dispatch({ type: 'LOGIN', payload: user });
          }
      }
    }
  }, [state.users, state.documents, state.logs, state.departments, state.columnVisibility, state.isInitialized]);

  // Effect to check for delayed documents periodically
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
