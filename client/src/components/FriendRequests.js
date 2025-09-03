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
import { useResponsiveValue, getResponsivePadding, getResponsiveFontSize, borderRadius, scale } from '../utils/responsiveUtils';

/**
 * FriendRequests Component - Displays pending friend requests
 * Features:
 * - Accept/decline requests
 * - Real-time request updates
 * - Pull to refresh
 * - Empty state handling
 */
const FriendRequests = ({ refreshTrigger = 0 }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [error, setError] = useState(null);

  // Responsive values
  const itemHeight = useResponsiveValue({ mobile: 80, tablet: 90, desktop: 95 });
  const avatarSize = useResponsiveValue({ mobile: 50, tablet: 60, desktop: 65 });
  const fontSize = useResponsiveValue({ mobile: 16, tablet: 18, desktop: 20 });
  const buttonHeight = useResponsiveValue({ mobile: 36, tablet: 40, desktop: 44 });

  /**
   * Load friend requests from server
   */
  const loadRequests = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await FriendsService.getFriendRequests(!refresh);

      if (result.success) {
        setRequests(result.data.requests);
        setError(null);
      } else {
        setError(result.error);
        console.error('Error loading friend requests:', result.error);
      }
    } catch (error) {
      setError('Failed to load friend requests');
      console.error('Error in loadRequests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Handle new friend request from real-time events
   */
  const handleNewFriendRequest = useCallback((data) => {
    const newRequest = {
      id: Date.now().toString(), // Temporary ID
      from: data.from,
      createdAt: new Date()
    };
    setRequests(prev => [newRequest, ...prev]);
  }, []);

  /**
   * Respond to friend request (accept or decline)
   */
  const respondToRequest = useCallback(async (requestId, action, fromUsername) => {
    try {
      setProcessingRequest(requestId);
      
      const result = await FriendsService.respondToFriendRequest(requestId, action);
      
      if (result.success) {
        // Remove request from list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        
        const actionText = action === 'accept' ? 'accepted' : 'declined';
        Alert.alert(
          'Success', 
          `Friend request from ${fromUsername} has been ${actionText}.`
        );
      } else {
        Alert.alert('Error', result.error || `Failed to ${action} friend request`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} friend request`);
      console.error(`Error ${action}ing friend request:`, error);
    } finally {
      setProcessingRequest(null);
    }
  }, []);

  /**
   * Accept friend request with confirmation
   */
  const acceptRequest = useCallback((requestId, fromUsername) => {
    Alert.alert(
      'Accept Friend Request',
      `Accept friend request from ${fromUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => respondToRequest(requestId, 'accept', fromUsername)
        }
      ]
    );
  }, [respondToRequest]);

  /**
   * Decline friend request with confirmation
   */
  const declineRequest = useCallback((requestId, fromUsername) => {
    Alert.alert(
      'Decline Friend Request',
      `Decline friend request from ${fromUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => respondToRequest(requestId, 'decline', fromUsername)
        }
      ]
    );
  }, [respondToRequest]);

  /**
   * Refresh requests list
   */
  const onRefresh = useCallback(() => {
    loadRequests(true);
  }, [loadRequests]);

  /**
   * Get formatted time since request was sent
   */
  const getTimeAgo = useCallback((createdAt) => {
    const now = new Date();
    const diff = now - new Date(createdAt);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }, []);

  /**
   * Initialize component
   */
  useEffect(() => {
    const initializeRequests = async () => {
      try {
        await FriendsService.initialize();
        
        // Set up real-time listener for new friend requests
        const unsubscribe = FriendsService.onFriendRequest(handleNewFriendRequest);
        
        // Load initial requests
        await loadRequests();
        
        // Cleanup listener on unmount
        return () => {
          unsubscribe();
        };
      } catch (error) {
        setError('Failed to initialize friend requests');
        console.error('Error initializing friend requests:', error);
      }
    };

    initializeRequests();
  }, [loadRequests, handleNewFriendRequest]);

  /**
   * Refresh when refreshTrigger changes
   */
  useEffect(() => {
    if (refreshTrigger > 0) {
      onRefresh();
    }
  }, [refreshTrigger, onRefresh]);

  /**
   * Render individual request item
   */
  const renderRequestItem = useCallback(({ item: request }) => (
    <ResponsiveWrapper>
      <View style={[styles.requestItem, { minHeight: itemHeight }]}>
        <View style={styles.requestInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {request.from.avatar ? (
              <Image 
                source={{ uri: request.from.avatar }} 
                style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
              />
            ) : (
              <View style={[styles.defaultAvatar, { width: avatarSize, height: avatarSize }]}>
                <Ionicons name="person" size={Math.round(avatarSize * 0.6)} color="#666" />
              </View>
            )}
          </View>

          {/* Request details */}
          <View style={styles.requestDetails}>
            <Text style={[styles.username, { fontSize }]} numberOfLines={1}>
              {request.from.username}
            </Text>
            <Text style={styles.requestText}>Wants to be your friend</Text>
            <Text style={styles.timeAgo}>
              {getTimeAgo(request.createdAt)}
            </Text>
            {request.from.level && (
              <Text style={styles.level}>Level {request.from.level}</Text>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.acceptButton, 
              { height: buttonHeight },
              processingRequest === request.id && styles.disabledButton
            ]}
            onPress={() => acceptRequest(request.id, request.from.username)}
            disabled={processingRequest === request.id}
          >
            {processingRequest === request.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={getResponsiveFontSize(16)} color="#fff" />
                <Text style={styles.acceptText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.declineButton, 
              { height: buttonHeight },
              processingRequest === request.id && styles.disabledButton
            ]}
            onPress={() => declineRequest(request.id, request.from.username)}
            disabled={processingRequest === request.id}
          >
            <Ionicons name="close" size={getResponsiveFontSize(16)} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </ResponsiveWrapper>
  ), [
    itemHeight,
    avatarSize,
    fontSize,
    buttonHeight,
    processingRequest,
    acceptRequest,
    declineRequest,
    getTimeAgo
  ]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <ResponsiveWrapper>
      <View style={styles.emptyState}>
        <Ionicons name="mail-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No friend requests</Text>
        <Text style={styles.emptySubtext}>
          When someone sends you a friend request, it will appear here.
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
          <Text style={styles.loadingText}>Loading friend requests...</Text>
        </View>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper>
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : null}
      />
    </ResponsiveWrapper>
  );
};

const styles = StyleSheet.create({
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: scale(12),
  },
  avatar: {
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(2),
  },
  requestText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    marginBottom: scale(2),
  },
  timeAgo: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
    marginBottom: scale(2),
  },
  level: {
    fontSize: getResponsiveFontSize(11),
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(8),
    borderRadius: borderRadius.sm,
    marginRight: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  acceptText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    marginLeft: scale(4),
  },
  declineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(8),
    borderRadius: borderRadius.sm,
    minWidth: 40,
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default FriendRequests;
