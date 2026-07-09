'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import SearchPalette from './SearchPalette';
import ThemeToggle from './ThemeToggle';
import { Bell, User as UserIcon, LogOut, Settings, Shield, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socket.on('notification_received', handleNotification);
    return () => {
      socket.off('notification_received', handleNotification);
    };
  }, [socket]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark read all:', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <nav className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between glass-panel">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 tracking-wider">
          SP
        </div>
        <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent hidden sm:inline-block">
          SYNC PAD
        </span>
      </div>

      {/* Center Options: Search */}
      {user && (
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <SearchPalette />
        </div>
      )}

      {/* Right side items */}
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="md:hidden">
              <SearchPalette />
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground relative transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-hidden rounded-xl border border-border bg-card shadow-2xl glass-card flex flex-col"
                  >
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="font-bold text-xs">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-indigo-400 font-semibold hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto max-h-[20rem] divide-y divide-border/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3 text-xs flex gap-2.5 items-start transition-colors ${
                              notif.isRead ? 'opacity-70 hover:bg-accent/40' : 'bg-indigo-500/5 hover:bg-accent/50'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                              {notif.sender?.username ? notif.sender.username.substring(0, 2).toUpperCase() : 'SP'}
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground text-[11px] leading-relaxed">
                                <span className="font-semibold">@{notif.sender?.username || 'System'}</span>{' '}
                                {notif.content}
                              </p>
                              <span className="text-[9px] text-muted-foreground mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!notif.isRead && (
                              <button
                                onClick={() => markRead(notif._id)}
                                className="p-1 rounded hover:bg-accent text-indigo-400 shrink-0"
                                title="Mark read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5 border border-border"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="object-cover w-full h-full" />
                  ) : (
                    user.username.substring(0, 2).toUpperCase()
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-2xl glass-card overflow-hidden"
                  >
                    <div className="p-3 border-b border-border bg-muted/20">
                      <p className="font-semibold text-xs truncate">@{user.username}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => { setShowProfileDropdown(false); router.push('/profile'); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-xs flex items-center space-x-2"
                      >
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => { setShowProfileDropdown(false); router.push('/settings'); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-xs flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>Session Settings</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setShowProfileDropdown(false); router.push('/admin'); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-xs flex items-center space-x-2 text-rose-400 hover:text-rose-300"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </button>
                      )}

                      <hr className="my-1 border-border/60" />

                      <button
                        onClick={() => { setShowProfileDropdown(false); logout(); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
