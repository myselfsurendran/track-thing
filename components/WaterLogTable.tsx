import React, { useState } from 'react';
import { WaterLogEntry } from '../types';

interface WaterLogTableProps {
  waterLog: WaterLogEntry[];
  onUpdateWater: (water: WaterLogEntry) => void;
  onDeleteWater: (id: string) => void;
}

const WaterLogTable: React.FC<WaterLogTableProps> = ({ waterLog, onUpdateWater, onDeleteWater }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');

  const handleEdit = (entry: WaterLogEntry) => {
    setEditingId(entry.id);
    setEditedAmount(String(entry.amount));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedAmount('');
  };

  const handleSave = (id: string) => {
    const amount = parseInt(editedAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      const originalEntry = waterLog.find(entry => entry.id === id);
      if(originalEntry) {
          onUpdateWater({ ...originalEntry, amount });
      }
    }
    setEditingId(null);
    setEditedAmount('');
  };
  
  const handleDelete = (id: string) => {
      onDeleteWater(id);
  }

  if (waterLog.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2 text-indigo-600">Water Log</h2>
        <p className="text-slate-500">No water logged yet. Use the form above to get started!</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600 px-4 pt-2">Water Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Time</th>
              <th scope="col" className="px-4 py-3 text-right">Amount (ml)</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {waterLog.map((entry) => {
              const isEditing = editingId === entry.id;
              return (
                <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-500">{formatTime(entry.timestamp)}</td>
                  <td className="px-4 py-4 text-right text-sky-600 font-medium">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                        className="w-24 text-right bg-slate-100 text-slate-800 p-1 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      `${entry.amount} ml`
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleSave(entry.id)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2 rounded">Save</button>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaterLogTable;