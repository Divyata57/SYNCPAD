import express from 'express';
import {
  createWorkspace, getWorkspaces, getWorkspaceById, editWorkspace,
  deleteWorkspace, joinWithInviteCode, inviteMember, leaveWorkspace,
  updateMemberRole, removeMember
} from '../controllers/workspace.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.post('/join', joinWithInviteCode);

router.get('/:id', getWorkspaceById);
router.put('/:id', editWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:id/invite', inviteMember);
router.post('/:id/leave', leaveWorkspace);
router.put('/:id/role', updateMemberRole);
router.post('/:id/remove', removeMember);

export default router;
