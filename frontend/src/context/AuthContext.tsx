'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  phone?: string;
  role: 'user' | 'admin';
  themePreference: 'light' | 'dark';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  toggleTheme: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/profile');
        if (res.data.success) {
          setUser(res.data.user);
          applyTheme(res.data.user.themePreference);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      applyTheme(res.data.user.themePreference);
      router.push('/dashboard');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    await api.post('/auth/register', { username, email, password });
  };

  const logout = async () => {
    const token = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken: token });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    if (updates.themePreference) {
      applyTheme(updates.themePreference);
    }
  };

  const toggleTheme = async () => {
    if (!user) return;
    const newTheme = user.themePreference === 'dark' ? 'light' : 'dark';
    try {
      const res = await api.put('/profile/theme', { themePreference: newTheme });
      if (res.data.success) {
        updateUser({ themePreference: newTheme });
      }
    } catch (err) {
      console.error('Theme change failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
