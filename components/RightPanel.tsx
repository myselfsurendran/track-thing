// src/components/RightPanel.tsx
import React, { useMemo, useState } from 'react';
import { MealLogEntry, DailyGoals, UserProfile, WorkoutLogEntry, SleepLogEntry, WeightLogEntry } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProfileDetails from './ProfileDetails';
import { getGoalSuggestions } from '../services/geminiService';
import CalorieHistoryChart from './CalorieHistoryChart';
import MacroHistoryChart from './MacroHistoryChart';
import SleepScoreHistoryChart from './SleepScoreHistoryChart';
import StepsHistoryChart from './StepsHistoryChart';
import WorkoutFrequencyChart from './WorkoutFrequencyChart';
import WeightHistoryChart from './WeightHistoryChart';
import { toLocalISODate } from '../utils/dateHelpers';

type Tab = 'Nutrition' | 'Workout' | 'Sleep' | 'Weight';

interface RightPanelProps {
  activeTab: Tab;
  userProfile: UserProfile;
  dailyGoals: DailyGoals;
  mealLog: MealLogEntry[];
  workoutLog: WorkoutLogEntry[];
  sleepLog: SleepLogEntry[];
  weightLog: WeightLogEntry[];
  selectedDate?: Date;
  onChangePassword?: (newPassword: string) => Promise<void>;
  onSaveProfile?: (profile: UserProfile) => Promise<void>;
}

const COLORS = {
  protein: '#38bdf8', // sky-400
  carbs: '#fcd34d', // amber-300
  fat: '#fda4af', // rose-300
};

const GoalItem: React.FC<{ icon: string; label: string; current: number; target: number; unit: string; }> = ({ icon, label, current, target, unit }) => {
  const isOver = current > target;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className={`text-lg font-bold ${isOver ? 'text-rose-500' : 'text-slate-800'}`}>
        {Number.isFinite(current) ? current.toFixed(0) : 0}
      </div>
      <div className="text-xs text-slate-500">/ {Number.isFinite(target) ? target.toFixed(0) : 0} {unit}</div>
    </div>
  );
};

const TodaysGoalsCard: React.FC<{ summary: any, goals: DailyGoals, dateLabel: string, onEdit?: () => void }> = ({ summary, goals, dateLabel, onEdit }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-indigo-600">Goals — {dateLabel}</h3>
      {onEdit && (
        <button 
          onClick={onEdit}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition duration-150"
        >
          Edit Goals
        </button>
      )}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <GoalItem icon="🔥" label="Calories" current={summary.calories} target={goals.calories} unit="kcal" />
      <GoalItem icon="💪" label="Protein" current={summary.protein} target={goals.protein} unit="g" />
      <GoalItem icon="⚡️" label="Carbs" current={summary.carbs} target={goals.carbs} unit="g" />
      <GoalItem icon="🥑" label="Fat" current={summary.fat} target={goals.fat} unit="g" />
    </div>
  </div>
);

const RightPanel: React.FC<RightPanelProps> = ({ 
  activeTab, 
  userProfile, 
  dailyGoals, 
  mealLog, 
  workoutLog, 
  sleepLog, 
  weightLog, 
  selectedDate, 
  onSaveProfile 
}) => {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<DailyGoals | null>(null);
  const [suggestionExplanation, setSuggestionExplanation] = useState('');
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedGoals, setEditedGoals] = useState<DailyGoals | null>(null);

  const startEditingGoals = () => {
    setEditedGoals({ ...dailyGoals });
    setIsEditingGoals(true);
  };

  const handleSaveEditedGoals = async () => {
    if (!editedGoals || !onSaveProfile) return;
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        customGoals: editedGoals
      };
      await onSaveProfile(updatedProfile);
      setIsEditingGoals(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskGemini = async () => {
    setLoadingSuggestions(true);
    setSuggestionError(null);
    setSuggestedGoals(null);
    try {
      const profileWithCalculatedMetrics = {
        ...userProfile,
        bfp: userProfile.bfp ?? 0,
      };
      if (typeof profileWithCalculatedMetrics.smm !== 'number' && typeof profileWithCalculatedMetrics.bfp === 'number' && profileWithCalculatedMetrics.weight) {
        const lbm = profileWithCalculatedMetrics.weight * (1 - profileWithCalculatedMetrics.bfp / 100);
        profileWithCalculatedMetrics.smm = profileWithCalculatedMetrics.gender === 'Male' ? lbm * 0.57 : lbm * 0.47;
      }
      
      const result = await getGoalSuggestions(profileWithCalculatedMetrics);
      setSuggestedGoals(result.goals);
      setSuggestionExplanation(result.explanation);
    } catch (err: any) {
      console.error(err);
      setSuggestionError(err?.message || "Failed to get recommendations from Gemini.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSaveSuggestedGoals = async () => {
    if (!suggestedGoals || !onSaveProfile) return;
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        customGoals: suggestedGoals
      };
      await onSaveProfile(updatedProfile);
      setSuggestedGoals(null);
      setSuggestionExplanation('');
    } catch (err) {
      console.error(err);
      setSuggestionError("Failed to save goals.");
    }
  };
  const safeMealLog = Array.isArray(mealLog) ? mealLog : [];
  const safeWorkoutLog = Array.isArray(workoutLog) ? workoutLog : [];
  const safeSleepLog = Array.isArray(sleepLog) ? sleepLog : [];
  const safeWeightLog = Array.isArray(weightLog) ? weightLog : [];

  const refDate = selectedDate ? new Date(selectedDate) : new Date();
  const dateLabel = refDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const historyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(refDate);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(date => {
      const dateIso = toLocalISODate(date);

      const dayMeals = safeMealLog.filter(meal => toLocalISODate(meal.timestamp) === dateIso);
      const dayWorkouts = safeWorkoutLog.filter(w => toLocalISODate(w.timestamp) === dateIso);
      const daySleep = safeSleepLog.find(s => toLocalISODate(s.timestamp) === dateIso);

      const pastWeights = safeWeightLog
        .filter(w => toLocalISODate(w.timestamp) <= dateIso)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const weightAtDate = pastWeights.length > 0 ? pastWeights[0].weight : (userProfile.weight ?? 0);

      const mealSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      dayMeals.forEach(meal => {
        const items = Array.isArray((meal as any).items) ? (meal as any).items : [];
        items.forEach((item: any) => {
          mealSummary.calories += Number(item?.calories ?? 0);
          mealSummary.protein += Number(item?.protein ?? 0);
          mealSummary.carbs += Number(item?.carbs ?? 0);
          mealSummary.fat += Number(item?.fat ?? 0);
        });
      });

      const totalSteps = dayWorkouts.reduce((sum, w) => sum + Number(w.steps ?? 0), 0);

      const workoutsAgg = dayWorkouts.reduce((acc: Record<string, number>, w) => {
        const key = w.workoutType || 'Other';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: mealSummary.calories,
        protein: mealSummary.protein,
        carbs: mealSummary.carbs,
        fat: mealSummary.fat,
        sleepScore: daySleep?.score ?? daySleep?.sleepScore ?? 0,
        steps: totalSteps,
        weight: weightAtDate,
        ...workoutsAgg,
      };
    });
  }, [safeMealLog, safeWorkoutLog, safeSleepLog, safeWeightLog, userProfile.weight, refDate]);

  const todaysSummary = useMemo(() => {
    const dateIso = toLocalISODate(refDate);
    const todaysMeals = safeMealLog.filter(m => toLocalISODate(m.timestamp) === dateIso);

    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todaysMeals.forEach(m => {
      const items = Array.isArray((m as any).items) ? (m as any).items : [];
      items.forEach((item: any) => {
        totals.calories += Number(item?.calories ?? 0);
        totals.protein += Number(item?.protein ?? 0);
        totals.carbs += Number(item?.carbs ?? 0);
        totals.fat += Number(item?.fat ?? 0);
      });
    });

    return totals;
  }, [safeMealLog, refDate]);

  const macroData = useMemo(() => {
    const protein = Number(todaysSummary?.protein ?? 0);
    const carbs = Number(todaysSummary?.carbs ?? 0);
    const fat = Number(todaysSummary?.fat ?? 0);
    const total = protein + carbs + fat;
    if (total <= 0) return [];
    return [
      { name: 'Protein', value: protein },
      { name: 'Carbs', value: carbs },
      { name: 'Fat', value: fat },
    ];
  }, [todaysSummary]);

  const editGoalsUI = (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-indigo-600 font-medium">Edit Daily Goals</h3>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">Manual Override</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Calories (kcal)</label>
          <input
            type="number"
            value={editedGoals?.calories ?? ''}
            onChange={(e) => setEditedGoals(prev => prev ? { ...prev, calories: parseInt(e.target.value) || 0 } : null)}
            className="w-full p-2 border rounded-md text-sm bg-slate-50 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Protein (g)</label>
          <input
            type="number"
            value={editedGoals?.protein ?? ''}
            onChange={(e) => setEditedGoals(prev => prev ? { ...prev, protein: parseInt(e.target.value) || 0 } : null)}
            className="w-full p-2 border rounded-md text-sm bg-slate-50 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Carbs (g)</label>
          <input
            type="number"
            value={editedGoals?.carbs ?? ''}
            onChange={(e) => setEditedGoals(prev => prev ? { ...prev, carbs: parseInt(e.target.value) || 0 } : null)}
            className="w-full p-2 border rounded-md text-sm bg-slate-50 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fat (g)</label>
          <input
            type="number"
            value={editedGoals?.fat ?? ''}
            onChange={(e) => setEditedGoals(prev => prev ? { ...prev, fat: parseInt(e.target.value) || 0 } : null)}
            className="w-full p-2 border rounded-md text-sm bg-slate-50 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => setIsEditingGoals(false)}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition duration-150"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveEditedGoals}
          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition duration-150"
        >
          Save Goals
        </button>
      </div>
    </div>
  );

  const nutritionContent = (
    <>
      {isEditingGoals ? editGoalsUI : (
        <TodaysGoalsCard 
          summary={todaysSummary} 
          goals={dailyGoals} 
          dateLabel={dateLabel} 
          onEdit={onSaveProfile ? startEditingGoals : undefined} 
        />
      )}

      {/* Gemini Goal Recommendation Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-5 shadow-sm relative overflow-hidden mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">AI Goal Recommendations</h4>
              <p className="text-[10px] text-slate-500">Get customized daily targets based on your body composition</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {onSaveProfile && (
              <button
                onClick={handleAskGemini}
                disabled={loadingSuggestions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-3 rounded-md text-[11px] transition duration-200 disabled:bg-indigo-400 flex items-center space-x-1.5"
              >
                {loadingSuggestions ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Ask Gemini</span>
                )}
              </button>
            )}
          </div>
        </div>

        {suggestionError && (
          <div className="bg-red-50 text-red-700 p-2.5 rounded-md text-xs mb-3 border border-red-100">
            {suggestionError}
          </div>
        )}

        {suggestedGoals && (
          <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm space-y-3">
            <div>
              <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">Suggested Targets</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Calories</div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">{suggestedGoals.calories} kcal</div>
                  <div className="text-[9px] text-slate-400">({dailyGoals.calories} cur)</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Protein</div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">{suggestedGoals.protein} g</div>
                  <div className="text-[9px] text-slate-400">({dailyGoals.protein} g cur)</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Carbs</div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">{suggestedGoals.carbs} g</div>
                  <div className="text-[9px] text-slate-400">({dailyGoals.carbs} g cur)</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-[10px] text-slate-500">Fat</div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">{suggestedGoals.fat} g</div>
                  <div className="text-[9px] text-slate-400">({dailyGoals.fat} g cur)</div>
                </div>
              </div>
            </div>

            {suggestionExplanation && (
              <div className="text-xs text-slate-600 italic bg-indigo-50/50 p-2 rounded border border-indigo-50">
                "{suggestionExplanation}"
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setSuggestedGoals(null); setSuggestionExplanation(''); }}
                className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition duration-150"
              >
                Discard
              </button>
              <button
                onClick={handleSaveSuggestedGoals}
                className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition duration-150"
              >
                Approve & Save Goals
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Macronutrient Distribution ({dateLabel})</h3>
        {macroData.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell key={`cell-protein`} fill={COLORS.protein} />
                  <Cell key={`cell-carbs`} fill={COLORS.carbs} />
                  <Cell key={`cell-fat`} fill={COLORS.fat} />
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0', borderRadius: '0.5rem' }} formatter={(value: number, name) => [`${value.toFixed(1)}g`, name]} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (<p className="text-slate-500 text-center py-12">Log a meal on this date to see your macro breakdown.</p>)}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Calorie History (7 Days)</h3>
        <CalorieHistoryChart data={historyData} />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Macro History (7 Days)</h3>
        <MacroHistoryChart data={historyData} />
      </div>
    </>
  );

  const workoutContent = (
    <>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Step History (7 Days)</h3>
        <StepsHistoryChart data={historyData} />
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Workout Frequency (7 Days)</h3>
        <WorkoutFrequencyChart data={historyData} />
      </div>
    </>
  );

  const sleepContent = (
    <>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Sleep Score History (7 Days)</h3>
        <SleepScoreHistoryChart data={historyData.map(d => ({ date: d.date, score: d.sleepScore || 0 }))} />
      </div>
    </>
  );

  const weightContent = (
    <>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Weight History (7 Days)</h3>
        <WeightHistoryChart data={historyData.map(d => ({ date: d.date, weight: d.weight }))} />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <ProfileDetails profile={userProfile} />
      {activeTab === 'Nutrition' && nutritionContent}
      {activeTab === 'Workout' && workoutContent}
      {activeTab === 'Sleep' && sleepContent}
      {activeTab === 'Weight' && weightContent}
    </div>
  );
};

export default RightPanel;
