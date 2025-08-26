import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function MainMenu({ onLocalGame, onMultiplayer, onShowRules }) {
  const handleLocalGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLocalGame();
  };

  const handleMultiplayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMultiplayer();
  };

  const handleShowRules = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowRules();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🎯</Text>
          </View>
        </View>
        <Text style={styles.title}>NumberMind</Text>
        <Text style={styles.subtitle}>The Ultimate Codebreaking Game</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuButton, styles.localButton]}
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
          style={[styles.menuButton, styles.multiplayerButton]}
          onPress={handleMultiplayer}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="wifi" size={32} color="#fff" />
            <Text style={styles.buttonText}>Multiplayer</Text>
            <Text style={styles.buttonSubtext}>Play over LAN or internet</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.rulesButton}
          onPress={handleShowRules}
        >
          <Ionicons name="information-circle" size={24} color="#4a90e2" />
          <Text style={styles.rulesText}>How to Play</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decoration1} />
      <View style={styles.decoration2} />
      <View style={styles.decoration3} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: height * 0.05,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 3,
    borderColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  menuContainer: {
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 25,
    marginVertical: 40,
    marginBottom: 60,
  },
  menuButton: {
    borderRadius: 20,
    padding: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  localButton: {
    backgroundColor: '#28a745',
  },
  multiplayerButton: {
    backgroundColor: '#007bff',
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
  footer: {
    alignItems: 'center',
    paddingBottom: height * 0.05,
    paddingTop: 20,
  },
  rulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.5)',
    minWidth: 140,
    justifyContent: 'center',
  },
  rulesText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '700',
    marginLeft: 8,
    textAlign: 'center',
  },
  decoration1: {
    position: 'absolute',
    top: height * 0.2,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  decoration2: {
    position: 'absolute',
    bottom: height * 0.3,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  decoration3: {
    position: 'absolute',
    top: height * 0.6,
    right: width * 0.1,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
}); 