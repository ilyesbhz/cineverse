import express from 'express';
import authenticate from '../middleware/auth.js';
import User from '../models/user.js';

const router = express.Router();

// Add/remove from watchlist
router.post('/watchlist/:movieId', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const movieId = req.params.movieId;

    // Check if movie is already in watchlist
    const user = await User.findById(userId).select('watchlist');
    const isInList = user.watchlist.some(id => id.toString() === movieId);

    let updatedUser;
    if (isInList) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { watchlist: movieId } },
        { new: true }
      ).populate('watchlist');
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { watchlist: movieId } },
        { new: true }
      ).populate('watchlist');
    }

    res.json({ watchlist: updatedUser.watchlist, added: !isInList });
  } catch (err) {
    console.error('Watchlist error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get watchlist
router.get('/watchlist', authenticate, async (req, res) => {
  try {
    await req.user.populate('watchlist');
    res.json(req.user.watchlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update watch history
router.post('/history/:movieId', authenticate, async (req, res) => {
  try {
    const { progress } = req.body;
    const user = req.user;
    const existing = user.watchHistory.find(h => h.movie.toString() === req.params.movieId);
    if (existing) {
      existing.progress = progress;
      existing.watchedAt = new Date();
    } else {
      user.watchHistory.push({ movie: req.params.movieId, progress });
    }
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;