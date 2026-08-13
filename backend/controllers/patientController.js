import { successResponse, errorResponse } from '../utils/response.js';
import * as patientService from '../services/patientService.js';

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
