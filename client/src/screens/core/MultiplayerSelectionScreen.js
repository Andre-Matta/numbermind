import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  scale,
  getResponsivePadding,
  getResponsiveFontSize,
  spacing,
  borderRadius,
} from '../../utils/responsiveUtils';

export default function MultiplayerSelectionScreen({ 
  onLANMultiplayer, 
  onInternetMultiplayer, 
  onBack 
}) {
  const handleLANMultiplayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLANMultiplayer();
  };

  const handleInternetMultiplayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onInternetMultiplayer();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={getResponsiveFontSize(24)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Multiplayer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Selection Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Choose your multiplayer experience
          </Text>
        </View>

        {/* LAN Multiplayer Option */}
        <TouchableOpacity
          style={[styles.optionButton, styles.lanButton]}
          onPress={handleLANMultiplayer}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="wifi" size={getResponsiveFontSize(48)} color="#fff" />
            </View>
            <Text style={styles.optionTitle}>Offline LAN Multiplayer</Text>
            <Text style={styles.optionSubtitle}>Play with friends on the same WiFi network - No internet required!</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>Works completely offline</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>No internet required</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>Fast local connection</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Internet Multiplayer Option */}
        <TouchableOpacity
          style={[styles.optionButton, styles.internetButton]}
          onPress={handleInternetMultiplayer}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="globe" size={getResponsiveFontSize(48)} color="#fff" />
            </View>
            <Text style={styles.optionTitle}>Internet Multiplayer</Text>
            <Text style={styles.optionSubtitle}>Play with friends anywhere in the world</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>Global reach</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>Play anywhere</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={getResponsiveFontSize(16)} color="#28a745" />
                <Text style={styles.featureText}>Internet connection required</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoItem}>
            <Ionicons name="1" size={getResponsiveFontSize(20)} color="#4a90e2" />
            <Text style={styles.infoText}>Choose your multiplayer type</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="2" size={getResponsiveFontSize(20)} color="#4a90e2" />
            <Text style={styles.infoText}>Create or join a room</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="3" size={getResponsiveFontSize(20)} color="#4a90e2" />
            <Text style={styles.infoText}>Share room code with friends</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="4" size={getResponsiveFontSize(20)} color="#4a90e2" />
            <Text style={styles.infoText}>Start playing together!</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: getResponsivePadding(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: scale(8),
  },
  title: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: scale(40),
  },
  descriptionContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: getResponsiveFontSize(18),
    color: '#ccc',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24),
  },
  optionButton: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  lanButton: {
    backgroundColor: '#007bff',
  },
  internetButton: {
    backgroundColor: '#6f42c1',
  },
  optionContent: {
    padding: getResponsivePadding(25),
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: scale(15),
    padding: getResponsivePadding(15),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.round,
  },
  optionTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
    paddingHorizontal: getResponsivePadding(10),
  },
  featureText: {
    fontSize: getResponsiveFontSize(14),
    color: '#fff',
    marginLeft: scale(10),
    opacity: 0.9,
  },
  infoSection: {
    marginTop: spacing.sm,
    padding: getResponsivePadding(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
    paddingHorizontal: getResponsivePadding(10),
  },
  infoText: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    marginLeft: scale(15),
    opacity: 0.9,
  },
});
