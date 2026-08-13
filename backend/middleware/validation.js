import { errorResponse } from '../utils/response.js';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    const data = await schema.validateAsync(req.body, { abortEarly: false });
    req.body = data;
    next();
  } catch (error) {
    return res.status(400).json(errorResponse('Dados inválidos', error.details || error, 400));
  }
};
