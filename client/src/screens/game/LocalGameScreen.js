import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import config from '../../config/config';
import AuthService from '../../services/AuthService';
import { useData } from '../../context/DataContext';
import { 
  scale, 
  responsiveWidth, 
  responsiveHeight,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  getResponsiveContainerWidth,
  spacing,
  borderRadius
} from '../../utils/responsiveUtils';

const { width, height } = Dimensions.get('window');

export default function LocalGameScreen({ gameData, onBack, onNewGame }) {
  const { userSkins, themeSkins } = useData();
  const [currentGuess, setCurrentGuess] = useState(['', '', '', '', '']);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [guesses, setGuesses] = useState({ player1: [], player2: [] });
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const [winner, setWinner] = useState(null);
  const [selectedSkin, setSelectedSkin] = useState('default'); // default, gold, neon, etc.
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [boxAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  const { player1Number, player2Number, gameMode } = gameData;

  // Use theme skins from DataContext
  const availableThemes = Object.keys(themeSkins).length > 0 ? themeSkins : { default: { name: 'Default Theme', imageUrl: null } };

  console.log('Available theme skins:', availableThemes);

  // Create theme enum for easy access
  const THEME_ENUM = {};
  Object.keys(availableThemes).forEach(key => {
    THEME_ENUM[key.toUpperCase()] = key;
  });

  console.log('Theme enum:', THEME_ENUM);

  useEffect(() => {
    // Initialize game state
    setGameState('playing');
  }, []);

  const handleNumberPress = (number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find the first empty position
    const emptyIndex = currentGuess.findIndex(digit => digit === '');
    if (emptyIndex !== -1) {
      const newGuess = [...currentGuess];
      newGuess[emptyIndex] = number.toString();
      setCurrentGuess(newGuess);

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
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find the last filled position
    const lastFilledIndex = currentGuess.findLastIndex(digit => digit !== '');
    if (lastFilledIndex !== -1) {
      const newGuess = [...currentGuess];
      newGuess[lastFilledIndex] = '';
      setCurrentGuess(newGuess);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentGuess(['', '', '', '', '']);
  };

  const submitGuess = () => {
    if (currentGuess.some(digit => digit === '')) {
      Alert.alert('Incomplete Guess', 'Please enter all 5 digits');
      return;
    }

    const guessString = currentGuess.join('');
    const isPlayer1Turn = currentPlayer === 1;
    const targetNumber = isPlayer1Turn ? player2Number : player1Number;

    // Calculate feedback
    const feedback = calculateFeedback(guessString, targetNumber, gameMode);

    // Add guess to history
    const guessData = {
      guess: guessString,
      feedback,
      timestamp: new Date(),
      player: currentPlayer
    };

    setGuesses(prev => ({
      ...prev,
      [`player${currentPlayer}`]: [...prev[`player${currentPlayer}`], guessData]
    }));

    // Check for win
    if (feedback.exact === 5) {
      setWinner(currentPlayer);
      setGameState('finished');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Game Over!', `Player ${currentPlayer} wins!`);
      return;
    }

    // Switch turns
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentGuess(['', '', '', '', '']);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculateFeedback = (guess, secretNumber, mode) => {
    let exact = 0;
    let misplaced = 0;
    let outOfPlace = 0;
    let totalCorrect = 0;

    // Count exact matches
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secretNumber[i]) {
        exact++;
      }
    }

    // Count total correct digits
    const guessDigits = guess.split('');
    const secretDigits = secretNumber.split('');

    for (let digit of guessDigits) {
      if (secretDigits.includes(digit)) {
        totalCorrect++;
      }
    }

    // In hard mode, only show total correct to user, but keep exact for win checking
    if (mode === 'hard') {
      return { exact, misplaced: 0, outOfPlace: 0, totalCorrect };
    }

    // In standard mode, show exact, misplaced, and out of place
    misplaced = totalCorrect - exact;
    outOfPlace = 5 - totalCorrect;
    return { exact, misplaced, outOfPlace, totalCorrect };
  };

  const renderInputBoxes = () => (
    <View style={styles.inputBoxesContainer}>
      {currentGuess.map((digit, index) => (
        <View key={index} style={styles.inputBoxWrapper}>
          <Animated.View
            style={[
              styles.inputBoxImage,
              getThemeStyle(selectedSkin),
              { transform: [{ scale: boxAnimations[index] }] }
            ]}
          >
            {getThemeImageSource(availableThemes[selectedSkin]) && (
              <Image
                source={getThemeImageSource(availableThemes[selectedSkin])}
                style={styles.themeImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.inputBoxDigit}>{digit}</Text>
          </Animated.View>
        </View>
      ))}
    </View>
  );

  const getThemeStyle = (themeKey) => {
    const theme = availableThemes[themeKey];
    if (!theme) {
      console.log('Unknown theme:', themeKey);
      return styles.inputBoxDefault;
    }

    // If theme has any type of image, return style for image background
    if (theme.imageData || theme.imageAsset || theme.imageUrl) {
      return {
        backgroundColor: 'transparent',
        borderColor: '#4a90e2',
        borderWidth: 2,
      };
    }

    // Fallback to default style if no image
    return styles.inputBoxDefault;
  };

  const getThemePreviewStyle = (themeKey) => {
    const theme = availableThemes[themeKey];
    if (!theme) {
      console.log('Unknown theme preview:', themeKey);
      return styles.skinPreviewDefault;
    }

    // If theme has any type of image, return style for image background
    if (theme.imageData || theme.imageAsset || theme.imageUrl) {
      return {
        backgroundColor: 'transparent',
        borderColor: '#4a90e2',
        borderWidth: 2,
      };
    }

    // Fallback to default style if no image
    return styles.skinPreviewDefault;
  };

  // Utility function to get the best available image source for a theme
  const getThemeImageSource = (theme) => {
    if (theme?.imageData) {
      return { uri: theme.imageData }; // Base64 data URI
    } else if (theme?.imageAsset) {
      return theme.imageAsset; // Local asset reference
    } else if (theme?.imageUrl) {
      return { uri: theme.imageUrl }; // External URL
    }
    return null; // No image available
  };

  const renderNumberButtons = () => (
    <View style={styles.numberButtonsContainer}>
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number)}
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
            onPress={() => handleNumberPress(number)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="backspace" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, currentGuess.some(d => d === '') && styles.submitButtonDisabled]}
          onPress={submitGuess}
          disabled={currentGuess.some(d => d === '')}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGuessHistory = (playerGuesses, playerNumber) => (
    <View style={styles.guessHistorySection}>
      <Text style={styles.sectionTitle}>Player {playerNumber} Guesses</Text>
      <ScrollView style={styles.guessList} showsVerticalScrollIndicator={false}>
        {playerGuesses.length === 0 ? (
          <Text style={styles.noGuesses}>No guesses yet</Text>
        ) : (
          playerGuesses.map((guess, index) => (
            <View key={index} style={styles.guessItem}>
              <View style={styles.guessRow}>
                <Text style={styles.guessNumber}>{guess.guess}</Text>
                <View style={styles.feedbackDots}>
                  {gameMode === 'hard' ? (
                    <View style={styles.dotRow}>
                      {[...Array(guess.feedback.totalCorrect)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.correctDot]} />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.dotRow}>
                      {[...Array(guess.feedback.exact)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.exactDot]} />
                      ))}
                      {[...Array(guess.feedback.misplaced)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.misplacedDot]} />
                      ))}
                      {[...Array(guess.feedback.outOfPlace)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.outOfPlaceDot]} />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );



  if (gameState === 'finished') {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Game Over!</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSkinSelector(!showSkinSelector)}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.finishedContainer}>
          <Text style={styles.winnerText}>Player {winner} Wins!</Text>
          <Text style={styles.gameModeText}>Mode: {gameMode}</Text>

          <View style={styles.finalStats}>
            <Text style={styles.statsText}>Player 1 Guesses: {guesses.player1.length}</Text>
            <Text style={styles.statsText}>Player 2 Guesses: {guesses.player2.length}</Text>
          </View>

          <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
            <Text style={styles.newGameButtonText}>New Game</Text>
          </TouchableOpacity>
        </View>

        {/* Skin Selector Popup */}
        {showSkinSelector && (
          <TouchableOpacity
            style={styles.skinSelectorOverlay}
            activeOpacity={1}
            onPress={() => setShowSkinSelector(false)}
          >
            <TouchableOpacity
              style={styles.skinSelectorPopup}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.skinSelectorHeader}>
                <Text style={styles.skinSelectorTitle}>Input Box Style</Text>
                <TouchableOpacity onPress={() => setShowSkinSelector(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.skinGrid}>
                  {Object.keys(availableThemes).reduce((rows, themeKey, index) => {
                    const rowIndex = Math.floor(index / 3);
                    if (!rows[rowIndex]) {
                      rows[rowIndex] = [];
                    }
                    rows[rowIndex].push(
                      <TouchableOpacity
                        key={themeKey}
                        style={[styles.skinOption, selectedSkin === themeKey && styles.skinOptionSelected]}
                        onPress={() => {
                          setSelectedSkin(themeKey);
                          console.log('Theme changed to:', themeKey);
                          console.log('Applied theme style:', getThemeStyle(themeKey));
                        }}
                      >
                        <View style={[styles.skinOptionPreview, getThemePreviewStyle(themeKey)]}>
                          {getThemeImageSource(availableThemes[themeKey]) && (
                            <Image
                              source={getThemeImageSource(availableThemes[themeKey])}
                              style={styles.themePreviewImage}
                              resizeMode="cover"
                            />
                          )}
                        </View>
                        <Text style={styles.skinOptionText}>{availableThemes[themeKey].name}</Text>
                      </TouchableOpacity>
                    );
                    return rows;
                  }, []).map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.skinRow}>
                      {row}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Local Game</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSkinSelector(!showSkinSelector)}>
          <Ionicons name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.gameModeText}>Mode: {gameMode}</Text>
        <Text style={styles.currentPlayerText}>
          Current Turn: Player {currentPlayer}
        </Text>
      </View>

      {/* Guess History - Moved to top */}
      <View style={styles.guessHistoryContainer}>
        <View style={styles.historyRow}>
          {renderGuessHistory(guesses.player1, 1)}
          {renderGuessHistory(guesses.player2, 2)}
        </View>
      </View>

      {/* Input Section - Moved to bottom */}
      <View style={styles.inputSection}>
        {/* Input Boxes */}
        {renderInputBoxes()}

        {/* Number Buttons */}
        {renderNumberButtons()}
      </View>

      {/* Skin Selector Popup */}
      {showSkinSelector && (
        <TouchableOpacity
          style={styles.skinSelectorOverlay}
          activeOpacity={1}
          onPress={() => setShowSkinSelector(false)}
        >
          <TouchableOpacity
            style={styles.skinSelectorPopup}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.skinSelectorHeader}>
              <Text style={styles.skinSelectorTitle}>Input Box Style</Text>
              <TouchableOpacity onPress={() => setShowSkinSelector(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.skinGrid}>
                {Object.keys(availableThemes).reduce((rows, themeKey, index) => {
                  const rowIndex = Math.floor(index / 3);
                  if (!rows[rowIndex]) {
                    rows[rowIndex] = [];
                  }
                  rows[rowIndex].push(
                    <TouchableOpacity
                      key={themeKey}
                      style={[styles.skinOption, selectedSkin === themeKey && styles.skinOptionSelected]}
                      onPress={() => {
                        setSelectedSkin(themeKey);
                        console.log('Theme changed to:', themeKey);
                        console.log('Applied theme style:', getThemeStyle(themeKey));
                      }}
                    >
                      <View style={[styles.skinOptionPreview, getThemePreviewStyle(themeKey)]}>
                        {getThemeImageSource(availableThemes[themeKey]) && (
                          <Image
                            source={getThemeImageSource(availableThemes[themeKey])}
                            style={styles.themePreviewImage}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                      <Text style={styles.skinOptionText}>{availableThemes[themeKey].name}</Text>
                    </TouchableOpacity>
                  );
                  return rows;
                }, []).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.skinRow}>
                    {row}
                  </View>
                ))}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(16),
    paddingTop: getResponsivePadding(32),
  },
  backButton: {
    padding: scale(8),
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  settingsButton: {
    padding: scale(8),
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: getResponsivePadding(20),
  },
  gameModeText: {
    fontSize: getResponsiveFontSize(16),
    color: '#4a90e2',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  currentPlayerText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: getResponsivePadding(10),
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: getResponsivePadding(20),
    width: '100%',
    flexWrap: 'wrap',
  },
  inputBoxWrapper: {
    marginHorizontal: scale(5),
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputBoxImage: {
    width: getResponsiveButtonSize(60),
    height: getResponsiveButtonSize(60),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputBoxDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
  },
  inputBoxGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#ffd700',
  },
  inputBoxNeon: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderColor: '#00ffff',
  },
  inputBoxCrystal: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: '#8a2be2',
  },
  inputBoxDigit: {
    position: 'absolute',
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  themeImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  themePreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  numberButtonsContainer: {
    marginBottom: spacing.lg,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  numberButton: {
    width: Math.min((width - getResponsivePadding(48)) / 5, getResponsiveButtonSize(64)),
    height: getResponsiveButtonSize(48),
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  numberButtonText: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: scale(10),
    flexWrap: 'wrap',
  },
  deleteButton: {
    width: Math.min((width - getResponsivePadding(72)) / 4, getResponsiveButtonSize(72)),
    height: getResponsiveButtonSize(48),
    backgroundColor: '#dc3545',
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c82333',
    marginBottom: spacing.xs,
  },
  clearButton: {
    width: Math.min((width - getResponsivePadding(72)) / 4, getResponsiveButtonSize(72)),
    height: getResponsiveButtonSize(48),
    backgroundColor: '#ffc107',
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0a800',
    marginBottom: spacing.xs,
  },
  submitButton: {
    width: Math.min((width - getResponsivePadding(72)) / 4, getResponsiveButtonSize(72)),
    height: getResponsiveButtonSize(48),
    backgroundColor: '#28a745',
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e7e34',
    marginBottom: spacing.xs,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    borderColor: '#545b62',
  },
  submitButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
  },
  skinSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  skinSelectorPopup: {
    backgroundColor: '#1a1a2e',
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(20),
    width: getResponsiveContainerWidth(90),
    maxWidth: 400,
    maxHeight: responsiveHeight(60),
    borderWidth: 2,
    borderColor: '#4a90e2',
    position: 'absolute',
    bottom: '40%',
  },
  skinSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  skinSelector: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: spacing.lg,
  },
  skinSelectorTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  skinOption: {
    alignItems: 'center',
    padding: getResponsivePadding(10),
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: Math.min((width - getResponsivePadding(40)) / 8, getResponsiveButtonSize(80)),
    maxWidth: getResponsiveButtonSize(100),
  },
  skinOptionSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  skinOptionPreview: {
    width: 40,
    height: 40,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 2,
  },
  skinPreviewDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
  },
  skinPreviewGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#ffd700',
  },
  skinPreviewNeon: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderColor: '#00ffff',
  },
  skinPreviewCrystal: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: '#8a2be2',
  },
  skinOptionText: {
    fontSize: 12,
    color: '#fff',
  },
  skinGrid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  skinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  guessHistoryContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyRow: {
    flexDirection: 'row',
    flex: 1,
  },
  guessHistorySection: {
    flex: 1,
    marginHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  guessList: {
    maxHeight: height * 0.4,
  },
  noGuesses: {
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  guessItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guessNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackDots: {
    alignItems: 'center',
    marginLeft: 10,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  feedbackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  exactDot: {
    backgroundColor: '#28a745', // Green for exact matches
  },
  misplacedDot: {
    backgroundColor: '#ffc107', // Yellow for misplaced
  },
  outOfPlaceDot: {
    backgroundColor: '#dc3545', // Red for out of place
  },
  correctDot: {
    backgroundColor: '#17a2b8', // Blue for total correct in hard mode
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  winnerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
    textAlign: 'center',
  },
  finalStats: {
    marginBottom: 30,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  newGameButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  newGameButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
