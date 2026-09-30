import { errorResponse } from '../utils/response.js';

// Erros que chegam aqui sem um err.statusCode definido são, na maioria das vezes,
// erros técnicos crus vindos direto do Supabase/Postgres (ex: "invalid login
// credentials", violação de foreign key, etc.) — nunca devem ir pro usuário
// do jeito que vêm. Aqui a gente traduz os casos conhecidos, e no resto cai
// numa mensagem genérica em vez de expor o erro técnico.
const MENSAGENS_CONHECIDAS = [
  [/invalid login credentials/i, 'Email ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de fazer login.'],
  [/user already registered/i, 'Este e-mail já está cadastrado.'],
  [/jwt expired/i, 'Sua sessão expirou. Faça login novamente.'],
  [/rate limit/i, 'Muitas tentativas em pouco tempo. Aguarde um momento e tente de novo.'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/unable to validate email/i, 'E-mail em formato inválido.'],
];

// Códigos de erro do Postgres (a lib do Supabase repassa isso em err.code)
const MENSAGENS_POR_CODIGO_PG = {
  '23505': 'Este registro já existe.',
  '23503': 'Não foi possível concluir a ação porque existem dados relacionados (ex: consultas ou avaliações vinculadas).',
  '23502': 'Um campo obrigatório não foi preenchido.',
  '22P02': 'Um dos valores enviados está em um formato inválido.',
  'PGRST116': 'Registro não encontrado.',
};

const traduzirErro = (err) => {
  if (err.code && MENSAGENS_POR_CODIGO_PG[err.code]) {
    return MENSAGENS_POR_CODIGO_PG[err.code];
  }
  const mensagemOriginal = err.message || '';
  for (const [padrao, mensagemTraduzida] of MENSAGENS_CONHECIDAS) {
    if (padrao.test(mensagemOriginal)) return mensagemTraduzida;
  }
  return null;
};

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  // Prioridade: (1) se o erro bate com um padrão técnico conhecido (Supabase/Postgres),
  // sempre traduz — mesmo que alguém tenha setado um statusCode nele; (2) senão, se
  // err.statusCode foi definido manualmente por um dos nossos controllers, é porque a
  // mensagem já foi escrita pensando no usuário (ex: "CPF inválido."), então confiamos
  // nela; (3) em último caso, uma mensagem genérica, nunca o erro técnico cru.
  const message = traduzirErro(err)
    || (err.statusCode ? err.message : 'Ocorreu um erro inesperado. Tente novamente em instantes.');

  res.status(statusCode).json(errorResponse(message, { stack: process.env.NODE_ENV === 'development' ? err.stack : undefined }, statusCode));
};
