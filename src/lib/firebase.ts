import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4FYQTUdFsvnGq8gSOa1jVPWHNocVOF6c",
  authDomain: "taxlk-13159.firebaseapp.com",
  projectId: "taxlk-13159",
  storageBucket: "taxlk-13159.firebasestorage.app",
  messagingSenderId: "16974031848",
  appId: "1:16974031848:web:8116f90fdc4727d8e5525d",
  measurementId: "G-YC4FZZ6FRV"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Explicitly persist auth token in localStorage.
// User stays logged in across browser sessions, tabs, and restarts
// until they explicitly click Logout.
setPersistence(auth, browserLocalPersistence);

export { app, auth, db, analytics };
