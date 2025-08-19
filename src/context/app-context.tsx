
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { ref, onValue, set, get, child, push, remove, update } from 'firebase/database'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  initialColumnVisibility,
  initialData,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Partial<AppState> }
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
  | { type: 'SET_DATA_FROM_SNAPSHOT'; payload: any }


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
    case 'SET_INITIAL_STATE':
        return {
            ...state,
            ...action.payload,
            isInitialized: true,
        };
    case 'SET_DATA_FROM_SNAPSHOT':
        const data = action.payload;
        const documents = data.documents ? Object.keys(data.documents).map(key => ({ id: key, firestoreId: key, ...data.documents[key] })) : [];
        const logs = data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [];
        const users = data.users ? Object.keys(data.users).map(key => ({ id: key, firestoreId: key, ...data.users[key] })) : [];
        const departments = data.departments || [];
        const columnVisibility = data.columnVisibility || initialColumnVisibility;
        
        // This is a special case to handle re-login. We don't want to wipe users if they're already there.
        const finalUsers = state.users.length > 0 && users.length === 0 ? state.users : users;

        return {
            ...state,
            documents,
            logs,
            users: finalUsers,
            departments,
            columnVisibility,
        };
    case 'LOGIN':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload));
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      // When logging out, we preserve the list of users so login can work again
      return { ...getInitialState(), users: state.users, isInitialized: true };
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
        const updates: any = {};
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
        const { id, ...docData } = action.payload;
        const updates: any = {};
        updates[`documents/${id}`] = docData;
        update(ref(db), updates);
        return state;
      }
      case 'UPDATE_DOCUMENT': {
        const { id, ...docData } = action.payload;
        update(ref(db, `documents/${id}`), docData);
        return state;
      }
      case 'DELETE_DOCUMENT': {
        const { id } = action.payload;
        remove(ref(db, `documents/${id}`));
        
        get(child(ref(db), 'logs')).then(snapshot => {
            if (snapshot.exists()) {
                const logs = snapshot.val();
                for (const logId in logs) {
                    if (logs[logId].docId === id) {
                        remove(ref(db, `logs/${logId}`));
                    }
                }
            }
        });
        return state;
      }
      case 'ADD_USER': {
        const { id, ...userData } = action.payload;
        update(ref(db, `users/${id}`), userData);
        return state;
      }
      case 'UPDATE_USER': {
        const { id, ...userData } = action.payload;
        update(ref(db, `users/${id}`), userData);
        return state;
      }
      case 'DELETE_USER': {
        remove(ref(db, `users/${action.payload.id}`));
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

    const initializeAndListen = async () => {
        try {
            // 1. One-time fetch for initial load to determine if seeding is needed
            const snapshot = await get(dbRef);

            if (!snapshot.exists()) {
                console.log("Database is empty, seeding with initial data...");
                await set(dbRef, initialData);
            }
            
            // 2. Load current user from session storage
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            
            // 3. Set the initial state and mark as initialized
            const initialPayload = snapshot.val() || initialData;
            dispatch({
                type: 'SET_INITIAL_STATE',
                payload: {
                    ...stateFromSnapshot(initialPayload),
                    currentUser
                }
            });

            // 4. Set up a persistent listener for any subsequent real-time updates
            const unsubscribe = onValue(dbRef, (liveSnapshot) => {
                const data = liveSnapshot.val();
                if (data) {
                    dispatch({ type: 'SET_DATA_FROM_SNAPSHOT', payload: data });
                }
            }, (error) => {
                console.error("Firebase onValue listener error:", error);
            });

            // Return the cleanup function for the listener
            return () => unsubscribe();
        } catch (error) {
            console.error("Error during initial data load:", error);
            dispatch({ type: 'SET_INITIAL_STATE', payload: {} }); // Mark as initialized even on error to unblock UI
        }
    };
    
    initializeAndListen();
  }, []);

  const stateFromSnapshot = (data: any) => {
    const documents = data.documents ? Object.keys(data.documents).map(key => ({ id: key, firestoreId: key, ...data.documents[key] })) : [];
    const logs = data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [];
    const users = data.users ? Object.keys(data.users).map(key => ({ id: key, firestoreId: key, ...data.users[key] })) : [];
    const departments = data.departments || [];
    const columnVisibility = data.columnVisibility || initialColumnVisibility;

    return { documents, logs, users, departments, columnVisibility };
  }


  useEffect(() => {
    if (!state.isInitialized) return;
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isInitialized]);


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

    