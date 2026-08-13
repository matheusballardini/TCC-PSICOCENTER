import { supabaseAdmin } from '../config/supabase.js';

export const createConversation = async (participantOne, participantTwo) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ participant_one: participantOne, participant_two: participantTwo })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getConversationById = async (conversationId) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserConversations = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getConversationMessages = async (conversationId) => {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const sendMessage = async (conversationId, senderId, content) => {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMessage = async (messageId) => {
  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
};

export const addChatAttachment = async (messageId, attachmentData) => {
  const { data, error } = await supabaseAdmin
    .from('chat_attachments')
    .insert({ message_id: messageId, ...attachmentData })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChatAttachments = async (messageId) => {
  const { data, error } = await supabaseAdmin
    .from('chat_attachments')
    .select('*')
    .eq('message_id', messageId);

  if (error) throw error;
  return data;
};
