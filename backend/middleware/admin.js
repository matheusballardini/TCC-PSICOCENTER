import { errorResponse } from '../utils/response.js';

export const requireAdmin = (req, res, next) => {
  const profile = req.user?.profile;
  if (profile?.role !== 'administrador') {
    return res.status(403).json(errorResponse('Acesso negado', {}, 403));
  }
  next();
};
