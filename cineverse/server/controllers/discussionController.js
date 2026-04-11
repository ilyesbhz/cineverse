import Discussion from '../models/discussion.js';
import { createNotification } from './notificationController.js';

const SPOILER_KEYWORDS = ['ending', 'dies', 'death', 'killer', 'final scene', 'twist'];
const INAPPROPRIATE_KEYWORDS = ['hate', 'racist', 'sexist', 'porn', 'nsfw'];
const SPOILER_TAG_PATTERNS = [/>!.*?!</i, /\[spoiler\][\s\S]*?\[\/spoiler\]/i, /#spoiler\b/i];

const detectFlaggedKeywords = (text = '') => {
  const normalized = text.toLowerCase();
  const matched = [...SPOILER_KEYWORDS, ...INAPPROPRIATE_KEYWORDS].filter((keyword) => normalized.includes(keyword));
  return [...new Set(matched)];
};

const hasSpoilerTag = (text = '') => SPOILER_TAG_PATTERNS.some((pattern) => pattern.test(text));

export const getDiscussions = async (req, res) => {
  try {
    const { category, status } = req.query;
    const categoryFilter = category ? { category } : {};

    let filter = {};
    if (req.user.role === 'admin') {
      filter = { ...categoryFilter, ...(status ? { status } : {}) };
    } else {
      const visibility = { $or: [{ status: 'approved' }, { user: req.user._id }] };
      filter = category ? { $and: [categoryFilter, visibility] } : visibility;
    }

    const discussions = await Discussion.find(filter)
      .populate('user', 'name username')
      .populate('comments.user', 'name username')
      .populate('moderatedBy', 'name username')
      .sort({ createdAt: -1 });

    return res.json(discussions);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching discussions', error: error.message });
  }
};

export const createDiscussion = async (req, res) => {
  try {
    const { title, content, category, movieTitle, rating, containsSpoiler: manualSpoiler } = req.body;
    const combinedText = `${title || ''} ${content || ''}`;
    const flaggedKeywords = detectFlaggedKeywords(combinedText);
    const hasSpoilerMarkup = hasSpoilerTag(combinedText);
    const containsSpoiler =
      Boolean(manualSpoiler) ||
      flaggedKeywords.some((k) => SPOILER_KEYWORDS.includes(k)) ||
      hasSpoilerMarkup;

    const discussion = new Discussion({
      user: req.user._id,
      title,
      content,
      category,
      movieTitle,
      rating,
      status: 'pending',
      containsSpoiler,
      flaggedKeywords
    });

    await discussion.save();
    await discussion.populate('user', 'name username');

    return res.status(201).json({ message: 'Discussion submitted for admin approval', discussion });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating discussion', error: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    if (discussion.status !== 'approved') return res.status(403).json({ message: 'Only approved discussions can be liked' });

    const idx = discussion.likes.findIndex((id) => id.toString() === req.user._id.toString());
    if (idx === -1) {
      discussion.likes.push(req.user._id);
      await createNotification({
        recipient: discussion.user,
        sender: req.user._id,
        type: 'like',
        title: 'New like on your post',
        message: `${req.user.name || req.user.username} liked your post "${discussion.title}"`,
        link: '/discussions'
      });
    } else {
      discussion.likes.splice(idx, 1);
    }

    await discussion.save();
    await discussion.populate('user', 'name username');
    await discussion.populate('comments.user', 'name username');
    return res.json(discussion);
  } catch (error) {
    return res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    if (discussion.status !== 'approved') return res.status(403).json({ message: 'Only approved discussions can be commented on' });

    discussion.comments.push({ user: req.user._id, text: req.body.text });
    await discussion.save();
    await discussion.populate('user', 'name username');
    await discussion.populate('comments.user', 'name username');

    await createNotification({
      recipient: discussion.user._id || discussion.user,
      sender: req.user._id,
      type: 'comment',
      title: 'New comment on your post',
      message: `${req.user.name || req.user.username} commented on "${discussion.title}"`,
      link: '/discussions'
    });

    return res.status(201).json(discussion);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

export const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    if (discussion.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    await discussion.deleteOne();
    return res.json({ message: 'Discussion deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting discussion', error: error.message });
  }
};

export const adminDeleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    await discussion.deleteOne();
    return res.json({ message: 'Discussion deleted by admin' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting discussion', error: error.message });
  }
};

export const moderateDiscussion = async (req, res) => {
  try {
    const { action, status, moderationReason, reason } = req.body;

    // Support both 'action' and 'status' formats for flexibility
    const finalAction = action || (status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : null);
    const finalReason = moderationReason || reason || '';

    if (!['approve', 'reject'].includes(finalAction)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    discussion.status = finalAction === 'approve' ? 'approved' : 'rejected';
    discussion.moderationReason = finalReason;
    discussion.moderatedBy = req.user._id;
    discussion.moderatedAt = new Date();
    await discussion.save();

    await createNotification({
      recipient: discussion.user,
      sender: req.user._id,
      type: 'system',
      title: finalAction === 'approve' ? 'Discussion approved' : 'Discussion rejected',
      message: finalAction === 'approve'
        ? `Your discussion "${discussion.title}" is now public.`
        : `Your discussion "${discussion.title}" was rejected.${finalReason ? ` Reason: ${finalReason}` : ''}`,
      link: '/discussions'
    });

    await discussion.populate('user', 'name username');
    await discussion.populate('moderatedBy', 'name username');
    return res.json(discussion);
  } catch (error) {
    return res.status(500).json({ message: 'Error moderating discussion', error: error.message });
  }
};

export const setDiscussionSpoilerStatus = async (req, res) => {
  try {
    const { containsSpoiler } = req.body;
    if (typeof containsSpoiler !== 'boolean') {
      return res.status(400).json({ message: 'containsSpoiler must be a boolean' });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    if (discussion.status !== 'pending') {
      return res.status(400).json({ message: 'Spoiler status can only be changed while pending' });
    }

    discussion.containsSpoiler = containsSpoiler;
    discussion.moderatedBy = req.user._id;
    discussion.moderatedAt = new Date();
    await discussion.save();

    await discussion.populate('user', 'name username');
    await discussion.populate('moderatedBy', 'name username');
    return res.json(discussion);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating spoiler status', error: error.message });
  }
};

export const reportDiscussion = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const alreadyReported = discussion.reports.some((r) => r.user.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ message: 'You already reported this discussion' });
    }

    discussion.reports.push({ user: req.user._id, reason });

    if (discussion.reports.length >= 3 && discussion.status === 'approved') {
      discussion.status = 'pending';
      discussion.moderationReason = 'Auto-hidden after multiple reports';
      discussion.moderatedBy = null;
      discussion.moderatedAt = null;
    }

    await discussion.save();
    return res.json({ message: 'Discussion reported successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error reporting discussion', error: error.message });
  }
};
