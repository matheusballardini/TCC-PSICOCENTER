import { successResponse } from '../utils/response.js';
import * as followerService from '../services/followerService.js';

export const followUser = async (req, res, next) => {
  try {
    const data = await followerService.followUser(req.user.id, req.params.userId);
    res.status(201).json(successResponse('Usuário seguido', data));
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    await followerService.unfollowUser(req.user.id, req.params.userId);
    res.json(successResponse('Usuário deixado de seguir', {}));
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const data = await followerService.getUserFollowers(req.params.userId);
    res.json(successResponse('Seguidores', data));
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const data = await followerService.getUserFollowing(req.params.userId);
    res.json(successResponse('Seguindo', data));
  } catch (error) {
    next(error);
  }
};

export const checkFollowing = async (req, res, next) => {
  try {
    const isFollowing = await followerService.isFollowing(req.user.id, req.params.userId);
    res.json(successResponse('Status de seguimento', { isFollowing }));
  } catch (error) {
    next(error);
  }
};

export const getFollowerCount = async (req, res, next) => {
  try {
    const count = await followerService.getFollowerCount(req.params.userId);
    res.json(successResponse('Quantidade de seguidores', { count }));
  } catch (error) {
    next(error);
  }
};

export const getFollowingCount = async (req, res, next) => {
  try {
    const count = await followerService.getFollowingCount(req.params.userId);
    res.json(successResponse('Quantidade de usuários seguindo', { count }));
  } catch (error) {
    next(error);
  }
};
