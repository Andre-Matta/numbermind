import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FloatingBubbles from '../components/FloatingBubbles';
import { useAuth } from '../context/AuthContext';
import { 
  scale, 
  responsiveWidth, 
  responsiveHeight,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  getResponsiveContainerWidth,
  spacing,
  borderRadius
} from '../utils/responsiveUtils';

const { width, height } = Dimensions.get('window');

export default function EnhancedMainMenu({ 
  onLocalGame, 
  onMultiplayer, 
  onShowRules, 
  onShowProfile,
  onShowLeaderboard,
  onShowShop,
  onShowRankedLobby
}) {
  const { logout, user } = useAuth();

  const handleLocalGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLocalGame();
  };

  const handleMultiplayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMultiplayer();
  };

  const handleRankedLobby = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onShowRankedLobby();
  };

  const handleShowRules = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowRules();
  };

  const handleShowProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowProfile();
  };

  const handleShowLeaderboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowLeaderboard();
  };

  const handleShowShop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowShop();
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

  const getLevelProgress = () => {
    if (!user?.gameStats) return 0;
    return (user.gameStats.experience / user.gameStats.experienceToNext) * 100;
  };

  return (
    <View style={styles.container}>
 
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.gradientBackground}
      >     
      
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header with Player Stats */}
          <FloatingBubbles />
          <View style={styles.header}>
            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.playerInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{user?.gameStats?.level || 1}</Text>
                </View>
              </View>
              
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{user?.username || 'Player'}</Text>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankDot, { backgroundColor: getRankColor(user?.gameStats?.rank || 'Bronze') }]} />
                  <Text style={styles.rankText}>{user?.gameStats?.rank || 'Bronze'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.coins || 0}</Text>
                <Text style={styles.statLabel}>Coins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.gameStats?.gamesWon || 0}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.gameStats?.calculatedWinRate || 0}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>

            {/* Experience Bar */}
            <View style={styles.experienceContainer}>
              <View style={styles.experienceBar}>
                <View 
                  style={[
                    styles.experienceFill, 
                    { width: `${getLevelProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.experienceText}>
                {user?.gameStats?.experience || 0} / {user?.gameStats?.experienceToNext || 100} XP
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleShowProfile}>
              <Ionicons name="person-circle" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleShowLeaderboard}>
              <Ionicons name="trophy" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Leaderboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleShowShop}>
              <Ionicons name="wallet-outline" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Shop</Text>
            </TouchableOpacity>
          </View>

          {/* Main Game Options */}
          <View style={styles.gameOptions}>
            <TouchableOpacity
              style={[styles.gameButton, styles.localButton]}
              onPress={handleLocalGame}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="phone-portrait" size={32} color="#fff" />
                <Text style={styles.buttonText}>Local Game</Text>
                <Text style={styles.buttonSubtext}>Play on the same device</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameButton, styles.multiplayerButton]}
              onPress={handleMultiplayer}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="wifi" size={32} color="#fff" />
                <Text style={styles.buttonText}>Multiplayer</Text>
                <Text style={styles.buttonSubtext}>LAN or internet gaming</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameButton, styles.rankedButton]}
              onPress={handleRankedLobby}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="star" size={32} color="#fff" />
                <Text style={styles.buttonText}>Ranked Lobby</Text>
                <Text style={styles.buttonSubtext}>Competitive matchmaking</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentActivity}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="trophy" size={20} color="#ffd700" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Won against Player456</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityReward}>+50 XP</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="star" size={20} color="#ff6b6b" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Lost to MasterCoder</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
              <Text style={styles.activityReward}>+25 XP</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.rulesButton} onPress={handleShowRules}>
              <Ionicons name="information-circle" size={24} color="#fff" />
              <Text style={styles.rulesText}>How to Play</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: getResponsivePadding(60),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(30),
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: getResponsivePadding(60),
    right: getResponsivePadding(20),
    zIndex: 10,
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: getResponsiveButtonSize(60),
    height: getResponsiveButtonSize(60),
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -scale(5),
    right: -scale(5),
    width: scale(25),
    height: scale(25),
    borderRadius: scale(12.5),
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
    minWidth: responsiveWidth(40),
  },
  playerName: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    marginRight: scale(8),
  },
  rankText: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: responsiveWidth(25),
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  experienceContainer: {
    marginBottom: 20,
  },
  experienceBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  experienceFill: {
    height: '100%',
    backgroundColor: '#4ecdc4',
    borderRadius: 4,
  },
  experienceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    minWidth: 80,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  gameOptions: {
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 20,
  },
  gameButton: {
    borderRadius: 20,
    padding: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  localButton: {
    backgroundColor: '#28a745',
  },
  multiplayerButton: {
    backgroundColor: '#007bff',
  },
  rankedButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  recentActivity: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activityReward: {
    fontSize: 14,
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  rulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 140,
    justifyContent: 'center',
  },
  rulesText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    textAlign: 'center',
  },
});
