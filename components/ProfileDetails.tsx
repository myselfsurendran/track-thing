import React from 'react';
import { UserProfile } from '../types';

interface ProfileDetailsProps {
    profile: UserProfile;
}

const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-lg font-semibold text-slate-800">{value}</div>
    </div>
);

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Your Profile</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                <DetailItem label="Age" value={profile.age} />
                <DetailItem label="Weight" value={`${profile.weight} kg`} />
                <DetailItem label="Height" value={`${profile.height} cm`} />
                <DetailItem label="BMI" value={profile.bmi.toFixed(1)} />
                <DetailItem label="Body Fat" value={`${profile.bfp.toFixed(1)}%`} />
                <DetailItem label="TDEE" value={`${profile.tdee.toFixed(0)} kcal`} />
            </div>
        </div>
    );
};

export default ProfileDetails;