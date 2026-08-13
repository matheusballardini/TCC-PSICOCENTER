import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(statusCode).json(errorResponse(message, { stack: process.env.NODE_ENV === 'development' ? err.stack : undefined }, statusCode));
};
