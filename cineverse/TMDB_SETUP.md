# TMDB Integration Guide

## Overview

Cineverse now integrates with **The Movie Database (TMDB)** API to provide:
- Real-time movie metadata (500k+ movies)
- High-quality posters and backdrops
- Trailers, cast, and crew information
- TV shows support
- Search functionality

## Setup

### 1. Get Your TMDB API Key (if not already configured)

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Go to Settings → API → Request an API Key
4. Choose "Developer"
5. Copy your API key

### 2. Configure Environment Variables

Your `.env` file should have:

```env
TMDB_API_KEY=your_api_key_here
```

The default key is already configured for testing.

## Running the Seed Script

Populate your local database with real movies:

```bash
cd server
npm run seed
```

This will:
- Fetch ~60 popular movies from TMDB
- Add sample test video URLs (Blender Foundation films)
- Store in your MongoDB database

## API Endpoints

### Local Movies (from your database)

| Endpoint | Description |
|----------|-------------|
| `GET /api/movies` | Get all movies with filters |
| `GET /api/movies/:id` | Get single movie |
| `GET /api/movies/featured` | Get featured movies |
| `GET /api/movies/trending` | Get trending movies |
| `GET /api/movies/genres` | Get all genres |

### TMDB API (real-time from TMDB)

| Endpoint | Description |
|----------|-------------|
| `GET /api/tmdb/movies/popular` | Get popular movies |
| `GET /api/tmdb/movies/top-rated` | Get top rated movies |
| `GET /api/tmdb/movies/upcoming` | Get upcoming movies |
| `GET /api/tmdb/movies/now-playing` | Get now playing movies |
| `GET /api/tmdb/movies/trending` | Get trending movies |
| `GET /api/tmdb/movies/search?q=avengers` | Search movies |
| `GET /api/tmdb/movies/:tmdbId` | Get movie details with trailer |
| `GET /api/tmdb/genres` | Get all genres |
| `GET /api/tmdb/genres/:id/movies` | Get movies by genre |
| `GET /api/tmdb/tv/popular` | Get popular TV shows |
| `POST /api/tmdb/movies/:tmdbId/save` | Save TMDB movie to local DB |

## Test Videos

The seed script assigns sample videos from Google's CDN:

- **Big Buck Bunny** (2008) - Animated short film
- **Sintel** (2010) - Fantasy animated film
- **Tears of Steel** (2012) - Sci-fi live action
- **Elephants Dream** (2006) - First Blender open movie
- **For Bigger** series - Google demo clips

All videos are **CC-BY licensed** (free to use for testing).

## Frontend Usage

### Using the TMDB API in React

```javascript
import { streamxApi } from '../services/api';

// Get popular movies
const { data } = await streamxApi.getTmdbPopularMovies(1);
console.log(data.results); // Array of movies

// Search movies
const { data } = await streamxApi.searchTmdb('Avengers', 1);

// Get movie details with trailer
const { data } = await streamxApi.getTmdbMovieDetails(299536); // Avengers

// Save movie to local database
const { data } = await streamxApi.saveTmdbMovie(299536);
```

## Movie Object Structure

```javascript
{
  tmdbId: 299536,
  title: "Avengers: Infinity War",
  description: "As the Avengers and their allies...",
  year: 2018,
  genre: ["Action", "Adventure", "Science Fiction"],
  rating: 8.3,
  thumbnail: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOY...",
  backdrop: "https://image.tmdb.org/t/p/original/mDfJG32...",
  trailerUrl: "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
  featured: true,
  trending: true,
  isNew: false,
  maturityRating: "PG-13",
  videoUrl: "https://commondatastorage.googleapis.com/..."
}
```

## Troubleshooting

### "TMDB_API_KEY is missing"
- Check your `.env` file in the `server` folder
- Restart your server after changing `.env`

### No images loading
- TMDB images require HTTPS
- Check browser console for CORS errors

### Rate limiting
- Free tier: 500 requests per 10 seconds
- Should be plenty for development

## Next Steps

1. **Run the seed script**: `npm run seed`
2. **Start the server**: `npm run dev`
3. **Start the client**: `npm start`
4. **Browse movies**: Go to http://localhost:3000/browse

## Resources

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [TMDB Image Sizes](https://developers.themoviedb.org/3/getting-started/images)
- [Blender Foundation Open Movies](https://durian.blender.org/)
