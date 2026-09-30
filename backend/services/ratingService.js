import { supabaseAdmin } from '../config/supabase.js';

// Paciente avaliando o psicólogo (após a consulta).
export const createPsychologistRating = async ({ appointment_id, patient_id, psychologist_id, rating, review }) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_ratings')
    .insert({ appointment_id, patient_id, psychologist_id, rating, review: review || null })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Psicólogo avaliando o paciente (após a consulta).
export const createPatientRating = async ({ appointment_id, patient_id, psychologist_id, rating, review }) => {
  const { data, error } = await supabaseAdmin
    .from('patient_ratings')
    .insert({ appointment_id, patient_id, psychologist_id, rating, review: review || null })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Média + total de avaliações calculados na hora (sem guardar campo agregado
// que poderia ficar desatualizado se uma avaliação for removida/editada).
export const getPsychologistRatingSummary = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_ratings')
    .select('rating')
    .eq('psychologist_id', psychologistId);

  if (error) throw error;
  return summarize(data);
};

export const getPatientRatingSummary = async (patientId) => {
  const { data, error } = await supabaseAdmin
    .from('patient_ratings')
    .select('rating')
    .eq('patient_id', patientId);

  if (error) throw error;
  return summarize(data);
};

const summarize = (rows) => {
  const total = rows.length;
  if (total === 0) return { average: 0, total: 0 };
  const sum = rows.reduce((acc, row) => acc + row.rating, 0);
  return { average: Math.round((sum / total) * 10) / 10, total };
};

// junta o nome/foto de quem avaliou (profiles não é acessível via relação
// direta pra essas duas tabelas, então busca separado e junta pelo id)
const attachReviewerNames = async (rows, reviewerIdField) => {
  const ids = [...new Set(rows.map((row) => row[reviewerIdField]).filter(Boolean))];
  if (ids.length === 0) return rows;

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, nome, foto')
    .in('id', ids);

  if (error) throw error;
  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...row,
    reviewer_name: profileById[row[reviewerIdField]]?.full_name || profileById[row[reviewerIdField]]?.nome || 'Usuário',
    reviewer_photo: profileById[row[reviewerIdField]]?.foto || null,
  }));
};

// Lista de avaliações (com comentário) que um psicólogo recebeu de pacientes.
export const getPsychologistRatings = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_ratings')
    .select('*')
    .eq('psychologist_id', psychologistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachReviewerNames(data || [], 'patient_id');
};

// Lista de avaliações (com comentário) que um paciente recebeu de psicólogos.
export const getPatientRatings = async (patientId) => {
  const { data, error } = await supabaseAdmin
    .from('patient_ratings')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachReviewerNames(data || [], 'psychologist_id');
};
