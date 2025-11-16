import React from 'react';

interface GlobalActionsProps {
    onSummarize: () => void;
    onSuggest: () => void;
}

const GlobalActions: React.FC<GlobalActionsProps> = ({ onSummarize, onSuggest }) => {
    return (
        <div className="bg-white rounded-lg p-4 shadow-md flex flex-col sm:flex-row gap-4">
            <button
                onClick={onSummarize}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Summarize Today
            </button>
            <button
                onClick={onSuggest}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 3v1a1 1 0 11-2 0V3a1 1 0 112 0z" />
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.982 4.982 0 00-1.83.903A1 1 0 108.26 7.26c.294-.17.616-.29.94-.358V8a1 1 0 102 0V6.902c.324.068.646.188.94.358a1 1 0 101.08-1.668 4.982 4.982 0 00-1.83-.903V5z" clipRule="evenodd" />
                </svg>
                Get Suggestion
            </button>
        </div>
    );
}

export default GlobalActions;