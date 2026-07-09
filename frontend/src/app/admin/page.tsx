'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { 
  Users, Briefcase, FileText, Cpu, Activity, 
  Terminal, ShieldAlert, CheckCircle, Ban
} from 'lucide-react';

export default function AdminPanelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const loadAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const analyticRes = await api.get('/admin/analytics');
      if (analyticRes.data.success) {
        setAnalytics(analyticRes.data.analytics);
      }

      const usersRes = await api.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      const logsRes = await api.get('/admin/logs');
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.logs);
      }
    } catch (err: any) {
      setAdminError(err.response?.data?.message || 'Access Denied. Admin privileges required.');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'unsuspend' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`, { suspend: !currentStatus });
      if (res.data.success) {
        alert(res.data.message);
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-display font-extrabold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> System Administrator Panel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor system analytics, suspend accounts, and view global audit logs.
          </p>
        </div>

        {adminError && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium text-center">
            {adminError}
          </div>
        )}

        {/* Analytics Section */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: "Total Users",
                icon: <Users className="w-4 h-4 text-indigo-400" />,
                val: analytics.counts?.users
              },
              {
                title: "Workspaces",
                icon: <Briefcase className="w-4 h-4 text-pink-400" />,
                val: analytics.counts?.workspaces
              },
              {
                title: "CPU Cores",
                icon: <Cpu className="w-4 h-4 text-amber-400" />,
                val: analytics.system?.cpuCount
              },
              {
                title: "RAM Usage",
                icon: <Activity className="w-4 h-4 text-emerald-400" />,
                val: `${analytics.system?.ramUsagePercentage}%`
              }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-xl border border-border bg-card/45 backdrop-blur-sm flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stat.title}</span>
                  {stat.icon}
                </div>
                <span className="text-2xl font-display font-extrabold">{stat.val}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Users Table */}
          <div className="lg:col-span-2 p-6 border border-border rounded-2xl bg-card/45 glass-card space-y-4">
            <h3 className="text-sm font-display font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Platform Accounts
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-accent/25 transition-colors">
                      <td className="py-3 font-semibold">@{u.username}</td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3 font-medium uppercase text-[10px]">{u.role}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.isSuspended ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleSuspend(u._id, u.isSuspended)}
                            className={`px-2.5 py-1 text-[10px] rounded border font-semibold ${
                              u.isSuspended 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System logs */}
          <div className="p-6 border border-border rounded-2xl bg-card/45 glass-card space-y-4">
            <h3 className="text-sm font-display font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-pink-400" /> Live Audit Log Trail
            </h3>

            <div className="space-y-3.5 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No logs generated.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id} className="text-[11px] leading-relaxed border-b border-border/40 pb-2.5 last:border-b-0">
                    <p className="text-foreground/90">
                      <span className="font-semibold text-indigo-400">@{log.user?.username || 'System'}</span>{' '}
                      {log.action}{' '}
                      {log.workspace && <span className="text-indigo-300 font-bold">({log.workspace.name})</span>}
                    </p>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
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
