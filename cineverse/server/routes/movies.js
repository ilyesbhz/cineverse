import express from 'express';
import Movie from '../models/movie.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Get all movies with filters
router.get('/', async (req, res) => {
  try {
    const { genre, search, sort, page = 1, limit = 20 } = req.query;
    let query = {};

    if (genre && genre !== 'All') query.genre = genre;
    if (search) query.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'year') sortOption = { year: -1 };
    if (sort === 'popular') sortOption = { viewCount: -1 };

    const movies = await Movie.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Movie.countDocuments(query);
    res.json({ movies, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get featured movies
router.get('/featured', async (req, res) => {
  try {
    const movies = await Movie.find({ featured: true }).limit(5);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    const movies = await Movie.find({ trending: true }).sort({ viewCount: -1 }).limit(10);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get genres
router.get('/genres', async (req, res) => {
  try {
    const genres = await Movie.distinct('genre');
    res.json(['All', ...genres]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single movie
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    movie.viewCount += 1;
    await movie.save();
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create movie (admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;