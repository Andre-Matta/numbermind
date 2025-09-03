import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendsService from '../services/FriendsService';
import { ResponsiveWrapper } from './ResponsiveWrapper';
import { useResponsiveValue, getResponsivePadding, getResponsiveFontSize, borderRadius, scale } from '../utils/responsiveUtils';

/**
 * UserSearch Component - Search for users and send friend requests
 * Features:
 * - Real-time search with debouncing
 * - Send friend requests
 * - Show relationship status (friends, pending, etc.)
 * - Pagination support
 * - Empty state and error handling
 */
const UserSearch = ({ onUserPress = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Responsive values
  const itemHeight = useResponsiveValue({ mobile: 70, tablet: 80, desktop: 85 });
  const avatarSize = useResponsiveValue({ mobile: 45, tablet: 55, desktop: 60 });
  const fontSize = useResponsiveValue({ mobile: 16, tablet: 18, desktop: 20 });
  const inputHeight = useResponsiveValue({ mobile: 44, tablet: 48, desktop: 52 });

  /**
   * Perform user search
   */
  const searchUsers = useCallback(async (term, pageNum = 1, loadMore = false) => {
    if (!term || term.trim().length < 2) {
      setUsers([]);
      setHasMore(false);
      setHasSearched(false);
      return;
    }

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }

      const result = await FriendsService.searchUsers(term.trim(), {
        page: pageNum,
        limit: 20
      });

      if (result.success) {
        const newUsers = result.data.users;
        
        if (loadMore) {
          setUsers(prev => [...prev, ...newUsers]);
        } else {
          setUsers(newUsers);
        }
        
        setHasMore(result.data.hasMore);
        setPage(pageNum);
        setError(null);
        setHasSearched(true);
      } else {
        setError(result.error);
        setHasSearched(true);
      }
    } catch (error) {
      setError('Failed to search users');
      setHasSearched(true);
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  /**
   * Handle search input change with debouncing
   */
  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(text);
    }, 500);
  }, [searchUsers]);

  /**
   * Send friend request to user
   */
  const sendFriendRequest = useCallback(async (userId, username) => {
    try {
      setSendingRequest(userId);
      
      const result = await FriendsService.sendFriendRequest(username);
      
      if (result.success) {
        // Update user's relationship status in the list
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, relationshipStatus: 'pending_outgoing' }
            : user
        ));
        
        Alert.alert('Success', `Friend request sent to ${username}!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to send friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
      console.error('Error sending friend request:', error);
    } finally {
      setSendingRequest(null);
    }
  }, []);

  /**
   * Load more users (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && searchTerm.trim().length >= 2) {
      searchUsers(searchTerm, page + 1, true);
    }
  }, [loadingMore, hasMore, searchTerm, page, searchUsers]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setUsers([]);
    setHasMore(false);
    setError(null);
    setHasSearched(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  /**
   * Get relationship status button
   */
  const getRelationshipButton = useCallback((user) => {
    switch (user.relationshipStatus) {
      case 'friends':
        return (
          <View style={styles.statusBadge}>
            <Ionicons name="people" size={16} color="#4CAF50" />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>Friends</Text>
          </View>
        );
      
      case 'pending_outgoing':
        return (
          <View style={styles.statusBadge}>
            <Ionicons name="hourglass" size={getResponsiveFontSize(16)} color="#FF9800" />
            <Text style={[styles.statusText, { color: '#FF9800' }]}>Pending</Text>
          </View>
        );
      
      case 'pending_incoming':
        return (
          <View style={styles.statusBadge}>
            <Ionicons name="mail" size={getResponsiveFontSize(16)} color="#2196F3" />
            <Text style={[styles.statusText, { color: '#2196F3' }]}>Respond</Text>
          </View>
        );
      
      default:
        return (
          <TouchableOpacity
            style={[
              styles.addFriendButton,
              sendingRequest === user.id && styles.disabledButton
            ]}
            onPress={() => sendFriendRequest(user.id, user.username)}
            disabled={sendingRequest === user.id}
          >
            {sendingRequest === user.id ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.addFriendButtonText}>Add Friend</Text>
            )}
          </TouchableOpacity>
        );
    }
  }, [sendingRequest, sendFriendRequest]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Render individual user item
   */
  const renderUserItem = useCallback(({ item: user }) => (
    <ResponsiveWrapper>
      <TouchableOpacity
        style={[styles.userItem, { minHeight: itemHeight }]}
        onPress={() => onUserPress && onUserPress(user)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
              />
            ) : (
              <View style={[styles.defaultAvatar, { width: avatarSize, height: avatarSize }]}>
                <Ionicons name="person" size={Math.round(avatarSize * 0.6)} color="#666" />
              </View>
            )}
            {/* Level badge */}
            {user.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{user.level}</Text>
              </View>
            )}
          </View>

          {/* User details */}
          <View style={styles.userDetails}>
            <Text style={[styles.username, { fontSize }]} numberOfLines={1}>
              {user.username}
            </Text>
            <View style={styles.powerContainer}>
              <Ionicons name="shield" size={getResponsiveFontSize(16)} color="#FF9800" />
              <Text style={styles.powerText}>
                {user.power ? `${Math.floor(user.power / 1000)}K` : '0K'}
              </Text>
            </View>
            {user.level && (
              <Text style={styles.level}>Level {user.level}</Text>
            )}
          </View>
        </View>

        {/* Relationship status / Add button */}
        {getRelationshipButton(user)}
      </TouchableOpacity>
    </ResponsiveWrapper>
  ), [
    itemHeight,
    avatarSize,
    fontSize,
    onUserPress,
    getRelationshipButton
  ]);

  /**
   * Render loading footer for pagination
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Loading more users...</Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <ResponsiveWrapper>
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Search for friends</Text>
            <Text style={styles.emptySubtext}>
              Enter a username to find and add friends
            </Text>
          </View>
        </ResponsiveWrapper>
      );
    }

    return (
      <ResponsiveWrapper>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with a different username
          </Text>
        </View>
      </ResponsiveWrapper>
    );
  };

  return (
    <ResponsiveWrapper>
      <View style={styles.container}>
        {/* Search input */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { height: inputHeight }]}>
            <Ionicons name="search" size={getResponsiveFontSize(20)} color="#666" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={[styles.input, { fontSize: fontSize - 2 }]}
              placeholder="Search by username..."
              value={searchTerm}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                <Ionicons name="close-circle" size={getResponsiveFontSize(20)} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search results or loading */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#666" />
            <Text style={styles.loadingText}>Searching users...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => searchUsers(searchTerm)}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={users.length === 0 ? styles.emptyContainer : null}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </ResponsiveWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: borderRadius.md,
    paddingHorizontal: getResponsivePadding(12),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    color: '#333',
  },
  clearButton: {
    padding: scale(4),
    marginLeft: scale(8),
  },
  userItem: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(12),
  },
  avatar: {
    borderRadius: borderRadius.round,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  defaultAvatar: {
    borderRadius: borderRadius.round,
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
  userDetails: {
    flex: 1,
  },
  username: {
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
  level: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(8),
    paddingVertical: getResponsivePadding(4),
    borderRadius: borderRadius.sm,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    marginLeft: scale(4),
  },
  disabledButton: {
    opacity: 0.6,
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

export default UserSearch;
