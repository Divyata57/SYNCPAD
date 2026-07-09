'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-pink-500/10 rounded-full blur-[100px]" />

      <div className="text-center space-y-6 max-w-sm z-10">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-display font-extrabold">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The workspace pad or document you are trying to access does not exist or has been deleted.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
