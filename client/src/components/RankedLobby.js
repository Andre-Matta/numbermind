import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';


export default function RankedLobby({ onBack, onGameStart }) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [playerStats, setPlayerStats] = useState({
    rank: 'Gold',
    rating: 1250,
    gamesPlayed: 47,
    winRate: 68,
  });

  const [opponents, setOpponents] = useState([
    { id: 1, name: 'Player456', rank: 'Gold', rating: 1280, status: 'searching' },
    { id: 2, name: 'MasterCoder', rank: 'Platinum', rating: 1350, status: 'searching' },
    { id: 3, name: 'NumberNinja', rank: 'Gold', rating: 1220, status: 'searching' },
  ]);

  useEffect(() => {
    let interval;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const startSearching = () => {
    setIsSearching(true);
    setSearchTime(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate finding opponent after random time
    setTimeout(() => {
      if (isSearching) {
        findOpponent();
      }
    }, Math.random() * 10000 + 5000); // 5-15 seconds
  };

  const stopSearching = () => {
    setIsSearching(false);
    setSearchTime(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const findOpponent = () => {
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    setIsSearching(false);
    
    Alert.alert(
      'Opponent Found!',
      `Matched with ${randomOpponent.name} (${randomOpponent.rank})`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => {
            // Continue searching
            setTimeout(() => startSearching(), 1000);
          }
        },
        {
          text: 'Accept',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onGameStart({
              isRanked: true,
              opponent: randomOpponent,
              playerStats: playerStats,
            });
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Ranked Lobby</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Player Stats */}
        <View style={styles.playerStats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Your Rank</Text>
            <View style={styles.rankDisplay}>
              <View style={[styles.rankDot, { backgroundColor: getRankColor(playerStats.rank) }]} />
              <Text style={styles.rankText}>{playerStats.rank}</Text>
            </View>
            <Text style={styles.ratingText}>{playerStats.rating} Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{playerStats.winRate}%</Text>
            <Text style={styles.statSubtext}>{playerStats.gamesPlayed} games</Text>
          </View>
        </View>

        {/* Matchmaking */}
        <View style={styles.matchmakingSection}>
          <Text style={styles.sectionTitle}>Find Match</Text>
          
          {!isSearching ? (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={startSearching}
            >
              <Ionicons name="search" size={24} color="#fff" />
              <Text style={styles.searchButtonText}>Start Searching</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.searchingText}>Searching for opponent...</Text>
              <Text style={styles.searchTime}>{formatTime(searchTime)}</Text>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={stopSearching}
              >
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Available Opponents */}
        <View style={styles.opponentsSection}>
          <Text style={styles.sectionTitle}>Available Opponents</Text>
          <ScrollView style={styles.opponentsList} showsVerticalScrollIndicator={false}>
            {opponents.map((opponent) => (
              <View key={opponent.id} style={styles.opponentCard}>
                <View style={styles.opponentInfo}>
                  <View style={styles.opponentAvatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <View style={styles.opponentDetails}>
                    <Text style={styles.opponentName}>{opponent.name}</Text>
                    <View style={styles.opponentRank}>
                      <View style={[styles.rankDot, { backgroundColor: getRankColor(opponent.rank) }]} />
                      <Text style={styles.opponentRankText}>{opponent.rank}</Text>
                      <Text style={styles.opponentRating}>{opponent.rating} Rating</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.opponentStatus}>
                  <View style={[styles.statusDot, { backgroundColor: '#4ecdc4' }]} />
                  <Text style={styles.statusText}>Available</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Play Options */}
        <View style={styles.quickPlaySection}>
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <View style={styles.quickPlayButtons}>
            <TouchableOpacity style={styles.quickPlayButton}>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.quickPlayText}>Blitz Mode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickPlayButton}>
              <Ionicons name="shield" size={20} color="#fff" />
              <Text style={styles.quickPlayText}>Practice</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  placeholder: {
    width: 40,
  },
  playerStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  rankDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rankDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  matchmakingSection: {
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
  searchButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    gap: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  searchingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  searchTime: {
    color: '#4ecdc4',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  opponentsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  opponentsList: {
    maxHeight: 200,
  },
  opponentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  opponentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  opponentRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opponentRankText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  opponentRating: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  opponentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4ecdc4',
  },
  quickPlaySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickPlayButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  quickPlayButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickPlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
