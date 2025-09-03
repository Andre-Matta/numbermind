import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { getResponsivePadding, getResponsiveFontSize, borderRadius, scale, isTablet } from '../utils/responsiveUtils';

export default function Inbox({ visible, onClose, onMessagePress }) {
  const { user, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get messages from user data
  const messages = user?.inbox || [];
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      Alert.alert('Error', 'Failed to refresh messages');
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.API_BASE_URL}/users/inbox/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh user data to get updated inbox
        await refreshUserData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.API_BASE_URL}/users/inbox/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh user data to get updated inbox
        await refreshUserData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.API_BASE_URL}/users/inbox/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh user data to get updated inbox
        await refreshUserData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleMessagePress = (message) => {
    // Mark as read if not already read
    if (!message.isRead) {
      markAsRead(message._id);
    }

    // Call parent handler
    if (onMessagePress) {
      onMessagePress(message);
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return 'people';
      case 'game_invite':
        return 'game-controller';
      case 'achievement':
        return 'trophy';
      case 'promotion':
        return 'gift';
      case 'system':
      default:
        return 'mail';
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'friend_request':
        return '#2196F3';
      case 'game_invite':
        return '#4CAF50';
      case 'achievement':
        return '#FFD700';
      case 'promotion':
        return '#FF9800';
      case 'system':
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message) => (
    <TouchableOpacity
      key={message._id}
      style={[
        styles.messageItem,
        !message.isRead && styles.unreadMessage
      ]}
      onPress={() => handleMessagePress(message)}
      onLongPress={() => {
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(message._id) }
          ]
        );
      }}
    >
      <View style={styles.messageHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getMessageIcon(message.type)}
            size={20}
            color={getMessageColor(message.type)}
          />
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageTitleRow}>
            <Text style={styles.messageTitle} numberOfLines={1}>
              {message.subject}
            </Text>
            <Text style={styles.messageTime}>
              {formatDate(message.createdAt)}
            </Text>
          </View>
          <Text style={styles.messageFrom} numberOfLines={1}>
            From: {message.from?.username || 'System'}
          </Text>
          <Text style={styles.messageBody} numberOfLines={2}>
            {message.message}
          </Text>
        </View>
        {!message.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.solidCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Inbox</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={getResponsiveFontSize(20)} 
                  color={refreshing ? "#666" : "#fff"} 
                />
              </TouchableOpacity>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={markAllAsRead}
                >
                  <Ionicons name="checkmark-done" size={getResponsiveFontSize(20)} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={getResponsiveFontSize(20)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages List */}
          <ScrollView
            style={styles.messagesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
              />
            }
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-open" size={getResponsiveFontSize(64)} color="#666" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>
                  You'll receive game invites, friend requests, and system messages here
                </Text>
              </View>
            ) : (
              messages.map(renderMessage)
            )}
          </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  solidCard: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#333',
    height: isTablet ? '80%' : '90%',
    width: isTablet ? '60%' : '90%',
    borderRadius: borderRadius.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: '#FF5722',
    borderRadius: borderRadius.sm,
    paddingHorizontal: getResponsivePadding(8),
    paddingVertical: getResponsivePadding(2),
    marginLeft: scale(10),
    minWidth: scale(20),
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: scale(15),
    padding: scale(5),
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    backgroundColor: '#2a2a3e',
    marginHorizontal: scale(15),
    marginVertical: scale(5),
    borderRadius: borderRadius.md,
    padding: getResponsivePadding(15),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#444',
  },
  unreadMessage: {
    backgroundColor: '#3a3a4e',
    borderLeftColor: '#FF9800',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.round,
    backgroundColor: '#3a3a4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: '#555',
  },
  messageContent: {
    flex: 1,
  },
  messageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  messageTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: scale(10),
  },
  messageTime: {
    fontSize: getResponsiveFontSize(12),
    color: '#888',
  },
  messageFrom: {
    fontSize: getResponsiveFontSize(12),
    color: '#ccc',
    marginBottom: scale(6),
  },
  messageBody: {
    fontSize: getResponsiveFontSize(14),
    color: '#ccc',
    lineHeight: getResponsiveFontSize(20),
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FF9800',
    marginLeft: scale(8),
    marginTop: scale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(60),
  },
  emptyText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#666',
    marginTop: scale(16),
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#888',
    textAlign: 'center',
    marginTop: scale(8),
    paddingHorizontal: getResponsivePadding(40),
  },
});
