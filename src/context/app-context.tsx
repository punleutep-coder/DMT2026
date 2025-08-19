
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { ref, onValue, set, push, get, off } from 'firebase/database'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: { user: User, documents: Document[], logs: Log[], columnVisibility: any } }
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
  | { type: 'SET_DATA_FROM_SNAPSHOT'; payload: any }
  | { type: 'SET_INITIALIZED'; payload: boolean };


const getInitialState = (): AppState => ({
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
})


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZED':
        return {
            ...state,
            isInitialized: action.payload,
        };
    case 'SET_INITIAL_STATE':
        const currentUser = action.payload.currentUser !== undefined ? action.payload.currentUser : state.currentUser;
        const storedUser = sessionStorage.getItem('currentUser');
        const finalUser = currentUser || (storedUser ? JSON.parse(storedUser) : null);
        
        return {
            ...state,
            ...action.payload,
            currentUser: finalUser,
            isInitialized: true,
        };
    case 'SET_DATA_FROM_SNAPSHOT':
        const data = action.payload;
        if (!data) {
             return { ...state, users: [], documents: [], logs: [], departments: [], columnVisibility: initialColumnVisibility };
        }

        const documents = data.documents ? Object.keys(data.documents).map(key => ({ id: key, firestoreId: key, ...data.documents[key] })) : [];
        const logs = data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [];
        const users = data.users ? Object.keys(data.users).map(key => ({ id: key, firestoreId: key, ...data.users[key] })) : [];
        const departments = data.departments || [];
        const columnVisibility = data.columnVisibility || initialColumnVisibility;
        
        let liveCurrentUser = state.currentUser;
        if (liveCurrentUser) {
            const updatedUser = users.find(u => u.id === liveCurrentUser!.id);
            if (!updatedUser) { // User was deleted
                sessionStorage.removeItem('currentUser');
                liveCurrentUser = null;
            } else {
                liveCurrentUser = updatedUser;
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        }

        return {
            ...state,
            documents,
            logs,
            users,
            departments,
            columnVisibility,
            currentUser: liveCurrentUser,
        };
    case 'LOGIN':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload.user));
      return { 
        ...state, 
        currentUser: action.payload.user,
        documents: action.payload.documents,
        logs: action.payload.logs,
        columnVisibility: action.payload.columnVisibility,
      };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      // Keep users and departments on logout so the login page works
      return { ...getInitialState(), users: state.users, departments: state.departments, isInitialized: true };
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
        let needsUpdate = false;
        
        const updates: {[key: string]: any} = {};

        state.documents.forEach(doc => {
            if (doc.isDelayed && doc.releaseDate) {
                const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !doc.releaseDateReached) {
                    updates[`documents/${doc.id}/releaseDateReached`] = true;
                    updates[`documents/${doc.id}/justReleased`] = true;
                    needsUpdate = true;
                }
            }
            if (doc.justReleased) {
                updates[`documents/${doc.id}/justReleased`] = false;
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            Object.keys(updates).forEach(key => {
                set(ref(db, key), updates[key]);
            })
        }
        return state;
    }
     case 'ADD_DOCUMENT': {
        const { id, firestoreId, ...docData } = action.payload;
        set(ref(db, `documents/${id}`), docData);
        return state;
      }
      case 'UPDATE_DOCUMENT': {
        const { id, ...docData } = action.payload;
        
        const updates: {[key: string]: any} = {};
        Object.keys(docData).forEach(key => {
            updates[`documents/${id}/${key}`] = (docData as any)[key];
        });

        Object.keys(updates).forEach(key => {
            set(ref(db, key), updates[key]);
        })

        return state;
      }
      case 'DELETE_DOCUMENT': {
        const { id } = action.payload;
        set(ref(db, `documents/${id}`), null);
        
        get(ref(db, 'logs')).then(snapshot => {
            if (snapshot.exists()) {
                const logs = snapshot.val();
                const updates: {[key: string]: any} = {};
                for (const logId in logs) {
                    if (logs[logId].docId === id) {
                        updates[`logs/${logId}`] = null;
                    }
                }
                Object.keys(updates).forEach(key => {
                    set(ref(db, key), updates[key]);
                })
            }
        });
        return state;
      }
      case 'ADD_USER': {
        const { id, firestoreId, ...userData } = action.payload;
        set(ref(db, `users/${id}`), userData);
        return state;
      }
      case 'UPDATE_USER': {
        const { id, firestoreId, ...userData } = action.payload;
        set(ref(db, `users/${id}`), userData);
        return state;
      }
      case 'DELETE_USER': {
        set(ref(db, `users/${action.payload.id}`), null);
        return state;
      }
      case 'ADD_LOG': {
        const newLogRef = push(ref(db, 'logs'));
        set(newLogRef, action.payload);
        return state;
      }
      case 'SET_DEPARTMENTS': {
        set(ref(db, 'departments'), action.payload);
        return state;
      }
      case 'SET_COLUMN_VISIBILITY': {
        set(ref(db, 'columnVisibility'), action.payload);
        return state;
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
    const dbRef = ref(db);
    // Attach a listener that handles all real-time data updates.
    const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        dispatch({ type: 'SET_DATA_FROM_SNAPSHOT', payload: data });
    }, (error) => {
        console.error("Firebase onValue listener error:", error);
    });

    // Try to load user from session storage right away.
    // The onValue listener will hydrate the rest of the state.
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            dispatch({ type: 'LOGIN', payload: { user, documents: [], logs: [], columnVisibility: initialColumnVisibility } });
        } catch (e) {
            console.error("Could not parse user from session storage:", e);
            sessionStorage.removeItem('currentUser');
        }
    }
    
    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (!state.isInitialized || !state.currentUser) return;
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000);
    return () => clearInterval(interval);
  }, [state.isInitialized, state.currentUser]);


  const filteredDocs = useMemo(() => {
    if (!state.isInitialized) return [];
    
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
  }, [state.documents, state.filter, state.currentUser, state.isInitialized])

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
