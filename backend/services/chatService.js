import { supabaseAdmin } from '../config/supabase.js';
import { getUserAppointments } from './appointmentService.js';
import { createNotification } from './notificationService.js';

// só é possível conversar com quem se tem pelo menos uma consulta pendente,
// aceita ou concluída entre os dois — recusada/cancelada não abre conversa
const ELIGIBLE_STATUSES = ['pendente', 'aceita', 'concluida'];

// pra cada "outra pessoa" com quem o usuário logado tem consulta elegível (pacientes
// pro psicólogo, psicólogos pro paciente), guarda o perfil dela e os ids paciente/psicólogo
// do par (usados pra achar/criar a conversa, já que a tabela conversations é por par fixo)
const getEligibleCounterparts = async (userId) => {
  const appointments = await getUserAppointments(userId);
  const byCounterpart = new Map();

  appointments.forEach((appointment) => {
    const status = appointment.status || 'pendente';
    if (!ELIGIBLE_STATUSES.includes(status)) return;

    const souPaciente = String(appointment.paciente_id) === String(userId);
    const counterpartId = souPaciente ? appointment.psicologo_id : appointment.paciente_id;
    const counterpartInfo = souPaciente ? appointment.psicologos : appointment.pacientes;
    if (!counterpartId) return;

    const criadoEm = appointment.created_at ? new Date(appointment.created_at).getTime() : 0;
    const existente = byCounterpart.get(counterpartId);
    if (!existente || criadoEm > existente.lastAppointmentAt) {
      byCounterpart.set(counterpartId, {
        id: counterpartId,
        full_name: counterpartInfo?.full_name || 'Usuário',
        foto: counterpartInfo?.foto || null,
        patientId: souPaciente ? userId : counterpartId,
        psychologistId: souPaciente ? counterpartId : userId,
        lastAppointmentAt: criadoEm,
      });
    }
  });

  return Array.from(byCounterpart.values());
};

const findConversation = async (patientId, psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('patient_id', patientId)
    .eq('psychologist_id', psychologistId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const createConversation = async (patientId, psychologistId) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ patient_id: patientId, psychologist_id: psychologistId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const findOrCreateConversation = async (patientId, psychologistId) => {
  const existente = await findConversation(patientId, psychologistId);
  if (existente) return existente;
  return createConversation(patientId, psychologistId);
};

const getLastMessage = async (conversationId) => {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const resolveEligibleCounterpart = async (userId, otherUserId) => {
  const counterparts = await getEligibleCounterparts(userId);
  const match = counterparts.find((c) => String(c.id) === String(otherUserId));
  if (!match) {
    const err = new Error('Só é possível conversar com pacientes ou psicólogos com quem você tem algum agendamento.');
    err.statusCode = 403;
    throw err;
  }
  return match;
};

// lista, pra quem está logado, todo mundo com quem dá pra conversar, junto com a
// última mensagem trocada (ou null se a conversa ainda nem começou)
export const getThreadsForUser = async (userId) => {
  const counterparts = await getEligibleCounterparts(userId);

  const threads = await Promise.all(counterparts.map(async (counterpart) => {
    const conversation = await findConversation(counterpart.patientId, counterpart.psychologistId);
    const lastMessage = conversation ? await getLastMessage(conversation.id) : null;
    return {
      otherUserId: counterpart.id,
      full_name: counterpart.full_name,
      foto: counterpart.foto,
      lastMessage,
      // usado só pra ordenar: mensagem mais recente primeiro, ou a data do
      // agendamento se a conversa ainda não tiver nenhuma mensagem
      _ordenacao: lastMessage ? new Date(lastMessage.sent_at).getTime() : counterpart.lastAppointmentAt,
    };
  }));

  return threads
    .sort((a, b) => b._ordenacao - a._ordenacao)
    .map(({ _ordenacao, ...thread }) => thread);
};

// abre (criando se ainda não existir) a conversa com "otherUserId" e devolve
// o perfil básico dele + o histórico completo de mensagens
export const getThread = async (userId, otherUserId) => {
  const match = await resolveEligibleCounterpart(userId, otherUserId);
  const conversation = await findOrCreateConversation(match.patientId, match.psychologistId);

  // mensagens apagadas continuam na lista (pra aparecer "Mensagem excluída"
  // no lugar), só somem de verdade quando filtradas em getLastMessage
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('sent_at', { ascending: true });
  if (error) throw error;

  // ao abrir a conversa, marca como lida qualquer mensagem que a outra
  // pessoa mandou e que ainda estava sem leitura (usado pra sumir a bolinha
  // de aviso na aba de Mensagens)
  await supabaseAdmin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversation.id)
    .neq('sender_id', userId)
    .is('read_at', null);

  return {
    otherUser: { id: match.id, full_name: match.full_name, foto: match.foto },
    messages: messages || [],
  };
};

// conta quantas mensagens não lidas o usuário logado tem no total (somando
// todas as conversas dele) — usado pra mostrar a bolinha vermelha de aviso
export const getUnreadCount = async (userId) => {
  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .or(`patient_id.eq.${userId},psychologist_id.eq.${userId}`);
  if (error) throw error;

  const conversationIds = (conversations || []).map((c) => c.id);
  if (!conversationIds.length) return 0;

  const { count, error: countError } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .is('read_at', null)
    .is('deleted_at', null);
  if (countError) throw countError;

  return count || 0;
};

export const sendMessage = async (userId, otherUserId, body) => {
  const match = await resolveEligibleCounterpart(userId, otherUserId);
  const conversation = await findOrCreateConversation(match.patientId, match.psychologistId);

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_id: userId, body })
    .select()
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation.id);

  try {
    await createNotification({
      recipientId: otherUserId,
      type: 'mensagem',
      actorId: userId,
      payload: { preview: body.slice(0, 80) },
    });
  } catch (e) {
    console.warn('Falha ao criar notificação de mensagem:', e.message);
  }

  return data;
};

// só dá pra excluir mensagens enviadas há no máximo esse tempo
const LIMITE_EXCLUSAO_MS = 5 * 60 * 1000;

// apaga (soft delete) uma mensagem: só quem mandou pode apagar a própria
// mensagem, só dentro de 5 minutos do envio, e ela continua aparecendo pro
// outro lado como "Mensagem excluída"
export const deleteMessage = async (userId, otherUserId, messageId) => {
  const match = await resolveEligibleCounterpart(userId, otherUserId);
  const conversation = await findOrCreateConversation(match.patientId, match.psychologistId);

  const { data: mensagem, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .eq('conversation_id', conversation.id)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (!mensagem || String(mensagem.sender_id) !== String(userId) || mensagem.deleted_at) {
    const err = new Error('Mensagem não encontrada ou você não pode excluí-la.');
    err.statusCode = 404;
    throw err;
  }

  const idadeMs = Date.now() - new Date(mensagem.sent_at).getTime();
  if (idadeMs > LIMITE_EXCLUSAO_MS) {
    const err = new Error('Só é possível excluir mensagens enviadas há no máximo 5 minutos.');
    err.statusCode = 403;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('conversation_id', conversation.id)
    .eq('sender_id', userId)
    .is('deleted_at', null)
    .select()
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const err = new Error('Mensagem não encontrada ou você não pode excluí-la.');
    err.statusCode = 404;
    throw err;
  }

  return data;
};
