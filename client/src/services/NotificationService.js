import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import config from '../config/config';
import firebaseConfig from '../config/firebase';
import messaging from '@react-native-firebase/messaging';

class FirebaseNotificationService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.tokenRefreshInterval = null;
    this.notificationListeners = [];
  }

  // Initialize Firebase notification service
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🔥 Initializing Firebase notification service...');

      // Request notification permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      // Get FCM token
      await this.getFcmToken();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Set up background message handler
      this.setupBackgroundHandler();

      // Set up token refresh
      this.setupTokenRefresh();

      this.isInitialized = true;
      console.log('✅ Firebase notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase notifications:', error);
      return this.initializeFallback();
    }
  }

  // Fallback initialization for when Firebase is not available
  async initializeFallback() {
    try {
      console.log('🔄 Initializing fallback notification system...');
      
      // Request basic permissions
      const hasPermission = await this.requestBasicPermissions();
      if (!hasPermission) {
        console.log('❌ Basic notification permissions not granted');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ Fallback notification system initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize fallback notifications:', error);
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
      } else {
        // Android permissions are handled by the app manifest
        return true;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Request basic permissions (fallback)
  async requestBasicPermissions() {
    try {
      // For now, just return true as basic permissions
      // In a real implementation, you might use a different notification library
      return true;
    } catch (error) {
      console.error('Error requesting basic permissions:', error);
      return false;
    }
  }

  // Get FCM token
  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Save token to storage
      await AsyncStorage.setItem('fcmToken', token);
      console.log('✅ FCM token obtained:', token);
      
      return token;
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      return null;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    try {
      // Listen for token refresh
      const tokenRefreshListener = messaging().onTokenRefresh(() => {
        this.handleTokenRefresh();
      });

      // Listen for foreground messages
      const foregroundListener = messaging().onMessage((message) => {
        this.handleForegroundMessage(message);
      });

      // Listen for background/quit state messages
      messaging().setBackgroundMessageHandler((message) => {
        this.handleBackgroundMessage(message);
      });

      this.notificationListeners.push(tokenRefreshListener, foregroundListener);
      console.log('✅ Notification listeners set up');
    } catch (error) {
      console.error('❌ Failed to set up notification listeners:', error);
    }
  }

  // Set up token refresh interval
  setupTokenRefresh() {
    // Refresh token every 24 hours
    this.tokenRefreshInterval = setInterval(async () => {
      await this.refreshToken();
    }, 24 * 60 * 60 * 1000);
  }

  // Handle token refresh
  async handleTokenRefresh() {
    try {
      console.log('🔄 FCM token refreshed');
      await this.getFcmToken();
      await this.registerTokenWithServer();
    } catch (error) {
      console.error('❌ Error handling token refresh:', error);
    }
  }

  // Refresh token manually
  async refreshToken() {
    try {
      await messaging().deleteToken();
      await this.getFcmToken();
      await this.registerTokenWithServer();
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
    }
  }

  // Handle foreground messages
  handleForegroundMessage(message) {
    console.log('📱 Foreground message received:', message);
    
    const { title, body, data } = message.notification;
    
    // Show local notification
    this.showLocalNotification(title, body, data);
    
    // Handle message based on type
    this.handleMessageByType(data);
  }

  // Handle background messages
  handleBackgroundMessage(message) {
    console.log('📱 Background message received:', message);
    
    const { title, body, data } = message.notification;
    
    // Handle message based on type
    this.handleMessageByType(data);
  }

  // Set up background message handler (call this in your app's entry point)
  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📱 Background message received:', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });
  }

  // Handle message based on type
  handleMessageByType(data) {
    const type = data?.type;
    
    switch (type) {
      case 'game_invite':
        this.handleGameInvite(data);
        break;
      case 'match_found':
        this.handleMatchFound(data);
        break;
      case 'friend_request':
        this.handleFriendRequest(data);
        break;
      case 'your_turn':
        this.handleYourTurn(data);
        break;
      case 'game_result':
        this.handleGameResult(data);
        break;
      case 'achievement':
        this.handleAchievement(data);
        break;
      case 'connection_status':
        this.handleConnectionStatus(data);
        break;
      default:
        console.log('📱 Unknown notification type:', type);
    }
  }

  // Show local notification
  showLocalNotification(title, body, data = {}) {
    try {
      // For now, just log the notification
      // In a real implementation, you would use a notification library
      console.log('🔔 Local notification:', { title, body, data });
      
      // You could integrate with react-native-push-notification or similar
      // PushNotification.localNotification({
      //   title,
      //   message: body,
      //   data
      // });
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  }

  // Game-specific message handlers
  handleGameInvite(data) {
    console.log('🎮 Game invite received:', data);
    // Navigate to game invite screen or show modal
  }

  handleMatchFound(data) {
    console.log('🎯 Match found:', data);
    // Navigate to game screen
  }

  handleFriendRequest(data) {
    console.log('👥 Friend request received:', data);
    // Navigate to friend requests screen
  }

  handleYourTurn(data) {
    console.log('🎲 Your turn notification:', data);
    // Navigate to game screen
  }

  handleGameResult(data) {
    console.log('🏆 Game result:', data);
    // Show game result modal
  }

  handleAchievement(data) {
    console.log('🏅 Achievement unlocked:', data);
    // Show achievement modal
  }

  handleConnectionStatus(data) {
    console.log('🌐 Connection status:', data);
    // Update connection status in app
  }

  // Register FCM token with server
  async registerTokenWithServer() {
    try {
      const token = await this.getFcmToken();
      if (!token) {
        console.log('⚠️ No FCM token available for server registration');
        return false;
      }

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('⚠️ No auth token available for server registration');
        return false;
      }

      const requestBody = {
        fcmToken: token,
        platform: Platform.OS,
        deviceId: await this.getDeviceId(),
      };

      console.log('📤 Sending FCM registration request:', {
        url: `${config.API_BASE_URL}/notifications/register`,
        body: requestBody,
        authToken: authToken ? 'Present' : 'Missing'
      });

      const response = await fetch(`${config.API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ FCM token registered with server:', result);
      return true;
    } catch (error) {
      console.error('❌ Failed to register FCM token with server:', error);
      return false;
    }
  }

  // Get device ID
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `device_${Date.now()}`;
    }
  }

  // Send notification to server
  async sendNotificationToServer(userId, title, body, type, data = {}) {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('⚠️ No auth token available for server notification');
        return false;
      }

      const response = await fetch(`${config.API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          type,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Notification sent to server:', result);
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification to server:', error);
      return false;
    }
  }

  // Game-specific notification methods
  async notifyMatchFound(opponentName, gameId, userId = null) {
    const title = 'Match Found! 🎯';
    const body = `You've been matched with ${opponentName}. Tap to join the game!`;
    const data = { gameId, opponentName };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'match_found', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'match_found' });
    }
  }

  async notifyGameInvite(inviterName, roomId, userId = null) {
    const title = 'Game Invite 🎮';
    const body = `${inviterName} invited you to play NumberMind!`;
    const data = { roomId, inviterName };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'game_invite', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'game_invite' });
    }
  }

  async notifyFriendRequest(requesterName, userId = null) {
    const title = 'Friend Request 👥';
    const body = `${requesterName} wants to be your friend!`;
    const data = { requesterName };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'friend_request', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'friend_request' });
    }
  }

  async notifyYourTurn(gameId, userId = null) {
    const title = 'Your Turn! 🎲';
    const body = 'It\'s your turn to make a guess!';
    const data = { gameId };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'your_turn', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'your_turn' });
    }
  }

  async notifyGameResult(won, opponentName, score, userId = null) {
    const title = won ? 'Victory! 🏆' : 'Game Over 💔';
    const body = won 
      ? `Congratulations! You beat ${opponentName} with ${score} points!`
      : `Better luck next time! ${opponentName} won with ${score} points.`;
    const data = { won, opponentName, score };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'game_result', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'game_result' });
    }
  }

  async notifyAchievement(achievementName, description, userId = null) {
    const title = 'Achievement Unlocked! 🏅';
    const body = `${achievementName}: ${description}`;
    const data = { achievementName, description };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'achievement', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'achievement' });
    }
  }

  async notifyConnectionStatus(isConnected, userId = null) {
    const title = isConnected ? 'Connected! 🌐' : 'Connection Lost! 📡';
    const body = isConnected 
      ? 'You\'re back online and ready to play!'
      : 'Check your internet connection to continue playing.';
    const data = { isConnected };
    
    if (userId) {
      await this.sendNotificationToServer(userId, title, body, 'connection_status', data);
    } else {
      this.showLocalNotification(title, body, { ...data, type: 'connection_status' });
    }
  }

  // Get FCM token for external use
  async getFcmTokenForServer() {
    if (!this.fcmToken) {
      await this.getFcmToken();
    }
    return this.fcmToken;
  }

  // Check if notifications are enabled
  async areNotificationsEnabled() {
    try {
      if (global.firebase) {
        const authStatus = await global.firebase.messaging().hasPermission();
        return authStatus === 'authorized';
      }
      return true; // Fallback
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      // Clear badge count
      if (global.firebase) {
        await global.firebase.messaging().setBadgeCount(0);
      }
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  // Clean up resources
  cleanup() {
    try {
      // Clear intervals
      if (this.tokenRefreshInterval) {
        clearInterval(this.tokenRefreshInterval);
      }

      // Remove listeners
      this.notificationListeners.forEach(listener => {
        if (listener && typeof listener === 'function') {
          listener();
        }
      });

      this.notificationListeners = [];
      this.isInitialized = false;
      
      console.log('✅ Notification service cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up notification service:', error);
    }
  }
}

// Export singleton instance
export default new FirebaseNotificationService();

