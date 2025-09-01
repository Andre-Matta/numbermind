import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';

//core imports
import LoadingScreen from './src/screens/core/LoadingScreen';
import LoginScreen from './src/screens/core/LoginScreen';
import EnhancedMainMenu from './src/screens/core/EnhancedMainMenu';
import MultiplayerSelectionScreen from './src/screens/core/MultiplayerSelectionScreen';
import Shop from './src/screens/core/ShopScreen';
import Leaderboard from './src/screens/core/LeaderboardScreen';
import FriendsScreen from './src/screens/core/FriendsScreen';
import PlayerProfile from './src/components/PlayerProfile';
import GameRules from './src/components/GameRules';

//game imports
import LocalGameSetup from './src/screens/game/LocalGameSetup';
import LocalGameScreen from './src/screens/game/LocalGameScreen';
import LANLobby from './src/screens/game/LANLobby';
import LANGameScreen from './src/screens/game/LANGameScreen';
import MultiplayerLobby from './src/screens/game/MultiplayerLobby';
import MultiplayerGameScreen from './src/screens/game/MultiplayerGameScreen';
import RankedLobby from './src/screens/game/RankedLobby';

import Inbox from './src/components/Inbox';

import EdgeGestureBlocker from './src/components/EdgeGestureBlocker';
import { initializeFirebase, cleanupFirebase } from './src/utils/firebaseInit';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showRules, setShowRules] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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

  // Initialize Firebase when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeFirebaseServices();
    }
  }, [isAuthenticated, user]);

  // Cleanup Firebase when component unmounts
  useEffect(() => {
    return () => {
      cleanupFirebase();
    };
  }, []);

  const initializeFirebaseServices = async () => {
    try {
      const success = await initializeFirebase();
      if (success) {
        console.log('Firebase services initialized successfully');
      } else {
        console.log('Firebase services initialization failed, using fallback');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase services:', error);
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
    setShowProfile(true);
  };

  const handleShowLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  const handleShowShop = () => {
    setCurrentScreen('shop');
  };

  const handleShowInbox = () => {
    setShowInbox(true);
  };



  const handleShowFriends = () => {
    setCurrentScreen('friends');
  };

  // Handle back navigation for different screens
  const handleBackNavigation = () => {
    switch (currentScreen) {
      case 'local':
      case 'localSetup':
      case 'leaderboard':
      case 'shop':
      case 'ranked':
      case 'friends':
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
            onShowInbox={handleShowInbox}

            onShowFriends={handleShowFriends}
            onShowRules={() => setShowRules(true)}
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
          <MultiplayerLobby
            onGameStart={handleMultiplayerGameStart}
            onBack={() => setCurrentScreen('multiplayerSelection')}
          />
        );
      case 'multiplayerGame':
        // Use different game screens based on multiplayer type
        if (multiplayerType === 'lan') {
          return (
            <LANGameScreen
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


        case 'friends':
          return (
            <FriendsScreen
              navigation={{
                navigate: (screenName, params) => {
                  // Handle navigation to other screens from friends
                  if (screenName === 'Profile' && params?.userId) {
                    // For now, just go back to menu since we don't have individual profile viewing
                    handleBackToMenu();
                  } else if (screenName === 'MultiplayerLobby') {
                    // Navigate to multiplayer with friend invitation
                    handleInternetMultiplayer();
                  } else {
                    handleBackToMenu();
                  }
                },
                addListener: (event, callback) => {
                  // Mock navigation listener for focus events
                  return () => {}; // Return cleanup function
                }
              }}
              route={{}}
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
            onShowInbox={handleShowInbox}

            onShowFriends={handleShowFriends}
            onShowRules={() => setShowRules(true)}
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
        <Inbox
          visible={showInbox}
          onClose={() => setShowInbox(false)}
          onMessagePress={(message) => {
            // Handle message press - navigate based on type
            console.log('Message pressed:', message);
            setShowInbox(false);
          }}
        />
        <PlayerProfile
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
        />
      </SafeAreaView>
    </EdgeGestureBlocker>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
}); 