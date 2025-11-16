// Auth.tsx
import React, { useState } from 'react';
import { signUpWithEmailPassword, signInWithEmailPassword } from '../services/firebase';
import * as dbService from '../services/dbService';
import { UserProfile } from '../types';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(''); // additional userid field
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const user = await signInWithEmailPassword(email, password);
        if (!user) throw new Error('Login failed');

        // optional verification: ensure provided userId (if any) matches stored username
        if (userId.trim()) {
          const profile = await dbService.getProfile(user.uid);
          const savedUsername = profile?.username ?? '';
          if (savedUsername && savedUsername !== userId.trim()) {
            // sign out for safety (depending on your signIn function behavior you might want to signOutUser())
            throw { code: 'auth/userid-mismatch', message: 'User ID does not match this account.' };
          }
        }
      } else {
        const user = await signUpWithEmailPassword(email, password);
        if (!user) throw new Error('Signup failed');

        // Create initial profile with provided userId as username (if given)
        const uid = user.uid;
        const initialProfile: UserProfile = {
          id: uid,
          name: user.displayName ?? '',
          username: userId?.trim() || '',
          age: 0,
          weight: 0,
          height: 0,
          bmi: 0,
          bfp: 0,
          tdee: 0,
          sleepGoal: 480, // defaults — adjust if you want
        };
        await dbService.saveProfile(uid, initialProfile);
      }
    } catch (err: any) {
      let message = 'An unknown error occurred.';
      if (err?.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            message = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            message = 'This email address is already in use.';
            break;
          case 'auth/weak-password':
            message = 'Password should be at least 6 characters.';
            break;
          case 'auth/userid-mismatch':
            message = 'Provided User ID does not match this account.';
            break;
          default:
            message = err.message || 'Authentication failed. Please try again.';
            break;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-slate-600 mb-8 text-center">
          {isLogin ? 'Log in to access your fitness data.' : 'Sign up to start tracking your fitness journey.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••"
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-slate-700">User ID (app identifier)</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="your-username (optional on login)"
            />
            <p className="text-xs text-slate-400 mt-1">Provide your app User ID. On signup it becomes your username. On login it's verified if provided.</p>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
