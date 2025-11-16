// firebaseLogic.ts

import { db } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import { UserProfile } from '../types';

type LogCollection = 'meals' | 'workouts' | 'sleep' | 'water';


// ----------------------------------------------------
// CLEANER: Remove undefined + unsupported Firestore data
// ----------------------------------------------------

export function cleanForFirestore(value: any): any {
    if (value === undefined) return null;  // <---- convert undefined to null
    if (value === null) return null;

    if (Array.isArray(value)) {
        return value.map(v => cleanForFirestore(v));
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = cleanForFirestore(v);
        }
        return out;
    }

    return value;
}



// ----------------------------------------------------
// PROFILE MANAGEMENT
// ----------------------------------------------------

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
    }
    return null;
};

export const saveProfile = async (uid: string, profile: UserProfile): Promise<void> => {
    if (!uid) throw new Error('Missing uid');
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, profile, { merge: true }); // merge:true to avoid overwriting unintentionally
  };


// ----------------------------------------------------
// GENERIC LOG MANAGEMENT
// ----------------------------------------------------

export const getLogs = async <T>(
    uid: string,
    logType: LogCollection
): Promise<T[]> => {
    const logCollectionRef = collection(db, 'users', uid, logType);
    const q = query(logCollectionRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as T)
    }));
};


// ADD LOG — now Firestore-safe
export const addLog = async <T extends object>(
    uid: string,
    logType: LogCollection,
    data: T
): Promise<T & { id: string }> => {
    const logCollectionRef = collection(db, 'users', uid, logType);
    const cleaned = cleanForFirestore(data);

    const docRef = await addDoc(logCollectionRef, cleaned as DocumentData);

    return {
        ...data,
        id: docRef.id
    };
};


// UPDATE LOG — also Firestore-safe
export const updateLog = async <T extends { id: string }>(
    uid: string,
    logType: LogCollection,
    logId: string,
    data: T
): Promise<void> => {

    const { id, ...rest } = data;
    const cleaned = cleanForFirestore(rest);

    const logDocRef = doc(db, 'users', uid, logType, logId);
    await updateDoc(logDocRef, cleaned as DocumentData);
};


// DELETE
export const deleteLog = async (
    uid: string,
    logType: LogCollection,
    logId: string
): Promise<void> => {
    const logDocRef = doc(db, 'users', uid, logType, logId);
    await deleteDoc(logDocRef);
};
