const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Game Statistics
  gameStats: {
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    experienceToNext: {
      type: Number,
      default: 100
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    },
    rating: {
      type: Number,
      default: 1000
    }
  },
  
  // Virtual Currency
  coins: {
    type: Number,
    default: 100 // Starting coins
  },
  premiumCoins: {
    type: Number,
    default: 0
  },
  
  // Available Skins
  availableSkins: {
    type: [String],
    default: ['Default Theme'] // All users start with default skin
  },
  
  // Payment & Subscription
  stripeCustomerId: String,
  subscription: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  
  // Settings & Preferences
  settings: {
    notifications: {
      gameInvites: { type: Boolean, default: true },
      gameUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    privacy: {
      showOnlineStatus: { type: Boolean, default: true },
      showGameHistory: { type: Boolean, default: true },
      allowFriendRequests: { type: Boolean, default: true }
    },
    game: {
      soundEnabled: { type: Boolean, default: true },
      hapticEnabled: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true }
    }
  },
  
  // Social & Friends
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  }],
  
  // Blocked users (for reporting/blocking functionality)
  blockedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity & History
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String
  }],
  
  // Ad System
  adSystem: {
    gamesSinceLastAd: { type: Number, default: 0 },
    lastAdShown: Date,
    adPreferences: {
      allowRewardedAds: { type: Boolean, default: true },
      allowInterstitialAds: { type: Boolean, default: true }
    }
  },
  
  // Push Notification Tokens
  pushTokens: [{
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: String,
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for win rate calculation
userSchema.virtual('calculatedWinRate').get(function() {
  if (this.gameStats.gamesPlayed === 0) return 0;
  return Math.round((this.gameStats.gamesWon / this.gameStats.gamesPlayed) * 100);
});

// Virtual for level progress
userSchema.virtual('levelProgress').get(function() {
  return (this.gameStats.experience / this.gameStats.experienceToNext) * 100;
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'gameStats.rating': -1 });
userSchema.index({ 'gameStats.level': -1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ friends: 1 });
userSchema.index({ 'friendRequests.from': 1 });
userSchema.index({ 'friendRequests.status': 1 });
userSchema.index({ 'friendRequests.createdAt': -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add experience and level up
userSchema.methods.addExperience = function(amount) {
  this.gameStats.experience += amount;
  
  // Check for level up
  while (this.gameStats.experience >= this.gameStats.experienceToNext) {
    this.gameStats.experience -= this.gameStats.experienceToNext;
    this.gameStats.level += 1;
    this.gameStats.experienceToNext = Math.floor(this.gameStats.experienceToNext * 1.2); // 20% increase per level
  }
  
  return this.save();
};

// Method to update game statistics
userSchema.methods.updateGameStats = function(isWin) {
  this.gameStats.gamesPlayed += 1;
  
  if (isWin) {
    this.gameStats.gamesWon += 1;
    this.gameStats.currentStreak += 1;
    if (this.gameStats.currentStreak > this.gameStats.bestStreak) {
      this.gameStats.bestStreak = this.gameStats.currentStreak;
    }
  } else {
    this.gameStats.currentStreak = 0;
  }
  
  this.gameStats.winRate = this.calculatedWinRate;
  
  return this.save();
};

// Method to handle ad system
userSchema.methods.incrementGamesSinceAd = function() {
  this.adSystem.gamesSinceLastAd += 1;
  return this.save();
};

userSchema.methods.resetGamesSinceAd = function() {
  this.adSystem.gamesSinceLastAd = 0;
  this.adSystem.lastAdShown = new Date();
  return this.save();
};

// Method to check if ad should be shown
userSchema.methods.shouldShowAd = function() {
  return this.adSystem.gamesSinceLastAd >= 3;
};

// Friend-related methods
userSchema.methods.isFriendsWith = function(userId) {
  return this.friends.includes(userId);
};

userSchema.methods.hasPendingRequestFrom = function(userId) {
  return this.friendRequests.some(
    request => request.from.toString() === userId.toString() && request.status === 'pending'
  );
};

userSchema.methods.hasPendingRequestTo = async function(userId) {
  const targetUser = await this.constructor.findById(userId);
  return targetUser ? targetUser.hasPendingRequestFrom(this._id) : false;
};

userSchema.methods.addFriend = function(userId) {
  if (!this.friends.includes(userId)) {
    this.friends.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.removeFriend = function(userId) {
  this.friends = this.friends.filter(id => id.toString() !== userId.toString());
  return this.save();
};

userSchema.methods.getFriendRequestCount = function() {
  return this.friendRequests.filter(request => request.status === 'pending').length;
};

userSchema.methods.isBlocked = function(userId) {
  return this.blockedUsers.some(blocked => blocked.user.toString() === userId.toString());
};

module.exports = mongoose.model('User', userSchema);
