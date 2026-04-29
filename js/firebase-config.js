import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const ADMIN_EMAIL = "osherper@gmail.com";

export const firebaseConfig = {
  apiKey: "AIzaSyDE2SXaGtaMdjkRv3jFzbeZzqidHf2ep8E",
  authDomain: "ehs-course.firebaseapp.com",
  projectId: "ehs-course",
  storageBucket: "ehs-course.firebasestorage.app",
  messagingSenderId: "960785871196",
  appId: "1:960785871196:web:2efb1fc8505cae0543d199",
  measurementId: "G-WLNH49W1EX"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value && value !== "PASTE_HERE");
export const appCheckSiteKey = "PASTE_RECAPTCHA_V3_SITE_KEY";
export const isAppCheckConfigured =
  appCheckSiteKey && appCheckSiteKey !== "PASTE_RECAPTCHA_V3_SITE_KEY";

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const appCheck =
  app && isAppCheckConfigured
    ? initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      })
    : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
};
