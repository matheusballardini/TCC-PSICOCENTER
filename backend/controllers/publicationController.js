import { successResponse, errorResponse } from '../utils/response.js';
import * as publicationService from '../services/publicationService.js';

export const listPublications = async (_req, res, next) => {
  try {
    const data = await publicationService.getAllPublications();
    res.json(successResponse('Publicações listadas', data));
  } catch (error) {
    next(error);
  }
};

export const getPublicationById = async (req, res, next) => {
  try {
    const data = await publicationService.getPublicationById(req.params.id);
    res.json(successResponse('Publicação encontrada', data));
  } catch (error) {
    next(error);
  }
};

export const createPublication = async (req, res, next) => {
  try {
    const data = await publicationService.createPublication({
      ...req.body,
      author_id: req.user.id,
    });
    res.status(201).json(successResponse('Publicação criada', data));
  } catch (error) {
    next(error);
  }
};

export const updatePublication = async (req, res, next) => {
  try {
    const publication = await publicationService.getPublicationById(req.params.id);
    if (publication.author_id !== req.user.id) {
      return res.status(403).json(errorResponse('Você pode apenas editar suas próprias publicações', {}, 403));
    }
    const data = await publicationService.updatePublication(req.params.id, req.body);
    res.json(successResponse('Publicação atualizada', data));
  } catch (error) {
    next(error);
  }
};

export const deletePublication = async (req, res, next) => {
  try {
    const publication = await publicationService.getPublicationById(req.params.id);
    if (publication.author_id !== req.user.id) {
      return res.status(403).json(errorResponse('Você pode apenas deletar suas próprias publicações', {}, 403));
    }
    await publicationService.deletePublication(req.params.id);
    res.json(successResponse('Publicação removida', {}));
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const data = await publicationService.getPublicationComments(req.params.id);
    res.json(successResponse('Comentários da publicação', data));
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const data = await publicationService.addComment(req.params.id, req.user.id, req.body.content);
    res.status(201).json(successResponse('Comentário adicionado', data));
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    await publicationService.deleteComment(req.params.commentId);
    res.json(successResponse('Comentário removido', {}));
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const result = await publicationService.toggleLike(req.params.id, req.user.id);
    res.json(successResponse('Like atualizado', result));
  } catch (error) {
    next(error);
  }
};

export const toggleSave = async (req, res, next) => {
  try {
    const result = await publicationService.toggleSave(req.params.id, req.user.id);
    res.json(successResponse('Save atualizado', result));
  } catch (error) {
    next(error);
  }
};

export const getMySavedPublications = async (req, res, next) => {
  try {
    const data = await publicationService.getUserSavedPublications(req.user.id);
    res.json(successResponse('Publicações salvas', data));
  } catch (error) {
    next(error);
  }
};
