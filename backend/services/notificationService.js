import { supabaseAdmin } from '../config/supabase.js';

export const getUserNotifications = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
};

const getOwnNotification = async (notificationId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('recipient_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('Notificação não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  return data;
};

export const markNotificationAsRead = async (notificationId, userId) => {
  await getOwnNotification(notificationId, userId);

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllNotificationsAsRead = async (userId) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null);

  if (error) throw error;
};

export const deleteNotification = async (notificationId, userId) => {
  await getOwnNotification(notificationId, userId);

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

// Cria uma notificação pra alguém. Usada internamente por outros services
// (agendamentos, chat) quando acontece um evento relevante — nunca deve
// derrubar a ação principal se falhar, então quem chama envolve isso num
// try/catch e só loga o aviso.
export const createNotification = async ({ recipientId, type, actorId, payload }) => {
  if (!recipientId) return;

  let actorName = null;
  if (actorId) {
    const { data: actor } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nome')
      .eq('id', actorId)
      .maybeSingle();
    actorName = actor?.full_name || actor?.nome || null;
  }

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      type,
      actor_id: actorId || null,
      payload: { actorName, ...(payload || {}) },
    });

  if (error) throw error;
};
