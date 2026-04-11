import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 }
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  category: {
    type: String,
    required: true,
    enum: ['Review', 'Discussion', 'Recommendation', 'Question']
  },
  movieTitle: { type: String, trim: true, default: '' },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderationReason: { type: String, trim: true, maxlength: 500, default: '' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt: { type: Date, default: null },
  containsSpoiler: { type: Boolean, default: false },
  flaggedKeywords: [{ type: String }],
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true, maxlength: 300, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema]
}, { timestamps: true });

export default mongoose.model('Discussion', discussionSchema);
