// src/components/WorkoutLogTable.tsx
import React, { useState } from 'react';
import { WorkoutLogEntry, WorkoutItem } from '../types';

interface WorkoutLogTableProps {
  workouts: WorkoutLogEntry[];
  selectedDate?: Date;
  onUpdateWorkout: (workout: WorkoutLogEntry) => void;
  onDeleteWorkout: (id: string) => void;
}

const WorkoutLogTable: React.FC<WorkoutLogTableProps> = ({ workouts, onUpdateWorkout, onDeleteWorkout }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedWorkout, setEditedWorkout] = useState<WorkoutLogEntry | null>(null);

  const handleEdit = (workout: WorkoutLogEntry) => {
    setEditingId(workout.id);
    setEditedWorkout(JSON.parse(JSON.stringify(workout))); // Deep copy for editing
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedWorkout(null);
  };

  const handleDelete = (id: string) => {
    onDeleteWorkout(id);
  };

  const handleSave = () => {
    if (editedWorkout) {
      onUpdateWorkout(editedWorkout);
    }
    setEditingId(null);
    setEditedWorkout(null);
  };

  const handleItemChange = (itemIndex: number, field: keyof WorkoutItem, value: string) => {
    if (!editedWorkout) return;

    const updatedItems = [...editedWorkout.items];
    const targetItem = { ...updatedItems[itemIndex] };

    if (field === 'name') {
      targetItem.name = value;
    } else {
      const numValue = value ? parseFloat(value) : null;
      // @ts-ignore
      targetItem[field] = numValue;
    }

    updatedItems[itemIndex] = targetItem;
    setEditedWorkout({ ...editedWorkout, items: updatedItems });
  };

  const handleGeneralChange = (field: keyof WorkoutLogEntry, value: string) => {
    if (!editedWorkout) return;
    const numValue = field === 'steps' ? (value ? parseInt(value) : null) : value;
    setEditedWorkout({ ...editedWorkout, [field]: numValue as any });
  };

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2 text-indigo-600">Workout Log</h2>
        <p className="text-slate-500">No workouts for the selected date. Use the form above to log one.</p>
      </div>
    );
  }

  const InputField = ({ value, onChange, placeholder }: { value: string | number | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => (
    <input
      type="text"
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-100 text-slate-800 p-1 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
    />
  );

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600 px-4 pt-2">Workout Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Details</th>
              <th scope="col" className="px-4 py-3 text-right">Steps</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((entry) => {
              const isEditing = editingId === entry.id;

              return (
                <React.Fragment key={entry.id}>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-4 align-top text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      <br />
                      <span className="text-xs">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-slate-800">
                      {isEditing ? (
                        <select value={editedWorkout?.workoutType} onChange={e => handleGeneralChange('workoutType', e.target.value)} className="w-full bg-slate-100 text-slate-800 p-1 rounded border border-slate-300">
                          {['Strength', 'Cardio', 'Mixed', 'Other'].map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      ) : entry.workoutType}
                    </td>
                    <td className="px-4 py-4">
                      <table className="w-full">
                        <tbody>
                          {(isEditing ? editedWorkout?.items : entry.items).map((item, itemIndex) => (
                            <tr key={itemIndex}>
                              <td className="py-1 pr-2 text-slate-700 font-medium">
                                {isEditing ? <InputField value={item.name} onChange={e => handleItemChange(itemIndex, 'name', e.target.value)} placeholder="Exercise Name" /> : item.name}
                              </td>
                              <td className="py-1 px-2 text-center text-sky-600 whitespace-nowrap">
                                {isEditing ? <InputField value={item.sets} onChange={e => handleItemChange(itemIndex, 'sets', e.target.value)} placeholder="Sets" /> : (item.sets ? `${item.sets} sets` : '')}
                              </td>
                              <td className="py-1 px-2 text-center text-sky-600 whitespace-nowrap">
                                {isEditing ? <InputField value={item.reps} onChange={e => handleItemChange(itemIndex, 'reps', e.target.value)} placeholder="Reps" /> : (item.reps ? `${item.reps} reps` : '')}
                              </td>
                              <td className="py-1 pl-2 text-right text-amber-600 whitespace-nowrap">
                                {isEditing ? <InputField value={item.weight} onChange={e => handleItemChange(itemIndex, 'weight', e.target.value)} placeholder="kg" /> : (item.weight ? `${item.weight} kg` : '')}
                              </td>
                              <td className="py-1 pl-2 text-right text-emerald-600 whitespace-nowrap">
                                {isEditing ? <InputField value={item.duration} onChange={e => handleItemChange(itemIndex, 'duration', e.target.value)} placeholder="min" /> : (item.duration ? `${item.duration} min` : '')}
                              </td>
                              <td className="py-1 pl-2 text-right text-rose-600 whitespace-nowrap">
                                {isEditing ? <InputField value={item.distance} onChange={e => handleItemChange(itemIndex, 'distance', e.target.value)} placeholder="km" /> : (item.distance ? `${item.distance} km` : '')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                    <td className="px-4 py-4 align-top text-right text-indigo-600">
                      {isEditing ? <InputField value={editedWorkout?.steps} onChange={e => handleGeneralChange('steps', e.target.value)} placeholder="Steps" /> : (entry.steps ?? '-')}
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
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
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkoutLogTable;
