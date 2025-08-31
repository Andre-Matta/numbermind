// Simple HTTP-based room discovery service
// This uses HTTP requests to discover rooms across devices on the same network
import NetInfo from '@react-native-community/netinfo';

class HTTPRoomDiscovery {
  constructor() {
    this.rooms = new Map();
    this.localIP = null;
    this.deviceId = null;
    this.isInitialized = false;
    this.port = 8080;
    this.discoveryTimeout = 5000; // 5 seconds timeout for discovery
  }

  // Initialize the service
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

      this.deviceId = `${this.localIP}_${Date.now()}`;
      this.isInitialized = true;
      
      console.log(`🔧 HTTP Room Discovery initialized on ${this.localIP}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize HTTP Room Discovery:', error);
      return false;
    }
  }

  // Register a room
  async registerRoom(roomInfo) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const roomData = {
        ...roomInfo,
        deviceId: this.deviceId,
        timestamp: Date.now(),
        lastSeen: Date.now()
      };
      
      this.rooms.set(roomInfo.roomId, roomData);
      
      console.log(`📝 Registered room: ${roomInfo.roomId} from ${roomInfo.hostIP} (device: ${this.deviceId})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to register room:', error);
      return false;
    }
  }

  // Discover rooms by scanning network
  async discoverRooms() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Scanning network for rooms...`);

      // Get network prefix for scanning
      const ipParts = this.localIP.split('.');
      const networkPrefix = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
      
      const discoveredRooms = [];
      
      // Scan common IP addresses in the network
      const scanPromises = [];
      
      // Scan IPs 1-254 in the network
      for (let i = 1; i <= 254; i++) {
        const targetIP = `${networkPrefix}.${i}`;
        
        // Skip our own IP
        if (targetIP === this.localIP) continue;
        
        // Add scan promise
        scanPromises.push(this.scanIP(targetIP));
      }
      
      // Wait for all scans to complete with timeout
      const results = await Promise.allSettled(scanPromises);
      
      // Collect discovered rooms
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          discoveredRooms.push(result.value);
        }
      });

      console.log(`✅ HTTP scan completed: Found ${discoveredRooms.length} room(s)`);
      return discoveredRooms;
    } catch (error) {
      console.error('❌ HTTP room discovery failed:', error);
      return [];
    }
  }

  // Scan a specific IP for rooms
  async scanIP(ip) {
    try {
      const url = `http://${ip}:${this.port}/rooms`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.discoveryTimeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.rooms && Array.isArray(data.rooms)) {
          return data.rooms.filter(room => 
            room.deviceId !== this.deviceId && 
            (Date.now() - room.timestamp) < 30000
          );
        }
      }
      
      return null;
    } catch (error) {
      // Ignore errors for individual IP scans
      return null;
    }
  }

  // Remove a room
  async removeRoom(roomId) {
    try {
      if (this.rooms.has(roomId)) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Removed room: ${roomId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to remove room:', error);
      return false;
    }
  }

  // Get all rooms (including our own for debugging)
  async getAllRooms() {
    try {
      const currentTime = Date.now();
      const validRooms = [];
      
      this.rooms.forEach((room, roomId) => {
        if ((currentTime - room.timestamp) < 30000) {
          validRooms.push(room);
        }
      });
      
      return validRooms;
    } catch (error) {
      console.error('❌ Failed to get all rooms:', error);
      return [];
    }
  }

  // Clear all rooms
  async clearAllRooms() {
    try {
      this.rooms.clear();
      console.log('🗑️ Cleared all rooms from HTTP discovery service');
    } catch (error) {
      console.error('❌ Failed to clear rooms:', error);
    }
  }

  // Stop the service
  stop() {
    this.isInitialized = false;
    console.log('🛑 HTTP Room Discovery service stopped');
  }

  // Get service status
  getStatus() {
    return {
      deviceId: this.deviceId,
      localIP: this.localIP,
      totalRooms: this.rooms.size,
      isInitialized: this.isInitialized
    };
  }
}

// Create a global instance
const httpRoomDiscovery = new HTTPRoomDiscovery();

export default httpRoomDiscovery;
