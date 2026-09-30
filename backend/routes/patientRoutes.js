import express from 'express';
import { getPatients, getPatientById, updatePatient, getRatingSummary, getRatings } from '../controllers/patientController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, getPatients);
router.get('/:id', requireAuth, getPatientById);
router.put('/:id', requireAuth, updatePatient);
router.get('/:id/rating-summary', requireAuth, getRatingSummary);
router.get('/:id/ratings', requireAuth, getRatings);

export default router;
