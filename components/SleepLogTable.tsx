import React, { useState } from 'react';
import { SleepLogEntry } from '../types';
import { calculateSleepScore } from '../utils/calculations'; // Assuming profile is available or not needed for score recalc

interface SleepLogTableProps {
  sleeps: SleepLogEntry[];
  onUpdateSleep: (sleep: SleepLogEntry) => void;
  onDeleteSleep: (id: string) => void;
}

const SleepLogTable: React.FC<SleepLogTableProps> = ({ sleeps, onUpdateSleep, onDeleteSleep }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSleep, setEditedSleep] = useState<SleepLogEntry | null>(null);

  const handleEdit = (sleep: SleepLogEntry) => {
    setEditingId(sleep.id);
    // Format for datetime-local input
    const sleepTimeLocal = new Date(sleep.sleepTime).toISOString().slice(0,16);
    const wakeupTimeLocal = new Date(sleep.wakeupTime).toISOString().slice(0,16);
    setEditedSleep({ ...sleep, sleepTime: sleepTimeLocal, wakeupTime: wakeupTimeLocal });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedSleep(null);
  };
  
  const handleDelete = (id: string) => {
      onDeleteSleep(id);
  }

  const handleSave = () => {
    if (editedSleep) {
      // Convert back to ISO string before saving
      const sleepDate = new Date(editedSleep.sleepTime);
      const wakeupDate = new Date(editedSleep.wakeupTime);
      
      const duration = (wakeupDate.getTime() - sleepDate.getTime()) / (1000 * 60);

      // We can't recalculate score perfectly without the profile,
      // so we make a simplifying assumption or just update times.
      // For this implementation, we'll just update the times and duration.
      // A more complex implementation would involve passing the profile down.
      const finalSleep: SleepLogEntry = {
          ...editedSleep,
          sleepTime: sleepDate.toISOString(),
          wakeupTime: wakeupDate.toISOString(),
          duration: duration,
          // score would ideally be recalculated here
      };

      onUpdateSleep(finalSleep);
    }
    setEditingId(null);
    setEditedSleep(null);
  };
  
  const handleChange = (field: 'sleepTime' | 'wakeupTime', value: string) => {
      if(!editedSleep) return;
      setEditedSleep({ ...editedSleep, [field]: value });
  };

  if (sleeps.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2 text-indigo-600">Sleep Log</h2>
        <p className="text-slate-500">No sleep logged yet. Use the form above to get started!</p>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const InputField = ({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input 
      type="datetime-local" 
      value={value} 
      onChange={onChange}
      className="w-full bg-slate-100 text-slate-800 p-1 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      style={{colorScheme: 'light'}}
    />
  );

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 shadow-md">
       <h2 className="text-xl font-semibold mb-4 text-indigo-600 px-4 pt-2">Sleep Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Bedtime</th>
              <th scope="col" className="px-4 py-3">Wake Up</th>
              <th scope="col" className="px-4 py-3 text-right">Duration</th>
              <th scope="col" className="px-4 py-3 text-right">Sleep Score</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sleeps.map((entry) => {
                const isEditing = editingId === entry.id;
                return (
                    <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-slate-800">{formatDate(entry.timestamp)}</td>
                        <td className="px-4 py-4 text-slate-600">
                            {isEditing ? <InputField value={editedSleep?.sleepTime ?? ''} onChange={e => handleChange('sleepTime', e.target.value)} /> : formatTime(entry.sleepTime)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                            {isEditing ? <InputField value={editedSleep?.wakeupTime ?? ''} onChange={e => handleChange('wakeupTime', e.target.value)} /> : formatTime(entry.wakeupTime)}
                        </td>
                        <td className="px-4 py-4 text-right text-sky-600">{formatDuration(entry.duration)}</td>
                        <td className="px-4 py-4 text-right text-emerald-600 font-bold">{entry.score} / 100</td>
                        <td className="px-4 py-4 align-middle text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={handleSave} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2 rounded">Save</button>
                                <button onClick={handleCancel} className="text-xs hover:text-slate-800">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEdit(entry)} className="text-xs text-slate-500 hover:text-indigo-600 font-semibold py-1 px-2 rounded">Edit</button>
                                <button onClick={() => handleDelete(entry.id)} className="text-xs text-slate-500 hover:text-red-600 font-semibold py-1 px-2 rounded">Delete</button>
                              </div>
                            )}
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SleepLogTable;