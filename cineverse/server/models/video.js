import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Romance', 'Documentary']
  },
  duration: { type: Number, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  subtitles: [{ language: String, url: String }],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
