import { errorResponse } from '../utils/response.js';

export const requirePatient = (req, res, next) => {
  const profile = req.user?.profile;
  if (profile?.role !== 'paciente') {
    return res.status(403).json(errorResponse('Acesso restrito a pacientes', {}, 403));
  }
  next();
};
