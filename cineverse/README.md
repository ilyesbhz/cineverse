# 🎬 Cineverse - Movie Streaming Platform

A modern, full-stack movie streaming application with real-time discussions, personalized recommendations, and gamified achievement system.

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🌟 Features

### Core Streaming
- **Browse & Watch**: Browse movies and reels with advanced filtering
- **HD Quality**: Multiple quality options (720p, 1080p, 4K)
- **Watchlist**: Save movies for later viewing
- **Watch History**: Track your viewing progress

### Social & Community
- **Discussions**: Create and participate in movie discussions
- **Comments & Ratings**: Engage with other users on reels
- **Real-time Notifications**: Get notified of interactions
- **User Profiles**: Customize your profile and view achievements

### Smart Recommendations
- **Personalized Feed**: ML-based movie recommendations
- **Trending Content**: Discover popular movies and discussions
- **Category Filters**: Browse by genre and category
- **Advanced Search**: Find movies by title, genre, or keywords

### Subscription System
- **Flexible Plans**: Basic, Standard, and Power packages
- **Movie Quotas**: Different movie allowances per tier
- **Bonus Movies**: Earn through achievements and referrals
- **TND Pricing**: Affordable pricing in Tunisian Dinars

### Gamification
- **Achievement Badges**:
  - 🎬 **Binge Starter** - Watch 5 movies → +1 bonus movie
  - 🎭 **Movie Addict** - Watch 30 movies → +3 bonus movies
- **Referral Rewards**: Invite friends and earn bonus movies
- **Achievement Display**: Showcase badges next to your username

### Admin Features
- **Dashboard**: Manage users, discussions, and content
- **Moderation**: Approve/reject user submissions
- **Analytics**: View platform statistics and user engagement
- **Content Management**: Add and manage movies and reels

---

## 🛠 Tech Stack

### Frontend
- **React 18.3** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Three.js** - 3D backgrounds
- **CSS3** - Styling with custom properties

### Backend
- **Node.js & Express** - Server framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Stripe** - Payment processing
- **TMDB API** - Movie metadata
- **YouTube API** - Video content

---

## 📁 Project Structure

```
cineverse/
├── client/                  # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React Context (Auth)
│   │   ├── three/          # Three.js components
│   │   └── App.js          # Root component
│   ├── package.json
│   └── .env.example
│
├── server/                  # Node.js/Express backend
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # External API services
│   ├── config/             # Configuration files
│   ├── uploads/            # User-uploaded files
│   ├── index.js            # Server entry point
│   ├── package.json
│   ├── .env.example
│   └── .env               # Local environment variables
│
├── scripts/                 # Utility scripts
│   ├── seed.js             # Database seeding
│   ├── migrate-db.js       # Database migration
│   └── seed-reels-live.js  # Live reel seeding
│
├── .gitignore
├── README.md
├── CONTRIBUTING.md
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- MongoDB (running locally or Atlas)
- API Keys:
  - [TMDB API](https://www.themoviedb.org/settings/api)
  - [YouTube API](https://console.cloud.google.com)
  - [Stripe](https://dashboard.stripe.com/apikeys) (optional for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cineverse.git
cd cineverse
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your API keys
```

3. **Setup Frontend**
```bash
cd ../client
npm install
npm install -g serve  # For production builds
```

### Configuration

Create `server/.env` with your values:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cineverse
JWT_SECRET=your_super_secret_key_here
TMDB_API_KEY=your_tmdb_key
YOUTUBE_API_KEY=your_youtube_key
STRIPE_SECRET_KEY=your_stripe_key
CLIENT_URL=http://localhost:3000
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
# Client runs on http://localhost:3000
```

### Production Build

**Backend:**
```bash
cd server
npm run build  # If build script configured
node index.js
```

**Frontend:**
```bash
cd client
npm run build
serve -s build  # Or use your hosting service
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Movies
- `GET /api/movies` - List all movies
- `GET /api/movies/:id` - Get movie details
- `POST /api/users/track-watch` - Track movie watch

### Reels
- `GET /api/reels` - Get reel feed
- `GET /api/reels/:id` - Get reel details
- `POST /api/reels/:id/like` - Like a reel
- `POST /api/reels/:id/comment` - Comment on reel

### Discussions
- `GET /api/discussions` - List discussions
- `POST /api/discussions` - Create discussion
- `POST /api/discussions/:id/like` - Like discussion

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Create Stripe session
- `POST /api/subscriptions/verify-payment` - Verify payment
- `GET /api/subscriptions/my-subscription` - Get user subscription

### Users
- `GET /api/users/stats/:userId` - Get user stats and achievements
- `POST /api/users/track-watch` - Track watch history

---

## 📊 Database Schema

### User Model
```javascript
{
  name, username, email, password,
  role: 'user' | 'admin',
  avatar, preferences,
  watchlist, watchHistory,
  plan, subscription,
  achievements: { bingeStarter, movieAddict },
  referrals: { code, referredUsers, referredBy }
}
```

### Subscription Model
```javascript
{
  userId, plan, status,
  startDate, expiresAt,
  movieQuota, moviesWatched,
  referralCount, bonusMovies
}
```

### Achievement Model
- Binge Starter: 5 movies watched
- Movie Addict: 30 movies watched

---

## 🧪 Utility Scripts

### Seed Database
```bash
node scripts/seed.js          # Seed initial data
node scripts/seed-reels.js    # Seed reel data
```

### Database Migration
```bash
node scripts/migrate-db.js    # Migrate from old database
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up development environment
- Code style and conventions
- Pull request process
- Feature request submission

---

## 🐛 Known Issues & Limitations

- Payment processing requires Stripe test keys for development
- TMDB API has rate limits (40 requests/10 seconds)
- YouTube API key needed for video search features
- Local MongoDB required for development

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Developer**: Your Name
- **Colleague**: Collaborator Name

---

## 🔗 Useful Links

- [TMDB Documentation](https://developers.themoviedb.org/3)
- [YouTube API Docs](https://developers.google.com/youtube/v3)
- [Stripe Documentation](https://stripe.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

## 📞 Support

For issues and questions:
1. Check existing [GitHub Issues](https://github.com/yourusername/cineverse/issues)
2. Create a new issue with detailed information
3. Contact the development team

---

**Happy Streaming! 🎬**
