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







        </ScrollView>
        
        {/* Bottom Bar - Fixed at bottom */}
        <View style={styles.bottomBar}>
          {/* Left side - Multiplayer and Leaderboard */}
          <View style={styles.bottomLeftSection}>
            <TouchableOpacity style={styles.bottomButton} onPress={handleMultiplayer} activeOpacity={0.8}>
              <View style={styles.bottomButtonContent}>
                <Ionicons name="wifi" size={20} color="#fff" />
                <Text style={styles.bottomButtonText}>Multiplayer</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomButton} onPress={handleShowLeaderboard} activeOpacity={0.8}>
              <View style={styles.bottomButtonContent}>
                <Ionicons name="trophy" size={20} color="#fff" />
                <Text style={styles.bottomButtonText}>Leaderboard</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Center - Ranked Lobby */}
          <TouchableOpacity style={styles.centerButton} onPress={handleRankedLobby} activeOpacity={0.8}>
            <View style={styles.centerButtonContent}>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.centerButtonText}>Ranked Lobby</Text>
            </View>
          </TouchableOpacity>

          {/* Right side - Local Game and Shop */}
          <View style={styles.bottomRightSection}>
            <TouchableOpacity style={styles.bottomButton} onPress={handleLocalGame} activeOpacity={0.8}>
              <View style={styles.bottomButtonContent}>
                <Ionicons name="phone-portrait" size={20} color="#fff" />
                <Text style={styles.bottomButtonText}>Local Game</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomButton} onPress={handleShowShop} activeOpacity={0.8}>
              <View style={styles.bottomButtonContent}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.bottomButtonText}>Shop</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 80, // Account for fixed bottom bar
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
    width: scale(50),
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
    width: scale(44),
    height: scale(44),
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
    top: scale(6),
    right: scale(6),
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
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



  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(8),
  },
  bottomLeftSection: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bottomRightSection: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bottomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minWidth: scale(70),
    minHeight: scale(50),
    alignItems: 'center',
  },
  bottomButtonContent: {
    alignItems: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  centerButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: getResponsiveButtonSize(105),
    minHeight: getResponsiveButtonSize(60),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerButtonContent: {
    alignItems: 'center',
  },
  centerButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },

});
