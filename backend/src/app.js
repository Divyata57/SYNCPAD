import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import documentRoutes from './routes/document.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityRoutes from './routes/activity.routes.js';
import profileRoutes from './routes/profile.routes.js';
import searchRoutes from './routes/search.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading uploaded assets in frontend
}));

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rate limiter
app.use('/api/', apiLimiter);

// Route mappings
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Error handling
app.use(errorHandler);

export default app;
