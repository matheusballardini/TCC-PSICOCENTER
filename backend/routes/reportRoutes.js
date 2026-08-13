import express from 'express';
import {
  createReport,
  listReports,
  getReportById,
  getMyReports,
  updateReportStatus,
  deleteReport,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.post('/', requireAuth, createReport);
router.get('/', requireAuth, requireAdmin, listReports);
router.get('/me', requireAuth, getMyReports);
router.get('/:id', requireAuth, requireAdmin, getReportById);
router.patch('/:id/status', requireAuth, requireAdmin, updateReportStatus);
router.delete('/:id', requireAuth, requireAdmin, deleteReport);

export default router;
