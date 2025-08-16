'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  PERMISSIONS_CONFIG,
} from '@/lib/initial-data'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, query, where, setDoc } from 'firebase/firestore'
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
  isInitialized: false, // Will be true after initial data load from Firestore
  dialog: { isOpen: false, title: '', message: '' },
  modal: { type: null },
}

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_LOADING':
      return { ...state, isInitialized: !action.payload };
    case 'SET_DATA':
        return { ...state, ...action.payload };
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
      return { ...state, dialog: { ...initialState.dialog, ...action.payload, isOpen: true } };
    case 'CLOSE_DIALOG':
      return { ...state, dialog: { ...state.dialog, isOpen: false } };
    case 'SET_SELECTED_DOC_IDS':
      return { ...state, selectedDocIds: action.payload };
    case 'CHECK_DELAYED_DOCUMENTS': {
        const today = new Date().setHours(0, 0, 0, 0);
        state.documents.forEach(docEl => {
            if (docEl.isDelayed && docEl.releaseDate) {
                const releaseDate = new Date(docEl.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !docEl.releaseDateReached) {
                    const docRef = docEl.firestoreId ? doc(db, 'documents', docEl.firestoreId) : null;
                    if(docRef) updateDoc(docRef, { releaseDateReached: true, justReleased: true });
                }
            }
             if (docEl.justReleased) {
                const docRef = docEl.firestoreId ? doc(db, 'documents', docEl.firestoreId) : null;
                if(docRef) updateDoc(docRef, { justReleased: false });
            }
        });
        return state; // No immediate state change, relies on Firestore listener
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


// Function to seed initial data if collections are empty
const seedInitialData = async () => {
    // Check for users
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    if (userSnapshot.empty) {
        console.log("No users found. Seeding admin user...");
        const hashedPassword = await hashPassword('admin');
        const adminId = `user-${Date.now()}`;
        const adminPermissions = Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as {[key: string]: boolean});

        const newAdminUser = {
            id: adminId,
            username: 'admin',
            passwordHash: hashedPassword,
            role: 'Admin',
            permissions: adminPermissions,
            departmentPermissions: []
        };
        
        const userDocRef = doc(usersCollection);
        await setDoc(userDocRef, newAdminUser);
    }

    // Check for documents
    const documentsCollection = collection(db, 'documents');
    const docSnapshot = await getDocs(documentsCollection);
    if (docSnapshot.empty) {
        console.log("No documents found. Seeding default documents...");
        const batch = writeBatch(db);
        DEFAULT_DOCS.forEach(docData => {
            const docRef = doc(collection(db, 'documents'));
            batch.set(docRef, docData);
        });
        await batch.commit();
    }

    // Check for logs
    const logsCollection = collection(db, 'logs');
    const logSnapshot = await getDocs(logsCollection);
    if (logSnapshot.empty) {
        console.log("No logs found. Seeding default logs...");
        const batch = writeBatch(db);
        DEFAULT_LOGS.forEach(logData => {
            const logRef = doc(collection(db, 'logs'));
            batch.set(logRef, logData);
        });
        await batch.commit();
    }
    
    // Check for app_config (departments and column visibility)
    const configQuery = query(collection(db, 'app_config'), where('id', '==', 'main'));
    const configSnapshot = await getDocs(configQuery);

    if (configSnapshot.empty) {
        console.log("No app config found. Seeding default departments and columns...");
        const configCollection = collection(db, 'app_config');
        const newConfigDoc = doc(configCollection, 'main_config');
        await setDoc(newConfigDoc, {
            id: 'main', // a fixed ID for our singleton config doc
            departments: DEFAULT_DEPARTMENTS,
            columnVisibility: initialColumnVisibility
        });
    }
};


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
    const setup = async () => {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: true });

        await seedInitialData();

        const unsubscribers = [
            onSnapshot(collection(db, 'documents'), (snapshot) => {
                const documents = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as Document));
                dispatch({ type: 'SET_DATA', payload: { documents } });
            }),
            onSnapshot(collection(db, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as User));
                dispatch({ type: 'SET_DATA', payload: { users } });
            }),
            onSnapshot(collection(db, 'logs'), (snapshot) => {
                const logs = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as Log));
                dispatch({ type: 'SET_DATA', payload: { logs } });
            }),
            onSnapshot(collection(db, 'app_config'), (snapshot) => {
                if (!snapshot.empty) {
                    const configData = snapshot.docs[0].data();
                    dispatch({ type: 'SET_DATA', payload: { 
                        departments: configData.departments || [],
                        columnVisibility: configData.columnVisibility || initialColumnVisibility
                    }});
                }
            })
        ];

        // Restore logged in user from session storage
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            dispatch({ type: 'LOGIN', payload: JSON.parse(savedUser) });
        }

        dispatch({ type: 'SET_INITIAL_LOADING', payload: false });

        return () => unsubscribers.forEach(unsub => unsub());
    };

    setup();
  }, []);
  
  useEffect(() => {
    if (!state.isInitialized) {
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
