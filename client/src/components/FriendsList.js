import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendsService from '../services/FriendsService';
import { ResponsiveWrapper } from './ResponsiveWrapper';
import { useResponsiveValue, getResponsivePadding, getResponsiveFontSize, spacing, borderRadius, scale } from '../utils/responsiveUtils';

/**
 * FriendsList Component - Displays user's friends with online status
 * Features:
 * - Shows online/offline status
 * - Pull to refresh
 * - Pagination support
 * - Real-time status updates
 * - Friend removal with confirmation
 */
const FriendsList = ({ 
  onFriendPress = null, 
  onInviteToGame = null,
  showGameInvite = true,
  refreshTrigger = 0 
}) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Responsive values
  const itemHeight = useResponsiveValue({ mobile: 70, tablet: 80, desktop: 85 });
  const avatarSize = useResponsiveValue({ mobile: 45, tablet: 55, desktop: 60 });
  const fontSize = useResponsiveValue({ mobile: 16, tablet: 18, desktop: 20 });

  /**
   * Load friends from server
   */
  const loadFriends = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await FriendsService.getFriends({
        page: pageNum,
        limit: 20,
        useCache: pageNum === 1 && !refresh
      });

      if (result.success) {
        const newFriends = result.data.friends;
        
        if (refresh || pageNum === 1) {
          setFriends(newFriends);
        } else {
          setFriends(prev => [...prev, ...newFriends]);
        }
        
        setHasMore(result.data.hasMore);
        setPage(pageNum);
        setError(null);
      } else {
        setError(result.error);
        console.error('Error loading friends:', result.error);
      }
    } catch (error) {
      setError('Failed to load friends');
      console.error('Error in loadFriends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  /**
   * Handle friend status updates from real-time events
   */
  const handleStatusUpdate = useCallback((data) => {
    setFriends(prev => prev.map(friend => 
      friend.id === data.friendId 
        ? { 
            ...friend, 
            isOnline: data.isOnline, 
            lastActive: new Date(data.lastActive) 
          }
        : friend
    ));
  }, []);

  /**
   * Handle friend removal events
   */
  const handleFriendRemoved = useCallback((data) => {
    setFriends(prev => prev.filter(friend => friend.id !== data.from.id));
  }, []);

  /**
   * Handle new friend acceptance
   */
  const handleFriendAccepted = useCallback((data) => {
    // Add new friend to the list
    const newFriend = {
      id: data.from.id,
      username: data.from.username,
      avatar: data.from.avatar,
      isOnline: true,
      lastActive: new Date()
    };
    setFriends(prev => [newFriend, ...prev]);
  }, []);

  /**
   * Remove friend with confirmation
   */
  const removeFriend = useCallback(async (friendId, friendUsername) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendUsername} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FriendsService.removeFriend(friendId);
              if (result.success) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                Alert.alert('Success', `${friendUsername} has been removed from your friends list.`);
              } else {
                Alert.alert('Error', result.error || 'Failed to remove friend');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
              console.error('Error removing friend:', error);
            }
          }
        }
      ]
    );
  }, []);

  /**
   * Load more friends (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && friends.length > 0) {
      loadFriends(page + 1);
    }
  }, [loadingMore, hasMore, friends.length, page, loadFriends]);

  /**
   * Refresh friends list
   */
  const onRefresh = useCallback(() => {
    loadFriends(1, true);
  }, [loadFriends]);

  /**
   * Get formatted last active time
   */
  const getLastActiveText = useCallback((lastActive, isOnline) => {
    if (isOnline) return 'Online';
    
    if (!lastActive) return 'Last seen unknown';
    
    const now = new Date();
    const diff = now - new Date(lastActive);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return 'Last week';
  }, []);

  /**
   * Initialize component
   */
  useEffect(() => {
    const initializeFriends = async () => {
      try {
        await FriendsService.initialize();
        
        // Set up real-time listeners
        const unsubscribeStatus = FriendsService.onFriendStatusUpdate(handleStatusUpdate);
        const unsubscribeRemoved = FriendsService.onFriendRemoved(handleFriendRemoved);
        const unsubscribeAccepted = FriendsService.onFriendAccepted(handleFriendAccepted);
        
        // Load initial friends
        await loadFriends(1);
        
        // Cleanup listeners on unmount
        return () => {
          unsubscribeStatus();
          unsubscribeRemoved();
          unsubscribeAccepted();
        };
      } catch (error) {
        setError('Failed to initialize friends system');
        console.error('Error initializing friends:', error);
      }
    };

    initializeFriends();
  }, [loadFriends, handleStatusUpdate, handleFriendRemoved, handleFriendAccepted]);

  /**
   * Refresh when refreshTrigger changes (for external refresh requests)
   */
  useEffect(() => {
    if (refreshTrigger > 0) {
      onRefresh();
    }
  }, [refreshTrigger, onRefresh]);

  /**
   * Render individual friend item
   */
  const renderFriendItem = useCallback(({ item: friend }) => (
    <ResponsiveWrapper>
      <View style={[styles.friendItem, { minHeight: itemHeight }]}>
        <View style={styles.friendInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {friend.avatar ? (
              <Image 
                source={{ uri: friend.avatar }} 
                style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
              />
            ) : (
              <View style={[styles.defaultAvatar, { width: avatarSize, height: avatarSize }]}>
                <Ionicons name="person" size={Math.round(avatarSize * 0.6)} color="#666" />
              </View>
            )}
            {/* Level badge */}
            {friend.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{friend.level}</Text>
              </View>
            )}
          </View>

          {/* Friend details */}
          <View style={styles.friendDetails}>
            <Text style={[styles.friendName, { fontSize }]} numberOfLines={1}>
              {friend.username}
            </Text>
            <View style={styles.powerContainer}>
              <Ionicons name="shield" size={getResponsiveFontSize(16)} color="#FF9800" />
              <Text style={styles.powerText}>
                {friend.power ? `${Math.floor(friend.power / 1000)}K` : '0K'}
              </Text>
            </View>
            <Text style={[
              styles.statusText,
              { color: friend.isOnline ? '#4CAF50' : '#999' }
            ]}>
              {friend.isOnline ? 'Online' : getLastActiveText(friend.lastActive, friend.isOnline)}
            </Text>
          </View>
        </View>

        {/* Add Friend button */}
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => onFriendPress && onFriendPress(friend)}
        >
          <Text style={styles.addFriendButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    </ResponsiveWrapper>
  ), [
    itemHeight, 
    avatarSize, 
    fontSize, 
    onFriendPress, 
    getLastActiveText
  ]);

  /**
   * Render loading footer for pagination
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Loading more friends...</Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <ResponsiveWrapper>
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No friends yet</Text>
        <Text style={styles.emptySubtext}>
          Search for friends or wait for friend requests to get started!
        </Text>
      </View>
    </ResponsiveWrapper>
  );

  /**
   * Render error state
   */
  if (error) {
    return (
      <ResponsiveWrapper>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ResponsiveWrapper>
    );
  }

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <ResponsiveWrapper>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#666" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper>
      <FlatList
        data={friends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={friends.length === 0 ? styles.emptyContainer : null}
      />
    </ResponsiveWrapper>
  );
};

const styles = StyleSheet.create({
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: borderRadius.md,
    marginHorizontal: scale(8),
    marginVertical: scale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(12),
  },
  avatar: {
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  defaultAvatar: {
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    borderRadius: borderRadius.sm,
    minWidth: scale(20),
    height: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(4),
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(2),
  },
  powerText: {
    fontSize: getResponsiveFontSize(14),
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: scale(4),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '500',
  },
  addFriendButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#fff',
  },
  addFriendButtonText: {
    color: '#000',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(16),
  },
  loadingText: {
    marginLeft: scale(8),
    fontSize: getResponsiveFontSize(14),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(32),
  },
  emptyText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#666',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#999',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(20),
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(32),
  },
  errorText: {
    fontSize: getResponsiveFontSize(16),
    color: '#f44336',
    marginTop: scale(16),
    marginBottom: scale(16),
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FriendsList;
