import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import {
  addComment,
  adminDeleteDiscussion,
  createDiscussion,
  deleteDiscussion,
  getDiscussions,
  moderateDiscussion,
  reportDiscussion,
  setDiscussionSpoilerStatus,
  toggleLike
} from '../controllers/discussionController.js';

const router = express.Router();

router.get('/', auth, getDiscussions);
router.post('/', auth, createDiscussion);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.post('/:id/report', auth, reportDiscussion);
router.delete('/:id', auth, deleteDiscussion);
router.delete('/:id/admin', auth, isAdmin, adminDeleteDiscussion);
router.put('/:id/moderate', auth, isAdmin, moderateDiscussion);
router.put('/:id/spoiler', auth, isAdmin, setDiscussionSpoilerStatus);

export default router;
