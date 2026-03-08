import React, { useState } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../utils/firebase';
import { supabase } from '../utils/supabase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            setError('Please select a role before signing up.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await finalizeUserSetup(user, role as string);
            alert('User created successfully!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const finalizeUserSetup = async (user: any, selectedRole: string) => {
        // 1. Set custom role claim in Firebase via backend
        await axios.post("http://localhost:5000/api/admin/set-initial-role", {
            uid: user.uid,
            role: selectedRole
        });

        // 2. Create teacher profile in Supabase (if teacher)
        if (selectedRole === 'teacher' || selectedRole === 'admin') {
            const { error: profileError } = await supabase
                .from('teachers')
                .insert([
                    { teacher_id: user.uid, email: user.email, name: user.email?.split('@')[0] }
                ]);

            if (profileError) console.error('Supabase profile error:', profileError);
        }

        // Force token refresh to get new claims
        await user.getIdToken(true);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            const user = userCredential.user;

            const tokenResult = await user.getIdTokenResult();
            if (!tokenResult.claims.role) {
                // No role found, show role selection modal
                setPendingUser(user);
                setShowRoleSelection(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSubmit = async () => {
        if (!role) {
            setError('Please select a role.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (pendingUser) {
                await finalizeUserSetup(pendingUser, role as string);
                setShowRoleSelection(false);
                setPendingUser(null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (showRoleSelection) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] transition-colors p-4">
                <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-[#2a2a2a] transition-all">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Complete Your Profile</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Please select your role to continue:</p>
                    <div className="flex flex-col gap-4">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                            required
                        >
                            <option value="" disabled>Select Role</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={handleRoleSubmit}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                        >
                            {loading ? 'Processing...' : 'Complete Setup'}
                        </button>
                    </div>
                    {error && <p className="mt-4 text-sm text-red-500 animate-pulse text-center">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 transition-colors relative overflow-hidden">
            {/* Background Blob decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] p-8 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none dark:border dark:border-[#2a2a2a] relative z-10 transition-all">
                {/* SketchFlow Logo and Heading */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /><path d="M8 18h1" /><path d="M18.4 9.6a2 2 0 1 1 3 3L17 19l-4 1 1-4Z" /></svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">SketchFlow</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to start collaborating.'}</p>
                </div>

                <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4 mb-6">
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-gray-400"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-gray-400"
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm appearance-none"
                                required
                            >
                                <option value="" disabled>Select Role</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-[#333]"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-[#1e1e1e] text-gray-400">Or continue with</span>
                    </div>
                </div>

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] font-medium rounded-xl transition-colors flex items-center justify-center gap-2 mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>

                {error && <p className="text-center text-sm text-red-500 mb-4 animate-pulse">{error}</p>}

                {/* Toggle between Login and Sign Up */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors outline-none"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;