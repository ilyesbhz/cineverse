# Setup TMDB API for Movie Trailers

## Why No Videos?

Your reels feed is showing **movie posters instead of videos** because the **TMDB API key** is not configured.

Without it:

- ❌ No movie trailers (no trailerKey)
- ❌ Limited metadata
- ❌ Falls back to database movies only

## ✅ Solution: Configure TMDB API Key

### Step 1: Get a Free API Key

1. Go to: **https://www.themoviedb.org/settings/api**
2. Sign up or log in (free account)
3. Click "Request an API Key"
4. Select "Developer" and accept terms
5. Copy your API Key (v3 Auth)

### Step 2: Add to Your `.env` File

**File:** `/cineverse/server/.env`

Add this line:

```
TMDB_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual API key from Step 1.

**Example:**

```
TMDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
```

### Step 3: Restart Your Server

```bash
# Kill the running server (Ctrl+C)
# Then restart:
npm start
# or
yarn start
```

### Step 4: Refresh Your Browser

Go to `/reels` and you should now see:

- ✅ YouTube video embeds
- ✅ Movie metadata (year, rating, genre)
- ✅ Trailers auto-playing
- ✅ Mixed with user uploads

## 🎬 What You'll See After Setup

### TMDB Trailers (With API Key)

```
[YouTube Video Playing]
  ❤️  🔗  🎬  💬  ⋯

Title
⭐ 8.5 • Action • 2024
Plot summary...
["Trailer" badge]
```

### Current State (Without API Key)

```
[Movie Poster Image]
"Trailer not available"
"Configure TMDB API key for trailers"
```

## 🔍 How to Verify It's Working

1. Check server logs when it starts:

   ```
   ✓ TMDB_API_KEY found
   ✓ Successfully fetching from TMDB...
   ```

2. Open browser DevTools (F12) → Network tab
3. Refresh `/reels`
4. Look for request to: `/api/movie-reels`
5. Expand response → check for `trailerKey` field

If you see `trailerKey: "dQw4w9WgXcQ"` → Setup worked! ✅

## ❓ Troubleshooting

### Still seeing posters?

- [ ] Restarted server after adding API key?
- [ ] API key is correct (copy-paste exactly)?
- [ ] File saved as `.env` not `.env.txt`?
- [ ] Check server console for errors

### API key invalid?

- [ ] Try a fresh API key from TMDB dashboard
- [ ] Ensure it's v3 Auth key, not v4
- [ ] Check for extra spaces: `TMDB_API_KEY=key ` ❌

### Still no videos?

- [ ] Check if TMDB movies have trailers (most do)
- [ ] Try a different TMDB_BASE URL (sometimes rates limited)
- [ ] Check browser console (F12) for errors

## 📝 In Summary

| Without API Key        | With API Key        |
| ---------------------- | ------------------- |
| Movie posters only     | YouTube trailers    |
| No metadata            | Full movie info     |
| Falls back to database | TMDB latest movies  |
| Static images          | Auto-playing videos |

**Once set up: Your reels will show YouTube trailers mixed with user uploads!** 🎬

---

Need help? Check:

- TMDB docs: https://www.themoviedb.org/settings/api/request
- Your `.env` file syntax
- Server logs for errors
