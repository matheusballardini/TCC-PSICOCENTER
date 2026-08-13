import { supabaseAdmin } from '../config/supabase.js';

export const getPatientById = async (patientId) => {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('*')
    .eq('id', patientId)
    .single();

  if (error) throw error;
  return data;
};

export const getAllPatients = async () => {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updatePatient = async (patientId, updates) => {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .update(updates)
    .eq('id', patientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createPatient = async (patientData) => {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .insert(patientData)
    .select()
    .single();

  if (error) throw error;
  return data;
};
