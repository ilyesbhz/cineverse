import express from 'express';

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

router.get('/', async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(400).json({ message: 'TMDB_API_KEY is not configured' });
    }

    const page1 = fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=1`).then((r) => r.json());
    const page2 = fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=2`).then((r) => r.json());
    const [data1, data2] = await Promise.all([page1, page2]);
    const allMovies = [...(data1.results || []), ...(data2.results || [])];

    const detailFetches = allMovies.slice(0, 20).map(async (movie) => {
      const [videos, details] = await Promise.all([
        fetch(`${TMDB_BASE}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`).then((r) => r.json()),
        fetch(`${TMDB_BASE}/movie/${movie.id}?api_key=${TMDB_API_KEY}`).then((r) => r.json())
      ]);

      const trailer = (videos.results || []).find(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );

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
    });

    const reels = (await Promise.all(detailFetches)).filter((r) => r.poster && r.trailerKey);
    return res.json(reels);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch movie reels', error: error.message });
  }
});

export default router;
