import io from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import config from '../config/config';
import AuthService from './AuthService';

class NetworkService {
  constructor() {
    this.socket = null;
    this.isHost = false;
    this.roomId = null;
    this.playerId = null;
    this.onGameStart = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGuessReceived = null;
    this.onGameEnd = null;
    this.onPlayerTyping = null;
  }

  // Initialize connection to server
  connect() {
    return new Promise(async (resolve, reject) => {
      try {
        const url = config.SERVER_URL;
        console.log('Attempting to connect to:', url);
        
        // Get authentication token
        const token = AuthService.getToken();
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }
        
        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          timeout: config.SOCKET_TIMEOUT,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: config.SOCKET_RECONNECTION_ATTEMPTS,
          reconnectionDelay: config.SOCKET_RECONNECTION_DELAY,
          auth: {
            token: token
          },
          query: {
            token: token
          }
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          this.playerId = this.socket.id;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.handleDisconnection();
        });

        // Game event handlers
        this.socket.on('gameStarted', (data) => {
          if (this.onGameStart) this.onGameStart(data);
        });

        this.socket.on('playerJoined', (data) => {
          if (this.onPlayerJoined) this.onPlayerJoined(data);
        });

        this.socket.on('playerDisconnected', (data) => {
          if (this.onPlayerLeft) this.onPlayerLeft(data);
        });

        this.socket.on('guessSubmitted', (data) => {
          if (this.onGuessReceived) this.onGuessReceived(data);
        });

        this.socket.on('gameEnded', (data) => {
          if (this.onGameEnd) this.onGameEnd(data);
        });

        this.socket.on('playerTyping', (data) => {
          if (this.onPlayerTyping) this.onPlayerTyping(data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Create a new game room
  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout

      this.socket.emit('createPrivateRoom', { gameMode: 'standard' }, (response) => {
        clearTimeout(timeout);
        
        if (response && response.success) {
          this.roomId = response.roomId;
          this.isHost = true;
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to create room'));
        }
      });
    });
  }

  // Join an existing game room
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout

      this.socket.emit('joinPrivateRoom', { roomId }, (response) => {
        clearTimeout(timeout);
        
        if (response && response.success) {
          this.roomId = response.roomId;
          this.isHost = false;
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to join room'));
        }
      });
    });
  }

  // Start the game
  startGame(player1Number, player2Number) {
    if (!this.socket || !this.roomId) {
      throw new Error('Not connected or no room');
    }

    this.socket.emit('startGame', {
      roomId: this.roomId,
      player1Number,
      player2Number,
    });
  }

  // Start multiplayer game (both players submit their secret numbers)
  startMultiplayerGame(playerNumber) {
    if (!this.socket || !this.roomId) {
      throw new Error('Not connected or no room');
    }

    this.socket.emit('startMultiplayerGame', {
      roomId: this.roomId,
      playerNumber,
    });
  }

  // Submit a guess
  submitGuess(guess) {
    if (!this.socket || !this.roomId) {
      throw new Error('Not connected or no room');
    }

    this.socket.emit('submitGuess', {
      roomId: this.roomId,
      playerId: this.playerId,
      guess,
    });
  }

  // Provide feedback for a guess
  provideFeedback(guessId, feedback) {
    if (!this.socket || !this.roomId) {
      throw new Error('Not connected or no room');
    }

    this.socket.emit('provideFeedback', {
      roomId: this.roomId,
      guessId,
      feedback,
    });
  }

  // Leave room
  leaveRoom() {
    if (this.socket && this.roomId) {
      this.socket.emit('leaveRoom', { roomId: this.roomId });
      this.roomId = null;
      this.isHost = false;
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
      this.isHost = false;
      this.playerId = null;
    }
  }

  // Handle disconnection
  handleDisconnection() {
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
  }

  // Get local IP address for LAN discovery
  async getLocalIP() {
    try {
      const state = await NetInfo.fetch();
      if (state.type === 'wifi' && state.details) {
        return state.details.ipAddress;
      }
      return null;
    } catch (error) {
      console.error('Error getting local IP:', error);
      return null;
    }
  }

  // Check if connected to server
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Get room info
  getRoomInfo() {
    return {
      roomId: this.roomId,
      isHost: this.isHost,
      playerId: this.playerId,
    };
  }

  // Send typing update
  sendTypingUpdate(isTyping, currentInput = '') {
    if (!this.socket || !this.roomId) return;
    
    this.socket.emit('typingUpdate', {
      roomId: this.roomId,
      isTyping,
      currentInput
    });
  }

  // Listen for typing updates
  onPlayerTyping(callback) {
    if (!this.socket) return;
    
    this.socket.on('playerTyping', callback);
  }

  // Remove typing listener
  offPlayerTyping(callback) {
    if (!this.socket) return;
    
    this.socket.off('playerTyping', callback);
  }
}

export default new NetworkService(); 