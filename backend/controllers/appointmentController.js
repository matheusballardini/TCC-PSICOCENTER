import { successResponse, errorResponse } from '../utils/response.js';
import * as appointmentService from '../services/appointmentService.js';

export const listAppointments = async (_req, res, next) => {
  try {
    const data = await appointmentService.getAllAppointments();
    res.json(successResponse('Consultas listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const data = await appointmentService.getAppointmentById(req.params.id);
    res.json(successResponse('Consulta encontrada', data));
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const data = await appointmentService.getUserAppointments(req.user.id);
    res.json(successResponse('Minhas consultas', data));
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    if (!req.body.psicologo_id || !req.body.data || !req.body.horario) {
      return res.status(400).json(errorResponse('psicologo_id, data e horario são obrigatórios', {}, 400));
    }
    const data = await appointmentService.createAppointment({
      ...req.body,
      paciente_id: req.user.id,
      status: 'pendente',
    });
    res.status(201).json(successResponse('Consulta solicitada', data));
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json(errorResponse('status é obrigatório', {}, 400));
    }
    const data = await appointmentService.updateAppointmentStatus(req.params.id, status);
    res.json(successResponse('Status da consulta atualizado', data));
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (appointment.paciente_id !== req.user.id && appointment.psicologo_id !== req.user.id) {
      return res.status(403).json(errorResponse('Você não pode cancelar esta consulta', {}, 403));
    }
    const data = await appointmentService.updateAppointmentStatus(req.params.id, 'cancelada');
    res.json(successResponse('Consulta cancelada', data));
  } catch (error) {
    next(error);
  }
};
