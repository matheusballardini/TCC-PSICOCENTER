import { supabaseAdmin } from '../config/supabase.js';

export const getUserNotifications = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getNotificationById = async (notificationId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllNotificationsAsRead = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data;
};

export const deleteNotification = async (notificationId) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};
