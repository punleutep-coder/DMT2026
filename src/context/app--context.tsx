





'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { ref, onValue, set, push, get, update } from 'firebase/database'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission, hasPermission } from '@/lib/permissions'
import { sanitizeFirebaseKey } from '@/lib/utils'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Partial<AppState> }
  | { type: 'LOGIN'; payload: { user: User } }
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
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'km' }
  | { type: 'SET_INITIALIZED'; payload: boolean };


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
        return {
            ...state,
            isInitialized: action.payload,
        };
    case 'SET_INITIAL_STATE':
        const currentUser = action.payload.currentUser !== undefined ? action.payload.currentUser : state.currentUser;
        const storedUser = sessionStorage.getItem('currentUser');
        const finalUser = currentUser || (storedUser ? JSON.parse(storedUser) : null);
        
        let initialFilter = state.filter;
        if (typeof window !== 'undefined') {
            const storedFilter = localStorage.getItem('docuFlow_filterSettings');
            if (storedFilter) {
                const parsedFilter = JSON.parse(storedFilter);
                initialFilter = {
                    ...initialFilter,
                    ...parsedFilter,
                    // Dates need to be reconstructed from strings
                    startDate: parsedFilter.startDate ? new Date(parsedFilter.startDate) : null,
                    endDate: parsedFilter.endDate ? new Date(parsedFilter.endDate) : null,
                };
            }
        }

        return {
            ...state,
            ...action.payload,
            currentUser: finalUser,
            filter: initialFilter,
            isInitialized: true,
        };
    case 'SET_DOCUMENTS':
        return { ...state, documents: action.payload, pagination: {...state.pagination, currentPage: 1} };
    case 'SET_LOGS':
        return { ...state, logs: action.payload };
    case 'SET_USERS':
        const users = action.payload;
        let liveCurrentUser = state.currentUser;
        if (liveCurrentUser) {
            const updatedUser = users.find(u => u.id === liveCurrentUser!.id);
            if (!updatedUser) {
                sessionStorage.removeItem('currentUser');
                liveCurrentUser = null;
            } else if (JSON.stringify(updatedUser) !== JSON.stringify(liveCurrentUser)) {
                liveCurrentUser = updatedUser;
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        }
        return { ...state, users, currentUser: liveCurrentUser };
    case 'LOGIN':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload.user));
      return { 
        ...state, 
        currentUser: action.payload.user,
      };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('docuFlow_filterSettings');
      return { ...getInitialState(), isInitialized: true, users: state.users, departments: state.departments, documentTypes: state.documentTypes, assignedDepartments: state.assignedDepartments, columnVisibility: state.columnVisibility };
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

        if(Object.keys(updates).length > 1 || !updates[`/documents/${sanitizedId}`]) {
            update(ref(db), updates);
        }
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

        if(Object.keys(updates).length > 0) {
            update(ref(db), updates);
        }

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
        return { ...state, departments: action.payload };
      }
      
      const { newOrder, originalDepartments } = action.payload;
      const updates: { [key: string]: any } = {};
      updates['/departments'] = newOrder;

      // Check for renamed departments
      if (originalDepartments && Array.isArray(originalDepartments)) {
        originalDepartments.forEach((oldName, index) => {
            const newName = newOrder.find(n => originalDepartments.includes(n) && originalDepartments.indexOf(n) === index && n !== oldName);
            const renamed = newOrder.includes(oldName) === false && newOrder.length === originalDepartments.length;

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
  metrics: {
    total: 0,
    inProgress: 0,
    delayed: 0,
    releaseReached: 0,
    completed: 0,
    completedSuccess: 0,
    completedUnsuccess: 0,
    exceeding: 0
  },
})

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    
    // This effect runs once on mount to set the initial state, including filters from localStorage
    dispatch({ type: 'SET_INITIAL_STATE', payload: {} });

    // This listener seeds the database if it's empty.
    const dbRef = ref(db, 'users');
    get(dbRef).then((snapshot) => {
        if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
            console.log("No users found in DB. Seeding database...");
            set(ref(db), initialData).catch(error => {
                console.error("Failed to seed database:", error);
            });
        }
    });

    const listeners = [
        { path: 'users', actionType: 'SET_USERS' },
        { path: 'departments', actionType: 'SET_DEPARTMENTS' },
        { path: 'documentTypes', actionType: 'SET_DOCUMENT_TYPES' },
        { path: 'assignedDepartments', actionType: 'SET_ASSIGNED_DEPARTMENTS' },
        { path: 'columnVisibility', actionType: 'SET_COLUMN_VISIBILITY' },
    ];

    const unsubscribes = listeners.map(({ path, actionType }) => 
        onValue(ref(db, path), (snapshot) => {
            const data = snapshot.val();
            if (path === 'users') {
                 dispatch({ type: actionType, payload: data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [] } as any);
            } else {
                 dispatch({ type: actionType, payload: data || (path === 'departments' || path === 'documentTypes' || path === 'assignedDepartments' ? [] : initialColumnVisibility) } as any);
            }
        }, (error) => {
            console.error(`Firebase onValue error for ${path}:`, error);
        })
    );

    return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  useEffect(() => {
    // These listeners are active only when a user is logged in.
    if (!state.currentUser) return;

    const dataListeners = [
        { path: 'documents', actionType: 'SET_DOCUMENTS' },
        { path: 'logs', actionType: 'SET_LOGS' },
    ];

    const dataUnsubscribes = dataListeners.map(({ path, actionType }) => 
        onValue(ref(db, path), (snapshot) => {
            const data = snapshot.val();
            dispatch({ type: actionType, payload: data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [] } as any);
        }, (error) => {
            console.error(`Firebase onValue error for ${path}:`, error);
        })
    );
    
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000);

    return () => {
        dataUnsubscribes.forEach(unsubscribe => unsubscribe());
        clearInterval(interval);
    };
  }, [state.currentUser]);


  const filteredDocs = useMemo(() => {
    if (!state.isInitialized) return [];
    
    let docs = state.documents

    if (state.currentUser?.role !== 'Admin' && !hasPermission(state.currentUser, 'canViewCompleted')) {
      docs = docs.filter(doc => !doc.status.startsWith('Completed'));
    }

    if (state.currentUser?.role !== 'Admin') {
        docs = docs.filter(doc => hasDepartmentPermission(state.currentUser, doc.status));
    }

    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase()
      if (searchLower) {
        docs = docs.filter(doc => {
            const basicSearchMatch =
                doc.id.toLowerCase().includes(searchLower) ||
                doc.name.toLowerCase().includes(searchLower) ||
                (doc.documentType && doc.documentType.toLowerCase().includes(searchLower)) ||
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
        } else if (state.filter.mainFilter === 'Combined' || state.filter.mainFilter === 'Split') {
            docs = docs.filter(d => d.status === state.filter.mainFilter);
        }
    } else if (state.filter.departmentSpecificFilter === 'All' && state.currentUser?.role !== 'Admin') {
        if (!state.filter.startDate) {
            docs = docs.filter(doc => doc.status !== 'Combined' && doc.status !== 'Split');
        }
    }


    if(state.filter.departmentSpecificFilter !== 'All'){
        docs = docs.filter(d => d.status === state.filter.departmentSpecificFilter)
    }

    return docs.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [state.documents, state.logs, state.filter, state.currentUser, state.isInitialized])
  
  const activeDocs = useMemo(() => {
    if (state.filter.startDate && state.filter.endDate) {
        return filteredDocs;
    }
    return state.documents.filter(d => d.status !== 'Combined' && d.status !== 'Split');
  }, [filteredDocs, state.documents, state.filter.startDate, state.filter.endDate]);


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
