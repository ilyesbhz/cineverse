import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['basic', 'premium'], required: true },
  stripeSessionId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
