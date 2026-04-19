import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { uploadReel } from '../config/multer.js';
import commentRoutes from './comments.js';
import {
  deleteReel,
  getAllReels,
  getReelsFeed,
  getReelById,
  incrementView,
  likeReel,
  seedReelsFromYouTube,
  uploadReel as uploadReelHandler
} from '../controllers/reelController.js';

const router = express.Router();

// Paginated feed with filtering
router.get('/feed', getReelsFeed);

// Get single reel by ID
router.get('/:id', getReelById);

// Get all reels (backward compatibility)
router.get('/', getAllReels);

// Upload reel (admin only)
router.post('/upload', auth, isAdmin, uploadReel.single('reel'), uploadReelHandler);

// Seed reels from YouTube (admin only)
router.post('/seed', auth, isAdmin, seedReelsFromYouTube);

// Track view
router.post('/:id/view', incrementView);

// Like/unlike reel
router.post('/:id/like', auth, likeReel);

// Comments routes (nested under reels)
router.use('/:reelId/comments', commentRoutes);

// Delete reel (admin only)
router.delete('/:id', auth, isAdmin, deleteReel);

export default router;
