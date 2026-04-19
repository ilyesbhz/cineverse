import tmdbService from './tmdbService.js';

class TMDBEnrichmentService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Enrich a YouTube reel with TMDB metadata
   * Attempts to match the title to a TMDB movie
   */
  async enrichReel(youtubeReel) {
    const cacheKey = `enrichment:${youtubeReel.youtubeVideoId}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const enriched = { ...youtubeReel };

      // Try to match the title to a TMDB movie
      if (youtubeReel.title) {
        // Extract potential movie title (remove common suffixes)
        const cleanTitle = this.extractMovieTitle(youtubeReel.title);

        if (cleanTitle) {
          const tmdbMovie = await this.findMovieByTitle(cleanTitle);

          if (tmdbMovie) {
            enriched.tmdbId = tmdbMovie.tmdbId;
            enriched.genres = tmdbMovie.genre || [];
            enriched.tmdbMetadata = {
              synopsis: tmdbMovie.description,
              director: tmdbMovie.director,
              actors: tmdbMovie.cast,
              releaseDate: tmdbMovie.year
                ? new Date(`${tmdbMovie.year}-01-01`)
                : null,
              rating: tmdbMovie.rating
            };
          }
        }
      }

      // Infer category from title keywords if not provided
      if (!enriched.category) {
        enriched.category = this.inferCategory(youtubeReel.title);
      }

      this.cache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error('TMDB enrichment error:', error.message);
      // Return reel as-is if enrichment fails
      return youtubeReel;
    }
  }

  /**
   * Find a movie in TMDB by fuzzy title matching
   */
  async findMovieByTitle(title) {
    try {
      const results = await tmdbService.searchMovies(title, 1);
      if (results.results && results.results.length > 0) {
        // Return the first result (best match)
        return results.results[0];
      }
      return null;
    } catch (error) {
      console.warn('TMDB movie search failed:', error.message);
      return null;
    }
  }

  /**
   * Extract movie title from YouTube video title
   * Removes common suffixes like "Official Trailer", "Review", etc.
   */
  extractMovieTitle(youtubeTitle) {
    if (!youtubeTitle) return null;

    // Remove common suffixes and keywords
    let title = youtubeTitle
      .replace(/\s*(?:official\s+)?(?:trailer|teaser|clip|promo|sneak\s+peek)/gi, '')
      .replace(/\s*(?:behind\s+the\s+scenes|bts|review|reaction|analysis|breakdown)/gi, '')
      .replace(/\s*(?:fan\s+edit|edit|compilation|edit\s+video)/gi, '')
      .replace(/\s*\|.*$/gi, '') // Remove everything after |
      .replace(/\s*-\s*.*(?:official|trailer|review).*$/gi, '') // Remove trailing descriptions
      .trim();

    // Only return if we have a meaningful title left (at least 3 characters)
    return title.length >= 3 ? title : null;
  }

  /**
   * Infer content category from title keywords
   */
  inferCategory(title) {
    const lowerTitle = (title || '').toLowerCase();

    if (/(official\s+)?trailer|teaser|promo/i.test(lowerTitle)) {
      return 'trailer';
    }
    if (/interview|behind\s+(?:the\s+)?scenes|bts|exclusive/i.test(lowerTitle)) {
      return 'interview';
    }
    if (/fan\s+edit|edit|compilation|mashup/i.test(lowerTitle)) {
      return 'edit';
    }
    if (/review|reaction|analysis|breakdown|critique/i.test(lowerTitle)) {
      return 'review';
    }
    if (/documentary|doc(?:\s+film)?/i.test(lowerTitle)) {
      return 'documentary';
    }

    return 'trailer'; // Default category
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new TMDBEnrichmentService();
