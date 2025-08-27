import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveWrapper, ResponsiveContainer, ResponsiveCard } from './ResponsiveWrapper';
import { Heading2, Heading3, BodyText, CaptionText } from './ResponsiveText';
import { 
  scale,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  spacing,
  borderRadius
} from '../utils/responsiveUtils';

export default function GameRules({ onClose }) {
  return (
    <View style={styles.overlay}>
      <ResponsiveContainer maxWidth={95}>
        <ResponsiveCard padding={24}>
          <View style={styles.header}>
            <Heading2>How to Play</Heading2>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={getResponsiveFontSize(24)} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ResponsiveWrapper scrollable>
            <View style={styles.section}>
              <Heading3>Objective</Heading3>
              <BodyText>
                Be the first player to correctly guess your opponent's secret 5-digit number!
              </BodyText>
            </View>

            <View style={styles.section}>
              <Heading3>Setup</Heading3>
              <BodyText>
                • Each player secretly chooses a 5-digit number (0-9, digits can repeat)
              </BodyText>
              <BodyText>
                • Use the auto-fill feature for random numbers or enter your own
              </BodyText>
            </View>

            <View style={styles.section}>
              <Heading3>Gameplay</Heading3>
              <BodyText>
                • Players take turns guessing the opponent's number
              </BodyText>
              <BodyText>
                • After each guess, the opponent provides feedback
              </BodyText>
              <BodyText>
                • Use the feedback to make better guesses on your next turn
              </BodyText>
            </View>

            <View style={styles.section}>
              <Heading3>Game Modes</Heading3>
              
              <View style={styles.modeSection}>
                <BodyText weight="600">Standard Mode</BodyText>
                <BodyText>
                  • Shows exact matches (correct digit in correct position)
                </BodyText>
                <BodyText>
                  • Shows misplaced matches (correct digit in wrong position)
                </BodyText>
              </View>

              <View style={styles.modeSection}>
                <BodyText weight="600">Hard Mode</BodyText>
                <BodyText>
                  • Only shows total number of correct digits
                </BodyText>
                <BodyText>
                  • No information about placement
                </BodyText>
              </View>
            </View>

            <View style={styles.section}>
              <Heading3>Winning</Heading3>
              <BodyText>
                The first player to correctly guess the opponent's number wins!
              </BodyText>
            </View>

            <View style={styles.section}>
              <Heading3>Tips</Heading3>
              <BodyText>
                • Start with common patterns like 12345 or 00000
              </BodyText>
              <BodyText>
                • Use feedback to eliminate possibilities
              </BodyText>
              <BodyText>
                • Think logically about digit placement
              </BodyText>
            </View>
          </ResponsiveWrapper>
        </ResponsiveCard>
      </ResponsiveContainer>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: scale(5),
  },
  section: {
    marginBottom: spacing.lg,
  },
  modeSection: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
}); 