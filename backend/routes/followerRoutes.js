import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing,
  getFollowerCount,
  getFollowingCount,
} from '../controllers/followerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:userId/follow', requireAuth, followUser);
router.delete('/:userId/follow', requireAuth, unfollowUser);

router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/followers/count', getFollowerCount);
router.get('/:userId/following/count', getFollowingCount);
router.get('/:userId/is-following', requireAuth, checkFollowing);

export default router;
