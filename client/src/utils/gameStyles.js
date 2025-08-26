import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const commonGameStyles = StyleSheet.create({
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholder: {
    width: 50,
  },

  // Game info styles
  gameInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  gameModeText: {
    fontSize: 18,
    color: '#4a90e2',
    fontWeight: '600',
    marginBottom: 10,
  },
  currentPlayerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },

  // Input section styles
  inputSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Guess history styles
  guessHistoryContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyRow: {
    flexDirection: 'row',
    flex: 1,
  },

  // Finished game styles
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
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Waiting/Setup styles
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
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

  // Opponent status styles
  opponentStatus: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  opponentLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  typingIndicator: {
    alignItems: 'center',
  },
  typingText: {
    color: '#4a90e2',
    fontSize: 14,
    fontStyle: 'italic',
  },
  typingInput: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 5,
  },
  notTypingText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
