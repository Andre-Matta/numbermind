import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getResponsiveFontSize, scale, borderRadius } from '../utils/responsiveUtils';

export default function NotificationBadge({ style }) {
  const { user } = useAuth();
  
  // Get unread count from user's inbox
  const unreadCount = user?.inbox?.filter(msg => !msg.isRead).length || 0;

  if (unreadCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -scale(5),
    right: -scale(5),
    backgroundColor: '#FF5722',
    borderRadius: borderRadius.md,
    minWidth: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    zIndex: 1000,
  },
  badgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
});

