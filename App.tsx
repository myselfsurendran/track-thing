// App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ConversationalInput from './components/ConversationalInput';
import MealLogTable from './components/MealLogTable';
import ProfileSetup from './components/ProfileSetup';
import { MealLogEntry, UserProfile, DailyGoals, WorkoutLogEntry, SleepLogEntry, WaterLogEntry } from './types';
import { parseMealFromText, parseWorkoutFromText } from './services/geminiService';
import { calculateDailyGoals, calculateSleepScore } from './utils/calculations';
import ConversationalWorkoutInput from './components/ConversationalWorkoutInput';
import WorkoutLogTable from './components/WorkoutLogTable';
import SleepTracker from './components/SleepTracker';
import RightPanel from './components/RightPanel';
import GlobalActions from './components/GlobalActions';
import SummaryModal from './components/SummaryModal';
import SuggestionModal from './components/SuggestionModal';
import WaterTracker from './components/WaterTracker';
import { auth, signOutUser } from './services/firebase';
import { onAuthStateChanged, User, getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as dbService from './services/dbService';
import Auth from './components/Auth';

type Tab = 'Nutrition' | 'Workout' | 'Sleep' | 'Water';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);
  const [workoutLog, setWorkoutLog] = useState<WorkoutLogEntry[]>([]);
  const [sleepLog, setSleepLog] = useState<SleepLogEntry[]>([]);
  const [waterLog, setWaterLog] = useState<WaterLogEntry[]>([]);
  
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Nutrition');

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);


  const dailyGoals = useMemo<DailyGoals | null>(() => {
    if (!userProfile) return null;
    return calculateDailyGoals(userProfile);
  }, [userProfile]);
  
  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        setIsLoading(true);
        try {
          const profile = await dbService.getProfile(user.uid);
          setUserProfile(profile);
          if (profile) {
              const [meals, workouts, sleep, water] = await Promise.all([
                dbService.getLogs<MealLogEntry>(user.uid, 'meals'),
                dbService.getLogs<WorkoutLogEntry>(user.uid, 'workouts'),
                dbService.getLogs<SleepLogEntry>(user.uid, 'sleep'),
                dbService.getLogs<WaterLogEntry>(user.uid, 'water'),
              ]);
              setMealLog(meals);
              setWorkoutLog(workouts);
              setSleepLog(sleep);
              setWaterLog(water);
          }
        } catch(e) {
            console.error("Error loading user data", e);
            setError("Could not load your data from the cloud.");
        } finally {
            setIsLoading(false);
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
        setMealLog([]);
        setWorkoutLog([]);
        setSleepLog([]);
        setWaterLog([]);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleUpdateMeal = async (updatedMeal: MealLogEntry) => {
      if (!authUser) return;
      await dbService.updateLog(authUser.uid, 'meals', updatedMeal.id, updatedMeal);
      setMealLog(mealLog.map(m => m.id === updatedMeal.id ? updatedMeal : m));
  };
  const handleDeleteMeal = async (id: string) => {
    if (!authUser) return;
    if (window.confirm("Are you sure you want to delete this entry?")) {
        await dbService.deleteLog(authUser.uid, 'meals', id);
        setMealLog(mealLog.filter(m => m.id !== id));
    }
  };
  
  const handleUpdateWorkout = async (updatedWorkout: WorkoutLogEntry) => {
      if (!authUser) return;
      await dbService.updateLog(authUser.uid, 'workouts', updatedWorkout.id, updatedWorkout);
      setWorkoutLog(workoutLog.map(w => w.id === updatedWorkout.id ? updatedWorkout : w));
  };
  const handleDeleteWorkout = async (id: string) => {
    if (!authUser) return;
    if (window.confirm("Are you sure you want to delete this entry?")) {
        await dbService.deleteLog(authUser.uid, 'workouts', id);
        setWorkoutLog(workoutLog.filter(w => w.id !== id));
    }
  };

  const handleUpdateSleep = async (updatedSleep: SleepLogEntry) => {
       if (!authUser) return;
       await dbService.updateLog(authUser.uid, 'sleep', updatedSleep.id, updatedSleep);
       setSleepLog(sleepLog.map(s => s.id === updatedSleep.id ? updatedSleep : s));
  };
  const handleDeleteSleep = async (id: string) => {
    if (!authUser) return;
    if (window.confirm("Are you sure you want to delete this entry?")) {
        await dbService.deleteLog(authUser.uid, 'sleep', id);
        setSleepLog(sleepLog.filter(s => s.id !== id));
    }
  };
  
  const handleUpdateWater = async (updatedWater: WaterLogEntry) => {
      if (!authUser) return;
      await dbService.updateLog(authUser.uid, 'water', updatedWater.id, updatedWater);
      setWaterLog(waterLog.map(w => w.id === updatedWater.id ? updatedWater : w));
  };
  const handleDeleteWater = async (id: string) => {
    if (!authUser) return;
    if (window.confirm("Are you sure you want to delete this entry?")) {
        await dbService.deleteLog(authUser.uid, 'water', id);
        setWaterLog(waterLog.filter(w => w.id !== id));
    }
  };
  

  const handleSaveProfile = async (profile: UserProfile) => {
    if (!authUser) return;
    try {
      const profileToSave = { ...profile, id: authUser.uid };
      await dbService.saveProfile(authUser.uid, profileToSave);
      setUserProfile(profileToSave);
      setProfileModalOpen(false);
    } catch (e) {
      console.error("Failed to save profile", e);
      setError("Could not save your profile. Please try again.");
    }
  };

  const handleLogMeal = useCallback(async (text: string) => {
    if (!authUser) return;
    setIsLoggingMeal(true);
    setError(null);
    try {
      const parsedData = await parseMealFromText(text);
      const newEntryData = {
        ...parsedData,
        timestamp: new Date().toISOString(),
      };
      const newEntry = await dbService.addLog(authUser.uid, 'meals', newEntryData);
      setMealLog(prevLog => [newEntry, ...prevLog]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoggingMeal(false);
    }
  }, [authUser]);
  
  const handleLogWorkout = useCallback(async (text: string, steps: number) => {
    if (!authUser) return;
    setIsLoggingWorkout(true);
    setError(null);
    try {
        const parsedData = await parseWorkoutFromText(text);
        const newEntryData = {
            ...parsedData,
            steps: steps > 0 ? steps : undefined,
            timestamp: new Date().toISOString(),
        };
        const newEntry = await dbService.addLog(authUser.uid, 'workouts', newEntryData);
        setWorkoutLog(prevLog => [newEntry, ...prevLog]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoggingWorkout(false);
    }
  }, [authUser]);

  const handleLogSleep = useCallback(async (sleepTime: string, wakeupTime: string) => {
    if (!userProfile || !authUser) return;
    setError(null);

    const sleepDate = new Date(sleepTime);
    const wakeupDate = new Date(wakeupTime);

    if (wakeupDate <= sleepDate) {
        setError("Wake-up time must be after sleep time.");
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
    setSleepLog(prevLog => [newEntry, ...prevLog]);

  }, [userProfile, authUser]);

  const handleLogWater = useCallback(async (amount: number) => {
    if (amount <= 0 || !authUser) return;
    const newEntryData = {
        amount,
        timestamp: new Date().toISOString(),
    };
    const newEntry = await dbService.addLog(authUser.uid, 'water', newEntryData);
    setWaterLog(prevLog => [newEntry, ...prevLog]);
  }, [authUser]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      setError("Could not sign out. Please try again.");
    }
  };

  // --- NEW: Change password handler (tries updatePassword, falls back to reauth prompt) ---
  const handleChangePassword = useCallback(async (newPassword: string) => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error('Not signed in');

    try {
      await updatePassword(user, newPassword);
      return;
    } catch (err: any) {
      // If recent login required, ask user for current password to reauthenticate.
      if (err?.code === 'auth/requires-recent-login') {
        const email = user.email;
        if (!email) throw new Error('Please re-login to update password.');
        const currentPassword = window.prompt('To change your password, please re-enter your current password:');
        if (!currentPassword) throw new Error('Reauthentication canceled.');

        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        // Retry update
        await updatePassword(user, newPassword);
        return;
      }
      throw err;
    }
  }, []);

  if (isAuthLoading || (authUser && isLoading)) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }
  
  if (!authUser) {
    return <Auth />;
  }

  if (!userProfile || !dailyGoals) {
    return <ProfileSetup onSave={handleSaveProfile} />;
  }

  const TabButton: React.FC<{tabName: Tab}> = ({ tabName }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
          ${isActive 
            ? 'bg-indigo-600 text-white' 
            : 'text-slate-600 hover:bg-slate-200'
          }`}
      >
        {tabName}
      </button>
    );
  };

  const todaysDateStr = new Date().toLocaleDateString();
  const todaysMeals = mealLog.filter(m => new Date(m.timestamp).toLocaleDateString() === todaysDateStr);
  const todaysWorkouts = workoutLog.filter(w => new Date(w.timestamp).toLocaleDateString() === todaysDateStr);
  const latestSleep = sleepLog.length > 0 ? [sleepLog[0]] : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {isProfileModalOpen && <ProfileSetup onSave={handleSaveProfile} initialProfile={userProfile} onClose={() => setProfileModalOpen(false)} />}
      {isSummaryModalOpen && <SummaryModal onClose={() => setSummaryModalOpen(false)} userProfile={userProfile} dailyGoals={dailyGoals} mealLog={todaysMeals} workoutLog={todaysWorkouts} sleepLog={latestSleep} />}
      {isSuggestionModalOpen && <SuggestionModal onClose={() => setSuggestionModalOpen(false)} userProfile={userProfile} dailyGoals={dailyGoals} />}
      
      <Header name={userProfile.name} onEditProfile={() => setProfileModalOpen(true)} onSignOut={handleSignOut} />
      
      <main className="container mx-auto p-4 md:p-8">
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                    <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </button>
            </div>
        )}
        
        <GlobalActions onSummarize={() => setSummaryModalOpen(true)} onSuggest={() => setSuggestionModalOpen(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-6">
          <div className="lg:col-span-3 space-y-8">
             <div className="bg-white rounded-lg p-2 shadow-md">
                <div className="flex space-x-2">
                    <TabButton tabName="Nutrition" />
                    <TabButton tabName="Workout" />
                    <TabButton tabName="Sleep" />
                    <TabButton tabName="Water" />
                </div>
            </div>

            {activeTab === 'Nutrition' && (
              <>
                <ConversationalInput onLogMeal={handleLogMeal} isLoading={isLoggingMeal} />
                <MealLogTable meals={mealLog} onUpdateMeal={handleUpdateMeal} onDeleteMeal={handleDeleteMeal}/>
              </>
            )}

            {activeTab === 'Workout' && (
              <>
                <ConversationalWorkoutInput onLogWorkout={handleLogWorkout} isLoading={isLoggingWorkout} />
                <WorkoutLogTable workouts={workoutLog} onUpdateWorkout={handleUpdateWorkout} onDeleteWorkout={handleDeleteWorkout}/>
              </>
            )}

             {activeTab === 'Sleep' && (
              <SleepTracker sleepLog={sleepLog} onLogSleep={handleLogSleep} onUpdateSleep={handleUpdateSleep} onDeleteSleep={handleDeleteSleep}/>
            )}

            {activeTab === 'Water' && (
              <WaterTracker waterLog={waterLog} onLogWater={handleLogWater} onUpdateWater={handleUpdateWater} onDeleteWater={handleDeleteWater} />
            )}
            
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <RightPanel
                activeTab={activeTab}
                userProfile={userProfile}
                dailyGoals={dailyGoals}
                mealLog={mealLog}
                workoutLog={workoutLog}
                sleepLog={sleepLog}
                waterLog={waterLog}
                onChangePassword={handleChangePassword}
                onSaveProfile={handleSaveProfile}  // <-- added
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
