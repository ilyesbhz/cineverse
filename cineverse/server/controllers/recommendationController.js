import User from '../models/user.js';
import Video from '../models/video.js';

export const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const preferences = user.preferences;
    const watchedVideoIds = user.watchHistory.map((h) => h.videoId).filter(Boolean);

    let videos = await Video.find({ _id: { $nin: watchedVideoIds } });

    videos = videos.map((video) => {
      const categoryScore = preferences.get(video.category) || 0;
      return {
        ...video.toObject(),
        recommendationScore: categoryScore
      };
    });

    videos.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return res.json(videos.slice(0, 20));
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
