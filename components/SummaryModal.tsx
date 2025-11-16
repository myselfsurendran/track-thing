import React, { useState, useEffect } from 'react';
import { UserProfile, DailyGoals, MealLogEntry, WorkoutLogEntry, SleepLogEntry } from '../types';
import { getDailySummary } from '../services/geminiService';

interface SummaryModalProps {
    onClose: () => void;
    userProfile: UserProfile;
    dailyGoals: DailyGoals;
    mealLog: MealLogEntry[];
    workoutLog: WorkoutLogEntry[];
    sleepLog: SleepLogEntry[];
}

// Simple markdown to HTML converter for better suggestion formatting
const formatToHtml = (text: string) => {
    return text
      .replace(/### (.*)/g, '<h3 class="text-slate-800 mt-4 mb-2 text-lg font-semibold">$1</h3>')
      .replace(/✅/g, '<span class="mr-2 text-emerald-500">✅</span>')
      .replace(/🤔/g, '<span class="mr-2 text-amber-500">🤔</span>')
      .replace(/🚀/g, '<span class="mr-2 text-sky-500">🚀</span>')
      .replace(/\n/g, '<br />');
};

const SummaryModal: React.FC<SummaryModalProps> = ({ onClose, userProfile, dailyGoals, mealLog, workoutLog, sleepLog }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            setError('');
            try {
                const result = await getDailySummary(userProfile, mealLog, workoutLog, sleepLog, dailyGoals);
                setSummary(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not fetch summary.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, [userProfile, dailyGoals, mealLog, workoutLog, sleepLog]);

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8 overflow-y-auto max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-3xl font-bold text-indigo-600 mb-4">Your Daily Report</h2>

                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                         <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
                {!isLoading && !error && (
                    <div 
                        className="prose max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-800"
                        dangerouslySetInnerHTML={{ __html: formatToHtml(summary) }} 
                    />
                )}
            </div>
        </div>
    );
};

export default SummaryModal;