import { successResponse, errorResponse } from '../utils/response.js';
import * as appointmentService from '../services/appointmentService.js';
import * as psychologistService from '../services/psychologistService.js';
import * as ratingService from '../services/ratingService.js';

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

export const getUnseenCount = async (req, res, next) => {
  try {
    const count = await appointmentService.getUnseenAppointmentsCount(req.user.id);
    res.json(successResponse('Contagem de agendamentos novos', { count }));
  } catch (error) {
    next(error);
  }
};

export const markAppointmentsSeen = async (req, res, next) => {
  try {
    await appointmentService.markAppointmentsSeen(req.user.id);
    res.json(successResponse('Agendamentos marcados como vistos', {}));
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    if (!req.body.psicologo_id || !req.body.data || !req.body.horario) {
      return res.status(400).json(errorResponse('psicologo_id, data e horario são obrigatórios', {}, 400));
    }

    const dataHoraEscolhida = new Date(`${req.body.data}T${req.body.horario}:00`);
    if (dataHoraEscolhida.getTime() < Date.now()) {
      return res.status(400).json(errorResponse('Não é possível agendar uma consulta em uma data ou horário que já passou.', {}, 400));
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

// Muda a data/horário de uma consulta ainda pendente — pensado pro caso de
// paciente e psicólogo combinarem um horário melhor conversando pelo chat
// antes da consulta ser aceita. Só o psicólogo pode propor o novo horário
// (o paciente só acompanha e, se quiser outro horário, pode cancelar e pedir de novo).
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { data, horario } = req.body;
    if (!data || !horario) {
      return res.status(400).json(errorResponse('data e horario são obrigatórios', {}, 400));
    }

    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (appointment.psicologo_id !== req.user.id) {
      return res.status(403).json(errorResponse('Só o psicólogo pode alterar a data/horário da consulta.', {}, 403));
    }
    if (appointment.status !== 'pendente') {
      return res.status(400).json(errorResponse('Só é possível alterar a data/horário de consultas pendentes.', {}, 400));
    }

    const dataHoraEscolhida = new Date(`${data}T${horario}:00`);
    if (dataHoraEscolhida.getTime() < Date.now()) {
      return res.status(400).json(errorResponse('Não é possível agendar uma consulta em uma data ou horário que já passou.', {}, 400));
    }

    const psicologo = await psychologistService.getPsychologistById(appointment.psicologo_id);
    if (!isWithinAvailability(psicologo, data, horario)) {
      return res.status(400).json(errorResponse('Esse horário está fora da disponibilidade do psicólogo.', {}, 400));
    }

    const updated = await appointmentService.rescheduleAppointment(req.params.id, data, horario);
    res.json(successResponse('Data e horário da consulta atualizados', updated));
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
    const data = await appointmentService.updateAppointmentStatus(req.params.id, status, req.user.id);
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
    const data = await appointmentService.updateAppointmentStatus(req.params.id, 'cancelada', req.user.id);
    res.json(successResponse('Consulta cancelada', data));
  } catch (error) {
    next(error);
  }
};

// Avalia uma consulta já concluída. A direção (quem avalia quem) é decidida
// sozinha com base em qual das duas pontas da consulta é quem está logado:
// se for o paciente, a nota vai pro psicólogo; se for o psicólogo, vai pro paciente.
export const rateAppointment = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const ratingNumber = Number(rating);
    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json(errorResponse('A nota deve ser um número inteiro de 1 a 5.', {}, 400));
    }

    const appointment = await appointmentService.getAppointmentById(req.params.id);
    const isPatient = appointment.paciente_id === req.user.id;
    const isPsychologist = appointment.psicologo_id === req.user.id;

    if (!isPatient && !isPsychologist) {
      return res.status(403).json(errorResponse('Você não faz parte desta consulta.', {}, 403));
    }
    if (appointment.status !== 'concluida') {
      return res.status(400).json(errorResponse('Só é possível avaliar consultas já concluídas.', {}, 400));
    }

    const payload = {
      appointment_id: appointment.id,
      patient_id: appointment.paciente_id,
      psychologist_id: appointment.psicologo_id,
      rating: ratingNumber,
      review,
    };

    const data = isPatient
      ? await ratingService.createPsychologistRating(payload)
      : await ratingService.createPatientRating(payload);

    res.status(201).json(successResponse('Avaliação registrada com sucesso', data));
  } catch (error) {
    // unique(appointment_id) barrando uma segunda avaliação na mesma consulta
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Você já avaliou esta consulta.', {}, 409));
    }
    next(error);
  }
};
