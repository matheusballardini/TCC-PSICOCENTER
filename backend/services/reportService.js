import { supabaseAdmin } from '../config/supabase.js';

export const getAllReports = async () => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getReportById = async (reportId) => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) throw error;
  return data;
};

export const createReport = async (reportData) => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReportStatus = async (reportId, status) => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReport = async (reportId) => {
  const { error } = await supabaseAdmin
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
};

export const getUserReports = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
