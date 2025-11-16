import React, { useState } from 'react';
import { WaterLogEntry } from '../types';
import WaterLogTable from './WaterLogTable';

interface WaterTrackerProps {
  waterLog: WaterLogEntry[];
  onLogWater: (amount: number) => void;
  onUpdateWater: (water: WaterLogEntry) => void;
  onDeleteWater: (id: string) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ waterLog, onLogWater, onUpdateWater, onDeleteWater }) => {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(Number(amount) > 0) {
            onLogWater(Number(amount));
            setAmount('');
        }
    };
    
    const handleQuickAdd = (addAmount: number) => {
        onLogWater(addAmount);
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-indigo-600">Log Your Water Intake</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="waterAmount" className="block text-sm font-medium text-slate-600">Amount (ml)</label>
                        <input
                            type="number"
                            id="waterAmount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 500"
                            className="mt-1 w-full p-3 bg-slate-100 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 placeholder-slate-400"
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button type="button" onClick={() => handleQuickAdd(250)} className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold py-2 px-3 rounded-md transition-colors">Add 250 ml</button>
                        <button type="button" onClick={() => handleQuickAdd(500)} className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold py-2 px-3 rounded-md transition-colors">Add 500 ml</button>
                        <button type="button" onClick={() => handleQuickAdd(750)} className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold py-2 px-3 rounded-md transition-colors">Add 750 ml</button>
                        <button type="button" onClick={() => handleQuickAdd(1000)} className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold py-2 px-3 rounded-md transition-colors">Add 1 Litre</button>
                    </div>
                    <button
                        type="submit"
                        disabled={!amount || Number(amount) <= 0}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-md transition duration-200"
                    >
                        Log Water
                    </button>
                </form>
            </div>

            <WaterLogTable waterLog={waterLog} onUpdateWater={onUpdateWater} onDeleteWater={onDeleteWater} />
        </div>
    );
};

export default WaterTracker;