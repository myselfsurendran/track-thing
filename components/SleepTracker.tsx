import React, { useState } from 'react';
import { SleepLogEntry } from '../types';
import SleepLogTable from './SleepLogTable';

interface SleepTrackerProps {
  sleepLog: SleepLogEntry[];
  onLogSleep: (sleepTime: string, wakeupTime: string) => void;
  onUpdateSleep: (sleep: SleepLogEntry) => void;
  onDeleteSleep: (id: string) => void;
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ sleepLog, onLogSleep, onUpdateSleep, onDeleteSleep }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 0, 0, 0);
    const today = new Date();
    today.setHours(7, 0, 0, 0);

    const [sleepTime, setSleepTime] = useState(yesterday.toISOString().slice(0, 16));
    const [wakeupTime, setWakeupTime] = useState(today.toISOString().slice(0, 16));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogSleep(sleepTime, wakeupTime);
    };
    
    const InputDateTime = ({label, id, value, onChange} : {label:string, id:string, value:string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-600">{label}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                 <input
                    type="datetime-local"
                    id={id}
                    value={value}
                    onChange={onChange}
                    className="w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                    style={{colorScheme: 'light'}}
                />
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-indigo-600">Log Your Sleep</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputDateTime label="Went to bed at" id="sleepTime" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                        <InputDateTime label="Woke up at" id="wakeupTime" value={wakeupTime} onChange={(e) => setWakeupTime(e.target.value)} />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-md transition duration-200"
                    >
                        Log Sleep
                    </button>
                </form>
            </div>

            <SleepLogTable sleeps={sleepLog} onUpdateSleep={onUpdateSleep} onDeleteSleep={onDeleteSleep} />
        </div>
    );
};

export default SleepTracker;