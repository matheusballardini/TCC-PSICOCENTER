import { successResponse, errorResponse } from '../utils/response.js';
import * as chatService from '../services/chatService.js';

export const createConversation = async (req, res, next) => {
  try {
    if (!req.body.participant_two) {
      return res.status(400).json(errorResponse('participant_two é obrigatório', {}, 400));
    }
    const data = await chatService.createConversation(req.user.id, req.body.participant_two);
    res.status(201).json(successResponse('Conversa criada', data));
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const data = await chatService.getUserConversations(req.user.id);
    res.json(successResponse('Conversas listadas', data));
  } catch (error) {
    next(error);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    const data = await chatService.getConversationMessages(req.params.conversationId);
    res.json(successResponse('Mensagens listadas', data));
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    if (!req.body.content) {
      return res.status(400).json(errorResponse('content é obrigatório', {}, 400));
    }
    const data = await chatService.sendMessage(req.params.conversationId, req.user.id, req.body.content);
    res.status(201).json(successResponse('Mensagem enviada', data));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await chatService.deleteMessage(req.params.messageId);
    res.json(successResponse('Mensagem deletada', {}));
  } catch (error) {
    next(error);
  }
};

export const addAttachment = async (req, res, next) => {
  try {
    const data = await chatService.addChatAttachment(req.params.messageId, {
      ...req.body,
    });
    res.status(201).json(successResponse('Anexo adicionado', data));
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (req, res, next) => {
  try {
    const data = await chatService.getChatAttachments(req.params.messageId);
    res.json(successResponse('Anexos listados', data));
  } catch (error) {
    next(error);
  }
};
