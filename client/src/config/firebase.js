// Firebase configuration for client-side
// This file contains Firebase configuration for React Native

// Firebase configuration object
// You'll need to replace these values with your actual Firebase project configuration
// These values come from your Firebase Console project settings
export const firebaseConfig = {
  apiKey: "AIzaSyDS_3edlqT9XMWsqZ310e0JFH2SRGOC1Kg",
  authDomain: "numbermind-11.firebaseapp.com",
  projectId: "numbermind-11",
  storageBucket: "numbermind-11.firebasestorage.app",
  messagingSenderId: "721846929705",
  appId: "1:721846929705:android:0623c6acc4bca1e7f40f38",
  measurementId: "your-measurement-id" // Optional - add if you have Analytics enabled
};

// Firebase Cloud Messaging configuration
export const fcmConfig = {
  // Default notification channel for Android
  defaultChannel: {
    id: 'numbermind_channel',
    name: 'NumberMind Notifications',
    description: 'Notifications from NumberMind game',
    importance: 'high',
    sound: 'default',
    vibration: true
  },
  
  // Notification categories
  categories: {
    game_invite: {
      id: 'game_invite',
      name: 'Game Invites',
      description: 'When someone invites you to play'
    },
    match_found: {
      id: 'match_found', 
      name: 'Match Found',
      description: 'When a match is found for multiplayer'
    },
    friend_request: {
      id: 'friend_request',
      name: 'Friend Requests', 
      description: 'When someone sends you a friend request'
    },
    your_turn: {
      id: 'your_turn',
      name: 'Your Turn',
      description: 'When it\'s your turn to play'
    },
    game_result: {
      id: 'game_result',
      name: 'Game Results',
      description: 'When a game ends'
    },
    achievement: {
      id: 'achievement',
      name: 'Achievements',
      description: 'When you unlock an achievement'
    },
    connection_status: {
      id: 'connection_status',
      name: 'Connection Status',
      description: 'Network connection updates'
    }
  }
};

// Notification sound files (for custom sounds)
export const notificationSounds = {
  default: 'default',
  game_invite: 'game_invite.mp3',
  match_found: 'match_found.mp3',
  victory: 'victory.mp3',
  achievement: 'achievement.mp3'
};

// Notification icons (for Android)
export const notificationIcons = {
  default: 'ic_notification',
  game_invite: 'ic_game_invite',
  match_found: 'ic_match_found',
  friend_request: 'ic_friend_request',
  your_turn: 'ic_your_turn',
  game_result: 'ic_game_result',
  achievement: 'ic_achievement',
  connection_status: 'ic_connection_status'
};

// Notification colors (for Android)
export const notificationColors = {
  default: '#2196F3',
  game_invite: '#4CAF50',
  match_found: '#FF9800',
  friend_request: '#9C27B0',
  your_turn: '#F44336',
  game_result: '#607D8B',
  achievement: '#FFD700',
  connection_status: '#00BCD4'
};

// Default notification settings
export const defaultNotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  badge: true,
  categories: {
    game_invite: true,
    match_found: true,
    friend_request: true,
    your_turn: true,
    game_result: true,
    achievement: true,
    connection_status: true,
    system: true,
    promotion: false
  }
};

// FCM token management
export const fcmTokenConfig = {
  // Token refresh interval (in milliseconds)
  refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  
  // Token validation interval (in milliseconds)
  validationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Maximum number of tokens per user
  maxTokensPerUser: 5,
  
  // Token cleanup interval (in milliseconds)
  cleanupInterval: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Error messages
export const errorMessages = {
  PERMISSION_DENIED: 'Notification permissions were denied',
  TOKEN_REFRESH_FAILED: 'Failed to refresh FCM token',
  TOKEN_REGISTRATION_FAILED: 'Failed to register FCM token with server',
  NOTIFICATION_SEND_FAILED: 'Failed to send notification',
  FIREBASE_NOT_INITIALIZED: 'Firebase is not initialized',
  INVALID_TOKEN: 'Invalid FCM token',
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error occurred'
};

// Success messages
export const successMessages = {
  PERMISSION_GRANTED: 'Notification permissions granted',
  TOKEN_REFRESHED: 'FCM token refreshed successfully',
  TOKEN_REGISTERED: 'FCM token registered with server',
  NOTIFICATION_SENT: 'Notification sent successfully',
  SETTINGS_UPDATED: 'Notification settings updated'
};

export default {
  firebaseConfig,
  fcmConfig,
  notificationSounds,
  notificationIcons,
  notificationColors,
  defaultNotificationSettings,
  fcmTokenConfig,
  errorMessages,
  successMessages
};
