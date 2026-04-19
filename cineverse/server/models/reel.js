import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  youtubeVideoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: { type: String, required: true },
  thumbnail: String,
  duration: Number,
  category: {
    type: String,
    enum: ['trailer', 'interview', 'edit', 'review', 'documentary'],
    default: 'trailer'
  },
  genres: [String],
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tmdbId: Number,
  tmdbMetadata: {
    synopsis: String,
    director: String,
    actors: [String],
    releaseDate: Date,
    rating: Number
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Reel', reelSchema);
