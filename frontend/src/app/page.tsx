'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, FileText, MessageSquare, Shield, 
  Activity, Users, Zap, Check, ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="h-16 px-8 max-w-7xl mx-auto w-full flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SP
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SYNC PAD
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-16 flex flex-col items-center justify-center z-10 space-y-12">
        <div className="text-center max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-xs text-indigo-400 font-semibold mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Real-Time Workspaces</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-tight"
          >
            Collaborate Instantly.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Sync Everything.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            A premium real-time collaborative workspace mapping Notion-style editor document blocks, 
            Slack-style thread messaging, and Figma-style multiplayer cursors. Build your startup hub.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
          >
            <button
              onClick={() => router.push('/signup')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-6 py-3 border border-slate-700 bg-slate-900/30 hover:bg-slate-900 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              Sign In to Account
            </button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pt-8">
          {[
            {
              icon: <Zap className="w-5 h-5 text-amber-400" />,
              title: "Block-Level Sync",
              desc: "Simultaneous editing synced per document paragraph. Edits lock active paragraphs for others to avoid overwrites."
            },
            {
              icon: <Users className="w-5 h-5 text-indigo-400" />,
              title: "Presence Cursors",
              desc: "Figma-style cursors tracking with avatars, unique user colors, and character-level layout calculation."
            },
            {
              icon: <MessageSquare className="w-5 h-5 text-pink-400" />,
              title: "Workspace Chat",
              desc: "Fully integrated team chat rooms with unread counters, emoji reactions, message replies, and file attachments."
            }
          ].map((feat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 glass-card space-y-3 flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 shadow-inner">
                {feat.icon}
              </div>
              <h3 className="font-display font-bold text-base">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-900 text-xs text-slate-500 flex items-center justify-center shrink-0">
        <span>© {new Date().getFullYear()} Sync Pad Collaborative Hub. All rights reserved.</span>
      </footer>
    </div>
  );
}
