'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { 
  Plus, Calendar, ArrowRight, Activity, 
  Briefcase, FileText, LayoutGrid, Users, Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Dashboard stats
  const [stats, setStats] = useState({
    workspaceCount: 0,
    documentCount: 0,
    activityCount: 0
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load workspaces and stats
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const wsRes = await api.get('/workspaces');
        if (wsRes.data.success) {
          setWorkspaces(wsRes.data.workspaces);
          
          // Compute simple client-side count stats
          const wsList = wsRes.data.workspaces;
          let totalDocs = 0;

          // Fetch docs counts for statistics
          for (const ws of wsList) {
            try {
              const docRes = await api.get(`/documents?workspaceId=${ws._id}`);
              if (docRes.data.success) {
                totalDocs += docRes.data.documents.length;
              }
            } catch (e) {}
          }

          setStats({
            workspaceCount: wsList.length,
            documentCount: totalDocs,
            activityCount: wsList.length * 4 + totalDocs // mock metric
          });
        }
      } catch (err) {
        console.error('Error loading workspaces:', err);
      }
    };

    loadData();
  }, [user]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newWsName.trim()) return;

    try {
      const res = await api.post('/workspaces', {
        name: newWsName,
        description: newWsDesc
      });
      if (res.data.success) {
        setWorkspaces(prev => [res.data.workspace, ...prev]);
        setNewWsName('');
        setNewWsDesc('');
        // Update stats
        setStats(prev => ({
          ...prev,
          workspaceCount: prev.workspaceCount + 1
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace.');
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!inviteCode.trim()) return;

    try {
      const res = await api.post('/workspaces/join', { inviteCode });
      if (res.data.success) {
        setWorkspaces(prev => [res.data.workspace, ...prev]);
        setInviteCode('');
        setStats(prev => ({
          ...prev,
          workspaceCount: prev.workspaceCount + 1
        }));
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Invalid invite code.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading your profile dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Stats and Workspace lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl border border-border bg-card/45 backdrop-blur-md glass-card relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-extrabold tracking-tight">
                Welcome back, @{user.username}!
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Here's a snapshot of your collaborative hubs today.
              </p>
            </div>
            <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full mt-4 md:mt-0 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <Briefcase className="w-4 h-4 text-indigo-400" />,
                title: "Workspaces",
                val: stats.workspaceCount
              },
              {
                icon: <FileText className="w-4 h-4 text-pink-400" />,
                title: "Documents",
                val: stats.documentCount
              },
              {
                icon: <Activity className="w-4 h-4 text-amber-400" />,
                title: "Activities",
                val: stats.activityCount
              }
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-border bg-card/25 backdrop-blur-sm flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stat.title}</span>
                  {stat.icon}
                </div>
                <span className="text-2xl font-display font-extrabold">{stat.val}</span>
              </div>
            ))}
          </div>

          {/* Workspace cards */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-400" /> Recent Workspaces
            </h3>

            {workspaces.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/10">
                <p className="text-xs text-muted-foreground">No workspaces found. Create one to begin collaborating!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map((ws) => (
                  <motion.div
                    key={ws._id}
                    whileHover={{ y: -3 }}
                    onClick={() => router.push(`/workspace/${ws._id}`)}
                    className="p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/50 shadow-sm cursor-pointer transition-all flex flex-col justify-between h-44 group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="w-7 h-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                          {ws.name.charAt(0)}
                        </span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                          {ws.members?.length || 0} Members
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm truncate">{ws.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {ws.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-border/60 pt-3">
                      <span className="text-[10px] text-muted-foreground">
                        Owner: @{ws.owner?.username || 'You'}
                      </span>
                      <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create Workspace & Join panels */}
        <div className="space-y-6">
          {/* Create Workspace Panel */}
          <div className="p-6 rounded-2xl border border-border bg-card/65 backdrop-blur-md glass-card flex flex-col space-y-4">
            <h3 className="font-display font-bold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Create Workspace
            </h3>
            
            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Team"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description (Optional)</label>
                <textarea
                  placeholder="Goals, team logs, etc..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none resize-none h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                Create Workspace
              </button>
            </form>
          </div>

          {/* Join Workspace Panel */}
          <div className="p-6 rounded-2xl border border-border bg-card/65 backdrop-blur-md glass-card flex flex-col space-y-4">
            <h3 className="font-display font-bold text-sm flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-pink-400" /> Join via Invite Code
            </h3>

            {joinError && <p className="text-xs text-rose-400 font-medium">{joinError}</p>}

            <form onSubmit={handleJoinWorkspace} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="INV-XXXXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none uppercase font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-pink-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                Join Workspace
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
