import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  year: { type: Number, required: true },
  genre: [{ type: String }],
  rating: { type: Number, min: 0, max: 10, default: 0 },
  duration: { type: Number }, // in minutes
  director: { type: String },
  cast: [{ type: String }],
  thumbnail: { type: String, required: true },
  backdrop: { type: String },
  trailerUrl: { type: String },
  videoUrl: { type: String },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  maturityRating: { type: String, enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'], default: 'PG-13' },
  language: { type: String, default: 'English' },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

movieSchema.index({ title: 'text', description: 'text', genre: 'text' });

export default mongoose.model('Movie', movieSchema);