import { successResponse, errorResponse } from '../utils/response.js';
import * as patientService from '../services/patientService.js';
import * as ratingService from '../services/ratingService.js';
import { isValidName, isValidBirthDate } from './authController.js';

export const getPatients = async (_req, res, next) => {
  try {
    const data = await patientService.getAllPatients();
    res.json(successResponse('Pacientes listados', data));
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const data = await patientService.getPatientById(req.params.id);
    res.json(successResponse('Paciente encontrado', data));
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json(errorResponse('Você pode apenas atualizar seu próprio perfil', {}, 403));
    }
    if (req.body.full_name !== undefined && !isValidName(req.body.full_name)) {
      return res.status(400).json(errorResponse('Nome inválido: não pode ter números nem 4 ou mais letras repetidas seguidas.', {}, 400));
    }
    if (req.body.birth_date && !isValidBirthDate(req.body.birth_date)) {
      return res.status(400).json(errorResponse('Data de nascimento inválida: deve ser a partir de 1900 e não pode ser no futuro.', {}, 400));
    }
    const data = await patientService.updatePatient(req.params.id, req.body);
    res.json(successResponse('Paciente atualizado', data));
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const data = await patientService.getPatientById(req.user.id);
    res.json(successResponse('Perfil carregado', data));
  } catch (error) {
    next(error);
  }
};

// Média + total de avaliações do paciente (dadas por psicólogos), calculados na hora.
export const getRatingSummary = async (req, res, next) => {
  try {
    const data = await ratingService.getPatientRatingSummary(req.params.id);
    res.json(successResponse('Resumo de avaliações do paciente', data));
  } catch (error) {
    next(error);
  }
};

export const getRatings = async (req, res, next) => {
  try {
    const data = await ratingService.getPatientRatings(req.params.id);
    res.json(successResponse('Avaliações do paciente', data));
  } catch (error) {
    next(error);
  }
};
