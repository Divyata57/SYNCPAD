'use client';

import React, { useState } from 'react';
import { api } from '../../services/api';
import { Mail, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Reset form states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess(true);
        // Expose reset token for easy sandbox simulation
        setResetToken(res.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken,
        newPassword
      });
      if (res.data.success) {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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
          <h2 className="text-2xl font-display font-bold">Reset Password</h2>
          <p className="text-xs text-slate-400">Sandbox recovery simulation workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {resetSuccess ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm">Reset Complete</h3>
            <p className="text-xs text-slate-400">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
            <div className="pt-2">
              <Link href="/login" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white block shadow-lg">
                Log In Now
              </Link>
            </div>
          </div>
        ) : success ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Mock Recovery Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply New Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendToken} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Registered Email</label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Request Reset Link</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-indigo-400 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
