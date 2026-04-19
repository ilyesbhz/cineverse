const ARCHIVE_API_BASE = 'https://archive.org/advancedsearch.php';
const ARCHIVE_SERVE_BASE = 'https://archive.org/serve';

class ArchiveService {
  /**
   * Search for movies on Archive.org
   * @param {string} query - Movie title or search term
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Array of movie objects with video URLs
   */
  async searchMovies(query, limit = 5) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // Build Archive.org search query - target movies and videos
      // Use multiple approaches to find content
      const searchQueries = [
        // Exact title search with video filters
        `"${query.trim()}" AND (mediatype:movies OR mediatype:video) AND (format:"H.264" OR format:"MPEG4" OR format:"WebM")`,
        // Broader search for movies/videos
        `"${query.trim()}" AND (mediatype:movies OR mediatype:video OR collection:open_source_movies)`,
        // Title search in any video collection
        `${query.trim()} AND mediatype:video AND format:"H.264"`,
        // Public domain movies
        `${query.trim()} AND (collection:community_texts OR collection:movies) AND mediatype:video`
      ];

      // Try each search strategy until we find results
      for (const searchQuery of searchQueries) {
        const params = new URLSearchParams({
          q: searchQuery,
          fl: 'identifier,title,description,creator,date,runtime,subject',
          output: 'json',
          rows: limit * 3,
          sort: 'downloads desc' // Sort by popularity
        });

        try {
          const response = await fetch(`${ARCHIVE_API_BASE}?${params}`);
          if (!response.ok) continue;

          const data = await response.json();
          const results = data.response?.docs || [];

          if (results.length > 0) {
            console.log(`  ✅ Found ${results.length} results with search strategy`);

            // Process results and extract video URLs
            const processedMovies = await Promise.all(
              results.slice(0, limit).map(item => this.getMovieDetails(item.identifier))
            );

            const validMovies = processedMovies.filter(Boolean).slice(0, limit);
            if (validMovies.length > 0) {
              return validMovies;
            }
          }
        } catch (error) {
          // Try next strategy
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error('Archive.org search error:', error.message);
      return [];
    }
  }

  /**
   * Get detailed movie information including video URL from Archive.org item
   * @param {string} itemId - Archive.org item identifier
   * @returns {Promise<Object|null>} Movie object with video URL or null
   */
  async getMovieDetails(itemId) {
    try {
      const metadataUrl = `https://archive.org/metadata/${itemId}`;
      const response = await fetch(metadataUrl);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const metadata = data.metadata || {};
      const files = data.files || [];

      // Find the best video file (prefer MP4, fallback to WebM, OGG)
      const videoFile = this.selectBestVideoFile(files);
      if (!videoFile) {
        return null;
      }

      // Build the video URL
      const videoUrl = `${ARCHIVE_SERVE_BASE}/${itemId}/${videoFile.name}`;

      // Extract thumbnail - prefer external_identifier format used by Archive.org
      let thumbnail = null;
      const itemImg = `https://archive.org/services/img/${itemId}`;
      // Verify it's accessible by adding dimensions to Archive.org image request
      thumbnail = `https://archive.org/services/img/${itemId}/image_200.jpg`;

      // Parse metadata
      const title = metadata.title || 'Unknown Title';
      const description = metadata.description?.[0] ||
                         metadata.summary ||
                         'No description available';
      const creator = metadata.creator?.[0] || metadata.contributors?.[0] || 'Unknown';
      const year = this.extractYear(metadata.date?.[0] || metadata.publicdate || '');
      const runtime = metadata.runtime?.[0] ? parseInt(metadata.runtime[0]) : null;
      const subjects = metadata.subject || [];

      const movie = {
        archiveId: itemId,
        title: this.cleanTitle(title),
        description: this.cleanDescription(description),
        director: creator,
        year: year || new Date().getFullYear(),
        duration: runtime,
        genre: this.mapSubjectsToGenres(subjects),
        thumbnail,
        videoUrl,
        source: 'archive.org',
        language: 'English',
        rating: 6.5, // Default rating for Archive.org content
        maturityRating: 'PG'
      };

      // Correct metadata for known classic films
      return this.correctKnownMetadata(movie);
    } catch (error) {
      console.error(`Error fetching details for ${itemId}:`, error.message);
      return null;
    }
  }

  /**
   * Select the best video file from available files
   * Prefers MP4, then WebM, then OGG
   */
  selectBestVideoFile(files) {
    if (!Array.isArray(files)) return null;

    const videoExtensions = ['mp4', 'webm', 'ogv', 'ogg', 'mkv', 'avi'];
    const priorityMap = {
      mp4: 0,
      'h.264': 0,
      webm: 1,
      ogv: 2,
      ogg: 2,
      mkv: 3,
      avi: 4
    };

    // Filter for video files with reasonable size
    const videoFiles = files.filter(file => {
      if (!file.name || !file.size) return false;

      const ext = file.name.split('.').pop()?.toLowerCase();
      const format = file.format?.toLowerCase() || '';

      // Must be a video file
      const isVideoExt = videoExtensions.includes(ext);
      const isVideoFormat = format.includes('video') || format.includes('h.264') ||
                           format.includes('mpeg') || format.includes('quicktime');

      // Must be at least 10MB (reasonable movie length)
      const isLargeEnough = parseInt(file.size) > 10000000;

      return (isVideoExt || isVideoFormat) && isLargeEnough;
    });

    if (videoFiles.length === 0) {
      console.log('  ⚠️  No suitable video files found');
      return null;
    }

    // Sort by priority (lower priority number = better)
    videoFiles.sort((a, b) => {
      const extA = a.name?.split('.').pop()?.toLowerCase() || '';
      const extB = b.name?.split('.').pop()?.toLowerCase() || '';
      const formatA = a.format?.toLowerCase() || '';
      const formatB = b.format?.toLowerCase() || '';

      const priorityA = priorityMap[extA] ?? (priorityMap[formatA.split(':')[0]] ?? 999);
      const priorityB = priorityMap[extB] ?? (priorityMap[formatB.split(':')[0]] ?? 999);

      return priorityA - priorityB;
    });

    const selected = videoFiles[0];
    console.log(`  📹 Selected: ${selected.name} (${(parseInt(selected.size) / 1000000).toFixed(0)}MB)`);
    return selected;
  }

  /**
   * Correct metadata for known classic films
   */
  correctKnownMetadata(movie) {
    const corrections = {
      'cabinet': { year: 1920, director: 'Robert Wiene' },
      'caligari': { year: 1920, director: 'Robert Wiene' },
      'nosferatu': { year: 1922, director: 'F.W. Murnau' },
      'metropolis': { year: 1927, director: 'Fritz Lang' },
      'scarlet street': { year: 1945, director: 'Fritz Lang' },
      'trip to the moon': { year: 1902, director: 'Georges Méliès' },
      'voyage dans la lune': { year: 1902, director: 'Georges Méliès' },
      'big buck bunny': { year: 2008, director: 'Sacha Goedegebure' },
      'elephants dream': { year: 2006, director: 'Bassam Kurdali' },
      'sintel': { year: 2010, director: 'Colin Levy' }
    };

    const titleLower = movie.title.toLowerCase();

    for (const [key, correction] of Object.entries(corrections)) {
      if (titleLower.includes(key)) {
        movie.year = correction.year;
        if (!movie.director || movie.director === 'Unknown') {
          movie.director = correction.director;
        }
        break;
      }
    }

    return movie;
  }

  /**
   * Extract year from date string - improved version
   */
  extractYear(dateString) {
    if (!dateString) return new Date().getFullYear();

    const dateStr = String(dateString);

    // Try to extract year from various formats
    // "1920" or "1920-01-01" or "03/15/1945"
    const matches = dateStr.match(/\b(1[89]\d{2}|20\d{2})\b/g);

    if (matches && matches.length > 0) {
      const year = parseInt(matches[0]);
      // Sanity check - year should be between 1900 and current year
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }

    return new Date().getFullYear();
  }

  /**
   * Clean title by removing extra brackets and metadata
   */
  cleanTitle(title) {
    return title
      .replace(/\[.*?\]/g, '') // Remove brackets
      .replace(/\(.*?[Cc]olors?\)/g, '') // Remove color info
      .replace(/\[.*?[Rr]eels?\]/g, '') // Remove reel info
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
  }

  /**
   * Clean description by removing Archive.org-specific metadata
   */
  cleanDescription(desc) {
    if (!desc) return 'No description available.';
    if (typeof desc !== 'string') return 'No description available.';

    return desc
      .split('\n')[0] // Take first line only
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 500) // Limit length
      .trim() || 'No description available.';
  }

  /**
   * Map Archive.org subjects to movie genres
   */
  mapSubjectsToGenres(subjects = []) {
    if (!Array.isArray(subjects)) return ['Movie'];

    const genreMap = {
      'drama': 'Drama',
      'comedy': 'Comedy',
      'action': 'Action',
      'adventure': 'Adventure',
      'animation': 'Animation',
      'documentary': 'Documentary',
      'horror': 'Horror',
      'sci-fi': 'Science Fiction',
      'science fiction': 'Science Fiction',
      'fantasy': 'Fantasy',
      'romance': 'Romance',
      'thriller': 'Thriller',
      'war': 'War',
      'western': 'Western',
      'musical': 'Musical',
      'crime': 'Crime'
    };

    const genres = new Set();
    subjects.forEach(subject => {
      const lower = subject.toLowerCase();
      Object.entries(genreMap).forEach(([key, genre]) => {
        if (lower.includes(key)) {
          genres.add(genre);
        }
      });
    });

    return genres.size > 0 ? Array.from(genres).slice(0, 5) : ['Movie'];
  }

  /**
   * Find a free movie on Archive.org matching a title
   * Used as fallback for TMDB movies
   */
  async findFreeVersionOfMovie(title, year = null) {
    try {
      const results = await this.searchMovies(title, 3);

      if (results.length === 0) return null;

      // Return the first result with valid video URL
      return results.find(movie => movie && movie.videoUrl) || null;
    } catch (error) {
      console.error(`Error finding free version of "${title}":`, error.message);
      return null;
    }
  }
}

export default new ArchiveService();
