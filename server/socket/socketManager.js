const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const { verifyToken } = require('../utils/jwtUtils');
const firebaseNotificationService = require('../services/firebaseNotificationService');

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
    
    // Join personal channel for friend notifications
    socket.join(`user_${socket.userId}`);

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
          
          // If room is full and we're already in it, emit roomReady event
          if (game.players.length === 2) {
            console.log(`🎮 Room ${roomId} is already full with 2 players. Emitting roomReady event.`);
            console.log(`📡 Emitting roomReady event to room ${roomId}`);
            console.log(`🔍 Players in room:`, game.players);
            console.log(`🔍 Socket IDs in room:`, Array.from(io.sockets.adapter.rooms.get(roomId) || []));
            io.to(roomId).emit('roomReady', {
              roomId,
              players: game.players,
              message: 'Room is full! Both players can now set up their secret numbers.'
            });
            console.log(`✅ roomReady event emitted`);
          }
          
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

        // Send push notification to host when someone joins
        if (game.host !== socket.userId) {
          try {
            await firebaseNotificationService.sendToUser(
              game.host,
              'Player Joined! 👥',
              `${socket.user.username} joined your room`,
              {
                type: 'player_joined',
                roomId,
                playerName: socket.user.username,
                playerId: socket.userId
              }
            );
          } catch (error) {
            console.error('Error sending player joined notification:', error);
          }
        }

        callback({
          success: true,
          roomId,
          game: game.toObject()
        });

        console.log(`👥 Player joined room: ${socket.user.username} -> ${roomId}`);

        // Check if room is now full (2 players) and notify
        if (game.players.length === 2) {
          console.log(`🎮 Room ${roomId} is now full with 2 players. Ready for setup phase.`);
          
          // Notify all players that the room is full and ready for setup
          console.log(`📡 Emitting roomReady event to room ${roomId}`);
          console.log(`🔍 Players in room:`, game.players);
          console.log(`🔍 Socket IDs in room:`, Array.from(io.sockets.adapter.rooms.get(roomId) || []));
          io.to(roomId).emit('roomReady', {
            roomId,
            players: game.players,
            message: 'Room is full! Both players can now set up their secret numbers.'
          });
          console.log(`✅ roomReady event emitted`);

          // Send push notifications to both players
          try {
            const otherPlayerId = game.players.find(p => p !== socket.userId);
            await firebaseNotificationService.sendToUsers(
              [socket.userId, otherPlayerId],
              'Room Ready! 🎮',
              'Both players are in the room. Set up your secret number to start!',
              {
                type: 'room_ready',
                roomId,
                players: game.players
              }
            );
          } catch (error) {
            console.error('Error sending room ready notification:', error);
          }
        }
      } catch (error) {
        console.error('Error joining room:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join room' });
        }
      }
    });

    // Handle getting available rooms
    socket.on('getAvailableRooms', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('getAvailableRooms: callback is not a function');
          return;
        }

        console.log(`🔍 User ${socket.user.username} requesting available rooms`);
        
        // Get all waiting rooms that are not full
        const availableRooms = [];
        
        for (const [roomId, game] of gameRooms.entries()) {
          if (game.gameState === 'waiting' && game.players.length < game.maxPlayers) {
            // Get host user info
            const hostUser = await User.findById(game.host).select('username');
            
            availableRooms.push({
              roomId,
              hostName: hostUser ? hostUser.username : 'Unknown',
              players: game.players.length,
              maxPlayers: game.maxPlayers,
              timestamp: game.createdAt,
              type: 'available_room'
            });
          }
        }

        console.log(`✅ Found ${availableRooms.length} available rooms`);

        callback({
          success: true,
          rooms: availableRooms
        });
      } catch (error) {
        console.error('Error getting available rooms:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to get available rooms' });
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

    // Handle room status check
    socket.on('checkRoomStatus', async (data, callback) => {
      try {
        // Ensure callback is a function
        if (typeof callback !== 'function') {
          console.error('checkRoomStatus: callback is not a function');
          return;
        }

        const { roomId } = data;
        console.log(`🔍 User ${socket.user.username} checking status of room ${roomId}`);
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        const game = gameRooms.get(roomId);

        if (!game) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (!game.players.includes(socket.userId)) {
          return callback({ success: false, error: 'Not in this room' });
        }

        const response = {
          success: true,
          roomId,
          game: game.toObject(),
          isReady: game.players.length === 2 && game.gameState === 'waiting'
        };

        // If room is ready but game state is still waiting, emit roomReady event
        if (response.isReady) {
          console.log(`🎮 Room ${roomId} is ready but game state is waiting. Emitting roomReady event.`);
          console.log(`📡 Emitting roomReady event to room ${roomId}`);
          console.log(`🔍 Players in room:`, game.players);
          console.log(`🔍 Socket IDs in room:`, Array.from(io.sockets.adapter.rooms.get(roomId) || []));
          io.to(roomId).emit('roomReady', {
            roomId,
            players: game.players,
            message: 'Room is full! Both players can now set up their secret numbers.'
          });
          console.log(`✅ roomReady event emitted`);
        }

        callback(response);
      } catch (error) {
        console.error('Error checking room status:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to check room status' });
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
          game.playerNumbers = new Map();
        }
        
        // Check if player has already submitted a number
        if (game.playerNumbers.has(socket.userId)) {
          console.log(`⚠️ Player ${socket.user.username} already submitted a number in room ${roomId}`);
          return callback({ success: false, error: 'You have already submitted a number' });
        }
        
        // Use proper Mongoose Map syntax
        game.playerNumbers.set(socket.userId, playerNumber);
        console.log(`✅ Added number for player ${socket.user.username}: ${playerNumber}`);

        console.log(`🔢 Player ${socket.user.username} submitted number in room ${roomId}`);
        console.log(`📊 Current playerNumbers:`, game.playerNumbers);
        
        // Use proper Map methods for Mongoose Map objects
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
            currentTurn: game.currentTurn ? game.currentTurn.toString() : game.currentTurn,
            gameMode: game.gameMode
          });

          // Send push notifications to both players
          try {
            await firebaseNotificationService.sendToUsers(
              game.players,
              'Game Started! 🎮',
              'The game has begun! Good luck!',
              {
                type: 'game_started',
                roomId,
                currentTurn: game.currentTurn,
                gameMode: game.gameMode
              }
            );

            // Send "Your Turn" notification to the first player
            await firebaseNotificationService.sendToUser(
              game.currentTurn,
              'Your Turn! 🎲',
              'It\'s your turn to make a guess!',
              {
                type: 'your_turn',
                roomId,
                gameMode: game.gameMode
              }
            );
          } catch (error) {
            console.error('Error sending game started notifications:', error);
          }

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

        if (game.currentTurn?.toString() !== socket.userId) {
          console.log(`⚠️ Turn mismatch: currentTurn=${game.currentTurn} (${typeof game.currentTurn}), socket.userId=${socket.userId} (${typeof socket.userId})`);
          return callback({ success: false, error: 'Not your turn' });
        }

        // Validate guess
        if (!/^\d{5}$/.test(guess)) {
          return callback({ success: false, error: 'Invalid guess format' });
        }

        // Calculate feedback
        const opponentId = game.players.find(p => p.toString() !== socket.userId)?.toString();
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
        const nextTurnId = game.players.find(p => p.toString() !== socket.userId);
        game.currentTurn = nextTurnId; // store as ObjectId

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
          currentTurn: game.currentTurn ? game.currentTurn.toString() : game.currentTurn,
          gameState: game.gameState
        });

        // Send "Your Turn" notification to the next player (if game is still ongoing)
        if (game.gameState === 'playing') {
          try {
            await firebaseNotificationService.sendToUser(
              game.currentTurn,
              'Your Turn! 🎲',
              'It\'s your turn to make a guess!',
              {
                type: 'your_turn',
                roomId,
                gameMode: game.gameMode
              }
            );
          } catch (error) {
            console.error('Error sending turn notification:', error);
          }
        }

        if (game.gameState === 'finished') {
          io.to(roomId).emit('gameEnded', {
            roomId,
            winner: socket.userId,
            winnerUsername: socket.user.username,
            game: game.toObject()
          });

          // Send game result notifications
          try {
            const winner = await User.findById(socket.userId).select('username');
            const loser = await User.findById(game.players.find(p => p !== socket.userId)).select('username');
            
            if (winner && loser) {
              // Send victory notification to winner
              await firebaseNotificationService.sendToUser(
                socket.userId,
                'Victory! 🏆',
                `Congratulations! You beat ${loser.username}!`,
                {
                  type: 'game_result',
                  roomId,
                  won: true,
                  opponentName: loser.username
                }
              );

              // Send defeat notification to loser
              await firebaseNotificationService.sendToUser(
                game.players.find(p => p !== socket.userId),
                'Game Over 💔',
                `Better luck next time! ${winner.username} won the game.`,
                {
                  type: 'game_result',
                  roomId,
                  won: false,
                  opponentName: winner.username
                }
              );
            }
          } catch (error) {
            console.error('Error sending game result notifications:', error);
          }
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

    // Friend-related socket events
    
    // Get friend's online status
    socket.on('getFriendStatus', async (data, callback) => {
      try {
        if (typeof callback !== 'function') {
          console.error('getFriendStatus: callback is not a function');
          return;
        }

        const { friendId } = data;
        if (!friendId) {
          return callback({ success: false, error: 'Friend ID is required' });
        }

        // Check if they are actually friends
        const user = await User.findById(socket.userId);
        if (!user || !user.friends.includes(friendId)) {
          return callback({ success: false, error: 'Not in your friends list' });
        }

        const friend = await User.findById(friendId).select('lastActive settings.privacy.showOnlineStatus');
        if (!friend) {
          return callback({ success: false, error: 'Friend not found' });
        }

        const isOnline = isUserOnline(friend);

        callback({
          success: true,
          data: {
            friendId,
            isOnline,
            lastActive: friend.lastActive
          }
        });

      } catch (error) {
        console.error('Error getting friend status:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to get friend status' });
        }
      }
    });

    // Notify friends when user comes online/offline
    socket.on('updateOnlineStatus', async () => {
      try {
        const user = await User.findById(socket.userId).populate('friends', 'lastActive settings.privacy.showOnlineStatus');
        if (!user) return;

        // Notify all friends about status change
        user.friends.forEach(friend => {
          socket.to(`user_${friend._id}`).emit('friendStatusUpdate', {
            friendId: socket.userId,
            username: socket.user.username,
            isOnline: true,
            lastActive: new Date()
          });
        });

      } catch (error) {
        console.error('Error updating online status:', error);
      }
    });

    // Send friend request via socket (alternative to REST API)
    socket.on('sendFriendRequest', async (data, callback) => {
      try {
        if (typeof callback !== 'function') {
          console.error('sendFriendRequest: callback is not a function');
          return;
        }

        const { username, userId: targetUserId } = data;
        
        if (!username && !targetUserId) {
          return callback({ success: false, error: 'Username or user ID is required' });
        }

        // Find target user
        let targetUser;
        if (targetUserId) {
          targetUser = await User.findById(targetUserId);
        } else {
          targetUser = await User.findOne({ username });
        }

        if (!targetUser) {
          return callback({ success: false, error: 'User not found' });
        }

        if (targetUser._id.toString() === socket.userId) {
          return callback({ success: false, error: 'Cannot send friend request to yourself' });
        }

        // Check if already friends or request exists
        if (targetUser.friends.includes(socket.userId)) {
          return callback({ success: false, error: 'Already friends' });
        }

        if (targetUser.hasPendingRequestFrom(socket.userId)) {
          return callback({ success: false, error: 'Friend request already sent' });
        }

        if (!targetUser.settings.privacy.allowFriendRequests) {
          return callback({ success: false, error: 'User not accepting friend requests' });
        }

        // Add friend request
        targetUser.friendRequests.push({
          from: socket.userId,
          status: 'pending',
          createdAt: new Date()
        });

        await targetUser.save();

        // Send real-time notification
        socket.to(`user_${targetUser._id}`).emit('friendRequest', {
          type: 'friend_request',
          from: {
            id: socket.userId,
            username: socket.user.username,
            avatar: socket.user.avatar
          },
          message: `${socket.user.username} sent you a friend request`
        });

        callback({ 
          success: true, 
          message: 'Friend request sent',
          data: { targetUser: { id: targetUser._id, username: targetUser.username } }
        });

      } catch (error) {
        console.error('Error sending friend request:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to send friend request' });
        }
      }
    });

    // Accept/decline friend request via socket
    socket.on('respondToFriendRequest', async (data, callback) => {
      try {
        if (typeof callback !== 'function') {
          console.error('respondToFriendRequest: callback is not a function');
          return;
        }

        const { requestId, action } = data;
        
        if (!['accept', 'decline'].includes(action)) {
          return callback({ success: false, error: 'Invalid action' });
        }

        const user = await User.findById(socket.userId);
        if (!user) {
          return callback({ success: false, error: 'User not found' });
        }

        const friendRequest = user.friendRequests.id(requestId);
        if (!friendRequest || friendRequest.status !== 'pending') {
          return callback({ success: false, error: 'Friend request not found or already processed' });
        }

        const senderId = friendRequest.from;

        if (action === 'accept') {
          // Add both users to each other's friends list
          await User.findByIdAndUpdate(socket.userId, {
            $addToSet: { friends: senderId }
          });

          await User.findByIdAndUpdate(senderId, {
            $addToSet: { friends: socket.userId }
          });

          friendRequest.status = 'accepted';
          friendRequest.respondedAt = new Date();

          // Get friend info
          const friendUser = await User.findById(senderId).select('username avatar gameStats.level');

          // Notify the sender
          socket.to(`user_${senderId}`).emit('friendRequestAccepted', {
            type: 'friend_accepted',
            from: {
              id: socket.userId,
              username: socket.user.username,
              avatar: socket.user.avatar
            },
            message: `${socket.user.username} accepted your friend request`
          });

          callback({
            success: true,
            message: 'Friend request accepted',
            data: {
              newFriend: {
                id: friendUser._id,
                username: friendUser.username,
                avatar: friendUser.avatar,
                level: friendUser.gameStats?.level || 1
              }
            }
          });

        } else {
          friendRequest.status = 'declined';
          friendRequest.respondedAt = new Date();
          
          callback({ success: true, message: 'Friend request declined' });
        }

        await user.save();

      } catch (error) {
        console.error('Error responding to friend request:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to process friend request' });
        }
      }
    });

    // Remove friend via socket
    socket.on('removeFriend', async (data, callback) => {
      try {
        if (typeof callback !== 'function') {
          console.error('removeFriend: callback is not a function');
          return;
        }

        const { friendId } = data;
        
        if (!friendId) {
          return callback({ success: false, error: 'Friend ID is required' });
        }

        // Remove from both users' friends lists
        await User.findByIdAndUpdate(socket.userId, {
          $pull: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
          $pull: { friends: socket.userId }
        });

        // Notify the removed friend
        socket.to(`user_${friendId}`).emit('friendRemoved', {
          type: 'friend_removed',
          from: {
            id: socket.userId,
            username: socket.user.username
          },
          message: `${socket.user.username} removed you from their friends list`
        });

        callback({ success: true, message: 'Friend removed' });

      } catch (error) {
        console.error('Error removing friend:', error);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to remove friend' });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username} (${socket.userId}) - Socket ID: ${socket.id}`);
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      
      // Remove from queues
      matchmakingQueue.delete(socket.userId);
      rankedQueue.delete(socket.userId);
      
      // Update user's online status
      updateUserStatus(socket.userId, false);
      
      // Notify friends about user going offline
      try {
        const user = await User.findById(socket.userId).populate('friends', '_id');
        if (user) {
          user.friends.forEach(friend => {
            socket.to(`user_${friend._id}`).emit('friendStatusUpdate', {
              friendId: socket.userId,
              username: socket.user.username,
              isOnline: false,
              lastActive: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Error notifying friends of disconnect:', error);
      }
      
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

  // In hard mode, only show total correct to user, but keep exact for win checking
  if (mode === 'hard') {
    return { exact, misplaced: 0, outOfPlace: 0, totalCorrect };
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

    // Send push notifications to both players
    try {
      const [player1, player2] = await Promise.all([
        User.findById(player1Id).select('username'),
        User.findById(player2Id).select('username')
      ]);

      if (player1 && player2) {
        // Send individual notifications with correct opponent names
        await firebaseNotificationService.sendToUser(
          player1Id,
          'Match Found! 🎯',
          `You've been matched with ${player2.username}. Tap to join!`,
          {
            type: 'match_found',
            roomId,
            matchType,
            gameMode,
            opponentName: player2.username
          }
        );

        await firebaseNotificationService.sendToUser(
          player2Id,
          'Match Found! 🎯',
          `You've been matched with ${player1.username}. Tap to join!`,
          {
            type: 'match_found',
            roomId,
            matchType,
            gameMode,
            opponentName: player1.username
          }
        );
      }
    } catch (error) {
      console.error('Error sending match found notifications:', error);
    }

    console.log(`🎯 Match created: ${roomId} (${matchType}) - ${player1Id} vs ${player2Id}`);
  } catch (error) {
    console.error('Error creating match:', error);
  }
};

const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      lastActive: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Helper function to determine if user is online
// This checks if user was active in the last 5 minutes and has showOnlineStatus enabled
const isUserOnline = (user) => {
  if (!user.settings?.privacy?.showOnlineStatus) {
    return false; // User has privacy setting to hide online status
  }
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return user.lastActive && user.lastActive > fiveMinutesAgo;
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

      // Send push notification to remaining players
      try {
        const disconnectedUser = await User.findById(userId).select('username');
        if (disconnectedUser) {
          await firebaseNotificationService.sendToUsers(
            game.players,
            'Player Disconnected 📡',
            `${disconnectedUser.username} has left the game`,
            {
              type: 'player_disconnected',
              roomId,
              playerName: disconnectedUser.username,
              playerId: userId,
              gameState: game.gameState
            }
          );
        }
      } catch (error) {
        console.error('Error sending player disconnected notification:', error);
      }
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
