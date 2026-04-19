import axios from 'axios';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.cacheTTL = 3600; // 1 hour
    this.redisClient = null;
    this.memoryCache = new Map(); // Fallback cache
    this.initRedis();
  }

  async initRedis() {
    if (!process.env.REDIS_URL) {
      console.log('Redis not configured, using in-memory cache');
      return;
    }

    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      });
      this.redisClient.on('error', (err) => {
        console.error('Redis error:', err);
        this.redisClient = null;
      });
      await this.redisClient.connect();
      console.log('Redis connected for YouTube caching');
    } catch (error) {
      console.warn('Failed to connect to Redis:', error.message);
      this.redisClient = null;
    }
  }

  async getCachedOrFetch(key, fetcher) {
    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } else {
        // Try memory cache fallback
        const cached = this.memoryCache.get(key);
        if (cached) {
          return cached;
        }
      }

      // Fetch fresh data
      const data = await fetcher();

      // Cache the result
      if (this.redisClient) {
        try {
          await this.redisClient.setEx(key, this.cacheTTL, JSON.stringify(data));
        } catch (err) {
          console.warn('Redis cache write failed:', err.message);
          this.memoryCache.set(key, data);
        }
      } else {
        this.memoryCache.set(key, data);
      }

      return data;
    } catch (error) {
      console.error('Cache or fetch error:', error.message);
      throw error;
    }
  }

  async searchReels(query, category = 'all', maxResults = 20) {
    if (!this.apiKey) {
      throw new Error(`YouTube API key not configured. Set YOUTUBE_API_KEY in .env (currently: ${process.env.YOUTUBE_API_KEY ? 'set' : 'NOT SET'})`);
    }

    const cacheKey = `youtube:search:${query}:${category}:${maxResults}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        // Search for cinema content with keywords
        const categoryKeywords = {
          trailer: 'trailer official',
          interview: 'interview behind scenes',
          edit: 'fan edit cinematic',
          review: 'review analysis',
          documentary: 'documentary',
          all: ''
        };

        const searchQuery = category && categoryKeywords[category]
          ? `${query} ${categoryKeywords[category]}`
          : query;

        const response = await axios.get(`${this.baseUrl}/search`, {
          params: {
            key: this.apiKey,
            q: searchQuery,
            type: 'video',
            maxResults,
            relevanceLanguage: 'en',
            order: 'relevance',
            videoDuration: 'short' // Prefer short videos (reels)
          }
        });

        const videoIds = response.data.items.map(item => item.id.videoId).join(',');

        if (!videoIds) {
          return [];
        }

        // Get detailed video information
        const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            key: this.apiKey,
            id: videoIds,
            part: 'snippet,contentDetails,statistics'
          }
        });

        return detailsResponse.data.items.map(item => ({
          youtubeVideoId: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duration: this.parseDuration(item.contentDetails.duration),
          channelTitle: item.snippet.channelTitle,
          views: parseInt(item.statistics.viewCount || 0),
          likes: parseInt(item.statistics.likeCount || 0),
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description
        }));
      } catch (error) {
        console.error('YouTube search error:', error.message);
        throw new Error(`YouTube search failed: ${error.message}`);
      }
    });
  }

  async getVideoDetails(videoId) {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const cacheKey = `youtube:video:${videoId}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            key: this.apiKey,
            id: videoId,
            part: 'snippet,contentDetails,statistics'
          }
        });

        if (!response.data.items || response.data.items.length === 0) {
          throw new Error('Video not found');
        }

        const item = response.data.items[0];
        return {
          youtubeVideoId: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duration: this.parseDuration(item.contentDetails.duration),
          channelTitle: item.snippet.channelTitle,
          views: parseInt(item.statistics.viewCount || 0),
          likes: parseInt(item.statistics.likeCount || 0),
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description
        };
      } catch (error) {
        console.error('YouTube video details error:', error.message);
        throw new Error(`Failed to fetch video details: ${error.message}`);
      }
    });
  }

  parseDuration(duration) {
    // Parse ISO 8601 duration (PT1H2M3S) to seconds
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return 0;

    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);
    const seconds = parseInt(matches[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async clearCache() {
    if (this.redisClient) {
      try {
        await this.redisClient.flushDb();
      } catch (err) {
        console.warn('Redis flush failed:', err.message);
      }
    }
    this.memoryCache.clear();
  }
}

export default new YouTubeService();

