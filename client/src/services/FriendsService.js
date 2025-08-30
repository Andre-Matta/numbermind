import config from '../config/config';
import AuthService from './AuthService';
import NetworkService from './NetworkService';

/**
 * FriendsService - Handles all friend-related API calls and real-time updates
 * Provides both REST API methods and Socket.IO integration for real-time features
 */
class FriendsService {
  constructor() {
    this.friendsCache = [];
    this.pendingRequestsCache = [];
    this.searchCache = new Map();
    this.onlineStatusCache = new Map();
    
    // Event listeners for real-time updates
    this.friendRequestListeners = [];
    this.friendStatusListeners = [];
    this.friendAcceptedListeners = [];
    this.friendRemovedListeners = [];
    
    this.isInitialized = false;
  }

  /**
   * Initialize the service and set up real-time listeners
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Ensure NetworkService is connected
      if (!NetworkService.isConnected()) {
        await NetworkService.connect();
      }
      
      this.setupSocketListeners();
      this.isInitialized = true;
      console.log('FriendsService initialized');
    } catch (error) {
      console.error('Error initializing FriendsService:', error);
    }
  }

  /**
   * Set up Socket.IO listeners for real-time friend updates
   */
  setupSocketListeners() {
    if (!NetworkService.socket) return;

    // Listen for incoming friend requests
    NetworkService.socket.on('friendRequest', (data) => {
      console.log('Received friend request:', data);
      this.friendRequestListeners.forEach(listener => listener(data));
      
      // Add to pending requests cache
      this.pendingRequestsCache.unshift({
        id: Date.now().toString(), // Temporary ID until we refresh from server
        from: data.from,
        createdAt: new Date()
      });
    });

    // Listen for friend request acceptance
    NetworkService.socket.on('friendRequestAccepted', (data) => {
      console.log('Friend request accepted:', data);
      this.friendAcceptedListeners.forEach(listener => listener(data));
      
      // Add to friends cache
      this.friendsCache.unshift({
        id: data.from.id,
        username: data.from.username,
        avatar: data.from.avatar,
        isOnline: true,
        lastActive: new Date()
      });
    });

    // Listen for friend status updates (online/offline)
    NetworkService.socket.on('friendStatusUpdate', (data) => {
      console.log('Friend status update:', data);
      this.friendStatusListeners.forEach(listener => listener(data));
      
      // Update online status cache
      this.onlineStatusCache.set(data.friendId, {
        isOnline: data.isOnline,
        lastActive: new Date(data.lastActive)
      });
      
      // Update friends cache
      const friendIndex = this.friendsCache.findIndex(f => f.id === data.friendId);
      if (friendIndex !== -1) {
        this.friendsCache[friendIndex] = {
          ...this.friendsCache[friendIndex],
          isOnline: data.isOnline,
          lastActive: new Date(data.lastActive)
        };
      }
    });

    // Listen for friend removal
    NetworkService.socket.on('friendRemoved', (data) => {
      console.log('Friend removed:', data);
      this.friendRemovedListeners.forEach(listener => listener(data));
      
      // Remove from friends cache
      this.friendsCache = this.friendsCache.filter(f => f.id !== data.from.id);
    });
  }

  /**
   * Send a friend request to another user
   * @param {string} username - Target user's username
   * @param {string} userId - Target user's ID (optional, used instead of username)
   * @returns {Promise<Object>} Response object
   */
  async sendFriendRequest(username, userId = null) {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const body = userId ? { userId } : { username };

      const response = await fetch(`${config.API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Friend request sent successfully');
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  /**
   * Send friend request via Socket.IO (alternative to REST API)
   * @param {string} username - Target user's username
   * @param {string} userId - Target user's ID (optional)
   * @returns {Promise<Object>} Response object
   */
  async sendFriendRequestSocket(username, userId = null) {
    return new Promise((resolve, reject) => {
      if (!NetworkService.socket || !NetworkService.isConnected()) {
        reject(new Error('Not connected to server'));
        return;
      }

      const data = userId ? { userId } : { username };

      NetworkService.socket.emit('sendFriendRequest', data, (response) => {
        if (response.success) {
          resolve({ success: true, data: response.data });
        } else {
          resolve({ success: false, error: response.error });
        }
      });

      // Set timeout
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);
    });
  }

  /**
   * Respond to a friend request (accept or decline)
   * @param {string} requestId - Friend request ID
   * @param {string} action - 'accept' or 'decline'
   * @returns {Promise<Object>} Response object
   */
  async respondToFriendRequest(requestId, action) {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${config.API_BASE_URL}/friends/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from pending requests cache
        this.pendingRequestsCache = this.pendingRequestsCache.filter(r => r.id !== requestId);
        
        // If accepted, add to friends cache
        if (action === 'accept' && data.data?.newFriend) {
          this.friendsCache.unshift({
            ...data.data.newFriend,
            isOnline: false // Will be updated by real-time status
          });
        }
        
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return { success: false, error: 'Failed to respond to friend request' };
    }
  }

  /**
   * Respond to friend request via Socket.IO
   * @param {string} requestId - Friend request ID
   * @param {string} action - 'accept' or 'decline'
   * @returns {Promise<Object>} Response object
   */
  async respondToFriendRequestSocket(requestId, action) {
    return new Promise((resolve, reject) => {
      if (!NetworkService.socket || !NetworkService.isConnected()) {
        reject(new Error('Not connected to server'));
        return;
      }

      NetworkService.socket.emit('respondToFriendRequest', { requestId, action }, (response) => {
        if (response.success) {
          // Update cache
          this.pendingRequestsCache = this.pendingRequestsCache.filter(r => r.id !== requestId);
          
          if (action === 'accept' && response.data?.newFriend) {
            this.friendsCache.unshift({
              ...response.data.newFriend,
              isOnline: false
            });
          }
          
          resolve({ success: true, data: response.data });
        } else {
          resolve({ success: false, error: response.error });
        }
      });

      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);
    });
  }

  /**
   * Get all pending friend requests
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Response object with requests array
   */
  async getFriendRequests(useCache = false) {
    if (useCache && this.pendingRequestsCache.length > 0) {
      return {
        success: true,
        data: {
          requests: this.pendingRequestsCache,
          count: this.pendingRequestsCache.length
        }
      };
    }

    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${config.API_BASE_URL}/friends/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        this.pendingRequestsCache = data.data.requests;
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return { success: false, error: 'Failed to get friend requests' };
    }
  }

  /**
   * Get friends list with online status
   * @param {Object} options - Query options (page, limit, search, useCache)
   * @returns {Promise<Object>} Response object with friends array
   */
  async getFriends(options = {}) {
    const { page = 1, limit = 20, search = '', useCache = false } = options;

    if (useCache && !search && page === 1 && this.friendsCache.length > 0) {
      return {
        success: true,
        data: {
          friends: this.friendsCache.slice(0, limit),
          totalCount: this.friendsCache.length,
          page: 1,
          totalPages: Math.ceil(this.friendsCache.length / limit),
          hasMore: this.friendsCache.length > limit
        }
      };
    }

    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${config.API_BASE_URL}/friends?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update cache only if it's the first page without search
        if (page === 1 && !search) {
          this.friendsCache = data.data.friends;
        }
        
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error getting friends:', error);
      return { success: false, error: 'Failed to get friends list' };
    }
  }

  /**
   * Remove a friend
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<Object>} Response object
   */
  async removeFriend(friendId) {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${config.API_BASE_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Remove from cache
        this.friendsCache = this.friendsCache.filter(f => f.id !== friendId);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  }

  /**
   * Remove friend via Socket.IO
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<Object>} Response object
   */
  async removeFriendSocket(friendId) {
    return new Promise((resolve, reject) => {
      if (!NetworkService.socket || !NetworkService.isConnected()) {
        reject(new Error('Not connected to server'));
        return;
      }

      NetworkService.socket.emit('removeFriend', { friendId }, (response) => {
        if (response.success) {
          this.friendsCache = this.friendsCache.filter(f => f.id !== friendId);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: response.error });
        }
      });

      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 10000);
    });
  }

  /**
   * Search for users to add as friends
   * @param {string} searchTerm - Search query
   * @param {Object} options - Search options (page, limit)
   * @returns {Promise<Object>} Response object with users array
   */
  async searchUsers(searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    // Check cache first
    const cacheKey = `${searchTerm}-${page}-${limit}`;
    if (this.searchCache.has(cacheKey)) {
      const cachedResult = this.searchCache.get(cacheKey);
      // Return cached result if it's less than 30 seconds old
      if (Date.now() - cachedResult.timestamp < 30000) {
        return { success: true, data: cachedResult.data };
      }
    }

    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        q: searchTerm,
        page: page.toString(),
        limit: limit.toString(),
      });

      const url = `${config.API_BASE_URL}/friends/search?${params}`;
      console.log('FriendsService - Search URL:', url);
      console.log('FriendsService - Search params:', Object.fromEntries(params));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('FriendsService - Search response status:', response.status);
      console.log('FriendsService - Search response ok:', response.ok);

      const data = await response.json();
      console.log('FriendsService - Search response data:', data);

      if (data.success) {
        // Cache the result
        this.searchCache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.searchCache.size > 50) {
          const firstKey = this.searchCache.keys().next().value;
          this.searchCache.delete(firstKey);
        }
        
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: 'Failed to search users' };
    }
  }

  /**
   * Get friend statistics
   * @returns {Promise<Object>} Response object with stats
   */
  async getFriendStats() {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${config.API_BASE_URL}/friends/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error getting friend stats:', error);
      return { success: false, error: 'Failed to get friend statistics' };
    }
  }

  /**
   * Get a friend's online status
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<Object>} Response object with status
   */
  async getFriendStatus(friendId) {
    // Check cache first
    if (this.onlineStatusCache.has(friendId)) {
      const cached = this.onlineStatusCache.get(friendId);
      return {
        success: true,
        data: {
          friendId,
          isOnline: cached.isOnline,
          lastActive: cached.lastActive
        }
      };
    }

    return new Promise((resolve, reject) => {
      if (!NetworkService.socket || !NetworkService.isConnected()) {
        reject(new Error('Not connected to server'));
        return;
      }

      NetworkService.socket.emit('getFriendStatus', { friendId }, (response) => {
        if (response.success) {
          // Cache the status
          this.onlineStatusCache.set(friendId, {
            isOnline: response.data.isOnline,
            lastActive: new Date(response.data.lastActive)
          });
          
          resolve({ success: true, data: response.data });
        } else {
          resolve({ success: false, error: response.error });
        }
      });

      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 5000);
    });
  }

  /**
   * Event listener management
   */
  onFriendRequest(callback) {
    this.friendRequestListeners.push(callback);
    return () => {
      this.friendRequestListeners = this.friendRequestListeners.filter(cb => cb !== callback);
    };
  }

  onFriendStatusUpdate(callback) {
    this.friendStatusListeners.push(callback);
    return () => {
      this.friendStatusListeners = this.friendStatusListeners.filter(cb => cb !== callback);
    };
  }

  onFriendAccepted(callback) {
    this.friendAcceptedListeners.push(callback);
    return () => {
      this.friendAcceptedListeners = this.friendAcceptedListeners.filter(cb => cb !== callback);
    };
  }

  onFriendRemoved(callback) {
    this.friendRemovedListeners.push(callback);
    return () => {
      this.friendRemovedListeners = this.friendRemovedListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.friendsCache = [];
    this.pendingRequestsCache = [];
    this.searchCache.clear();
    this.onlineStatusCache.clear();
  }

  /**
   * Cleanup service and remove listeners
   */
  cleanup() {
    if (NetworkService.socket) {
      NetworkService.socket.off('friendRequest');
      NetworkService.socket.off('friendRequestAccepted');
      NetworkService.socket.off('friendStatusUpdate');
      NetworkService.socket.off('friendRemoved');
    }
    
    this.friendRequestListeners = [];
    this.friendStatusListeners = [];
    this.friendAcceptedListeners = [];
    this.friendRemovedListeners = [];
    
    this.clearCache();
    this.isInitialized = false;
  }
}

export default new FriendsService();
