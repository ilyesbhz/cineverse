import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reel from './models/reel.js';
import User from './models/user.js';

dotenv.config();

const seedReels = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cineverse');

    // Get or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password', // In real scenario, this should be hashed
        name: 'Test User'
      });
      console.log('✅ Created test user');
    }

    // Clear existing reels
    await Reel.deleteMany({});
    console.log('🧹 Cleared existing reels');

    // Create test reels with dummy data (since we don't have actual videos)
    const testReels = [
      {
        title: 'Amazing Movie Moment 1',
        videoUrl: '/uploads/reels/test1.mp4',
        uploadedBy: testUser._id,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100)
      },
      {
        title: 'Awesome Action Scene',
        videoUrl: '/uploads/reels/test2.mp4',
        uploadedBy: testUser._id,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100)
      },
      {
        title: 'Epic Moment',
        videoUrl: '/uploads/reels/test3.mp4',
        uploadedBy: testUser._id,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100)
      }
    ];

    const created = await Reel.insertMany(testReels);
    console.log(`✅ Created ${created.length} test reels`);
    console.log('📺 Reels:');
    created.forEach((reel, i) => {
      console.log(`  ${i + 1}. ${reel.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedReels();
