import { supabaseAdmin } from '../config/supabase.js';

export const getPatientById = async (patientId) => {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('*')
    .eq('profile_id', patientId)
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
  // full_name/email/phone/photo/birth_date/city/state pertencem a public.profiles;
  // occupation/gender pertencem a public.pacientes. O formulário manda tudo junto.
  const { full_name, email, phone, photo, birth_date, city, state, occupation, gender, ...rest } = updates;

  if (email !== undefined) {
    // Atualiza a credencial de login de verdade no Supabase Auth (via admin API,
    // sem precisar do fluxo de confirmação por e-mail).
    const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(patientId, { email });
    if (authEmailError) throw authEmailError;
  }

  const profileUpdates = {};
  if (full_name !== undefined) {
    profileUpdates.full_name = full_name;
    profileUpdates.nome = full_name;
  }
  if (email !== undefined) profileUpdates.email = email;
  if (phone !== undefined) profileUpdates.telefone = phone;
  if (photo !== undefined) profileUpdates.foto = photo;
  if (birth_date !== undefined) profileUpdates.data_nascimento = birth_date;
  if (city !== undefined) profileUpdates.cidade = city;
  if (state !== undefined) profileUpdates.estado = state;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', patientId);
    if (profileError) throw profileError;
  }

  const pacienteUpdates = { ...rest };
  if (occupation !== undefined) pacienteUpdates.profissao = occupation;
  if (gender !== undefined) pacienteUpdates.genero = gender;

  if (Object.keys(pacienteUpdates).length === 0) {
    return getPatientById(patientId);
  }

  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .update(pacienteUpdates)
    .eq('profile_id', patientId)
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
