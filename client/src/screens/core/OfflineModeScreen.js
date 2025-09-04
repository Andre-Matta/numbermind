import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveButton } from '../../components/ResponsiveButton';
import {
  getResponsivePadding,
  getResponsiveFontSize,
  verticalScale,
  scale,
  borderRadius
} from '../../utils/responsiveUtils';

export default function OfflineModeScreen({ onLocalGame, onLANMultiplayer, onBack }) {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>You are offline</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Play without internet</Text>
        <Text style={styles.description}>
          Choose a mode that works offline. You can play locally on your device or with friends on the same WiFi using LAN.
        </Text>

        <View style={styles.buttons}>
          <ResponsiveButton
            title="Play Local"
            onPress={onLocalGame}
            variant="primary"
            size="large"
            fullWidth
            style={styles.button}
          />
          <ResponsiveButton
            title="LAN Multiplayer"
            onPress={onLANMultiplayer}
            variant="success"
            size="large"
            fullWidth
            style={styles.button}
          />
        </View>

        <Text style={styles.hint}>
          Tip: LAN mode requires devices to be on the same WiFi network, but no internet is needed.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsivePadding(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  backButton: {
    padding: scale(8),
  },
  title: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: scale(24),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: getResponsivePadding(16),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  description: {
    fontSize: getResponsiveFontSize(14),
    color: '#cfd8e3',
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  buttons: {
    gap: verticalScale(12),
  },
  button: {
  },
  hint: {
    marginTop: verticalScale(12),
    fontSize: getResponsiveFontSize(12),
    color: '#9fb3c8',
    textAlign: 'center',
  },
});


