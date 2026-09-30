import { successResponse, errorResponse } from '../utils/response.js';
import * as chatService from '../services/chatService.js';

export const listThreads = async (req, res, next) => {
  try {
    const data = await chatService.getThreadsForUser(req.user.id);
    res.json(successResponse('Conversas listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await chatService.getUnreadCount(req.user.id);
    res.json(successResponse('Contagem de não lidas', { count }));
  } catch (error) {
    next(error);
  }
};

export const getThread = async (req, res, next) => {
  try {
    const data = await chatService.getThread(req.user.id, req.params.otherUserId);
    res.json(successResponse('Conversa carregada', data));
  } catch (error) {
    next(error);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const body = (req.body.body || '').trim();
    if (!body) {
      return res.status(400).json(errorResponse('Escreva uma mensagem antes de enviar.', {}, 400));
    }
    if (body.length > 2000) {
      return res.status(400).json(errorResponse('Mensagem muito longa (máximo 2000 caracteres).', {}, 400));
    }
    const data = await chatService.sendMessage(req.user.id, req.params.otherUserId, body);
    res.status(201).json(successResponse('Mensagem enviada', data));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const data = await chatService.deleteMessage(req.user.id, req.params.otherUserId, req.params.messageId);
    res.json(successResponse('Mensagem excluída', data));
  } catch (error) {
    next(error);
  }
};
