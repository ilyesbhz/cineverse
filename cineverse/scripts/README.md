# Utility Scripts

This directory contains helpful scripts for development and maintenance of the Cineverse project.

## Available Scripts

### Database Seeding

#### `seed.js`
Seeds the database with initial data including users, movies, and test content.

```bash
cd scripts
node seed.js
```

**What it does:**
- Creates test users with different roles (user, admin)
- Adds movie metadata
- Initializes sample discussions
- Sets up basic recommendations

### Reel Management

#### `seed-reels.js`
Seeds the database with reel content from YouTube.

```bash
node seed-reels.js
```

**Prerequisites:**
- YouTube API key configured in `.env`

**What it does:**
- Fetches reel data from YouTube
- Stores reel metadata in MongoDB
- Associates reels with categories

#### `seed-reels-live.js`
Live seeding of reels with real-time updates.

```bash
node seed-reels-live.js
```

### Database Migration

#### `migrate-db.js`
Migrates data between databases (e.g., from development to production, or between environments).

```bash
node migrate-db.js
```

**Prerequisites:**
- Both source and destination MongoDB instances must be running
- Connection strings configured in script or environment variables

**What it does:**
- Connects to source database (streamx)
- Connects to destination database (cineverse)
- Copies all collections and documents
- Verifies migration integrity
- Provides migration statistics

**Example migration:**
```bash
# Updates the MONGO_URI in .env before running
MONGO_URI=mongodb://localhost:27017/streamx node migrate-db.js
```

---

## Running Scripts During Development

### Complete Setup (Recommended)
```bash
# 1. Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Setup environment
cp server/.env.example server/.env

# 3. Start MongoDB
# (ensure MongoDB is running on localhost:27017)

# 4. Seed database (optional)
cd scripts
node seed.js
cd ..

# 5. Start application
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
cd client && npm start
```

---

## Script Development Guidelines

When creating new utility scripts:

1. **Location**: Place in `/scripts` directory
2. **Naming**: Use descriptive names with hyphens (e.g., `backup-database.js`)
3. **Documentation**: Include JSDoc comments
4. **Error Handling**: Implement proper error handling and logging
5. **Exits**: Always close database connections and exit cleanly
6. **Logging**: Use console for user feedback

### Script Template

```javascript
// scripts/my-script.js
import mongoose from 'mongoose';
import User from '../server/models/user.js';

const runScript = async () => {
  try {
    console.log('🔄 Starting script...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Do work
    const result = await User.find();
    console.log(`✅ Found ${result.length} users`);
    
    // Cleanup
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

runScript();
```

---

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify database name is correct

### API Key Errors
- Verify API keys in `.env.example`
- Check rate limits haven't been exceeded
- Ensure keys have proper permissions

### Permission Issues
```bash
# Make script executable
chmod +x scripts/my-script.js
```

---

## Common Maintenance Tasks

### Clear Database
```bash
# Delete all collections (WARNING: Destructive)
# Manually run in MongoDB:
db.dropDatabase()
```

### Backup Database
```bash
# Backup to file (using mongodump)
mongodump --db cineverse --out ./backup
```

### Restore Database
```bash
# Restore from backup
mongorestore --db cineverse ./backup/cineverse
```

---

For more information about individual scripts, refer to their source code comments.
