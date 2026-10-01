import jwt from 'jsonwebtoken';
// supabase = cliente com permissões normais; supabaseAdmin = cliente com permissão total
// (ignora as regras de segurança do banco), usado quando o backend precisa agir
// em nome do sistema (ex: editar profiles de qualquer usuário).
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Nome não pode ter número nem 4+ letras repetidas seguidas (ex: "mmmm").
// Repete no servidor a mesma checagem do frontend (register.js/editar_perfil*.js),
// que pode ser burlada.
export const isValidName = (nameValue) => {
  if (/\d/.test(nameValue || '')) return false;
  if (/([a-zA-ZÀ-ÖØ-öø-ÿ])\1{3,}/.test(nameValue || '')) return false;
  return true;
};

// Cada horário de disponibilidade tem que ficar entre 06:00-22:00 e o fim
// tem que vir depois do início (evita algo como 23:00 às 08:00, que na prática
// significaria atender de madrugada virando o dia). Repete no servidor a
// mesma checagem do frontend (register.js/editar_perfil.js), que pode ser burlada.
const HORARIO_MIN_DISPONIBILIDADE = '06:00';
const HORARIO_MAX_DISPONIBILIDADE = '22:00';
const DURACAO_MINIMA_MINUTOS = 30;
const paraMinutos = (horario) => {
  const [horas, minutos] = horario.split(':').map(Number);
  return horas * 60 + minutos;
};
export const isValidAvailability = (availability) => {
  if (!Array.isArray(availability)) return false;
  return availability.every((slot) => {
    const { start, end } = slot || {};
    if (!start || !end) return false;
    if (start < HORARIO_MIN_DISPONIBILIDADE || end > HORARIO_MAX_DISPONIBILIDADE) return false;
    if (start >= end) return false;
    return paraMinutos(end) - paraMinutos(start) >= DURACAO_MINIMA_MINUTOS;
  });
};

// Data de nascimento não pode estar no futuro nem antes de 1900. Repete no
// servidor a mesma checagem do frontend (register.js/editar_perfil*.js), que
// pode ser burlada.
export const isValidBirthDate = (birthDateStr) => {
  if (!birthDateStr) return false;
  const birth = new Date(`${birthDateStr}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;
  if (birth.getFullYear() < 1900) return false;
  return birth.getTime() <= Date.now();
};

// Cria uma nova conta (paciente ou psicólogo).
export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'paciente' } = req.body;
    const profilePayload = req.body.profile || {};

    if (!isValidName(full_name)) {
      const err = new Error('Nome inválido: não pode ter números nem 4 ou mais letras repetidas seguidas.');
      err.statusCode = 400;
      throw err;
    }

    // Regra de negócio: não faz sentido existir um psicólogo sem nenhum
    // horário de disponibilidade cadastrado, então bloqueia antes de criar a conta.
    if (role === 'psicologo') {
      if (!(profilePayload.availability || []).length) {
        const err = new Error('Selecione pelo menos um dia de disponibilidade.');
        err.statusCode = 400;
        throw err;
      }
      if (!isValidAvailability(profilePayload.availability)) {
        const err = new Error(`Horário de disponibilidade inválido: use um intervalo entre ${HORARIO_MIN_DISPONIBILIDADE} e ${HORARIO_MAX_DISPONIBILIDADE}, com o fim pelo menos ${DURACAO_MINIMA_MINUTOS} minutos depois do início.`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (profilePayload.birth_date && !isValidBirthDate(profilePayload.birth_date)) {
      const err = new Error('Data de nascimento inválida: deve ser a partir de 1900 e não pode ser no futuro.');
      err.statusCode = 400;
      throw err;
    }

    // O trigger handle_new_user() cria a linha em public.profiles automaticamente
    // a partir do raw_user_meta_data assim que o usuário é criado no Auth.
    // Aqui é o Supabase Auth quem cria o usuário de verdade e guarda a senha
    // (com hash) — nunca vemos/guardamos a senha em texto puro depois desse ponto.
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
      // Mensagem amigável pro caso mais comum de erro (email duplicado);
      // qualquer outro erro do Auth é repassado como está.
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        const err = new Error('Este e-mail já está cadastrado. Faça login.');
        err.statusCode = 409;
        throw err;
      }
      throw signUpError;
    }
    if (!user) throw new Error('Falha no cadastro');

    // Tudo daqui pra baixo precisa dar certo junto (completar o profile + criar
    // a linha de paciente/psicólogo). Se qualquer etapa falhar — rede, servidor
    // reiniciando no meio, erro do banco — desfazemos o usuário criado no Auth
    // em vez de deixar uma conta "zumbi" (existe mas incompleta) que trava um
    // novo cadastro com o mesmo e-mail sem dar pra usar o antigo de jeito nenhum.
    try {
      // O trigger sempre grava tipo='paciente' e não preenche full_name/role/email
      // (colunas legadas), então completamos aqui usando o supabaseAdmin (permissão total).
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ tipo: role, full_name, role, email, foto: profilePayload.photo || null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Se estiver cadastrando um psicólogo, cria o registro na tabela psicologos.
      // Os nomes de campo do formulário (em inglês, ex: crp_state) são traduzidos
      // pra os nomes reais das colunas no banco (em português, ex: crp_uf).
      if (role === 'psicologo') {
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
          titulo_profissional: profilePayload.titulo_profissional === 'Psicóloga' ? 'Psicóloga' : 'Psicólogo',
        };

        const { error: psicError } = await supabaseAdmin.from('psicologos').insert(psicologoRecord);
        if (psicError) throw psicError;
      }

      // Se estiver cadastrando um paciente, cria o registro na tabela pacientes.
      if (role === 'paciente') {
        const pacienteRecord = {
          profile_id: user.id,
          cpf: profilePayload.cpf || null,
          profissao: profilePayload.occupation || null,
          genero: profilePayload.gender || null,
        };

        const { error: pacienteError } = await supabaseAdmin.from('pacientes').insert(pacienteRecord);
        if (pacienteError) throw pacienteError;
      }
    } catch (completionError) {
      // Rollback: apaga tudo que possa ter sido criado, na ordem certa, e o
      // usuário do Auth por último, pra não sobrar nenhum vestígio da tentativa.
      await supabaseAdmin.from('psicologos').delete().eq('profile_id', user.id);
      await supabaseAdmin.from('pacientes').delete().eq('profile_id', user.id);
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      const err = new Error('Não foi possível concluir o cadastro. Tente novamente.');
      err.statusCode = 500;
      throw err;
    }

    res.status(201).json(successResponse('Cadastro realizado com sucesso', { user }));
  } catch (error) {
    // qualquer erro lançado acima cai aqui e vai pro middleware de erro central
    next(error);
  }
};

// Autentica um usuário existente e devolve um token JWT pra ele usar nas próximas requisições.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Confere email + senha direto no Supabase Auth.
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      error.statusCode = 401;
      throw error;
    }

    // Gera nosso próprio JWT (não o do Supabase), assinado com JWT_SECRET,
    // contendo só o id do usuário (sub) e validade de 7 dias.
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    // Busca o profile completo (nome, foto, tipo...) pra já devolver junto —
    // o frontend usa isso pra saber se é psicólogo ou paciente e redirecionar certo.
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

// Não precisa fazer nada no servidor: como o JWT é stateless (sem sessão
// guardada no backend), "deslogar" é só o frontend apagar o token do localStorage.
export const logout = async (_req, res, next) => {
  try {
    res.json(successResponse('Logout realizado com sucesso', {}));
  } catch (error) {
    next(error);
  }
};

// Repassa pro Supabase Auth, que já cuida do envio do email de recuperação de senha.
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

// Renova a sessão do Supabase Auth usando o refresh_token.
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

// Devolve os dados de quem está logado. Não recebe id nenhum na requisição —
// usa req.user.id, que já vem pronto do middleware requireAuth (rodou antes
// e decodificou o token).
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

// Exclui a conta do usuário logado (e tudo que referencia ele no banco).
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // limpa tudo que referencia esse usuário antes de apagar psicologos/pacientes/profiles,
    // senão as chaves estrangeiras (ex: appointments -> pacientes/psicologos) bloqueiam a
    // exclusão em silêncio e o auth.users acaba não conseguindo ser removido no final
    const referencingTables = [
      ['psychologist_ratings', 'patient_id'],
      ['psychologist_ratings', 'psychologist_id'],
      ['patient_ratings', 'patient_id'],
      ['patient_ratings', 'psychologist_id'],
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

    // Apaga uma tabela "filha" por vez. Se uma falhar (ex: tabela sem linha
    // nenhuma pra esse usuário), só avisa no log e continua — não trava tudo
    // por causa de uma tabela que talvez nem tenha dado pra excluir.
    for (const [table, column] of referencingTables) {
      const { error: cleanupError } = await supabaseAdmin.from(table).delete().eq(column, userId);
      if (cleanupError) {
        console.warn(`Aviso: falha ao limpar ${table}.${column} para ${userId}:`, cleanupError.message);
      }
    }

    // Só depois de limpar as tabelas filhas é que apagamos as tabelas "pai",
    // na ordem certa: psicologos/pacientes primeiro, profiles por último.
    // Aqui, ao contrário do loop acima, um erro é lançado de verdade (throw),
    // porque se essas não saírem, a exclusão do usuário no Auth (abaixo) vai falhar.
    const { error: psicologoError } = await supabaseAdmin.from('psicologos').delete().eq('profile_id', userId);
    if (psicologoError) throw psicologoError;

    const { error: pacienteError } = await supabaseAdmin.from('pacientes').delete().eq('profile_id', userId);
    if (pacienteError) throw pacienteError;

    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    if (profileError) throw profileError;

    // Por último, remove o usuário de verdade do Supabase Auth.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json(successResponse('Conta excluída com sucesso', {}));
  } catch (error) {
    next(error);
  }
};
