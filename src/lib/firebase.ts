// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

// Initialize App Check only on the client-side
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LeIxAcbAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'), // Public key
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getDatabase(app);
