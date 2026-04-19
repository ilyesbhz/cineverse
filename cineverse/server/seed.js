import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/movie.js';
import archiveService from './services/archiveService.js';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80';
const DEFAULT_TMDB_LIMIT = 30;
const DEFAULT_ARCHIVE_LIMIT = 20;

const ARCHIVE_SEED_QUERIES = [
  'public domain feature film',
  'classic movie',
  'silent film',
  'free movie',
  'archive.org movies',
  'open source movies'
];

const getArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    tmdbId: movie.id,
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
    language: movie.original_language || 'English',
    viewCount: Math.max(0, Math.round((movie.popularity || 0) * 100)),
    source: 'tmdb',
    isFree: false
  };
};

const fetchTmdbMovies = async (limit = DEFAULT_TMDB_LIMIT) => {
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

  return mapped.slice(0, limit);
};

const mapArchiveMovieToSchema = (movie) => ({
  title: movie.title,
  description: movie.description || 'No description available.',
  year: movie.year || new Date().getFullYear(),
  genre: Array.isArray(movie.genre) && movie.genre.length ? movie.genre : ['Movie'],
  rating: movie.rating || 6.5,
  duration: movie.duration || null,
  director: movie.director || null,
  cast: movie.cast || [],
  thumbnail: movie.thumbnail || FALLBACK_IMAGE,
  backdrop: movie.backdrop || movie.thumbnail || FALLBACK_IMAGE,
  trailerUrl: null,
  videoUrl: movie.videoUrl,
  featured: false,
  trending: false,
  isNew: false,
  maturityRating: movie.maturityRating || 'PG',
  language: movie.language || 'English',
  viewCount: 0,
  source: 'archive.org',
  archiveId: movie.archiveId,
  isFree: true
});

const fetchArchiveMovies = async (limit = DEFAULT_ARCHIVE_LIMIT) => {
  const unique = new Map();

  for (const query of ARCHIVE_SEED_QUERIES) {
    if (unique.size >= limit) break;

    console.log(`  📽️  Archive search: "${query}"`);
    const remaining = Math.max(1, Math.min(10, limit - unique.size));
    const results = await archiveService.searchMovies(query, remaining);

    for (const movie of results) {
      if (!movie?.archiveId || !movie?.videoUrl) continue;
      if (!unique.has(movie.archiveId)) {
        unique.set(movie.archiveId, mapArchiveMovieToSchema(movie));
      }
    }

    await sleep(300);
  }

  return Array.from(unique.values()).slice(0, limit);
};

const getIdentityQuery = (movie) => {
  if (movie.tmdbId) return { tmdbId: movie.tmdbId };
  if (movie.archiveId) return { archiveId: movie.archiveId };
  return { title: movie.title, year: movie.year };
};

const mergeMovieData = (existing, incoming) => ({
  ...existing,
  ...incoming,
  videoUrl: incoming.videoUrl || existing.videoUrl,
  thumbnail: incoming.thumbnail || existing.thumbnail,
  backdrop: incoming.backdrop || existing.backdrop
});

const upsertMovies = async (movies) => {
  let inserted = 0;
  let updated = 0;

  for (const movie of movies) {
    const query = getIdentityQuery(movie);
    const existing = await Movie.findOne(query);

    if (!existing) {
      await Movie.create(movie);
      inserted += 1;
      continue;
    }

    Object.assign(existing, mergeMovieData(existing.toObject(), movie));
    await existing.save();
    updated += 1;
  }

  return { inserted, updated };
};

const seed = async () => {
  const mode = getArg('mode', 'replace'); // replace | append
  const source = getArg('source', 'mixed'); // mixed | tmdb | archive
  const tmdbLimit = Number(getArg('tmdbLimit', String(DEFAULT_TMDB_LIMIT)));
  const archiveLimit = Number(getArg('archiveLimit', String(DEFAULT_ARCHIVE_LIMIT)));

  if (!['replace', 'append'].includes(mode)) {
    throw new Error(`Invalid mode "${mode}". Use replace or append.`);
  }

  if (!['mixed', 'tmdb', 'archive'].includes(source)) {
    throw new Error(`Invalid source "${source}". Use mixed, tmdb, or archive.`);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cineverse');

    const tmdbMovies = source === 'archive' ? [] : await fetchTmdbMovies(tmdbLimit);
    const archiveMovies = source === 'tmdb' ? [] : await fetchArchiveMovies(archiveLimit);
    const movies = [...tmdbMovies, ...archiveMovies];

    if (!movies.length) {
      throw new Error('No movies found for seeding');
    }

    console.log(`\n📊 Seed plan:`);
    console.log(`  • mode: ${mode}`);
    console.log(`  • source: ${source}`);
    console.log(`  • tmdb candidates: ${tmdbMovies.length}`);
    console.log(`  • archive candidates: ${archiveMovies.length}`);

    if (mode === 'replace') {
      const deleted = await Movie.deleteMany({});
      console.log(`🧹 Cleared collection: ${deleted.deletedCount} removed`);
    }

    const result = await upsertMovies(movies);
    console.log(`✅ Seed completed: ${result.inserted} inserted, ${result.updated} updated`);
    console.log(`📚 Catalog totals included: ${movies.length}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    if (err.errors) {
      console.error(err.errors);
    }
    process.exit(1);
  }
};

seed();