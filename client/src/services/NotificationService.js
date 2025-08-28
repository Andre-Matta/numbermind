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
  async notifyMatchFound(opponentName, gameId) {
    await this.sendLocalNotification(
      'Match Found! 🎯',
      `You've been matched with ${opponentName}. Tap to join the game!`,
      {
        type: 'match_found',
        gameId,
        opponentName,
      }
    );
  }

  async notifyGameInvite(inviterName, roomId) {
    await this.sendLocalNotification(
      'Game Invite 🎮',
      `${inviterName} invited you to play NumberMind!`,
      {
        type: 'game_invite',
        roomId,
        inviterName,
      }
    );
  }

  async notifyFriendRequest(requesterName) {
    await this.sendLocalNotification(
      'Friend Request 👥',
      `${requesterName} wants to be your friend!`,
      {
        type: 'friend_request',
        requesterName,
      }
    );
  }

  async notifyYourTurn(gameId) {
    await this.sendLocalNotification(
      'Your Turn! 🎲',
      'It\'s your turn to make a guess!',
      {
        type: 'your_turn',
        gameId,
      }
    );
  }

  async notifyGameResult(won, opponentName, score) {
    const title = won ? 'Victory! 🏆' : 'Game Over 💔';
    const body = won 
      ? `Congratulations! You beat ${opponentName} with ${score} points!`
      : `Better luck next time! ${opponentName} won with ${score} points.`;
    
    await this.sendLocalNotification(title, body, {
      type: 'game_result',
      won,
      opponentName,
      score,
    });
  }

  async notifyAchievement(achievementName, description) {
    await this.sendLocalNotification(
      'Achievement Unlocked! 🏅',
      `${achievementName}: ${description}`,
      {
        type: 'achievement',
        achievementName,
        description,
      }
    );
  }

  async notifyConnectionStatus(isConnected) {
    const title = isConnected ? 'Connected! 🌐' : 'Connection Lost! 📡';
    const body = isConnected 
      ? 'You\'re back online and ready to play!'
      : 'Check your internet connection to continue playing.';
    
    await this.sendLocalNotification(title, body, {
      type: 'connection_status',
      isConnected,
    });
  }

  // Get push token for server registration
  async getPushToken() {
    if (!this.expoPushToken) {
      this.expoPushToken = await AsyncStorage.getItem('expoPushToken');
    }
    return this.expoPushToken;
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

