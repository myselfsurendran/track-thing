import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';

import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔥 IMPORTANT: correctly initialize persistence
(async () => {
  await setPersistence(auth, inMemoryPersistence);
})();

// ------------------ SIGNUP ------------------
export async function signUpWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: any) {
    throw err;
  }
}

// ------------------ LOGIN ------------------
export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: any) {
    throw err;
  }
}

// ------------------ LOGOUT ------------------
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("SignOut ERROR:", err);
    throw err;
  }
}
