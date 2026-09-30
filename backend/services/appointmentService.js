import { supabaseAdmin } from '../config/supabase.js';
import { createNotification } from './notificationService.js';

// a tabela real usa patient_id/psychologist_id/scheduled_at, mas o resto do
// backend e o frontend foram construídos em cima de paciente_id/psicologo_id/data/horario;
// aqui a gente traduz pros dois lados sem precisar reescrever tudo.
const toConvenience = (appointment) => {
  if (!appointment) return appointment;
  const scheduledAt = appointment.scheduled_at ? new Date(appointment.scheduled_at) : null;
  return {
    ...appointment,
    paciente_id: appointment.patient_id,
    psicologo_id: appointment.psychologist_id,
    data: scheduledAt ? scheduledAt.toISOString().slice(0, 10) : null,
    horario: scheduledAt ? scheduledAt.toISOString().slice(11, 16) : null,
  };
};

// pacientes e psicologos não tem nome/foto (isso mora em profiles), então
// buscamos os perfis e juntamos em cada consulta pelo id.
const attachProfiles = async (appointments) => {
  const ids = new Set();
  appointments.forEach((appointment) => {
    if (appointment.patient_id) ids.add(appointment.patient_id);
    if (appointment.psychologist_id) ids.add(appointment.psychologist_id);
  });
  if (ids.size === 0) return appointments;

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, nome, email, foto, telefone')
    .in('id', Array.from(ids));

  if (error) throw error;

  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return appointments.map((appointment) => {
    const pacienteProfile = profileById[appointment.patient_id];
    const psicologoProfile = profileById[appointment.psychologist_id];
    return {
      ...appointment,
      pacientes: appointment.pacientes ? {
        ...appointment.pacientes,
        full_name: pacienteProfile?.full_name || pacienteProfile?.nome || null,
        email: pacienteProfile?.email || null,
        foto: pacienteProfile?.foto || null,
        telefone: pacienteProfile?.telefone || null,
      } : appointment.pacientes,
      psicologos: appointment.psicologos ? {
        ...appointment.psicologos,
        full_name: psicologoProfile?.full_name || psicologoProfile?.nome || null,
        email: psicologoProfile?.email || null,
        foto: psicologoProfile?.foto || null,
        telefone: psicologoProfile?.telefone || null,
      } : appointment.psicologos,
    };
  });
};

export const getAllAppointments = async () => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const enriched = await attachProfiles(data || []);
  return enriched.map(toConvenience);
};

export const getAppointmentById = async (appointmentId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .eq('id', appointmentId)
    .single();

  if (error) throw error;
  const [enriched] = await attachProfiles([data]);
  return toConvenience(enriched);
};

export const getUserAppointments = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .or(`patient_id.eq.${userId},psychologist_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const enriched = await attachProfiles(data || []);
  return enriched.map(toConvenience);
};

export const createAppointment = async ({ paciente_id, psicologo_id, data, horario, status }) => {
  // grava o horário "de parede" como se fosse UTC, pra não sofrer deslocamento pelo fuso do servidor
  // e voltar exatamente igual ao que o paciente digitou (ver toConvenience, que também lê em UTC)
  const scheduledAt = data && horario ? new Date(`${data}T${horario}:00Z`).toISOString() : null;

  const { data: created, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: paciente_id,
      psychologist_id: psicologo_id,
      scheduled_at: scheduledAt,
      duration_minutes: 50,
      status: status || 'pendente',
    })
    .select()
    .single();

  if (error) throw error;
  const appointment = toConvenience(created);

  // avisa o psicólogo que chegou um pedido novo — não deixa a criação da
  // consulta falhar se, por algum motivo, a notificação der erro
  try {
    await createNotification({
      recipientId: appointment.psicologo_id,
      type: 'solicitacao_consulta',
      actorId: appointment.paciente_id,
      payload: { appointmentId: appointment.id, data: appointment.data, horario: appointment.horario },
    });
  } catch (e) {
    console.warn('Falha ao criar notificação de nova consulta:', e.message);
  }

  return appointment;
};

// muda só a data/horário de uma consulta (usado quando os dois combinam um
// horário melhor pelo chat, enquanto a consulta ainda está pendente)
export const rescheduleAppointment = async (appointmentId, data, horario) => {
  const scheduledAt = new Date(`${data}T${horario}:00Z`).toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from('appointments')
    .update({ scheduled_at: scheduledAt })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return toConvenience(updated);
};

// quantos agendamentos o psicólogo ainda não "viu" (nunca abriu a página de
// Agendamentos desde que a consulta foi criada) — usado pra bolinha de aviso
export const getUnseenAppointmentsCount = async (psychologistId) => {
  const { count, error } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('psychologist_id', psychologistId)
    .is('psychologist_seen_at', null);

  if (error) throw error;
  return count || 0;
};

// marca todos os agendamentos do psicólogo como vistos — chamado quando ele
// abre a página de Agendamentos, pra bolinha de aviso sumir
export const markAppointmentsSeen = async (psychologistId) => {
  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ psychologist_seen_at: new Date().toISOString() })
    .eq('psychologist_id', psychologistId)
    .is('psychologist_seen_at', null);

  if (error) throw error;
};

// actorId (opcional) é quem fez a mudança — usado só pra decidir quem recebe
// a notificação (a outra ponta da consulta, nunca quem executou a ação).
export const updateAppointmentStatus = async (appointmentId, status, actorId) => {
  const updates = { status };
  if (status === 'cancelada' || status === 'recusada') updates.canceled_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  const appointment = toConvenience(data);

  try {
    if (status === 'aceita') {
      // só o psicólogo aceita, então quem recebe o aviso é sempre o paciente
      await createNotification({
        recipientId: appointment.paciente_id,
        type: 'consulta_aceita',
        actorId: actorId || appointment.psicologo_id,
        payload: { appointmentId: appointment.id, data: appointment.data, horario: appointment.horario },
      });
    } else if (status === 'cancelada' || status === 'recusada') {
      // avisa quem NÃO foi quem cancelou/recusou
      const recipientId = actorId && String(actorId) === String(appointment.paciente_id)
        ? appointment.psicologo_id
        : appointment.paciente_id;
      await createNotification({
        recipientId,
        type: 'consulta_cancelada',
        actorId,
        payload: { appointmentId: appointment.id, data: appointment.data, horario: appointment.horario },
      });
    }
  } catch (e) {
    console.warn('Falha ao criar notificação de status de consulta:', e.message);
  }

  return appointment;
};

export const deleteAppointment = async (appointmentId) => {
  const { error } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
};
