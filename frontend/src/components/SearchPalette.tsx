'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useRouter } from 'next/navigation';
import { Search, FileText, MessageSquare, Briefcase, User as UserIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    workspaces: any[];
    documents: any[];
    messages: any[];
    users: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?query=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Trigger Button inside navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-accent text-muted-foreground text-sm transition-colors cursor-pointer w-48 md:w-64 justify-between"
      >
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span>Global Search...</span>
        </div>
        <kbd className="hidden sm:inline-block text-[10px]">Ctrl K</kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden glass-panel"
            >
              {/* Header Input */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3 flex-1">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search documents, workspaces, chats, users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-base"
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {loading && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Searching database...
                  </div>
                )}

                {!loading && !results && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Type something to search. Use <kbd className="text-[10px]">↑</kbd> <kbd className="text-[10px]">↓</kbd> and enter to navigate.
                  </div>
                )}

                {!loading && results && (
                  <>
                    {results.workspaces.length === 0 &&
                     results.documents.length === 0 &&
                     results.messages.length === 0 &&
                     results.users.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No matches found.
                      </div>
                    )}

                    {/* Workspaces */}
                    {results.workspaces.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" /> Workspaces
                        </h4>
                        <div className="space-y-1">
                          {results.workspaces.map((ws) => (
                            <button
                              key={ws._id}
                              onClick={() => handleNavigate(`/workspace/${ws._id}`)}
                              className="w-full text-left p-2 rounded-lg hover:bg-accent text-sm flex items-center justify-between group"
                            >
                              <span className="font-medium">{ws.name}</span>
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                Open Workspace →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {results.documents.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Documents
                        </h4>
                        <div className="space-y-1">
                          {results.documents.map((doc) => (
                            <button
                              key={doc._id}
                              onClick={() => handleNavigate(`/workspace/${doc.workspace._id}/doc/${doc._id}`)}
                              className="w-full text-left p-2 rounded-lg hover:bg-accent text-sm flex items-center justify-between group"
                            >
                              <div>
                                <span className="font-medium">{doc.title}</span>
                                <span className="text-[11px] text-muted-foreground block">
                                  Workspace: {doc.workspace?.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                Open Editor →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {results.messages.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Chat Messages
                        </h4>
                        <div className="space-y-1">
                          {results.messages.map((msg) => (
                            <button
                              key={msg._id}
                              onClick={() => handleNavigate(`/workspace/${msg.workspace._id}`)}
                              className="w-full text-left p-2.5 rounded-lg hover:bg-accent text-sm flex flex-col group"
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-bold text-xs text-indigo-400">
                                  @{msg.sender?.username}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  in {msg.workspace?.name}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs line-clamp-1">
                                {msg.content}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {results.users.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" /> Users
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {results.users.map((u) => (
                            <div
                              key={u._id}
                              className="p-2 rounded-lg bg-muted/40 border border-border/50 flex items-center space-x-2"
                            >
                              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.username} className="object-cover w-full h-full" />
                                ) : (
                                  u.username.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-medium text-xs truncate">@{u.username}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
