import express from 'express';
import { listEspecialidades, getEspecialidadeById } from '../controllers/especialidadeController.js';

const router = express.Router();

router.get('/', listEspecialidades);
router.get('/:id', getEspecialidadeById);

export default router;
