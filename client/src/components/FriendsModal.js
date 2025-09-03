import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import UserSearch from './UserSearch';
import FriendsService from '../services/FriendsService';
import { useResponsiveValue } from '../utils/responsiveUtils';

/**
 * FriendsModal Component - Modal version of friends list matching the image design
 * Features:
 * - Purple gradient header with friend count
 * - Search functionality
 * - Tab navigation (Friends, Recommended, Friend Requests, Blocklist)
 * - Add friend buttons
 * - Refresh functionality
 */
const FriendsModal = ({ visible, onClose }) => {
  const [currentTab, setCurrentTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [friendStats, setFriendStats] = useState({
    totalFriends: 0,
    pendingRequests: 0,
    maxFriends: 100
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Load friend statistics
   */
  const loadFriendStats = useCallback(async () => {
    try {
      const result = await FriendsService.getFriendStats();
      if (result.success) {
        setFriendStats(result.data);
      }
    } catch (error) {
      console.error('Error loading friend stats:', error);
    }
  }, []);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await loadFriendStats();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadFriendStats]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTab(tab);
  }, []);

  /**
   * Handle search
   */
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Search functionality is handled by UserSearch component
  }, []);

  /**
   * Handle friend press
   */
  const handleFriendPress = useCallback((friend) => {
    console.log('Friend pressed:', friend.username);
  }, []);

  /**
   * Handle user press from search
   */
  const handleUserPress = useCallback((user) => {
    console.log('User pressed:', user.username);
  }, []);

  /**
   * Initialize component
   */
  useEffect(() => {
    if (visible) {
      loadFriendStats();
    }
  }, [visible, loadFriendStats]);

  /**
   * Render tab button
   */
  const renderTabButton = (tabKey, title, icon, badgeCount = 0) => (
    <TouchableOpacity
      key={tabKey}
      style={[styles.tabButton, currentTab === tabKey && styles.activeTabButton]}
      onPress={() => handleTabChange(tabKey)}
    >
      <View style={styles.tabIconContainer}>
        <Ionicons 
          name={currentTab === tabKey ? icon : `${icon}-outline`} 
          size={16} 
          color={currentTab === tabKey ? '#fff' : '#ccc'} 
        />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.tabLabel,
        { color: currentTab === tabKey ? '#fff' : '#ccc' }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  /**
   * Render current tab content
   */
  const renderTabContent = () => {
    switch (currentTab) {
      case 'friends':
        return (
          <FriendsList
            onFriendPress={handleFriendPress}
            showGameInvite={false}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'recommended':
        return (
          <UserSearch
            onUserPress={handleUserPress}
          />
        );
      case 'requests':
        return (
          <FriendRequests
            refreshTrigger={refreshTrigger}
          />
        );
      case 'blocklist':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="ban-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No blocked users</Text>
            <Text style={styles.emptySubtext}>
              Blocked users will appear here
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header with purple gradient */}
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="people" size={24} color="#fff" />
                <Text style={styles.headerTitle}>Friends</Text>
                <Text style={styles.friendCount}>
                  {friendStats.totalFriends}/{friendStats.maxFriends}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInput}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Enter player name or ID"
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            {renderTabContent()}
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh" size={20} color="#fff" />
              )}
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Tab Navigation */}
          <View style={styles.bottomTabs}>
            {renderTabButton('friends', 'Friends', 'people')}
            {renderTabButton('recommended', 'Recom. Friend', 'person-add', 1)}
            {renderTabButton('requests', 'Friend Requests', 'mail', friendStats.pendingRequests)}
            {renderTabButton('blocklist', 'Blocklist', 'ban')}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    height: '85%',
    width: '70%',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  friendCount: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
    borderTopWidth: 1,
    borderTopColor: '#4A5568',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
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
});

export default FriendsModal;
