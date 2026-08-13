import { supabaseAdmin } from '../config/supabase.js';

export const getAllAppointments = async () => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAppointmentById = async (appointmentId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .eq('id', appointmentId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserAppointments = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, pacientes(*), psicologos(*)')
    .or(`paciente_id.eq.${userId},psicologo_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAppointment = async (appointmentId) => {
  const { error } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
};
