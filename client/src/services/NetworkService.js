import io from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import config from '../config/config';
import AuthService from './AuthService';

class NetworkService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    
    // Event callbacks
    this.onGameStart = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGuessReceived = null;
    this.onGameEnd = null;
    this.onPlayerTyping = null;
    this.onDisconnect = null;
    this.onRoomReady = null;
  }

  // Initialize connection to server
  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket && this.socket.connected) {
      return Promise.resolve(true);
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const url = config.SERVER_URL;
        console.log('Attempting to connect to:', url);
        
        // Get authentication token
        const token = AuthService.getToken();
        if (!token) {
          this.isConnecting = false;
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
          this.isConnecting = false;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          this.isConnecting = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnecting = false;
          this.handleDisconnection();
          
          // Notify UI about disconnection
          if (this.onDisconnect) {
            this.onDisconnect();
          }
        });

        // Game event handlers - match server event names exactly
        this.socket.on('gameStarted', (data) => {
          console.log('Game started event received:', data);
          if (this.onGameStart) this.onGameStart(data);
        });

        this.socket.on('playerJoined', (data) => {
          console.log('Player joined event received:', data);
          if (this.onPlayerJoined) this.onPlayerJoined(data);
        });

        this.socket.on('playerDisconnected', (data) => {
          console.log('Player disconnected event received:', data);
          if (this.onPlayerLeft) this.onPlayerLeft(data);
        });

        this.socket.on('guessSubmitted', (data) => {
          console.log('Guess submitted event received:', data);
          if (this.onGuessReceived) this.onGuessReceived(data);
        });

        this.socket.on('gameEnded', (data) => {
          console.log('Game ended event received:', data);
          if (this.onGameEnd) this.onGameEnd(data);
        });

        this.socket.on('playerTyping', (data) => {
          console.log('Player typing event received:', data);
          if (this.onPlayerTyping) this.onPlayerTyping(data);
        });

        this.socket.on('roomReady', (data) => {
          console.log('Room ready event received:', data);
          console.log('🔍 onRoomReady callback exists:', !!this.onRoomReady);
          if (this.onRoomReady) {
            console.log('✅ Calling onRoomReady callback');
            this.onRoomReady(data);
          } else {
            console.log('❌ onRoomReady callback not set');
          }
        });

        // Set connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, config.SOCKET_TIMEOUT);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Create a new game room
  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout

      try {
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
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Join an existing game room
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      if (!roomId || typeof roomId !== 'string') {
        reject(new Error('Invalid room ID'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout

      try {
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
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Start multiplayer game (both players submit their secret numbers)
  startMultiplayerGame(playerNumber) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.roomId) {
        reject(new Error('Not connected or no room'));
        return;
      }

      if (!playerNumber || typeof playerNumber !== 'string' || playerNumber.length !== 5) {
        reject(new Error('Invalid player number format'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);

      try {
        this.socket.emit('startMultiplayerGame', {
          roomId: this.roomId,
          playerNumber,
        }, (response) => {
          clearTimeout(timeout);
          
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to submit number'));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Submit a guess
  submitGuess(guess) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.roomId) {
        reject(new Error('Not connected or no room'));
        return;
      }

      if (!guess || typeof guess !== 'string' || guess.length !== 5) {
        reject(new Error('Invalid guess format'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);

      try {
        this.socket.emit('submitGuess', {
          roomId: this.roomId,
          guess,
        }, (response) => {
          clearTimeout(timeout);
          
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to submit guess'));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Leave room
  leaveRoom() {
    if (this.socket && this.roomId) {
      try {
        this.socket.emit('leaveRoom', { roomId: this.roomId });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
      
      // Clean up local state
      this.roomId = null;
      this.isHost = false;
    }
  }

  // Check room status
  checkRoomStatus(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      if (!roomId || typeof roomId !== 'string') {
        reject(new Error('Invalid room ID'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000); // 10 second timeout

      try {
        this.socket.emit('checkRoomStatus', { roomId }, (response) => {
          clearTimeout(timeout);
          
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to check room status'));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      
      this.socket = null;
      this.roomId = null;
      this.isHost = false;
      this.playerId = null;
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  // Handle disconnection
  handleDisconnection() {
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  // Force disconnect and cleanup (for when connection is lost unexpectedly)
  forceDisconnect() {
    console.log('Force disconnecting and cleaning up...');
    
    // Clear all callbacks
    this.onGameStart = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGuessReceived = null;
    this.onGameEnd = null;
    this.onPlayerTyping = null;
    this.onDisconnect = null;
    this.onRoomReady = null;
    
    // Clean up socket
    if (this.socket) {
      try {
        this.socket.off('disconnect');
        this.socket.off('connect_error');
        this.socket.off('gameStarted');
        this.socket.off('playerJoined');
        this.socket.off('playerDisconnected');
        this.socket.off('guessSubmitted');
        this.socket.off('gameEnded');
        this.socket.off('playerTyping');
        this.socket.off('roomReady');
      } catch (error) {
        console.error('Error cleaning up socket listeners:', error);
      }
    }
    
    // Reset state
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
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
    return this.socket && this.socket.connected && !this.isConnecting;
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
    if (!this.socket || !this.roomId || !this.socket.connected) return;
    
    try {
      this.socket.emit('typingUpdate', {
        roomId: this.roomId,
        isTyping,
        currentInput
      });
    } catch (error) {
      console.error('Error sending typing update:', error);
    }
  }

  // Listen for typing updates
  onPlayerTyping(callback) {
    if (!this.socket) return;
    
    try {
      this.socket.on('playerTyping', callback);
    } catch (error) {
      console.error('Error setting up typing listener:', error);
    }
  }

  // Remove typing listener
  offPlayerTyping(callback) {
    if (!this.socket) return;
    
    try {
      this.socket.off('playerTyping', callback);
    } catch (error) {
      console.error('Error removing typing listener:', error);
    }
  }

  // Clean up all event listeners
  cleanup() {
    if (this.socket) {
      try {
        this.socket.off('gameStarted');
        this.socket.off('playerJoined');
        this.socket.off('playerDisconnected');
        this.socket.off('guessSubmitted');
        this.socket.off('gameEnded');
        this.socket.off('playerTyping');
        this.socket.off('roomReady');
      } catch (error) {
        console.error('Error cleaning up event listeners:', error);
      }
    }
  }
}

export default new NetworkService(); 