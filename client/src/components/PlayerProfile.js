import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';
import { ResponsiveWrapper, ResponsiveContainer, ResponsiveCard } from './ResponsiveWrapper';
import { Heading2, BodyText } from './ResponsiveText';
import { 
  scale,
  getResponsivePadding,
  getResponsiveFontSize,
  spacing,
  borderRadius
} from '../utils/responsiveUtils';


export default function PlayerProfile({ visible, onClose, user, onShowRules }) {
  const { logout } = useAuth();

  const getRankColor = (rank) => {
    switch (rank) {
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#e5e4e2';
      case 'Diamond': return '#b9f2ff';
      default: return '#ffd700';
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
        <ResponsiveCard padding={20} style={styles.solidCard}>
          <View style={styles.header}>
            <Heading2>Player Profile</Heading2>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.howToPlayButton} onPress={onShowRules}>
                <Ionicons name="information-circle" size={getResponsiveFontSize(18)} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={getResponsiveFontSize(20)} color="#f44336" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={getResponsiveFontSize(24)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ResponsiveWrapper scrollable>
            <View style={styles.profileSection}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={getResponsiveFontSize(40)} color="#fff" />
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{user?.username || 'Player'}</Text>
                  <Text style={styles.profileLevel}>Level {user?.gameStats?.level || 1}</Text>
                  <View style={styles.rankContainer}>
                    <View style={[styles.rankDot, { backgroundColor: getRankColor(user?.gameStats?.rank || 'Bronze') }]} />
                    <Text style={styles.rankText}>{user?.gameStats?.rank || 'Bronze'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.statsSection}>
              <Heading2>Statistics</Heading2>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.coins || 0}</Text>
                  <Text style={styles.statLabel}>Coins</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.gameStats?.gamesPlayed || 0}</Text>
                  <Text style={styles.statLabel}>Games Played</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.gameStats?.gamesWon || 0}</Text>
                  <Text style={styles.statLabel}>Games Won</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.gameStats?.calculatedWinRate || 0}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>
            </View>

            <View style={styles.comingSoonSection}>
              <BodyText style={styles.comingSoon}>More profile features coming soon!</BodyText>
            </View>
          </ResponsiveWrapper>
        </ResponsiveCard>
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
    height: '85%',
    width: '70%',
    borderRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    padding: scale(5),
  },
  logoutButton: {
    padding: scale(5),
  },
  howToPlayButton: {
    padding: scale(5),
  },
  profileSection: {
    marginBottom: spacing.lg,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#444',
  },
  avatarContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#3a3a4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#555',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  profileLevel: {
    fontSize: getResponsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(6),
  },
  rankText: {
    fontSize: getResponsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#2a2a3e',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#444',
  },
  statValue: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: getResponsiveFontSize(12),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  comingSoonSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  comingSoon: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
