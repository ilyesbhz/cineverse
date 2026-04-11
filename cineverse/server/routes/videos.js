import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import { uploadVideo, uploadSubtitle } from '../config/multer.js';
import {
  addSubtitle,
  deleteVideo,
  getAllVideos,
  getVideo,
  likeVideo,
  updateWatchHistory,
  uploadVideo as uploadVideoHandler
} from '../controllers/videoController.js';

const router = express.Router();

router.get('/', getAllVideos);
router.get('/:id', getVideo);

router.post('/upload', auth, isAdmin, uploadVideo.single('video'), uploadVideoHandler);
router.post('/:id/subtitle', auth, isAdmin, uploadSubtitle.single('subtitle'), addSubtitle);
router.post('/watch-history', auth, updateWatchHistory);
router.post('/:id/like', auth, likeVideo);
router.delete('/:id', auth, isAdmin, deleteVideo);

export default router;
