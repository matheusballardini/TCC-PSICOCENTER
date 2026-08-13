import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'paciente' } = req.body;
    const profilePayload = req.body.profile || {};

    // O trigger handle_new_user() cria a linha em public.profiles automaticamente
    // a partir do raw_user_meta_data assim que o usuário é criado no Auth.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: full_name,
          telefone: profilePayload.phone || null,
          biografia: profilePayload.bio || null,
          cidade: profilePayload.address?.city || null,
          estado: profilePayload.address?.state || null,
          data_nascimento: profilePayload.birth_date || null,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        const err = new Error('Este e-mail já está cadastrado. Faça login.');
        err.statusCode = 409;
        throw err;
      }
      throw signUpError;
    }
    if (!user) throw new Error('Falha no cadastro');

    // O trigger sempre grava tipo='paciente' e não preenche full_name/role/email
    // (colunas legadas), então completamos aqui.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ tipo: role, full_name, role, email, foto: profilePayload.photo || null })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Se estiver cadastrando um psicólogo, cria o registro na tabela psicologos
    if (role === 'psicologo') {
      try {
        const { online, presencial } = profilePayload.modalities || {};
        const modalidade = online && presencial ? 'ambos' : presencial ? 'presencial' : 'online';

        const psicologoRecord = {
          profile_id: user.id,
          crp: profilePayload.crp || null,
          crp_uf: profilePayload.crp_state || null,
          cpf: profilePayload.cpf || null,
          formacao: profilePayload.education || null,
          instituicao: profilePayload.institution || null,
          endereco: profilePayload.address?.address || null,
          especialidades: profilePayload.specialties || [],
          especialidades_json: profilePayload.specialties || [],
          descricao_profissional: profilePayload.bio || null,
          valor_consulta: profilePayload.price_min || null,
          valor_consulta_max: profilePayload.price_max || null,
          modalidade,
          anos_experiencia: profilePayload.years_experience || null,
          aprovado: false,
          disponibilidade: JSON.stringify(profilePayload.availability || []),
        };

        const { error: psicError } = await supabaseAdmin.from('psicologos').insert(psicologoRecord);
        if (psicError) {
          // log but don't block registration
          console.warn('Falha ao criar psicologo record:', psicError);
        }
      } catch (e) {
        console.warn('Erro ao inserir psicologo:', e);
      }
    }

    // Se estiver cadastrando um paciente, cria o registro na tabela pacientes
    if (role === 'paciente') {
      try {
        const pacienteRecord = {
          profile_id: user.id,
          profissao: profilePayload.occupation || null,
          genero: profilePayload.gender || null,
        };

        const { error: pacienteError } = await supabaseAdmin.from('pacientes').insert(pacienteRecord);
        if (pacienteError) {
          // registra o erro mas não bloqueia o cadastro
          console.warn('Falha ao criar paciente record:', pacienteError);
        }
      } catch (e) {
        console.warn('Erro ao inserir paciente:', e);
      }
    }

    res.status(201).json(successResponse('Cadastro realizado com sucesso', { user }));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    res.json(successResponse('Login realizado com sucesso', { user, token, profile }));
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req, res, next) => {
  try {
    res.json(successResponse('Logout realizado com sucesso', {}));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;

    res.json(successResponse('E-mail de recuperação enviado', {}));
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) throw error;

    res.json(successResponse('Token atualizado', data));
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError) throw profileError;

    res.json(successResponse('Perfil carregado', { user: req.user, profile: profileData }));
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // limpa tudo que referencia esse usuário antes de apagar psicologos/pacientes/profiles,
    // senão as chaves estrangeiras (ex: appointments -> pacientes/psicologos) bloqueiam a
    // exclusão em silêncio e o auth.users acaba não conseguindo ser removido no final
    const referencingTables = [
      ['psychologist_ratings', 'patient_id'],
      ['psychologist_ratings', 'psychologist_id'],
      ['appointments', 'patient_id'],
      ['appointments', 'psychologist_id'],
      ['psychologist_availability', 'psychologist_id'],
      ['followers', 'paciente_id'],
      ['followers', 'psicologo_id'],
      ['psicologo_especialidades', 'psicologo_id'],
      ['publication_likes', 'user_id'],
      ['publication_saves', 'user_id'],
      ['publication_comments', 'author_id'],
      ['publications', 'psychologist_id'],
      ['notifications', 'recipient_id'],
      ['notifications', 'actor_id'],
      ['reports', 'reporter_id'],
      ['chat_attachments', 'uploaded_by'],
      ['messages', 'sender_id'],
      ['conversations', 'patient_id'],
      ['conversations', 'psychologist_id'],
    ];

    for (const [table, column] of referencingTables) {
      const { error: cleanupError } = await supabaseAdmin.from(table).delete().eq(column, userId);
      if (cleanupError) {
        console.warn(`Aviso: falha ao limpar ${table}.${column} para ${userId}:`, cleanupError.message);
      }
    }

    const { error: psicologoError } = await supabaseAdmin.from('psicologos').delete().eq('profile_id', userId);
    if (psicologoError) throw psicologoError;

    const { error: pacienteError } = await supabaseAdmin.from('pacientes').delete().eq('profile_id', userId);
    if (pacienteError) throw pacienteError;

    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    if (profileError) throw profileError;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json(successResponse('Conta excluída com sucesso', {}));
  } catch (error) {
    next(error);
  }
};
