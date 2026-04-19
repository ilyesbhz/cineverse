import express from 'express';
import tmdbService from '../services/tmdbService.js';
import archiveService from '../services/archiveService.js';
import Movie from '../models/movie.js';

const router = express.Router();

// Get popular movies from TMDB
router.get('/movies/popular', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getPopularMovies(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch popular movies',
      error: error.message
    });
  }
});

// Get top rated movies from TMDB
router.get('/movies/top-rated', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getTopRatedMovies(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch top rated movies',
      error: error.message
    });
  }
});

// Get upcoming movies from TMDB
router.get('/movies/upcoming', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getUpcomingMovies(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch upcoming movies',
      error: error.message
    });
  }
});

// Get now playing movies from TMDB
router.get('/movies/now-playing', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getNowPlayingMovies(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch now playing movies',
      error: error.message
    });
  }
});

// Get trending movies from TMDB
router.get('/movies/trending', async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow || 'week';
    const data = await tmdbService.getTrendingMovies(timeWindow);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch trending movies',
      error: error.message
    });
  }
});

// Search movies on TMDB
router.get('/movies/search', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const data = await tmdbService.searchMovies(query, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to search movies',
      error: error.message
    });
  }
});

// Get movie details from TMDB (with videos, credits)
router.get('/movies/:tmdbId', async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const movie = await tmdbService.getMovieDetails(tmdbId);
    res.json(movie);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch movie details',
      error: error.message
    });
  }
});

// Get all genres from TMDB
router.get('/genres', async (req, res) => {
  try {
    const genres = await tmdbService.getGenres();
    res.json(genres);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch genres',
      error: error.message
    });
  }
});

// Get movies by genre from TMDB
router.get('/genres/:genreId/movies', async (req, res) => {
  try {
    const genreId = req.params.genreId;
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getMoviesByGenre(genreId, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch movies by genre',
      error: error.message
    });
  }
});

// Get popular TV shows from TMDB
router.get('/tv/popular', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getPopularTVShows(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch TV shows',
      error: error.message
    });
  }
});

// Search TV shows on TMDB
router.get('/tv/search', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const data = await tmdbService.searchTVShows(query, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to search TV shows',
      error: error.message
    });
  }
});

// Save a TMDB movie to local database
router.post('/movies/:tmdbId/save', async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const movie = await tmdbService.getMovieDetails(tmdbId);

    // Check if already exists
    const existing = await Movie.findOne({ tmdbId });
    if (existing) {
      return res.json({ message: 'Movie already exists', movie: existing });
    }

    // Try to find a free version on Archive.org first
    let videoUrl = null;
    let source = 'blender';
    let archiveId = null;

    try {
      console.log(`Searching Archive.org for free version of "${movie.title}"...`);
      const archiveMovie = await archiveService.findFreeVersionOfMovie(movie.title, movie.year);

      if (archiveMovie && archiveMovie.videoUrl) {
        videoUrl = archiveMovie.videoUrl;
        source = 'archive.org';
        archiveId = archiveMovie.archiveId;
        console.log(`✅ Found on Archive.org: ${archiveMovie.archiveId}`);
      }
    } catch (error) {
      console.log(`Could not find on Archive.org: ${error.message}`);
    }

    if (!videoUrl) {
      return res.status(422).json({
        message: 'No playable Internet Archive source found for this title',
        hint: 'Use /api/archive/search to import a public-domain title directly.'
      });
    }

    movie.videoUrl = videoUrl;
    movie.source = source;
    if (archiveId) {
      movie.archiveId = archiveId;
    }

    const savedMovie = await Movie.create(movie);
    res.status(201).json({
      message: 'Movie saved successfully',
      movie: savedMovie,
      source: source
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to save movie',
      error: error.message
    });
  }
});

export default router;
