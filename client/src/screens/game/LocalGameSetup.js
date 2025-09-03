import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import config from '../../config/config';
import AuthService from '../../services/AuthService';
import { useData } from '../../context/DataContext';

const { width } = Dimensions.get('window');

export default function LocalGameSetup({ onGameStart, onBack }) {
  const { userSkins } = useData();
  const [step, setStep] = useState(1); // 1: Player 1, 2: Player 2
  const [player1Number, setPlayer1Number] = useState(['', '', '', '', '']);
  const [player2Number, setPlayer2Number] = useState(['', '', '', '', '']);
  const [gameMode, setGameMode] = useState('standard');
  const [selectedSkin, setSelectedSkin] = useState('default'); // default, gold, neon, etc.
  const [timerMode, setTimerMode] = useState('none'); // 'none' | 'custom'
  const [timerSeconds, setTimerSeconds] = useState(30); // 5 to 60
  const [boxAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  // Use skins from DataContext instead of fetching
  const availableSkins = userSkins || ['default'];

  const handleNumberPress = (number, currentPlayer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentPlayer === 1) {
      const emptyIndex = player1Number.findIndex(digit => digit === '');
      if (emptyIndex !== -1) {
        const newNumber = [...player1Number];
        newNumber[emptyIndex] = number.toString();
        setPlayer1Number(newNumber);
        
        // Animate the box
        Animated.sequence([
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      const emptyIndex = player2Number.findIndex(digit => digit === '');
      if (emptyIndex !== -1) {
        const newNumber = [...player2Number];
        newNumber[emptyIndex] = number.toString();
        setPlayer2Number(newNumber);
        
        // Animate the box
        Animated.sequence([
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const handleDelete = (currentPlayer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentPlayer === 1) {
      const lastFilledIndex = player1Number.findLastIndex(digit => digit !== '');
      if (lastFilledIndex !== -1) {
        const newNumber = [...player1Number];
        newNumber[lastFilledIndex] = '';
        setPlayer1Number(newNumber);
      }
    } else {
      const lastFilledIndex = player2Number.findLastIndex(digit => digit !== '');
      if (lastFilledIndex !== -1) {
        const newNumber = [...player2Number];
        newNumber[lastFilledIndex] = '';
        setPlayer2Number(newNumber);
      }
    }
  };

  const handleClear = (currentPlayer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentPlayer === 1) {
      setPlayer1Number(['', '', '', '', '']);
    } else {
      setPlayer2Number(['', '', '', '', '']);
    }
  };

  const handlePlayer1Submit = () => {
    if (player1Number.some(digit => digit === '')) {
      Alert.alert('Invalid Number', 'Please enter all 5 digits');
      return;
    }
    
    setStep(2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePlayer2Submit = () => {
    if (player2Number.some(digit => digit === '')) {
      Alert.alert('Invalid Number', 'Please enter all 5 digits');
      return;
    }

    // Start the game with both numbers
    onGameStart({
      player1Number: player1Number.join(''),
      player2Number: player2Number.join(''),
      gameMode,
      timer: timerMode === 'none' ? null : { seconds: timerSeconds }
    });
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setPlayer2Number(['', '', '', '', '']);
    } else {
      onBack();
    }
  };

  const renderInputBoxes = (currentPlayer) => {
    const currentNumber = currentPlayer === 1 ? player1Number : player2Number;
    
    return (
      <View style={styles.inputBoxesContainer}>
        {currentNumber.map((digit, index) => (
          <View key={index} style={styles.inputBoxWrapper}>
            <Animated.View 
              style={[
                styles.inputBoxImage, 
                { transform: [{ scale: boxAnimations[index] }] }
              ]}
            >
              <Text style={styles.inputBoxDigit}>{digit}</Text>
            </Animated.View>
          </View>
        ))}
      </View>
    );
  };

  const renderNumberButtons = (currentPlayer) => (
    <View style={styles.numberButtonsContainer}>
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number, currentPlayer)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.numberRow}>
        {[6, 7, 8, 9, 0].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number, currentPlayer)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(currentPlayer)}>
          <Ionicons name="backspace" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={() => handleClear(currentPlayer)}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (currentPlayer === 1 ? player1Number.some(d => d === '') : player2Number.some(d => d === '')) && styles.buttonDisabled
          ]} 
          onPress={currentPlayer === 1 ? handlePlayer1Submit : handlePlayer2Submit}
          disabled={currentPlayer === 1 ? player1Number.some(d => d === '') : player2Number.some(d => d === '')}
        >
          <Text style={styles.submitButtonText}>
            {currentPlayer === 1 ? 'Next' : 'Start Game'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.autoFillRow}>
        <TouchableOpacity 
          style={styles.autoFillButton} 
          onPress={currentPlayer === 1 ? autoFillPlayer1 : autoFillPlayer2}
        >
          <Text style={styles.autoFillButtonText}>Auto-fill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const autoFillPlayer1 = () => {
    const number = [];
    for (let i = 0; i < 5; i++) {
      number.push(Math.floor(Math.random() * 10).toString());
    }
    setPlayer1Number(number);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const autoFillPlayer2 = () => {
    const number = [];
    for (let i = 0; i < 5; i++) {
      number.push(Math.floor(Math.random() * 10).toString());
    }
    setPlayer2Number(number);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Local Game Setup</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>
              Player 1
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>
              Player 2
            </Text>
          </View>
        </View>

        {/* Game Mode Selection */}
        <View style={styles.modeSelector}>
          <Text style={styles.sectionTitle}>Game Mode</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                gameMode === 'standard' && styles.modeButtonActive,
              ]}
              onPress={() => setGameMode('standard')}
            >
              <Text style={[
                styles.modeButtonText,
                gameMode === 'standard' && styles.modeButtonTextActive,
              ]}>
                Standard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                gameMode === 'hard' && styles.modeButtonActive,
              ]}
              onPress={() => setGameMode('hard')}
            >
              <Text style={[
                styles.modeButtonText,
                gameMode === 'hard' && styles.modeButtonTextActive,
              ]}>
                Hard
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer Selection */}
        <View style={styles.modeSelector}>
          <Text style={styles.sectionTitle}>Turn Timer</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, timerMode === 'none' && styles.modeButtonActive]}
              onPress={() => setTimerMode('none')}
            >
              <Text style={[styles.modeButtonText, timerMode === 'none' && styles.modeButtonTextActive]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, timerMode === 'custom' && styles.modeButtonActive]}
              onPress={() => setTimerMode('custom')}
            >
              <Text style={[styles.modeButtonText, timerMode === 'custom' && styles.modeButtonTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {timerMode === 'custom' && (
            <View style={styles.timerSliderContainer}>
              <Text style={styles.timerLabel}>Seconds: {timerSeconds}</Text>
              <View style={styles.timerTrack}>
                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.timerTick, timerSeconds === val && styles.timerTickActive]}
                    onPress={() => setTimerSeconds(val)}
                  >
                    <Text style={[styles.timerTickText, timerSeconds === val && styles.timerTickTextActive]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Player 1 Setup */}
        {step === 1 && (
          <View style={styles.setupContainer}>
            <Text style={styles.sectionTitle}>Player 1's Turn</Text>
            <Text style={styles.instruction}>
              Enter your secret 5-digit number. Player 2 will not see this number.
            </Text>
            
            <View style={styles.playerInput}>
              <Text style={styles.playerLabel}>Your Secret Number</Text>
              {renderInputBoxes(1)}
            </View>

            {renderNumberButtons(1)}
          </View>
        )}

        {/* Player 2 Setup */}
        {step === 2 && (
          <View style={styles.setupContainer}>
            <Text style={styles.sectionTitle}>Player 2's Turn</Text>
            <Text style={styles.instruction}>
              Enter your secret 5-digit number. Player 1 will not see this number.
            </Text>
            
            <View style={styles.playerInput}>
              <Text style={styles.playerLabel}>Your Secret Number</Text>
              {renderInputBoxes(2)}
            </View>

            {renderNumberButtons(2)}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#28a745',
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  progressTextActive: {
    color: '#28a745',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#6c757d',
    marginHorizontal: 12,
  },
  modeSelector: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  modeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  setupContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instruction: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  playerInput: {
    marginBottom: 12,
  },
  playerLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },

  buttonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  inputBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    width: '100%',
  },
  inputBoxWrapper: {
    marginHorizontal: 2,
    alignItems: 'center',
    marginBottom: 0,
  },
  inputBoxImage: {
    width: (width - 48) / 5,
    height: (width - 48) / 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputBoxDigit: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  numberButtonsContainer: {
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  numberButton: {
    width: (width - 48) / 5,
    height: 46,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 6,
  },
  autoFillRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButton: {
    width: (width - 64) / 4,
    height: 46,
    backgroundColor: '#dc3545',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c82333',
  },
  clearButton: {
    width: (width - 64) / 4,
    height: 46,
    backgroundColor: '#ffc107',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0a800',
  },
  autoFillButton: {
    width: (width - 64) / 4,
    height: 46,
    backgroundColor: '#17a2b8',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#138496',
  },
  autoFillButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitButton: {
    width: (width - 64) / 4,
    height: 46,
    backgroundColor: '#28a745',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e7e34',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timerSliderContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  timerLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center'
  },
  timerTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  timerTick: {
    width: (width - 48 - 24) / 6,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  timerTickActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    borderColor: '#4a90e2'
  },
  timerTickText: {
    color: '#9fb3c8',
    fontWeight: '600'
  },
  timerTickTextActive: {
    color: '#fff'
  },
});
