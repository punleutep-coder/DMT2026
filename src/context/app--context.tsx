
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db, auth } from '@/lib/firebase'
import { ref, onValue, set, update, push, get, Unsubscribe } from 'firebase/database'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission, hasPermission, hasLabelPermission } from '@/lib/permissions'
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
  | { type: 'SET_DEPARTMENTS'; payload: string[] | { newOrder: string[], originalDepartments: string[], colors?: { [key: string]: string }} }
  | { type: 'SET_DEPARTMENT_COLORS'; payload: { [key: string]: string } }
  | { type: 'SET_DOCUMENT_TYPES'; payload: string[] }
  | { type: 'SET_ASSIGNED_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_LABELS'; payload: string[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }
  | { type: 'SET_DATA'; payload: { users: User[], documents: Document[], logs: Log[], departments: string[], departmentColors: { [key: string]: string }, documentTypes: string[], assignedDepartments: string[], labels: string[], columnVisibility: {[key:string]: boolean} } }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'km' };

const getInitialState = (): AppState => {
    const savedFilter = typeof window !== 'undefined' ? localStorage.getItem('docuFlow_filterSettings') : null;
    const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('docuFlow_language') : 'km';
    
    return {
        users: [],
        currentUser: null,
        documents: [],
        logs: [],
        departments: [],
        departmentColors: {},
        documentTypes: [],
        assignedDepartments: [],
        labels: [],
        filter: savedFilter ? JSON.parse(savedFilter) : {
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
        language: (savedLanguage === 'en' || savedLanguage === 'km') ? savedLanguage : 'km',
    }
}


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZED':
        return { ...state, isInitialized: action.payload };
    case 'SET_DATA':
        return { 
            ...state, 
            ...action.payload,
            departmentColors: action.payload.departmentColors || state.departmentColors,
        };
    case 'SET_CURRENT_USER':
        if (action.payload) {
          sessionStorage.setItem('currentUser', JSON.stringify(action.payload));
        } else {
          sessionStorage.removeItem('currentUser');
        }
        return { ...state, currentUser: action.payload, isInitialized: true };
    case 'LOGIN_SUCCESS':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload.user));
      return { ...state, currentUser: action.payload.user, isInitialized: true };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      auth.signOut();
      return { ...getInitialState(), isInitialized: true, currentUser: null, documents: [], logs: [], users: [] };
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
    case 'SET_DEPARTMENTS': {
      if (Array.isArray(action.payload)) {
        set(ref(db, 'departments'), action.payload)
        return { ...state, departments: action.payload };
      }
      
      const { newOrder, originalDepartments, colors } = action.payload;
      const updates: { [key: string]: any } = {};
      updates['/departments'] = newOrder;

      if (colors) {
          updates['/departmentColors'] = colors;
      }

      if (originalDepartments && Array.isArray(originalDepartments)) {
        originalDepartments.forEach((oldName, index) => {
            const renamed = !newOrder.includes(oldName) && newOrder.length === originalDepartments.length;
            if (renamed) {
                const newNameForOldIndex = newOrder[index];
                if (newNameForOldIndex && newNameForOldIndex !== oldName) {
                    state.documents.forEach(doc => {
                        const sanitizedId = sanitizeFirebaseKey(doc.id);
                        if (doc.status === oldName) {
                            updates[`/documents/${sanitizedId}/status`] = newNameForOldIndex;
                        }
                        if (Array.isArray(doc.history)) {
                            const newHistory = doc.history.map(h =>
                                h.department === oldName ? { ...h, department: newNameForOldIndex } : h
                            );
                            if (JSON.stringify(newHistory) !== JSON.stringify(doc.history)) {
                                updates[`/documents/${sanitizedId}/history`] = newHistory;
                            }
                        }
                    });
                }
            }
        });
      }

      update(ref(db), updates);
      return { ...state, departments: newOrder, departmentColors: colors || state.departmentColors };
    }
    case 'SET_DEPARTMENT_COLORS':
        set(ref(db, 'departmentColors'), action.payload);
        return { ...state, departmentColors: action.payload };
    case 'SET_DOCUMENT_TYPES':
        set(ref(db, 'documentTypes'), action.payload);
        return { ...state, documentTypes: action.payload };
    case 'SET_ASSIGNED_DEPARTMENTS':
        set(ref(db, 'assignedDepartments'), action.payload);
        return { ...state, assignedDepartments: action.payload };
    case 'SET_LABELS':
        set(ref(db, 'labels'), action.payload);
        return { ...state, labels: action.payload };
     case 'SET_COLUMN_VISIBILITY':
        set(ref(db, 'columnVisibility'), action.payload);
        return { ...state, columnVisibility: action.payload };
    case 'SET_LANGUAGE':
        if (typeof window !== 'undefined') {
            localStorage.setItem('docuFlow_language', action.payload);
        }
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
    let dbListener: Unsubscribe | null = null;
    let delayInterval: NodeJS.Timeout | null = null;
  
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // First, if a user is logging out, clean everything up.
      if (!user) {
        if (dbListener) {
          dbListener(); // Detach listener
          dbListener = null;
        }
        if (delayInterval) {
          clearInterval(delayInterval);
          delayInterval = null;
        }
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }
  
      // If a user is logged in, attach the database listener.
      if (!dbListener) {
        dbListener = onValue(ref(db), (snapshot) => {
          if (!snapshot.exists()) {
             console.log("No data found in DB, attempting to seed.");
             set(ref(db), initialData).catch(error => {
                console.error("Failed to seed database:", error);
             });
             // Don't proceed further, wait for next onValue trigger after seeding
             return;
          }
          
          const data = snapshot.val();
          const dbUsers: User[] = data.users ? Object.keys(data.users).map(key => ({ id: key, firestoreId: key, ...data.users[key] })) : [];
          const documents: Document[] = data.documents ? Object.keys(data.documents).map(key => ({ id: key, ...data.documents[key] })) : [];
          const logs: Log[] = data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [];

          // Dispatch all data at once to ensure consistency
          dispatch({
            type: 'SET_DATA',
            payload: {
              users: dbUsers,
              documents: documents,
              logs: logs,
              departments: data.departments || [],
              departmentColors: data.departmentColors || {},
              documentTypes: data.documentTypes || [],
              assignedDepartments: data.assignedDepartments || [],
              labels: data.labels || [],
              columnVisibility: data.columnVisibility || initialColumnVisibility,
            }
          });
          
          // Now that data is loaded, find the user profile.
          const authUser = auth.currentUser;
          if (authUser) {
            const userProfile = dbUsers.find(u => u.id === authUser.uid);
            if (userProfile) {
              dispatch({ type: 'SET_CURRENT_USER', payload: userProfile });
            } else {
              console.error(`Authenticated user ${authUser.uid} not found in database.`);
              dispatch({ type: 'LOGOUT' });
            }
          }
        }, (error) => {
          console.error("Firebase Realtime Database listener error:", error);
          dispatch({ type: 'LOGOUT' });
        });
      }
  
      // Start the interval for checking delayed documents.
      if (!delayInterval) {
        delayInterval = setInterval(() => {
          dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
        }, 60000);
      }
    });
  
    // Cleanup function
    return () => {
      unsubscribeAuth();
      if (dbListener) {
        dbListener();
      }
      if (delayInterval) {
        clearInterval(delayInterval);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Base documents filtered by user permissions (department and label)
  const permissionFilteredDocs = useMemo(() => {
    if (!state.isInitialized || !state.currentUser) return [];

    return state.documents.filter(doc =>
        hasDepartmentPermission(state.currentUser, doc.status) &&
        hasLabelPermission(state.currentUser, doc.label)
    );
  }, [state.documents, state.currentUser, state.isInitialized]);


  const filteredDocs = useMemo(() => {
    if (!state.isInitialized || !state.currentUser) return [];
    
    let docs = permissionFilteredDocs;

    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase();
      docs = docs.filter(doc => {
          const fieldsToSearch = [
            doc.id, doc.name, doc.documentType, doc.label, doc.secondaryId,
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
  }, [permissionFilteredDocs, state.filter, state.currentUser, state.isInitialized]);
  
  const activeDocs = useMemo(() => {
    // Metrics should also respect permissions
    return permissionFilteredDocs.filter(d => d.status !== 'Combined' && d.status !== 'Split');
  }, [permissionFilteredDocs]);


  const metrics = useMemo(() => {
    // The base for all metrics calculations is now the permission-filtered docs
    const allDocs = permissionFilteredDocs; 
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
  }, [activeDocs, permissionFilteredDocs, state.filter.periodValue, state.filter.periodUnit, state.filter.periodDepartment]);


  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs, metrics }}>
      {children}
    </AppContext.Provider>
  )
}
