import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GameRules({ onClose }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>How to Play</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objective</Text>
            <Text style={styles.ruleText}>
              Be the first player to correctly guess your opponent's secret 5-digit number!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup</Text>
            <Text style={styles.ruleText}>
              • Each player secretly chooses a 5-digit number (0-9, digits can repeat)
            </Text>
            <Text style={styles.ruleText}>
              • Use the auto-fill feature for random numbers or enter your own
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gameplay</Text>
            <Text style={styles.ruleText}>
              • Players take turns guessing the opponent's number
            </Text>
            <Text style={styles.ruleText}>
              • After each guess, the opponent provides feedback
            </Text>
            <Text style={styles.ruleText}>
              • Use the feedback to make better guesses on your next turn
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Modes</Text>
            
            <View style={styles.modeSection}>
              <Text style={styles.modeTitle}>Standard Mode</Text>
              <Text style={styles.ruleText}>
                • Shows exact matches (correct digit in correct position)
              </Text>
              <Text style={styles.ruleText}>
                • Shows misplaced matches (correct digit in wrong position)
              </Text>
            </View>

            <View style={styles.modeSection}>
              <Text style={styles.modeTitle}>Hard Mode</Text>
              <Text style={styles.ruleText}>
                • Only shows total number of correct digits
              </Text>
              <Text style={styles.ruleText}>
                • No information about placement
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Winning</Text>
            <Text style={styles.ruleText}>
              The first player to correctly guess the opponent's number wins!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips</Text>
            <Text style={styles.ruleText}>
              • Start with common patterns like 12345 or 00000
            </Text>
            <Text style={styles.ruleText}>
              • Use feedback to eliminate possibilities
            </Text>
            <Text style={styles.ruleText}>
              • Think logically about digit placement
            </Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 5,
  },
  modeSection: {
    marginBottom: 15,
    paddingLeft: 15,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffc107',
    marginBottom: 8,
  },
}); 