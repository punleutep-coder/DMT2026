'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log } from '@/lib/types'
import {
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  PERMISSIONS_CONFIG,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, writeBatch, getDocs, setDoc, query } from 'firebase/firestore'


type Action =
  | { type: 'INITIALIZE_STATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'SET_MODAL'; payload: AppState['modal'] }
  | { type: 'SET_DIALOG'; payload: Partial<AppState['dialog']> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_LOGS'; payload: Log[] }
  | { type: 'SET_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
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
        return { ...state, ...action.payload, isInitialized: true };
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
    case 'SET_DOCUMENTS':
        return { ...state, documents: action.payload };
    case 'SET_LOGS':
        return { ...state, logs: action.payload };
    case 'SET_DEPARTMENTS':
        return { ...state, departments: action.payload };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'SET_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload };
    case 'UPDATE_DOCUMENTS':
      // This is now handled by Firestore listeners, but we might keep it for optimistic updates or specific cases.
      // For now, let's make it a no-op to avoid conflicts with Firestore.
      return state;
    case 'UPDATE_LOGS':
       return state;
    case 'UPDATE_DEPARTMENTS':
        return { ...state, departments: action.payload };
    case 'UPDATE_USERS':
        return { ...state, users: action.payload };
    case 'UPDATE_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload };
    case 'SET_SELECTED_DOC_IDS':
        return { ...state, selectedDocIds: action.payload }
    case 'CHECK_DELAYED_DOCUMENTS': {
      const today = new Date().setHours(0, 0, 0, 0)
      const docsToUpdate: Document[] = [];
      state.documents.forEach(doc => {
        if (doc.isDelayed && doc.releaseDate) {
          const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0)
          if (today >= releaseDate && !doc.releaseDateReached) {
            docsToUpdate.push({ ...doc, releaseDateReached: true });
          }
        }
      });
      if (docsToUpdate.length > 0) {
        const batch = writeBatch(db);
        docsToUpdate.forEach(doc => {
          const docRef = doc.firestoreId ? docRef(db, "documents", doc.firestoreId) : null;
          if (docRef) {
            batch.update(docRef, { releaseDateReached: true });
          }
        });
        batch.commit().catch(e => console.error("Error updating delayed docs:", e));
      }
      return state; // State update will happen via listener
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
    const unsubscribes = [
        onSnapshot(collection(db, "documents"), (snapshot) => {
            const documents = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as Document));
            dispatch({ type: 'SET_DOCUMENTS', payload: documents });
        }),
        onSnapshot(collection(db, "logs"), (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as Log));
            dispatch({ type: 'SET_LOGS', payload: logs });
        }),
        onSnapshot(collection(db, "users"), (snapshot) => {
            const users = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as User));
            dispatch({ type: 'SET_USERS', payload: users });
        }),
        onSnapshot(doc(db, "app-config", "departments"), (doc) => {
            const data = doc.data();
            if (data && data.list) {
                dispatch({ type: 'SET_DEPARTMENTS', payload: data.list });
            }
        }),
        onSnapshot(doc(db, "app-config", "columnVisibility"), (doc) => {
            const data = doc.data();
            if (data) {
                dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: data as { [key: string]: boolean; } });
            }
        }),
    ];
    
    // Seed initial data if collections are empty
    const seedInitialData = async () => {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      if (usersSnapshot.empty) {
        const hashedPassword = await hashPassword('admin');
        const adminUser: Omit<User, 'firestoreId'> = {
          id: `user-${Date.now()}`,
          username: 'admin',
          passwordHash: hashedPassword,
          role: 'Admin',
          permissions: {},
          departmentPermissions: []
        };
        await addDoc(collection(db, "users"), adminUser);

        const batch = writeBatch(db);
        DEFAULT_DOCS.forEach(d => {
            const docRef = doc(collection(db, "documents"));
            batch.set(docRef, d);
        });
        DEFAULT_LOGS.forEach(l => {
            const logRef = doc(collection(db, "logs"));
            batch.set(logRef, l);
        });
        await batch.commit();

        await setDoc(doc(db, "app-config", "departments"), { list: DEFAULT_DEPARTMENTS });
        await setDoc(doc(db, "app-config", "columnVisibility"), initialColumnVisibility);
      }
      dispatch({ type: 'INITIALIZE_STATE', payload: {} });
    };

    seedInitialData();

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);
  
  useEffect(() => {
    if (state.isInitialized) {
        const interval = setInterval(() => {
            dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
        }, 60000);
        return () => clearInterval(interval);
    }
  }, [state.isInitialized]);

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
