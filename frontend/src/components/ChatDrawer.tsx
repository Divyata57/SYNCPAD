'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Send, Smile, CornerDownRight, X, Trash2, Paperclip, 
  MessageCircle, File, Download, Loader2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatDrawer() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeThreadMsg, setActiveThreadMsg] = useState<any | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Fetch messages on load
  useEffect(() => {
    if (!workspaceId) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages?workspaceId=${workspaceId}`);
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();
  }, [workspaceId]);

  // Socket chat listeners
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const handleNewMessage = (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
      
      // Update seen status
      api.post('/messages/seen', { workspaceId }).catch(() => {});
    };

    const handleUserTyping = (data: any) => {
      if (data.userId === user?.id) return;
      if (data.isTyping) {
        setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.username));
      }
    };

    socket.on('chat_message_received', handleNewMessage);
    socket.on('user_typing_chat', handleUserTyping);

    return () => {
      socket.off('chat_message_received', handleNewMessage);
      socket.off('user_typing_chat', handleUserTyping);
    };
  }, [socket, workspaceId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Typing indicator trigger
  const handleContentChange = (val: string) => {
    setContent(val);
    if (!socket || !workspaceId) return;

    socket.emit('typing', { workspaceId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { workspaceId, isTyping: false });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('workspaceId', workspaceId);
      formData.append('content', content);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });

      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        socket?.emit('new_chat_message', { workspaceId, message: res.data.message });
        
        setContent('');
        setSelectedFiles([]);
        if (socket) socket.emit('typing', { workspaceId, isTyping: false });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await api.delete(`/messages/${msgId}`);
      if (res.data.success) {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await api.put(`/messages/${msgId}/reaction`, { emoji });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? res.data.message : m));
      }
    } catch (err) {
      console.error('Reaction toggle error:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThreadMsg) return;

    try {
      const res = await api.post(`/messages/${activeThreadMsg._id}/reply`, { content: replyContent });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === activeThreadMsg._id ? res.data.message : m));
        setActiveThreadMsg(res.data.message);
        setReplyContent('');
        setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  return (
    <div className="w-80 h-full border-l border-border bg-card/35 backdrop-blur-md flex flex-col glass-panel relative">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="font-display font-bold text-sm">Team Collaboration Chat</h3>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender?._id === user?.id;
          return (
            <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-muted-foreground">
                  @{msg.sender?.username}
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center group max-w-[85%] space-x-1">
                {isOwn && (
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    className="p-1 rounded text-muted-foreground/60 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div 
                  className={`p-2.5 rounded-2xl text-xs shadow-sm ${
                    isOwn 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-secondary text-foreground rounded-tl-none border border-border/80'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* Attachments rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-white/20 pt-1.5">
                      {msg.attachments.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/10 text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <File className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                          </div>
                          <a
                            href={file.url}
                            download
                            className="p-1 rounded hover:bg-black/20 text-indigo-200"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!isOwn && (
                  <button
                    onClick={() => setActiveThreadMsg(msg)}
                    className="p-1 rounded text-muted-foreground/60 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Reply thread"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Reactions Bar */}
              <div className="flex gap-1.5 mt-1">
                {['👍', '❤️', '🔥', '😂'].map((emoji) => {
                  const react = msg.reactions?.find((r: any) => r.emoji === emoji);
                  const active = react?.users.includes(user?.id);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(msg._id, emoji)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
                        active 
                          ? 'bg-indigo-500/20 border-indigo-400/80 text-indigo-400' 
                          : 'bg-muted border-border/80 text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {emoji} {react?.users.length || 0}
                    </button>
                  );
                })}
              </div>

              {/* Reply count details */}
              {msg.replies && msg.replies.length > 0 && (
                <button
                  onClick={() => setActiveThreadMsg(msg)}
                  className="text-[10px] text-indigo-400 font-semibold hover:underline mt-1.5 flex items-center space-x-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>{msg.replies.length} replies</span>
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1.5 text-[10px] text-muted-foreground bg-muted/10 italic flex items-center gap-1.5 shrink-0 border-t border-border/60">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
          <span>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</span>
        </div>
      )}

      {/* Uploading Progress */}
      {uploading && (
        <div className="px-4 py-2 border-t border-border bg-indigo-500/5 shrink-0">
          <div className="flex items-center justify-between text-[10px] mb-1 font-semibold text-indigo-400">
            <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading attachment...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-border h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* File Queue Indicator */}
      {selectedFiles.length > 0 && (
        <div className="p-2 bg-muted/40 border-t border-border shrink-0 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-card border border-border rounded px-1.5 py-0.5 text-[9px]">
              <File className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[80px]">{file.name}</span>
              <button 
                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                className="text-rose-400 hover:text-rose-300 ml-1 font-bold text-[8px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center space-x-2 shrink-0 bg-muted/10">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) setSelectedFiles(Array.from(e.target.files));
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder="Message workspace..."
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full bg-muted/40 border border-border text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground/80"
        />
        <button
          type="submit"
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Replies Thread Drawer overlay */}
      <AnimatePresence>
        {activeThreadMsg && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-card border-l border-border flex flex-col z-50 shadow-2xl"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/15">
              <span className="font-display font-bold text-xs">Message Thread</span>
              <button 
                onClick={() => setActiveThreadMsg(null)}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original Message */}
            <div className="p-4 bg-muted/30 border-b border-border text-xs">
              <div className="flex items-center space-x-1.5 mb-1 text-muted-foreground font-bold">
                <span>@{activeThreadMsg.sender?.username}</span>
                <span className="text-[9px] font-normal opacity-70">
                  {new Date(activeThreadMsg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-foreground leading-relaxed">{activeThreadMsg.content}</p>
            </div>

            {/* Replies List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThreadMsg.replies && activeThreadMsg.replies.map((reply: any, idx: number) => (
                <div key={idx} className="flex flex-col bg-muted/20 border border-border/50 p-2.5 rounded-xl text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between mb-1 font-bold text-indigo-400">
                    <span>@{reply.sender?.username || 'Unknown'}</span>
                    <span className="text-[8px] text-muted-foreground font-normal">
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-foreground/90">{reply.content}</p>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-border flex items-center space-x-2 bg-muted/5">
              <input
                type="text"
                placeholder="Reply to message..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-muted/40 border border-border text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
