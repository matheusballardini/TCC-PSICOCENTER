import { successResponse, errorResponse } from '../utils/response.js';
import * as psychologistService from '../services/psychologistService.js';

export const getPsychologists = async (_req, res, next) => {
  try {
    const data = await psychologistService.getAllPsychologists();
    res.json(successResponse('Psicólogos listados', data));
  } catch (error) {
    next(error);
  }
};

export const getPsychologistById = async (req, res, next) => {
  try {
    const data = await psychologistService.getPsychologistById(req.params.id);
    res.json(successResponse('Psicólogo encontrado', data));
  } catch (error) {
    next(error);
  }
};

export const updatePsychologist = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json(errorResponse('Você pode apenas atualizar seu próprio perfil', {}, 403));
    }
    const data = await psychologistService.updatePsychologist(req.params.id, req.body);
    res.json(successResponse('Psicólogo atualizado', data));
  } catch (error) {
    next(error);
  }
};

export const getPsychologistSpecialties = async (req, res, next) => {
  try {
    const data = await psychologistService.getPsychologistSpecialties(req.params.id);
    res.json(successResponse('Especialidades do psicólogo', data));
  } catch (error) {
    next(error);
  }
};

export const addSpecialty = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json(errorResponse('Você pode apenas atualizar seu próprio perfil', {}, 403));
    }
    const data = await psychologistService.addSpecialty(req.params.id, req.body.specialtyId);
    res.status(201).json(successResponse('Especialidade adicionada', data));
  } catch (error) {
    next(error);
  }
};

export const removeSpecialty = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json(errorResponse('Você pode apenas atualizar seu próprio perfil', {}, 403));
    }
    await psychologistService.removeSpecialty(req.params.id, req.body.specialtyId);
    res.json(successResponse('Especialidade removida', {}));
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const data = await psychologistService.getPsychologistAvailability(req.params.id);
    res.json(successResponse('Disponibilidade do psicólogo', data));
  } catch (error) {
    next(error);
  }
};

export const setAvailability = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json(errorResponse('Você pode apenas atualizar seu próprio perfil', {}, 403));
    }
    const data = await psychologistService.setAvailability(req.params.id, req.body);
    res.json(successResponse('Disponibilidade atualizada', data));
  } catch (error) {
    next(error);
  }
};

export const getRatings = async (req, res, next) => {
  try {
    const data = await psychologistService.getPsychologistRatings(req.params.id);
    res.json(successResponse('Avaliações do psicólogo', data));
  } catch (error) {
    next(error);
  }
};

export const createRating = async (req, res, next) => {
  try {
    const data = await psychologistService.createRating(req.params.id, {
      ...req.body,
      rater_id: req.user.id,
    });
    res.status(201).json(successResponse('Avaliação criada', data));
  } catch (error) {
    next(error);
  }
};
