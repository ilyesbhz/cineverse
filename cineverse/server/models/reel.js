import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Reel', reelSchema);
