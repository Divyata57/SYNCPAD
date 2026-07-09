import express from 'express';
import {
  createDocument, getDocuments, getDocumentById, updateDocument,
  deleteDocument, togglePin, toggleFavorite, getVersionHistory, revertVersion
} from '../controllers/document.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createDocument);
router.get('/', getDocuments);

router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

router.put('/:id/pin', togglePin);
router.put('/:id/favorite', toggleFavorite);

router.get('/:id/versions', getVersionHistory);
router.post('/:id/versions/:versionId/revert', revertVersion);

export default router;
