import express from 'express';
import {
  getMessages, sendMessage, deleteMessage, addReaction, addReply, markAsSeen
} from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getMessages);
router.post('/', upload.array('files', 10), sendMessage);
router.delete('/:id', deleteMessage);
router.put('/:id/reaction', addReaction);
router.post('/:id/reply', addReply);
router.post('/seen', markAsSeen);

export default router;
