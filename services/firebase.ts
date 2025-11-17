// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig'; // keep your config here

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// IMPORTANT: enable persistent login in browser (localStorage) and await it.
// This ensures auth is ready before other auth operations (prevents weird signOut bugs).
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    // console.log('Firebase auth persistence set to browserLocalPersistence');
  } catch (err) {
    console.error('Failed to set auth persistence:', err);
  }
})();

// Sign up and return the created User object
export async function signUpWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: any) {
    throw err;
  }
}

// Sign in and return user
export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: any) {
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('SignOut ERROR:', err);
    throw err;
  }
}
