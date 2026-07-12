// src/App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ConversationalInput from './components/ConversationalInput';
import MealLogTable from './components/MealLogTable';
import ProfileSetup from './components/ProfileSetup';
import { MealLogEntry, UserProfile, DailyGoals, WorkoutLogEntry, SleepLogEntry, WeightLogEntry } from './types';
import { parseMealFromText, parseWorkoutFromText, setApiKey } from './services/geminiService';
import { calculateDailyGoals, calculateSleepScore } from './utils/calculations';
import { encryptText, decryptText } from './utils/encryption';
import ConversationalWorkoutInput from './components/ConversationalWorkoutInput';
import WorkoutLogTable from './components/WorkoutLogTable';
import SleepTracker from './components/SleepTracker';
import WeightTracker from './components/WeightTracker';
import AiCoach from './components/AiCoach';
import RightPanel from './components/RightPanel';
import GlobalActions from './components/GlobalActions';
import SummaryModal from './components/SummaryModal';
import SuggestionModal from './components/SuggestionModal';
import Auth from './components/Auth';

import { auth, signOutUser } from './services/firebase';
import { onAuthStateChanged, User, getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as dbService from './services/dbService';
import { toLocalISODate } from './utils/dateHelpers';

type Tab = 'Nutrition' | 'Workout' | 'Sleep' | 'Weight';

const App: React.FC = () => {
  // ---------- state hooks (always present) ----------
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);
  const [workoutLog, setWorkoutLog] = useState<WorkoutLogEntry[]>([]);
  const [sleepLog, setSleepLog] = useState<SleepLogEntry[]>([]);
  const [weightLog, setWeightLog] = useState<WeightLogEntry[]>([]);

  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Nutrition');

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userHasProfile, setUserHasProfile] = useState<boolean | null>(null);

  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);

  // selected date (local)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // ---------- derived hooks ----------
  const dailyGoals = useMemo<DailyGoals | null>(() => {
    if (!userProfile) return null;
    return userProfile.customGoals || calculateDailyGoals(userProfile);
  }, [userProfile]);

  // Auth state loader (runs once on mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(false);

      if (!user) {
        setAuthUser(null);
        setUserProfile(null);
        setMealLog([]);
        setWorkoutLog([]);
        setSleepLog([]);
        setWeightLog([]);
        setProfileLoaded(false);
        setUserHasProfile(null);
        setIsLoading(false);
        return;
      }

      setAuthUser(user);
      setIsLoading(true);
      setProfileLoaded(false);
      setUserHasProfile(null);

      try {
        const profile = await dbService.getProfile(user.uid);
        let decryptedProfile = profile;
        if (profile) {
          let decryptedKey = '';
          if (profile.geminiApiKey) {
            try {
              decryptedKey = await decryptText(profile.geminiApiKey, user.uid);
            } catch (err) {
              console.error('Failed to decrypt API key:', err);
            }
          }
          if (decryptedKey) {
            localStorage.setItem('gemini_api_key', decryptedKey);
            setApiKey(decryptedKey);
          } else {
            localStorage.removeItem('gemini_api_key');
            setApiKey('');
          }
          decryptedProfile = { ...profile, geminiApiKey: decryptedKey };
        }
        setUserProfile(decryptedProfile ?? null);
        setUserHasProfile(!!profile);

        if (profile) {
          const [meals, workouts, sleep] = await Promise.all([
            dbService.getLogs<MealLogEntry>(user.uid, 'meals').catch(() => []),
            dbService.getLogs<WorkoutLogEntry>(user.uid, 'workouts').catch(() => []),
            dbService.getLogs<SleepLogEntry>(user.uid, 'sleep').catch(() => []),
          ]);

          setMealLog(Array.isArray(meals) ? meals : []);
          setWorkoutLog(Array.isArray(workouts) ? workouts : []);
          setSleepLog(Array.isArray(sleep) ? sleep : []);
          setWeightLog(profile.weightHistory || []);
        }
      } catch (e) {
        console.error('Error loading user data', e);
        setError('Could not load your data from the cloud.');
        setUserHasProfile(null);
      } finally {
        setIsLoading(false);
        setProfileLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------- callbacks (hooks) ----------
  const handleUpdateMeal = useCallback(async (updatedMeal: MealLogEntry) => {
    if (!authUser) return;
    await dbService.updateLog(authUser.uid, 'meals', updatedMeal.id, updatedMeal);
    setMealLog(prev => prev.map(m => (m.id === updatedMeal.id ? updatedMeal : m)));
  }, [authUser]);

  const handleDeleteMeal = useCallback(async (id: string) => {
    if (!authUser) return;
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await dbService.deleteLog(authUser.uid, 'meals', id);
      setMealLog(prev => prev.filter(m => m.id !== id));
    }
  }, [authUser]);

  const handleUpdateWorkout = useCallback(async (updatedWorkout: WorkoutLogEntry) => {
    if (!authUser) return;
    await dbService.updateLog(authUser.uid, 'workouts', updatedWorkout.id, updatedWorkout);
    setWorkoutLog(prev => prev.map(w => (w.id === updatedWorkout.id ? updatedWorkout : w)));
  }, [authUser]);

  const handleDeleteWorkout = useCallback(async (id: string) => {
    if (!authUser) return;
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await dbService.deleteLog(authUser.uid, 'workouts', id);
      setWorkoutLog(prev => prev.filter(w => w.id !== id));
    }
  }, [authUser]);

  const handleUpdateSleep = useCallback(async (updatedSleep: SleepLogEntry) => {
    if (!authUser) return;
    await dbService.updateLog(authUser.uid, 'sleep', updatedSleep.id, updatedSleep);
    setSleepLog(prev => prev.map(s => (s.id === updatedSleep.id ? updatedSleep : s)));
  }, [authUser]);

  const handleDeleteSleep = useCallback(async (id: string) => {
    if (!authUser) return;
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await dbService.deleteLog(authUser.uid, 'sleep', id);
      setSleepLog(prev => prev.filter(s => s.id !== id));
    }
  }, [authUser]);

  const handleSaveProfile = useCallback(async (profile: UserProfile) => {
    if (!authUser) return;
    try {
      const plainApiKey = profile.geminiApiKey || '';
      let encryptedKey = '';
      if (plainApiKey) {
        encryptedKey = await encryptText(plainApiKey, authUser.uid);
      }
      
      const profileToSave = { 
        ...profile, 
        id: authUser.uid,
        geminiApiKey: encryptedKey
      };
      
      await dbService.saveProfile(authUser.uid, profileToSave);
      
      if (plainApiKey) {
        localStorage.setItem('gemini_api_key', plainApiKey);
        setApiKey(plainApiKey);
      } else {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
      }

      setUserProfile({ ...profileToSave, geminiApiKey: plainApiKey });
      setUserHasProfile(true);
      setProfileModalOpen(false);
    } catch (e) {
      console.error('Failed to save profile', e);
      setError('Could not save your profile. Please try again.');
    }
  }, [authUser]);

  const handleLogWeight = useCallback(async (weight: number) => {
    if (weight <= 0 || !authUser || !userProfile) return;

    const now = new Date();
    const base = new Date(selectedDate);
    base.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    const newEntry: WeightLogEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      weight,
      timestamp: base.toISOString(),
    };
    
    const updatedWeightLog = [newEntry, ...weightLog];
    setWeightLog(updatedWeightLog);

    // Sort to find the latest log chronologically
    const sorted = [...updatedWeightLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const updatedProfile = {
      ...userProfile,
      weightHistory: updatedWeightLog,
      weight: sorted[0].id === newEntry.id ? weight : userProfile.weight
    };

    await handleSaveProfile(updatedProfile);
  }, [authUser, selectedDate, userProfile, weightLog, handleSaveProfile]);

  const handleDeleteWeight = useCallback(async (id: string) => {
    if (!authUser || !userProfile) return;
    if (window.confirm('Are you sure you want to delete this weight log?')) {
      const updatedWeightLog = weightLog.filter(w => w.id !== id);
      setWeightLog(updatedWeightLog);

      const updatedProfile = {
        ...userProfile,
        weightHistory: updatedWeightLog
      };
      await handleSaveProfile(updatedProfile);
    }
  }, [authUser, userProfile, weightLog, handleSaveProfile]);

  const handleSaveSummary = useCallback(async (dateStr: string, summary: string) => {
    if (!authUser || !userProfile) return;
    
    const updatedSummaries = {
      ...(userProfile.dailySummaries || {}),
      [dateStr]: summary
    };
    
    // Prune to latest 30 summaries
    const keys = Object.keys(updatedSummaries).sort();
    const pruned: Record<string, string> = {};
    keys.slice(-30).forEach(k => {
      pruned[k] = updatedSummaries[k];
    });

    const updatedProfile = {
      ...userProfile,
      dailySummaries: pruned
    };

    await handleSaveProfile(updatedProfile);
  }, [authUser, userProfile, handleSaveProfile]);


  const handleLogMeal = useCallback(async (text: string) => {
    if (!authUser) return;
    setIsLoggingMeal(true);
    setError(null);
    try {
    const parsedData = await parseMealFromText(text);
    
    
    // build timestamp using selectedDate's date + current time
    const now = new Date();
    const base = new Date(selectedDate);
    base.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    
    const newEntryData = {
      ...parsedData,
      timestamp: base.toISOString(),
      rawInput: text,
    };
    
    const newEntry = await dbService.addLog(authUser.uid, 'meals', newEntryData);
    setMealLog(prev => [newEntry, ...prev]);
    } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
    setIsLoggingMeal(false);
    }
    }, [authUser, selectedDate]);

    const handleLogWorkout = useCallback(async (text: string, steps: number) => {
      if (!authUser) return;
      setIsLoggingWorkout(true);
      setError(null);
      try {
      const parsedData = await parseWorkoutFromText(text);
      
      
      const now = new Date();
      const base = new Date(selectedDate);
      base.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      
      const newEntryData = {
      ...parsedData,
      steps: steps > 0 ? steps : null,
      timestamp: base.toISOString(),
      };
      
      
      const newEntry = await dbService.addLog(authUser.uid, 'workouts', newEntryData);
      setWorkoutLog(prev => [newEntry, ...prev]);
      } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
      setIsLoggingWorkout(false);
      }
      }, [authUser, selectedDate]);

  const handleLogSleep = useCallback(async (sleepTime: string, wakeupTime: string) => {
    if (!userProfile || !authUser) return;
    setError(null);

    const sleepDate = new Date(sleepTime);
    const wakeupDate = new Date(wakeupTime);

    if (wakeupDate <= sleepDate) {
      setError('Wake-up time must be after sleep time.');
      return;
    }

    const duration = (wakeupDate.getTime() - sleepDate.getTime()) / (1000 * 60);
    const logData = { sleepTime: sleepDate.toISOString(), wakeupTime: wakeupDate.toISOString(), duration };
    const score = calculateSleepScore(logData, userProfile.sleepGoal);

    const newEntryData = {
      ...logData,
      score,
      timestamp: wakeupDate.toISOString(),
    };

    const newEntry = await dbService.addLog(authUser.uid, 'sleep', newEntryData);
    setSleepLog(prev => [newEntry, ...prev]);
  }, [userProfile, authUser]);



  const handleSignOut = useCallback(async () => {
    try {
      localStorage.removeItem('gemini_api_key');
      setApiKey('');
      await signOutUser();
    } catch (e) {
      setError('Could not sign out. Please try again.');
    }
  }, []);

  const handleChangePassword = useCallback(async (newPassword: string) => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error('Not signed in');

    try {
      await updatePassword(user, newPassword);
      return;
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        const email = user.email;
        if (!email) throw new Error('Please re-login to update password.');
        const currentPassword = window.prompt('To change your password, please re-enter your current password:');
        if (!currentPassword) throw new Error('Reauthentication canceled.');

        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        return;
      }
      throw err;
    }
  }, []);

  // ---------- date helpers & filtered logs (MUST run every render; keep above any early returns) ----------
  // local iso for selectedDate
  const selectedIso = useMemo(() => toLocalISODate(selectedDate), [selectedDate]);
  const dateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  const filterByDate = useCallback((iso: string) => {
    return (timestamp?: string) => {
      if (!timestamp) return false;
      try {
        return toLocalISODate(timestamp) === iso;
      } catch {
        return false;
      }
    };
  }, []);

  // today's visible logs
  const visibleMeals = useMemo(() => mealLog.filter(m => filterByDate(selectedIso)(m.timestamp)), [mealLog, filterByDate, selectedIso]);
  const visibleWorkouts = useMemo(() => workoutLog.filter(w => filterByDate(selectedIso)(w.timestamp)), [workoutLog, filterByDate, selectedIso]);
  const visibleSleep = useMemo(() => sleepLog.filter(s => filterByDate(selectedIso)(s.timestamp)), [sleepLog, filterByDate, selectedIso]);
  const visibleWeight = useMemo(() => weightLog.filter(w => filterByDate(selectedIso)(w.timestamp)), [weightLog, filterByDate, selectedIso]);


  // yesterday's date/is o and its visible logs
  const yesterdayDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return d;
  }, [selectedDate]);

  const yesterdayIso = useMemo(() => toLocalISODate(yesterdayDate), [yesterdayDate]);

  const visibleMealsYesterday = useMemo(() => mealLog.filter(m => filterByDate(yesterdayIso)(m.timestamp)), [mealLog, filterByDate, yesterdayIso]);
  const visibleWorkoutsYesterday = useMemo(() => workoutLog.filter(w => filterByDate(yesterdayIso)(w.timestamp)), [workoutLog, filterByDate, yesterdayIso]);
  const visibleSleepYesterday = useMemo(() => sleepLog.filter(s => filterByDate(yesterdayIso)(s.timestamp)), [sleepLog, filterByDate, yesterdayIso]);
  const visibleWeightYesterday = useMemo(() => weightLog.filter(w => filterByDate(yesterdayIso)(w.timestamp)), [weightLog, filterByDate, yesterdayIso]);

  const aiCoachContextData = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    visibleMeals.forEach(m => {
      const items = Array.isArray((m as any).items) ? (m as any).items : [];
      items.forEach((item: any) => {
        totals.calories += Number(item?.calories ?? 0);
        totals.protein += Number(item?.protein ?? 0);
        totals.carbs += Number(item?.carbs ?? 0);
        totals.fat += Number(item?.fat ?? 0);
      });
    });

    const yesterdayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    visibleMealsYesterday.forEach(m => {
      const items = Array.isArray((m as any).items) ? (m as any).items : [];
      items.forEach((item: any) => {
        yesterdayTotals.calories += Number(item?.calories ?? 0);
        yesterdayTotals.protein += Number(item?.protein ?? 0);
        yesterdayTotals.carbs += Number(item?.carbs ?? 0);
        yesterdayTotals.fat += Number(item?.fat ?? 0);
      });
    });

    const steps = visibleWorkouts.reduce((sum, w) => sum + Number(w.steps ?? 0), 0);
    const sortedWeights = [...weightLog]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(w => ({
        date: toLocalISODate(new Date(w.timestamp)),
        weight: w.weight
      }));

    return {
      caloriesGoal: dailyGoals?.calories ?? 2000,
      caloriesConsumed: Math.round(totals.calories),
      proteinGoal: dailyGoals?.protein ?? 120,
      proteinConsumed: Math.round(totals.protein),
      carbsGoal: dailyGoals?.carbs ?? 200,
      carbsConsumed: Math.round(totals.carbs),
      fatGoal: dailyGoals?.fat ?? 65,
      fatConsumed: Math.round(totals.fat),
      steps,
      weightHistory: sortedWeights,
      yesterday: {
        calories: Math.round(yesterdayTotals.calories),
        protein: Math.round(yesterdayTotals.protein),
        carbs: Math.round(yesterdayTotals.carbs),
        fat: Math.round(yesterdayTotals.fat),
      },
      recentSummaries: userProfile?.dailySummaries || {}
    };
  }, [visibleMeals, visibleMealsYesterday, visibleWorkouts, weightLog, dailyGoals, userProfile?.dailySummaries]);


  const latestSleep = visibleSleep.length > 0 ? [visibleSleep[0]] : [];

  // ---------- rendering gate (safe now — hooks already declared) ----------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!authUser) return <Auth />;

  if (!profileLoaded) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (userHasProfile === false) {
    return <ProfileSetup onSave={handleSaveProfile} />;
  }

  // ---------- helper UI components ----------
  const TabButton: React.FC<{ tabName: Tab }> = ({ tabName }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
          ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
      >
        {tabName}
      </button>
    );
  };

  // ---------- date navigation helpers ----------
  const goPrevDay = () => setSelectedDate(d => {
    const n = new Date(d);
    n.setDate(n.getDate() - 1);
    return n;
  });
  const goNextDay = () => setSelectedDate(d => {
    const n = new Date(d);
    n.setDate(n.getDate() + 1);
    return n;
  });
  const onPickDate = (iso: string) => {
    setSelectedDate(new Date(iso + 'T00:00:00'));
  };

  // ---------- main render ----------
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {isProfileModalOpen && <ProfileSetup onSave={handleSaveProfile} initialProfile={userProfile} onClose={() => setProfileModalOpen(false)} />}

      {isSummaryModalOpen && (
        <SummaryModal
          onClose={() => setSummaryModalOpen(false)}
          userProfile={userProfile!}
          dailyGoals={dailyGoals!}
          // today
          mealLogToday={visibleMeals}
          workoutLogToday={visibleWorkouts}
          sleepLogToday={latestSleep}
          // yesterday
          mealLogYesterday={visibleMealsYesterday}
          workoutLogYesterday={visibleWorkoutsYesterday}
          sleepLogYesterday={visibleSleepYesterday}
          dateLabel={dateLabel}
          selectedIsoDate={selectedIso}
          cachedSummary={userProfile?.dailySummaries?.[selectedIso]}
          onSaveSummary={handleSaveSummary}
        />
      )}

      {isSuggestionModalOpen && <SuggestionModal onClose={() => setSuggestionModalOpen(false)} userProfile={userProfile!} dailyGoals={dailyGoals!} />}

      <Header name={userProfile?.name ?? userProfile?.username ?? 'User'} onEditProfile={() => setProfileModalOpen(true)} onSignOut={handleSignOut} />

      <main className="container mx-auto p-4 md:p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.1 1.1 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {userProfile && !userProfile.geminiApiKey && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg relative mb-6 flex justify-between items-center" role="alert">
            <div>
              <strong className="font-bold">⚠️ Gemini API Key Required: </strong>
              <span className="block sm:inline text-sm md:text-base">Please edit your profile to add your Gemini API Key so the AI features can work.</span>
            </div>
            <button 
              onClick={() => setProfileModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-3 rounded-md text-xs transition duration-200 shrink-0 ml-4"
            >
              Add Key
            </button>
          </div>
        )}

        <GlobalActions
          selectedDate={selectedDate}
          onPickDate={onPickDate}
          onPrevDay={goPrevDay}
          onNextDay={goNextDay}
          onSummarize={() => setSummaryModalOpen(true)}
          onSuggest={() => setSuggestionModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-6">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <div className="flex space-x-2">
                <TabButton tabName="Nutrition" />
                <TabButton tabName="Workout" />
                <TabButton tabName="Sleep" />
                <TabButton tabName="Weight" />
              </div>
            </div>

            {activeTab === 'Nutrition' && (
              <>
                <ConversationalInput onLogMeal={handleLogMeal} isLoading={isLoggingMeal} />
                <MealLogTable meals={visibleMeals} selectedDate={selectedDate} onUpdateMeal={handleUpdateMeal} onDeleteMeal={handleDeleteMeal} />
              </>
            )}

            {activeTab === 'Workout' && (
              <>
                <ConversationalWorkoutInput onLogWorkout={handleLogWorkout} isLoading={isLoggingWorkout} />
                <WorkoutLogTable workouts={visibleWorkouts} selectedDate={selectedDate} onUpdateWorkout={handleUpdateWorkout} onDeleteWorkout={handleDeleteWorkout} />
              </>
            )}

            {activeTab === 'Sleep' && (
              <SleepTracker sleepLog={visibleSleep} onLogSleep={handleLogSleep} onUpdateSleep={handleUpdateSleep} onDeleteSleep={handleDeleteSleep} />
            )}

            {activeTab === 'Weight' && (
              <WeightTracker weightLog={visibleWeight} onLogWeight={handleLogWeight} onDeleteWeight={handleDeleteWeight} />
            )}


          </div>

          <div className="lg:col-span-2 space-y-8">
            <RightPanel
              activeTab={activeTab}
              userProfile={userProfile!}
              dailyGoals={dailyGoals!}
              mealLog={mealLog}
              workoutLog={workoutLog}
              sleepLog={sleepLog}
              weightLog={weightLog}
              selectedDate={selectedDate}
              onChangePassword={handleChangePassword}
              onSaveProfile={handleSaveProfile}
            />
          </div>
        </div>
      </main>
      {userProfile && dailyGoals && (
        <AiCoach userProfile={userProfile} dailyGoals={dailyGoals} contextData={aiCoachContextData} />
      )}
    </div>
  );
};

export default App;
