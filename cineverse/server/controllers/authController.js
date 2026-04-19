import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.js';
import Video from '../models/video.js';
import Reel from '../models/reel.js';
import Discussion from '../models/discussion.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cineverse_secret_key';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedScriptPath = path.resolve(__dirname, '../seed.js');

let currentSeedJob = null;
let lastSeedJob = null;

const parseLimit = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    const resolvedUsername = username || name;

    if (!resolvedUsername || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      $or: [{ email }, { username: resolvedUsername }]
    });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username: resolvedUsername,
      name: name || resolvedUsername,
      email,
      password
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchlist').select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, username, email } = req.body;
    const userId = req.user._id;

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already in use' });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalVideos, totalReels, totalDiscussions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Video.countDocuments(),
      Reel.countDocuments(),
      Discussion.countDocuments()
    ]);

    return res.json({ totalUsers, totalAdmins, totalVideos, totalReels, totalDiscussions });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      role = 'user',
      subscriptionPlan = 'free'
    } = req.body;

    const resolvedUsername = username || name;
    if (!name || !resolvedUsername || !email || !password) {
      return res.status(400).json({ message: 'Name, username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      $or: [{ email }, { username: resolvedUsername }]
    });
    if (existing) {
      return res.status(400).json({ message: 'Email or username already registered' });
    }

    const user = await User.create({
      name,
      username: resolvedUsername,
      email,
      password,
      role,
      plan: subscriptionPlan,
      subscription: {
        plan: subscriptionPlan,
        expiresAt: null
      }
    });

    return res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, role, subscriptionPlan, subscriptionExpiresAt } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      user.username = username;
    }

    if (name) user.name = name;
    if (role) user.role = role;

    if (subscriptionPlan) {
      user.subscription.plan = subscriptionPlan;
      user.plan = subscriptionPlan;
    }

    if (subscriptionExpiresAt !== undefined) {
      user.subscription.expiresAt = subscriptionExpiresAt || null;
    }

    await user.save();

    return res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const runCatalogSeed = async (req, res) => {
  try {
    if (currentSeedJob?.status === 'running') {
      return res.status(409).json({
        message: 'A seed job is already running',
        job: currentSeedJob
      });
    }

    const mode = req.body?.mode || 'append';
    const source = req.body?.source || 'mixed';
    const tmdbLimit = parseLimit(req.body?.tmdbLimit, 30);
    const archiveLimit = parseLimit(req.body?.archiveLimit, 20);

    if (!['replace', 'append'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode. Allowed: replace, append' });
    }

    if (!['mixed', 'tmdb', 'archive'].includes(source)) {
      return res.status(400).json({ message: 'Invalid source. Allowed: mixed, tmdb, archive' });
    }

    const args = [seedScriptPath, `--mode=${mode}`, `--source=${source}`, `--tmdbLimit=${tmdbLimit}`, `--archiveLimit=${archiveLimit}`];
    const child = spawn(process.execPath, args, {
      cwd: path.resolve(__dirname, '..'),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    currentSeedJob = {
      id: jobId,
      status: 'running',
      mode,
      source,
      tmdbLimit,
      archiveLimit,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      exitCode: null,
      logs: []
    };

    const pushLog = (line) => {
      if (!currentSeedJob) return;
      const trimmed = String(line || '').trim();
      if (!trimmed) return;
      currentSeedJob.logs.push(trimmed);
      if (currentSeedJob.logs.length > 200) {
        currentSeedJob.logs = currentSeedJob.logs.slice(-200);
      }
    };

    child.stdout.on('data', (chunk) => {
      pushLog(chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      pushLog(chunk.toString());
    });

    child.on('close', (code) => {
      if (!currentSeedJob || currentSeedJob.id !== jobId) return;
      currentSeedJob.status = code === 0 ? 'completed' : 'failed';
      currentSeedJob.exitCode = code;
      currentSeedJob.finishedAt = new Date().toISOString();
      lastSeedJob = { ...currentSeedJob };
      currentSeedJob = null;
    });

    child.on('error', (error) => {
      if (!currentSeedJob || currentSeedJob.id !== jobId) return;
      pushLog(`Process error: ${error.message}`);
      currentSeedJob.status = 'failed';
      currentSeedJob.exitCode = 1;
      currentSeedJob.finishedAt = new Date().toISOString();
      lastSeedJob = { ...currentSeedJob };
      currentSeedJob = null;
    });

    return res.status(202).json({
      message: 'Seed job started',
      job: currentSeedJob
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to start seed job', error: error.message });
  }
};

export const getCatalogSeedStatus = async (req, res) => {
  try {
    if (currentSeedJob) {
      return res.json({ running: true, job: currentSeedJob });
    }

    return res.json({
      running: false,
      job: lastSeedJob,
      message: lastSeedJob ? 'Last seed job result' : 'No seed jobs have run yet'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch seed status', error: error.message });
  }
};