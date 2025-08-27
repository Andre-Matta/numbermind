import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

class LANDiscoveryService {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.localIP = null;
    this.connectedPeers = new Set();
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onMessageReceived = null;
  }

  // Generate a unique room ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Start hosting a game
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

      this.roomId = roomId || this.generateRoomId();
      this.isHost = true;

      console.log(`Started hosting room: ${this.roomId} on ${this.localIP}`);
      
      return {
        roomId: this.roomId,
        localIP: this.localIP,
        connectionInfo: this.getConnectionInfo()
      };
    } catch (error) {
      console.error('Error starting host:', error);
      throw error;
    }
  }

  // Get connection information for sharing
  getConnectionInfo() {
    if (!this.isHost || !this.roomId || !this.localIP) {
      return null;
    }

    return {
      roomId: this.roomId,
      hostIP: this.localIP,
      port: 8080,
      timestamp: Date.now()
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

  // Join a room using connection info
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

      this.roomId = connectionInfo.roomId;
      this.isHost = false;

      // Simulate connection to host
      const connected = await this.connectToHost(connectionInfo.hostIP);
      
      if (connected) {
        console.log(`Joined room: ${this.roomId} on host: ${connectionInfo.hostIP}`);
        return true;
      } else {
        throw new Error('Failed to connect to host');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Simulate connection to host
  async connectToHost(hostIP) {
    return new Promise((resolve) => {
      // Simulate network connection delay
      setTimeout(() => {
        // 95% success rate for demo purposes
        const success = Math.random() > 0.05;
        resolve(success);
      }, 1500);
    });
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
        ssid: networkInfo.details?.ssid || null
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return {
        type: 'unknown',
        isConnected: false,
        isWifi: false,
        localIP: null,
        ssid: null
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

  // Discover available rooms on the network
  async discoverRooms() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        return [];
      }

      // For now, return simulated rooms for testing
      // In a real implementation, this would scan the network for available rooms
      return [
        {
          roomId: 'DEMO123',
          hostIP: '192.168.1.100',
          timestamp: Date.now()
        }
      ];
    } catch (error) {
      console.error('Error discovering rooms:', error);
      return [];
    }
  }

  // Send game message
  async sendGameMessage(message) {
    try {
      if (this.connectedPeers.size === 0) {
        console.log('No peers connected to send message to');
        return false;
      }

      // Simulate sending message to all connected peers
      this.connectedPeers.forEach(peerId => {
        console.log(`Sending message to peer ${peerId}:`, message);
      });

      return true;
    } catch (error) {
      console.error('Error sending game message:', error);
      return false;
    }
  }

  // Simulate peer connection (for demo purposes)
  simulatePeerConnection() {
    if (this.isHost) {
      setTimeout(() => {
        const peerId = `peer_${Date.now()}`;
        this.connectedPeers.add(peerId);
        
        if (this.onPeerConnected) {
          this.onPeerConnected(peerId);
        }
        
        console.log(`Peer connected: ${peerId}`);
      }, 2000);
    }
  }

  // Disconnect from current room
  disconnect() {
    this.connectedPeers.clear();
    this.roomId = null;
    this.isHost = false;
    console.log('Disconnected from room');
  }

  // Get current status
  getStatus() {
    return {
      isHost: this.isHost,
      roomId: this.roomId,
      localIP: this.localIP,
      connectedPeers: this.connectedPeers.size,
      isConnected: this.roomId !== null
    };
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

  // Test method for debugging
  async testLANFunctionality() {
    try {
      console.log('Testing LAN functionality...');
      
      // Test network status
      const networkStatus = await this.getNetworkStatus();
      console.log('Network status:', networkStatus);
      
      if (!networkStatus.isWifi) {
        console.log('WiFi not available for LAN testing');
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
      
      // Clean up
      this.disconnect();
      
      return { 
        success: true, 
        roomId, 
        connectionInfo,
        networkStatus 
      };
    } catch (error) {
      console.error('LAN test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new LANDiscoveryService(); 