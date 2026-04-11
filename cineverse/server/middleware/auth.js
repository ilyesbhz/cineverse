import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cineverse_secret_key';

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};

export const checkSubscription = (requiredPlan) => (req, res, next) => {
  const subscription = req.user?.subscription || { plan: req.user?.plan || 'free' };

  if (!subscription || subscription.plan === 'free') {
    return res.status(403).json({ message: 'Subscription required' });
  }

  if (requiredPlan === 'premium' && subscription.plan !== 'premium') {
    return res.status(403).json({ message: 'Premium subscription required' });
  }

  if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
    return res.status(403).json({ message: 'Subscription expired' });
  }

  return next();
};

export default auth;