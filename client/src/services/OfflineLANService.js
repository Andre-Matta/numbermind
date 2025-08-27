import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

class OfflineLANService {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.localIP = null;
    this.isConnected = false;
    this.connectedPeers = new Set();
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onMessageReceived = null;
    this.onRoomDiscovered = null;
    this.discoveryInterval = null;
    this.broadcastInterval = null;
    this.port = 8080;
    this.rooms = new Map(); // Store discovered rooms
  }

  // Generate a unique room ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Start hosting a game (no internet required)
  async startHosting(roomId = null) {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        throw new Error('WiFi connection required for LAN play');
      }

      this.localIP = networkInfo.details?.ipAddress;
      if (!this.localIP) {
        throw new Error('Could not determine local IP address');
      }

      // If already hosting a room, stop hosting it first
      if (this.isHost && this.roomId) {
        console.log(`Stopping previous room ${this.roomId} to start new one`);
        this.stopHosting();
      }

      this.roomId = roomId || this.generateRoomId();
      this.isHost = true;
      this.isConnected = true;

      // Start broadcasting room availability
      this.startBroadcasting();
      
      console.log(`Started hosting offline room: ${this.roomId} on ${this.localIP}`);
      
      return {
        roomId: this.roomId,
        localIP: this.localIP,
        connectionInfo: this.getConnectionInfo()
      };
    } catch (error) {
      console.error('Error starting offline host:', error);
      throw error;
    }
  }

  // Start broadcasting room availability to local network
  startBroadcasting() {
    if (!this.isHost || !this.roomId || !this.localIP) return;

    // Broadcast room info every 2 seconds
    this.broadcastInterval = setInterval(() => {
      this.broadcastRoomInfo();
    }, 2000);

    console.log('Started broadcasting room availability');
  }

  // Broadcast room information to local network
  broadcastRoomInfo() {
    if (!this.isHost || !this.roomId || !this.localIP) return;

    const roomInfo = {
      roomId: this.roomId,
      hostIP: this.localIP,
      port: this.port,
      timestamp: Date.now(),
      type: 'room_broadcast'
    };

    // In a real implementation, this would use UDP broadcast or mDNS
    // For now, we'll simulate it by storing the room info locally
    console.log('Broadcasting room info:', roomInfo);
  }

  // Start discovering rooms on the local network
  startDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    // Don't clear rooms when starting discovery - keep existing rooms
    // This preserves host rooms that are still active

    // Discover rooms every 3 seconds
    this.discoveryInterval = setInterval(async () => {
      await this.discoverRooms();
    }, 3000);

    console.log('Started room discovery');
  }

  // Stop room discovery
  stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    
    // Clear discovered rooms when stopping discovery
    this.rooms.clear();
    
    console.log('Stopped room discovery');
  }

  // Discover available rooms on the local network
  async discoverRooms() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        return [];
      }

      // Only simulate room discovery if we're actively discovering
      // This prevents creating mock rooms during initialization
      if (!this.discoveryInterval) {
        return [];
      }

      // In a real implementation, this would scan for UDP broadcasts or mDNS services
      // For now, we'll only return rooms that are actually being hosted
      const discoveredRooms = [];
      
      // If we're hosting a room, include it in discovery results
      if (this.isHost && this.roomId && this.localIP) {
        discoveredRooms.push({
          roomId: this.roomId,
          hostIP: this.localIP,
          port: this.port,
          timestamp: Date.now(),
          type: 'hosted_room'
        });
      }
      
      // In a real implementation, you would also scan the network for other hosted rooms
      // For now, we'll just return the room we're hosting (if any)
      
      // Update discovered rooms
      discoveredRooms.forEach(room => {
        this.rooms.set(room.roomId, room);
      });

      // Notify about new rooms
      if (this.onRoomDiscovered) {
        this.onRoomDiscovered(Array.from(this.rooms.values()));
      }

      return Array.from(this.rooms.values());
    } catch (error) {
      console.error('Error discovering rooms:', error);
      return [];
    }
  }

  // Simulate room discovery (replace with real network scanning)
  simulateRoomDiscovery() {
    // This simulates finding rooms on the local network
    // In reality, you'd implement UDP broadcast listening or mDNS discovery
    const mockRooms = [];
    
    // Simulate finding 1-3 rooms on the network
    const roomCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < roomCount; i++) {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostIP = this.generateMockIP();
      
      mockRooms.push({
        roomId,
        hostIP,
        port: this.port,
        timestamp: Date.now() - Math.random() * 10000, // Random timestamp
        type: 'discovered_room'
      });
    }

    return mockRooms;
  }

  // Generate a mock IP address for testing
  generateMockIP() {
    const segments = [];
    segments.push(192);
    segments.push(168);
    segments.push(1);
    segments.push(Math.floor(Math.random() * 254) + 1);
    return segments.join('.');
  }

  // Join a room using connection info (no internet required)
  async joinRoom(connectionInfo) {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        throw new Error('WiFi connection required for LAN play');
      }

      this.localIP = networkInfo.details?.ipAddress;
      if (!this.localIP) {
        throw new Error('Could not determine local IP address');
      }

      // Prevent self-joining (joining your own hosted room)
      if (this.isHost && this.roomId === connectionInfo.roomId) {
        throw new Error('Cannot join your own hosted room');
      }

      // Check if devices are on the same network
      const sameNetwork = await this.areDevicesOnSameNetwork(connectionInfo.hostIP);
      if (!sameNetwork) {
        throw new Error('Devices must be on the same WiFi network');
      }

      this.roomId = connectionInfo.roomId;
      this.isHost = false;

      // Connect to host (simulated for now)
      const connected = await this.connectToHost(connectionInfo.hostIP);
      
      if (connected) {
        console.log(`Joined offline room: ${this.roomId} on host: ${connectionInfo.hostIP}`);
        // Mark as connected immediately when joining
        this.isConnected = true;
        return true;
      } else {
        throw new Error('Failed to connect to host');
      }
    } catch (error) {
      console.error('Error joining offline room:', error);
      throw error;
    }
  }

  // Connect to host (simulated peer-to-peer connection)
  async connectToHost(hostIP) {
    return new Promise((resolve) => {
      // Simulate network connection delay
      setTimeout(() => {
        // 90% success rate for demo purposes
        const success = Math.random() > 0.1;
        
        if (success) {
          // Simulate peer connection
          this.simulatePeerConnection();
        }
        
        resolve(success);
      }, 1500);
    });
  }

  // Get connection information for sharing
  getConnectionInfo() {
    if (!this.isHost || !this.roomId || !this.localIP) {
      return null;
    }

    return {
      roomId: this.roomId,
      hostIP: this.localIP,
      port: this.port,
      timestamp: Date.now(),
      type: 'offline_lan'
    };
  }

  // Get local IP address
  async getLocalIP() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type === 'wifi' && networkInfo.details) {
        return networkInfo.details.ipAddress;
      }
      return null;
    } catch (error) {
      console.error('Error getting local IP:', error);
      return null;
    }
  }

  // Get network status
  async getNetworkStatus() {
    try {
      const networkInfo = await NetInfo.fetch();
      return {
        type: networkInfo.type,
        isConnected: networkInfo.isConnected,
        isWifi: networkInfo.type === 'wifi',
        localIP: networkInfo.details?.ipAddress || null,
        ssid: networkInfo.details?.ssid || null,
        isOfflineLAN: true // Indicates this is offline LAN mode
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return {
        type: 'unknown',
        isConnected: false,
        isWifi: false,
        localIP: null,
        ssid: null,
        isOfflineLAN: false
      };
    }
  }

  // Check if devices are on same network
  async areDevicesOnSameNetwork(hostIP) {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi' || !networkInfo.details?.ipAddress) {
        return false;
      }

      const localIP = networkInfo.details.ipAddress;
      const localSubnet = this.getSubnet(localIP);
      const hostSubnet = this.getSubnet(hostIP);

      return localSubnet === hostSubnet;
    } catch (error) {
      console.error('Error checking network compatibility:', error);
      return false;
    }
  }

  // Get subnet from IP address
  getSubnet(ip) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  // Send game message to connected peers
  async sendGameMessage(message) {
    try {
      if (this.connectedPeers.size === 0) {
        console.log('No peers connected to send message to');
        return false;
      }

      // Simulate sending message to all connected peers
      this.connectedPeers.forEach(peerId => {
        console.log(`Sending offline message to peer ${peerId}:`, message);
      });

      return true;
    } catch (error) {
      console.error('Error sending offline game message:', error);
      return false;
    }
  }

  // Simulate peer connection (for demo purposes)
  simulatePeerConnection() {
    if (!this.isHost) {
      // Only simulate peer connection for clients joining a room
      setTimeout(() => {
        const peerId = `peer_${Date.now()}`;
        this.connectedPeers.add(peerId);
        
        if (this.onPeerConnected) {
          this.onPeerConnected(peerId);
        }
        
        console.log(`Peer connected to offline room: ${peerId}`);
      }, 2000);
    } else {
      // For hosts, simulate a client joining after a delay
      setTimeout(() => {
        const peerId = `peer_${Date.now()}`;
        this.connectedPeers.add(peerId);
        
        if (this.onPeerConnected) {
          this.onPeerConnected(peerId);
        }
        
        console.log(`Client joined host room: ${peerId}`);
      }, 3000); // Slightly longer delay for host to simulate client joining
    }
  }

  // Disconnect from current room
  disconnect() {
    // Stop broadcasting if host
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    // Stop discovery if client
    this.stopDiscovery();

    // Clear peers but keep room info for reconnection
    this.connectedPeers.clear();
    
    // Only clear room info if explicitly disconnecting
    this.roomId = null;
    this.isHost = false;
    this.isConnected = false;
    console.log('Disconnected from offline room');
  }

  // End game and optionally clear the room
  endGame(clearRoom = false) {
    // Clear all connected peers
    this.connectedPeers.clear();
    
    if (clearRoom) {
      // Clear room info and stop hosting
      if (this.isHost) {
        this.stopHosting();
      }
      this.roomId = null;
      this.isHost = false;
      this.isConnected = false;
      console.log('Game ended and room cleared');
    } else {
      // Keep room info but mark as not connected
      this.isConnected = false;
      console.log('Game ended, room preserved for reconnection');
    }
  }

  // Get current status
  getStatus() {
    return {
      isHost: this.isHost,
      roomId: this.roomId,
      localIP: this.localIP,
      connectedPeers: this.connectedPeers.size,
      isConnected: this.isConnected,
      isOfflineLAN: true
    };
  }

  // Get discovered rooms without clearing them
  getDiscoveredRooms() {
    return Array.from(this.rooms.values());
  }

  // Check if a room is still active and can be rejoined
  isRoomActive(roomId) {
    // If we're hosting this room, it's always active
    if (this.isHost && this.roomId === roomId) {
      return true;
    }
    
    // Check if the room exists in our discovered rooms
    return this.rooms.has(roomId);
  }

  // Reconnect to a previously joined room
  async reconnectToRoom(roomId) {
    if (!this.isRoomActive(roomId)) {
      throw new Error('Room is no longer active');
    }
    
    // If we were hosting this room, restore hosting state
    if (this.rooms.has(roomId)) {
      const roomInfo = this.rooms.get(roomId);
      this.roomId = roomInfo.roomId;
      this.localIP = roomInfo.hostIP;
      this.isHost = false; // We're rejoining as a client
      this.isConnected = true;
      
      console.log(`Reconnected to room: ${roomId}`);
      return true;
    }
    
    throw new Error('Room not found');
  }

  // Restore connection state when returning from game screen
  restoreConnection() {
    if (this.roomId && this.isConnected) {
      console.log(`Restoring connection to room: ${this.roomId}`);
      
      // If we were hosting, restart broadcasting
      if (this.isHost) {
        this.startBroadcasting();
      }
      
      // If we were a client, we're already connected
      return true;
    }
    return false;
  }

  // Set event handlers
  setOnPeerConnected(callback) {
    this.onPeerConnected = callback;
  }

  setOnPeerDisconnected(callback) {
    this.onPeerDisconnected = callback;
  }

  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
  }

  setOnRoomDiscovered(callback) {
    this.onRoomDiscovered = callback;
  }

  // Clear all discovered rooms (but preserve host room)
  clearRooms() {
    // Don't clear the room we're currently hosting
    if (this.isHost && this.roomId) {
      console.log(`Preserving host room ${this.roomId} while clearing discovered rooms`);
      // Keep only the host room
      const hostRoom = {
        roomId: this.roomId,
        hostIP: this.localIP,
        port: this.port,
        timestamp: Date.now(),
        type: 'hosted_room'
      };
      this.rooms.clear();
      this.rooms.set(this.roomId, hostRoom);
    } else {
      this.rooms.clear();
    }
    
    if (this.onRoomDiscovered) {
      this.onRoomDiscovered(Array.from(this.rooms.values()));
    }
    console.log('Cleared discovered rooms (host room preserved)');
  }

  // Delete a specific room
  deleteRoom(roomId) {
    if (this.rooms.has(roomId)) {
      // If this is the room we're hosting, ask for confirmation
      if (this.isHost && this.roomId === roomId) {
        console.log(`Attempting to delete host room ${roomId} - this will stop hosting`);
        // Stop hosting this room
        this.stopHosting();
      }
      
      this.rooms.delete(roomId);
      
      // Notify about updated rooms
      if (this.onRoomDiscovered) {
        this.onRoomDiscovered(Array.from(this.rooms.values()));
      }
      
      console.log(`Deleted room: ${roomId}`);
      return true;
    }
    return false;
  }

  // Stop hosting the current room
  stopHosting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    
    this.isHost = false;
    this.roomId = null;
    this.localIP = null;
    
    console.log('Stopped hosting room');
  }

  // Test method for debugging offline LAN functionality
  async testOfflineLANFunctionality() {
    try {
      console.log('Testing offline LAN functionality...');
      
      // Test network status
      const networkStatus = await this.getNetworkStatus();
      console.log('Network status:', networkStatus);
      
      if (!networkStatus.isWifi) {
        console.log('WiFi not available for offline LAN testing');
        return { success: false, message: 'WiFi not available' };
      }
      
      // Test room creation
      const roomId = this.generateRoomId();
      console.log('Generated room ID:', roomId);
      
      // Test hosting
      const hostResult = await this.startHosting(roomId);
      console.log('Host result:', hostResult);
      
      // Test connection info
      const connectionInfo = this.getConnectionInfo();
      console.log('Connection info:', connectionInfo);
      
      // Test room discovery
      this.startDiscovery();
      setTimeout(async () => {
        const discoveredRooms = await this.discoverRooms();
        console.log('Discovered rooms:', discoveredRooms);
      }, 1000);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        this.disconnect();
      }, 5000);
      
      return { 
        success: true, 
        roomId, 
        connectionInfo,
        networkStatus,
        message: 'Offline LAN test completed successfully'
      };
    } catch (error) {
      console.error('Offline LAN test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfflineLANService();
