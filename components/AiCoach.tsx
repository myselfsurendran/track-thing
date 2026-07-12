import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DailyGoals } from '../types';
import { getChatbotResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AiCoachProps {
  userProfile: UserProfile;
  dailyGoals: DailyGoals;
  contextData: {
    caloriesGoal: number;
    caloriesConsumed: number;
    proteinGoal: number;
    proteinConsumed: number;
    carbsGoal: number;
    carbsConsumed: number;
    fatGoal: number;
    fatConsumed: number;
    steps: number;
    weightHistory: { date: string; weight: number }[];
  };
}

const AiCoach: React.FC<AiCoachProps> = ({ userProfile, dailyGoals, contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello ${userProfile.name ?? 'there'}! 👋 I am your AI Wellness Coach. How can I help you reach your goals today?`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Map message history into Gemini content format
      // Skip the first greeting message from system
      const history = messages
        .slice(1)
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const reply = await getChatbotResponse(userMessage, history, userProfile, contextData);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an issue. Please check your Gemini API key in Profile Details.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full flex items-center justify-center shadow-lg text-white text-2xl hover:scale-105 transition-transform active:scale-95 focus:outline-none pulse-button"
        title="Chat with AI Coach"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-500 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Coach</h3>
                <p className="text-[10px] text-indigo-100">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-indigo-100 text-lg font-bold px-2 focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 rounded-2xl rounded-bl-none border border-slate-100 p-3 shadow-sm flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about workouts or diet..."
              className="flex-1 p-2 border rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition disabled:bg-slate-300"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiCoach;
