const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');
const { io } = require('../socket/socketManager');

// Middleware to verify authentication for all friend routes
router.use(verifyToken);

/**
 * Send a friend request to another user
 * POST /api/friends/request
 * Body: { username } or { userId }
 */
router.post('/request', async (req, res) => {
  try {
    const { username, userId } = req.body;
    const senderId = req.user.userId;

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
    if (!targetUser.settings.privacy.allowFriendRequests) {
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

    // Send real-time notification if target user is online
    const socketManager = io();
    if (socketManager) {
      socketManager.emit(`friend_request_${targetUser._id}`, {
        type: 'friend_request',
        from: {
          id: senderId,
          username: senderUser.username,
          avatar: senderUser.avatar
        },
        message: `${senderUser.username} sent you a friend request`
      });
    }

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
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }
});

/**
 * Respond to a friend request (accept or decline)
 * PUT /api/friends/request/:requestId
 * Body: { action: 'accept' | 'decline' }
 */
router.put('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    // Validate action
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "accept" or "decline"'
      });
    }

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

      // Send real-time notification to sender
      const socketManager = io();
      if (socketManager) {
        socketManager.emit(`friend_accepted_${senderId}`, {
          type: 'friend_accepted',
          from: {
            id: userId,
            username: user.username,
            avatar: user.avatar
          },
          message: `${user.username} accepted your friend request`
        });
      }

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
    console.error('Error processing friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process friend request'
    });
  }
});

/**
 * Get all pending friend requests
 * GET /api/friends/requests
 */
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user.userId;

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
    console.error('Error getting friend requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend requests'
    });
  }
});

/**
 * Get friends list with online status
 * GET /api/friends
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
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
    console.error('Error getting friends list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends list'
    });
  }
});

/**
 * Remove a friend
 * DELETE /api/friends/:friendId
 */
router.delete('/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

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
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove friend'
    });
  }
});

/**
 * Search for users to add as friends
 * GET /api/friends/search
 * Query: { q: 'search_term', page: 1, limit: 10 }
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    console.log('Friends search request:', { searchTerm, page, limit, userId });

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
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

/**
 * Get friend statistics
 * GET /api/friends/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

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

module.exports = router;
