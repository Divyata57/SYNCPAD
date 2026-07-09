'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { Shield, Monitor, Key, AlertTriangle, CheckCircle, Trash } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionError, setSessionError] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      try {
        const res = await api.get('/auth/sessions');
        if (res.data.success) {
          setSessions(res.data.sessions);
        }
      } catch (err) {
        console.error('Failed to load active sessions:', err);
      }
    };
    fetchSessions();
  }, [user]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Revoke this active session? The associated device will be immediately signed out.')) return;
    setSessionError('');
    setSessionSuccess('');
    try {
      const res = await api.delete(`/auth/sessions/${sessionId}`);
      if (res.data.success) {
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        setSessionSuccess('Device authorization revoked.');
      }
    } catch (err) {
      console.error('Session revoke error:', err);
      setSessionError('Could not revoke authorization.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-display font-extrabold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Account Security & Sessions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your active authentication keys and view devices currently logged into your account
          </p>
        </div>

        {sessionError && <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center">{sessionError}</div>}
        {sessionSuccess && <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> {sessionSuccess}</div>}

        <div className="p-6 border border-border rounded-2xl bg-card/45 backdrop-blur-md glass-card space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Monitor className="w-4 h-4" /> Active Devices
            </h3>

            <div className="divide-y divide-border/60">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No logged sessions found.</p>
              ) : (
                sessions.map((sess) => (
                  <div key={sess._id} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground/90 truncate block">{sess.device}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>IP: {sess.ipAddress}</span>
                        <span>Logged: {new Date(sess.createdAt).toLocaleDateString()}</span>
                        <span>Expires: {new Date(sess.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(sess._id)}
                      className="p-1.5 rounded-lg border border-border/80 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 cursor-pointer shrink-0 transition-colors"
                      title="Revoke session key"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
