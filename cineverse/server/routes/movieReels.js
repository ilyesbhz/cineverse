import express from 'express';
import Movie from '../models/movie.js';

const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

// Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;  // Read at runtime
    console.log('TMDB_API_KEY configured:', !!TMDB_API_KEY);
    console.log('TMDB_API_KEY value:', TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 5)}...` : 'NOT SET');

    if (!TMDB_API_KEY) {
      return res.json({
        status: 'error',
        message: 'TMDB_API_KEY not configured in .env',
        trailers: false
      });
    }

    // Test TMDB connection
    const testRes = await fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=1`);
    const testData = await testRes.json();

    if (testData.status_code === 401 || testData.status_code === 7) {
      return res.json({
        status: 'error',
        message: 'Invalid TMDB API Key',
        details: testData,
        trailers: false
      });
    }

    const firstMovie = testData.results?.[0];
    if (!firstMovie) {
      return res.json({
        status: 'error',
        message: 'No movies returned from TMDB',
        trailers: false
      });
    }

    // Get video for first movie
    const videoRes = await fetch(`${TMDB_BASE}/movie/${firstMovie.id}/videos?api_key=${TMDB_API_KEY}`);
    const videoData = await videoRes.json();
    const trailer = (videoData.results || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

    return res.json({
      status: 'success',
      message: 'TMDB API is working correctly',
      trailers: true,
      testMovie: {
        title: firstMovie.title,
        hasTrailer: !!trailer,
        trailerKey: trailer?.key || null,
        trailerType: trailer?.type || null
      }
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      trailers: false
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;  // Read at runtime

    // If TMDB API key is not configured, use movies from database
    if (!TMDB_API_KEY) {
      const movies = await Movie.find()
        .select('_id title year genre rating thumbnail backdrop')
        .limit(20)
        .sort({ rating: -1 });

      const reels = movies.map((movie) => ({
        id: movie._id.toString(),
        title: movie.title,
        year: movie.year,
        genre: movie.genre?.join(', ') || 'N/A',
        plot: '',
        rating: movie.rating || 'N/A',
        poster: movie.thumbnail,
        backdrop: movie.backdrop,
        director: '',
        actors: '',
        clipUrl: null,
        trailerKey: null
      }));

      return res.json(reels);
    }

    // Otherwise fetch from TMDB - use now_playing and top_rated for better trailer coverage
    const nowPlaying = fetch(`${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&page=1`).then((r) => r.json());
    const topRated = fetch(`${TMDB_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`).then((r) => r.json());
    const [data1, data2] = await Promise.all([nowPlaying, topRated]);
    const allMovies = [...(data1.results || []), ...(data2.results || [])];

    const detailFetches = allMovies.slice(0, 40).map(async (movie) => {  // Fetch 40 movies for more trailers
      try {
        const videosRes = await fetch(`${TMDB_BASE}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`);
        const videos = await videosRes.json();

        const detailsRes = await fetch(`${TMDB_BASE}/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
        const details = await detailsRes.json();

        // Search for video types in priority order
        let trailer = null;
        const videoTypes = ['Trailer', 'Teaser', 'Clip', 'Opening Credits', 'Featurette'];
        
        for (const type of videoTypes) {
          trailer = (videos.results || []).find(
            (v) => v.site === 'YouTube' && v.type === type
          );
          if (trailer) break;  // Use first match
        }

        const genres = (details.genres || []).map((g) => g.name).join(', ');

        return {
          id: String(movie.id),
          title: movie.title,
          year: (movie.release_date || '').slice(0, 4),
          genre: genres || 'N/A',
          plot: movie.overview || '',
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
          poster: movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `${TMDB_IMG}/w1280${movie.backdrop_path}` : null,
          director: '',
          actors: '',
          clipUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1` : null,
          trailerKey: trailer ? trailer.key : null
        };
      } catch (err) {
        console.error(`Error fetching details for movie ${movie.id}:`, err.message);
        return null;
      }
    });

    const allReels = (await Promise.all(detailFetches))
      .filter((r) => r && r.poster);  // Include all movies with posters
    
    // Sort: movies with trailers first, then others
    const reels = allReels.sort((a, b) => {
      const aHasTrailer = !!a.trailerKey ? 1 : 0;
      const bHasTrailer = !!b.trailerKey ? 1 : 0;
      return bHasTrailer - aHasTrailer;
    }).slice(0, 20);  // Return top 20
    
    return res.json(reels);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch movie reels', error: error.message });
  }
});

export default router;
