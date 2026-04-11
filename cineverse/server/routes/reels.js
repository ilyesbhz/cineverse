import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { uploadReel } from '../config/multer.js';
import {
  deleteReel,
  getAllReels,
  incrementView,
  likeReel,
  uploadReel as uploadReelHandler
} from '../controllers/reelController.js';

const router = express.Router();

router.get('/', getAllReels);
router.post('/upload', auth, isAdmin, uploadReel.single('reel'), uploadReelHandler);
router.post('/:id/view', incrementView);
router.post('/:id/like', auth, likeReel);
router.delete('/:id', auth, isAdmin, deleteReel);

export default router;
