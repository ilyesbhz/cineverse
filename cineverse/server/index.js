import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import userRoutes from './routes/users.js';
import videoRoutes from './routes/videos.js';
import reelRoutes from './routes/reels.js';
import recommendationRoutes from './routes/recommendations.js';
import subscriptionRoutes from './routes/subscriptions.js';
import movieReelsRoutes from './routes/movieReels.js';
import discussionRoutes from './routes/discussions.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/movie-reels', movieReelsRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CineVerse API running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 CineVerse server running on http://localhost:${PORT}`);
});

export default app;