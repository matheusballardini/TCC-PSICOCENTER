import { supabaseAdmin } from '../config/supabase.js';

export const followUser = async (followerId, followingId) => {
  const { data, error } = await supabaseAdmin
    .from('followers')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unfollowUser = async (followerId, followingId) => {
  const { error } = await supabaseAdmin
    .from('followers')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
};

export const getUserFollowers = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('followers')
    .select('profiles(*)')
    .eq('following_id', userId);

  if (error) throw error;
  return data;
};

export const getUserFollowing = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('followers')
    .select('profiles(*)')
    .eq('follower_id', userId);

  if (error) throw error;
  return data;
};

export const isFollowing = async (followerId, followingId) => {
  const { data, error } = await supabaseAdmin
    .from('followers')
    .select()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

export const getFollowerCount = async (userId) => {
  const { count, error } = await supabaseAdmin
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) throw error;
  return count;
};

export const getFollowingCount = async (userId) => {
  const { count, error } = await supabaseAdmin
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) throw error;
  return count;
};
