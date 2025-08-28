import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import config from '../config/config';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  // Initialize notification service
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token (only for physical devices and development builds)
      if (Device.isDevice) {
        try {
          // Check if we're in Expo Go (which doesn't support push notifications in SDK 53+)
          const isExpoGo = __DEV__ && !global.ExpoModulesCore;
          
          if (isExpoGo) {
            console.log('Running in Expo Go - push notifications are not supported in SDK 53+. Use a development build for full functionality.');
            // Skip push token registration in Expo Go
          } else {
            this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
              projectId: config.EXPO_PROJECT_ID || 'f7981a89-39a0-43c3-8c63-9346e0fa35ce',
            })).data;
            
            // Save token to storage
            await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
            console.log('Push token:', this.expoPushToken);
          }
        } catch (tokenError) {
          console.log('Could not get push token:', tokenError.message);
          // This might happen in Expo Go or if there are configuration issues
        }
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle incoming notifications
  handleNotificationReceived(notification) {
    const { title, body, data } = notification.request.content;
    
    // You can add custom logic here based on notification type
    switch (data?.type) {
      case 'game_invite':
        // Handle game invite notification
        break;
      case 'match_found':
        // Handle match found notification
        break;
      case 'friend_request':
        // Handle friend request notification
        break;
      default:
        // Handle general notifications
        break;
    }
  }

  // Handle notification responses (when user taps notification)
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'game_invite':
        // Navigate to game invite screen
        if (data.roomId) {
          // Navigate to specific room
        }
        break;
      case 'match_found':
        // Navigate to game screen
        if (data.gameId) {
          // Navigate to specific game
        }
        break;
      case 'friend_request':
        // Navigate to friend requests screen
        break;
      default:
        // Navigate to main menu or default screen
        break;
    }
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Send scheduled notification
  async scheduleNotification(title, body, trigger, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  // Game-specific notification methods
  async notifyMatchFound(opponentName, gameId, userId = null) {
    const title = 'Match Found! 🎯';
    const body = `You've been matched with ${opponentName}. Tap to join the game!`;
    const data = { gameId, opponentName };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'match_found', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'match_found' });
    }
  }

  async notifyGameInvite(inviterName, roomId, userId = null) {
    const title = 'Game Invite 🎮';
    const body = `${inviterName} invited you to play NumberMind!`;
    const data = { roomId, inviterName };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'game_invite', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'game_invite' });
    }
  }

  async notifyFriendRequest(requesterName, userId = null) {
    const title = 'Friend Request 👥';
    const body = `${requesterName} wants to be your friend!`;
    const data = { requesterName };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'friend_request', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'friend_request' });
    }
  }

  async notifyYourTurn(gameId, userId = null) {
    const title = 'Your Turn! 🎲';
    const body = 'It\'s your turn to make a guess!';
    const data = { gameId };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'your_turn', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'your_turn' });
    }
  }

  async notifyGameResult(won, opponentName, score, userId = null) {
    const title = won ? 'Victory! 🏆' : 'Game Over 💔';
    const body = won 
      ? `Congratulations! You beat ${opponentName} with ${score} points!`
      : `Better luck next time! ${opponentName} won with ${score} points.`;
    const data = { won, opponentName, score };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'game_result', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'game_result' });
    }
  }

  async notifyAchievement(achievementName, description, userId = null) {
    const title = 'Achievement Unlocked! 🏅';
    const body = `${achievementName}: ${description}`;
    const data = { achievementName, description };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'achievement', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'achievement' });
    }
  }

  async notifyConnectionStatus(isConnected, userId = null) {
    const title = isConnected ? 'Connected! 🌐' : 'Connection Lost! 📡';
    const body = isConnected 
      ? 'You\'re back online and ready to play!'
      : 'Check your internet connection to continue playing.';
    const data = { isConnected };
    
    if (userId) {
      await this.sendComprehensiveNotification(userId, title, body, 'connection_status', data);
    } else {
      await this.sendLocalNotification(title, body, { ...data, type: 'connection_status' });
    }
  }

  // Get push token for server registration
  async getPushToken() {
    if (!this.expoPushToken) {
      this.expoPushToken = await AsyncStorage.getItem('expoPushToken');
    }
    return this.expoPushToken;
  }

  // Send notification to server (saves to database)
  async sendNotificationToServer(userId, title, body, type, data = {}) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token available for server notification');
        return false;
      }

      const response = await fetch(`${config.API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      console.log('Notification sent to server successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send notification to server:', error);
      return false;
    }
  }

  // Send comprehensive notification (both local and server)
  async sendComprehensiveNotification(userId, title, body, type, data = {}) {
    try {
      // Send local notification for immediate display
      await this.sendLocalNotification(title, body, { ...data, type });
      
      // Send to server for persistent storage
      await this.sendNotificationToServer(userId, title, body, type, data);
      
      console.log('Comprehensive notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send comprehensive notification:', error);
      return false;
    }
  }

  // Register push token with server
  async registerPushToken(userId, token) {
    // Don't register if no token is available (e.g., in Expo Go)
    if (!token) {
      console.log('No push token available to register');
      return false;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          userId,
          pushToken: token,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }

      console.log('Push token registered successfully');
      return true;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return false;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export default new NotificationService();

