const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('friends', 'username avatar gameStats.rating gameStats.rank');

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

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude current user
    })
      .select('username avatar gameStats.rating gameStats.rank')
      .limit(parseInt(limit));

    res.json({
      success: true,
      users
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
  body('userId').isMongoId().withMessage('Valid user ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (targetUser.friends.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === req.user.id
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: req.user.id,
      status: 'pending'
    });

    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending friend request'
    });
  }
});

// @route   PUT /api/users/friend-request
// @desc    Accept/reject friend request
// @access  Private
router.put('/friend-request', [
  body('fromUserId').isMongoId().withMessage('Valid user ID required'),
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fromUserId, action } = req.body;

    const user = await User.findById(req.user.id);
    const fromUser = await User.findById(fromUserId);

    if (!user || !fromUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the friend request
    const friendRequest = user.friendRequests.find(
      req => req.from.toString() === fromUserId
    );

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Friend request already processed'
      });
    }

    if (action === 'accept') {
      // Accept friend request
      friendRequest.status = 'accepted';
      
      // Add to friends list for both users
      if (!user.friends.includes(fromUserId)) {
        user.friends.push(fromUserId);
      }
      if (!fromUser.friends.includes(req.user.id)) {
        fromUser.friends.push(req.user.id);
      }

      await fromUser.save();
    } else {
      // Reject friend request
      friendRequest.status = 'rejected';
    }

    await user.save();

    res.json({
      success: true,
      message: `Friend request ${action}ed successfully`
    });
  } catch (error) {
    console.error('Process friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing friend request'
    });
  }
});

// @route   DELETE /api/users/friend
// @desc    Remove friend
// @access  Private
router.delete('/friend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user.id);
    const friend = await User.findById(userId);

    if (!user || !friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from friends list for both users
    user.friends = user.friends.filter(id => id.toString() !== userId);
    friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);

    await Promise.all([user.save(), friend.save()]);

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
// @desc    Get user's friends list
// @access  Private
router.get('/friends', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username avatar gameStats.rating gameStats.rank lastActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      friends: user.friends
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
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'username avatar gameStats.rating');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({
      success: true,
      friendRequests: pendingRequests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friend requests'
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

module.exports = router;
