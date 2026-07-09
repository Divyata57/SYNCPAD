'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface ActiveUser {
  userId: string;
  username: string;
  avatar?: string;
  socketId: string;
}

export default function PresenceList({ documentId }: { documentId: string }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Record<string, ActiveUser>>({});

  useEffect(() => {
    if (!socket) return;

    // Join document notification logic
    socket.emit('join_document', documentId);

    const handleJoined = (data: any) => {
      setActiveUsers(prev => ({
        ...prev,
        [data.userId]: data
      }));
    };

    const handleLeft = (data: any) => {
      setActiveUsers(prev => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
    };

    socket.on('document_user_joined', handleJoined);
    socket.on('document_user_left', handleLeft);

    // Initial query or heartbeat can register if someone is already editing
    return () => {
      socket.emit('leave_document', documentId);
      socket.off('document_user_joined', handleJoined);
      socket.off('document_user_left', handleLeft);
    };
  }, [socket, documentId]);

  const list = Object.values(activeUsers);

  return (
    <div className="flex items-center space-x-1">
      {/* Current user */}
      {user && (
        <div 
          className="w-7 h-7 rounded-full bg-indigo-600 border border-card flex items-center justify-center font-bold text-white text-[10px] ring-2 ring-emerald-500 ring-offset-1 relative group overflow-hidden"
          title={`You (${user.username})`}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user.username.substring(0, 2).toUpperCase()
          )}
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-card" />
        </div>
      )}

      {/* Other collaborators */}
      {list.map((u) => (
        <div
          key={u.userId}
          className="w-7 h-7 rounded-full bg-slate-700 border border-card flex items-center justify-center font-bold text-white text-[10px] relative group overflow-hidden transition-all hover:scale-105"
          title={`${u.username} is editing`}
        >
          {u.avatar ? (
            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
          ) : (
            u.username.substring(0, 2).toUpperCase()
          )}
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border border-card" />
        </div>
      ))}

      {list.length > 0 && (
        <span className="text-[10px] text-muted-foreground ml-1">
          {list.length} collaborator{list.length > 1 ? 's' : ''} online
        </span>
      )}
    </div>
  );
}
