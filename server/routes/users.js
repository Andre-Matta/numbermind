const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// #region Profile Routes

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('friends', 'username avatar gameStats.rating gameStats.rank')
      .populate('inbox.from', 'username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  body('gameStats')
    .optional()
    .isObject()
    .withMessage('Game stats must be an object'),
  body('availableSkins')
    .optional()
    .isArray()
    .withMessage('Available skins must be an array'),
  body('coins')
    .optional()
    .isNumeric()
    .withMessage('Coins must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, avatar, settings, gameStats, availableSkins, coins } = req.body;
    const updateData = {};

    // Check if username is being changed and if it's available
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updateData.username = username;
    }

    if (avatar) updateData.avatar = avatar;
    if (settings) updateData.settings = settings;
    if (gameStats) updateData.gameStats = gameStats;
    if (availableSkins) updateData.availableSkins = availableSkins;
    if (coins !== undefined) updateData.coins = coins;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user's game statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('gameStats');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      stats: user.gameStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// #endregion

// #region Leaderboard Routes

// @route   GET /api/users/leaderboard
// @desc    Get global leaderboard
// @access  Private
router.get('/leaderboard', async (req, res) => {
  try {
    console.log('Leaderboard endpoint called with query:', req.query);
    const { page = 1, limit = 50, category = 'rating' } = req.query;
    const skip = (page - 1) * limit;

    let sortQuery = {};
    let selectFields = 'username avatar gameStats.rating gameStats.level gameStats.gamesWon gameStats.gamesPlayed gameStats.rank';

    // Handle different sorting categories
    switch (category) {
      case 'rating':
        sortQuery = { 'gameStats.rating': -1, 'gameStats.level': -1 };
        break;
      case 'level':
        sortQuery = { 'gameStats.level': -1, 'gameStats.rating': -1 };
        break;
      case 'wins':
        sortQuery = { 'gameStats.gamesWon': -1, 'gameStats.gamesPlayed': -1 };
        break;
      case 'winRate':
        // Calculate win rate and sort by it
        const winRateUsers = await User.aggregate([
          {
            $addFields: {
              calculatedWinRate: {
                $cond: {
                  if: { $gt: ['$gameStats.gamesPlayed', 0] },
                  then: { $multiply: [{ $divide: ['$gameStats.gamesWon', '$gameStats.gamesPlayed'] }, 100] },
                  else: 0
                }
              }
            }
          },
          {
            $sort: { calculatedWinRate: -1, 'gameStats.gamesPlayed': -1 }
          },
          {
            $skip: skip
          },
          {
            $limit: parseInt(limit)
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              'gameStats.rating': 1,
              'gameStats.level': 1,
              'gameStats.gamesWon': 1,
              'gameStats.gamesPlayed': 1,
              'gameStats.rank': 1,
              calculatedWinRate: 1
            }
          }
        ]);

        const total = await User.countDocuments({});

        return res.json({
          success: true,
          users: winRateUsers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });

      default:
        sortQuery = { 'gameStats.rating': -1, 'gameStats.level': -1 };
    }

    console.log('Leaderboard - Using standard query with sort:', sortQuery);
    const users = await User.find({})
      .select(selectFields)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({});
    console.log('Leaderboard - Found users:', users.length, 'Total:', total);

    res.json({
      success: true,
      users: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard'
    });
  }
});

// #endregion

// #region Friend Management Routes

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    console.log('Users search request:', { searchTerm, page, limit, userId });

    if (!searchTerm || searchTerm.trim().length < 2) {
      console.log('Search term too short:', searchTerm);
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const currentUser = await User.findById(userId).select('friends friendRequests');

    // Create search query - case insensitive username search
    const searchQuery = {
      $and: [
        {
          $or: [
            { username: { $regex: searchTerm.trim(), $options: 'i' } },
            { email: { $regex: searchTerm.trim(), $options: 'i' } }
          ]
        },
        { _id: { $ne: userId } }, // Exclude current user
        { 
          $or: [
            { 'settings.privacy.allowFriendRequests': true },
            { 'settings.privacy.allowFriendRequests': { $exists: false } } // Include users without explicit privacy settings
          ]
        }
      ]
    };

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));
    
    const users = await User.find(searchQuery)
      .select('username avatar gameStats.level')
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .sort({ username: 1 });

    console.log(`Found ${users.length} users matching search`);
    console.log('User results:', users.map(u => ({ id: u._id, username: u.username })));

    // Add relationship status for each user
    const usersWithStatus = await Promise.all(users.map(async user => {
      const isFriend = currentUser.friends.includes(user._id);
      const hasPendingRequest = currentUser.friendRequests.some(
        req => req.from.toString() === user._id.toString() && req.status === 'pending'
      );

      let relationshipStatus = 'none';
      if (isFriend) {
        relationshipStatus = 'friends';
      } else if (hasPendingRequest) {
        relationshipStatus = 'pending_incoming';
      } else {
        // Check if current user sent a request to this user
        const sentRequest = await User.findOne({
          _id: user._id,
          'friendRequests.from': userId,
          'friendRequests.status': 'pending'
        });
        if (sentRequest) {
          relationshipStatus = 'pending_outgoing';
        }
      }

      return {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.gameStats?.level || 1,
        relationshipStatus
      };
    }));

    const totalCount = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users: usersWithStatus,
        totalCount,
        page: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        hasMore: (page * limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   POST /api/users/friend-request
// @desc    Send friend request
// @access  Private
router.post('/friend-request', [
  body('userId').optional().isMongoId().withMessage('Valid user ID required'),
  body('username').optional().isString().withMessage('Valid username required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, userId } = req.body;
    const senderId = req.user.id;

    // Validate input - need either username or userId
    if (!username && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Username or user ID is required'
      });
    }

    // Find the target user
    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId).select('-password');
    } else {
      targetUser = await User.findOne({ username }).select('-password');
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent sending friend request to yourself
    if (targetUser._id.toString() === senderId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if users are already friends
    if (targetUser.friends.includes(senderId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === senderId && request.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Check user privacy settings
    if (!targetUser.settings?.privacy?.allowFriendRequests) {
      return res.status(403).json({
        success: false,
        message: 'This user is not accepting friend requests'
      });
    }

    // Add friend request to target user
    targetUser.friendRequests.push({
      from: senderId,
      status: 'pending',
      createdAt: new Date()
    });

    await targetUser.save();

    // Get sender info for real-time notification
    const senderUser = await User.findById(senderId).select('username avatar');

    res.json({
      success: true,
      message: 'Friend request sent successfully',
      data: {
        targetUser: {
          id: targetUser._id,
          username: targetUser.username,
          avatar: targetUser.avatar
        }
      }
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending friend request'
    });
  }
});

// @route   PUT /api/users/friend-request/:requestId
// @desc    Accept/reject friend request
// @access  Private
router.put('/friend-request/:requestId', [
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    // Find the user and the specific friend request
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const friendRequest = user.friendRequests.id(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Friend request has already been processed'
      });
    }

    const senderId = friendRequest.from;

    if (action === 'accept') {
      // Add each user to the other's friends list
      await User.findByIdAndUpdate(userId, {
        $addToSet: { friends: senderId }
      });

      await User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: userId }
      });

      // Update request status
      friendRequest.status = 'accepted';
      await user.save();

      // Get both users' info for response
      const friendUser = await User.findById(senderId).select('username avatar gameStats.level settings.privacy.showOnlineStatus lastActive');

      res.json({
        success: true,
        message: 'Friend request accepted',
        data: {
          newFriend: {
            id: friendUser._id,
            username: friendUser.username,
            avatar: friendUser.avatar,
            level: friendUser.gameStats?.level || 1,
            isOnline: isUserOnline(friendUser),
            lastActive: friendUser.lastActive
          }
        }
      });

    } else {
      // Update request status to declined
      friendRequest.status = 'declined';
      await user.save();

      res.json({
        success: true,
        message: 'Friend request declined'
      });
    }
  } catch (error) {
    console.error('Process friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing friend request'
    });
  }
});

// @route   DELETE /api/users/friend/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/friend/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Validate friendId
    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'Friend ID is required'
      });
    }

    // Check if they are actually friends
    const user = await User.findById(userId);
    if (!user || !user.friends.includes(friendId)) {
      return res.status(404).json({
        success: false,
        message: 'Friend not found in your friends list'
      });
    }

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing friend'
    });
  }
});

// @route   GET /api/users/friends
// @desc    Get user's friends list with online status
// @access  Private
router.get('/friends', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, search } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'friends',
        select: 'username avatar gameStats.level gameStats.rating settings.privacy.showOnlineStatus lastActive'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let friends = user.friends.map(friend => ({
      id: friend._id,
      username: friend.username,
      avatar: friend.avatar,
      level: friend.gameStats?.level || 1,
      rating: friend.gameStats?.rating || 1000,
      isOnline: isUserOnline(friend),
      lastActive: friend.lastActive
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      friends = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchLower)
      );
    }

    // Sort friends: online first, then by last active
    friends.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.lastActive) - new Date(a.lastActive);
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFriends = friends.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        friends: paginatedFriends,
        totalCount: friends.length,
        page: parseInt(page),
        totalPages: Math.ceil(friends.length / limit),
        hasMore: endIndex < friends.length
      }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friends'
    });
  }
});

// @route   GET /api/users/friend-requests
// @desc    Get pending friend requests
// @access  Private
router.get('/friend-requests', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate({
        path: 'friendRequests.from',
        select: 'username avatar gameStats.level'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter only pending requests and format the response
    const pendingRequests = user.friendRequests
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request._id,
        from: {
          id: request.from._id,
          username: request.from.username,
          avatar: request.from.avatar,
          level: request.from.gameStats?.level || 1
        },
        createdAt: request.createdAt
      }));

    res.json({
      success: true,
      data: {
        requests: pendingRequests,
        count: pendingRequests.length
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friend requests'
    });
  }
});

// @route   GET /api/users/friend-stats
// @desc    Get friend statistics
// @access  Private
router.get('/friend-stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('friends friendRequests');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pendingRequestsCount = user.friendRequests.filter(
      req => req.status === 'pending'
    ).length;

    res.json({
      success: true,
      data: {
        totalFriends: user.friends.length,
        pendingRequests: pendingRequestsCount,
        maxFriends: 100 // You can adjust this limit
      }
    });
  } catch (error) {
    console.error('Error getting friend stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend statistics'
    });
  }
});

// Helper function to determine if user is online
// This checks if user was active in the last 5 minutes and has showOnlineStatus enabled
function isUserOnline(user) {
  if (!user.settings?.privacy?.showOnlineStatus) {
    return false; // User has privacy setting to hide online status
  }
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return user.lastActive && user.lastActive > fiveMinutesAgo;
}

// #endregion

// #region Inbox Routes

// @route   PUT /api/users/inbox/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.put('/inbox/:messageId/read', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = user.inbox.id(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = true;
    message.readAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/inbox/read-all
// @desc    Mark all messages as read
// @access  Private
router.put('/inbox/read-all', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.inbox.forEach(message => {
      if (!message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });
    
    await user.save();

    res.json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/inbox/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/inbox/:messageId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = user.inbox.id(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.remove();
    await user.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// #endregion

module.exports = router;
