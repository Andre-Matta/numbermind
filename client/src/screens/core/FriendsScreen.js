import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import FriendsList from '../../components/FriendsList';
import FriendRequests from '../../components/FriendRequests';
import UserSearch from '../../components/UserSearch';
import { ResponsiveWrapper } from '../../components/ResponsiveWrapper';
import FriendsService from '../../services/FriendsService';

/**
 * FriendsScreen - Main screen for the friend system (without TabView)
 * Features:
 * - Toggle between Friends, Requests, and Search
 * - Real-time notifications badge
 * - Friend statistics
 * - Game invitation support
 */
const FriendsScreenSimple = ({ navigation, route }) => {
  const [currentTab, setCurrentTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [friendStats, setFriendStats] = useState({
    totalFriends: 0,
    pendingRequests: 0,
    maxFriends: 100
  });

  /**
   * Load friend statistics
   */
  const loadFriendStats = useCallback(async () => {
    try {
      const result = await FriendsService.getFriendStats();
      if (result.success) {
        setFriendStats(result.data);
        setPendingRequestsCount(result.data.pendingRequests);
      }
    } catch (error) {
      console.error('Error loading friend stats:', error);
    }
  }, []);

  /**
   * Handle friend press (navigate to profile or show options)
   */
  const handleFriendPress = useCallback((friend) => {
    // For now, just log since we don't have individual profile viewing
    console.log('Friend pressed:', friend.username);
  }, []);

  /**
   * Handle game invitation
   */
  const handleInviteToGame = useCallback((friend) => {
    // Navigate to multiplayer lobby with invitation
    if (navigation && navigation.navigate) {
      navigation.navigate('MultiplayerLobby', { inviteUser: friend });
    }
  }, [navigation]);

  /**
   * Handle user press from search
   */
  const handleUserPress = useCallback((user) => {
    // For now, just log since we don't have individual profile viewing
    console.log('User pressed:', user.username);
  }, []);

  /**
   * Handle new friend request notification
   */
  const handleNewFriendRequest = useCallback((data) => {
    setPendingRequestsCount(prev => prev + 1);
    
    // Auto-switch to requests tab if new request comes in
    if (currentTab !== 'requests') {
      setCurrentTab('requests');
    }
  }, [currentTab]);

  /**
   * Handle friend request acceptance
   */
  const handleFriendAccepted = useCallback((data) => {
    setFriendStats(prev => ({
      ...prev,
      totalFriends: prev.totalFriends + 1
    }));
    
    // Refresh friends list
    setRefreshTrigger(prev => prev + 1);
  }, []);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    loadFriendStats();
  }, [loadFriendStats]);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Menu');
    }
  };

  /**
   * Initialize screen
   */
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await FriendsService.initialize();
        
        // Set up real-time listeners
        const unsubscribeRequest = FriendsService.onFriendRequest(handleNewFriendRequest);
        const unsubscribeAccepted = FriendsService.onFriendAccepted(handleFriendAccepted);
        
        // Load initial data
        await loadFriendStats();
        
        // Cleanup on unmount
        return () => {
          unsubscribeRequest();
          unsubscribeAccepted();
        };
      } catch (error) {
        console.error('Error initializing FriendsScreen:', error);
      }
    };

    initializeScreen();
  }, [loadFriendStats, handleNewFriendRequest, handleFriendAccepted]);

  /**
   * Render tab button
   */
  const renderTabButton = (tabKey, title, icon, badgeCount = 0) => (
    <TouchableOpacity
      key={tabKey}
      style={[styles.tabButton, currentTab === tabKey && styles.activeTabButton]}
      onPress={() => setCurrentTab(tabKey)}
    >
      <View style={styles.tabIconContainer}>
        <Ionicons 
          name={currentTab === tabKey ? icon : `${icon}-outline`} 
          size={20} 
          color={currentTab === tabKey ? '#4CAF50' : '#666'} 
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
        { color: currentTab === tabKey ? '#4CAF50' : '#666' }
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
            onInviteToGame={handleInviteToGame}
            showGameInvite={true}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'requests':
        return (
          <FriendRequests
            refreshTrigger={refreshTrigger}
          />
        );
      case 'search':
        return (
          <UserSearch
            onUserPress={handleUserPress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Friends</Text>
          <TouchableOpacity onPress={refreshAll} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.totalFriends}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.maxFriends}</Text>
            <Text style={styles.statLabel}>Max</Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {renderTabButton('friends', 'Friends', 'people')}
          {renderTabButton('requests', 'Requests', 'mail', pendingRequestsCount)}
          {renderTabButton('search', 'Search', 'search')}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default FriendsScreenSimple;
