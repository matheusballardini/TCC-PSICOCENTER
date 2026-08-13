import { supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';

export const listEspecialidades = async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('especialidades')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    res.json(successResponse('Especialidades listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getEspecialidadeById = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('especialidades')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(successResponse('Especialidade encontrada', data));
  } catch (error) {
    next(error);
  }
};
