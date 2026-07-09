import express from 'express';
import { getAllUsers, suspendUser, deleteWorkspaceAdmin, getAnalytics, getSystemLogs } from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/admin.middleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.delete('/workspaces/:id', deleteWorkspaceAdmin);
router.get('/analytics', getAnalytics);
router.get('/logs', getSystemLogs);

export default router;
