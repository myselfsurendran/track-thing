import React, { useState } from 'react';
import { signUpWithEmailPassword, signInWithEmailPassword } from '../services/firebase';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');   // ONLY for signup
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // LOGIN — email + password only
                await signInWithEmailPassword(email, password);

            } else {
                // SIGNUP — require username
                if (!username.trim()) {
                    setError("Username is required.");
                    setIsLoading(false);
                    return;
                }
                await signUpWithEmailPassword(email, password);
                // username saving is handled in ProfileSetup or dbService later
            }

        } catch (err: any) {
            let message = "Authentication failed.";

            if (err.code) {
                switch (err.code) {
                    case 'auth/invalid-email': message = 'Invalid email.'; break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password': message = 'Invalid email or password.'; break;
                    case 'auth/email-already-in-use': message = 'Email already in use.'; break;
                    case 'auth/weak-password': message = 'Password must be at least 6 characters.'; break;
                }
            }

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
                
                <h1 className="text-3xl font-bold text-indigo-600 mb-2 text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-slate-600 mb-8 text-center">
                    {isLogin ? 'Log in to continue.' : 'Sign up to get started.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* EMAIL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* USERNAME — ONLY IN SIGNUP */}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={!isLogin}
                                className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    )}

                    {/* PASSWORD */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                            minLength={6}
                        />
                    </div>

                    {/* ERROR DISPLAY */}
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md disabled:bg-slate-400"
                    >
                        {isLoading ? "Processing..." : isLogin ? 'Log In' : 'Sign Up'}
                    </button>

                </form>

                {/* TOGGLE LOGIN ↔ SIGNUP */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Auth;
