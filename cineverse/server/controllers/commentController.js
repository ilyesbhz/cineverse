import Comment from '../models/comment.js';
import Reel from '../models/reel.js';

/**
 * Get all comments for a reel
 */
export const getReelComments = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ reelId })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Comment.countDocuments({ reelId });

    return res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Create a new comment
 */
export const createComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { reelId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment must be less than 500 characters' });
    }

    // Verify reel exists
    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const comment = new Comment({
      reelId,
      userId: req.user._id,
      text: text.trim(),
      likes: []
    });

    await comment.save();
    await comment.populate('userId', 'name username');

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment must be less than 500 characters' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await comment.save();
    await comment.populate('userId', 'name username');

    return res.json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership or admin
    if (comment.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

/**
 * Like a comment
 */
export const likeComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userIdStr = req.user._id.toString();
    const likeIndex = comment.likes.findIndex(id => id.toString() === userIdStr);

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();

    return res.json({
      liked: likeIndex === -1,
      likes: comment.likes.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
