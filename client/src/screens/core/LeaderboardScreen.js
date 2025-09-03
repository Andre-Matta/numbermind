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
import config from '../../config/config';
import AuthService from '../../services/AuthService';
import {
  scale,
  getResponsivePadding,
  getResponsiveFontSize,
  spacing,
  borderRadius,
} from '../../utils/responsiveUtils';


export default function LeaderboardScreen({ onBack }) {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('rating');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!AuthService.checkAuth()) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const token = AuthService.getToken();
      console.log('Leaderboard - Token:', token ? 'Present' : 'Missing');
      
      console.log('Leaderboard - Fetching from:', `${config.API_BASE_URL}/users/leaderboard?category=${selectedCategory}`);
      
      const response = await fetch(`${config.API_BASE_URL}/users/leaderboard?category=${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Leaderboard - Response status:', response.status);
      console.log('Leaderboard - Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leaderboard - Error response:', errorText);
        throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Leaderboard - Response data:', data);
      console.log('Leaderboard - Users found:', data.users?.length || 0);
      
      setTopPlayers(data.users || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={getResponsiveFontSize(24)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Category Selection */}
          <View style={styles.categorySelector}>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'rating' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('rating')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'rating' && styles.categoryButtonTextActive]}>
                Rating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'level' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('level')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'level' && styles.categoryButtonTextActive]}>
                Level
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'wins' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('wins')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'wins' && styles.categoryButtonTextActive]}>
                Wins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, selectedCategory === 'winRate' && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory('winRate')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'winRate' && styles.categoryButtonTextActive]}>
                Win Rate
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.topPlayers}>
                {topPlayers.map((player, index) => (
                  <View key={player._id || index} style={styles.playerRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.username}</Text>
                      <View style={styles.playerStats}>
                        <View style={[styles.rankDot, { backgroundColor: getRankColor(player.gameStats?.rank || 'Bronze') }]} />
                        <Text style={styles.playerRank}>{player.gameStats?.rank || 'Bronze'}</Text>
                        <Text style={styles.playerRating}>
                          {selectedCategory === 'rating' && `${player.gameStats?.rating || 0} Rating`}
                          {selectedCategory === 'level' && `Level ${player.gameStats?.level || 1}`}
                          {selectedCategory === 'wins' && `${player.gameStats?.gamesWon || 0} Wins`}
                          {selectedCategory === 'winRate' && `${player.gameStats?.calculatedWinRate || 0}% Win Rate`}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.gamesInfo}>
                      <Text style={styles.gamesCount}>{player.gameStats?.gamesPlayed || 0}</Text>
                      <Text style={styles.gamesLabel}>Games</Text>
                    </View>
                  </View>
                ))}
              </View>

              {topPlayers.length === 0 && (
                <Text style={styles.comingSoon}>No players found</Text>
              )}
            </>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getResponsivePadding(60),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(20),
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: scale(40),
  },
  content: {
    flex: 1,
    padding: getResponsivePadding(20),
  },
  topPlayers: {
    marginBottom: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: getResponsivePadding(20),
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  rankBadge: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(8),
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rankDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  playerRank: {
    fontSize: getResponsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playerRating: {
    fontSize: getResponsiveFontSize(12),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  gamesInfo: {
    alignItems: 'center',
  },
  gamesCount: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
  },
  gamesLabel: {
    fontSize: getResponsiveFontSize(12),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  comingSoon: {
    fontSize: getResponsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: getResponsivePadding(15),
    paddingVertical: getResponsivePadding(8),
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#fff',
  },
  categoryButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(50),
  },
  loadingText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    marginTop: scale(15),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(50),
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: getResponsiveFontSize(16),
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(10),
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
