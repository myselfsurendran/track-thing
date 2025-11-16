import React from 'react';

interface HeaderProps {
  name: string;
  onEditProfile: () => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ name, onEditProfile, onSignOut }) => {
  return (
    <header className="py-6 px-4 md:px-8 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Track-thing
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <span className="text-slate-500 text-sm">Welcome back,</span>
                <p className="font-bold text-slate-900 text-lg">{name}</p>
            </div>
            <button onClick={onEditProfile} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Edit Profile">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
             <button onClick={onSignOut} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Sign Out">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;