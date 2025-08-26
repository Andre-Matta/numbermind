import NetInfo from '@react-native-community/netinfo';

class PeerToPeerService {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.peers = new Map();
    this.onPeerFound = null;
    this.onPeerLost = null;
    this.onMessageReceived = null;
    this.discoveryInterval = null;
    this.broadcastInterval = null;
    this.localPort = 8080;
    this.broadcastPort = 8081;
  }

  // Start hosting a game (creates a room and broadcasts availability)
  async startHosting(roomId) {
    try {
      this.isHost = true;
      this.roomId = roomId;
      
      // Get local network info
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type !== 'wifi') {
        throw new Error('WiFi connection required for LAN play');
      }

      // Start broadcasting room availability
      this.startBroadcasting();
      
      console.log(`Started hosting room: ${roomId}`);
      return true;
    } catch (error) {
      console.error('Error starting host:', error);
      throw error;
    }
  }

  // Start broadcasting room availability
  startBroadcasting() {
    this.broadcastInterval = setInterval(() => {
      this.broadcastRoomAvailability();
    }, 2000); // Broadcast every 2 seconds
  }

  // Broadcast room availability to the network
  async broadcastRoomAvailability() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type === 'wifi' && networkInfo.details) {
        const localIP = networkInfo.details.ipAddress;
        const subnet = this.getSubnet(localIP);
        
        // Broadcast to common local subnets
        const commonSubnets = [
          '192.168.1',
          '192.168.0',
          '10.0.0',
          '172.16.0',
          '172.17.0',
          '172.18.0',
          '172.19.0',
          '172.20.0',
          '172.21.0',
          '172.22.0',
          '172.23.0',
          '172.24.0',
          '172.25.0',
          '172.26.0',
          '172.27.0',
          '172.28.0',
          '172.29.0',
          '172.30.0',
          '172.31.0'
        ];

        // Add the actual subnet if it's different
        if (!commonSubnets.includes(subnet)) {
          commonSubnets.push(subnet);
        }

        // Try to broadcast to each subnet
        commonSubnets.forEach(subnet => {
          this.sendBroadcast(subnet);
        });
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }

  // Get subnet from IP address
  getSubnet(ip) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  // Send broadcast message
  async sendBroadcast(subnet) {
    try {
      // Try common ports for discovery
      const ports = [8080, 8081, 3000, 5000];
      const localIP = await this.getLocalIP();
      
      ports.forEach(port => {
        this.sendUDPBroadcast(`${subnet}.255`, port, {
          type: 'room_available',
          roomId: this.roomId,
          hostIP: localIP,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error('Send broadcast error:', error);
    }
  }

  // Start discovering available rooms
  async startDiscovery() {
    try {
      this.discoveryInterval = setInterval(() => {
        this.discoverRooms();
      }, 3000); // Discover every 3 seconds
      
      console.log('Started room discovery');
    } catch (error) {
      console.error('Error starting discovery:', error);
      throw error;
    }
  }

  // Discover available rooms on the network
  async discoverRooms() {
    try {
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type === 'wifi' && networkInfo.details) {
        const localIP = networkInfo.details.ipAddress;
        const subnet = this.getSubnet(localIP);
        
        // Listen for broadcast messages
        this.listenForBroadcasts();
      }
    } catch (error) {
      console.error('Discovery error:', error);
    }
  }

  // Listen for broadcast messages
  listenForBroadcasts() {
    // This would implement UDP listening
    // For now, we'll use a simulated approach
    this.simulatePeerDiscovery();
  }

  // Simulate peer discovery (in real implementation, this would be UDP listening)
  simulatePeerDiscovery() {
    // This simulates finding peers on the network
    // In a real implementation, you'd use UDP sockets to listen for broadcasts
    setTimeout(() => {
      if (this.onPeerFound) {
        this.onPeerFound({
          roomId: 'DEMO123',
          hostIP: '192.168.1.100',
          timestamp: Date.now()
        });
      }
    }, Math.random() * 5000 + 2000); // Random delay between 2-7 seconds
  }

  // Join a room (connect to host)
  async joinRoom(roomId, hostIP) {
    try {
      this.isHost = false;
      this.roomId = roomId;
      
      // Connect to the host
      const connected = await this.connectToHost(hostIP);
      
      if (connected) {
        console.log(`Joined room: ${roomId} on host: ${hostIP}`);
        return true;
      } else {
        throw new Error('Failed to connect to host');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Connect to host
  async connectToHost(hostIP) {
    try {
      // In a real implementation, this would establish a TCP connection
      // For now, we'll simulate the connection
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate connection success/failure
          const success = Math.random() > 0.1; // 90% success rate
          resolve(success);
        }, 1000);
      });
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  // Send message to peers
  async sendMessage(message) {
    try {
      this.peers.forEach((peer, peerId) => {
        this.sendToPeer(peerId, message);
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  // Send message to specific peer
  async sendToPeer(peerId, message) {
    try {
      // In real implementation, this would send via TCP socket
      console.log(`Sending to peer ${peerId}:`, message);
    } catch (error) {
      console.error('Send to peer error:', error);
    }
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

  // Stop all services
  stop() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    
    this.isHost = false;
    this.roomId = null;
    this.peers.clear();
    
    console.log('Peer-to-peer service stopped');
  }

  // Set event handlers
  setOnPeerFound(callback) {
    this.onPeerFound = callback;
  }

  setOnPeerLost(callback) {
    this.onPeerLost = callback;
  }

  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
  }
}

export default new PeerToPeerService(); 