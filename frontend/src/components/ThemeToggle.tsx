'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { user, toggleTheme } = useAuth();

  if (!user) return null;

  const isDark = user.themePreference === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ y: isDark ? 0 : 30, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-5 flex items-center justify-center"
      >
        <Moon className="w-5 h-5 text-indigo-400" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ y: isDark ? -30 : -20, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 m-auto w-5 h-5 flex items-center justify-center"
      >
        <Sun className="w-5 h-5 text-amber-500" />
      </motion.div>
    </button>
  );
}
