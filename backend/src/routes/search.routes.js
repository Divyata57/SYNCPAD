import express from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', globalSearch);

export default router;
