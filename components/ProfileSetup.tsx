// ProfileSetup.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, ActivityLevel, FitnessGoal } from '../types';
import { calculateMetrics } from '../utils/calculations';

interface ProfileSetupProps {
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  onClose?: () => void;
}

const activityLevels: ActivityLevel[] = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
const genders: Gender[] = ['Male', 'Female'];
const fitnessGoals: FitnessGoal[] = ['Lose Weight', 'Maintain Weight', 'Gain Muscle'];

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSave, initialProfile = null, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male' as Gender,
    weight: '',
    height: '',
    neck: '',
    waist: '',
    hip: '',
    activityLevel: 'Moderate' as ActivityLevel,
    fitnessGoal: 'Maintain Weight' as FitnessGoal,
    bedtime: '23:00',
    wakeupTime: '07:00',
  });
  const [error, setError] = useState('');

  const isEditMode = !!initialProfile;

  // Populate form with initialProfile only once when initialProfile becomes available
  useEffect(() => {
    if (isEditMode && initialProfile) {
      setFormData({
        name: initialProfile.name ?? '',
        age: initialProfile.age != null ? String(initialProfile.age) : '',
        gender: initialProfile.gender ?? 'Male',
        weight: initialProfile.weight != null ? String(initialProfile.weight) : '',
        height: initialProfile.height != null ? String(initialProfile.height) : '',
        neck: initialProfile.neck != null ? String(initialProfile.neck) : '',
        waist: initialProfile.waist != null ? String(initialProfile.waist) : '',
        hip: initialProfile.hip != null ? String(initialProfile.hip) : '',
        activityLevel: initialProfile.activityLevel ?? 'Moderate',
        fitnessGoal: initialProfile.fitnessGoal ?? 'Maintain Weight',
        bedtime: initialProfile.sleepGoal?.bedtime ?? '23:00',
        wakeupTime: initialProfile.sleepGoal?.wakeupTime ?? '07:00',
      });
    }
  }, [initialProfile, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const {
      name,
      age,
      gender,
      weight,
      height,
      activityLevel,
      fitnessGoal,
      neck,
      waist,
      hip,
      bedtime,
      wakeupTime,
    } = formData;

    // required checks
    if (!name.trim() || !age.trim() || !weight.trim() || !height.trim() || !neck.trim() || !waist.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    if (gender === 'Female' && !hip.trim()) {
      setError('Please enter your hip measurement for accurate body fat calculation.');
      return;
    }
    if (!bedtime || !wakeupTime) {
      setError('Please set your sleep goals.');
      return;
    }

    // parse numbers
    const parsed = {
      age: Number.parseInt(age, 10),
      weight: Number.parseFloat(weight),
      height: Number.parseFloat(height),
      neck: Number.parseFloat(neck),
      waist: Number.parseFloat(waist),
      hip: hip.trim() ? Number.parseFloat(hip) : null,
    };

    // validate numbers
    for (const [k, v] of Object.entries(parsed)) {
      if (v === null) continue; // hip may be null for males
      if (!Number.isFinite(v) || v <= 0) {
        setError(`Please enter a valid positive number for ${k}.`);
        return;
      }
    }

    setError('');

    // Merge with initialProfile so we don't wipe fields not present in the form
    const mergedProfile: Partial<UserProfile> = {
      ...(initialProfile ?? {}),
      id: initialProfile?.id ?? initialProfile?.id, // keep existing id
      name: name.trim() || initialProfile?.name || '',
      gender,
      activityLevel,
      fitnessGoal,
      age: parsed.age,
      weight: parsed.weight,
      height: parsed.height,
      neck: parsed.neck,
      waist: parsed.waist,
      hip: parsed.hip ?? initialProfile?.hip ?? null,
      sleepGoal: { bedtime, wakeupTime },
    };

    // calculate derived metrics (expects certain shape)
    const finalProfile = calculateMetrics(mergedProfile as UserProfile);

    onSave(finalProfile);
  };

  const formInputClass =
    'mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';
  const formLabelClass = 'block text-sm font-medium text-slate-700';

  const formContent = (
    <>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className={formLabelClass}>
              Name
            </label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={formInputClass} placeholder="Jane Doe" />
          </div>
          <div>
            <label htmlFor="age" className={formLabelClass}>
              Age
            </label>
            <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className={formInputClass} placeholder="30" />
          </div>
          <div>
            <label htmlFor="gender" className={formLabelClass}>
              Gender
            </label>
            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={formInputClass}>
              {genders.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="weight" className={formLabelClass}>
              Weight (kg)
            </label>
            <input type="number" step="0.1" name="weight" id="weight" value={formData.weight} onChange={handleChange} className={formInputClass} placeholder="65" />
          </div>
          <div>
            <label htmlFor="height" className={formLabelClass}>
              Height (cm)
            </label>
            <input type="number" step="0.1" name="height" id="height" value={formData.height} onChange={handleChange} className={formInputClass} placeholder="170" />
          </div>
          <div>
            <label htmlFor="neck" className={formLabelClass}>
              Neck (cm)
            </label>
            <input type="number" step="0.1" name="neck" id="neck" value={formData.neck} onChange={handleChange} className={formInputClass} placeholder="36" />
          </div>
          <div>
            <label htmlFor="waist" className={formLabelClass}>
              Waist (cm)
            </label>
            <input type="number" step="0.1" name="waist" id="waist" value={formData.waist} onChange={handleChange} className={formInputClass} placeholder="75" />
          </div>
          {formData.gender === 'Female' && (
            <div>
              <label htmlFor="hip" className={formLabelClass}>
                Hip (cm)
              </label>
              <input type="number" step="0.1" name="hip" id="hip" value={formData.hip} onChange={handleChange} className={formInputClass} placeholder="95" />
            </div>
          )}

          <div className="md:col-span-2 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-indigo-600">Goals</h3>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="activityLevel" className={formLabelClass}>
              Activity Level
            </label>
            <select name="activityLevel" id="activityLevel" value={formData.activityLevel} onChange={handleChange} className={formInputClass}>
              {activityLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="fitnessGoal" className={formLabelClass}>
              Primary Fitness Goal
            </label>
            <select name="fitnessGoal" id="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} className={formInputClass}>
              {fitnessGoals.map(goal => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bedtime" className={formLabelClass}>
              Target Bedtime
            </label>
            <input type="time" name="bedtime" id="bedtime" value={formData.bedtime} onChange={handleChange} className={formInputClass} />
          </div>
          <div>
            <label htmlFor="wakeupTime" className={formLabelClass}>
              Target Wake-up Time
            </label>
            <input type="time" name="wakeupTime" id="wakeupTime" value={formData.wakeupTime} onChange={handleChange} className={formInputClass} />
          </div>
        </div>
        <div className="pt-4">
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-200">
            {isEditMode ? 'Update' : 'Save Profile & Start Tracking'}
          </button>
        </div>
      </form>
    </>
  );

  if (isEditMode) {
    return (
      <div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8 overflow-y-auto max-h-full relative" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Modify</h1>
          <p className="text-slate-600 mb-8">Update your personal details and goals.</p>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8 overflow-y-auto max-h-full">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">Welcome to AI Fitness Tracker</h1>
        <p className="text-slate-600 mb-8">Let's set up your profile to personalize your experience.</p>
        {formContent}
      </div>
    </div>
  );
};

export default ProfileSetup;
