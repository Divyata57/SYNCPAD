'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LiveCursors from './LiveCursors';
import PresenceList from './PresenceList';
import { 
  Heading1, Heading2, Heading3, Text, CheckSquare, 
  Trash2, Lock, ArrowUp, ArrowDown, FileDown, Clock, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'todo';
  content: string;
  lockedBy?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

export default function CollaborativeEditor({ documentId }: { documentId: string }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const blockRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // 1. Fetch document initial contents
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${documentId}`);
        if (res.data.success) {
          setTitle(res.data.document.title);
          // Convert database blocks structure to standard editor state
          const formatted = res.data.document.blocks.map((b: any) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            lockedBy: b.lockedBy ? { id: b.lockedBy, username: 'Collaborator' } : null
          }));
          setBlocks(formatted);
        }
      } catch (err) {
        console.error('Failed to load document:', err);
      }
    };
    fetchDoc();
  }, [documentId]);

  // 2. Setup socket synchronization events
  useEffect(() => {
    if (!socket) return;

    const handleBlockLocked = (data: any) => {
      setBlocks(prev => prev.map(b => b.id === data.blockId ? { ...b, lockedBy: data.lockedBy } : b));
    };

    const handleBlockUnlocked = (data: any) => {
      setBlocks(prev => prev.map(b => b.id === data.blockId ? { 
        ...b, 
        lockedBy: null, 
        content: data.content !== undefined ? data.content : b.content 
      } : b));
    };

    const handleBlockEdited = (data: any) => {
      setBlocks(prev => prev.map(b => b.id === data.blockId ? { ...b, content: data.content } : b));
    };

    const handleBlocksUpdated = (data: any) => {
      const formatted = data.blocks.map((b: any) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        lockedBy: b.lockedBy ? { id: b.lockedBy, username: 'Collaborator' } : null
      }));
      setBlocks(formatted);
    };

    socket.on('block_locked', handleBlockLocked);
    socket.on('block_unlocked', handleBlockUnlocked);
    socket.on('block_edited', handleBlockEdited);
    socket.on('blocks_updated', handleBlocksUpdated);

    return () => {
      socket.off('block_locked', handleBlockLocked);
      socket.off('block_unlocked', handleBlockUnlocked);
      socket.off('block_edited', handleBlockEdited);
      socket.off('blocks_updated', handleBlocksUpdated);
    };
  }, [socket]);

  // Save the full document to database
  const saveDocument = useCallback(async (updatedTitle?: string, updatedBlocks?: Block[]) => {
    setSaveStatus('saving');
    try {
      const requestBlocks = (updatedBlocks || blocks).map(b => ({
        id: b.id,
        type: b.type,
        content: b.content
      }));

      await api.put(`/documents/${documentId}`, {
        title: updatedTitle !== undefined ? updatedTitle : title,
        blocks: requestBlocks
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed auto-saving document:', err);
      setSaveStatus('error');
    }
  }, [documentId, title, blocks]);

  // Debounced auto-save handler for typing contents
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (saveStatus === 'saving') return;
      saveDocument();
    }, 3000); // Autosave every 3 seconds of idle time

    return () => clearTimeout(delayDebounce);
  }, [blocks, title, saveStatus, saveDocument]);

  // Handle focus lock events
  const handleFocus = (blockId: string) => {
    setActiveBlockId(blockId);
    socket?.emit('lock_block', { documentId, blockId });
  };

  // Handle blur unlock events
  const handleBlur = (blockId: string, contentVal: string) => {
    setActiveBlockId(null);
    socket?.emit('unlock_block', { documentId, blockId, content: contentVal });
    saveDocument(title, blocks.map(b => b.id === blockId ? { ...b, content: contentVal } : b));
  };

  // Live cursor typing tracker
  const handleContentChange = (blockId: string, val: string, selectionIndex: number) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, content: val } : b);
    setBlocks(updated);

    // Emit live typing keystroke to collaborators
    socket?.emit('edit_block', { documentId, blockId, content: val });
    
    // Emit live cursor location
    socket?.emit('cursor_move', { documentId, blockId, offset: selectionIndex });
  };

  // Block creation/keyboard actions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string, index: number) => {
    const block = blocks[index];

    if (e.key === 'Enter') {
      e.preventDefault();
      // Add new paragraph block below
      const newBlock: Block = {
        id: 'block-' + Date.now() + Math.random().toString(36).substring(2, 5),
        type: 'p',
        content: ''
      };
      
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      setBlocks(updated);

      // Focus new block on next tick
      setTimeout(() => {
        const nextEl = blockRefs.current[newBlock.id];
        nextEl?.focus();
      }, 20);

      saveDocument(title, updated);
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      // Delete current block, focus block above
      const updated = blocks.filter(b => b.id !== blockId);
      setBlocks(updated);
      
      const focusIndex = Math.max(0, index - 1);
      const prevBlock = blocks[focusIndex];
      
      setTimeout(() => {
        const prevEl = blockRefs.current[prevBlock.id];
        prevEl?.focus();
        // Place cursor at the end of the text
        if (prevEl) {
          prevEl.selectionStart = prevEl.selectionEnd = prevEl.value.length;
        }
      }, 20);

      saveDocument(title, updated);
    }

    // Arrow navigation
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      blockRefs.current[blocks[index - 1].id]?.focus();
    }
    if (e.key === 'ArrowDown' && index < blocks.length - 1) {
      e.preventDefault();
      blockRefs.current[blocks[index + 1].id]?.focus();
    }
  };

  // Change active block formatting type
  const handleTypeChange = (blockId: string, type: 'h1' | 'h2' | 'h3' | 'p' | 'todo') => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, type } : b);
    setBlocks(updated);
    saveDocument(title, updated);
  };

  // Deleting blocks manually
  const handleDeleteBlock = (blockId: string) => {
    if (blocks.length <= 1) return;
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    saveDocument(title, updated);
  };

  // Document Statistics
  const charCount = blocks.reduce((acc, curr) => acc + curr.content.length, 0);
  const wordCount = blocks.reduce((acc, curr) => acc + (curr.content.trim().split(/\s+/).filter(Boolean).length), 0);

  // Markdown Export
  const handleExportMarkdown = () => {
    const mdContent = blocks.map(b => {
      switch (b.type) {
        case 'h1': return `# ${b.content}`;
        case 'h2': return `## ${b.content}`;
        case 'h3': return `### ${b.content}`;
        case 'todo': return `- [ ] ${b.content}`;
        default: return b.content;
      }
    }).join('\n\n');

    const element = document.createElement('a');
    const file = new Blob([`# ${title}\n\n${mdContent}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Fetch version history
  const handleOpenHistory = async () => {
    setShowHistory(true);
    try {
      const res = await api.get(`/documents/${documentId}/versions`);
      if (res.data.success) {
        setHistory(res.data.versionHistory);
      }
    } catch (err) {
      console.error('Failed fetching history:', err);
    }
  };

  const handleRevertVersion = async (versionId: string) => {
    if (!confirm('Revert document to this version? Current progress will be saved in version history.')) return;
    try {
      const res = await api.post(`/documents/${documentId}/versions/${versionId}/revert`);
      if (res.data.success) {
        setTitle(res.data.document.title);
        const formatted = res.data.document.blocks.map((b: any) => ({
          id: b.id,
          type: b.type,
          content: b.content,
          lockedBy: null
        }));
        setBlocks(formatted);
        setShowHistory(false);
        alert('Reverted successfully!');
      }
    } catch (err) {
      console.error('Revert error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Document Sub-Header Control Bar */}
      <div className="h-14 border-b border-border bg-card/15 px-6 flex items-center justify-between shrink-0 glass-panel">
        <div className="flex items-center space-x-4">
          <PresenceList documentId={documentId} />
          
          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Autosave Status badge */}
          <div className="text-[10px] text-muted-foreground flex items-center space-x-1.5 hidden sm:flex">
            {saveStatus === 'saving' && (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                </motion.div>
                <span>Saving to database...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-500" />
                <span>All changes auto-saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <Save className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-400">Autosave failed</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* History */}
          <button
            onClick={handleOpenHistory}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold flex items-center space-x-1"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExportMarkdown}
            className="p-1.5 rounded-lg border border-border bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden md:inline">Export MD</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Sheet Scroller */}
        <div 
          id="document-editor-sheet-scroll"
          className="flex-1 overflow-y-auto p-8 flex justify-center relative"
        >
          <div 
            id="document-editor-sheet"
            className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-xl glass-card min-h-[500px] p-10 relative flex flex-col space-y-6"
          >
            {/* Real-time collaborator cursors layer */}
            <LiveCursors documentId={documentId} />

            {/* Document Title Editor */}
            <input
              type="text"
              placeholder="Untitled Document"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                saveDocument(e.target.value, blocks);
              }}
              className="font-display font-extrabold text-3xl text-foreground placeholder-muted-foreground bg-transparent border-none outline-none w-full"
            />

            <hr className="border-border/60" />

            {/* Blocks Listing */}
            <div className="flex-1 flex flex-col space-y-1.5 relative">
              {blocks.map((block, idx) => {
                const isLocked = !!block.lockedBy && block.lockedBy.id !== user?.id;

                return (
                  <div
                    key={block.id}
                    className="group relative flex items-start space-x-2"
                  >
                    {/* Block Toolbar Controls */}
                    {!isLocked && (
                      <div className="absolute -left-10 top-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 rounded hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Type togglers */}
                        <select
                          value={block.type}
                          onChange={(e) => handleTypeChange(block.id, e.target.value as any)}
                          className="text-[10px] bg-card border border-border rounded px-1 text-muted-foreground outline-none cursor-pointer"
                        >
                          <option value="p">Paragraph</option>
                          <option value="h1">Heading 1</option>
                          <option value="h2">Heading 2</option>
                          <option value="h3">Heading 3</option>
                          <option value="todo">To-do Check</option>
                        </select>
                      </div>
                    )}

                    {/* Block Content Renderers */}
                    <div className="flex-1 relative w-full">
                      {isLocked && (
                        <div className="absolute inset-0 bg-rose-500/5 border border-rose-500/20 rounded-lg pointer-events-none flex items-center justify-between px-3 z-10 animate-pulse">
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1.5">
                            <Lock className="w-3 h-3" /> Block locked by {block.lockedBy?.username}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start w-full">
                        {block.type === 'todo' && (
                          <input 
                            type="checkbox"
                            className="mt-2.5 mr-2 rounded border-border focus:ring-primary text-indigo-600"
                          />
                        )}

                        <textarea
                          id={`editor-block-${block.id}`}
                          ref={(el) => { blockRefs.current[block.id] = el; }}
                          rows={1}
                          disabled={isLocked}
                          placeholder={
                            block.type === 'h1' ? 'Heading 1' :
                            block.type === 'h2' ? 'Heading 2' :
                            block.type === 'h3' ? 'Heading 3' : 'Type content...'
                          }
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value, e.target.selectionStart)}
                          onFocus={() => handleFocus(block.id)}
                          onBlur={(e) => handleBlur(block.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, block.id, idx)}
                          className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden py-1.5 focus:bg-accent/10 rounded px-1 transition-all ${
                            block.type === 'h1' ? 'text-2xl font-bold font-display text-foreground' :
                            block.type === 'h2' ? 'text-xl font-bold font-display text-foreground/90' :
                            block.type === 'h3' ? 'text-lg font-semibold font-display text-foreground/80' :
                            'text-sm text-foreground/90 leading-relaxed'
                          }`}
                          style={{ height: 'auto' }}
                          onInput={(e) => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Counters footer */}
            <div className="border-t border-border/60 pt-4 flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              <span>Sync Pad Editor</span>
              <div className="space-x-3">
                <span>{wordCount} Words</span>
                <span>{charCount} Characters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Version History Drawer Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-80 border-l border-border bg-card flex flex-col z-40 relative shadow-2xl glass-panel"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
                <span className="font-display font-bold text-sm">Version Log History</span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No version snapshots yet. Make edits to register a version.
                  </div>
                ) : (
                  history.map((ver, idx) => (
                    <div
                      key={ver._id}
                      className="p-3 border border-border rounded-xl bg-muted/20 text-xs space-y-2 hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400">Version #{history.length - idx}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Edited by: <span className="font-semibold text-foreground">@{ver.editedBy?.username || 'Collaborator'}</span>
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-border/40">
                        <span className="text-[9px] text-muted-foreground">
                          {ver.blocks?.length || 0} blocks
                        </span>
                        <button
                          onClick={() => handleRevertVersion(ver._id)}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[9px] text-white font-semibold"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
