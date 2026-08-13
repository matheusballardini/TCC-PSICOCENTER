import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';

export const uploadFile = async (req, res, next) => {
  try {
    const bucket = req.body.bucket || 'documents';
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Arquivo não enviado', error: {} });
    }

    const path = `${req.body.folder || 'temp'}/${uuidv4()}-${file.originalname}`;
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) throw error;

    res.status(201).json(successResponse('Arquivo enviado', data));
  } catch (error) {
    next(error);
  }
};
