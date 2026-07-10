'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiRes = await api.post('/auth/register', { username, email, password });
      
      if (apiRes.data.success) {
        // Auto-login the user
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md p-8 border border-slate-800 bg-slate-900/50 rounded-2xl shadow-2xl glass-card relative space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-2">
            SP
          </div>
          <h2 className="text-2xl font-display font-bold">Create Account</h2>
          <p className="text-xs text-slate-400">Join the multiplayer real-time editor platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Username</label>
            <input
              type="text"
              required
              placeholder="developer_guild"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address</label>
            <input
              type="email"
              required
              placeholder="dev@syncpad.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-indigo-400 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
