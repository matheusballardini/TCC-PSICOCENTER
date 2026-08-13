import { supabaseAdmin } from '../config/supabase.js';

export const getAllPublications = async () => {
  const { data, error } = await supabaseAdmin
    .from('publications')
    .select('*, publication_comments(*), publication_likes(*), publication_saves(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getPublicationById = async (publicationId) => {
  const { data, error } = await supabaseAdmin
    .from('publications')
    .select('*, publication_comments(*, profiles(*)), publication_likes(*), publication_saves(*)')
    .eq('id', publicationId)
    .single();

  if (error) throw error;
  return data;
};

export const createPublication = async (publicationData) => {
  const { data, error } = await supabaseAdmin
    .from('publications')
    .insert(publicationData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePublication = async (publicationId, updates) => {
  const { data, error } = await supabaseAdmin
    .from('publications')
    .update(updates)
    .eq('id', publicationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePublication = async (publicationId) => {
  const { error } = await supabaseAdmin
    .from('publications')
    .delete()
    .eq('id', publicationId);

  if (error) throw error;
};

export const getPublicationComments = async (publicationId) => {
  const { data, error } = await supabaseAdmin
    .from('publication_comments')
    .select('*, profiles(*)')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addComment = async (publicationId, userId, content) => {
  const { data, error } = await supabaseAdmin
    .from('publication_comments')
    .insert({ publication_id: publicationId, user_id: userId, content })
    .select('*, profiles(*)')
    .single();

  if (error) throw error;
  return data;
};

export const deleteComment = async (commentId) => {
  const { error } = await supabaseAdmin
    .from('publication_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

export const toggleLike = async (publicationId, userId) => {
  const { data: existingLike, error: checkError } = await supabaseAdmin
    .from('publication_likes')
    .select()
    .eq('publication_id', publicationId)
    .eq('user_id', userId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') throw checkError;

  if (existingLike) {
    await supabaseAdmin
      .from('publication_likes')
      .delete()
      .eq('id', existingLike.id);
    return { liked: false };
  } else {
    const { data, error } = await supabaseAdmin
      .from('publication_likes')
      .insert({ publication_id: publicationId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return { liked: true, data };
  }
};

export const toggleSave = async (publicationId, userId) => {
  const { data: existingSave, error: checkError } = await supabaseAdmin
    .from('publication_saves')
    .select()
    .eq('publication_id', publicationId)
    .eq('user_id', userId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') throw checkError;

  if (existingSave) {
    await supabaseAdmin
      .from('publication_saves')
      .delete()
      .eq('id', existingSave.id);
    return { saved: false };
  } else {
    const { data, error } = await supabaseAdmin
      .from('publication_saves')
      .insert({ publication_id: publicationId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return { saved: true, data };
  }
};

export const getUserSavedPublications = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('publication_saves')
    .select('publications(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};
