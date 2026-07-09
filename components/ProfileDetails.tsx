// ProfileDetails.tsx
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileDetailsProps {
  profile: UserProfile;
  onSaveProfile?: (profile: UserProfile) => Promise<void>;
  onChangePassword?: (newPassword: string) => Promise<void>;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="text-sm text-slate-500">{label}</div>
    <div className="text-lg font-semibold text-slate-800">{value}</div>
  </div>
);

const EditProfileModal: React.FC<{
  open: boolean;
  initialProfile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => Promise<void>;
  onChangePassword?: (newPassword: string) => Promise<void>;
}> = ({ open, initialProfile, onClose, onSave, onChangePassword }) => {
  const [username, setUsername] = useState(initialProfile.username ?? '');
  const [geminiApiKey, setGeminiApiKey] = useState(initialProfile.geminiApiKey ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [bfp, setBfp] = useState(initialProfile.bfp != null ? String(initialProfile.bfp) : '');
  const [smm, setSmm] = useState(initialProfile.smm != null ? String(initialProfile.smm) : '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const updated: UserProfile = { 
        ...initialProfile, 
        username: username.trim(),
        geminiApiKey: geminiApiKey.trim()
      };
      
      if (bfp.trim() !== '') {
        updated.bfp = parseFloat(bfp);
      } else {
        updated.bfp = initialProfile.bfp;
      }
      
      if (smm.trim() !== '') {
        updated.smm = parseFloat(smm);
      } else {
        const finalBfp = updated.bfp ?? 0;
        const lbm = updated.weight * (1 - finalBfp / 100);
        updated.smm = updated.gender === 'Male' ? lbm * 0.57 : lbm * 0.47;
      }
      
      await onSave(updated);
      if (newPassword) {
        if (!onChangePassword) throw new Error('Password change not available.');
        await onChangePassword(newPassword);
      }
      setMsg({ type: 'success', text: 'Profile updated.' });
      setTimeout(() => { setLoading(false); onClose(); }, 900);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to update profile.' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6 z-10">
        <h3 className="text-lg font-semibold mb-3">Modify Details</h3>

        <label className="block text-sm text-slate-600 mb-1">Email (read-only)</label>
        <input type="email" value={initialProfile?.id ? '' : ''} readOnly placeholder={initialProfile?.name || ''} className="w-full mb-3 p-2 border rounded-md bg-slate-50" />

        <label className="block text-sm text-slate-600 mb-1">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mb-3 p-2 border rounded-md bg-slate-50" placeholder="username" />

        <label className="block text-sm text-slate-600 mb-1">Body Fat %</label>
        <input type="number" step="0.1" value={bfp} onChange={(e) => setBfp(e.target.value)} className="w-full mb-3 p-2 border rounded-md bg-slate-50" placeholder="e.g. 15.5" />

        <label className="block text-sm text-slate-600 mb-1">Muscle Mass (SMM) kg</label>
        <input type="number" step="0.1" value={smm} onChange={(e) => setSmm(e.target.value)} className="w-full mb-3 p-2 border rounded-md bg-slate-50" placeholder="e.g. 32.4" />

        <label className="block text-sm text-slate-600 mb-1">Gemini API Key</label>
        <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} className="w-full mb-3 p-2 border rounded-md bg-slate-50" placeholder="AIzaSy..." />

        <label className="block text-sm text-slate-600 mb-1">New password (leave blank to keep)</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mb-3 p-2 border rounded-md bg-slate-50" placeholder="At least 6 characters" />

        {msg && <div className={`mb-3 p-2 rounded ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{msg.text}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200" disabled={loading}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:bg-slate-400" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile, onSaveProfile, onChangePassword }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-indigo-600">Your Profile</h3>
          <button
            onClick={() => setOpen(true)}
            className={`text-sm font-medium px-3 py-2 rounded-md ${onSaveProfile ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
            title={onSaveProfile ? 'Edit profile' : 'Edit profile not available'}
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
          <DetailItem label="Username" value={profile.username ?? '—'} />
          <DetailItem label="Name" value={profile.name ?? '—'} />
          <DetailItem label="Age" value={profile.age ?? '—'} />
          <DetailItem label="Weight" value={profile.weight ? `${profile.weight} kg` : '—'} />
          <DetailItem label="Height" value={profile.height ? `${profile.height} cm` : '—'} />
          <DetailItem label="BMI" value={typeof profile.bmi === 'number' ? profile.bmi.toFixed(1) : '—'} />
          <DetailItem label="Body Fat %" value={typeof profile.bfp === 'number' ? `${profile.bfp.toFixed(1)}%` : '—'} />
          <DetailItem label="Muscle Mass (SMM)" value={
            typeof profile.smm === 'number' ? `${profile.smm.toFixed(1)} kg` :
            typeof profile.bfp === 'number' && profile.weight ? `${(profile.weight * (1 - profile.bfp / 100) * (profile.gender === 'Male' ? 0.57 : 0.47)).toFixed(1)} kg` : '—'
          } />
        </div>
      </div>

      <EditProfileModal
        open={open}
        initialProfile={profile}
        onClose={() => setOpen(false)}
        onSave={async (p) => {
          if (!onSaveProfile) throw new Error('Save handler missing.');
          await onSaveProfile(p);
        }}
        onChangePassword={onChangePassword}
      />
    </>
  );
};

export default ProfileDetails;
