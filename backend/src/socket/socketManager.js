import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/User.js';
import Document from '../models/Document.js';

export const socketManager = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error: Token missing.'));

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('username email avatar role');
      if (!user) return next(new Error('Authentication error: User not found.'));

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid credentials.'));
    }
  });

  const onlineUsers = new Map(); // userId string -> { socketId, userId, username, avatar }

  io.on('connection', (socket) => {
    const user = socket.user;
    const userIdStr = user._id.toString();

    console.log(`[Socket] User connected: ${user.username} (${socket.id})`);

    onlineUsers.set(userIdStr, {
      socketId: socket.id,
      userId: user._id,
      username: user.username,
      avatar: user.avatar
    });

    socket.on('join_workspace', (workspaceId) => {
      const roomName = `workspace_${workspaceId}`;
      socket.join(roomName);
      console.log(`[Socket] ${user.username} joined: ${roomName}`);

      io.to(roomName).emit('workspace_user_online', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar
      });

      const list = [];
      onlineUsers.forEach((val) => list.push(val));
      socket.emit('online_members_list', list);
    });

    socket.on('leave_workspace', (workspaceId) => {
      const roomName = `workspace_${workspaceId}`;
      socket.leave(roomName);
      io.to(roomName).emit('workspace_user_offline', { userId: user._id });
    });

    socket.on('join_document', (documentId) => {
      const roomName = `document_${documentId}`;
      socket.join(roomName);
      console.log(`[Socket] ${user.username} joined document room: ${roomName}`);

      socket.to(roomName).emit('document_user_joined', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        socketId: socket.id
      });
    });

    socket.on('leave_document', async (documentId) => {
      const roomName = `document_${documentId}`;
      socket.leave(roomName);
      console.log(`[Socket] ${user.username} left document room: ${roomName}`);

      // Auto-unlock blocks held by this user
      try {
        const doc = await Document.findById(documentId);
        if (doc) {
          let hasChanges = false;
          doc.blocks.forEach(b => {
            if (b.lockedBy && b.lockedBy.toString() === userIdStr) {
              b.lockedBy = null;
              b.lockedAt = null;
              hasChanges = true;
            }
          });
          if (hasChanges) {
            await doc.save();
            io.to(roomName).emit('blocks_updated', { blocks: doc.blocks });
          }
        }
      } catch (err) {
        console.error('Error auto-unlocking blocks on leave:', err);
      }

      socket.to(roomName).emit('document_user_left', { userId: user._id });
    });

    socket.on('cursor_move', (data) => {
      // data: { documentId, blockId, offset }
      socket.to(`document_${data.documentId}`).emit('cursor_moved', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        blockId: data.blockId,
        offset: data.offset,
        color: getUserColor(userIdStr)
      });
    });

    socket.on('lock_block', async (data) => {
      // data: { documentId, blockId }
      try {
        const doc = await Document.findById(data.documentId);
        if (doc) {
          const block = doc.blocks.id(data.blockId);
          if (block && (!block.lockedBy || block.lockedBy.toString() === userIdStr)) {
            block.lockedBy = user._id;
            block.lockedAt = new Date();
            await doc.save();

            io.to(`document_${data.documentId}`).emit('block_locked', {
              blockId: data.blockId,
              lockedBy: {
                id: user._id,
                username: user.username,
                avatar: user.avatar
              }
            });
          }
        }
      } catch (err) {
        console.error('Lock block error:', err);
      }
    });

    socket.on('unlock_block', async (data) => {
      // data: { documentId, blockId, content }
      try {
        const doc = await Document.findById(data.documentId);
        if (doc) {
          const block = doc.blocks.id(data.blockId);
          if (block && block.lockedBy && block.lockedBy.toString() === userIdStr) {
            block.lockedBy = null;
            block.lockedAt = null;
            if (data.content !== undefined) {
              block.content = data.content;
            }
            await doc.save();

            io.to(`document_${data.documentId}`).emit('block_unlocked', {
              blockId: data.blockId,
              content: block.content
            });
          }
        }
      } catch (err) {
        console.error('Unlock block error:', err);
      }
    });

    socket.on('edit_block', (data) => {
      // data: { documentId, blockId, content }
      socket.to(`document_${data.documentId}`).emit('block_edited', {
        blockId: data.blockId,
        content: data.content,
        editedBy: user._id
      });
    });

    socket.on('typing', (data) => {
      // data: { workspaceId, isTyping } or { documentId, blockId, isTyping }
      if (data.workspaceId) {
        socket.to(`workspace_${data.workspaceId}`).emit('user_typing_chat', {
          userId: user._id,
          username: user.username,
          isTyping: data.isTyping
        });
      } else if (data.documentId) {
        socket.to(`document_${data.documentId}`).emit('user_typing_doc', {
          userId: user._id,
          username: user.username,
          blockId: data.blockId,
          isTyping: data.isTyping
        });
      }
    });

    socket.on('new_chat_message', (data) => {
      // data: { workspaceId, message }
      io.to(`workspace_${data.workspaceId}`).emit('chat_message_received', data.message);
    });

    socket.on('disconnecting', async () => {
      console.log(`[Socket] User disconnecting: ${user.username}`);
      onlineUsers.delete(userIdStr);

      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room.startsWith('workspace_')) {
          socket.to(room).emit('workspace_user_offline', { userId: user._id });
        }
      });

      // Clear any locks this socket leaves behind across all documents
      try {
        const docs = await Document.find({ 'blocks.lockedBy': user._id });
        for (const doc of docs) {
          let changed = false;
          doc.blocks.forEach(b => {
            if (b.lockedBy && b.lockedBy.toString() === userIdStr) {
              b.lockedBy = null;
              b.lockedAt = null;
              changed = true;
            }
          });
          if (changed) {
            await doc.save();
            io.to(`document_${doc._id}`).emit('blocks_updated', { blocks: doc.blocks });
          }
        }
      } catch (err) {
        console.error('Error cleaning locks on socket disconnect:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected completely: ${user.username}`);
    });
  });
};

const getUserColor = (userId) => {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4'
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
};
