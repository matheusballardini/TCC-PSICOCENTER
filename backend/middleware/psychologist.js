import { errorResponse } from '../utils/response.js';

export const requirePsychologist = (req, res, next) => {
  const profile = req.user?.profile;
  if (profile?.role !== 'psicologo') {
    return res.status(403).json(errorResponse('Acesso restrito a psicólogos', {}, 403));
  }
  next();
};
