import { successResponse, errorResponse } from '../utils/response.js';
import * as reportService from '../services/reportService.js';

export const createReport = async (req, res, next) => {
  try {
    if (!req.body.reported_user_id || !req.body.reason) {
      return res.status(400).json(errorResponse('reported_user_id e reason são obrigatórios', {}, 400));
    }
    const data = await reportService.createReport({
      ...req.body,
      reporter_id: req.user.id,
      status: 'pendente',
    });
    res.status(201).json(successResponse('Denúncia criada', data));
  } catch (error) {
    next(error);
  }
};

export const listReports = async (_req, res, next) => {
  try {
    const data = await reportService.getAllReports();
    res.json(successResponse('Denúncias listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const data = await reportService.getReportById(req.params.id);
    res.json(successResponse('Denúncia encontrada', data));
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const data = await reportService.getUserReports(req.user.id);
    res.json(successResponse('Minhas denúncias', data));
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json(errorResponse('status é obrigatório', {}, 400));
    }
    const data = await reportService.updateReportStatus(req.params.id, status);
    res.json(successResponse('Status da denúncia atualizado', data));
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    await reportService.deleteReport(req.params.id);
    res.json(successResponse('Denúncia removida', {}));
  } catch (error) {
    next(error);
  }
};
