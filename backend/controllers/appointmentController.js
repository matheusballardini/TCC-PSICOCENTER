import { successResponse, errorResponse } from '../utils/response.js';
import * as appointmentService from '../services/appointmentService.js';
import * as psychologistService from '../services/psychologistService.js';

const DIA_SEMANA_CODIGO = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// mesma checagem feita no frontend (js/agendar_consulta.js), repetida aqui pra não
// depender só do JavaScript do navegador: pega o dia da semana da data escolhida
// e confere contra os horários que o psicólogo cadastrou
const isWithinAvailability = (psicologo, data, horario) => {
  let slots = [];
  try {
    slots = typeof psicologo.disponibilidade === 'string'
      ? JSON.parse(psicologo.disponibilidade)
      : (psicologo.disponibilidade || []);
  } catch (e) {
    slots = [];
  }
  if (!Array.isArray(slots) || slots.length === 0) return true;

  const diaCodigo = DIA_SEMANA_CODIGO[new Date(data + 'T00:00:00').getDay()];
  const slotsDoDia = slots.filter((slot) => slot.day === diaCodigo);
  if (!slotsDoDia.length) return false;

  return slotsDoDia.some((slot) => horario >= slot.start && horario <= slot.end);
};

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

    const psicologo = await psychologistService.getPsychologistById(req.body.psicologo_id);
    if (!isWithinAvailability(psicologo, req.body.data, req.body.horario)) {
      return res.status(400).json(errorResponse('Esse horário está fora da disponibilidade do psicólogo.', {}, 400));
    }

    const data = await appointmentService.createAppointment({
      ...req.body,
      paciente_id: req.user.id,
      status: 'pendente',
    });
    res.status(201).json(successResponse('Consulta solicitada', data));
  } catch (error) {
    // sessão antiga apontando pra uma conta sem cadastro de paciente completo no banco
    if (error.code === '23503' && error.message?.includes('patient_id')) {
      return res.status(401).json(errorResponse('Sua sessão está desatualizada. Saia e faça login novamente.', {}, 401));
    }
    if (error.code === '23503' && error.message?.includes('psychologist_id')) {
      return res.status(400).json(errorResponse('Psicólogo selecionado não foi encontrado.', {}, 400));
    }
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
