
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { ref, onValue, set, push, get, update } from 'firebase/database'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'
import { sanitizeFirebaseKey } from '@/lib/utils'

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
  | { type: 'UPDATE_USER'; payload: User }
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
             return { ...state, users: [], documents: [], logs: [], departments: [], columnVisibility: initialColumnVisibility, isInitialized: true };
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
            isInitialized: true, // Set initialized to true once we have data
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
            const sanitizedId = sanitizeFirebaseKey(doc.id);
            if (doc.isDelayed && doc.releaseDate) {
                const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !doc.releaseDateReached) {
                    updates[`documents/${sanitizedId}/releaseDateReached`] = true;
                    updates[`documents/${sanitizedId}/justReleased`] = true;
                    needsUpdate = true;
                }
            }
            if (doc.justReleased) {
                updates[`documents/${sanitizedId}/justReleased`] = false;
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            update(ref(db), updates);
        }
        return state;
    }
     case 'ADD_DOCUMENT': {
        const { id, firestoreId, ...docData } = action.payload;
        const sanitizedId = sanitizeFirebaseKey(id);
        set(ref(db, `documents/${sanitizedId}`), docData);
        return state;
      }
      case 'UPDATE_DOCUMENT': {
        const { id, ...docData } = action.payload;
        const sanitizedId = sanitizeFirebaseKey(id);
        
        const updates: {[key: string]: any} = {};
        Object.keys(docData).forEach(key => {
            updates[`documents/${sanitizedId}/${key}`] = (docData as any)[key];
        });

        update(ref(db), updates);
        return state;
      }
      case 'DELETE_DOCUMENT': {
        const { id } = action.payload;
        const sanitizedId = sanitizeFirebaseKey(id);
        const updates: {[key: string]: any} = {};
        updates[`documents/${sanitizedId}`] = null;
        
        get(ref(db, 'logs')).then(snapshot => {
            if (snapshot.exists()) {
                const logs = snapshot.val();
                for (const logId in logs) {
                    if (logs[logId].docId === sanitizedId) {
                        updates[`logs/${logId}`] = null;
                    }
                }
            }
            update(ref(db), updates);
        });
        return state;
      }
    case 'ADD_USER': {
        const newUser = action.payload;
        set(ref(db, `users/${newUser.id}`), newUser);
        return state; // Rely on onValue listener to update state
    }
    case 'UPDATE_USER': {
        const updatedUser = action.payload;
        set(ref(db, `users/${updatedUser.id}`), updatedUser);
        return state; // Rely on onValue listener to update state
    }
    case 'DELETE_USER': {
        set(ref(db, `users/${action.payload.id}`), null);
        return state; // Rely on onValue listener to update state
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
    const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        dispatch({ type: 'SET_DATA_FROM_SNAPSHOT', payload: data });
    }, (error) => {
        console.error("Firebase onValue listener error:", error);
        // Even on error, we should initialize to not block the UI.
        if (!state.isInitialized) {
            dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
    });

    // Try to load user from session storage right away.
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            dispatch({ type: 'SET_INITIAL_STATE', payload: { currentUser: user } });
        } catch (e) {
            console.error("Could not parse user from session storage:", e);
            sessionStorage.removeItem('currentUser');
        }
    }

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount.


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

    // <<<<<<<<<<<<<<<< START: PERMISSION FILTERING (HIGHEST PRIORITY) >>>>>>>>>>>>>>>>
    if (state.currentUser?.role !== 'Admin' && Array.isArray(state.currentUser?.departmentPermissions) && state.currentUser.departmentPermissions.length > 0) {
        docs = docs.filter(doc => hasDepartmentPermission(state.currentUser, doc.status));
    }
    // <<<<<<<<<<<<<<<< END: PERMISSION FILTERING >>>>>>>>>>>>>>>>

    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase()
      if (searchLower) {
        docs = docs.filter(doc => {
            const basicSearchMatch =
                doc.id.toLowerCase().includes(searchLower) ||
                doc.name.toLowerCase().includes(searchLower) ||
                (doc.office && doc.office.toLowerCase().includes(searchLower)) ||
                (doc.secondaryId && doc.secondaryId.toLowerCase().includes(searchLower)) ||
                (doc.tertiaryId && doc.tertiaryId.toLowerCase().includes(searchLower)) ||
                (doc.quaternaryId && doc.quaternaryId.toLowerCase().includes(searchLower)) ||
                (doc.assignedDepartment && doc.assignedDepartment.toLowerCase().includes(searchLower)) ||
                (doc.keywords && doc.keywords.toLowerCase().includes(searchLower)) ||
                (Array.isArray(doc.tags) && doc.tags.some(tag => tag.toLowerCase().includes(searchLower)));

            if (basicSearchMatch) return true;

            const historySearchMatch = doc.history && doc.history.some(entry => 
                (entry.receiver && entry.receiver.toLowerCase().includes(searchLower)) ||
                (entry.note && entry.note.toLowerCase().includes(searchLower))
            );

            if (historySearchMatch) return true;

            const docLogs = state.logs.filter(log => log.docId === doc.id);
            const logSearchMatch = docLogs.some(log => 
                (log.user && log.user.toLowerCase().includes(searchLower)) ||
                (log.reason && log.reason.toLowerCase().includes(searchLower))
            );
            
            if (logSearchMatch) return true;
            
            // Search within combined source documents
            if (doc.combinedFrom && doc.combinedFrom.length > 0) {
              const sourceDocs = doc.combinedFrom
                .map(id => state.documents.find(d => d.id === id))
                .filter((d): d is Document => !!d);

              const sourceDocMatch = sourceDocs.some(sourceDoc => 
                sourceDoc.id.toLowerCase().includes(searchLower) || 
                sourceDoc.name.toLowerCase().includes(searchLower)
              );
              if (sourceDocMatch) return true;
            }

            // Search within split original document
            if (doc.splitFrom) {
                const sourceDoc = state.documents.find(d => d.id === doc.splitFrom);
                if (sourceDoc) {
                    const sourceDocMatch = sourceDoc.id.toLowerCase().includes(searchLower) || sourceDoc.name.toLowerCase().includes(searchLower);
                    if (sourceDocMatch) return true;
                }
            }

            return false;
        });
      }
    }

    // Date filtering logic
    if (state.filter.startDate && state.filter.endDate) {
        docs = docs.filter(doc => {
            if (doc.history && Array.isArray(doc.history)) {
                for (const entry of doc.history) {
                    const entryStart = new Date(entry.start)
                    const entryEnd = entry.end ? new Date(entry.end) : new Date()
                    const overlap =
                        entryStart <= state.filter.endDate! && entryEnd >= state.filter.startDate!
                    if (overlap) {
                        return true
                    }
                }
            }
            return false;
        });
    }
  
    // Assigned Department filtering
    if (state.filter.assignedDepartment !== 'All') {
        docs = docs.filter(doc => doc.assignedDepartment === state.filter.assignedDepartment);
    }

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

    return docs.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [state.documents, state.logs, state.filter, state.currentUser, state.isInitialized])

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
