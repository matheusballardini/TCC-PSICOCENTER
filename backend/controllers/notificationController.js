import { successResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';

export const listNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id);
    res.json(successResponse('Notificações listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    const data = await notificationService.getNotificationById(req.params.id);
    res.json(successResponse('Notificação encontrada', data));
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markNotificationAsRead(req.params.id);
    res.json(successResponse('Notificação marcada como lida', data));
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAllNotificationsAsRead(req.user.id);
    res.json(successResponse('Todas as notificações marcadas como lidas', data));
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.json(successResponse('Notificação removida', {}));
  } catch (error) {
    next(error);
  }
};
