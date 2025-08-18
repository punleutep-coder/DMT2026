
'use client'

import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useMemo } from 'react'
import type { AppState, User, Document, Log, DialogState, ModalState } from '@/lib/types'
import {
  DEFAULT_DOCS,
  DEFAULT_LOGS,
  DEFAULT_DEPARTMENTS,
  initialColumnVisibility,
  DEFAULT_USERS,
} from '@/lib/initial-data'
import { isDocumentExceedingPeriod } from '@/lib/document-utils'
import { hasDepartmentPermission } from '@/lib/permissions'
import { db } from '@/lib/firebase'
import { ref, onValue, set, get } from 'firebase/database'

type Action =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_DATA'; payload: Partial<Pick<AppState, 'documents' | 'users' | 'logs' | 'departments' | 'columnVisibility'>> }
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
  | { type: 'ADD_LOG'; payload: Omit<Log, 'id' | 'firestoreId'> & {id?: string, firestoreId?: string} }
  | { type: 'SET_DEPARTMENTS'; payload: string[] }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: { [key: string]: boolean } }


const getInitialState = (): AppState => {
    const currentUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('currentUser') || 'null') : null;

    return {
        users: [],
        currentUser,
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
    };
};


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_DATA':
        return { ...state, ...action.payload };
    case 'LOGIN':
      sessionStorage.setItem('currentUser', JSON.stringify(action.payload));
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      sessionStorage.removeItem('currentUser');
      return { ...state, currentUser: null, isInitialized: false };
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
        const docsToUpdate = state.documents.filter(doc => {
            if (doc.isDelayed && doc.releaseDate) {
                const releaseDate = new Date(doc.releaseDate).setHours(0, 0, 0, 0);
                return today >= releaseDate && !doc.releaseDateReached;
            }
            return false;
        });

        if (docsToUpdate.length > 0) {
            docsToUpdate.forEach(doc => {
                const updatedDoc = { ...doc, releaseDateReached: true, justReleased: true };
                set(ref(db, `documents/${doc.id}`), updatedDoc);
            });
        }
        
        // Also reset 'justReleased' flag for docs that were just released in the previous check
        const docsToReset = state.documents.filter(doc => doc.justReleased);
        if (docsToReset.length > 0) {
            docsToReset.forEach(doc => {
                 const updatedDoc = { ...doc, justReleased: false };
                 set(ref(db, `documents/${doc.id}`), updatedDoc);
            });
        }

        return state;
    }
     case 'ADD_DOCUMENT': {
        set(ref(db, `documents/${action.payload.id}`), action.payload);
        // State will update via the onValue listener
        return state;
      }
      case 'UPDATE_DOCUMENT': {
        const docRef = ref(db, `documents/${action.payload.id}`);
        get(docRef).then((snapshot) => {
            if (snapshot.exists()) {
                const currentDoc = snapshot.val();
                set(docRef, { ...currentDoc, ...action.payload });
            }
        });
        return state;
      }
      case 'DELETE_DOCUMENT': {
        set(ref(db, `documents/${action.payload.id}`), null);
        
        const logsRef = ref(db, 'logs');
        get(logsRef).then((snapshot) => {
            if (snapshot.exists()) {
                const allLogs: {[key: string]: Log} = snapshot.val();
                const logsToDelete = Object.keys(allLogs).filter(key => allLogs[key].docId === action.payload.id);
                logsToDelete.forEach(key => {
                    set(ref(db, `logs/${key}`), null);
                });
            }
        });
        return state;
      }
      case 'ADD_USER': {
        set(ref(db, `users/${action.payload.id}`), action.payload);
        return state;
      }
      case 'UPDATE_USER': {
        const userRef = ref(db, `users/${action.payload.id}`);
        get(userRef).then((snapshot) => {
            if(snapshot.exists()) {
                const currentUser = snapshot.val();
                set(userRef, { ...currentUser, ...action.payload });
            }
        });
        return state;
      }
      case 'DELETE_USER': {
        set(ref(db, `users/${action.payload.id}`), null);
        return state;
      }
      case 'ADD_LOG': {
        const logId = action.payload.id || `log-${Date.now()}`;
        const newLog = { ...action.payload, id: logId, firestoreId: logId };
        set(ref(db, `logs/${logId}`), newLog);
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
    const setupInitialData = async () => {
        const dbRef = ref(db);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists() || !snapshot.val()) {
            console.log("Firebase is empty. Populating with default data...");
            // If database is empty, populate with default data
            const updates: { [key: string]: any } = {};
            updates['/users'] = DEFAULT_USERS.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
            updates['/documents'] = DEFAULT_DOCS.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {});
            updates['/logs'] = DEFAULT_LOGS.reduce((acc, log) => ({ ...acc, [log.id]: log }), {});
            updates['/departments'] = DEFAULT_DEPARTMENTS;
            updates['/columnVisibility'] = initialColumnVisibility;
            
            await set(dbRef, updates);
        }
        dispatch({ type: 'SET_INITIALIZED', payload: true });
    };

    if (state.currentUser && !state.isInitialized) {
        setupInitialData();
    } else if (!state.currentUser) {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, [state.currentUser, state.isInitialized]);


  useEffect(() => {
    if (!state.isInitialized) return;

    const unsubscribes = [
        onValue(ref(db, 'users'), (snapshot) => {
            const users = snapshot.val() ? Object.values(snapshot.val()) as User[] : [];
            dispatch({ type: 'SET_DATA', payload: { users }});
        }),
        onValue(ref(db, 'documents'), (snapshot) => {
            const documents = snapshot.val() ? Object.values(snapshot.val()) as Document[] : [];
            dispatch({ type: 'SET_DATA', payload: { documents }});
        }),
        onValue(ref(db, 'logs'), (snapshot) => {
            const logs = snapshot.val() ? Object.values(snapshot.val()) as Log[] : [];
            dispatch({ type: 'SET_DATA', payload: { logs }});
        }),
        onValue(ref(db, 'departments'), (snapshot) => {
            const departments = snapshot.val() || [];
            dispatch({ type: 'SET_DATA', payload: { departments }});
        }),
        onValue(ref(db, 'columnVisibility'), (snapshot) => {
            const columnVisibility = snapshot.val() || initialColumnVisibility;
            dispatch({ type: 'SET_DATA', payload: { columnVisibility }});
        }),
    ];

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [state.isInitialized]);


  useEffect(() => {
    if (!state.currentUser) return;
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.currentUser]);


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
