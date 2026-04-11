import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['like', 'comment', 'new_movie', 'promo', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
