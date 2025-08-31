import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import HTTPRoomDiscovery from './HTTPRoomDiscovery';

class RealLANDiscovery {
  constructor() {
    this.isListening = false;
    this.discoveredRooms = new Map();
    this.onRoomDiscovered = null;
    this.broadcastInterval = null;
    this.listenInterval = null;
    this.localIP = null;
    this.networkPrefix = null;
    this.hostedRooms = new Map(); // Store rooms we're hosting
  }

  // Initialize the discovery service
  async initialize() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        throw new Error('WiFi connection required');
      }

      this.localIP = networkInfo.details?.ipAddress;
      if (!this.localIP) {
        throw new Error('Could not determine local IP');
      }

      // Parse network range for scanning
      const ipParts = this.localIP.split('.');
      this.networkPrefix = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
      
      // Initialize HTTP room discovery service
      await HTTPRoomDiscovery.initialize();
      
      this.isListening = true;
      console.log(`🔧 LAN Discovery initialized on ${this.localIP} (${this.networkPrefix}.0/24)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize LAN discovery:', error);
      return false;
    }
  }

  // Start broadcasting room availability
  async startBroadcasting(roomInfo) {
    try {
      if (!this.isListening) {
        await this.initialize();
      }

      // Store the room info locally so other devices can discover it
      this.hostedRooms.set(roomInfo.roomId, {
        ...roomInfo,
        timestamp: Date.now(),
        type: 'hosted_room'
      });

      // Register with HTTP room discovery service
      await HTTPRoomDiscovery.registerRoom(roomInfo);

      // Broadcast every 2 seconds
      this.broadcastInterval = setInterval(async () => {
        await this.broadcastRoom(roomInfo);
      }, 2000);

      console.log(`📡 Started broadcasting room: ${roomInfo.roomId} on ${roomInfo.hostIP}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start broadcasting:', error);
      return false;
    }
  }

  // Broadcast room information
  async broadcastRoom(roomInfo) {
    // Store the room locally and make it discoverable
    this.hostedRooms.set(roomInfo.roomId, {
      ...roomInfo,
      timestamp: Date.now(),
      type: 'hosted_room'
    });

    // Update HTTP room discovery service
    await HTTPRoomDiscovery.registerRoom(roomInfo);
    
    console.log(`📡 Broadcasting: ${roomInfo.roomId} -> ${roomInfo.hostIP}`);
  }

  // Start listening for room advertisements
  async startListening() {
    try {
      if (!this.isListening) {
        await this.initialize();
      }

      console.log('👂 Started listening for room advertisements...');
      
      // Don't start continuous listening - only scan when requested
      return true;
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      return false;
    }
  }

  // Listen for room broadcasts
  listenForBroadcasts() {
    // This method is no longer used for continuous listening
    // Rooms are now discovered only when scanNetwork() is called
    console.log('👂 Manual room discovery triggered');
  }

  // Scan network for active rooms
  async scanNetwork() {
    try {
      if (!this.isListening) {
        await this.initialize();
      }

      console.log(`🔍 Scanning network: ${this.networkPrefix}.1-254`);

      // Get rooms from HTTP room discovery service
      const allRooms = await HTTPRoomDiscovery.discoverRooms();
      const discoveredRooms = [];

      allRooms.forEach(room => {
        // Only include rooms that are not our own
        if (room.hostIP !== this.localIP) {
          discoveredRooms.push(room);
        }
      });

      console.log(`✅ Network scan completed: Found ${discoveredRooms.length} room(s)`);
      return discoveredRooms;
    } catch (error) {
      console.error('❌ Network scan failed:', error);
      return [];
    }
  }

  // Stop broadcasting and listening
  stop() {
    try {
      this.isListening = false;
      
      if (this.broadcastInterval) {
        clearInterval(this.broadcastInterval);
        this.broadcastInterval = null;
      }
      
      // Clear any existing listen interval (though it shouldn't exist anymore)
      if (this.listenInterval) {
        clearInterval(this.listenInterval);
        this.listenInterval = null;
      }
      
      // Stop the HTTP room discovery service
      HTTPRoomDiscovery.stop();
      
      console.log('🛑 Stopped LAN discovery service');
    } catch (error) {
      console.error('❌ Error stopping LAN discovery:', error);
    }
  }

  // Get discovered rooms
  getDiscoveredRooms() {
    const currentTime = Date.now();
    const validRooms = [];

    this.hostedRooms.forEach((room, roomId) => {
      // Only return rooms that are recent (within 30 seconds)
      if ((currentTime - room.timestamp) < 30000) {
        validRooms.push(room);
      }
    });

    return validRooms;
  }

  // Clear discovered rooms
  clearDiscoveredRooms() {
    this.hostedRooms.clear();
  }

  // Set callback for room discovery
  setOnRoomDiscovered(callback) {
    this.onRoomDiscovered = callback;
  }

  // Test network connectivity
  async testNetworkConnectivity() {
    try {
      const networkInfo = await NetInfo.fetch();
      
      if (networkInfo.type !== 'wifi') {
        return {
          success: false,
          message: 'WiFi connection required for LAN discovery'
        };
      }

      const localIP = networkInfo.details?.ipAddress;
      if (!localIP) {
        return {
          success: false,
          message: 'Could not determine local IP address'
        };
      }

      return {
        success: true,
        localIP,
        networkType: networkInfo.type,
        ssid: networkInfo.details?.ssid || 'Unknown'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      const networkInfo = await NetInfo.fetch();
      return {
        type: networkInfo.type,
        isConnected: networkInfo.isConnected,
        isWifi: networkInfo.type === 'wifi',
        localIP: networkInfo.details?.ipAddress || null,
        ssid: networkInfo.details?.ssid || null,
        gateway: networkInfo.details?.gateway || null,
        subnet: networkInfo.details?.subnet || null
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        type: 'unknown',
        isConnected: false,
        isWifi: false,
        localIP: null,
        ssid: null,
        gateway: null,
        subnet: null
      };
    }
  }
}

export default new RealLANDiscovery();
