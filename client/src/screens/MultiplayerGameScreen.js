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
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import NetworkService from '../services/NetworkService';
import { useData } from '../context/DataContext';

const { width, height } = Dimensions.get('window');

export default function MultiplayerGameScreen({ roomId, onBack, onGameEnd }) {
  const { userSkins } = useData();
  const [gameState, setGameState] = useState('waiting'); // waiting, setup, playing, finished
  const [currentGuess, setCurrentGuess] = useState(['', '', '', '', '']);
  const [secretNumber, setSecretNumber] = useState(['', '', '', '', '']);
  const [guesses, setGuesses] = useState([]);
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [opponentInput, setOpponentInput] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingNumber, setIsSubmittingNumber] = useState(false);
  const [hasSubmittedNumber, setHasSubmittedNumber] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [boxAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);
  const [secretBoxAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  // Use skins from DataContext instead of fetching
  const availableSkins = userSkins || ['default'];

  useEffect(() => {
    setupGame();
    
    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true; // Prevent default behavior
    });
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      backHandler.remove();
      // Clean up NetworkService event handlers
      NetworkService.onGameStart = null;
      NetworkService.onGuessReceived = null;
      NetworkService.onGameEnd = null;
      NetworkService.onPlayerJoined = null;
      NetworkService.onPlayerLeft = null;
      NetworkService.onDisconnect = null;
    };
  }, [onBack]);

  const handleBack = () => {
    // Clean up NetworkService if connected
    if (NetworkService.isConnected() && NetworkService.roomId === roomId) {
      NetworkService.leaveRoom();
    }
    
    // Navigate back
    onBack();
  };

  const setupGame = () => {
    console.log('🔧 Setting up multiplayer game...');
    console.log('🔍 Current NetworkService state:', {
      isConnected: NetworkService.isConnected(),
      roomId: NetworkService.roomId,
      playerId: NetworkService.playerId
    });
    
    // Set up game event listeners
    NetworkService.onGameStart = handleGameUpdate;
    NetworkService.onGuessReceived = handleOpponentGuess;
    NetworkService.onGameEnd = handleGameEnd;
    NetworkService.onPlayerJoined = handlePlayerJoined;
    NetworkService.onPlayerLeft = handlePlayerLeft;
    NetworkService.onDisconnect = handleDisconnection;
    NetworkService.onRoomReady = handleRoomReady;
    
    console.log('✅ Event listeners set up');
    
    // Check if game is already in progress
    if (NetworkService.roomId === roomId) {
      console.log('🔄 Game already in progress, checking state...');
      // Check if both players have submitted their numbers
      // Start in waiting state and let room events determine the proper state
      setGameState('waiting');
    } else {
      console.log('🆕 New game setup');
      setGameState('waiting');
    }
    
    // Set up typing listener after a short delay to ensure connection is ready
    setTimeout(() => {
      setupTypingListener();
    }, 1000);
  };

  const handlePlayerJoined = (data) => {
    console.log('👥 Player joined event received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Player joined our room');
      Alert.alert('Player Joined!', 'Another player has joined the room.');
    } else {
      console.log('❌ Player joined different room, ignoring');
    }
  };

  const handleRoomReady = (data) => {
    console.log('🏠 Room ready event received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Room is ready, transitioning to setup state');
      setGameState('setup');
      Alert.alert('Room Ready!', 'Both players are now in the room. Enter your secret number to start the game.');
    } else {
      console.log('❌ Room ready for different room, ignoring');
    }
  };

  const handlePlayerLeft = (data) => {
    console.log('👋 Player left event received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Player left our room, transitioning to waiting state');
      setGameState('waiting');
      Alert.alert('Player Left', 'The other player has left the room. You can wait for them to rejoin or go back to the lobby.');
    } else {
      console.log('❌ Player left different room, ignoring');
    }
  };

  const handleDisconnection = (error) => {
    console.log('🔌 Disconnection event received:', error);
    setConnectionError(error?.message || 'Connection lost to server');
    setGameState('waiting');
    
    // Clear any ongoing game state
    setHasSubmittedNumber(false);
    setIsMyTurn(false);
    
    // Force cleanup of the connection
    NetworkService.forceDisconnect();
    
    Alert.alert(
      'Connection Lost', 
      'Your connection to the server has been lost. Please check your internet connection and try again.',
      [
        {
          text: 'Retry',
          onPress: () => {
            setConnectionError(null);
            setupGame();
          }
        },
        {
          text: 'Go Back',
          onPress: handleBack
        }
      ]
    );
  };

  const setupTypingListener = () => {
    console.log('⌨️ Setting up typing listener...');
    // Check if NetworkService is connected and has the typing handler
    if (NetworkService.socket && NetworkService.socket.connected) {
      console.log('✅ NetworkService connected, setting up typing handler');
      NetworkService.onPlayerTyping((data) => {
        console.log('⌨️ Typing event received:', data);
        if (data.roomId === roomId && data.playerId !== NetworkService.playerId) {
          console.log('✅ Typing event for our room, updating UI');
          setOpponentTyping(data.isTyping);
          setOpponentInput(data.currentInput || '');
        } else {
          console.log('❌ Typing event ignored - wrong room or same player');
        }
      });
    } else {
      console.log('❌ NetworkService not connected, skipping typing handler');
    }
  };

  const handleGameUpdate = (data) => {
    console.log('🎮 Game update received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Game update for our room, transitioning to playing state');
      console.log('✅ Game state transitioning from', gameState, 'to playing');
      setGameState('playing');
      const isMyTurnNow = data.currentTurn === NetworkService.playerId;
      console.log('🎯 Current turn:', data.currentTurn, 'Player ID:', NetworkService.playerId, 'Is my turn:', isMyTurnNow);
      setIsMyTurn(isMyTurnNow);
    } else {
      console.log('❌ Game update for different room, ignoring');
    }
  };

  const handleOpponentGuess = (data) => {
    console.log('🎯 Opponent guess event received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Opponent guess for our room, processing...');
      const guessData = data.guess;
      
      // Add to opponent guesses with proper feedback structure
      const opponentGuess = {
        guess: guessData.guess,
        feedback: guessData.feedback,
        timestamp: new Date(guessData.timestamp)
      };
      
      setOpponentGuesses(prev => [...prev, opponentGuess]);
      
      // Switch turn to current player
      setIsMyTurn(true);
      
      console.log('🎯 Opponent guess received:', opponentGuess);
      console.log('🔄 Turn switched to current player');
    } else {
      console.log('❌ Opponent guess for different room, ignoring');
    }
  };

  const handleGameEnd = (data) => {
    console.log('🏁 Game end event received:', data);
    console.log('🔍 Current roomId:', roomId, 'Event roomId:', data.roomId);
    if (data.roomId === roomId) {
      console.log('✅ Game end for our room, transitioning to finished state');
      setGameState('finished');
      setGameResult(data);
      onGameEnd && onGameEnd(data);
    } else {
      console.log('❌ Game end for different room, ignoring');
    }
  };

  const handleNumberPress = (number, isSecret = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isSecret) {
      const emptyIndex = secretNumber.findIndex(digit => digit === '');
      if (emptyIndex !== -1) {
        const newNumber = [...secretNumber];
        newNumber[emptyIndex] = number.toString();
        setSecretNumber(newNumber);
        
        // Animate the box
        Animated.sequence([
          Animated.timing(secretBoxAnimations[emptyIndex], {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(secretBoxAnimations[emptyIndex], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
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
    }
    
    // Send typing update to opponent (only for guesses, not secret number)
    if (!isSecret && NetworkService.isConnected()) {
      const text = [...currentGuess, number.toString()].join('').slice(0, 5);
      NetworkService.sendTypingUpdate(true, text);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (NetworkService.isConnected()) {
        NetworkService.sendTypingUpdate(false);
      }
    }, 1000);
  };

  const handleDelete = (isSecret = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isSecret) {
      const lastFilledIndex = secretNumber.findLastIndex(digit => digit !== '');
      if (lastFilledIndex !== -1) {
        const newNumber = [...secretNumber];
        newNumber[lastFilledIndex] = '';
        setSecretNumber(newNumber);
      }
    } else {
      const lastFilledIndex = currentGuess.findLastIndex(digit => digit !== '');
      if (lastFilledIndex !== -1) {
        const newGuess = [...currentGuess];
        newGuess[lastFilledIndex] = '';
        setCurrentGuess(newGuess);
      }
    }
  };

  const handleClear = (isSecret = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isSecret) {
      setSecretNumber(['', '', '', '', '']);
    } else {
      setCurrentGuess(['', '', '', '', '']);
    }
  };

  const handleTyping = (text) => {
    setCurrentGuess(text);
    
    // Send typing update to opponent only if connected
    if (NetworkService.isConnected()) {
      NetworkService.sendTypingUpdate(true, text);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (NetworkService.isConnected()) {
        NetworkService.sendTypingUpdate(false);
      }
    }, 1000);
  };

  const submitSecretNumber = async () => {
    if (secretNumber.some(digit => digit === '')) {
      Alert.alert('Invalid Number', 'Please enter all 5 digits');
      return;
    }

    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    // Prevent duplicate submissions
    if (hasSubmittedNumber) {
      Alert.alert('Already Submitted', 'You have already submitted your secret number. Please wait for your opponent.');
      return;
    }

    if (isSubmittingNumber) {
      Alert.alert('Already Submitting', 'Please wait while your number is being submitted...');
      return;
    }

    setIsSubmittingNumber(true);
    try {
      // Submit secret number to server
      const result = await NetworkService.startMultiplayerGame(secretNumber.join(''));
      
      if (result && result.success) {
        setHasSubmittedNumber(true); // Mark as submitted
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Secret number submitted! Waiting for opponent...');
        
        // Clear the input to show it's been submitted
        setSecretNumber(['', '', '', '', '']);
      } else {
        throw new Error(result?.error || 'Failed to submit number');
      }
      
    } catch (error) {
      console.error('Error submitting secret number:', error);
      Alert.alert('Error', error.message || 'Failed to submit secret number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmittingNumber(false);
    }
  };

  const submitGuess = async () => {
    if (currentGuess.some(digit => digit === '')) {
      Alert.alert('Invalid Guess', 'Please enter all 5 digits');
      return;
    }

    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    // Check if it's the player's turn
    if (!isMyTurn) {
      Alert.alert('Not Your Turn', 'Please wait for your opponent to make their guess first.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      Alert.alert('Already Submitting', 'Please wait while your guess is being submitted...');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit guess to server
      const result = await NetworkService.submitGuess(currentGuess.join(''));
      
      if (result && result.success) {
        // Add to local guesses with feedback
        const guessWithFeedback = {
          guess: currentGuess.join(''),
          feedback: result.feedback,
          timestamp: Date.now()
        };
        
        setGuesses(prev => [...prev, guessWithFeedback]);
        setCurrentGuess(['', '', '', '', '']);
        setIsMyTurn(false);
        
        // Stop typing indicator
        if (NetworkService.isConnected()) {
          NetworkService.sendTypingUpdate(false);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(result?.error || 'Failed to submit guess');
      }
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      Alert.alert('Error', error.message || 'Failed to submit guess');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGuessHistory = (guessList, title, isOpponent = false) => (
    <View style={styles.guessSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView style={styles.guessList} showsVerticalScrollIndicator={false}>
        {guessList.length === 0 ? (
          <Text style={styles.noGuesses}>No guesses yet</Text>
        ) : (
          guessList.map((guess, index) => (
            <View key={index} style={styles.guessItem}>
              <View style={styles.guessRow}>
                <Text style={styles.guessText}>{guess.guess}</Text>
                {guess.feedback && (
                  <View style={styles.feedbackDots}>
                    <View style={styles.dotRow}>
                      {[...Array(guess.feedback.exact || 0)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.exactDot]} />
                      ))}
                      {[...Array(guess.feedback.misplaced || 0)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.misplacedDot]} />
                      ))}
                      {[...Array(guess.feedback.outOfPlace || 0)].map((_, i) => (
                        <View key={i} style={[styles.feedbackDot, styles.outOfPlaceDot]} />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderOpponentStatus = () => (
    <View style={styles.opponentStatus}>
      <Text style={styles.opponentLabel}>Opponent Status:</Text>
      {opponentTyping ? (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Typing...</Text>
          {opponentInput && (
            <Text style={styles.typingInput}>{opponentInput}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.notTypingText}>Not typing</Text>
      )}
    </View>
  );

  const renderInputBoxes = (isSecret = false) => {
    const currentNumber = isSecret ? secretNumber : currentGuess;
    const animations = isSecret ? secretBoxAnimations : boxAnimations;
    
    return (
      <View style={styles.inputBoxesContainer}>
        {currentNumber.map((digit, index) => (
          <View key={index} style={styles.inputBoxWrapper}>
            <Animated.View 
              style={[
                styles.inputBoxImage, 
                { transform: [{ scale: animations[index] }] }
              ]}
            >
              <Text style={styles.inputBoxDigit}>{digit}</Text>
            </Animated.View>
          </View>
        ))}
      </View>
    );
  };

  const renderNumberButtons = (isSecret = false) => (
    <View style={styles.numberButtonsContainer}>
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number, isSecret)}
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
            onPress={() => handleNumberPress(number, isSecret)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(isSecret)}>
          <Ionicons name="backspace" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={() => handleClear(isSecret)}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitButton, (isSecret ? secretNumber.some(d => d === '') : currentGuess.some(d => d === '')) && styles.submitButtonDisabled]} 
          onPress={isSecret ? submitSecretNumber : submitGuess}
          disabled={
            (isSecret ? secretNumber.some(d => d === '') : currentGuess.some(d => d === '')) || 
            (isSecret ? isSubmittingNumber : isSubmitting) ||
            (isSecret && hasSubmittedNumber) // Disable if secret number already submitted
          }
        >
          {isSecret ? (
            hasSubmittedNumber ? (
              <Text style={styles.submitButtonText}>Number Submitted ✓</Text>
            ) : isSubmittingNumber ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Secret Number</Text>
            )
          ) : (
            isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Guess</Text>
            )
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (gameState === 'waiting') {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Waiting for Opponent</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.waitingContainer}>
          {connectionError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={48} color="#dc3545" />
              <Text style={styles.errorText}>Connection Error</Text>
              <Text style={styles.errorDescription}>{connectionError}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  setConnectionError(null);
                  setupGame();
                }}
              >
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color="#4a90e2" />
              <Text style={styles.waitingText}>Waiting for opponent to join...</Text>
              <Text style={styles.roomIdText}>Room: {roomId}</Text>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
                <Text style={styles.cancelButtonText}>Cancel & Return to Lobby</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    );
  }

  if (gameState === 'setup') {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
                 <View style={styles.header}>
           <TouchableOpacity style={styles.backButton} onPress={handleBack}>
             <Ionicons name="arrow-back" size={24} color="#fff" />
           </TouchableOpacity>
           <Text style={styles.title}>Setup Game</Text>
           <View style={styles.placeholder} />
         </View>

        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Enter Your Secret Number</Text>
          <Text style={styles.setupSubtitle}>
            Choose a 5-digit number for your opponent to guess
          </Text>
          
          {renderInputBoxes(true)}
          {renderNumberButtons(true)}

          <Text style={styles.roomIdText}>Room: {roomId}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (gameState === 'finished') {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.finishedContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          {gameResult && (
            <Text style={styles.resultText}>
              {gameResult.winner === NetworkService.playerId ? 'You Won!' : 'You Lost!'}
            </Text>
          )}
                     <TouchableOpacity style={styles.backButton} onPress={handleBack}>
             <Text style={styles.backButtonText}>Back to Lobby</Text>
           </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
             {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={handleBack}>
           <Ionicons name="arrow-back" size={24} color="#fff" />
         </TouchableOpacity>
         <Text style={styles.title}>Multiplayer Game</Text>
         <View style={styles.placeholder} />
       </View>

      {/* Room Info */}
      <View style={styles.roomInfo}>
        <Text style={styles.roomId}>Room: {roomId}</Text>
        <Text style={styles.turnIndicator}>
          {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
        </Text>
      </View>

      {/* Opponent Status */}
      {renderOpponentStatus()}

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter your guess (5 digits):</Text>
          {renderInputBoxes(false)}
          {renderNumberButtons(false)}
        </View>

        {/* Guesses Section */}
        <View style={styles.guessesContainer}>
          {renderGuessHistory(guesses, 'Your Guesses')}
          {renderGuessHistory(opponentGuesses, 'Opponent\'s Guesses', true)}
        </View>
      </View>
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
    padding: 20,
    paddingTop: 40,
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
  roomInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roomId: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 5,
  },
  turnIndicator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  opponentStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  opponentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typingText: {
    color: '#28a745',
    fontSize: 14,
  },
  typingInput: {
    color: '#6c757d',
    fontSize: 12,
    fontStyle: 'italic',
  },
  notTypingText: {
    color: '#6c757d',
    fontSize: 14,
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    color: '#fff',
    marginRight: 10,
  },
  inputDisabled: {
    borderColor: '#6c757d',
    color: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  guessesContainer: {
    flex: 1,
  },
  guessSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  guessList: {
    maxHeight: 250,
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
  guessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },

     waitingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
     paddingTop: 0,
   },
  waitingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  roomIdText: {
    color: '#4a90e2',
    fontSize: 16,
    marginTop: 10,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameOverText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultText: {
    color: '#28a745',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
     setupSubtitle: {
     fontSize: 16,
     color: '#6c757d',
     marginBottom: 30,
     textAlign: 'center',
     paddingHorizontal: 20,
   },
   cancelButton: {
     backgroundColor: '#dc3545',
     paddingHorizontal: 30,
     paddingVertical: 15,
     borderRadius: 15,
     marginTop: 30,
   },
   cancelButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: 'bold',
   },
   inputBoxesContainer: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 30,
     paddingHorizontal: 20,
     width: '100%',
   },
   inputBoxWrapper: {
     marginHorizontal: 5,
     alignItems: 'center',
   },
   inputBoxImage: {
     width: 60,
     height: 60,
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
     elevation: 5,
   },
   inputBoxDigit: {
     position: 'absolute',
     fontSize: 24,
     fontWeight: 'bold',
     color: '#fff',
     textShadowColor: 'rgba(0, 0, 0, 0.8)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 3,
   },
   numberButtonsContainer: {
     paddingHorizontal: 20,
     marginBottom: 20,
   },
   numberRow: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     marginBottom: 15,
   },
   numberButton: {
     width: (width - 60) / 5,
     height: 50,
     backgroundColor: 'rgba(74, 144, 226, 0.8)',
     borderRadius: 25,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#4a90e2',
   },
   numberButtonText: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#fff',
   },
   actionRow: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     alignItems: 'center',
     gap: 10,
   },
   deleteButton: {
     width: (width - 80) / 4,
     height: 50,
     backgroundColor: '#dc3545',
     borderRadius: 25,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#c82333',
   },
   clearButton: {
     width: (width - 80) / 4,
     height: 50,
     backgroundColor: '#ffc107',
     borderRadius: 25,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#e0a800',
   },
   submitButton: {
     width: (width - 80) / 4,
     height: 50,
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
   submitButtonDisabled: {
     backgroundColor: '#6c757d',
     opacity: 0.6,
   },
   errorContainer: {
     alignItems: 'center',
     padding: 20,
   },
   errorText: {
     color: '#dc3545',
     fontSize: 20,
     fontWeight: 'bold',
     marginTop: 15,
     marginBottom: 10,
   },
   errorDescription: {
     color: '#fff',
     fontSize: 16,
     textAlign: 'center',
     marginBottom: 20,
   },
   retryButton: {
     backgroundColor: '#4a90e2',
     paddingHorizontal: 30,
     paddingVertical: 15,
     borderRadius: 15,
   },
   retryButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: 'bold',
   },
   guessRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
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
 });
