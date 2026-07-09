'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import ChatDrawer from '../../../components/ChatDrawer';
import { 
  Users, Settings, Copy, Check, FileText, 
  Activity as ActivityIcon, UserCheck, ShieldAlert
} from 'lucide-react';

export default function WorkspaceDashboard() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const workspaceId = params?.id as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Settings modification
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!workspaceId) return;

    const loadWorkspaceData = async () => {
      try {
        const wsRes = await api.get(`/workspaces/${workspaceId}`);
        if (wsRes.data.success) {
          setWorkspace(wsRes.data.workspace);
          setWsName(wsRes.data.workspace.name);
          setWsDesc(wsRes.data.workspace.description || '');
        }

        const docRes = await api.get(`/documents?workspaceId=${workspaceId}`);
        if (docRes.data.success) {
          setDocuments(docRes.data.documents);
        }

        const actRes = await api.get(`/activities?workspaceId=${workspaceId}`);
        if (actRes.data.success) {
          setActivities(actRes.data.activities);
        }
      } catch (err) {
        console.error('Failed to load workspace info:', err);
      }
    };

    loadWorkspaceData();
  }, [workspaceId]);

  const handleCopyInvite = () => {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateWorkspaceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await api.put(`/workspaces/${workspaceId}`, {
        name: wsName,
        description: wsDesc
      });
      if (res.data.success) {
        setSaveSuccess('Settings updated successfully!');
        setWorkspace(res.data.workspace);
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to update settings.');
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await api.put(`/workspaces/${workspaceId}/role`, {
        userId: targetUserId,
        role: newRole
      });
      if (res.data.success) {
        alert('Member role updated.');
        // Reload workspace members
        const wsRes = await api.get(`/workspaces/${workspaceId}`);
        setWorkspace(wsRes.data.workspace);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Role change failed.');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Remove this member from workspace?')) return;
    try {
      const res = await api.post(`/workspaces/${workspaceId}/remove`, {
        userId: targetUserId
      });
      if (res.data.success) {
        alert('Member removed.');
        const wsRes = await api.get(`/workspaces/${workspaceId}`);
        setWorkspace(wsRes.data.workspace);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Removal failed.');
    }
  };

  if (loading || !user || !workspace) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading workspace files...</p>
        </div>
      </div>
    );
  }

  // Check roles
  const userMemberInfo = workspace.members.find((m: any) => m.user._id === user.id);
  const isOwnerOrAdmin = ['owner', 'admin'].includes(userMemberInfo?.role || '');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Main Panel Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header block */}
          <div className="p-6 rounded-2xl border border-border bg-card/40 glass-card flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                Workspace Dashboard
              </span>
              <h2 className="text-2xl font-display font-extrabold mt-1">{workspace.name}</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {workspace.description || 'No description configured.'}
              </p>
            </div>

            {/* Invite button */}
            <div className="mt-4 md:mt-0 p-3 rounded-xl border border-border bg-muted/20 flex items-center space-x-3">
              <div>
                <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wider">Invite Code</span>
                <span className="text-sm font-mono font-bold tracking-wide">{workspace.inviteCode}</span>
              </div>
              <button
                onClick={handleCopyInvite}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow transition-transform hover:scale-105 active:scale-95"
                title="Copy Invite Code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left/Middle Column: Documents & Settings */}
            <div className="xl:col-span-2 space-y-8">
              {/* Documents grid */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Recent Workspace Documents
                </h3>
                {documents.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-muted/5">
                    <p className="text-xs text-muted-foreground">No documents yet. Click '+' in sidebar to create one.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => router.push(`/workspace/${workspaceId}/doc/${doc._id}`)}
                        className="p-4 rounded-xl border border-border bg-card/60 hover:border-indigo-500/50 shadow-sm cursor-pointer transition-all flex flex-col justify-between h-28"
                      >
                        <div>
                          <h4 className="font-display font-bold text-xs truncate">{doc.title}</h4>
                          <span className="text-[9px] text-muted-foreground block mt-1">
                            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1.5 self-end">
                          Open Editor →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workspace Settings (Admins/Owners only) */}
              {isOwnerOrAdmin && (
                <div className="p-6 rounded-2xl border border-border bg-card/50 flex flex-col space-y-4">
                  <h3 className="font-display font-bold text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-400" /> Workspace Settings
                  </h3>
                  
                  {saveError && <p className="text-xs text-rose-400 font-medium">{saveError}</p>}
                  {saveSuccess && <p className="text-xs text-emerald-400 font-medium">{saveSuccess}</p>}

                  <form onSubmit={handleUpdateWorkspaceSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Workspace Name</label>
                        <input
                          type="text"
                          required
                          value={wsName}
                          onChange={(e) => setWsName(e.target.value)}
                          className="w-full text-xs bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
                        <input
                          type="text"
                          value={wsDesc}
                          onChange={(e) => setWsDesc(e.target.value)}
                          className="w-full text-xs bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column: Members list & Activity logs */}
            <div className="space-y-8">
              {/* Workspace Members list */}
              <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-4">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Members List
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {workspace.members.map((member: any) => {
                    const isTargetOwner = member.role === 'owner';
                    return (
                      <div key={member.user._id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0 pb-2 last:pb-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[9px] uppercase text-white">
                            {member.user.username.substring(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold block">@{member.user.username}</span>
                            <span className="text-[9px] text-muted-foreground block">{member.user.email}</span>
                          </div>
                        </div>

                        {/* Role controllers */}
                        {isOwnerOrAdmin && !isTargetOwner && member.user._id !== user.id ? (
                          <div className="flex items-center space-x-1.5">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.user._id, e.target.value)}
                              className="text-[9px] bg-muted border border-border rounded px-1.5 py-0.5 outline-none font-bold text-indigo-400"
                            >
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.user._id)}
                              className="text-[9px] text-rose-400 hover:underline"
                            >
                              Kick
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {member.role}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workspace activity feed */}
              <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-4">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-pink-400" /> Recent Activities
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/80 py-4 text-center">No logged activities.</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act._id} className="text-[11px] leading-relaxed border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <p className="text-foreground">
                          <span className="font-semibold text-indigo-400">@{act.user?.username}</span>{' '}
                          {act.action}
                        </p>
                        <span className="text-[9px] text-muted-foreground/60 block mt-0.5">
                          {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side drawers: Team Chat */}
        <ChatDrawer />
      </div>
    </div>
  );
}
