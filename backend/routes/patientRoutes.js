import express from 'express';
import { getPatients, getPatientById, updatePatient } from '../controllers/patientController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, getPatients);
router.get('/:id', requireAuth, getPatientById);
router.put('/:id', requireAuth, updatePatient);

export default router;
