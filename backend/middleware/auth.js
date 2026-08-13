import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { errorResponse } from '../utils/response.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Token de autenticação ausente', {}, 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // O token é assinado por nós mesmos (login usa jwt.sign), não pelo Supabase Auth,
    // então buscamos o usuário pelo id do payload em vez de validar via supabase.auth.getUser.
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(decoded.sub);
    if (error || !userData?.user) {
      return res.status(401).json(errorResponse('Usuário não autenticado', {}, 401));
    }

    req.user = { ...userData.user, jwtPayload: decoded };
    next();
  } catch (error) {
    return res.status(401).json(errorResponse('Token inválido', {}, 401));
  }
};
