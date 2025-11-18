// src/components/GlobalActions.tsx
import React from 'react';

interface Props {
  selectedDate: Date;
  onPickDate: (isoDate: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSummarize: () => void;
  onSuggest: () => void;
}

const GlobalActions: React.FC<Props> = ({ selectedDate, onPickDate, onPrevDay, onNextDay, onSummarize, onSuggest }) => {
  const iso = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

  return (
    <div className="bg-white rounded-lg p-3 shadow-md flex flex-col sm:flex-row items-center gap-3">
      {/* Left: compact date controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onPrevDay}
          className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
          aria-label="Previous day"
        >
          ‹
        </button>

        <input
          type="date"
          value={iso}
          onChange={(e) => onPickDate(e.target.value)}
          className="appearance-none border border-slate-200 rounded-md px-3 py-2 bg-white text-sm"
          aria-label="Select date"
        />

        <button
          onClick={onNextDay}
          className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {/* Right: buttons area — stretches and is responsive */}
      <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onSummarize}
          className="flex-1 w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition"
        >
          📝&nbsp;Summarize today
        </button>

        <button
          onClick={onSuggest}
          className="flex-1 w-full inline-flex items-center justify-center px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-sm font-medium transition"
        >
          💡&nbsp;Get Suggestions
        </button>
      </div>
    </div>
  );
};

export default GlobalActions;
