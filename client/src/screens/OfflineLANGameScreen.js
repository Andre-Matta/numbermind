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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OfflineLANService from '../services/OfflineLANService';
import { useData } from '../context/DataContext';

const { width, height } = Dimensions.get('window');

export default function OfflineLANGameScreen({ roomId, onBack, onGameEnd }) {
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
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isHost, setIsHost] = useState(false);
  
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
    setupOfflineLANGame();
    
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
      // Clean up OfflineLANService event handlers
      OfflineLANService.setOnPeerConnected(null);
      OfflineLANService.setOnPeerDisconnected(null);
      OfflineLANService.setOnMessageReceived(null);
    };
  }, [onBack]);

  const handleBack = () => {
    // Don't disconnect when going back to lobby - preserve the connection
    // The service will handle reconnection automatically
    console.log('🔙 Returning to LAN lobby - preserving connection');
    
    // Navigate back
    onBack();
  };

  const setupOfflineLANGame = async () => {
    console.log('🔧 Setting up offline LAN game...');
    
    try {
      // Check if we're hosting this room
      const serviceStatus = OfflineLANService.getStatus();
      const isHosting = serviceStatus.isHost && serviceStatus.roomId === roomId;
      setIsHost(isHosting);
      
      console.log('🔍 OfflineLANService status:', serviceStatus);
      console.log('🏠 Is host:', isHosting);
      
      if (isHosting) {
        // We're hosting, wait for players to join
        setGameState('waiting');
        setConnectionStatus('connected');
        
        // Set up event handlers for when players join
        OfflineLANService.setOnPeerConnected(handlePlayerJoined);
        OfflineLANService.setOnPeerDisconnected(handlePlayerLeft);
        OfflineLANService.setOnMessageReceived(handleGameMessage);
        
        console.log('✅ Host mode - waiting for players to join');
      } else {
        // We're joining an existing room
        setGameState('waiting');
        setConnectionStatus('connected');
        
        // Set up event handlers
        OfflineLANService.setOnPeerConnected(handlePlayerJoined);
        OfflineLANService.setOnPeerDisconnected(handlePlayerLeft);
        OfflineLANService.setOnMessageReceived(handleGameMessage);
        
        console.log('✅ Client mode - connected to room');
      }
      
             // Set up typing listener after peer connection is established
       // This will be called when a player joins, not immediately
       console.log('⏳ Waiting for peer connection before setting up typing listener...');
      
    } catch (error) {
      console.error('❌ Error setting up offline LAN game:', error);
      setConnectionStatus('error');
      Alert.alert('Connection Error', 'Failed to connect to offline LAN room: ' + error.message);
    }
  };

  const handlePlayerJoined = (peerId) => {
    console.log('👥 Player joined offline LAN room:', peerId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Set up typing listener now that we have a peer connection
    setupTypingListener();
    
    // Transition to setup state when player joins
    setGameState('setup');
    Alert.alert('Player Joined!', 'Both players are now in the room. Enter your secret number to start the game.');
  };

  const handlePlayerLeft = (peerId) => {
    console.log('👋 Player left offline LAN room:', peerId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Transition back to waiting state
    setGameState('waiting');
    Alert.alert('Player Left', 'The other player has left the room. You can wait for them to rejoin or go back to the lobby.');
  };

  const handleGameMessage = (message) => {
    console.log('📨 Received game message:', message);
    
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'guess':
          handleOpponentGuess(data);
          break;
        case 'number_submitted':
          handleOpponentNumberSubmitted(data);
          break;
        case 'game_start':
          handleGameStart(data);
          break;
        case 'game_end':
          handleGameEnd(data);
          break;
        case 'typing':
          handleOpponentTyping(data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing game message:', error);
    }
  };

  const setupTypingListener = () => {
    console.log('⌨️ Setting up offline LAN typing listener...');
    
    // Check if we're connected to any offline LAN room
    const serviceStatus = OfflineLANService.getStatus();
    if (serviceStatus.isConnected && serviceStatus.roomId) {
      console.log('✅ Offline LAN typing listener set up for room:', serviceStatus.roomId);
      // In offline LAN, we'll handle typing through the message system
    } else {
      console.log('❌ Not connected to offline LAN room, skipping typing handler');
      console.log('Service status:', serviceStatus);
    }
  };

  const handleOpponentGuess = (data) => {
    console.log('🎯 Opponent guess received:', data);
    
    if (data.roomId === roomId) {
      const newGuess = {
        guess: data.guess,
        feedback: data.feedback,
        timestamp: Date.now(),
        isOpponent: true
      };
      
      setOpponentGuesses(prev => [...prev, newGuess]);
      
      // Check if opponent won
      if (data.feedback.every(f => f === 'correct')) {
        handleGameEnd({ winner: 'opponent', reason: 'Opponent guessed the number correctly!' });
      } else {
        // Switch turns
        setIsMyTurn(true);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleOpponentNumberSubmitted = (data) => {
    console.log('🔢 Opponent number submitted:', data);
    
    if (data.roomId === roomId) {
      // Both players have submitted numbers, start the game
      setGameState('playing');
      setIsMyTurn(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Game Started!', 'Both players have submitted their numbers. Start guessing!');
    }
  };

  const handleGameStart = (data) => {
    console.log('🚀 Game start received:', data);
    
    if (data.roomId === roomId) {
      setGameState('playing');
      setIsMyTurn(data.startingPlayer === 'host' ? isHost : !isHost);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGameEnd = (data) => {
    console.log('🏁 Game end received:', data);
    
    if (data.roomId === roomId) {
      setGameState('finished');
      setGameResult(data);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show game result
      const resultMessage = data.winner === 'host' 
        ? (isHost ? 'You won!' : 'You lost!')
        : (isHost ? 'You lost!' : 'You won!');
      
      Alert.alert('Game Over!', resultMessage + '\n\n' + (data.reason || ''), [
        { text: 'Play Again', onPress: () => resetGame() },
        { text: 'Back to Lobby', onPress: handleBack }
      ]);
    }
  };

  const handleOpponentTyping = (data) => {
    if (data.roomId === roomId) {
      setOpponentTyping(true);
      setOpponentInput(data.input || '');
      
      // Clear typing indicator after delay
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setOpponentTyping(false);
        setOpponentInput('');
      }, 2000);
    }
  };

  const sendGameMessage = (message) => {
    try {
      // Check if we're connected to any offline LAN room
      const serviceStatus = OfflineLANService.getStatus();
      if (serviceStatus.isConnected && serviceStatus.roomId) {
        const messageData = {
          ...message,
          roomId: serviceStatus.roomId, // Use the service's room ID
          timestamp: Date.now()
        };
        
        OfflineLANService.sendGameMessage(JSON.stringify(messageData));
        return true;
      }
      console.log('❌ Cannot send message - not connected to offline LAN room');
      return false;
    } catch (error) {
      console.error('Error sending game message:', error);
      return false;
    }
  };

  const submitSecretNumber = async () => {
    if (currentGuess.some(digit => digit === '')) {
      Alert.alert('Error', 'Please enter a complete 5-digit number');
      return;
    }

    setIsSubmittingNumber(true);
    
    try {
      const number = currentGuess.join('');
      setSecretNumber([...currentGuess]);
      setHasSubmittedNumber(true);
      
      // Send number submission message
      sendGameMessage({
        type: 'number_submitted',
        number: number,
        roomId: roomId
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // If we're the host, we can start the game
      if (isHost) {
        // Wait a bit for the other player
        setTimeout(() => {
          if (gameState === 'setup') {
            // Start the game
            sendGameMessage({
              type: 'game_start',
              startingPlayer: 'host',
              roomId: roomId
            });
            
            setGameState('playing');
            setIsMyTurn(true);
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error submitting number:', error);
      Alert.alert('Error', 'Failed to submit number');
    } finally {
      setIsSubmittingNumber(false);
    }
  };

  const submitGuess = async () => {
    if (currentGuess.some(digit => digit === '')) {
      Alert.alert('Error', 'Please enter a complete 5-digit number');
      return;
    }

    if (!isMyTurn) {
      Alert.alert('Not Your Turn', 'Please wait for your opponent to make their move');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const guess = currentGuess.join('');
      const feedback = calculateFeedback(guess, secretNumber);
      
      const newGuess = {
        guess: guess,
        feedback: feedback,
        timestamp: Date.now(),
        isOpponent: false
      };
      
      setGuesses(prev => [...prev, newGuess]);
      setCurrentGuess(['', '', '', '', '']);
      setIsMyTurn(false);
      
      // Send guess to opponent
      sendGameMessage({
        type: 'guess',
        guess: guess,
        feedback: feedback,
        roomId: roomId
      });
      
      // Check if we won
      if (feedback.every(f => f === 'correct')) {
        handleGameEnd({ winner: 'client', reason: 'You guessed the number correctly!' });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      Alert.alert('Error', 'Failed to submit guess');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFeedback = (guess, secret) => {
    const guessDigits = guess.split('').map(Number);
    const secretDigits = secret.map(Number);
    const feedback = [];
    
    for (let i = 0; i < 5; i++) {
      if (guessDigits[i] === secretDigits[i]) {
        feedback.push('correct');
      } else if (secretDigits.includes(guessDigits[i])) {
        feedback.push('wrong_position');
      } else {
        feedback.push('incorrect');
      }
    }
    
    return feedback;
  };

  const resetGame = () => {
    setGameState('setup');
    setCurrentGuess(['', '', '', '', '']);
    setSecretNumber(['', '', '', '', '']);
    setGuesses([]);
    setOpponentGuesses([]);
    setHasSubmittedNumber(false);
    setIsMyTurn(false);
    setGameResult(null);
    
    // Reset animations
    boxAnimations.forEach(anim => anim.setValue(1));
    secretBoxAnimations.forEach(anim => anim.setValue(1));
  };

  const handleNumberButtonPress = (number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const emptyIndex = currentGuess.findIndex(digit => digit === '');
    if (emptyIndex !== -1) {
      const newGuess = [...currentGuess];
      newGuess[emptyIndex] = number.toString();
      setCurrentGuess(newGuess);
      
      // Send typing indicator
      sendGameMessage({
        type: 'typing',
        input: newGuess.join(''),
        roomId: roomId
      });
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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

  const handleAutoFill = () => {
    const number = [];
    for (let i = 0; i < 5; i++) {
      number.push(Math.floor(Math.random() * 10).toString());
    }
    setCurrentGuess(number);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDigitInput = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newGuess = [...currentGuess];
      newGuess[index] = value;
      setCurrentGuess(newGuess);
      
      // Move to next input if digit entered
      if (value && index < 4) {
        inputRef.current?.focus();
      }
      
      // Send typing indicator
      sendGameMessage({
        type: 'typing',
        input: newGuess.join(''),
        roomId: roomId
      });
    }
  };

  const renderGameSetup = () => (
    <View style={styles.setupContainer}>
      <Text style={styles.setupTitle}>Enter Your Secret Number</Text>
      <Text style={styles.setupSubtitle}>
        Choose a 5-digit number. Your opponent will try to guess it!
      </Text>
      
      {/* Input Boxes */}
      <View style={styles.inputBoxesContainer}>
        {currentGuess.map((digit, index) => (
          <View key={index} style={styles.inputBoxWrapper}>
            <View style={styles.inputBoxImage}>
              <Text style={styles.inputBoxDigit}>{digit || '?'}</Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Number Buttons */}
      <View style={styles.numberButtonsContainer}>
        <View style={styles.numberRow}>
          {[1, 2, 3, 4, 5].map(number => (
            <TouchableOpacity
              key={number}
              style={styles.numberButton}
              onPress={() => handleNumberButtonPress(number)}
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
              onPress={() => handleNumberButtonPress(number)}
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
            style={styles.autoFillButton} 
            onPress={handleAutoFill}
          >
            <Text style={styles.autoFillButtonText}>Auto-fill</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={submitSecretNumber}
        disabled={isSubmittingNumber || currentGuess.some(digit => digit === '')}
      >
        {isSubmittingNumber ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Submit Number</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.waitingText}>
        Waiting for opponent to submit their number...
      </Text>
    </View>
  );

  const renderGamePlay = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>Guess the Number!</Text>
        <Text style={styles.turnIndicator}>
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </Text>
      </View>
      
      <View style={styles.inputBoxesContainer}>
        {currentGuess.map((digit, index) => (
          <View key={index} style={styles.inputBoxWrapper}>
            <View style={[styles.inputBoxImage, !isMyTurn && styles.inputBoxDisabled]}>
              <Text style={styles.inputBoxDigit}>{digit || '?'}</Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Number Buttons - Only show when it's the player's turn */}
      {isMyTurn && (
        <View style={styles.numberButtonsContainer}>
          <View style={styles.numberRow}>
            {[1, 2, 3, 4, 5].map(number => (
              <TouchableOpacity
                key={number}
                style={styles.numberButton}
                onPress={() => handleNumberButtonPress(number)}
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
                onPress={() => handleNumberButtonPress(number)}
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
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={submitGuess}
        disabled={isSubmitting || !isMyTurn || currentGuess.some(digit => digit === '')}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Submit Guess</Text>
        )}
      </TouchableOpacity>
      
      {/* Game History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Game History</Text>
        <ScrollView style={styles.historyList}>
          {guesses.map((guess, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyGuess}>Your guess: {guess.guess}</Text>
              <View style={styles.feedbackContainer}>
                {guess.feedback.map((feedback, i) => (
                  <View key={i} style={[styles.feedbackDot, styles[feedback]]} />
                ))}
              </View>
            </View>
          ))}
          {opponentGuesses.map((guess, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyGuess}>Opponent's guess: {guess.guess}</Text>
              <View style={styles.feedbackContainer}>
                {guess.feedback.map((feedback, i) => (
                  <View key={i} style={[styles.feedbackDot, styles[feedback]]} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderWaiting = () => (
    <View style={styles.waitingContainer}>
      <ActivityIndicator size="large" color="#4a90e2" />
      <Text style={styles.waitingTitle}>Waiting for Players</Text>
      <Text style={styles.waitingSubtitle}>
        {isHost 
          ? "Waiting for another player to join your room..."
          : "Connected to room. Waiting for the host to start..."
        }
      </Text>
      
      <View style={styles.roomInfo}>
        <Text style={styles.roomInfoText}>Room ID: {roomId}</Text>
        <Text style={styles.roomInfoText}>
          {isHost ? "You are the host" : "Connected as player"}
        </Text>
      </View>
    </View>
  );

  const renderGameFinished = () => (
    <View style={styles.finishedContainer}>
      <Text style={styles.finishedTitle}>Game Over!</Text>
      {gameResult && (
        <>
          <Text style={styles.finishedResult}>
            {gameResult.winner === 'host' 
              ? (isHost ? 'You won!' : 'You lost!')
              : (isHost ? 'You lost!' : 'You won!')
            }
          </Text>
          <Text style={styles.finishedReason}>{gameResult.reason}</Text>
        </>
      )}
      
      <View style={styles.finishedButtons}>
        <TouchableOpacity
          style={[styles.button, styles.playAgainButton]}
          onPress={resetGame}
        >
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.buttonText}>Back to Lobby</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (gameState) {
      case 'waiting':
        return renderWaiting();
      case 'setup':
        return renderGameSetup();
      case 'playing':
        return renderGamePlay();
      case 'finished':
        return renderGameFinished();
      default:
        return renderWaiting();
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline LAN Game</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: connectionStatus === 'connected' ? '#28a745' : '#dc3545' }]} />
        <Text style={styles.statusText}>
          {connectionStatus === 'connected' ? 'Offline LAN Connected' : 'Connecting...'}
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderContent()}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  waitingSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  roomInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  roomInfoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  setupContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 50,
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
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  inputBoxWrapper: {
    marginHorizontal: 5,
  },
  inputBoxImage: {
    width: 60,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inputBoxDigit: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputBoxDisabled: {
    opacity: 0.5,
    borderColor: '#6c757d',
  },
  numberButtonsContainer: {
    marginBottom: 30,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  numberButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButton: {
    width: 60,
    height: 60,
    backgroundColor: '#dc3545',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  clearButton: {
    width: 60,
    height: 60,
    backgroundColor: '#ffc107',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  autoFillButton: {
    backgroundColor: '#6f42c1',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  autoFillButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#28a745',
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 30,
  },
  gameHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  turnIndicator: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '600',
  },
  historyContainer: {
    width: '100%',
    marginTop: 30,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  historyGuess: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  feedbackDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  correct: {
    backgroundColor: '#28a745',
  },
  wrong_position: {
    backgroundColor: '#ffc107',
  },
  incorrect: {
    backgroundColor: '#dc3545',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  finishedResult: {
    fontSize: 24,
    color: '#4a90e2',
    marginBottom: 10,
    fontWeight: '600',
  },
  finishedReason: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  finishedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  playAgainButton: {
    backgroundColor: '#28a745',
    flex: 0.45,
  },
});
