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
import { useResponsiveValue } from '../utils/responsiveUtils';

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
            <Ionicons name="hourglass" size={16} color="#FF9800" />
            <Text style={[styles.statusText, { color: '#FF9800' }]}>Pending</Text>
          </View>
        );
      
      case 'pending_incoming':
        return (
          <View style={styles.statusBadge}>
            <Ionicons name="mail" size={16} color="#2196F3" />
            <Text style={[styles.statusText, { color: '#2196F3' }]}>Respond</Text>
          </View>
        );
      
      default:
        return (
          <TouchableOpacity
            style={[
              styles.addButton,
              sendingRequest === user.id && styles.disabledButton
            ]}
            onPress={() => sendFriendRequest(user.id, user.username)}
            disabled={sendingRequest === user.id}
          >
            {sendingRequest === user.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={styles.addText}>Add</Text>
              </>
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
                <Ionicons name="person" size={avatarSize * 0.6} color="#666" />
              </View>
            )}
          </View>

          {/* User details */}
          <View style={styles.userDetails}>
            <Text style={[styles.username, { fontSize }]} numberOfLines={1}>
              {user.username}
            </Text>
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
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
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
                <Ionicons name="close-circle" size={20} color="#666" />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#333',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  level: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    justifyContent: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
});

export default UserSearch;
