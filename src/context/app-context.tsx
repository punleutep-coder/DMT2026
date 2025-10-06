
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db, auth } from '@/lib/firebase'
import { ref, onValue, set, update, push, get } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission, hasPermission } from '@/lib/permissions'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { fromZonedTime } from 'date-fns-tz';

type Action =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'SET_PAGINATION'; payload: Partial<AppState['pagination']> }
  | { type: 'SET_MODAL'; payload: ModalState }
  | { type: 'SET_DIALOG'; payload: Partial<DialogState> }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_SELECTED_DOC_IDS'; payload: string[] }
  | { type: 'CHECK_DELAYED_DOCUMENTS' }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<Document> & { id: string } }
  | { type: 'DELETE_DOCUMENT'; payload: { id: string } }
  | { type: 'DELETE_SELECTED_DOCUMENTS'; payload: string[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: { id: string } }
  | { type: 'ADD_LOG'; payload: Omit<Log, 'id' | 'firestoreId'> & {reason?: string | null} }
  | { type: 'SET_DEPARTMENTS'; payload: string[] | { newOrder: string[], originalDepartments: string[]} }
  | { type: 'SET_DOCUMENT_TYPES'; payload: string[] }
  | { type: 'SET_ASSIGNED_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_LOGS'; payload: Log[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'km' };

const getInitialState = (): AppState => ({
    users: [],
    currentUser: null,
    documents: [],
    logs: [],
    departments: [],
    documentTypes: [],
    assignedDepartments: [],
    filter: {
        mainFilter: 'All',
        departmentSpecificFilter: 'All',
        search: '',
        startDate: null,
        endDate: null,
        assignedDepartment: 'All',
        documentType: 'All',
        periodValue: 3,
        periodUnit: 'days',
        periodDepartment: 'All',
    },
    pagination: {
        currentPage: 1,
        rowsPerPage: 30,
    },
    columnVisibility: initialColumnVisibility,
    selectedDocIds: [],
    isInitialized: false,
    dialog: { isOpen: false, title: '', message: '' },
    modal: { type: null },
    language: 'km',
})


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZED':
        return { ...state, isInitialized: action.payload };
    case 'SET_DOCUMENTS':
        return { ...state, documents: action.payload };
    case 'SET_LOGS':
        return { ...state, logs: action.payload };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'SET_DEPARTMENTS':
         if (Array.isArray(action.payload)) {
             return { ...state, departments: action.payload };
         }
         return { ...state, departments: action.payload.newOrder };
    case 'SET_DOCUMENT_TYPES':
        return { ...state, documentTypes: action.payload };
    case 'SET_ASSIGNED_DEPARTMENTS':
        return { ...state, assignedDepartments: action.payload };
    case 'SET_COLUMN_VISIBILITY':
        return { ...state, columnVisibility: action.payload };
    case 'SET_CURRENT_USER':
        return { ...state, currentUser: action.payload };
    case 'LOGIN_SUCCESS':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload.user));
      return { ...state, currentUser: action.payload.user, isInitialized: true };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      return { ...getInitialState(), isInitialized: true }; // Reset state but keep initialized
    case 'SET_FILTER':
      const newFilter = { ...state.filter, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('docuFlow_filterSettings', JSON.stringify(newFilter));
      }
      return { ...state, filter: newFilter, pagination: {...state.pagination, currentPage: 1} };
    case 'SET_PAGINATION':
        return { ...state, pagination: { ...state.pagination, ...action.payload } };
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
        const updates: {[key: string]: any} = {};
        let needsUpdate = false;
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
        const { firestoreId, ...docData } = action.payload;
        const sanitizedId = sanitizeFirebaseKey(action.payload.id);
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
        updates[`/documents/${sanitizedId}`] = null;
        state.logs.forEach(log => {
            if (log.docId === id) {
                updates[`/logs/${log.firestoreId}`] = null;
            }
        });
        update(ref(db), updates);
        return state;
    }
      case 'DELETE_SELECTED_DOCUMENTS': {
        const idsToDelete = action.payload;
        const updates: {[key: string]: any} = {};
        idsToDelete.forEach(id => {
          const sanitizedId = sanitizeFirebaseKey(id);
          updates[`/documents/${sanitizedId}`] = null;
        });
        state.logs.forEach(log => {
            if (idsToDelete.includes(log.docId)) {
                updates[`/logs/${log.firestoreId}`] = null;
            }
        });
        update(ref(db), updates);
        return { ...state, selectedDocIds: [] };
      }
    case 'ADD_USER': {
        const newUser = action.payload;
        set(ref(db, `users/${newUser.id}`), newUser);
        return state;
    }
    case 'UPDATE_USER': {
        const updatedUser = action.payload;
        set(ref(db, `users/${updatedUser.id}`), updatedUser);
        return state;
    }
    case 'DELETE_USER': {
        set(ref(db, `users/${action.payload.id}`), null);
        return state;
    }
    case 'ADD_LOG': {
        const newLogRef = push(ref(db, 'logs'));
        const logWithId = { ...action.payload, id: newLogRef.key, firestoreId: newLogRef.key };
        set(newLogRef, logWithId);
        return state;
    }
    case 'SET_LANGUAGE':
        return { ...state, language: action.payload };
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  filteredDocs: Document[];
  metrics: {
      total: number;
      inProgress: number;
      delayed: number;
      releaseReached: number;
      completed: number;
      completedSuccess: number;
      completedUnsuccess: number;
      exceeding: number;
  };
}

export const AppContext = createContext<AppContextValue>({
  state: getInitialState(),
  dispatch: () => null,
  filteredDocs: [],
  metrics: { total: 0, inProgress: 0, delayed: 0, releaseReached: 0, completed: 0, completedSuccess: 0, completedUnsuccess: 0, exceeding: 0 },
})

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    // This is the single auth listener. It runs once.
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is logged in to Firebase Auth. Now, let's listen to DB.
        const dbRef = ref(db);
        const unsubscribeDb = onValue(dbRef, async (snapshot) => {
          if (!snapshot.exists()) {
             // If DB is empty, seed it. User must be auth'd to do this.
             await set(dbRef, initialData);
             // The onValue will trigger again with the new data.
             return;
          }

          const data = snapshot.val();
          const users: User[] = data.users ? Object.keys(data.users).map(key => ({ id: key, firestoreId: key, ...data.users[key] })) : [];
          
          const userProfile = users.find(u => u.id === authUser.uid);
          
          if(userProfile) {
            dispatch({ type: 'SET_USERS', payload: users });
            dispatch({ type: 'SET_DOCUMENTS', payload: data.documents ? Object.keys(data.documents).map(key => ({ id: key, ...data.documents[key] })) : [] });
            dispatch({ type: 'SET_LOGS', payload: data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [] });
            dispatch({ type: 'SET_DEPARTMENTS', payload: data.departments || [] });
            dispatch({ type: 'SET_DOCUMENT_TYPES', payload: data.documentTypes || [] });
            dispatch({ type: 'SET_ASSIGNED_DEPARTMENTS', payload: data.assignedDepartments || [] });
            dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: data.columnVisibility || initialColumnVisibility });
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userProfile } });
          } else {
            // This can happen if a user exists in Auth but not RTDB.
            // Sign them out to avoid an inconsistent state.
            await auth.signOut();
          }
        }, (error) => {
            console.error("Firebase onValue error:", error);
            dispatch({ type: 'SET_INITIALIZED', payload: true }); 
        });

        // Set up interval to check for delayed docs
        const interval = setInterval(() => {
            dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
        }, 60000);

        return () => {
            unsubscribeDb();
            clearInterval(interval);
        }

      } else {
        // User is logged out.
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.


  const filteredDocs = useMemo(() => {
    if (!state.isInitialized || !state.currentUser) return [];
    
    let docs = state.documents;

    if (state.currentUser?.role !== 'Admin' && !hasPermission(state.currentUser, 'canViewCompleted')) {
      docs = docs.filter(doc => !doc.status.startsWith('Completed'));
    }

    if (state.currentUser?.role !== 'Admin') {
        docs = docs.filter(doc => hasDepartmentPermission(state.currentUser, doc.status));
    }

    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase();
      docs = docs.filter(doc => {
          const fieldsToSearch = [
            doc.id, doc.name, doc.documentType, doc.office, doc.secondaryId,
            doc.tertiaryId, doc.quaternaryId, doc.assignedDepartment, doc.keywords,
            ...(doc.tags || [])
          ];
          const historyText = (doc.history || []).map(h => `${h.receiver} ${h.note}`).join(' ');
          fieldsToSearch.push(historyText);

          return fieldsToSearch.some(field => field && field.toLowerCase().includes(searchLower));
      });
    }

    if (state.filter.startDate && state.filter.endDate) {
        docs = docs.filter(doc => {
            if (doc.history && doc.history.length > 0) {
                const firstEntryStart = fromZonedTime(doc.history[0].start, 'UTC');
                return firstEntryStart >= state.filter.startDate! && firstEntryStart <= state.filter.endDate!;
            }
            return false;
        });
    }
  
    if (state.filter.assignedDepartment !== 'All') {
        docs = docs.filter(doc => doc.assignedDepartment === state.filter.assignedDepartment);
    }
    
    if (state.filter.documentType !== 'All') {
      docs = docs.filter(doc => doc.documentType === state.filter.documentType);
    }

    if (state.filter.mainFilter === 'Exceeding Period') {
        docs = docs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit, state.filter.periodDepartment));
    } else if (state.filter.mainFilter !== 'All') {
        if (state.filter.mainFilter === 'In Progress') {
            docs = docs.filter(d => d.status && !d.isDelayed && !d.releaseDateReached && !d.status.startsWith('Completed') && d.status !== 'Combined' && d.status !== 'Split');
        } else if (state.filter.mainFilter === 'Delayed') {
            docs = docs.filter(d => d.isDelayed && !d.releaseDateReached);
        } else if (state.filter.mainFilter === 'Release Date Reached') {
            docs = docs.filter(d => d.releaseDateReached === true);
        } else if (state.filter.mainFilter === 'Completed') {
            docs = docs.filter(d => d.status && d.status.startsWith('Completed'));
        } else if (state.filter.mainFilter.startsWith('Completed (')) {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        }
    } 
    
    if(state.filter.departmentSpecificFilter !== 'All'){
        docs = docs.filter(d => d.status === state.filter.departmentSpecificFilter)
    }

    return docs.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [state.documents, state.filter, state.currentUser, state.isInitialized]);
  
  const activeDocs = useMemo(() => {
    return state.documents.filter(d => d.status !== 'Combined' && d.status !== 'Split');
  }, [state.documents]);


  const metrics = useMemo(() => {
    const allDocs = state.documents; 
    const exceedingDocs = activeDocs.filter(doc => isDocumentExceedingPeriod(doc, state.filter.periodValue, state.filter.periodUnit, state.filter.periodDepartment));

    return {
      total: activeDocs.length,
      inProgress: allDocs.filter(d => d.status && !d.isDelayed && !d.releaseDateReached && !d.status.startsWith('Completed') && d.status !== 'Combined' && d.status !== 'Split').length,
      delayed: allDocs.filter(d => d.isDelayed && !d.releaseDateReached).length,
      releaseReached: allDocs.filter(d => d.releaseDateReached).length,
      completed: allDocs.filter(d => d.status && d.status.startsWith('Completed')).length,
      completedSuccess: allDocs.filter(d => d.status === 'Completed (Success)').length,
      completedUnsuccess: allDocs.filter(d => d.status === 'Completed (Unsuccess)').length,
      exceeding: exceedingDocs.length,
    }
  }, [activeDocs, state.documents, state.filter.periodValue, state.filter.periodUnit, state.filter.periodDepartment]);


  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs, metrics }}>
      {children}
    </AppContext.Provider>
  )
}
