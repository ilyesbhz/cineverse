import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getReelComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment
} from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

// Get comments for a reel
router.get('/', getReelComments);

// Create a comment
router.post('/', auth, createComment);

// Update a comment
router.put('/:commentId', auth, updateComment);

// Delete a comment
router.delete('/:commentId', auth, deleteComment);

// Like a comment
router.post('/:commentId/like', auth, likeComment);

export default router;
