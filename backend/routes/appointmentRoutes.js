import express from 'express';
import {
  listAppointments,
  getAppointmentById,
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} from '../controllers/appointmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, listAppointments);
router.get('/me', requireAuth, getMyAppointments);
router.post('/', requireAuth, createAppointment);
router.get('/:id', requireAuth, getAppointmentById);
router.patch('/:id/status', requireAuth, updateAppointmentStatus);
router.patch('/:id/cancel', requireAuth, cancelAppointment);

export default router;
