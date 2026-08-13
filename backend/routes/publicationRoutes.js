import express from 'express';
import {
  listPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
  getComments,
  addComment,
  deleteComment,
  toggleLike,
  toggleSave,
  getMySavedPublications,
} from '../controllers/publicationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePsychologist } from '../middleware/psychologist.js';

const router = express.Router();

router.get('/', listPublications);
router.post('/', requireAuth, requirePsychologist, createPublication);
router.get('/:id', getPublicationById);
router.put('/:id', requireAuth, updatePublication);
router.delete('/:id', requireAuth, deletePublication);

router.get('/:id/comments', getComments);
router.post('/:id/comments', requireAuth, addComment);
router.delete('/:id/comments/:commentId', requireAuth, deleteComment);

router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/save', requireAuth, toggleSave);
router.get('/me/saved', requireAuth, getMySavedPublications);

export default router;
