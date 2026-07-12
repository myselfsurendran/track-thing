import React, { useState } from 'react';
import { WeightLogEntry } from '../types';

interface WeightTrackerProps {
  weightLog: WeightLogEntry[];
  onLogWeight: (weight: number) => void;
  onDeleteWeight: (id: string) => void;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ weightLog, onLogWeight, onDeleteWeight }) => {
  const [weight, setWeight] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) return;
    onLogWeight(Number(weight));
    setWeight('');
  };

  // Sort logs: newest first
  const sortedLogs = [...weightLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-600">Log Your Weight</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label htmlFor="weightAmount" className="block text-sm font-medium text-slate-600 mb-1">
              Weight (kg)
            </label>
            <input
              id="weightAmount"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 72.5"
              className="w-full p-2 border rounded-md text-sm bg-slate-50 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow transition"
          >
            Log Weight
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold mb-2 text-indigo-600 px-6 pt-6">Recent Weight Logs</h2>
        {sortedLogs.length === 0 ? (
          <p className="text-slate-500 px-6 pb-6 pt-2">No weight logged yet for this date. Enter your weight above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Weight (kg)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedLogs.map((entry) => {
                  const timeStr = new Date(entry.timestamp).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-600">{timeStr}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{entry.weight} kg</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onDeleteWeight(entry.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightTracker;
