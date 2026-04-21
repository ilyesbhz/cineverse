import User from '../models/user.js';
import Subscription from '../models/subscription.js';

export const trackMovieWatch = async (req, res) => {
  try {
    const { movieId, reelId } = req.body;
    const userId = req.user._id;

    if (!movieId && !reelId) {
      return res.status(400).json({ message: 'movieId or reelId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize watch history if it doesn't exist
    if (!user.watchHistory) {
      user.watchHistory = [];
    }

    // Check if already watched
    const alreadyWatched = user.watchHistory.some(
      w => (w.movie && w.movie.toString() === movieId) ||
           (w.videoId && w.videoId.toString() === reelId)
    );

    if (!alreadyWatched) {
      // Add to watch history
      if (movieId) {
        user.watchHistory.push({
          movie: movieId,
          watchedAt: new Date(),
          progress: 100
        });
      } else {
        user.watchHistory.push({
          videoId: reelId,
          watchedAt: new Date(),
          progress: 100
        });
      }
    }

    // Check achievements
    const watchCount = user.watchHistory.length;
    let achievementsUnlocked = [];

    // Binge Starter: 5 movies
    if (watchCount >= 5 && !user.achievements.bingeStarter) {
      user.achievements.bingeStarter = true;
      achievementsUnlocked.push({
        badge: 'bingeStarter',
        label: 'Binge Starter',
        emoji: '🎬',
        reward: 1
      });

      // Add bonus movie to subscription if user has an active subscription
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });

      if (subscription) {
        subscription.bonusMovies = (subscription.bonusMovies || 0) + 1;
        await subscription.save();
      }
    }

    // Movie Addict: 30 movies
    if (watchCount >= 30 && !user.achievements.movieAddict) {
      user.achievements.movieAddict = true;
      achievementsUnlocked.push({
        badge: 'movieAddict',
        label: 'Movie Addict',
        emoji: '🎭',
        reward: 3
      });

      // Add bonus movies to subscription
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });

      if (subscription) {
        subscription.bonusMovies = (subscription.bonusMovies || 0) + 3;
        await subscription.save();
      }
    }

    await user.save();

    return res.json({
      message: 'Watch tracked successfully',
      watchCount,
      achievements: user.achievements,
      achievementsUnlocked
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const user = await User.findById(userId)
      .select('name username achievements watchHistory')
      .populate('watchHistory.movie', 'title')
      .populate('watchHistory.videoId', 'title');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const watchCount = user.watchHistory ? user.watchHistory.length : 0;

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        achievements: user.achievements,
        watchCount
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
