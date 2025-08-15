'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch } from 'react'
import type { AppState, User, Document, Log } from '@/lib/types'
import {
  LS_USERS_KEY,
  LS_DOCUMENTS_KEY,
  LS_LOGS_KEY,
  LS_DEPARTMENTS_KEY,
  LS_COLUMNS_KEY,
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  PERMISSIONS_CONFIG,
} from '@/lib/initial-data'

type Action =
  | { type: 'INITIALIZE_STATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'SET_MODAL'; payload: AppState['modal'] }
  | { type: 'SET_DIALOG'; payload: Partial<AppState['dialog']> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'UPDATE_DOCUMENTS'; payload: Document[] }
  | { type: 'UPDATE_LOGS'; payload: Log[] }
  | { type: 'UPDATE_DEPARTMENTS'; payload: string[] }
  | { type: 'UPDATE_USERS'; payload: User[] }
  | { type: 'UPDATE_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
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
    case 'INITIALIZE_STATE':
      return { ...state, ...action.payload, isInitialized: true }
    case 'LOGIN':
      return { ...state, currentUser: action.payload }
    case 'LOGOUT':
      return { ...state, currentUser: null }
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } }
    case 'SET_MODAL':
      return { ...state, modal: action.payload }
    case 'SET_DIALOG':
      return { ...state, dialog: { ...initialState.dialog, ...action.payload, isOpen: true } }
    case 'CLOSE_DIALOG':
        return { ...state, dialog: { ...state.dialog, isOpen: false } }
    case 'UPDATE_DOCUMENTS':
      return { ...state, documents: action.payload }
    case 'UPDATE_LOGS':
      return { ...state, logs: action.payload }
    case 'UPDATE_DEPARTMENTS':
        return { ...state, departments: action.payload }
    case 'UPDATE_USERS':
        return { ...state, users: action.payload }
    case 'UPDATE_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload }
    case 'SET_SELECTED_DOC_IDS':
        return { ...state, selectedDocIds: action.payload }
    case 'CHECK_DELAYED_DOCUMENTS': {
      const today = new Date().setHours(0, 0, 0, 0)
      const updatedDocs = state.documents.map(doc => {
        if (doc.isDelayed && doc.releaseDate) {
          const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0)
          if (today >= releaseDate && !doc.releaseDateReached) {
            return { ...doc, releaseDateReached: true }
          }
        }
        return doc
      })
      return { ...state, documents: updatedDocs }
    }
    default:
      return state
  }
}

export const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<Action>
}>({
  state: initialState,
  dispatch: () => null,
})

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const loadStateFromLocalStorage = (): Partial<AppState> => {
  try {
    const users = JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]')
    let documents = JSON.parse(localStorage.getItem(LS_DOCUMENTS_KEY) || JSON.stringify(DEFAULT_DOCS));
    const logs = JSON.parse(localStorage.getItem(LS_LOGS_KEY) || JSON.stringify(DEFAULT_LOGS));
    const departments = JSON.parse(localStorage.getItem(LS_DEPARTMENTS_KEY) || JSON.stringify(DEFAULT_DEPARTMENTS));
    const columnVisibility = JSON.parse(localStorage.getItem(LS_COLUMNS_KEY) || JSON.stringify(initialColumnVisibility));

    // Data Migration
    let migrationNeeded = false;
    documents.forEach((doc: Document) => {
        if (doc.history && !Array.isArray(doc.history)) {
            migrationNeeded = true;
            const oldHistory = doc.history as any;
            const newHistory: any[] = [];
            departments.forEach((deptName: string) => {
                if (oldHistory[deptName]) {
                    newHistory.push({ department: deptName, ...oldHistory[deptName] });
                }
            });
            doc.history = newHistory;
        }
        if (typeof doc.documentLink === 'string' && doc.documentLink !== null) {
            doc.documentLink = [doc.documentLink];
            migrationNeeded = true;
        } else if (doc.documentLink === null || doc.documentLink === undefined) {
            doc.documentLink = [];
            migrationNeeded = true;
        }
        if (doc.quaternaryId === undefined) {
            doc.quaternaryId = null;
            migrationNeeded = true;
        }
    });

    if (migrationNeeded) {
        localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(documents));
    }


    return { users, documents, logs, departments, columnVisibility };
  } catch (error) {
    console.error('Failed to load state from localStorage', error);
    return {};
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const loadedState = loadStateFromLocalStorage();
    
    const seedInitialUser = async () => {
        let users = loadedState.users && loadedState.users.length > 0 ? loadedState.users : [];
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
        } else {
             // Migration for existing users
            users.forEach((user: User) => {
                if (user.departmentPermissions === undefined) {
                    user.departmentPermissions = [];
                }
                for (const key in PERMISSIONS_CONFIG) {
                    if (user.permissions[key] === undefined) {
                        user.permissions[key] = false;
                    }
                }
            });
        }
        dispatch({ type: 'INITIALIZE_STATE', payload: { ...loadedState, users } });
    }
    
    seedInitialUser();
  }, [])
  
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
        }, 60000);
        return () => clearInterval(interval);
    }
  }, [state.isInitialized]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
