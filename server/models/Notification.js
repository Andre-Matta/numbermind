const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Notification type for categorization
  type: {
    type: String,
    enum: [
      'game_invite',
      'match_found', 
      'friend_request',
      'your_turn',
      'game_result',
      'achievement',
      'connection_status',
      'system',
      'promotion'
    ],
    required: true
  },
  
  // Additional data for the notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Push notification token (if applicable)
  pushToken: {
    type: String,
    sparse: true
  },
  
  // Platform (ios, android, web)
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    default: 'web'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Scheduled sending
  scheduledFor: {
    type: Date,
    default: null
  },
  
  // Sent timestamp
  sentAt: {
    type: Date,
    default: null
  },
  
  // Error tracking
  errorMessage: {
    type: String,
    default: null
  },
  
  // Retry count for failed notifications
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Maximum retries
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

// Static method to create game invite notification
notificationSchema.statics.createGameInvite = function(userId, inviterName, roomId, pushToken = null) {
  return this.create({
    userId,
    title: 'Game Invite 🎮',
    body: `${inviterName} invited you to play NumberMind!`,
    type: 'game_invite',
    data: {
      inviterName,
      roomId,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web' // Default to web if no push token
  });
};

// Static method to create match found notification
notificationSchema.statics.createMatchFound = function(userId, opponentName, gameId, pushToken = null) {
  return this.create({
    userId,
    title: 'Match Found! 🎯',
    body: `You've been matched with ${opponentName}. Tap to join the game!`,
    type: 'match_found',
    data: {
      opponentName,
      gameId,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web'
  });
};

// Static method to create friend request notification
notificationSchema.statics.createFriendRequest = function(userId, requesterName, pushToken = null) {
  return this.create({
    userId,
    title: 'Friend Request 👥',
    body: `${requesterName} wants to be your friend!`,
    type: 'friend_request',
    data: {
      requesterName,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web'
  });
};

// Static method to create your turn notification
notificationSchema.statics.createYourTurn = function(userId, gameId, pushToken = null) {
  return this.create({
    userId,
    title: 'Your Turn! 🎲',
    body: 'It\'s your turn to make a guess!',
    type: 'your_turn',
    data: {
      gameId,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web'
  });
};

// Static method to create game result notification
notificationSchema.statics.createGameResult = function(userId, won, opponentName, score, pushToken = null) {
  const title = won ? 'Victory! 🏆' : 'Game Over 💔';
  const body = won 
    ? `Congratulations! You beat ${opponentName} with ${score} points!`
    : `Better luck next time! ${opponentName} won with ${score} points.`;
  
  return this.create({
    userId,
    title,
    body,
    type: 'game_result',
    data: {
      won,
      opponentName,
      score,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web'
  });
};

// Static method to create achievement notification
notificationSchema.statics.createAchievement = function(userId, achievementName, description, pushToken = null) {
  return this.create({
    userId,
    title: 'Achievement Unlocked! 🏅',
    body: `${achievementName}: ${description}`,
    type: 'achievement',
    data: {
      achievementName,
      description,
      timestamp: Date.now()
    },
    pushToken,
    platform: pushToken ? 'ios' : 'web'
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Instance method to mark as failed
notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);

