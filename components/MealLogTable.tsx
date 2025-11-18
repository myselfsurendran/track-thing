// src/components/MealLogTable.tsx
import React, { useState } from 'react';
import { MealLogEntry, MealItem } from '../types';

interface MealLogTableProps {
  meals: MealLogEntry[];
  selectedDate?: Date;
  onUpdateMeal: (meal: MealLogEntry) => void;
  onDeleteMeal: (id: string) => void;
}

const MealLogTable: React.FC<MealLogTableProps> = ({ meals, onUpdateMeal, onDeleteMeal }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMeal, setEditedMeal] = useState<MealLogEntry | null>(null);

  const handleEdit = (meal: MealLogEntry) => {
    setEditingId(meal.id);
    setEditedMeal(JSON.parse(JSON.stringify(meal))); // Deep copy for editing
  };

  const handleDelete = (id: string) => {
    onDeleteMeal(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedMeal(null);
  };

  const handleSave = () => {
    if (editedMeal) {
      onUpdateMeal(editedMeal);
    }
    setEditingId(null);
    setEditedMeal(null);
  };

  const handleItemChange = (itemIndex: number, field: keyof MealItem, value: string) => {
    if (!editedMeal) return;

    const updatedItems = [...editedMeal.items];
    const targetItem = { ...updatedItems[itemIndex] };

    if (field === 'name') {
      targetItem.name = value;
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // @ts-ignore
        targetItem[field] = numValue as number;
      }
    }

    updatedItems[itemIndex] = targetItem;
    setEditedMeal({ ...editedMeal, items: updatedItems });
  };

  const handleMealTypeChange = (value: string) => {
    if (!editedMeal) return;
    setEditedMeal({ ...editedMeal, mealType: value as MealLogEntry['mealType'] });
  };

  if (!Array.isArray(meals) || meals.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2 text-indigo-600">Meal Log</h2>
        <p className="text-slate-500">No meals for the selected date. Use the form above to add one.</p>
      </div>
    );
  }

  const InputField = ({ value, onChange }: { value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full bg-slate-100 text-slate-800 p-1 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
    />
  );

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600 px-4 pt-2">Meal Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Time</th>
              <th scope="col" className="px-4 py-3">Meal</th>
              <th scope="col" className="px-4 py-3">Item</th>
              <th scope="col" className="px-4 py-3 text-right">Calories</th>
              <th scope="col" className="px-4 py-3 text-right">Protein (g)</th>
              <th scope="col" className="px-4 py-3 text-right">Carbs (g)</th>
              <th scope="col" className="px-4 py-3 text-right">Fat (g)</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((entry) => (
              <React.Fragment key={entry.id}>
                {entry.items.map((item, itemIndex) => (
                  <tr key={`${entry.id}-${itemIndex}`} className="border-b border-slate-200 hover:bg-slate-50">
                    {itemIndex === 0 && (
                      <td rowSpan={entry.items.length} className="px-4 py-4 align-top text-slate-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    )}
                    {itemIndex === 0 && (
                      <td rowSpan={entry.items.length} className="px-4 py-4 align-top font-medium text-slate-800">
                        {editingId === entry.id ? (
                          <select value={editedMeal?.mealType} onChange={e => handleMealTypeChange(e.target.value)} className="w-full bg-slate-100 text-slate-800 p-1 rounded border border-slate-300">
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Unknown'].map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                        ) : entry.mealType}
                      </td>
                    )}
                    <td className="px-4 py-2 text-slate-700">
                      {editingId === entry.id ? (
                        <InputField value={`${editedMeal?.items[itemIndex]?.quantity} ${editedMeal?.items[itemIndex]?.name}`} onChange={e => {
                          const [qty, ...nameParts] = e.target.value.split(' ');
                          const name = nameParts.join(' ');
                          handleItemChange(itemIndex, 'quantity', qty);
                          handleItemChange(itemIndex, 'name', name);
                        }} />
                      ) : `${item.quantity} ${item.name}`}
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-600">
                      {editingId === entry.id ? <InputField value={editedMeal?.items[itemIndex]?.calories?.toFixed?.(0) ?? ''} onChange={e => handleItemChange(itemIndex, 'calories', e.target.value)} /> : item.calories.toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-right text-sky-600">
                      {editingId === entry.id ? <InputField value={editedMeal?.items[itemIndex]?.protein?.toFixed?.(1) ?? ''} onChange={e => handleItemChange(itemIndex, 'protein', e.target.value)} /> : item.protein.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-right text-amber-600">
                      {editingId === entry.id ? <InputField value={editedMeal?.items[itemIndex]?.carbs?.toFixed?.(1) ?? ''} onChange={e => handleItemChange(itemIndex, 'carbs', e.target.value)} /> : item.carbs.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-right text-rose-600">
                      {editingId === entry.id ? <InputField value={editedMeal?.items[itemIndex]?.fat?.toFixed?.(1) ?? ''} onChange={e => handleItemChange(itemIndex, 'fat', e.target.value)} /> : item.fat.toFixed(1)}
                    </td>
                    {itemIndex === 0 && (
                      <td rowSpan={entry.items.length} className="px-4 py-2 align-middle text-center">
                        {editingId === entry.id ? (
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
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MealLogTable;
