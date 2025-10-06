
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db, auth } from '@/lib/firebase'
import { onValue, ref, set, update, push } from 'firebase/database'
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
  | { type: 'SET_ALL_DATA'; payload: Partial<AppState> }
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
    case 'SET_ALL_DATA':
        return { ...state, ...action.payload, isInitialized: true };
    case 'SET_CURRENT_USER':
        return { ...state, currentUser: action.payload };
    case 'LOGIN_SUCCESS':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload.user));
      return { ...state, currentUser: action.payload.user };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      return { ...getInitialState(), isInitialized: true, users: state.users, departments: state.departments }; // Keep some data
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
                updates[`/logs/${log.id}`] = null;
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
                updates[`/logs/${log.id}`] = null;
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
        set(newLogRef, action.payload);
        return state;
    }
    case 'SET_DEPARTMENTS': {
      if (Array.isArray(action.payload)) {
        update(ref(db), { '/departments': action.payload });
        return { ...state, departments: action.payload };
      }
      const { newOrder } = action.payload;
      update(ref(db), { '/departments': newOrder });
      return { ...state, departments: newOrder };
    }
    case 'SET_ASSIGNED_DEPARTMENTS': {
        set(ref(db, 'assignedDepartments'), action.payload);
        return { ...state, assignedDepartments: action.payload };
    }
    case 'SET_DOCUMENT_TYPES': {
        set(ref(db, 'documentTypes'), action.payload);
        return { ...state, documentTypes: action.payload };
    }
    case 'SET_COLUMN_VISIBILITY': {
        set(ref(db, 'columnVisibility'), action.payload);
        return { ...state, columnVisibility: action.payload };
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
    // Listener for all database data
    const dbRef = ref(db);
    const unsubscribeDB = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allData = {
          users: data.users ? Object.values(data.users) : [],
          documents: data.documents ? Object.values(data.documents) : [],
          logs: data.logs ? Object.values(data.logs) : [],
          departments: data.departments || [],
          documentTypes: data.documentTypes || [],
          assignedDepartments: data.assignedDepartments || [],
          columnVisibility: data.columnVisibility || initialColumnVisibility,
        };
        dispatch({ type: 'SET_ALL_DATA', payload: allData });
      } else {
         set(ref(db), initialData); // Seed if empty
      }
    }, (error) => {
      console.error("Firebase onValue error:", error);
      dispatch({ type: 'SET_INITIALIZED', payload: true }); // Ensure app initializes even on error
    });

    // Listener for Authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (state.isInitialized) { // Wait for DB data before setting user
          const userProfile = state.users.find(u => u.id === user.uid);
          if (userProfile) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userProfile } });
          } else {
            console.error("Authenticated user not found in database:", user.uid);
            auth.signOut(); // Log out if profile is missing
          }
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      unsubscribeDB();
      unsubscribeAuth();
    };
  }, [state.isInitialized]); // Rerun auth check when DB is initialized

  useEffect(() => {
    if (!state.currentUser) return;
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000);
    return () => clearInterval(interval);
  }, [state.currentUser]);


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
    } else if(state.filter.departmentSpecificFilter !== 'All'){
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
