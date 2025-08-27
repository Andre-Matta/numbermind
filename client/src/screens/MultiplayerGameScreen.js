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
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  
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
    // Set up game event listeners
    NetworkService.onGameStart = handleGameUpdate;
    NetworkService.onGuessReceived = handleOpponentGuess;
    NetworkService.onGameEnd = handleGameEnd;
    
    // Check if game is already in progress
    if (NetworkService.roomId === roomId) {
      // Check if both players have submitted their numbers
      // For now, assume we need to set up the game
      setGameState('setup');
    }
    
    // Set up typing listener after a short delay to ensure connection is ready
    setTimeout(() => {
      setupTypingListener();
    }, 1000);
    
    // Fetch available skins
    // fetchAvailableSkins(); // This line is removed as skins are now from context
  };

  const setupTypingListener = () => {
    // Check if NetworkService is connected and has the typing handler
    if (NetworkService.socket && NetworkService.socket.connected) {
      NetworkService.onPlayerTyping((data) => {
        if (data.roomId === roomId && data.playerId !== NetworkService.playerId) {
          setOpponentTyping(data.isTyping);
          setOpponentInput(data.currentInput || '');
        }
      });
    }
  };

  const handleGameUpdate = (data) => {
    if (data.roomId === roomId) {
      setGameState('playing');
      setIsMyTurn(data.currentTurn === NetworkService.playerId);
    }
  };

  const handleOpponentGuess = (data) => {
    if (data.roomId === roomId) {
      const guessData = data.guess;
      setOpponentGuesses(prev => [...prev, {
        guess: guessData.guess,
        feedback: guessData.feedback,
        timestamp: new Date(guessData.timestamp)
      }]);
      setIsMyTurn(true);
    }
  };

  const handleGameEnd = (data) => {
    if (data.roomId === roomId) {
      setGameState('finished');
      setGameResult(data);
      onGameEnd && onGameEnd(data);
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

    setIsSubmittingNumber(true);
    try {
      // Submit secret number to server
      NetworkService.startMultiplayerGame(secretNumber.join(''));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Secret number submitted! Waiting for opponent...');
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit secret number');
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

    setIsSubmitting(true);
    try {
      // Submit guess to server
      NetworkService.submitGuess(currentGuess.join(''));
      
      // Add to local guesses
      setGuesses(prev => [...prev, {
        guess: currentGuess.join(''),
        timestamp: Date.now()
      }]);
      
      setCurrentGuess(['', '', '', '', '']);
      setIsMyTurn(false);
      
      // Stop typing indicator
      if (NetworkService.isConnected()) {
        NetworkService.sendTypingUpdate(false);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit guess');
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
          disabled={(isSecret ? secretNumber.some(d => d === '') : currentGuess.some(d => d === '')) || (isSecret ? isSubmittingNumber : isSubmitting)}
        >
          {isSecret ? (
            isSubmittingNumber ? (
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
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.waitingText}>Waiting for opponent to join...</Text>
          <Text style={styles.roomIdText}>Room: {roomId}</Text>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
            <Text style={styles.cancelButtonText}>Cancel & Return to Lobby</Text>
          </TouchableOpacity>
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
