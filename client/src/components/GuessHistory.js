import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import FeedbackDisplay from './FeedbackDisplay';

export default function GuessHistory({ history, gameMode }) {
  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No guesses yet</Text>
        <Text style={styles.emptySubtext}>Make your first guess to start!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guess History</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {history.map((guess, index) => (
          <View key={index} style={styles.guessItem}>
            <View style={styles.guessHeader}>
              <Text style={styles.playerText}>Player {guess.player}</Text>
              <Text style={styles.guessNumber}>{guess.guess}</Text>
            </View>
            <FeedbackDisplay feedback={guess.feedback} gameMode={gameMode} />
            <Text style={styles.timestamp}>
              {guess.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 300,
  },
  guessItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  guessNumber: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
}); 