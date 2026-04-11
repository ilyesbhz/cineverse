import Video from '../models/video.js';
import User from '../models/user.js';

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, category, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const video = await Video.create({
      title,
      description,
      category,
      duration: Number(duration),
      videoUrl: `/uploads/videos/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    return res.status(201).json({ message: 'Video uploaded successfully', video });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const videos = await Video.find(query).populate('uploadedBy', 'name username').sort({ createdAt: -1 });
    return res.json(videos);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploadedBy', 'name username');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.views += 1;
    await video.save();

    return res.json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateWatchHistory = async (req, res) => {
  try {
    const { videoId, progress } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const user = await User.findById(userId);
    const currentScore = user.preferences.get(video.category) || 0;
    user.preferences.set(video.category, currentScore + 3);

    const existingHistory = user.watchHistory.find((h) => h.videoId?.toString() === videoId);

    if (existingHistory) {
      existingHistory.progress = progress;
      existingHistory.watchedAt = Date.now();
    } else {
      user.watchHistory.push({ videoId, progress });
    }

    await user.save();
    return res.json({ message: 'Watch history updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.likes += 1;
    await video.save();

    const user = await User.findById(req.user._id);
    const currentScore = user.preferences.get(video.category) || 0;
    user.preferences.set(video.category, currentScore + 5);
    await user.save();

    return res.json({ message: 'Video liked', likes: video.likes });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addSubtitle = async (req, res) => {
  try {
    const { language } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Subtitle file is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.subtitles.push({
      language,
      url: `/uploads/subtitles/${req.file.filename}`
    });

    await video.save();
    return res.json({ message: 'Subtitle added successfully', subtitles: video.subtitles });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    return res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
