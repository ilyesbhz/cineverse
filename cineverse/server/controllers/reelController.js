import Reel from '../models/reel.js';
import youtubeService from '../services/youtubeService.js';
import tmdbEnrichment from '../services/tmdbEnrichment.js';

export const uploadReel = async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Reel video is required' });
    }

    const reel = await Reel.create({
      title,
      videoUrl: `/uploads/reels/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    return res.status(201).json({ message: 'Reel uploaded successfully', reel });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

/**
 * Get paginated reel feed with filters
 * Query params: page, limit, category, genres (comma-separated)
 */
export const getReelsFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    if (req.query.genres) {
      const genres = req.query.genres.split(',').map(g => g.trim()).filter(Boolean);
      if (genres.length > 0) {
        filter.genres = { $in: genres };
      }
    }

    const reels = await Reel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name username')
      .lean();

    const total = await Reel.countDocuments(filter);

    return res.json({
      reels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get single reel by ID
 */
export const getReelById = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('uploadedBy', 'name username')
      .populate('likes', 'name username');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    return res.json(reel);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all reels (for backward compatibility)
 */
export const getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('uploadedBy', 'name username')
      .sort({ createdAt: -1 });
    return res.json(reels);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Seed reels from YouTube
 * Admin only
 * Query params: query (required), category (optional), limit (default 20)
 */
export const seedReelsFromYouTube = async (req, res) => {
  try {
    const { query, category, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    // Search YouTube
    const youtubeResults = await youtubeService.searchReels(query, category, limit);

    if (youtubeResults.length === 0) {
      return res.status(404).json({ message: 'No reels found on YouTube' });
    }

    const seeded = [];
    const failed = [];

    // Enrich each result with TMDB data and save
    for (const youtubeReel of youtubeResults) {
      try {
        // Check for duplicate
        const existing = await Reel.findOne({ youtubeVideoId: youtubeReel.youtubeVideoId });
        if (existing) {
          continue; // Skip duplicate
        }

        // Enrich with TMDB data
        const enriched = await tmdbEnrichment.enrichReel(youtubeReel);

        // Save to database
        const reel = new Reel({
          youtubeVideoId: enriched.youtubeVideoId,
          title: enriched.title,
          thumbnail: enriched.thumbnail,
          duration: enriched.duration,
          category: enriched.category,
          genres: enriched.genres || [],
          tmdbId: enriched.tmdbId || null,
          tmdbMetadata: enriched.tmdbMetadata || {},
          views: 0,
          likes: []
        });

        await reel.save();
        seeded.push(reel);
      } catch (error) {
        console.error(`Failed to seed reel "${youtubeReel.title}":`, error.message);
        failed.push({
          title: youtubeReel.title,
          error: error.message
        });
      }
    }

    return res.json({
      message: `Seeded ${seeded.length} reels, ${failed.length} failed`,
      seeded: seeded.length,
      failed: failed.length,
      reels: seeded,
      errors: failed
    });
  } catch (error) {
    return res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
};

/**
 * Toggle like on a reel
 * Uses array of user IDs instead of simple count
 */
export const likeReel = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Initialize likes array if undefined
    if (!reel.likes) {
      reel.likes = [];
    }

    // Convert to array if it's a number (backward compatibility)
    if (typeof reel.likes === 'number') {
      reel.likes = [];
    }

    const userIdStr = req.user._id.toString();
    const likeIndex = reel.likes.findIndex(id => id.toString() === userIdStr);

    if (likeIndex > -1) {
      // Unlike
      reel.likes.splice(likeIndex, 1);
    } else {
      // Like
      reel.likes.push(req.user._id);
    }

    await reel.save();

    return res.json({
      liked: likeIndex === -1,
      likes: reel.likes.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const incrementView = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.views += 1;
    await reel.save();

    return res.json({ views: reel.views });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndDelete(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    return res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
