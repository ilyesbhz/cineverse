import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  TMDB_API_KEY not configured. TMDB features will be limited.');
    }
  }

  getAxios() {
    if (!this.axios) {
      this.axios = axios.create({
        baseURL: TMDB_BASE_URL,
        params: { api_key: this.apiKey }
      });
    }
    return this.axios;
  }

  // Helper to transform TMDB movie response to our schema
  mapMovie(movie) {
    const year = Number(movie.release_date?.slice(0, 4)) || new Date().getFullYear();
    const posterPath = movie.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
      : null;
    const backdropPath = movie.backdrop_path
      ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}`
      : posterPath;

    return {
      tmdbId: movie.id,
      title: movie.title,
      description: movie.overview || 'No description available.',
      year,
      genre: (movie.genres || movie.genre_ids || []).map(g => typeof g === 'string' ? g : g.name).filter(Boolean),
      rating: Number(movie.vote_average?.toFixed(1)) || 0,
      duration: movie.runtime || null,
      director: null, // Would need credits endpoint
      cast: [], // Would need credits endpoint
      thumbnail: posterPath || backdropPath,
      backdrop: backdropPath || posterPath,
      trailerUrl: null, // Would need videos endpoint
      featured: (movie.popularity || 0) >= 120,
      trending: (movie.popularity || 0) >= 80,
      isNew: year >= new Date().getFullYear() - 1,
      maturityRating: movie.adult ? 'R' : 'PG-13',
      language: movie.original_language || 'English',
      viewCount: Math.max(0, Math.round((movie.popularity || 0) * 100))
    };
  }

  // Get popular movies
  async getPopularMovies(page = 1) {
    const { data } = await this.getAxios().get('/movie/popular', {
      params: { page, language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results
    };
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1) {
    const { data } = await this.getAxios().get('/movie/top_rated', {
      params: { page, language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Get upcoming movies
  async getUpcomingMovies(page = 1) {
    const { data } = await this.getAxios().get('/movie/upcoming', {
      params: { page, language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Get now playing movies
  async getNowPlayingMovies(page = 1) {
    const { data } = await this.getAxios().get('/movie/now_playing', {
      params: { page, language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Get trending movies
  async getTrendingMovies(timeWindow = 'week') {
    const { data } = await this.getAxios().get(`/trending/movie/${timeWindow}`, {
      params: { language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Search movies
  async searchMovies(query, page = 1) {
    if (!query || query.trim().length === 0) {
      return { results: [], page: 1, totalPages: 0 };
    }
    const { data } = await this.getAxios().get('/search/movie', {
      params: { query, page, language: 'en-US' }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Get movie details with videos and credits
  async getMovieDetails(tmdbId) {
    const { data } = await this.getAxios().get(`/movie/${tmdbId}`, {
      params: {
        append_to_response: 'videos,credits,external_ids',
        language: 'en-US'
      }
    });

    const movie = this.mapMovie(data);

    // Extract YouTube trailer
    const videos = data.videos?.results || [];
    const trailer = videos.find(v =>
      v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos.find(v => v.site === 'YouTube');

    if (trailer) {
      movie.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }

    // Extract director and cast
    const credits = data.credits || {};
    const director = credits.crew?.find(p => p.job === 'Director');
    movie.director = director?.name || null;
    movie.cast = (credits.cast || []).slice(0, 10).map(c => c.name);

    return movie;
  }

  // Get all genres
  async getGenres() {
    const { data } = await this.axios.get('/genre/movie/list', {
      params: { language: 'en-US' }
    });
    return data.genres || [];
  }

  // Get movies by genre
  async getMoviesByGenre(genreId, page = 1) {
    const { data } = await this.axios.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        language: 'en-US',
        sort_by: 'popularity.desc'
      }
    });
    return {
      results: data.results.map(m => this.mapMovie(m)),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Get TV shows
  async getPopularTVShows(page = 1) {
    const { data } = await this.getAxios().get('/tv/popular', {
      params: { page, language: 'en-US' }
    });
    return {
      results: data.results.map(show => ({
        tmdbId: show.id,
        title: show.name,
        description: show.overview || 'No description available.',
        year: Number(show.first_air_date?.slice(0, 4)) || new Date().getFullYear(),
        genre: (show.genres || show.genre_ids || []).map(g => typeof g === 'string' ? g : g.name).filter(Boolean),
        rating: Number(show.vote_average?.toFixed(1)) || 0,
        thumbnail: show.poster_path
          ? `${TMDB_IMAGE_BASE}/w500${show.poster_path}`
          : null,
        backdrop: show.backdrop_path
          ? `${TMDB_IMAGE_BASE}/original${show.backdrop_path}`
          : null,
        featured: (show.popularity || 0) >= 120,
        trending: (show.popularity || 0) >= 80,
        isNew: Number(show.first_air_date?.slice(0, 4)) >= new Date().getFullYear() - 1,
        maturityRating: show.adult ? 'R' : 'PG-13',
        language: show.original_language || 'English',
        viewCount: Math.max(0, Math.round((show.popularity || 0) * 100)),
        isTV: true
      })),
      page: data.page,
      totalPages: data.total_pages
    };
  }

  // Search TV shows
  async searchTVShows(query, page = 1) {
    const { data } = await this.getAxios().get('/search/tv', {
      params: { query, page, language: 'en-US' }
    });
    return {
      results: data.results.map(show => ({
        tmdbId: show.id,
        title: show.name,
        description: show.overview || 'No description available.',
        year: Number(show.first_air_date?.slice(0, 4)) || new Date().getFullYear(),
        rating: Number(show.vote_average?.toFixed(1)) || 0,
        thumbnail: show.poster_path
          ? `${TMDB_IMAGE_BASE}/w500${show.poster_path}`
          : null,
        backdrop: show.backdrop_path
          ? `${TMDB_IMAGE_BASE}/original${show.backdrop_path}`
          : null,
        isTV: true
      })),
      page: data.page,
      totalPages: data.total_pages
    };
  }
}

export default new TMDBService();
