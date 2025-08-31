const { messaging } = require('../config/firebase');
const User = require('../models/User');

class FirebaseNotificationService {
  constructor() {
    this.messaging = messaging;
  }

  // Convert all data values to strings (Firebase requirement)
  convertDataToStrings(data) {
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    return stringData;
  }

  // Send notification to a single user
  async sendToUser(userId, title, body, data = {}) {
    try {
      // Get user's FCM tokens
      const user = await User.findById(userId).select('fcmTokens settings');
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return { success: false, message: 'No FCM tokens found' };
      }

      // Check user notification preferences
      const notificationSettings = user.settings?.notifications || {};
      const notificationType = data.type || 'system';
      const shouldSend = notificationSettings[notificationType] !== false; // Default to true if not set

      if (!shouldSend) {
        console.log(`Notifications disabled for user ${userId}, type: ${notificationType}`);
        return { success: false, message: 'Notifications disabled for this type' };
      }

      // Prepare message
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...this.convertDataToStrings(data),
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'numbermind_channel',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            requireInteraction: true
          }
        }
      };

      // Send to all user's tokens
      const results = [];
      for (const tokenInfo of user.fcmTokens) {
        if (tokenInfo.isActive) {
          try {
            const result = await this.messaging.send({
              ...message,
              token: tokenInfo.token
            });
            
            console.log(`Notification sent successfully to token ${tokenInfo.token}:`, result);
            results.push({ token: tokenInfo.token, success: true, messageId: result });
          } catch (error) {
            console.error(`Failed to send notification to token ${tokenInfo.token}:`, error);
            
            // Handle invalid token
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              // Mark token as inactive
              await this.deactivateToken(userId, tokenInfo.token);
            }
            
            results.push({ token: tokenInfo.token, success: false, error: error.message });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `Sent ${successCount}/${totalCount} notifications`,
        results
      };
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, title, body, data = {}) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, title, body, data);
        results.push({ userId, ...result });
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  // Send notification to topic
  async sendToTopic(topic, title, body, data = {}) {
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...this.convertDataToStrings(data),
          timestamp: Date.now().toString()
        },
        topic,
        android: {
          priority: 'high',
          notification: {
            channel_id: 'numbermind_channel',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const result = await this.messaging.send(message);
      console.log(`Topic notification sent successfully:`, result);
      
      return { success: true, messageId: result };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  // Subscribe user to topic
  async subscribeToTopic(tokens, topic) {
    try {
      const result = await this.messaging.subscribeToTopic(tokens, topic);
      console.log(`Subscribed ${result.successCount}/${tokens.length} tokens to topic ${topic}`);
      return result;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  // Unsubscribe user from topic
  async unsubscribeFromTopic(tokens, topic) {
    try {
      const result = await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log(`Unsubscribed ${result.successCount}/${tokens.length} tokens from topic ${topic}`);
      return result;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  // Register FCM token for user
  async registerToken(userId, token, platform = 'web', deviceId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove existing token if it exists
      user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);
      
      // Add new token
      user.fcmTokens.push({
        token,
        platform,
        deviceId,
        isActive: true,
        lastUsed: new Date()
      });

      await user.save();
      console.log(`FCM token registered for user ${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error registering FCM token:', error);
      throw error;
    }
  }

  // Deactivate FCM token
  async deactivateToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User ${userId} not found for token deactivation`);
        return;
      }

      const tokenIndex = user.fcmTokens.findIndex(t => t.token === token);
      if (tokenIndex !== -1) {
        user.fcmTokens[tokenIndex].isActive = false;
        await user.save();
        console.log(`FCM token deactivated for user ${userId}`);
      }
    } catch (error) {
      console.error('Error deactivating FCM token:', error);
    }
  }

  // Remove FCM token
  async removeToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User ${userId} not found for token removal`);
        return;
      }

      user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);
      await user.save();
      console.log(`FCM token removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  // Game-specific notification methods
  async sendGameInvite(userId, inviterName, roomId) {
    return this.sendToUser(userId, 'Game Invite 🎮', `${inviterName} invited you to play NumberMind!`, {
      type: 'game_invite',
      inviterName,
      roomId
    });
  }

  async sendMatchFound(userId, opponentName, gameId) {
    return this.sendToUser(userId, 'Match Found! 🎯', `You've been matched with ${opponentName}. Tap to join the game!`, {
      type: 'match_found',
      opponentName,
      gameId
    });
  }

  async sendFriendRequest(userId, requesterName) {
    return this.sendToUser(userId, 'Friend Request 👥', `${requesterName} wants to be your friend!`, {
      type: 'friend_request',
      requesterName
    });
  }

  async sendYourTurn(userId, gameId) {
    return this.sendToUser(userId, 'Your Turn! 🎲', 'It\'s your turn to make a guess!', {
      type: 'your_turn',
      gameId
    });
  }

  async sendGameResult(userId, won, opponentName, score) {
    const title = won ? 'Victory! 🏆' : 'Game Over 💔';
    const body = won 
      ? `Congratulations! You beat ${opponentName} with ${score} points!`
      : `Better luck next time! ${opponentName} won with ${score} points.`;
    
    return this.sendToUser(userId, title, body, {
      type: 'game_result',
      won,
      opponentName,
      score
    });
  }

  async sendAchievement(userId, achievementName, description) {
    return this.sendToUser(userId, 'Achievement Unlocked! 🏅', `${achievementName}: ${description}`, {
      type: 'achievement',
      achievementName,
      description
    });
  }

  async sendConnectionStatus(userId, isConnected) {
    const title = isConnected ? 'Connected! 🌐' : 'Connection Lost! 📡';
    const body = isConnected 
      ? 'You\'re back online and ready to play!'
      : 'Check your internet connection to continue playing.';
    
    return this.sendToUser(userId, title, body, {
      type: 'connection_status',
      isConnected
    });
  }
}

module.exports = new FirebaseNotificationService();
