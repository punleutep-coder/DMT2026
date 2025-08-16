'use client'
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)

// This enables offline data persistence and multi-tab synchronization.
// It's a key part of making the app feel fast and reliable.
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn(
        'Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.'
      )
    } else if (err.code == 'unimplemented') {
      console.log(
        'The current browser does not support all of the features required to enable persistence.'
      )
    } else {
       console.error("An error occurred with Firestore persistence:", err)
    }
  })
}

// Check for emulator environment
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  console.log('Connecting to Firestore emulator')
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export { app, db }
