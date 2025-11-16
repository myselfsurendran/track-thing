import React, { useState } from 'react';

interface ConversationalInputProps {
  onLogMeal: (text: string) => void;
  isLoading: boolean;
}

const ConversationalInput: React.FC<ConversationalInputProps> = ({ onLogMeal, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onLogMeal(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600">Log a Meal</h2>
      <p className="text-slate-600 mb-4 text-sm">Describe what you ate in plain English. For example: "For lunch I had a chicken salad and an apple".</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g., I had 2 chapathis for dinner with egg curry..."
          className="w-full h-24 p-3 bg-slate-100 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 resize-none placeholder-slate-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Log Meal'}
        </button>
      </form>
    </div>
  );
};

export default ConversationalInput;