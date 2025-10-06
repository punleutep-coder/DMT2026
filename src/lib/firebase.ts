
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "docuflow-oxcte",
  "appId": "1:289993871598:web:4f18777192c00dabf823ff",
  "storageBucket": "docuflow-oxcte.firebasestorage.app",
  "apiKey": "AIzaSyD95GONWkmEmfSHze3qcSkqf6uv6nLnWng",
  "authDomain": "docuflow-oxcte.firebaseapp.com",
  "databaseURL": "https://docuflow-oxcte-default-rtdb.firebaseio.com",
  "measurementId": ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
