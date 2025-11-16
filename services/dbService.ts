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
    WithFieldValue, 
    DocumentData
} from 'firebase/firestore';
import { UserProfile } from '../types';

type LogCollection = 'meals' | 'workouts' | 'sleep' | 'water';

// --- Profile Management ---

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
    }
    return null;
};

export const saveProfile = async (uid: string, profile: UserProfile): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, profile);
};


// --- Generic Log Management ---

export const getLogs = async <T>(uid: string, logType: LogCollection): Promise<T[]> => {
    const logCollectionRef = collection(db, 'users', uid, logType);
    const q = query(logCollectionRef, orderBy('timestamp', 'desc'));
    const logSnapshot = await getDocs(q);
    
    return logSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as T));
};

// FIX: Using a more robust generic signature for `addLog` to ensure correct type inference.
export const addLog = async <T>(uid: string, logType: LogCollection, data: T): Promise<T & { id: string }> => {
    const logCollectionRef = collection(db, 'users', uid, logType);
    const docRef = await addDoc(logCollectionRef, data as DocumentData);
    return {
        ...data,
        id: docRef.id,
    };
};

export const updateLog = async <T extends {id: string}>(
    uid: string, 
    logType: LogCollection, 
    logId: string, 
    data: T
): Promise<void> => {
    const logDocRef = doc(db, 'users', uid, logType, logId);
    const { id, ...dataToUpdate } = data;
    await updateDoc(logDocRef, dataToUpdate);
};

export const deleteLog = async (uid: string, logType: LogCollection, logId: string): Promise<void> => {
    const logDocRef = doc(db, 'users', uid, logType, logId);
    await deleteDoc(logDocRef);
};
