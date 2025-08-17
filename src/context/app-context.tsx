
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  DEFAULT_USERS,
  LS_USERS_KEY,
  LS_DOCUMENTS_KEY,
  LS_LOGS_KEY,
  LS_DEPARTMENTS_KEY,
  LS_COLUMNS_KEY
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'

type Action =
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: { documents?: Document[], users?: User[], logs?: Log[], departments?: string[], columnVisibility?: { [key: string]: boolean } } }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'SET_MODAL'; payload: ModalState }
  | { type: 'SET_DIALOG'; payload: Partial<DialogState> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_SELECTED_DOC_IDS'; payload: string[] }
  | { type: 'CHECK_DELAYED_DOCUMENTS' }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<Document> & { id: string } }
  | { type: 'DELETE_DOCUMENT'; payload: { id: string } }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: Partial<User> & { id: string } }
  | { type: 'DELETE_USER'; payload: { id: string } }
  | { type: 'ADD_LOG'; payload: Omit<Log, 'id' | 'firestoreId'> }
  | { type: 'SET_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }


const getInitialState = (): AppState => {
    const users = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(LS_USERS_KEY) || 'null') || DEFAULT_USERS : DEFAULT_USERS;
    const documents = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(LS_DOCUMENTS_KEY) || 'null') || DEFAULT_DOCS : DEFAULT_DOCS;
    const logs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(LS_LOGS_KEY) || 'null') || DEFAULT_LOGS : DEFAULT_LOGS;
    const departments = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(LS_DEPARTMENTS_KEY) || 'null') || DEFAULT_DEPARTMENTS : DEFAULT_DEPARTMENTS;
    const columnVisibility = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(LS_COLUMNS_KEY) || 'null') || initialColumnVisibility : initialColumnVisibility;
    const currentUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('currentUser') || 'null') : null;

    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(LS_USERS_KEY)) localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
        if (!localStorage.getItem(LS_DOCUMENTS_KEY)) localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(documents));
        if (!localStorage.getItem(LS_LOGS_KEY)) localStorage.setItem(LS_LOGS_KEY, JSON.stringify(logs));
        if (!localStorage.getItem(LS_DEPARTMENTS_KEY)) localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(departments));
        if (!localStorage.getItem(LS_COLUMNS_KEY)) localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnVisibility));
    }

    return {
        users,
        currentUser,
        documents,
        logs,
        departments,
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
        columnVisibility,
        selectedDocIds: [],
        isInitialized: true,
        dialog: { isOpen: false, title: '', message: '' },
        modal: { type: null },
    };
};


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload));
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      return { ...state, currentUser: null };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'SET_MODAL':
      return { ...state, modal: action.payload };
    case 'SET_DIALOG':
      return { ...state, dialog: { ...getInitialState().dialog, ...action.payload, isOpen: true } };
    case 'CLOSE_DIALOG':
      return { ...state, dialog: { ...state.dialog, isOpen: false } };
    case 'SET_SELECTED_DOC_IDS':
      return { ...state, selectedDocIds: action.payload };
    case 'CHECK_DELAYED_DOCUMENTS': {
        const today = new Date().setHours(0, 0, 0, 0);
        let changed = false;
        const updatedDocs = state.documents.map(docEl => {
            let docChanged = false;
            let releaseDateReached = docEl.releaseDateReached;
            let justReleased = docEl.justReleased;

            if (docEl.isDelayed && docEl.releaseDate) {
                const releaseDate = new Date(docEl.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !docEl.releaseDateReached) {
                    releaseDateReached = true;
                    justReleased = true;
                    docChanged = true;
                }
            }
             if (docEl.justReleased) {
                justReleased = false;
                docChanged = true;
            }
            if(docChanged) {
              changed = true;
              return { ...docEl, releaseDateReached, justReleased };
            }
            return docEl;
        });

        if (changed) {
            localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(updatedDocs));
            return { ...state, documents: updatedDocs };
        }
        return state;
    }
     case 'ADD_DOCUMENT': {
        const newDocuments = [...state.documents, action.payload];
        localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(newDocuments));
        return { ...state, documents: newDocuments };
      }
      case 'UPDATE_DOCUMENT': {
        const updatedDocuments = state.documents.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d);
        localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
        return { ...state, documents: updatedDocuments };
      }
      case 'DELETE_DOCUMENT': {
        const newDocuments = state.documents.filter(d => d.id !== action.payload.id);
        const newLogs = state.logs.filter(l => l.docId !== action.payload.id);
        localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(newDocuments));
        localStorage.setItem(LS_LOGS_KEY, JSON.stringify(newLogs));
        return { ...state, documents: newDocuments, logs: newLogs };
      }
      case 'ADD_USER': {
         const newUsers = [...state.users, action.payload];
         localStorage.setItem(LS_USERS_KEY, JSON.stringify(newUsers));
         return { ...state, users: newUsers };
      }
      case 'UPDATE_USER': {
        const newUsers = state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u);
        localStorage.setItem(LS_USERS_KEY, JSON.stringify(newUsers));
        return { ...state, users: newUsers };
      }
      case 'DELETE_USER': {
        const newUsers = state.users.filter(u => u.id !== action.payload.id);
        localStorage.setItem(LS_USERS_KEY, JSON.stringify(newUsers));
        return { ...state, users: newUsers };
      }
      case 'ADD_LOG': {
        const newLog = { ...action.payload, id: `log-${Date.now()}`, firestoreId: `log-${Date.now()}` }
        const newLogs = [...state.logs, newLog];
        localStorage.setItem(LS_LOGS_KEY, JSON.stringify(newLogs));
        return { ...state, logs: newLogs };
      }
      case 'SET_DEPARTMENTS': {
        localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(action.payload));
        return { ...state, departments: action.payload };
      }
      case 'SET_COLUMN_VISIBILITY': {
        localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(action.payload));
        return { ...state, columnVisibility: action.payload };
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
  state: getInitialState(),
  dispatch: () => null,
  filteredDocs: [],
})

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
    } else if (state.filter.departmentSpecificFilter === 'All') {
        docs = docs.filter(doc => doc.status !== 'Combined' && doc.status !== 'Split');
    }

    if(state.filter.departmentSpecificFilter !== 'All'){
        docs = docs.filter(d => d.status === state.filter.departmentSpecificFilter)
    }

    
    if (state.currentUser?.role !== 'Admin' && state.currentUser?.departmentPermissions?.length > 0) {
      docs = docs.filter(doc => hasDepartmentPermission(state.currentUser, doc.status))
    }

    return docs.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [state.documents, state.filter, state.currentUser])

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
