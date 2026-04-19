# Cineverse Movie Edits - Quick Start Guide

## What You Have

A **TikTok/YouTube Shorts-style reels platform** where users can upload, share, and discover short movie edits, clips, and cinema moments!

## 🚀 Quick Features

### For Viewers
- 📱 Full-screen vertical scrolling feed
- ❤️ Like/heart reels
- 🔗 Share with others
- 👀 See view counts and engagement
- 📊 See who created it and when

### For Creators
- ⬆️ **Upload button** in navbar (top right)
- 📹 Drag-and-drop video upload
- 🎯 Add custom titles to edits
- 📈 Track views and likes
- 🌍 Share with the community

## 📂 Routes

| Route | Purpose |
|-------|---------|
| `/reels` | Browse all movie edits (main feed) |
| `/reels/upload` | Upload a new movie edit |

## ⬆️ How to Upload

1. Click **"⬆️ Upload"** button (top right of navbar)
2. Enter title for your edit
3. Drag video or click to select
4. Submit → appears in feed immediately!

## 📹 Video Requirements

| Requirement | Details |
|---|---|
| **Formats** | MP4, AVI, MKV, MOV |
| **Max Size** | 50MB |
| **Duration** | 15-60 seconds recommended |
| **Aspect Ratio** | 9:16 (vertical) or 16:9 (horizontal) |

## 🎬 Examples of Content

- Movie action montages
- Emotional scenes compilation
- Funny/comedy clips
- Movie trailers
- Behind-the-scenes content
- Movie reviews/commentary
- Best scenes from recent films

## 🛠️ Technical Details

### Backend API
- `GET /api/reels` - Fetch all reels (with pagination ready)
- `POST /api/reels/upload` - Upload new reel (requires login)
- `POST /api/reels/:id/like` - Like a reel
- `POST /api/reels/:id/view` - Track view

### Storage
- Videos stored in: `/server/uploads/reels/`
- Supports concurrent uploads
- Auto-cleanup on delete (optional enhancement)

### Database
```javascript
{
  _id: ObjectId,
  title: "Best Action Scenes",
  videoUrl: "/uploads/reels/1234567890.mp4",
  views: 156,
  likes: 42,
  uploadedBy: { name: "John", ...},
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Components

### `ReelsPage.js`
- Main feed display (vertical scroll)
- Auto-play/pause on scroll
- Like button with counter
- Share functionality

### `ReelUpload.js`
- Drag-and-drop upload form
- File validation
- Preview
- Error handling

### `UploadReelPage.js`
- Full upload page
- Guidelines and tips
- Success confirmation
- Feature descriptions

## 🧪 Testing

Test these scenarios:
```
1. Upload a valid video → See it in feed
2. Scroll feed → Videos auto-play/pause
3. Like a reel → Counter increases
4. Share reel → Opens share dialog or copies link
5. Upload invalid file → See error message
6. Upload 100MB file → See size error
7. Browse as mobile → Vertical scroll works
```

## 💡 Next Steps

Optional improvements you can add:
- Comments on reels
- Creator profiles
- Trending section
- Save/bookmark reels
- Search functionality
- Video filters/effects
- Creator verification badges
- Monetization (ad revenue share)

## 🚨 Common Issues

**Videos not showing after upload?**
- Check `/server/uploads/reels/` folder exists
- Verify multer config paths
- Check API response in network tab

**Upload button not working?**
- Make sure user is logged in
- Check auth middleware on route
- Verify API endpoint is accessible

**Videos not playing?**
- Check video format is supported
- Ensure videoUrl path is correct (should start with `/uploads/`)
- Test in different browser

## 📞 Support

All backend is ready to go! The system is fully functional for:
- ✅ Video upload & storage
- ✅ Viewing in feed
- ✅ Like tracking
- ✅ View counting
- ✅ Creator info display

Just add content and test! 🎬
