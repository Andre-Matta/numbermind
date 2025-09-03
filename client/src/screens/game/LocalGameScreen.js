import React, { useState, useEffect, useRef } from 'react';
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
  const [hasShownNumber, setHasShownNumber] = useState(false);
  const [boxAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);
  const lastGuessAnimRef = useRef(null);
  const showBtnOpacity = useRef(new Animated.Value(0)).current;
  const showBtnTranslate = useRef(new Animated.Value(10)).current;
  const showBtnScale = useRef(new Animated.Value(0.95)).current;

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

  useEffect(() => {
    if (!hasShownNumber) {
      showBtnOpacity.setValue(0);
      showBtnTranslate.setValue(10);
      showBtnScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(showBtnOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(showBtnTranslate, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.spring(showBtnScale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true })
      ]).start();
    }
  }, [hasShownNumber]);

  const handleShowMyNumber = () => {
    setHasShownNumber(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

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
    // Trigger a brief row highlight for the latest guess
    lastGuessAnimRef.current = {
      player: currentPlayer,
      anim: new Animated.Value(0)
    };
    Animated.timing(lastGuessAnimRef.current.anim, { toValue: 1, duration: 350, useNativeDriver: false }).start(() => {
      Animated.timing(lastGuessAnimRef.current.anim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    });

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
    setHasShownNumber(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculateFeedback = (guess, secretNumber, mode) => {
    // Prepare arrays
    const guessDigits = guess.split('');
    const secretDigits = secretNumber.split('');

    // First pass: count exact matches and build frequency map of remaining secret digits
    let exact = 0;
    const secretRemainderCounts = {};
    const unmatchedGuessDigits = [];
    for (let i = 0; i < 5; i++) {
      if (guessDigits[i] === secretDigits[i]) {
        exact++;
      } else {
        const s = secretDigits[i];
        secretRemainderCounts[s] = (secretRemainderCounts[s] || 0) + 1;
        unmatchedGuessDigits.push(guessDigits[i]);
      }
    }

    // Second pass: count misplaced as matches against remaining secret counts
    let misplaced = 0;
    for (const d of unmatchedGuessDigits) {
      if (secretRemainderCounts[d] > 0) {
        misplaced++;
        secretRemainderCounts[d]--;
      }
    }

    const totalCorrect = exact + misplaced;

    if (mode === 'hard') {
      // Hard mode uses exact for win logic; UI reads exact only.
      return { exact, misplaced: 0, outOfPlace: 0, totalCorrect };
    }

    const outOfPlace = 5 - totalCorrect;
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
            <Animated.View
              key={index}
              style={[
                styles.guessItem,
                (lastGuessAnimRef.current && lastGuessAnimRef.current.player === playerNumber && index === playerGuesses.length - 1) && {
                  backgroundColor: lastGuessAnimRef.current.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0.05)', 'rgba(74, 144, 226, 0.25)']
                  }),
                  shadowOpacity: lastGuessAnimRef.current.anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] }),
                  transform: [{ scale: lastGuessAnimRef.current.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
                }
              ]}
            >
              <View style={styles.guessRow}>
                {gameMode === 'hard' ? (
                  <>
                    <Text style={styles.guessNumber}>{guess.guess}</Text>
                    <View style={styles.guessRightGroup}>
                      <View
                        style={[
                          styles.correctPill,
                          (guess.feedback.exact === 0) ? styles.correctPillRed : styles.correctPillGreen,
                        ]}
                      >
                        <Text
                          style={[
                            styles.correctPillText,
                            (guess.feedback.exact === 0) ? styles.correctPillTextRed : styles.correctPillTextGreen,
                          ]}
                        >
                          {guess.feedback.exact}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.guessLeftGroup}>
                    <Text style={styles.guessNumber}>{guess.guess}</Text>
                    <View
                      style={[
                        styles.correctPill,
                        (guess.feedback.exact === 0) ? styles.correctPillRed : styles.correctPillGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.correctPillText,
                          (guess.feedback.exact === 0) ? styles.correctPillTextRed : styles.correctPillTextGreen,
                        ]}
                      >
                        {guess.feedback.exact}
                      </Text>
                    </View>
                    <View style={[styles.correctPill, styles.misplacedPillYellow]}>
                      <Text style={[styles.correctPillText, styles.misplacedPillTextYellow]}>{guess.feedback.misplaced}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
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

      {/* Show My Number / Banner */}
      <View style={styles.myNumberSection}>
        {hasShownNumber ? (
          <View style={[styles.myNumberBanner, styles.myNumberBannerHard]}>
            <Text style={styles.myNumberLabel}>Your Number</Text>
            <Text style={styles.myNumberValue}>
              {currentPlayer === 1 ? player1Number : player2Number}
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: showBtnOpacity, transform: [{ translateY: showBtnTranslate }, { scale: showBtnScale }] }}>
            <TouchableOpacity style={styles.showNumberButton} onPress={handleShowMyNumber}>
              <Text style={styles.showNumberButtonText}>Show My Number</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
    paddingHorizontal: getResponsivePadding(16),
    width: '100%',
  },
  inputBoxWrapper: {
    marginHorizontal: scale(3),
    alignItems: 'center',
    marginBottom: 0,
  },
  inputBoxImage: {
    width: (width - getResponsivePadding(48)) / 5,
    height: (width - getResponsivePadding(48)) / 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  guessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guessRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  guessLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  guessNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  guessNumberColumn: {
    flex: 1,
  },
  feedbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guessRowSpacer: {
    flex: 1,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackTextGreen: {
    color: '#28a745',
  },
  feedbackTextRed: {
    color: '#dc3545',
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
  feedbackNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  feedbackNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 6,
  },
  feedbackLabelText: {
    color: '#9fb3c8',
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackPillPrimary: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderColor: '#4a90e2',
    borderWidth: 2,
  },
  feedbackNumberTextPrimary: {
    color: '#4a90e2',
  },
  feedbackLabelTextPrimary: {
    color: '#4a90e2',
  },
  feedbackPillGreen: {
    backgroundColor: 'rgba(40, 167, 69, 0.18)',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  feedbackNumberTextGreen: {
    color: '#28a745',
  },
  correctPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  correctPillGreen: {
    backgroundColor: 'rgba(40, 167, 69, 0.18)',
    borderColor: '#28a745',
  },
  correctPillRed: {
    backgroundColor: 'rgba(220, 53, 69, 0.18)',
    borderColor: '#dc3545',
  },
  misplacedPillYellow: {
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
    borderColor: '#ffc107',
    borderWidth: 2,
  },
  correctPillText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  correctPillTextGreen: {
    color: '#28a745',
  },
  correctPillTextRed: {
    color: '#dc3545',
  },
  misplacedPillTextYellow: {
    color: '#ffc107',
    fontWeight: 'bold',
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
  myNumberSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: getResponsivePadding(20),
  },
  myNumberBanner: {
    borderWidth: 3,
    paddingVertical: getResponsivePadding(10),
    paddingHorizontal: getResponsivePadding(16),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: getResponsiveContainerWidth(60),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  myNumberBannerHard: {
    backgroundColor: '#0f3460',
    borderColor: '#00bfff',
    shadowColor: '#00bfff',
  },
  myNumberBannerDefault: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
  },
  myNumberLabel: {
    color: '#9ec7ff',
    fontSize: getResponsiveFontSize(12),
    marginBottom: 4,
  },
  myNumberValue: {
    color: '#fff',
    fontSize: getResponsiveFontSize(22),
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  showNumberButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
    borderWidth: 2,
    paddingVertical: getResponsivePadding(10),
    paddingHorizontal: getResponsivePadding(16),
    borderRadius: borderRadius.lg,
  },
  showNumberButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize(14),
  },
});
