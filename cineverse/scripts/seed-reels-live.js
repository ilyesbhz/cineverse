#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import youtubeService from './services/youtubeService.js';
import tmdbEnrichment from './services/tmdbEnrichment.js';
import Reel from './models/reel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Cinema content queries by category
const contentQueries = {
  trailer: [
    'official movie trailer 2024',
    'film trailer HD',
    'movie trailer official',
    'latest movie trailers',
    'upcoming movie trailers',
    'blockbuster trailers',
    'action movie trailers',
    'sci-fi movie trailers',
    'superhero trailers'
  ],
  interview: [
    'actor interview behind the scenes',
    'film director interview',
    'cast interview exclusive',
    'celebrity interview movie',
    'actor interview premiere'
  ],
  edit: [
    'fan edit movie cinematic',
    'film edit video',
    'movie edit compilation',
    'cinematic edit'
  ],
  review: [
    'movie review analysis',
    'film critique',
    'movie review reaction',
    'honest movie review'
  ],
  documentary: [
    'documentary cinema',
    'film documentary',
    'movie documentary'
  ]
};

let totalSeeded = 0;
let totalFailed = 0;

async function seedCategory(category, queries) {
  console.log(`\n🎬 Seeding ${category.toUpperCase()} content...`);
  let categoryCount = 0;

  for (const query of queries) {
    try {
      console.log(`   Searching: "${query}"`);
      const results = await youtubeService.searchReels(query, category, 5);

      for (const youtubeReel of results) {
        try {
          // Check for duplicate
          const existing = await Reel.findOne({ youtubeVideoId: youtubeReel.youtubeVideoId });
          if (existing) {
            console.log(`   ✓ Already seeded: ${youtubeReel.title.substring(0, 50)}`);
            continue;
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
            views: Math.floor(Math.random() * 10000),
            likes: []
          });

          await reel.save();
          categoryCount++;
          totalSeeded++;
          console.log(`   ✅ Seeded: ${youtubeReel.title.substring(0, 50)}...`);

          // Rate limiting: wait between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          totalFailed++;
          console.error(`   ❌ Failed to seed: ${error.message.substring(0, 60)}`);
        }
      }

      // Rate limiting between queries
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ⚠️  Query failed: ${error.message.substring(0, 60)}`);
    }
  }

  console.log(`   → Seeded ${categoryCount} ${category} reels`);
}

async function main() {
  try {
    console.log('🚀 Starting Cineverse Reels Seeder...\n');

    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check YouTube API key
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY not set in .env file');
    }
    console.log('✅ YouTube API key configured\n');

    // Seed each category
    for (const [category, queries] of Object.entries(contentQueries)) {
      await seedCategory(category, queries);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`✅ SEEDING COMPLETE`);
    console.log(`   Total seeded: ${totalSeeded} reels`);
    console.log(`   Total failed: ${totalFailed}`);
    console.log('='.repeat(50) + '\n');

    // Show database stats
    const stats = await Reel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Reels by Category:');
    for (const stat of stats) {
      console.log(`   ${stat._id}: ${stat.count} reels`);
    }

    const total = await Reel.countDocuments();
    console.log(`   TOTAL: ${total} reels in database\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

main();
