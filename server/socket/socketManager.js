const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const { verifyToken } = require('../utils/jwtUtils');

let io;

// Store active connections and game rooms
const activeConnections = new Map(); // socketId -> userId
const gameRooms = new Map(); // roomId -> game data
const matchmakingQueue = new Map(); // userId -> socket data
const rankedQueue = new Map(); // userId -> { rating, socketId }

const setupSocketIO = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.userId}) - Socket ID: ${socket.id}`);
    
    // Store connection
    activeConnections.set(socket.id, socket.userId);
    
    // Update user's online status
    updateUserStatus(socket.userId, true);

    // Handle private game room creation
    socket.on('createPrivateRoom', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('createPrivateRoom: callback is not a function');
          return;
        }

        const roomId = generateRoomId();
        console.log(`🏠 Creating private room ${roomId} for user ${socket.user.username} (${socket.userId})`);
        
        const game = new Game({
          roomId,
          host: socket.userId,
          players: [socket.userId],
          gameState: 'waiting',
          gameMode: data.gameMode || 'standard',
          isPrivate: true,
          maxPlayers: 2
        });

        await game.save();
        
        // Join the room
        socket.join(roomId);
        gameRooms.set(roomId, game);
        
        // Update user's ad counter
        await User.findByIdAndUpdate(socket.userId, {
          $inc: { 'adSystem.gamesSinceLastAd': 1 }
        });

        console.log(`✅ Room ${roomId} created successfully with ${game.players.length} players`);

        callback({
          success: true,
          roomId,
          game: game.toObject()
        });

        console.log(`🏠 Private room created: ${roomId} by ${socket.user.username}`);
      } catch (error) {
        console.error('Error creating private room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to create room' });
        }
      }
    });

    // Handle joining private room
    socket.on('joinPrivateRoom', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('joinPrivateRoom: callback is not a function');
          return;
        }

        const { roomId } = data;
        console.log(`👥 User ${socket.user.username} (${socket.userId}) attempting to join room ${roomId}`);
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        const game = gameRooms.get(roomId);

        if (!game) {
          console.log(`❌ Room ${roomId} not found`);
          return callback({ success: false, error: 'Room not found' });
        }

        if (game.gameState !== 'waiting') {
          console.log(`❌ Room ${roomId} is not in waiting state (current: ${game.gameState})`);
          return callback({ success: false, error: 'Game already in progress' });
        }

        // Check if player is already in the room
        if (game.players.includes(socket.userId)) {
          // Player is already in room, just join the socket room
          socket.join(roomId);
          console.log(`✅ User ${socket.user.username} already in room ${roomId}, just joined socket room`);
          return callback({
            success: true,
            roomId,
            game: game.toObject(),
            message: 'Already in room'
          });
        }

        if (game.players.length >= game.maxPlayers) {
          console.log(`❌ Room ${roomId} is full (${game.players.length}/${game.maxPlayers})`);
          return callback({ success: false, error: 'Room is full' });
        }

        // Add player to game
        game.players.push(socket.userId);
        await game.save();

        // Join the room
        socket.join(roomId);
        console.log(`🔌 Socket ${socket.id} joined room ${roomId}`);
        
        // Update user's ad counter
        await User.findByIdAndUpdate(socket.userId, {
          $inc: { 'adSystem.gamesSinceLastAd': 1 }
        });

        console.log(`✅ User ${socket.user.username} joined room ${roomId}. Total players: ${game.players.length}`);

        // Notify other players
        socket.to(roomId).emit('playerJoined', {
          playerId: socket.userId,
          username: socket.user.username,
          roomId
        });

        callback({
          success: true,
          roomId,
          game: game.toObject()
        });

        console.log(`👥 Player joined room: ${socket.user.username} -> ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join room' });
        }
      }
    });

    // Handle ranked matchmaking
    socket.on('joinRankedQueue', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('joinRankedQueue: callback is not a function');
          return;
        }

        const { gameMode = 'standard' } = data;
        
        // Remove from any existing queues
        matchmakingQueue.delete(socket.userId);
        rankedQueue.delete(socket.userId);

        // Add to ranked queue
        rankedQueue.set(socket.userId, {
          rating: socket.user.gameStats?.rating || 1000,
          gameMode,
          socketId: socket.id,
          timestamp: Date.now()
        });

        callback({ success: true, message: 'Joined ranked queue' });

        // Try to find a match
        findRankedMatch(socket.userId, gameMode);
      } catch (error) {
        console.error('Error joining ranked queue:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join queue' });
        }
      }
    });

    // Handle casual matchmaking
    socket.on('joinCasualQueue', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('joinCasualQueue: callback is not a function');
          return;
        }

        const { gameMode = 'standard' } = data;
        
        // Remove from any existing queues
        matchmakingQueue.delete(socket.userId);
        rankedQueue.delete(socket.userId);

        // Add to casual queue
        matchmakingQueue.set(socket.userId, {
          gameMode,
          socketId: socket.id,
          timestamp: Date.now()
        });

        callback({ success: true, message: 'Joined casual queue' });

        // Try to find a match
        findCasualMatch(socket.userId, gameMode);
      } catch (error) {
        console.error('Error joining casual queue:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join queue' });
        }
      }
    });

    // Handle leaving matchmaking queues
    socket.on('leaveQueue', (callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('leaveQueue: callback is not a function');
          return;
        }

        matchmakingQueue.delete(socket.userId);
        rankedQueue.delete(socket.userId);
        callback({ success: true, message: 'Left queue' });
      } catch (error) {
        console.error('Error leaving queue:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to leave queue' });
        }
      }
    });

    // Handle game start
    socket.on('startGame', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('startGame: callback is not a function');
          return;
        }

        const { roomId, player1Number, player2Number } = data;
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        const game = gameRooms.get(roomId);

        if (!game || game.host !== socket.userId) {
          return callback({ success: false, error: 'Not authorized to start game' });
        }

        if (game.players.length !== 2) {
          return callback({ success: false, error: 'Need 2 players to start' });
        }

        // Start the game
        game.gameState = 'playing';
        game.playerNumbers = {
          [game.players[0]]: player1Number,
          [game.players[1]]: player2Number
        };
        game.currentTurn = game.players[0];
        game.startedAt = new Date();

        await game.save();

        // Notify all players
        io.to(roomId).emit('gameStarted', {
          roomId,
          currentTurn: game.currentTurn,
          gameMode: game.gameMode
        });

        callback({ success: true, message: 'Game started' });
        console.log(`🎮 Game started in room: ${roomId}`);
      } catch (error) {
        console.error('Error starting game:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to start game' });
        }
      }
    });

    // Handle multiplayer game start (players submit their secret numbers)
    socket.on('startMultiplayerGame', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('startMultiplayerGame: callback is not a function');
          return;
        }

        const { roomId, playerNumber } = data;
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        if (!playerNumber || !/^\d{5}$/.test(playerNumber)) {
          return callback({ success: false, error: 'Invalid player number format' });
        }

        const game = gameRooms.get(roomId);

        if (!game) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (!game.players.includes(socket.userId)) {
          return callback({ success: false, error: 'Not in this room' });
        }

        // Check if game is already in progress
        if (game.gameState === 'playing') {
          return callback({ success: false, error: 'Game is already in progress' });
        }
        
        // Store the player's secret number
        if (!game.playerNumbers) {
          game.playerNumbers = {};
        }
        
        // Check if player has already submitted a number
        if (game.playerNumbers.has(socket.userId)) {
          console.log(`⚠️ Player ${socket.user.username} already submitted a number in room ${roomId}`);
          return callback({ success: false, error: 'You have already submitted a number' });
        }
        
        game.playerNumbers.set(socket.userId, playerNumber);
        console.log(`✅ Added number for player ${socket.user.username}: ${playerNumber}`);

        console.log(`🔢 Player ${socket.user.username} submitted number in room ${roomId}`);
        console.log(`📊 Current playerNumbers:`, game.playerNumbers);
        
        // Fix: Use proper Map methods for Mongoose Map objects
        const actualPlayerNumbersCount = game.playerNumbers.size || 0;
        console.log(`👥 Total players: ${game.players.length}, Numbers submitted: ${actualPlayerNumbersCount}`);
        console.log(`🔍 Player IDs in game:`, game.players);
        console.log(`🔍 Player IDs with numbers:`, Array.from(game.playerNumbers.keys()));
        console.log(`🔍 Player ${socket.user.username} ID:`, socket.userId);

        // Check if both players have submitted their numbers
        if (actualPlayerNumbersCount === 2) {
          console.log(`🎮 Both players submitted numbers! Starting game in room ${roomId}`);
          game.gameState = 'playing';
          game.currentTurn = game.players[0];
          game.startedAt = new Date();

          try {
            // Use findByIdAndUpdate to avoid parallel save issues
            await Game.findByIdAndUpdate(game._id, {
              gameState: game.gameState,
              currentTurn: game.currentTurn,
              startedAt: game.startedAt,
              playerNumbers: game.playerNumbers
            });
            
            // Update the in-memory game object
            game.gameState = game.gameState;
            game.currentTurn = game.currentTurn;
            game.startedAt = game.startedAt;
            
          } catch (error) {
            console.error('Error saving game state:', error);
            return callback({ success: false, error: 'Failed to start game' });
          }

          // Notify all players
          console.log(`📡 Emitting gameStarted event to room ${roomId}`);
          console.log(`🔍 Players in room:`, game.players);
          console.log(`🔍 Socket IDs in room:`, Array.from(io.sockets.adapter.rooms.get(roomId) || []));
          console.log(`🎯 Current turn set to: ${game.currentTurn} (${typeof game.currentTurn})`);
          
          io.to(roomId).emit('gameStarted', {
            roomId,
            currentTurn: game.currentTurn,
            gameMode: game.gameMode
          });

          console.log(`🎮 Multiplayer game started in room: ${roomId}`);
        } else {
          try {
            // Use findByIdAndUpdate to avoid parallel save issues
            await Game.findByIdAndUpdate(game._id, {
              playerNumbers: game.playerNumbers
            });
          } catch (error) {
            console.error('Error saving player number:', error);
            return callback({ success: false, error: 'Failed to save number' });
          }
          console.log(`📝 Player ${socket.user.username} submitted number in room: ${roomId}`);
        }

        callback({ success: true, message: 'Number submitted' });
      } catch (error) {
        console.error('Error starting multiplayer game:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to start game' });
        }
      }
    });

    // Handle guess submission
    socket.on('submitGuess', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('submitGuess: callback is not a function');
          return;
        }

        const { roomId, guess } = data;
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        if (!guess) {
          return callback({ success: false, error: 'Guess is required' });
        }

        const game = gameRooms.get(roomId);

        if (!game || game.gameState !== 'playing') {
          return callback({ success: false, error: 'Game not in progress' });
        }

        if (game.currentTurn.toString() !== socket.userId) {
          console.log(`⚠️ Turn mismatch: currentTurn=${game.currentTurn} (${typeof game.currentTurn}), socket.userId=${socket.userId} (${typeof socket.userId})`);
          return callback({ success: false, error: 'Not your turn' });
        }

        // Validate guess
        if (!/^\d{5}$/.test(guess)) {
          return callback({ success: false, error: 'Invalid guess format' });
        }

        // Calculate feedback
        const opponentId = game.players.find(p => p !== socket.userId);
        const opponentNumber = game.playerNumbers.get(opponentId);
        if (!opponentNumber) {
          return callback({ success: false, error: 'Opponent number not found' });
        }

        const feedback = calculateFeedback(guess, opponentNumber, game.gameMode);

        // Add guess to history
        const guessData = {
          playerId: socket.userId,
          guess,
          feedback,
          timestamp: new Date()
        };

        game.guessHistory.push(guessData);
        game.currentTurn = game.players.find(p => p !== socket.userId);

        // Check for win
        if (feedback.exact === 5) {
          game.gameState = 'finished';
          game.winner = socket.userId;
          game.endedAt = new Date();
          
          // Update player statistics
          await updateGameStats(game);
        }

        try {
          // Use findByIdAndUpdate to avoid parallel save issues
          await Game.findByIdAndUpdate(game._id, {
            guessHistory: game.guessHistory,
            currentTurn: game.currentTurn,
            gameState: game.gameState,
            winner: game.winner,
            endedAt: game.endedAt
          });
          
          // Update the in-memory game object
          game.guessHistory = game.guessHistory;
          game.currentTurn = game.currentTurn;
          game.gameState = game.gameState;
          game.winner = game.winner;
          game.endedAt = game.endedAt;
          
        } catch (error) {
          console.error('Error saving guess:', error);
          return callback({ success: false, error: 'Failed to save guess' });
        }

        // Notify all players
        io.to(roomId).emit('guessSubmitted', {
          roomId,
          guess: guessData,
          currentTurn: game.currentTurn,
          gameState: game.gameState
        });

        if (game.gameState === 'finished') {
          io.to(roomId).emit('gameEnded', {
            roomId,
            winner: socket.userId,
            winnerUsername: socket.user.username,
            game: game.toObject()
          });
        }

        callback({ success: true, feedback });
        console.log(`🎯 Guess submitted in room ${roomId}: ${guess}`);
      } catch (error) {
        console.error('Error submitting guess:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to submit guess' });
        }
      }
    });

    // Handle real-time typing updates
    socket.on('typingUpdate', (data) => {
      try {
        const { roomId, isTyping, currentInput } = data;
        
        if (!roomId) {
          console.error('typingUpdate: roomId is required');
          return;
        }

        const game = gameRooms.get(roomId);
        
        if (!game) return;
        
        // Broadcast typing status to other players in the room
        socket.to(roomId).emit('playerTyping', {
          playerId: socket.userId,
          playerName: socket.user.username,
          isTyping,
          currentInput: isTyping ? currentInput : '',
          roomId
        });
        
        console.log(`⌨️  Typing update from ${socket.user.username} in room ${roomId}`);
      } catch (error) {
        console.error('Error handling typing update:', error);
      }
    });

    // Handle room leaving
    socket.on('leaveRoom', async (data, callback) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Room ID is required' });
          }
          return;
        }

        const game = gameRooms.get(roomId);
        if (game) {
          // Remove player from game
          game.players = game.players.filter(p => p !== socket.userId);
          
          if (game.players.length === 0) {
            // Room is empty, delete it
            gameRooms.delete(roomId);
            await Game.findByIdAndDelete(game._id);
            console.log(`🗑️ Room deleted: ${roomId}`);
          } else {
            // Transfer host if needed
            if (game.host === socket.userId) {
              game.host = game.players[0];
            }
            
            // End game if in progress
            if (game.gameState === 'playing') {
              game.gameState = 'abandoned';
              game.endedAt = new Date();
            }
            
            await game.save();
            
            // Notify remaining players
            socket.to(roomId).emit('playerDisconnected', {
              playerId: socket.userId,
              roomId,
              gameState: game.gameState
            });
          }
        }

        // Leave the socket room
        socket.leave(roomId);
        
        if (typeof callback === 'function') {
          callback({ success: true, message: 'Left room' });
        }
        
        console.log(`🚪 Player left room: ${socket.user.username} -> ${roomId}`);
      } catch (error) {
        console.error('Error leaving room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to leave room' });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.username} (${socket.userId}) - Socket ID: ${socket.id}`);
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      
      // Remove from queues
      matchmakingQueue.delete(socket.userId);
      rankedQueue.delete(socket.userId);
      
      // Update user's online status
      updateUserStatus(socket.userId, false);
      
      // Handle leaving game rooms
      for (const [roomId, game] of gameRooms.entries()) {
        if (game.players.includes(socket.userId)) {
          handlePlayerDisconnect(roomId, socket.userId);
        }
      }
    });
  });

  return io;
};

// Helper functions
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const calculateFeedback = (guess, secretNumber, mode) => {
  let exact = 0;
  let misplaced = 0;
  let outOfPlace = 0;
  let totalCorrect = 0;

  // Count exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretNumber[i]) {
      exact++;
    }
  }

  // Count total correct digits
  const guessDigits = guess.split('');
  const secretDigits = secretNumber.split('');
  
  for (let digit of guessDigits) {
    if (secretDigits.includes(digit)) {
      totalCorrect++;
    }
  }

  // In hard mode, only show total correct
  if (mode === 'hard') {
    return { exact: 0, misplaced: 0, outOfPlace: 0, totalCorrect };
  }

  // In standard mode, show exact, misplaced, and out of place
  misplaced = totalCorrect - exact;
  outOfPlace = 5 - totalCorrect;
  return { exact, misplaced, outOfPlace, totalCorrect };
};

const findRankedMatch = (userId, gameMode) => {
  const player = rankedQueue.get(userId);
  if (!player) return;

  // Find opponent with similar rating (±100 points)
  for (const [opponentId, opponent] of rankedQueue.entries()) {
    if (opponentId === userId) continue;
    if (opponent.gameMode !== gameMode) continue;
    
    const ratingDiff = Math.abs(player.rating - opponent.rating);
    if (ratingDiff <= 100) {
      // Create match
      createMatch(userId, opponentId, gameMode, 'ranked');
      return;
    }
  }
};

const findCasualMatch = (userId, gameMode) => {
  const player = matchmakingQueue.get(userId);
  if (!player) return;

  // Find any opponent with same game mode
  for (const [opponentId, opponent] of matchmakingQueue.entries()) {
    if (opponentId === userId) continue;
    if (opponent.gameMode !== gameMode) continue;
    
    // Create match
    createMatch(userId, opponentId, gameMode, 'casual');
    return;
  }
};

const createMatch = async (player1Id, player2Id, gameMode, matchType) => {
  try {
    const roomId = generateRoomId();
    
    // Create new game
    const game = new Game({
      roomId,
      host: player1Id,
      players: [player1Id, player2Id],
      gameState: 'waiting',
      gameMode,
      matchType,
      maxPlayers: 2
    });

    await game.save();
    gameRooms.set(roomId, game);

    // Remove players from queues
    matchmakingQueue.delete(player1Id);
    matchmakingQueue.delete(player2Id);
    rankedQueue.delete(player1Id);
    rankedQueue.delete(player2Id);

    // Notify both players
    const player1Socket = io.sockets.sockets.get(activeConnections.get(player1Id));
    const player2Socket = io.sockets.sockets.get(activeConnections.get(player2Id));

    if (player1Socket) {
      player1Socket.emit('matchFound', { roomId, game: game.toObject() });
      player1Socket.join(roomId);
    }

    if (player2Socket) {
      player2Socket.emit('matchFound', { roomId, game: game.toObject() });
      player2Socket.join(roomId);
    }

    console.log(`🎯 Match created: ${roomId} (${matchType}) - ${player1Id} vs ${player2Id}`);
  } catch (error) {
    console.error('Error creating match:', error);
  }
};

const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      'settings.privacy.showOnlineStatus': isOnline
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const handlePlayerDisconnect = async (roomId, userId) => {
  try {
    const game = gameRooms.get(roomId);
    if (!game) return;

    // Remove player from game
    game.players = game.players.filter(p => p !== userId);
    
    if (game.players.length === 0) {
      // Room is empty, delete it
      gameRooms.delete(roomId);
      try {
        await Game.findByIdAndDelete(game._id);
        console.log(`🗑️ Room deleted: ${roomId}`);
      } catch (error) {
        console.error('Error deleting game from database:', error);
      }
    } else {
      // Transfer host if needed
      if (game.host === userId) {
        game.host = game.players[0];
      }
      
      // End game if in progress
      if (game.gameState === 'playing') {
        game.gameState = 'abandoned';
        game.endedAt = new Date();
      }
      
      try {
        // Use findByIdAndUpdate to avoid parallel save issues
        await Game.findByIdAndUpdate(game._id, {
          players: game.players,
          host: game.host,
          gameState: game.gameState,
          endedAt: game.endedAt
        });
        
        // Update the in-memory game object
        game.players = game.players;
        game.host = game.host;
        game.gameState = game.gameState;
        game.endedAt = game.endedAt;
        
      } catch (error) {
        console.error('Error updating game state on disconnect:', error);
      }
      
      // Notify remaining players
      io.to(roomId).emit('playerDisconnected', {
        playerId: userId,
        roomId,
        gameState: game.gameState
      });
    }
  } catch (error) {
    console.error('Error in handlePlayerDisconnect:', error);
  }
};

const updateGameStats = async (game) => {
  try {
    const winner = game.winner;
    const loser = game.players.find(p => p !== winner);
    
    // Update winner stats
    await User.findByIdAndUpdate(winner, {
      $inc: {
        'gameStats.gamesPlayed': 1,
        'gameStats.gamesWon': 1,
        'gameStats.currentStreak': 1,
        'gameStats.experience': 50,
        'coins': 10
      }
    });
    
    // Update loser stats
    await User.findByIdAndUpdate(loser, {
      $inc: {
        'gameStats.gamesPlayed': 1,
        'gameStats.currentStreak': 0,
        'gameStats.experience': 20,
        'coins': 5
      }
    });
    
    // Check for level ups
    const winnerUser = await User.findById(winner);
    const loserUser = await User.findById(loser);
    
    if (winnerUser) {
      await winnerUser.addExperience(50);
    }
    
    if (loserUser) {
      await loserUser.addExperience(20);
    }
    
  } catch (error) {
    console.error('Error updating game stats:', error);
  }
};

// Get server statistics
const getServerStats = () => {
  return {
    activeConnections: activeConnections.size,
    activeGames: gameRooms.size,
    matchmakingQueue: matchmakingQueue.size,
    rankedQueue: rankedQueue.size
  };
};

module.exports = {
  setupSocketIO,
  getServerStats,
  io: () => io
};
