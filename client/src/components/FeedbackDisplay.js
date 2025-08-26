import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function FeedbackDisplay({ feedback, gameMode }) {
  const { exact, misplaced, outOfPlace, totalCorrect } = feedback;

  if (gameMode === 'hard') {
    return (
      <View style={styles.container}>
        <Text style={styles.feedbackText}>
          Correct digits: <Text style={styles.highlight}>{totalCorrect}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.feedbackRow}>
        <View style={styles.feedbackItem}>
          <View style={[styles.indicator, styles.exactIndicator]} />
          <Text style={styles.feedbackText}>
            Exact: <Text style={styles.highlight}>{exact}</Text>
          </Text>
        </View>
        
        <View style={styles.feedbackItem}>
          <View style={[styles.indicator, styles.misplacedIndicator]} />
          <Text style={styles.feedbackText}>
            Misplaced: <Text style={styles.highlight}>{misplaced}</Text>
          </Text>
        </View>
        
        <View style={styles.feedbackItem}>
          <View style={[styles.indicator, styles.outOfPlaceIndicator]} />
          <Text style={styles.feedbackText}>
            Out of place: <Text style={styles.highlight}>{outOfPlace}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  exactIndicator: {
    backgroundColor: '#28a745',
  },
  misplacedIndicator: {
    backgroundColor: '#ffc107',
  },
  outOfPlaceIndicator: {
    backgroundColor: '#dc3545',
  },
  feedbackText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  highlight: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
}); 