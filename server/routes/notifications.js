const express = require('express');
const { verifyToken } = require('../utils/jwtUtils');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   POST /api/notifications/register
// @desc    Register push notification token
// @access  Private
router.post('/register', [
  body('pushToken').notEmpty().withMessage('Push token is required'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Invalid platform')
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

    const { pushToken, platform, deviceId } = req.body;
    const userId = req.user.id;

    // Find user and update push tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove existing token if it exists
    user.pushTokens = user.pushTokens.filter(token => token.token !== pushToken);
    
    // Add new token
    user.pushTokens.push({
      token: pushToken,
      platform,
      deviceId,
      isActive: true,
      lastUsed: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering push token'
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

    const { userId, title, body, type, data, scheduledFor } = req.body;

    // Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
      data: data || {},
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null
    });

    // Send push notification if user has active tokens
    const user = await User.findById(userId).select('pushTokens settings');
    if (user && user.pushTokens.length > 0) {
      // Check user notification preferences
      const notificationSettings = user.settings?.notifications || {};
      const shouldSend = notificationSettings[type] !== false; // Default to true if not set

      if (shouldSend) {
        // Send to all active tokens
        for (const tokenInfo of user.pushTokens) {
          if (tokenInfo.isActive) {
            try {
              await sendPushNotification(tokenInfo.token, title, body, {
                type,
                ...data
              });
              
              // Mark notification as sent
              notification.status = 'sent';
              notification.sentAt = new Date();
            } catch (error) {
              console.error(`Failed to send push notification to token ${tokenInfo.token}:`, error);
              notification.status = 'failed';
              notification.errorMessage = error.message;
            }
          }
        }
        await notification.save();
      }
    }

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notificationId: notification._id
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending notification'
    });
  }
});

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;

    const query = { userId };
    
    if (type) {
      query.type = type;
    }
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   PUT /api/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.put('/read', [
  body('notificationIds').isArray().withMessage('Notification IDs array is required')
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

    const { notificationIds } = req.body;
    const userId = req.user.id;

    // Mark notifications as read
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId
      },
      {
        isRead: true
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notifications as read'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting unread count'
    });
  }
});

// Helper function to send push notification via Expo
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high'
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
}

module.exports = router;
