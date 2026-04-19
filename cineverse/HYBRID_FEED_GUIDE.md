# Cineverse Hybrid Reels Feed

## What Changed

Your reels feed now displays **both TMDB movie trailers AND user-generated edits** in one unified feed!

## 🎬 How It Works

### Feed Composition

The feed auto-populates by mixing content:

- **2 TMDB Movie Trailers** → **1 User Edit** → **2 TMDB Trailers** → **1 User Edit** → ...

This pattern ensures:

- ✅ Always content to watch (trailers fill gaps)
- ✅ User edits get visibility
- ✅ Balanced mix of both types
- ✅ Never empty feed

### Content Types

**TMDB Trailers** (Auto-populated)

- 🎥 Movie trailers from TMDB API
- 📊 Full movie metadata (year, rating, genre, plot)
- 🔗 Link to TMDB for more info
- Label: **"Trailer"** (purple badge)

**User Uploads** (Community)

- 📹 User-created movie edits
- 👤 Creator attribution
- 👁️ View/Like counter
- 🕐 Upload date
- Label: **"Edit"** (blue badge)

## 📱 Visual Design

Each reel shows:

```
┌─────────────────────────┐
│                         │
│     Video Content       │  ← YouTube embed OR video player
│                         │
├─────────────────────────┤
│  ❤️  🔗  🎬  💬  ⋯       │  ← Right side actions
│  42  •  •   •   •       │
│                         │
│  Title                  │  ← Bottom info
│  [Trailer/Edit badge]   │
│  ⭐ Rating / Creator     │
│  Description/Plot       │
└─────────────────────────┘
```

## 🎯 Features by Type

### TMDB Trailers

| Feature | Description                            |
| ------- | -------------------------------------- |
| Video   | YouTube embed (auto-plays at 1x speed) |
| Title   | Movie name                             |
| Rating  | IMDb/TMDB rating (e.g., ⭐ 8.5)        |
| Genre   | Movie genre                            |
| Plot    | Movie synopsis (truncated)             |
| Link    | 🎬 TMDB button to full movie page      |
| Like    | Local tracking (not saved to DB)       |

### User Edits

| Feature | Description                           |
| ------- | ------------------------------------- |
| Video   | Video player (auto-plays at 1x speed) |
| Title   | User's custom title                   |
| Creator | 👤 Creator name                       |
| Views   | 👁️ Total view count                   |
| Likes   | ❤️ Like count (tracked in DB)         |
| Date    | 🕐 Upload date                        |

## 📊 Data Sources

### TMDB API

```
GET /api/movie-reels
↓
Returns: Popular movies with trailers
- id, title, year, rating, genre, plot
- poster, backdrop (images)
- trailerKey (YouTube video ID)
```

### User Uploads

```
GET /api/reels
↓
Returns: User-uploaded videos
- _id, title, videoUrl
- uploadedBy (creator info)
- views, likes
- createdAt (timestamp)
```

## 🔄 Interleaving Algorithm

```javascript
// Mix pattern: 2 trailers → 1 edit → 2 trailers → 1 edit → ...

combined = []
userIdx = 0, tmdbIdx = 0

while (userIdx < users || tmdbIdx < trailers):
  combined.push(trailers[tmdbIdx++])      // Add 1st trailer
  combined.push(trailers[tmdbIdx++])      // Add 2nd trailer
  combined.push(users[userIdx++])         // Add 1 user edit
```

This ensures:

- Trailers fill the feed even with few user uploads
- User content gets exposure
- Natural discovery experience

## ✨ User Experience

### Scrolling

- Vertical scroll-snap (full-height reel)
- Auto-play current video
- Auto-pause previous video
- Progress indicator (X/Y)

### Interaction

- ❤️ Like (saves for user edits, local for trailers)
- 🔗 Share (copy link or native share)
- 🎬 TMDB link (for trailers)
- 💬 Comment (placeholder)
- ⋯ More (placeholder)

### Visual Cues

- **"Trailer"** badge (purple) = TMDB content
- **"Edit"** badge (blue) = User upload
- Different info displayed for each type

## 🚀 What's Different from Before

| Before              | Now                          |
| ------------------- | ---------------------------- |
| Only user uploads   | User uploads + TMDB trailers |
| Could be empty feed | Always content to watch      |
| Limited discovery   | More variety                 |
| Manual uploads only | Auto-populated options       |

## 🛠️ Technical Details

### API Calls

```javascript
// Fetch both sources in parallel
const [userReels, tmdbReels] = await Promise.all([
  api.get("/reels"), // User uploads
  api.get("/movie-reels"), // TMDB trailers
]);
```

### Data Normalization

```javascript
// Add 'type' field to distinguish
userReels.map((r) => ({ ...r, type: "user", id: r._id }));
tmdbReels.map((r) => ({ ...r, type: "tmdb" }));
```

### Conditional Rendering

```javascript
{
  isUser ? (
    <video src={reel.videoUrl} /> // Local video
  ) : (
    <iframe src={youtubeUrl} /> // YouTube embed
  );
}
```

## 📋 Configuration

### Change Feed Ratio

To adjust the mix (currently 2:1 trailers:uploads):

**File:** `/client/src/pages/ReelsPage.js`

```javascript
// Change this pattern:
if (tmdbIdx < tmdbReels.length) combined.push(tmdbReels[tmdbIdx++]); // 1st
if (tmdbIdx < tmdbReels.length) combined.push(tmdbReels[tmdbIdx++]); // 2nd
if (userIdx < userReels.length) combined.push(userReels[userIdx++]); // 1 user

// To other ratios:
// 1:1 mix - keep only 1st trailer
// 3:1 - add tmdbIdx++ 3 times
// 1:1 pure alternating - remove one trailer line
```

## 🎨 UI Components

All components handle both types automatically:

- `ReelsPage.js` - Manages both feeds
- Auto-renders correct video player
- Shows appropriate metadata
- Handles likes correctly

## 🧪 Testing

Test scenarios:

1. ✓ Load page → Mix of trailers + user uploads
2. ✓ Like a trailer → Shows locally
3. ✓ Like user edit → Updates counter
4. ✓ Share trailer → YouTube link
5. ✓ Share edit → App URL
6. ✓ Scroll down → Auto-plays next
7. ✓ Mobile view → Responsive layout

## 🚨 Notes

- TMDB trailers don't save like counts (local only)
- User edits save likes to database
- Trailers require TMDB API key in `.env`
- Both sources can be independently enabled/disabled

## 🔮 Future Improvements

1. Add "Filter by type" (Trailers vs Edits)
2. Personalized feed based on user preferences
3. Trending section
4. After watching all, auto-refresh
5. Download option for trailers
6. User recommendations
