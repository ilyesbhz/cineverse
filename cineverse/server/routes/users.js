import express from 'express';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Add/remove from watchlist
router.post('/watchlist/:movieId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const movieId = req.params.movieId;
    const isInList = user.watchlist.includes(movieId);

    if (isInList) {
      user.watchlist = user.watchlist.filter(id => id.toString() !== movieId);
    } else {
      user.watchlist.push(movieId);
    }
    await user.save();
    await user.populate('watchlist');
    res.json({ watchlist: user.watchlist, added: !isInList });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get watchlist
router.get('/watchlist', authenticate, async (req, res) => {
  try {
    await req.user.populate('watchlist');
    res.json(req.user.watchlist);
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