import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, BackHandler } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';
import LoadingScreen from './src/screens/LoadingScreen';
import EnhancedMainMenu from './src/screens/EnhancedMainMenu';
import LocalGameScreen from './src/screens/LocalGameScreen';
import MultiplayerSelectionScreen from './src/screens/MultiplayerSelectionScreen';
import LANLobby from './src/screens/LANLobby';
import InternetMultiplayerLobby from './src/screens/InternetMultiplayerLobby';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import OfflineLANGameScreen from './src/screens/OfflineLANGameScreen';
import LocalGameSetup from './src/components/LocalGameSetup';
import GameRules from './src/components/GameRules';
import RankedLobby from './src/components/RankedLobby';
import PlayerProfile from './src/components/PlayerProfile';
import Leaderboard from './src/components/Leaderboard';
import Shop from './src/screens/ShopScreen';
import LoginScreen from './src/screens/LoginScreen';
import NotificationService from './src/services/NotificationService';
import NotificationCenter from './src/components/NotificationCenter';
import NotificationTester from './src/components/NotificationTester';
import EdgeGestureBlocker from './src/components/EdgeGestureBlocker';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showRules, setShowRules] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState(null);
  const [multiplayerType, setMultiplayerType] = useState(null); // 'lan' or 'internet'
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDataLoaded } = useData();

  // Handle back button and prevent app from closing unexpectedly
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on the main menu, show exit confirmation
      if (currentScreen === 'menu') {
        return false; // Allow default behavior (app minimizes)
      }
      
      // For other screens, handle back navigation
      handleBackNavigation();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [currentScreen]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeNotifications();
    }
  }, [isAuthenticated, user]);

  const initializeNotifications = async () => {
    try {
      const success = await NotificationService.initialize();
      if (success) {
        console.log('Notifications initialized successfully');
        
        // Register push token with server
        const pushToken = await NotificationService.getPushToken();
        if (pushToken && user) {
          await NotificationService.registerPushToken(user.id, pushToken);
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  // If still loading auth state, show loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {/* You can add a proper loading screen here */}
      </SafeAreaView>
    );
  }

  // If not authenticated and data not loaded, and we're in loading state, show loading screen
  if (!isAuthenticated && !isDataLoaded && currentScreen === 'loading') {
    return (
      <LoadingScreen 
        onLoadingComplete={(data) => {
          // This will be called if user is authenticated
          setCurrentScreen('menu');
        }}
        onNavigateToLogin={() => {
          // This will be called if user is not authenticated
          setCurrentScreen('login');
        }}
      />
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  const handleLocalGame = () => {
    setCurrentScreen('localSetup');
  };

  const handleMultiplayer = () => {
    setCurrentScreen('multiplayerSelection');
  };

  const handleLANMultiplayer = () => {
    setCurrentScreen('lanMultiplayer');
  };

  const handleInternetMultiplayer = () => {
    setCurrentScreen('internetMultiplayer');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setGameData(null); // Clear game data when returning to menu
  };

  const handleNewGame = () => {
    setCurrentScreen('localSetup');
    setGameData(null); // Clear game data when starting new game
  };

  const handleGameStart = (gameData) => {
    setCurrentScreen('local');
    // Store game data for GameScreen
    setGameData(gameData);
  };

  const handleMultiplayerGameStart = (roomId, type = 'internet') => {
    setMultiplayerRoomId(roomId);
    setMultiplayerType(type);
    setCurrentScreen('multiplayerGame');
  };

  const handleShowRankedLobby = () => {
    setCurrentScreen('ranked');
  };

  const handleShowProfile = () => {
    setCurrentScreen('profile');
  };

  const handleShowLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  const handleShowShop = () => {
    setCurrentScreen('shop');
  };

  const handleShowNotifications = () => {
    setCurrentScreen('notifications');
  };

  const handleShowNotificationTester = () => {
    setCurrentScreen('notificationTester');
  };

  // Handle back navigation for different screens
  const handleBackNavigation = () => {
    switch (currentScreen) {
      case 'local':
      case 'localSetup':
      case 'profile':
      case 'leaderboard':
      case 'shop':
      case 'ranked':
      case 'notifications':
      case 'notificationTester':
        setCurrentScreen('menu');
        break;
      case 'multiplayerSelection':
        setCurrentScreen('menu');
        break;
      case 'lanMultiplayer':
      case 'internetMultiplayer':
        setCurrentScreen('multiplayerSelection');
        break;
      case 'multiplayerGame':
        if (multiplayerType === 'lan') {
          setCurrentScreen('lanMultiplayer');
        } else {
          setCurrentScreen('internetMultiplayer');
        }
        break;
      case 'login':
        setCurrentScreen('menu');
        break;
      default:
        setCurrentScreen('menu');
        break;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return (
          <LoadingScreen 
            onLoadingComplete={(data) => {
              setCurrentScreen('menu');
            }}
            onNavigateToLogin={() => {
              setCurrentScreen('login');
            }}
          />
        );
      case 'login':
        return (
          <LoginScreen 
            onBack={() => setCurrentScreen('menu')}
          />
        );
      case 'menu':
        return (
          <EnhancedMainMenu
            onLocalGame={handleLocalGame}
            onMultiplayer={handleMultiplayer}
            onShowRankedLobby={handleShowRankedLobby}
            onShowProfile={handleShowProfile}
            onShowLeaderboard={handleShowLeaderboard}
            onShowShop={handleShowShop}
            onShowNotifications={handleShowNotifications}
            onShowNotificationTester={handleShowNotificationTester}
          />
        );
      case 'localSetup':
        return (
          <LocalGameSetup
            onGameStart={handleGameStart}
            onBack={handleBackToMenu}
          />
        );
      case 'local':
        return (
          <LocalGameScreen
            onBack={handleBackToMenu}
            onNewGame={handleNewGame}
            gameData={gameData}
          />
        );
      case 'multiplayerSelection':
        return (
          <MultiplayerSelectionScreen
            onLANMultiplayer={handleLANMultiplayer}
            onInternetMultiplayer={handleInternetMultiplayer}
            onBack={handleBackToMenu}
          />
        );
      case 'lanMultiplayer':
        return (
          <LANLobby
            onGameStart={handleMultiplayerGameStart}
            onBack={() => setCurrentScreen('multiplayerSelection')}
          />
        );
      case 'internetMultiplayer':
        return (
          <InternetMultiplayerLobby
            onGameStart={handleMultiplayerGameStart}
            onBack={() => setCurrentScreen('multiplayerSelection')}
          />
        );
      case 'multiplayerGame':
        // Use different game screens based on multiplayer type
        if (multiplayerType === 'lan') {
          return (
            <OfflineLANGameScreen
              roomId={multiplayerRoomId}
              onBack={() => setCurrentScreen('lanMultiplayer')}
              onGameEnd={() => setCurrentScreen('lanMultiplayer')}
            />
          );
        } else {
          return (
            <MultiplayerGameScreen
              roomId={multiplayerRoomId}
              onBack={() => setCurrentScreen('internetMultiplayer')}
              onGameEnd={() => setCurrentScreen('internetMultiplayer')}
            />
          );
        }
      case 'ranked':
        return (
          <RankedLobby
            onBack={handleBackToMenu}
          />
        );
      case 'profile':
        return (
          <PlayerProfile
            onBack={handleBackToMenu}
            user={user}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            onBack={handleBackToMenu}
          />
        );
      case 'shop':
        return (
          <Shop
            onBack={handleBackToMenu}
          />
        );
              case 'notifications':
          return (
            <NotificationCenter
              onClose={handleBackToMenu}
              onNotificationPress={(notification) => {
                // Handle notification press - navigate based on type
                console.log('Notification pressed:', notification);
                handleBackToMenu();
              }}
            />
          );
        case 'notificationTester':
          return (
            <NotificationTester
              onClose={handleBackToMenu}
            />
          );
      default:
        return (
          <EnhancedMainMenu
            onLocalGame={handleLocalGame}
            onMultiplayer={handleMultiplayer}
            onShowRankedLobby={handleShowRankedLobby}
            onShowProfile={handleShowProfile}
            onShowLeaderboard={handleShowLeaderboard}
            onShowShop={handleShowShop}
          />
        );
    }
  };

  return (
    <EdgeGestureBlocker>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {renderScreen()}
        {showRules && (
          <GameRules
            onClose={() => setShowRules(false)}
          />
        )}
      </SafeAreaView>
    </EdgeGestureBlocker>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
}); 