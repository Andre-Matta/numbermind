const express = require('express');
const { verifyToken } = require('../utils/jwtUtils');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const firebaseNotificationService = require('../services/firebaseNotificationService');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   POST /api/notifications/register
// @desc    Register FCM token
// @access  Private
router.post('/register', [
  body('fcmToken').notEmpty().withMessage('FCM token is required'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Invalid platform')
], async (req, res) => {
  try {
    console.log('🔍 FCM Registration Debug:');
    console.log('📥 Request body:', req.body);
    console.log('👤 User ID:', req.user?.id);
    console.log('🔑 Auth header:', req.header('Authorization')?.substring(0, 20) + '...');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { fcmToken, platform, deviceId } = req.body;
    const userId = req.user.id;

    console.log('✅ Validation passed, registering token...');

    // Register token with Firebase service
    await firebaseNotificationService.registerToken(userId, fcmToken, platform, deviceId);

    console.log('✅ Token registered successfully');

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('❌ Register FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering FCM token'
    });
  }
});

// @route   POST /api/notifications/send
// @desc    Send push notification to user
// @access  Private
router.post('/send', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('type').isIn([
    'game_invite',
    'match_found',
    'friend_request',
    'your_turn',
    'game_result',
    'achievement',
    'connection_status',
    'system',
    'promotion'
  ]).withMessage('Invalid notification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, title, body, type, data } = req.body;

    // Send notification via Firebase
    const result = await firebaseNotificationService.sendToUser(userId, title, body, {
      type,
      ...data
    });

    res.json({
      success: result.success,
      message: result.message,
      results: result.results
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending notification'
    });
  }
});

// @route   POST /api/notifications/send-multiple
// @desc    Send push notification to multiple users
// @access  Private
router.post('/send-multiple', [
  body('userIds').isArray().withMessage('User IDs array is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('type').isIn([
    'game_invite',
    'match_found',
    'friend_request',
    'your_turn',
    'game_result',
    'achievement',
    'connection_status',
    'system',
    'promotion'
  ]).withMessage('Invalid notification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userIds, title, body, type, data } = req.body;

    // Send notifications to multiple users via Firebase
    const results = await firebaseNotificationService.sendToUsers(userIds, title, body, {
      type,
      ...data
    });

    res.json({
      success: true,
      message: `Notifications sent to ${userIds.length} users`,
      results
    });
  } catch (error) {
    console.error('Send multiple notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending notifications'
    });
  }
});

// @route   POST /api/notifications/send-topic
// @desc    Send push notification to topic
// @access  Private
router.post('/send-topic', [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { topic, title, body, data } = req.body;

    // Send topic notification via Firebase
    const result = await firebaseNotificationService.sendToTopic(topic, title, body, data);

    res.json({
      success: result.success,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Send topic notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending topic notification'
    });
  }
});

// @route   POST /api/notifications/subscribe-topic
// @desc    Subscribe user to topic
// @access  Private
router.post('/subscribe-topic', [
  body('topic').notEmpty().withMessage('Topic is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { topic } = req.body;
    const userId = req.user.id;

    // Get user's FCM tokens
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No FCM tokens found for user'
      });
    }

    const tokens = user.fcmTokens.filter(t => t.isActive).map(t => t.token);
    
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active FCM tokens found'
      });
    }

    // Subscribe to topic
    const result = await firebaseNotificationService.subscribeToTopic(tokens, topic);

    res.json({
      success: true,
      message: `Subscribed ${result.successCount}/${tokens.length} tokens to topic ${topic}`,
      result
    });
  } catch (error) {
    console.error('Subscribe to topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing to topic'
    });
  }
});

// @route   POST /api/notifications/unsubscribe-topic
// @desc    Unsubscribe user from topic
// @access  Private
router.post('/unsubscribe-topic', [
  body('topic').notEmpty().withMessage('Topic is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { topic } = req.body;
    const userId = req.user.id;

    // Get user's FCM tokens
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No FCM tokens found for user'
      });
    }

    const tokens = user.fcmTokens.filter(t => t.isActive).map(t => t.token);
    
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active FCM tokens found'
      });
    }

    // Unsubscribe from topic
    const result = await firebaseNotificationService.unsubscribeFromTopic(tokens, topic);

    res.json({
      success: true,
      message: `Unsubscribed ${result.successCount}/${tokens.length} tokens from topic ${topic}`,
      result
    });
  } catch (error) {
    console.error('Unsubscribe from topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unsubscribing from topic'
    });
  }
});

// @route   DELETE /api/notifications/token
// @desc    Remove FCM token
// @access  Private
router.delete('/token', [
  body('token').notEmpty().withMessage('FCM token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const userId = req.user.id;

    // Remove token
    await firebaseNotificationService.removeToken(userId, token);

    res.json({
      success: true,
      message: 'FCM token removed successfully'
    });
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing FCM token'
    });
  }
});

// @route   GET /api/notifications/tokens
// @desc    Get user's FCM tokens
// @access  Private
router.get('/tokens', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('fcmTokens');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      tokens: user.fcmTokens || []
    });
  } catch (error) {
    console.error('Get FCM tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting FCM tokens'
    });
  }
});

// Game-specific notification endpoints
// @route   POST /api/notifications/game-invite
// @desc    Send game invite notification
// @access  Private
router.post('/game-invite', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('inviterName').notEmpty().withMessage('Inviter name is required'),
  body('roomId').notEmpty().withMessage('Room ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, inviterName, roomId } = req.body;

    const result = await firebaseNotificationService.sendGameInvite(userId, inviterName, roomId);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send game invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending game invite'
    });
  }
});

// @route   POST /api/notifications/match-found
// @desc    Send match found notification
// @access  Private
router.post('/match-found', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('opponentName').notEmpty().withMessage('Opponent name is required'),
  body('gameId').notEmpty().withMessage('Game ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, opponentName, gameId } = req.body;

    const result = await firebaseNotificationService.sendMatchFound(userId, opponentName, gameId);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send match found error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending match found notification'
    });
  }
});

// @route   POST /api/notifications/friend-request
// @desc    Send friend request notification
// @access  Private
router.post('/friend-request', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('requesterName').notEmpty().withMessage('Requester name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, requesterName } = req.body;

    const result = await firebaseNotificationService.sendFriendRequest(userId, requesterName);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending friend request notification'
    });
  }
});

// @route   POST /api/notifications/your-turn
// @desc    Send your turn notification
// @access  Private
router.post('/your-turn', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('gameId').notEmpty().withMessage('Game ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, gameId } = req.body;

    const result = await firebaseNotificationService.sendYourTurn(userId, gameId);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send your turn error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending your turn notification'
    });
  }
});

// @route   POST /api/notifications/game-result
// @desc    Send game result notification
// @access  Private
router.post('/game-result', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('won').isBoolean().withMessage('Won status is required'),
  body('opponentName').notEmpty().withMessage('Opponent name is required'),
  body('score').isNumeric().withMessage('Score is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, won, opponentName, score } = req.body;

    const result = await firebaseNotificationService.sendGameResult(userId, won, opponentName, score);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send game result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending game result notification'
    });
  }
});

// @route   POST /api/notifications/achievement
// @desc    Send achievement notification
// @access  Private
router.post('/achievement', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('achievementName').notEmpty().withMessage('Achievement name is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, achievementName, description } = req.body;

    const result = await firebaseNotificationService.sendAchievement(userId, achievementName, description);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Send achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending achievement notification'
    });
  }
});

module.exports = router;
