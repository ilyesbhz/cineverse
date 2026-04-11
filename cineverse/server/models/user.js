import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  preferences: {
    type: Map,
    of: Number,
    default: {}
  },
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  watchHistory: [{
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    watchedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 } // percentage
  }],
  plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    expiresAt: { type: Date, default: null }
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  if (!obj.name) obj.name = obj.username;
  return obj;
};

userSchema.pre('save', function (next) {
  if (!this.name) this.name = this.username;
  if (!this.subscription?.plan) {
    this.subscription = { plan: this.plan || 'free', expiresAt: null };
  }
  if (this.plan !== this.subscription.plan) {
    this.plan = this.subscription.plan;
  }
  next();
});

export default mongoose.model('User', userSchema);