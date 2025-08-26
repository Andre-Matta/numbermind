const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  gameState: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'abandoned', 'paused'],
    default: 'waiting'
  },
  gameMode: {
    type: String,
    enum: ['standard', 'hard'],
    default: 'standard'
  },
  matchType: {
    type: String,
    enum: ['casual', 'ranked', 'private', 'tournament'],
    default: 'casual'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxPlayers: {
    type: Number,
    default: 2
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  playerNumbers: {
    type: Map,
    of: String,
    default: new Map()
  },
  guessHistory: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    guess: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{5}$/.test(v);
        },
        message: 'Guess must be exactly 5 digits'
      }
    },
    feedback: {
      exact: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      misplaced: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalCorrect: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerGuess: String,
  winnerGuessNumber: Number, // Which guess number won the game
  gameSettings: {
    timeLimit: {
      type: Number, // in seconds, 0 = no limit
      default: 0
    },
    allowRepeatingDigits: {
      type: Boolean,
      default: false
    },
    maxGuesses: {
      type: Number,
      default: 0 // 0 = unlimited
    }
  },
  statistics: {
    totalGuesses: {
      type: Number,
      default: 0
    },
    averageGuessesPerPlayer: {
      type: Number,
      default: 0
    },
    gameDuration: {
      type: Number, // in seconds
      default: 0
    }
  },
  startedAt: Date,
  endedAt: Date,
  pausedAt: Date,
  pauseReason: String,
  chat: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      maxlength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  spectators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tournament: {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    round: Number,
    match: Number
  },
  replay: {
    enabled: {
      type: Boolean,
      default: false
    },
    data: [{
      action: String,
      playerId: mongoose.Schema.Types.ObjectId,
      data: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
gameSchema.index({ roomId: 1 });
gameSchema.index({ host: 1 });
gameSchema.index({ players: 1 });
gameSchema.index({ gameState: 1 });
gameSchema.index({ matchType: 1 });
gameSchema.index({ createdAt: -1 });
gameSchema.index({ 'tournament.tournamentId': 1 });

// Virtual for game duration
gameSchema.virtual('duration').get(function() {
  if (!this.startedAt) return 0;
  const endTime = this.endedAt || new Date();
  return Math.floor((endTime - this.startedAt) / 1000);
});

// Virtual for player count
gameSchema.virtual('playerCount').get(function() {
  return this.players.length;
});

// Virtual for is full
gameSchema.virtual('isFull').get(function() {
  return this.players.length >= this.maxPlayers;
});

// Virtual for can start
gameSchema.virtual('canStart').get(function() {
  return this.gameState === 'waiting' && this.players.length >= 2;
});

// Virtual for current player username
gameSchema.virtual('currentPlayerUsername').get(function() {
  if (!this.currentTurn) return null;
  // This would need to be populated or fetched separately
  return null;
});

// Pre-save middleware
gameSchema.pre('save', function(next) {
  // Update statistics
  if (this.guessHistory && this.guessHistory.length > 0) {
    this.statistics.totalGuesses = this.guessHistory.length;
    this.statistics.averageGuessesPerPlayer = this.statistics.totalGuesses / this.players.length;
  }
  
  // Update game duration
  if (this.startedAt && this.endedAt) {
    this.statistics.gameDuration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  
  next();
});

// Method to add player
gameSchema.methods.addPlayer = function(playerId) {
  if (this.players.includes(playerId)) {
    throw new Error('Player already in game');
  }
  
  if (this.isFull) {
    throw new Error('Game is full');
  }
  
  this.players.push(playerId);
  return this.save();
};

// Method to remove player
gameSchema.methods.removePlayer = function(playerId) {
  this.players = this.players.filter(p => p.toString() !== playerId.toString());
  
  // If host leaves, transfer host to next player
  if (this.host.toString() === playerId.toString() && this.players.length > 0) {
    this.host = this.players[0];
  }
  
  // If no players left, mark as abandoned
  if (this.players.length === 0) {
    this.gameState = 'abandoned';
    this.endedAt = new Date();
  }
  
  return this.save();
};

// Method to start game
gameSchema.methods.startGame = function() {
  if (!this.canStart) {
    throw new Error('Cannot start game');
  }
  
  this.gameState = 'playing';
  this.startedAt = new Date();
  this.currentTurn = this.players[0];
  
  return this.save();
};

// Method to end game
gameSchema.methods.endGame = function(winnerId, winnerGuess, winnerGuessNumber) {
  this.gameState = 'finished';
  this.winner = winnerId;
  this.winnerGuess = winnerGuess;
  this.winnerGuessNumber = winnerGuessNumber;
  this.endedAt = new Date();
  
  return this.save();
};

// Method to pause game
gameSchema.methods.pauseGame = function(reason = 'Game paused') {
  if (this.gameState !== 'playing') {
    throw new Error('Game is not in progress');
  }
  
  this.gameState = 'paused';
  this.pausedAt = new Date();
  this.pauseReason = reason;
  
  return this.save();
};

// Method to resume game
gameSchema.methods.resumeGame = function() {
  if (this.gameState !== 'paused') {
    throw new Error('Game is not paused');
  }
  
  this.gameState = 'playing';
  this.pausedAt = undefined;
  this.pauseReason = undefined;
  
  return this.save();
};

// Method to add guess
gameSchema.methods.addGuess = function(playerId, guess, feedback) {
  if (this.gameState !== 'playing') {
    throw new Error('Game is not in progress');
  }
  
  if (this.currentTurn.toString() !== playerId.toString()) {
    throw new Error('Not your turn');
  }
  
  const guessData = {
    playerId,
    guess,
    feedback,
    timestamp: new Date()
  };
  
  this.guessHistory.push(guessData);
  
  // Switch turns
  const currentPlayerIndex = this.players.findIndex(p => p.toString() === playerId.toString());
  const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
  this.currentTurn = this.players[nextPlayerIndex];
  
  return this.save();
};

// Method to add chat message
gameSchema.methods.addChatMessage = function(playerId, message) {
  if (message.length > 200) {
    throw new Error('Message too long');
  }
  
  this.chat.push({
    playerId,
    message,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to get game summary
gameSchema.methods.getGameSummary = function() {
  return {
    roomId: this.roomId,
    gameState: this.gameState,
    gameMode: this.gameMode,
    matchType: this.matchType,
    playerCount: this.playerCount,
    currentTurn: this.currentTurn,
    winner: this.winner,
    statistics: this.statistics,
    duration: this.duration,
    startedAt: this.startedAt,
    endedAt: this.endedAt
  };
};

// Method to check if game is timed out
gameSchema.methods.isTimedOut = function() {
  if (!this.gameSettings.timeLimit || !this.startedAt) return false;
  
  const now = new Date();
  const elapsed = Math.floor((now - this.startedAt) / 1000);
  return elapsed > this.gameSettings.timeLimit;
};

// Static method to find active games by player
gameSchema.statics.findActiveByPlayer = function(playerId) {
  return this.find({
    players: playerId,
    gameState: { $in: ['waiting', 'playing', 'paused'] }
  }).populate('players', 'username avatar gameStats.rating');
};

// Static method to find games by state
gameSchema.statics.findByState = function(state) {
  return this.find({ gameState: state }).populate('players', 'username avatar');
};

// Static method to get game statistics
gameSchema.statics.getGameStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        activeGames: {
          $sum: {
            $cond: [
              { $in: ['$gameState', ['waiting', 'playing', 'paused']] },
              1,
              0
            ]
          }
        },
        completedGames: {
          $sum: {
            $cond: [
              { $eq: ['$gameState', 'finished'] },
              1,
              0
            ]
          }
        },
        averageGameDuration: { $avg: '$statistics.gameDuration' }
      }
    }
  ]);
  
  return stats[0] || {
    totalGames: 0,
    activeGames: 0,
    completedGames: 0,
    averageGameDuration: 0
  };
};

module.exports = mongoose.model('Game', gameSchema);
