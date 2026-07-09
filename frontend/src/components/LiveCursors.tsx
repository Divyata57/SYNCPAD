'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RemoteCursor {
  userId: string;
  username: string;
  avatar?: string;
  blockId: string;
  offset: number;
  color: string;
}

export default function LiveCursors({ documentId }: { documentId: string }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const [positions, setPositions] = useState<Record<string, { top: number; left: number }>>({});

  useEffect(() => {
    if (!socket) return;

    const handleCursorMoved = (data: any) => {
      if (data.userId === user?.id) return;
      setCursors(prev => ({
        ...prev,
        [data.userId]: data
      }));
    };

    const handleUserLeft = (data: any) => {
      setCursors(prev => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
      setPositions(prev => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
    };

    socket.on('cursor_moved', handleCursorMoved);
    socket.on('document_user_left', handleUserLeft);

    return () => {
      socket.off('cursor_moved', handleCursorMoved);
      socket.off('document_user_left', handleUserLeft);
    };
  }, [socket, user, documentId]);

  // Recalculate visual positions of cursors relative to document editor container
  useEffect(() => {
    const updatePositions = () => {
      const editorContainer = document.getElementById('document-editor-sheet');
      if (!editorContainer) return;

      const containerRect = editorContainer.getBoundingClientRect();
      const newPositions: Record<string, { top: number; left: number }> = {};

      Object.entries(cursors).forEach(([userId, cursor]) => {
        const blockElement = document.getElementById(`editor-block-${cursor.blockId}`);
        if (blockElement) {
          const blockRect = blockElement.getBoundingClientRect();
          
          // Compute location
          // Estimate character position width based on character offset
          // Standard estimate: 7px per character in monospace/sans-serif text
          const charOffsetWidth = Math.min(cursor.offset * 7.2, blockRect.width - 20);
          
          const relativeTop = blockRect.top - containerRect.top + 4; // slight padding offset
          const relativeLeft = Math.max(8, blockRect.left - containerRect.left + charOffsetWidth);

          newPositions[userId] = {
            top: relativeTop,
            left: relativeLeft
          };
        }
      });

      setPositions(newPositions);
    };

    updatePositions();

    // Re-verify on resize or scrolls
    window.addEventListener('resize', updatePositions);
    const scrollContainer = document.getElementById('document-editor-sheet-scroll');
    scrollContainer?.addEventListener('scroll', updatePositions);

    const interval = setInterval(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', updatePositions);
      scrollContainer?.removeEventListener('scroll', updatePositions);
      clearInterval(interval);
    };
  }, [cursors]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <AnimatePresence>
        {Object.entries(cursors).map(([userId, cursor]) => {
          const pos = positions[userId];
          if (!pos) return null;

          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: pos.left, y: pos.top }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 250, mass: 0.1 }}
              className="absolute top-0 left-0 flex flex-col items-start collaborator-cursor"
            >
              {/* Cursor line */}
              <div 
                className="w-0.5 h-5 relative" 
                style={{ backgroundColor: cursor.color }}
              >
                {/* Username label overlay */}
                <div 
                  className="absolute left-1 top-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap shadow flex items-center gap-1"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.avatar ? (
                    <img src={cursor.avatar} alt={cursor.username} className="w-3 h-3 rounded-full object-cover" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20 flex items-center justify-center text-[7px]">
                      {cursor.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{cursor.username}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
