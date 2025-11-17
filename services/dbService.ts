// services/dbService.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import {
  UserProfile
} from '../types';

// --- existing types
type LogCollection = 'meals' | 'workouts' | 'sleep' | 'water';

// --- Profile Management ---
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const saveProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, profile, { merge: true });
};

// --- Generic Log Management ---
export const getLogs = async <T>(uid: string, logType: LogCollection): Promise<T[]> => {
  try {
    const logCollectionRef = collection(db, 'users', uid, logType);
    const q = query(logCollectionRef, orderBy('timestamp', 'desc'));
    const logSnapshot = await getDocs(q);
    if (!logSnapshot || logSnapshot.empty) return [];
    return logSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as T) }));
  } catch (err) {
    console.error('getLogs error', err);
    return [];
  }
};

export const addLog = async <T extends object>(uid: string, logType: LogCollection, data: T): Promise<T & { id: string }> => {
  const logCollectionRef = collection(db, 'users', uid, logType);
  const docRef = doc(logCollectionRef); // generate id
  await setDoc(docRef, data as any);
  return {
    ...data,
    id: docRef.id,
  };
};

export const updateLog = async <T extends { id: string }>(uid: string, logType: LogCollection, logId: string, data: T): Promise<void> => {
  const logDocRef = doc(db, 'users', uid, logType, logId);
  const { id, ...dataToUpdate } = data;
  await setDoc(logDocRef, dataToUpdate as any, { merge: true });
};

export const deleteLog = async (uid: string, logType: LogCollection, logId: string): Promise<void> => {
  const logDocRef = doc(db, 'users', uid, logType, logId);
  await setDoc(logDocRef, {}, { merge: true }); // safe no-op delete alternative
  // If you prefer actual delete:
  // await deleteDoc(logDocRef);
};

// --------------------
// Sharing snapshot feature
// --------------------

/**
 * createShare
 * - Builds a small snapshot of profile + aggregated data
 * - Stores under `sharedProfiles/<token>`
 * - Returns the token
 */
export const createShare = async (
  ownerUid: string,
  opts: {
    sections?: ('profile'|'nutrition'|'workout'|'sleep'|'water')[],
    expiresInHours?: number | null
  } = {}
): Promise<string> => {
  const token = nanoid(10);
  const sections = opts.sections ?? ['profile','nutrition','workout','sleep','water'];
  const now = new Date();
  const expiresAt = opts.expiresInHours ? new Date(now.getTime() + opts.expiresInHours * 3600 * 1000) : null;

  // fetch profile and logs
  const profile = await getProfile(ownerUid);
  const [meals, workouts, sleep, water] = await Promise.all([
    getLogs<any>(ownerUid, 'meals'),
    getLogs<any>(ownerUid, 'workouts'),
    getLogs<any>(ownerUid, 'sleep'),
    getLogs<any>(ownerUid, 'water'),
  ]);

  // helpers
  const toLocale = (d: string) => new Date(d).toLocaleDateString();
  const todayStr = new Date().toLocaleDateString();

  // todays aggregates
  const todaysMeals = meals.filter(m => toLocale(m.timestamp) === todayStr);
  const todaysWater = water.filter(w => toLocale(w.timestamp) === todayStr);

  const todaysSummary = {
    calories: todaysMeals.flatMap(m => (Array.isArray(m.items) ? m.items : [])).reduce((s:any,it:any) => s + Number(it?.calories ?? 0), 0),
    protein: todaysMeals.flatMap(m => (Array.isArray(m.items) ? m.items : [])).reduce((s:any,it:any) => s + Number(it?.protein ?? 0), 0),
    carbs: todaysMeals.flatMap(m => (Array.isArray(m.items) ? m.items : [])).reduce((s:any,it:any) => s + Number(it?.carbs ?? 0), 0),
    fat: todaysMeals.flatMap(m => (Array.isArray(m.items) ? m.items : [])).reduce((s:any,it:any) => s + Number(it?.fat ?? 0), 0),
    water: todaysWater.reduce((s:any,w:any) => s + Number(w?.amount ?? 0), 0),
  };

  // 7-day history (simple aggregated)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - i);
    const ds = d.toLocaleDateString();
    const dayMeals = meals.filter(m => toLocale(m.timestamp) === ds);
    const mealSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    dayMeals.forEach((m:any) => {
      const items = Array.isArray(m.items) ? m.items : [];
      items.forEach((it:any) => {
        mealSummary.calories += Number(it?.calories ?? 0);
        mealSummary.protein += Number(it?.protein ?? 0);
        mealSummary.carbs += Number(it?.carbs ?? 0);
        mealSummary.fat += Number(it?.fat ?? 0);
      });
    });
    const dayWorkouts = workouts.filter((w:any) => toLocale(w.timestamp) === ds);
    const steps = dayWorkouts.reduce((s:any,w:any) => s + Number(w?.steps ?? 0), 0);
    const waterAmt = water.filter((w:any) => toLocale(w.timestamp) === ds).reduce((s:any,w:any) => s + Number(w?.amount ?? 0), 0);
    const sleepEntry = sleep.find((s:any) => toLocale(s.timestamp) === ds);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...mealSummary,
      steps,
      water: waterAmt,
      sleepScore: sleepEntry?.score ?? 0
    };
  }).reverse();

  const summary = {
    todaysSummary,
    last7Days,
    workoutSummary: { totalWorkouts: Array.isArray(workouts) ? workouts.length : 0 },
    sleepSummary: { latestScore: (Array.isArray(sleep) && sleep.length > 0) ? sleep[0].score ?? 0 : 0 },
  };

  const shareDoc = {
    ownerUid,
    ownerName: profile?.name ?? '',
    username: profile?.username ?? '',
    profileSnapshot: profile ?? {},
    summary,
    sections,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
  };

  await setDoc(doc(db, 'sharedProfiles', token), shareDoc);
  return token;
};

/**
 * fetchShare
 * - returns the saved snapshot or null
 */
export const fetchShare = async (token: string): Promise<any | null> => {
  try {
    const ref = doc(db, 'sharedProfiles', token);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error('fetchShare error', err);
    return null;
  }
};
