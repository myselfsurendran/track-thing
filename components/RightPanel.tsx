import React, { useMemo } from 'react';
import { MealLogEntry, DailyGoals, UserProfile, WorkoutLogEntry, SleepLogEntry, WaterLogEntry } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProfileDetails from './ProfileDetails';
import CalorieHistoryChart from './CalorieHistoryChart';
import MacroHistoryChart from './MacroHistoryChart';
import SleepScoreHistoryChart from './SleepScoreHistoryChart';
import StepsHistoryChart from './StepsHistoryChart';
import WorkoutFrequencyChart from './WorkoutFrequencyChart';
import WaterHistoryChart from './WaterHistoryChart';

type Tab = 'Nutrition' | 'Workout' | 'Sleep' | 'Water';

interface RightPanelProps {
    activeTab: Tab;
    userProfile: UserProfile;
    dailyGoals: DailyGoals;
    mealLog: MealLogEntry[];
    workoutLog: WorkoutLogEntry[];
    sleepLog: SleepLogEntry[];
    waterLog: WaterLogEntry[];
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
                {current.toFixed(0)}
            </div>
            <div className="text-xs text-slate-500">/ {target.toFixed(0)} {unit}</div>
        </div>
    );
};


const TodaysGoalsCard: React.FC<{summary: any, goals: DailyGoals}> = ({ summary, goals }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-600">Today's Goals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GoalItem icon="🔥" label="Calories" current={summary.calories} target={goals.calories} unit="kcal" />
            <GoalItem icon="💪" label="Protein" current={summary.protein} target={goals.protein} unit="g" />
            <GoalItem icon="⚡️" label="Carbs" current={summary.carbs} target={goals.carbs} unit="g" />
            <GoalItem icon="🥑" label="Fat" current={summary.fat} target={goals.fat} unit="g" />
        </div>
    </div>
);

const RightPanel: React.FC<RightPanelProps> = ({ activeTab, userProfile, dailyGoals, mealLog, workoutLog, sleepLog, waterLog }) => {

    const historyData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          return d;
        }).reverse();

        return last7Days.map(date => {
          const dateStr = date.toLocaleDateString();
          const dayMeals = mealLog.filter(meal => new Date(meal.timestamp).toLocaleDateString() === dateStr);
          const dayWorkouts = workoutLog.filter(w => new Date(w.timestamp).toLocaleDateString() === dateStr);
          const daySleep = sleepLog.find(s => new Date(s.timestamp).toLocaleDateString() === dateStr);
          const dayWater = waterLog.filter(w => new Date(w.timestamp).toLocaleDateString() === dateStr);

          const mealSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };
          dayMeals.forEach(meal => {
            meal.items.forEach(item => {
              mealSummary.calories += item.calories;
              mealSummary.protein += item.protein;
              mealSummary.carbs += item.carbs;
              mealSummary.fat += item.fat;
            });
          });
          
          const totalSteps = dayWorkouts.reduce((sum, w) => sum + (w.steps || 0), 0);
          const totalWater = dayWater.reduce((sum, w) => sum + w.amount, 0);
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
            ...mealSummary,
            sleepScore: daySleep?.score,
            steps: totalSteps,
            water: totalWater,
            ...dayWorkouts.reduce((acc, w) => ({...acc, [w.workoutType]: (acc[w.workoutType] || 0) + 1 }), {} as Record<string, number>)
          };
        });
    }, [mealLog, workoutLog, sleepLog, waterLog]);

    const todaysSummary = useMemo(() => {
        const todaysDateStr = new Date().toLocaleDateString();
        const todaysMeals = mealLog.filter(m => new Date(m.timestamp).toLocaleDateString() === todaysDateStr);
        const todaysWater = waterLog.filter(w => new Date(w.timestamp).toLocaleDateString() === todaysDateStr);

        const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
        todaysMeals.flatMap(m => m.items).forEach(item => {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fat += item.fat;
        });
        totals.water = todaysWater.reduce((sum, w) => sum + w.amount, 0);
        return totals;
    }, [mealLog, waterLog]);

    const macroData = useMemo(() => {
        const { protein, carbs, fat } = todaysSummary;
        const totalMacros = protein + carbs + fat;
        if (totalMacros === 0) return [];
        
        return [
        { name: 'Protein', value: protein },
        { name: 'Carbs', value: carbs },
        { name: 'Fat', value: fat },
        ];
    }, [todaysSummary]);

    const nutritionContent = (
        <>
            <TodaysGoalsCard summary={todaysSummary} goals={dailyGoals} />
            <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-indigo-600">Macronutrient Distribution</h3>
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
                ) : ( <p className="text-slate-500 text-center py-12">Log a meal today to see your macro breakdown.</p> )}
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
                <SleepScoreHistoryChart data={historyData.map(d => ({date: d.date, score: d.sleepScore || 0}))} />
            </div>
        </>
    );
    
    const waterContent = (
         <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-indigo-600">Today's Hydration</h3>
                <div className="grid grid-cols-1">
                    <GoalItem icon="💧" label="Water" current={todaysSummary.water} target={dailyGoals.water} unit="ml" />
                </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-indigo-600">Water Intake History (7 Days)</h3>
                <WaterHistoryChart data={historyData.map(d => ({date: d.date, water: d.water || 0}))} goal={dailyGoals.water} />
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            <ProfileDetails profile={userProfile} />
            {activeTab === 'Nutrition' && nutritionContent}
            {activeTab === 'Workout' && workoutContent}
            {activeTab === 'Sleep' && sleepContent}
            {activeTab === 'Water' && waterContent}
        </div>
    );
};

export default RightPanel;