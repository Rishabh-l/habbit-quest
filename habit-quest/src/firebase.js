import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// ─── Paste your Firebase project config here ───────────────────────────────
// Go to: Firebase Console → Project Settings → Your apps → Web app → SDK config
const firebaseConfig = {
  apiKey: "AIzaSyAVIvNDSK1mV0BYIhDiG5Br6ntIs1FETZY",
  authDomain: "habit-quest-21f18.firebaseapp.com",
  projectId: "habit-quest-21f18",
  storageBucket: "habit-quest-21f18.firebasestorage.app",
  messagingSenderId: "103726659260",
  appId: "1:103726659260:web:bc66398db61178d35ac2b9",
  measurementId: "G-BHKCFS89PD",
};
// ───────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ─── Firestore ─────────────────────────────────────────────────────────────
export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserData(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}
