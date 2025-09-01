import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FloatingBubbles from '../../components/FloatingBubbles';
import { useAuth } from '../../context/AuthContext';
import NotificationBadge from '../../components/NotificationBadge';

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
} from '../../utils/responsiveUtils';

const { width, height } = Dimensions.get('window');

export default function EnhancedMainMenu({ 
  onLocalGame, 
  onMultiplayer, 
  onShowRules, 
  onShowProfile,
  onShowLeaderboard,
  onShowShop,
  onShowRankedLobby,
  onShowInbox,

  onShowFriends
}) {
  const { logout, user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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

  const handleShowInbox = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowInbox();
  };



  const handleShowFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowFriends();
  };

  const toggleSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSidebarExpanded(!isSidebarExpanded);
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



  return (
    <View style={styles.container}>
 
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.gradientBackground}
      >     
      
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header with Player Stats */}
          <FloatingBubbles />
          {/* Right Sidebar - Game Features */}
          <View style={[styles.rightSidebar, isSidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed]}>
            {/* Toggle Button */}
            <TouchableOpacity style={styles.sidebarToggle} onPress={toggleSidebar} activeOpacity={0.8}>
              <Ionicons 
                name={isSidebarExpanded ? "chevron-down" : "chevron-up"} 
                size={16} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            {isSidebarExpanded && (
              <>
                <TouchableOpacity style={styles.sidebarButton} onPress={() => {}} activeOpacity={0.8}>
                  <View style={styles.sidebarButtonContent}>
                    <Ionicons name="bag" size={18} color="#fff" />
                    <Text style={styles.sidebarButtonText}>Bag</Text>
                    <View style={styles.notificationDot} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sidebarButton} onPress={() => {}} activeOpacity={0.8}>
                  <View style={styles.sidebarButtonContent}>
                    <Ionicons name="clipboard" size={18} color="#fff" />
                    <Text style={styles.sidebarButtonText}>Quests</Text>
                    <View style={styles.notificationDot} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sidebarButton} onPress={handleShowFriends} activeOpacity={0.8}>
                  <View style={styles.sidebarButtonContent}>
                    <Ionicons name="people" size={18} color="#fff" />
                    <Text style={styles.sidebarButtonText}>Friends</Text>
                    <View style={styles.notificationDot} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sidebarButton} onPress={handleShowInbox} activeOpacity={0.8}>
                  <View style={styles.sidebarButtonContent}>
                    <Ionicons name="mail" size={18} color="#fff" />
                    <Text style={styles.sidebarButtonText}>Mail</Text>
                    <View style={styles.notificationDot} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sidebarButton} onPress={() => {}} activeOpacity={0.8}>
                  <View style={styles.sidebarButtonContent}>
                    <Ionicons name="library" size={18} color="#fff" />
                    <Text style={styles.sidebarButtonText}>Monster Gallery</Text>
                    <View style={styles.notificationDot} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Top Bar with Player Profile and Resources */}
          <View style={styles.topBar}>
            {/* Left side - Player Profile */}
            <TouchableOpacity style={styles.playerProfileSection} onPress={handleShowProfile} activeOpacity={0.7}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{user?.gameStats?.level || 38}</Text>
                </View>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{user?.username || 'Player'}</Text>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankDot, { backgroundColor: getRankColor(user?.gameStats?.rank || 'Bronze') }]} />
                  <Text style={styles.rankText}>{user?.gameStats?.rank || 'Bronze'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Right side - Resources */}
            <View style={styles.resourcesSection}>
              <View style={styles.resourceItem}>
                <Ionicons name="flash" size={16} color="#4CAF50" />
                <Text style={styles.resourceText}>45/45</Text>
              </View>
              <View style={styles.resourceItem}>
                <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
                <Text style={styles.resourceText}>803K</Text>
              </View>
              <View style={styles.resourceItem}>
                <Ionicons name="diamond" size={16} color="#9C27B0" />
                <Text style={styles.resourceText}>17K</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getResponsivePadding(50),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(15),
    position: 'relative',
  },
  playerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  resourcesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resourceText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    fontWeight: 'bold',
    marginLeft: 4,
  },
  rightSidebar: {
    position: 'absolute',
    right: getResponsivePadding(20),
    top: getResponsivePadding(130),
    zIndex: 1000,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  sidebarExpanded: {
    width: scale(30),
  },
  sidebarCollapsed: {
    width: scale(30),
  },
  sidebarToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: scale(40),
    height: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sidebarButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: scale(40),
    height: scale(40),
    overflow: 'hidden',
  },
  sidebarButtonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sidebarButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(8),
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f44336',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -scale(2),
    right: -scale(2),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  levelText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(8),
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
    minWidth: responsiveWidth(20),
    marginLeft: spacing.xs,
  },
  playerName: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(5),
    marginRight: scale(3),
  },
  rankText: {
    fontSize: getResponsiveFontSize(8),
    color: '#fff',
    fontWeight: '600',
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
    paddingRight: 80, // Account for smaller right sidebar
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
