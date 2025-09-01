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
    this.connectionRetries = 0;
    this.maxRetries = 3;
    
    // Multiple rooms support
    this.hostedRooms = []; // Array of rooms I'm hosting
    this.joinedRooms = []; // Array of rooms I've joined
    this.availableRooms = []; // Array of available rooms from server
    
    // Event callbacks
    this.onGameStart = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGuessReceived = null;
    this.onGameEnd = null;
    this.onPlayerTyping = null;
    this.onDisconnect = null;
    this.onRoomReady = null;
    this.onConnectionError = null;
    this.onRoomsUpdated = null; // New callback for room list updates
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
        console.log('🔌 Attempting to connect to:', url);
        
        // Test server health first
        console.log('🏥 Testing server health...');
        const serverHealthy = await this.testConnection();
        if (!serverHealthy) {
          this.isConnecting = false;
          const error = new Error('Server is not responding. Please check your internet connection or try again later.');
          console.error('❌ Server health check failed');
          if (this.onConnectionError) {
            this.onConnectionError(error);
          }
          reject(error);
          return;
        }
        console.log('✅ Server health check passed');
        
        // Check authentication status
        if (!this.isAuthenticated()) {
          this.isConnecting = false;
          const error = new Error('You must be logged in to play multiplayer games');
          console.error('❌ Authentication required:', error.message);
          if (this.onConnectionError) {
            this.onConnectionError(error);
          }
          reject(error);
          return;
        }
        
        // Get authentication token
        const token = AuthService.getToken();
        if (!token) {
          this.isConnecting = false;
          const error = new Error('No authentication token available');
          console.error('❌ Authentication error:', error.message);
          if (this.onConnectionError) {
            this.onConnectionError(error);
          }
          reject(error);
          return;
        }
        
        console.log('🔑 Using token:', token.substring(0, 20) + '...');
        
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
          console.log('✅ Connected to server successfully');
          this.playerId = this.socket.id;
          this.isConnecting = false;
          this.connectionRetries = 0;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          this.isConnecting = false;
          
          // Retry connection if we haven't exceeded max retries
          if (this.connectionRetries < this.maxRetries) {
            this.connectionRetries++;
            console.log(`🔄 Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
            setTimeout(() => {
              this.connect().then(resolve).catch(reject);
            }, 2000 * this.connectionRetries); // Exponential backoff
          } else {
            if (this.onConnectionError) {
              this.onConnectionError(error);
            }
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from server. Reason:', reason);
          this.isConnecting = false;
          this.handleDisconnection();
          
          // Notify UI about disconnection
          if (this.onDisconnect) {
            this.onDisconnect(reason);
          }
        });

        // Game event handlers - match server event names exactly
        this.socket.on('gameStarted', (data) => {
          console.log('🎮 Game started event received:', data);
          if (this.onGameStart) this.onGameStart(data);
        });

        this.socket.on('playerJoined', (data) => {
          console.log('👥 Player joined event received:', data);
          if (this.onPlayerJoined) this.onPlayerJoined(data);
        });

        this.socket.on('playerDisconnected', (data) => {
          console.log('👋 Player disconnected event received:', data);
          if (this.onPlayerLeft) this.onPlayerLeft(data);
        });

        this.socket.on('guessSubmitted', (data) => {
          console.log('🎯 Guess submitted event received:', data);
          if (this.onGuessReceived) this.onGuessReceived(data);
        });

        this.socket.on('gameEnded', (data) => {
          console.log('🏁 Game ended event received:', data);
          if (this.onGameEnd) this.onGameEnd(data);
        });

        this.socket.on('playerTyping', (data) => {
          console.log('⌨️ Player typing event received:', data);
          if (this.onPlayerTyping) this.onPlayerTypingFunction(data);
        });

        this.socket.on('roomReady', (data) => {
          console.log('🏠 Room ready event received:', data);
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
            const timeoutError = new Error('Connection timeout');
            console.error('⏰ Connection timeout');
            if (this.onConnectionError) {
              this.onConnectionError(timeoutError);
            }
            reject(timeoutError);
          }
        }, config.SOCKET_TIMEOUT);

      } catch (error) {
        this.isConnecting = false;
        console.error('❌ Error in connect method:', error);
        if (this.onConnectionError) {
          this.onConnectionError(error);
        }
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
            // Add the new room to hosted rooms
            const newRoom = {
              roomId: response.roomId,
              hostName: 'You',
              players: 1,
              maxPlayers: 2,
              timestamp: Date.now(),
              type: 'hosted_room'
            };
            
            this.hostedRooms.push(newRoom);
            this.roomId = response.roomId;
            this.isHost = true;
            
            // Notify UI about room update
            this.notifyRoomsUpdated();
            
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
            // Add the room to joined rooms if not already there
            const existingJoinedRoom = this.joinedRooms.find(room => room.roomId === roomId);
            if (!existingJoinedRoom) {
              const joinedRoom = {
                roomId: response.roomId,
                hostName: response.hostName || 'Other Player',
                players: response.players || 2,
                maxPlayers: response.maxPlayers || 2,
                timestamp: Date.now(),
                type: 'joined_room'
              };
              this.joinedRooms.push(joinedRoom);
            }
            
            this.roomId = response.roomId;
            this.isHost = false;
            
            // Notify UI about room update
            this.notifyRoomsUpdated();
            
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
  leaveRoom(roomId = null) {
    const targetRoomId = roomId || this.roomId;
    
    if (this.socket && targetRoomId) {
      try {
        this.socket.emit('leaveRoom', { roomId: targetRoomId });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
      
      // Remove from hosted rooms if it's a hosted room
      this.hostedRooms = this.hostedRooms.filter(room => room.roomId !== targetRoomId);
      
      // Remove from joined rooms if it's a joined room
      this.joinedRooms = this.joinedRooms.filter(room => room.roomId !== targetRoomId);
      
      // If this was the current room, clear current room state
      if (targetRoomId === this.roomId) {
        this.roomId = null;
        this.isHost = false;
      }
      
      // Notify UI about room update
      this.notifyRoomsUpdated();
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
    this.hostedRooms = []; // Reset hosted rooms
    this.joinedRooms = []; // Reset joined rooms
    this.availableRooms = []; // Reset available rooms
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
    this.onConnectionError = null;
    this.onRoomsUpdated = null; // Clear new callback
    
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
        this.socket.off('roomsUpdated'); // Remove new listener
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
    this.hostedRooms = []; // Reset hosted rooms
    this.joinedRooms = []; // Reset joined rooms
    this.availableRooms = []; // Reset available rooms
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

  // Check if user is authenticated
  isAuthenticated() {
    return AuthService.checkAuth();
  }

  // Get authentication status
  getAuthStatus() {
    return {
      isAuthenticated: AuthService.checkAuth(),
      hasToken: !!AuthService.getToken(),
      user: AuthService.getCurrentUser()
    };
  }

  // Test server connection
  async testConnection() {
    try {
      const response = await fetch(`${config.SERVER_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server health check passed:', data);
        return true;
      } else {
        console.error('❌ Server health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Server health check error:', error);
      return false;
    }
  }

  // Check if connected to server
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Get connection status
  getConnectionStatus() {
    if (this.isConnecting) {
      return 'connecting';
    } else if (this.isConnected()) {
      return 'connected';
    } else {
      return 'disconnected';
    }
  }

  // Get room info
  getRoomInfo() {
    return {
      roomId: this.roomId,
      isHost: this.isHost,
      playerId: this.playerId,
    };
  }

  // Get all rooms info (multiple rooms support)
  getAllRoomsInfo() {
    return {
      hostedRooms: this.hostedRooms,
      joinedRooms: this.joinedRooms,
      availableRooms: this.availableRooms,
      currentRoomId: this.roomId,
      isHost: this.isHost,
      playerId: this.playerId,
    };
  }

  // Get hosted rooms (rooms I'm hosting)
  getHostedRooms() {
    return this.hostedRooms;
  }

  // Get joined rooms (rooms I've joined)
  getJoinedRooms() {
    return this.joinedRooms;
  }

  // Get available rooms (from server)
  getAvailableRooms() {
    return this.availableRooms;
  }

  // Refresh available rooms from server
  refreshAvailableRooms() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);

      try {
        this.socket.emit('getAvailableRooms', {}, (response) => {
          clearTimeout(timeout);
          
          if (response && response.success) {
            // Filter out rooms I'm hosting or have joined
            const myRoomIds = [
              ...this.hostedRooms.map(room => room.roomId),
              ...this.joinedRooms.map(room => room.roomId)
            ];
            
            this.availableRooms = response.rooms.filter(room => 
              !myRoomIds.includes(room.roomId)
            );
            
            // Notify UI about room update
            this.notifyRoomsUpdated();
            
            resolve(this.availableRooms);
          } else {
            reject(new Error(response?.error || 'Failed to get available rooms'));
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Delete a specific room (only for hosted rooms)
  deleteRoom(roomId) {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    // Check if this is a room I'm hosting
    const isHostedRoom = this.hostedRooms.some(room => room.roomId === roomId);
    if (!isHostedRoom) {
      throw new Error('You can only delete rooms you are hosting');
    }

    // Leave the room (this will delete it on the server)
    this.leaveRoom(roomId);
    
    return true;
  }

  // Set current room (for game start)
  setCurrentRoom(roomId) {
    const hostedRoom = this.hostedRooms.find(room => room.roomId === roomId);
    const joinedRoom = this.joinedRooms.find(room => room.roomId === roomId);
    
    if (hostedRoom) {
      this.roomId = roomId;
      this.isHost = true;
      return true;
    } else if (joinedRoom) {
      this.roomId = roomId;
      this.isHost = false;
      return true;
    } else {
      throw new Error('Room not found in your rooms');
    }
  }

  // Get current room info (for UI display)
  getCurrentRoomInfo() {
    return {
      roomId: this.roomId,
      isHost: this.isHost,
      playerId: this.playerId,
    };
  }

  // Check if a specific room is the current room
  isCurrentRoom(roomId) {
    return this.roomId === roomId;
  }

  // Check if we're hosting a specific room
  isHostingRoom(roomId) {
    return this.hostedRooms.some(room => room.roomId === roomId);
  }

  // Check if we've joined a specific room
  hasJoinedRoom(roomId) {
    return this.joinedRooms.some(room => room.roomId === roomId);
  }

  // Notify UI about room updates
  notifyRoomsUpdated() {
    if (this.onRoomsUpdated) {
      this.onRoomsUpdated({
        hostedRooms: this.hostedRooms,
        joinedRooms: this.joinedRooms,
        availableRooms: this.availableRooms
      });
    }
  }

  // Clear all rooms (for cleanup)
  clearAllRooms() {
    this.hostedRooms = [];
    this.joinedRooms = [];
    this.availableRooms = [];
    this.roomId = null;
    this.isHost = false;
    this.notifyRoomsUpdated();
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
  onPlayerTypingFunction(callback) {
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
        this.socket.off('roomsUpdated'); // Remove new listener
      } catch (error) {
        console.error('Error cleaning up event listeners:', error);
      }
    }
  }
}

export default new NetworkService(); 