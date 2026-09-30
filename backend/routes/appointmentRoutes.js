import express from 'express';
import {
  listAppointments,
  getAppointmentById,
  getMyAppointments,
  getUnseenCount,
  markAppointmentsSeen,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  rateAppointment,
} from '../controllers/appointmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, listAppointments);
router.get('/me', requireAuth, getMyAppointments);
router.get('/unseen-count', requireAuth, getUnseenCount);
router.post('/mark-seen', requireAuth, markAppointmentsSeen);
router.post('/', requireAuth, createAppointment);
router.get('/:id', requireAuth, getAppointmentById);
router.patch('/:id/status', requireAuth, updateAppointmentStatus);
router.patch('/:id/reschedule', requireAuth, rescheduleAppointment);
router.patch('/:id/cancel', requireAuth, cancelAppointment);
router.post('/:id/rate', requireAuth, rateAppointment);

export default router;
