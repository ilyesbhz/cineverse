import Notification from '../models/notification.js';
import User from '../models/user.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name username')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching count', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Error marking as read', error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Error marking all as read', error: error.message });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, link } = req.body;

    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({ message: 'recipientId, type, title, and message are required' });
    }

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link: link || '',
      sender: req.user._id
    });

    return res.status(201).json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

export const broadcast = async (req, res) => {
  try {
    const { type, title, message, link } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ message: 'type, title, and message are required' });
    }

    const users = await User.find({}).select('_id');
    const notifications = users.map((u) => ({
      recipient: u._id,
      type,
      title,
      message,
      link: link || '',
      sender: req.user._id
    }));

    await Notification.insertMany(notifications);
    return res.status(201).json({ message: `Notification sent to ${users.length} users` });
  } catch (error) {
    return res.status(500).json({ message: 'Error broadcasting', error: error.message });
  }
};

export const createNotification = async ({ recipient, sender, type, title, message, link }) => {
  try {
    if (recipient?.toString() === sender?.toString()) return null;
    return await Notification.create({ recipient, sender, type, title, message, link: link || '' });
  } catch (error) {
    return null;
  }
};
