import { supabaseAdmin } from '../config/supabase.js';

// psicologos não tem nome/foto/email (isso mora em profiles), então buscamos
// as duas tabelas e juntamos pelo profile_id.
const attachProfileData = async (psicologos) => {
  const ids = psicologos.map((p) => p.profile_id);
  if (ids.length === 0) return psicologos;

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, nome, email, foto, telefone, cidade, estado')
    .in('id', ids);

  if (error) throw error;

  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return psicologos.map((psicologo) => ({
    ...psicologo,
    full_name: profileById[psicologo.profile_id]?.full_name || profileById[psicologo.profile_id]?.nome || null,
    email: profileById[psicologo.profile_id]?.email || null,
    foto: profileById[psicologo.profile_id]?.foto || null,
    telefone: profileById[psicologo.profile_id]?.telefone || null,
    cidade: profileById[psicologo.profile_id]?.cidade || null,
    estado: profileById[psicologo.profile_id]?.estado || null,
  }));
};

export const getPsychologistById = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psicologos')
    .select('*')
    .eq('profile_id', psychologistId)
    .single();

  if (error) throw error;

  const [enriched] = await attachProfileData([data]);
  return enriched;
};

export const getAllPsychologists = async () => {
  const { data, error } = await supabaseAdmin
    .from('psicologos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachProfileData(data || []);
};

export const updatePsychologist = async (psychologistId, updates) => {
  // full_name/email/phone/photo/cidade/estado pertencem a public.profiles; o resto
  // (crp, formação, especialidades, valores, disponibilidade...) pertence a public.psicologos.
  // O formulário de edição manda tudo junto, com os mesmos nomes usados no cadastro.
  const {
    full_name, email, phone, bio, photo, crp, city, state,
    crp_state, education, institution, years_experience,
    specialties, modalities, address, price_min, price_max, availability,
  } = updates;

  if (email !== undefined) {
    // Atualiza a credencial de login de verdade no Supabase Auth (via admin API,
    // sem precisar do fluxo de confirmação por e-mail).
    const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(psychologistId, { email });
    if (authEmailError) throw authEmailError;
  }

  const profileUpdates = {};
  if (full_name !== undefined) {
    profileUpdates.full_name = full_name;
    profileUpdates.nome = full_name;
  }
  if (email !== undefined) profileUpdates.email = email;
  if (phone !== undefined) profileUpdates.telefone = phone;
  if (bio !== undefined) profileUpdates.biografia = bio;
  if (photo !== undefined) profileUpdates.foto = photo;
  if (city !== undefined) profileUpdates.cidade = city;
  if (state !== undefined) profileUpdates.estado = state;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', psychologistId);
    if (profileError) throw profileError;
  }

  const psicologoUpdates = {};
  if (crp !== undefined) psicologoUpdates.crp = crp;
  if (bio !== undefined) psicologoUpdates.descricao_profissional = bio;
  if (crp_state !== undefined) psicologoUpdates.crp_uf = crp_state;
  if (education !== undefined) psicologoUpdates.formacao = education;
  if (institution !== undefined) psicologoUpdates.instituicao = institution;
  if (years_experience !== undefined) psicologoUpdates.anos_experiencia = years_experience;
  if (specialties !== undefined) {
    psicologoUpdates.especialidades = specialties;
    psicologoUpdates.especialidades_json = specialties;
  }
  if (modalities !== undefined) {
    const { online, presencial } = modalities;
    psicologoUpdates.modalidade = online && presencial ? 'ambos' : presencial ? 'presencial' : 'online';
  }
  if (address !== undefined) psicologoUpdates.endereco = address.address || null;
  if (price_min !== undefined) psicologoUpdates.valor_consulta = price_min;
  if (price_max !== undefined) psicologoUpdates.valor_consulta_max = price_max;
  if (availability !== undefined) psicologoUpdates.disponibilidade = JSON.stringify(availability);

  if (Object.keys(psicologoUpdates).length === 0) {
    return getPsychologistById(psychologistId);
  }

  const { data, error } = await supabaseAdmin
    .from('psicologos')
    .update(psicologoUpdates)
    .eq('profile_id', psychologistId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPsychologistSpecialties = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psicologo_especialidades')
    .select('especialidades(*)')
    .eq('psicologo_id', psychologistId);

  if (error) throw error;
  return data;
};

export const getPsychologistAvailability = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_availability')
    .select('*')
    .eq('psychologist_id', psychologistId);

  if (error) throw error;
  return data;
};

export const getPsychologistRatings = async (psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_ratings')
    .select('*')
    .eq('psychologist_id', psychologistId);

  if (error) throw error;
  return data;
};

export const addSpecialty = async (psychologistId, specialtyId) => {
  const { data, error } = await supabaseAdmin
    .from('psicologo_especialidades')
    .insert({ psicologo_id: psychologistId, especialidade_id: specialtyId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeSpecialty = async (psychologistId, specialtyId) => {
  const { error } = await supabaseAdmin
    .from('psicologo_especialidades')
    .delete()
    .eq('psicologo_id', psychologistId)
    .eq('especialidade_id', specialtyId);

  if (error) throw error;
};

export const setAvailability = async (psychologistId, availability) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_availability')
    .upsert({ psychologist_id: psychologistId, ...availability })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createRating = async (psychologistId, rating) => {
  const { data, error } = await supabaseAdmin
    .from('psychologist_ratings')
    .insert({ psychologist_id: psychologistId, ...rating })
    .select()
    .single();

  if (error) throw error;
  return data;
};
