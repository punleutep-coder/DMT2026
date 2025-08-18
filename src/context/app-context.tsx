
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
      return { ...state, dialog: { ...getInitialState().dialog, ...action.payload, isOpen: true } };
    case 'CLOSE_DIALOG':
      return { ...state, dialog: { ...state.dialog, isOpen: false } };
    case 'SET_SELECTED_DOC_IDS':
      return { ...state, selectedDocIds: action.payload };
    case 'CHECK_DELAYED_DOCUMENTS': {
        const today = new Date().setHours(0, 0, 0, 0);
        let changed = false;
        const updatedDocs = state.documents.map(docEl => {
            let docChanged = false;
            let releaseDateReached = docEl.releaseDateReached;
            let justReleased = docEl.justReleased;

            if (docEl.isDelayed && docEl.releaseDate) {
                const releaseDate = new Date(docEl.releaseDate).setHours(0, 0, 0, 0);
                if (today >= releaseDate && !docEl.releaseDateReached) {
                    releaseDateReached = true;
                    justReleased = true;
                    docChanged = true;
                }
            }
             if (docEl.justReleased) {
                justReleased = false;
                docChanged = true;
            }
            if(docChanged) {
              changed = true;
              const updatedDoc = { ...docEl, releaseDateReached, justReleased };
              set(ref(db, `documents/${docEl.id}`), updatedDoc);
              return updatedDoc;
            }
            return docEl;
        });

        if (changed) {
            return { ...state, documents: updatedDocs };
        }
        return state;
    }
     case 'ADD_DOCUMENT': {
        set(ref(db, `documents/${action.payload.id}`), action.payload);
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
        const snapshot = await get(ref(db));
        const data = snapshot.val();
        if (!data) {
            // If database is empty, populate with default data
            await set(ref(db, 'users'), DEFAULT_USERS.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}));
            await set(ref(db, 'documents'), DEFAULT_DOCS.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {}));
            await set(ref(db, 'logs'), DEFAULT_LOGS.reduce((acc, log) => ({ ...acc, [log.id]: log }), {}));
            await set(ref(db, 'departments'), DEFAULT_DEPARTMENTS);
            await set(ref(db, 'columnVisibility'), initialColumnVisibility);
        }
    };
    setupInitialData();
  }, []);

  useEffect(() => {
    dispatch({ type: 'SET_INITIAL_LOADING', payload: true });

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

    dispatch({ type: 'SET_INITIAL_LOADING', payload: false });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DELAYED_DOCUMENTS' });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
  }, [state.documents, state.filter, state.currentUser])

  return (
    <AppContext.Provider value={{ state, dispatch, filteredDocs }}>
      {children}
    </AppContext.Provider>
  )
}
