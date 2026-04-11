import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/movie.js';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80';

const tmdbFetch = async (path, params = {}) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is missing in environment variables');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}) for ${path}`);
  }

  return res.json();
};

const mapTmdbMovieToSchema = (movie, genreMap) => {
  const year = Number(movie.release_date?.slice(0, 4)) || new Date().getFullYear();
  const thumbnail = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null;
  const backdrop = movie.backdrop_path ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}` : thumbnail;
  const genres = (movie.genre_ids || []).map((id) => genreMap.get(id)).filter(Boolean);

  if (!thumbnail && !backdrop) {
    return null;
  }

  return {
    title: movie.title,
    description: movie.overview || 'No description available.',
    year,
    genre: genres.length ? genres : ['Movie'],
    rating: Number(movie.vote_average?.toFixed(1)) || 0,
    thumbnail: thumbnail || backdrop || FALLBACK_IMAGE,
    backdrop: backdrop || thumbnail || FALLBACK_IMAGE,
    featured: movie.popularity >= 120,
    trending: movie.popularity >= 80,
    isNew: year >= new Date().getFullYear() - 1,
    maturityRating: movie.adult ? 'R' : 'PG-13',
    viewCount: Math.max(0, Math.round((movie.popularity || 0) * 100))
  };
};

const fetchRealMoviesFromTmdb = async () => {
  const genreResponse = await tmdbFetch('/genre/movie/list', { language: 'en-US' });
  const genreMap = new Map((genreResponse.genres || []).map((g) => [g.id, g.name]));

  const pages = [1, 2, 3];
  const responses = await Promise.all(
    pages.map((page) => tmdbFetch('/movie/popular', { language: 'en-US', page }))
  );

  const merged = responses.flatMap((r) => r.results || []);
  const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
  const mapped = unique
    .map((movie) => mapTmdbMovieToSchema(movie, genreMap))
    .filter(Boolean);

  if (!mapped.length) {
    throw new Error('No movies could be mapped from TMDB response');
  }

  return mapped;
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cineverse');
    const movies = await fetchRealMoviesFromTmdb();
    await Movie.deleteMany({});
    await Movie.insertMany(movies);
    console.log(`✅ Seeded ${movies.length} real movies from TMDB`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();