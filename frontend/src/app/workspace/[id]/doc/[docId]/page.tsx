'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ChatDrawer from '@/components/ChatDrawer';
import CollaborativeEditor from '@/components/CollaborativeEditor';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const workspaceId = params?.id as string;
  const docId = params?.docId as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading document editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Core Editor container sheet */}
        <CollaborativeEditor documentId={docId} />

        {/* Context chat sidebar drawer */}
        <ChatDrawer />
      </div>
    </div>
  );
}
