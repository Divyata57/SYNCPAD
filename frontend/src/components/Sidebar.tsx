'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, FileText, ChevronDown, MessageSquare, 
  Settings, LogOut, ChevronLeft, ChevronRight, UserPlus, Trash, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  const workspaceId = params?.id as string;
  const docId = params?.docId as string;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showWorkspaceSelect, setShowWorkspaceSelect] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get('/workspaces');
        if (res.data.success) {
          setWorkspaces(res.data.workspaces);
          if (workspaceId) {
            const found = res.data.workspaces.find((w: any) => w._id === workspaceId);
            setCurrentWorkspace(found);
          } else if (res.data.workspaces.length > 0) {
            // If on general dashboard, default selection
            setCurrentWorkspace(res.data.workspaces[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      }
    };
    fetchWorkspaces();
  }, [workspaceId]);

  // Fetch workspace documents
  useEffect(() => {
    if (!workspaceId) return;
    const fetchDocs = async () => {
      try {
        const res = await api.get(`/documents?workspaceId=${workspaceId}`);
        if (res.data.success) {
          setDocuments(res.data.documents);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };
    fetchDocs();
  }, [workspaceId]);

  // Listen for real-time document adjustments (additions, deletions)
  useEffect(() => {
    if (!socket || !workspaceId) return;

    socket.emit('join_workspace', workspaceId);

    const handleDocCreated = (newDoc: any) => {
      setDocuments(prev => [newDoc, ...prev]);
    };

    const handleDocDeleted = (deletedId: any) => {
      setDocuments(prev => prev.filter(d => d._id !== deletedId));
      if (docId === deletedId) {
        router.push(`/workspace/${workspaceId}`);
      }
    };

    socket.on('document_created_broadcast', handleDocCreated);
    socket.on('document_deleted_broadcast', handleDocDeleted);

    return () => {
      socket.emit('leave_workspace', workspaceId);
      socket.off('document_created_broadcast', handleDocCreated);
      socket.off('document_deleted_broadcast', handleDocDeleted);
    };
  }, [socket, workspaceId, docId]);

  const handleCreateDocument = async () => {
    if (!workspaceId) return;
    try {
      const res = await api.post('/documents', {
        workspaceId,
        title: 'Untitled Document'
      });
      if (res.data.success) {
        const newDoc = res.data.document;
        setDocuments(prev => [newDoc, ...prev]);
        
        // Broadcast via socket
        socket?.emit('document_created', { workspaceId, document: newDoc });

        router.push(`/workspace/${workspaceId}/doc/${newDoc._id}`);
      }
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data.success) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        socket?.emit('document_deleted', { workspaceId, documentId: id });
        if (docId === id) {
          router.push(`/workspace/${workspaceId}`);
        }
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await api.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      if (res.data.success) {
        setInviteSuccess(`Successfully invited member!`);
        setInviteEmail('');
      }
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to send invite.');
    }
  };

  if (!workspaceId) return null;

  return (
    <div 
      className={`h-[calc(100vh-4rem)] border-r border-border bg-card/45 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 -right-3.5 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-md cursor-pointer z-50 transition-shadow"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Top Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {/* Workspace Switcher */}
        {!isCollapsed && currentWorkspace && (
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceSelect(!showWorkspaceSelect)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-accent text-sm font-semibold transition-all"
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                  {currentWorkspace.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{currentWorkspace.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
            </button>

            <AnimatePresence>
              {showWorkspaceSelect && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 glass-card"
                >
                  <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                    {workspaces.map((w) => (
                      <button
                        key={w._id}
                        onClick={() => {
                          setShowWorkspaceSelect(false);
                          router.push(`/workspace/${w._id}`);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center space-x-2 hover:bg-accent ${
                          w._id === workspaceId ? 'bg-indigo-500/10 text-indigo-400' : 'text-foreground'
                        }`}
                      >
                        <span className="font-bold w-4 h-4 rounded bg-border text-center text-[10px]">
                          {w.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{w.name}</span>
                      </button>
                    ))}
                    <hr className="my-1 border-border/60" />
                    <button
                      onClick={() => { setShowWorkspaceSelect(false); router.push('/dashboard'); }}
                      className="w-full text-left p-2 text-xs font-semibold text-indigo-400 hover:bg-accent rounded-lg"
                    >
                      + Create/Join Workspace
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center py-2 space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg"
              title="Dashboard"
            >
              {currentWorkspace?.name.charAt(0).toUpperCase() || 'W'}
            </button>
          </div>
        )}

        {/* Document section */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              <span>Documents</span>
              <button
                onClick={handleCreateDocument}
                className="p-1 rounded hover:bg-accent text-indigo-400 hover:text-indigo-300"
                title="Create Document"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {documents.length === 0 && !isCollapsed && (
              <div className="text-[11px] text-muted-foreground/80 px-2 py-3">
                No documents found. Click + to create one.
              </div>
            )}

            {documents.map((doc) => {
              const isActive = docId === doc._id;
              return (
                <button
                  key={doc._id}
                  onClick={() => router.push(`/workspace/${workspaceId}/doc/${doc._id}`)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors hover:bg-accent/80 ${
                    isActive ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500' : 'text-foreground/90'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    {!isCollapsed && <span className="truncate">{doc.title}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-400 rotate-45 shrink-0" />}
                      <span
                        onClick={(e) => handleDeleteDocument(doc._id, e)}
                        className="p-0.5 rounded text-rose-400 hover:bg-rose-500/10 shrink-0 cursor-pointer"
                        title="Delete document"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-3 border-t border-border bg-muted/10 space-y-1">
        {!isCollapsed && (
          <>
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center space-x-2 hover:bg-accent text-indigo-400 font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Members</span>
            </button>
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center space-x-2 hover:bg-accent ${
                pathname === `/workspace/${workspaceId}` ? 'bg-indigo-500/10 text-indigo-400' : 'text-foreground'
              }`}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>Workspace Dashboard</span>
            </button>
          </>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 rounded-lg hover:bg-accent text-indigo-400"
              title="Invite member"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
              title="Workspace dashboard"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-card border border-border p-6 rounded-2xl glass-card relative"
          >
            <h3 className="font-display font-bold text-lg mb-2">Invite Members to Workspace</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add members by email and assign roles to collaborate inside your documents and chat boards.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1 block">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 outline-none"
                >
                  <option value="admin">Admin (Invite, edit, delete)</option>
                  <option value="editor">Editor (Edit documents & chat)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              {inviteError && <p className="text-xs text-rose-400 font-medium">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-400 font-medium">{inviteSuccess}</p>}

              <div className="flex space-x-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteError('');
                    setInviteSuccess('');
                  }}
                  className="px-4 py-2 border border-border text-xs rounded-lg hover:bg-accent text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
