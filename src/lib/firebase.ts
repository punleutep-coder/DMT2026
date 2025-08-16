// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "docuflow-oxcte",
  "appId": "1:289993871598:web:4f18777192c00dabf823ff",
  "storageBucket": "docuflow-oxcte.firebasestorage.app",
  "apiKey": "AIzaSyD95GONWkmEmfSHze3qcSkqf6uv6nLnWng",
  "authDomain": "docuflow-oxcte.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "289993871598"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
