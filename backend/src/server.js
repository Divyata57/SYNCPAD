import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/config.js';
import { socketManager } from './socket/socketManager.js';

const startServer = async () => {
  // Connect database
  await connectDB();

  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Attach socket manager handlers
  socketManager(io);

  const PORT = config.port;
  server.listen(PORT, () => {
    console.log(`[Server] Server is running on port ${PORT} in ${config.nodeEnv} mode.`);
    console.log(`[Server] Websocket handler initialized. CORS allowed for: ${config.frontendUrl}`);
  });

  // Handle server terminations gracefully
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Process terminated.');
    });
  });
};

startServer().catch(err => {
  console.error('[Server] Critical start failure:', err);
  process.exit(1);
});
