import { StyleSheet, Dimensions } from 'react-native';
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  responsiveWidth, 
  responsiveHeight,
  getResponsivePadding,
  getResponsiveMargin,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  getResponsiveContainerWidth,
  getSafeAreaPadding,
  spacing,
  borderRadius,
  isSmallDevice,
  isTablet
} from './responsiveUtils';

const { width, height } = Dimensions.get('window');

export const commonGameStyles = StyleSheet.create({
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getSafeAreaPadding(50),
    paddingBottom: getResponsivePadding(20),
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.round,
    width: getResponsiveButtonSize(50),
    height: getResponsiveButtonSize(50),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.round,
    width: getResponsiveButtonSize(50),
    height: getResponsiveButtonSize(50),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholder: {
    width: getResponsiveButtonSize(50),
  },

  // Game info styles
  gameInfo: {
    alignItems: 'center',
    paddingVertical: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(20),
  },
  gameModeText: {
    fontSize: getResponsiveFontSize(18),
    color: '#4a90e2',
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  currentPlayerText: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Input section styles
  inputSection: {
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(20),
    width: '100%',
  },

  // Guess history styles
  guessHistoryContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(20),
    maxHeight: responsiveHeight(40),
  },
  historyRow: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },

  // Finished game styles
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsivePadding(20),
    maxWidth: getResponsiveContainerWidth(90),
    alignSelf: 'center',
  },
  winnerText: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  gameOverText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  resultText: {
    color: '#28a745',
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  finalStats: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  statsText: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  newGameButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: getResponsivePadding(30),
    paddingVertical: getResponsivePadding(15),
    borderRadius: borderRadius.lg,
    minWidth: getResponsiveButtonSize(120),
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },

  // Waiting/Setup styles
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsivePadding(20),
    paddingTop: 0,
    maxWidth: getResponsiveContainerWidth(90),
    alignSelf: 'center',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsivePadding(20),
    maxWidth: getResponsiveContainerWidth(90),
    alignSelf: 'center',
  },
  setupTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#6c757d',
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: getResponsivePadding(20),
  },
  waitingText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(18),
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  roomIdText: {
    color: '#4a90e2',
    fontSize: getResponsiveFontSize(16),
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: getResponsivePadding(30),
    paddingVertical: getResponsivePadding(15),
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    minWidth: getResponsiveButtonSize(120),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },

  // Opponent status styles
  opponentStatus: {
    alignItems: 'center',
    paddingVertical: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(20),
    width: '100%',
  },
  opponentLabel: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  typingIndicator: {
    alignItems: 'center',
  },
  typingText: {
    color: '#4a90e2',
    fontSize: getResponsiveFontSize(14),
    fontStyle: 'italic',
    textAlign: 'center',
  },
  typingInput: {
    color: '#6c757d',
    fontSize: getResponsiveFontSize(12),
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  notTypingText: {
    color: '#6c757d',
    fontSize: getResponsiveFontSize(14),
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

// Responsive container styles
export const responsiveContainerStyles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: getSafeAreaPadding(0),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    maxWidth: getResponsiveContainerWidth(90),
    alignSelf: 'center',
  },
  fullWidthContainer: {
    width: '100%',
    paddingHorizontal: getResponsivePadding(20),
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: getResponsivePadding(20),
    marginVertical: spacing.sm,
    width: '100%',
    maxWidth: getResponsiveContainerWidth(95),
    alignSelf: 'center',
  },
});

// Responsive button styles
export const responsiveButtonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    borderRadius: borderRadius.lg,
    minHeight: getResponsiveButtonSize(48),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: getResponsiveButtonSize(120),
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    borderRadius: borderRadius.lg,
    minHeight: getResponsiveButtonSize(48),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: getResponsiveButtonSize(120),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    borderRadius: borderRadius.lg,
    minHeight: getResponsiveButtonSize(48),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: getResponsiveButtonSize(120),
  },
  buttonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

// Responsive text styles
export const responsiveTextStyles = StyleSheet.create({
  heading1: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heading2: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heading3: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24),
  },
  captionText: {
    fontSize: getResponsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  smallText: {
    fontSize: getResponsiveFontSize(12),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
