import express from 'express';
import {
  getPsychologists,
  getPsychologistById,
  updatePsychologist,
  getPsychologistSpecialties,
  addSpecialty,
  removeSpecialty,
  getAvailability,
  setAvailability,
  getRatings,
  createRating,
} from '../controllers/psychologistController.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePsychologist } from '../middleware/psychologist.js';

const router = express.Router();

// lista e perfil públicos de psicólogos (não requer autenticação)
router.get('/', getPsychologists);
router.get('/:id', getPsychologistById);
router.put('/:id', requireAuth, updatePsychologist);

router.get('/:id/specialties', requireAuth, getPsychologistSpecialties);
router.post('/:id/specialties', requireAuth, requirePsychologist, addSpecialty);
router.delete('/:id/specialties', requireAuth, requirePsychologist, removeSpecialty);

router.get('/:id/availability', getAvailability);
router.put('/:id/availability', requireAuth, requirePsychologist, setAvailability);

router.get('/:id/ratings', getRatings);
router.post('/:id/ratings', requireAuth, createRating);

export default router;
