import fs from 'fs';
import path from 'path';
import multer from 'multer';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const buildStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const fullPath = path.join(process.cwd(), 'uploads', folder);
    ensureDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mkv|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const subtitleFilter = (req, file, cb) => {
  const allowedTypes = /vtt|srt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only .vtt or .srt subtitle files are allowed'));
  }
};

export const uploadVideo = multer({
  storage: buildStorage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

export const uploadReel = multer({
  storage: buildStorage('reels'),
  fileFilter: videoFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export const uploadSubtitle = multer({
  storage: buildStorage('subtitles'),
  fileFilter: subtitleFilter,
  limits: { fileSize: 1 * 1024 * 1024 }
});
