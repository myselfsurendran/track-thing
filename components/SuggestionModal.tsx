import React, { useState, useCallback } from 'react';
import { UserProfile, DailyGoals } from '../types';
import { getMealSuggestions, getWorkoutSuggestions } from '../services/geminiService';

interface SuggestionModalProps {
    onClose: () => void;
    userProfile: UserProfile;
    dailyGoals: DailyGoals;
}

type SuggestionType = 'food' | 'workout' | null;

const SuggestionModal: React.FC<SuggestionModalProps> = ({ onClose, userProfile, dailyGoals }) => {
    const [suggestionType, setSuggestionType] = useState<SuggestionType>(null);
    const [query, setQuery] = useState('');
    const [suggestion, setSuggestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestion = useCallback(async () => {
        if (!query.trim() || !suggestionType) return;
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            let result;
            if (suggestionType === 'food') {
                result = await getMealSuggestions(query, userProfile, dailyGoals);
            } else {
                const workoutJson = await getWorkoutSuggestions(query, userProfile);
                result = JSON.parse(workoutJson);
            }
            setSuggestion(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [query, suggestionType, userProfile, dailyGoals]);
    
    const reset = () => {
        setSuggestionType(null);
        setQuery('');
        setSuggestion(null);
        setError(null);
    }
    
    const formatMealSuggestionToHtml = (text: string) => {
      return text.replace(/### (.*)/g, '<h3 class="text-slate-800 mt-4 mb-2 text-lg font-semibold">$1</h3>')
                 .replace(/(\* |- ) (.*)/g, '<li class="ml-4">$2</li>')
                 .replace(/(\n)/g, '<br />');
    };

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="flex justify-center items-center py-16">
                     <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )
        }
        
        if (error) {
             return <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>
        }
        
        if(suggestion) {
            return (
                <div>
                    {suggestionType === 'food' && (
                        <div 
                          className="prose max-w-none prose-p:text-slate-600 prose-headings:text-slate-800"
                          dangerouslySetInnerHTML={{ __html: formatMealSuggestionToHtml(suggestion) }} 
                        />
                    )}
                    {suggestionType === 'workout' && (
                       <div>
                           <h3 className="text-xl font-bold text-sky-600">{suggestion.workoutTitle}</h3>
                           <p className="text-slate-500 mt-1 mb-4">{suggestion.description}</p>
                           <ul className="space-y-3">
                               {suggestion.exercises.map((ex: any, index: number) => (
                                   <li key={index} className="p-3 bg-slate-100 rounded-lg">
                                       <div className="font-semibold text-slate-800">{ex.name}</div>
                                       <div className="text-sm text-slate-600">{ex.sets} sets of {ex.reps} reps</div>
                                       {ex.notes && <div className="text-xs text-slate-500 mt-1">Note: {ex.notes}</div>}
                                   </li>
                               ))}
                           </ul>
                       </div>
                    )}
                    <button onClick={reset} className="mt-6 w-full bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                      Ask Again
                    </button>
                </div>
            )
        }

        if (suggestionType) {
            return (
                <form onSubmit={(e) => { e.preventDefault(); handleGetSuggestion(); }} className="space-y-4">
                    <p className="text-slate-600">What kind of {suggestionType} suggestion are you looking for?</p>
                     <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={suggestionType === 'food' ? "e.g., a high-protein breakfast" : "e.g., a chest workout at home"}
                        className="w-full h-24 p-3 bg-slate-100 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 resize-none placeholder-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-md transition duration-200"
                    >
                        Get Suggestion
                    </button>
                     <button type="button" onClick={reset} className="w-full text-center text-slate-500 hover:text-slate-800 text-sm mt-2">Back</button>
                </form>
            )
        }

        return (
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setSuggestionType('food')} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-md transition duration-200">Food Suggestion</button>
                <button onClick={() => setSuggestionType('workout')} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-md transition duration-200">Workout Suggestion</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-3xl font-bold text-indigo-600 mb-4">AI Suggestions</h2>
                {renderContent()}
            </div>
        </div>
    );
};

export default SuggestionModal;