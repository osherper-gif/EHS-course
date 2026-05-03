import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDE2SXaGtaMdjkRv3jFzbeZzqidHf2ep8E",
  authDomain: "ehs-course.firebaseapp.com",
  projectId: "ehs-course",
  storageBucket: "ehs-course.firebasestorage.app",
  messagingSenderId: "960785871196",
  appId: "1:960785871196:web:2efb1fc8505cae0543d199",
  measurementId: "G-WLNH49W1EX",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value && value !== "PASTE_HERE");
export const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;

export { GoogleAuthProvider, onAuthStateChanged, signInWithPopup };
