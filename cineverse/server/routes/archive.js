import express from 'express';
import archiveService from '../services/archiveService.js';
import Movie from '../models/movie.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Search playable public-domain movies from Internet Archive
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await archiveService.searchMovies(query, limit);
    return res.json({ results, total: results.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search Internet Archive', error: error.message });
  }
});

// Get a specific Internet Archive item details with selected playable file
router.get('/item/:archiveId', async (req, res) => {
  try {
    const movie = await archiveService.getMovieDetails(req.params.archiveId);
    if (!movie) {
      return res.status(404).json({ message: 'Archive item not found or not playable' });
    }

    return res.json(movie);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch archive item', error: error.message });
  }
});

// Import search results from Internet Archive into local movies collection
router.post('/import', auth, isAdmin, async (req, res) => {
  try {
    const query = req.body.query;
    const limit = Math.min(parseInt(req.body.limit, 10) || 10, 25);
    const upsert = req.body.upsert !== false;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'query is required in request body' });
    }

    const archiveMovies = await archiveService.searchMovies(query, limit);

    if (!archiveMovies.length) {
      return res.json({ message: 'No playable results found on Internet Archive', imported: 0, updated: 0 });
    }

    let imported = 0;
    let updated = 0;
    const importedMovies = [];

    for (const archiveMovie of archiveMovies) {
      const payload = {
        title: archiveMovie.title,
        description: archiveMovie.description,
        year: archiveMovie.year,
        genre: archiveMovie.genre,
        rating: archiveMovie.rating || 6.5,
        duration: archiveMovie.duration,
        director: archiveMovie.director,
        cast: archiveMovie.cast || [],
        thumbnail: archiveMovie.thumbnail,
        backdrop: archiveMovie.backdrop || archiveMovie.thumbnail,
        trailerUrl: archiveMovie.trailerUrl || null,
        videoUrl: archiveMovie.videoUrl,
        source: 'archive.org',
        archiveId: archiveMovie.archiveId,
        isFree: true,
        featured: false,
        trending: false,
        isNew: false,
        maturityRating: archiveMovie.maturityRating || 'PG',
        language: archiveMovie.language || 'English'
      };

      const existing = await Movie.findOne({ archiveId: archiveMovie.archiveId });

      if (existing && upsert) {
        Object.assign(existing, payload);
        await existing.save();
        updated += 1;
        importedMovies.push(existing);
        continue;
      }

      if (!existing) {
        const created = await Movie.create(payload);
        imported += 1;
        importedMovies.push(created);
      }
    }

    return res.status(201).json({
      message: 'Internet Archive import completed',
      imported,
      updated,
      totalProcessed: archiveMovies.length,
      movies: importedMovies
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to import from Internet Archive', error: error.message });
  }
});

export default router;