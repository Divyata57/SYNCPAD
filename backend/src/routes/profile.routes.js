import express from 'express';
import { getProfile, updateProfile, updateThemePreference } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/theme', updateThemePreference);

export default router;
