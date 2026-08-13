import { supabaseAdmin } from '../config/supabase.js';

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
  return toConvenience(created);
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const updates = { status };
  if (status === 'cancelada' || status === 'recusada') updates.canceled_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return toConvenience(data);
};

export const deleteAppointment = async (appointmentId) => {
  const { error } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
};
