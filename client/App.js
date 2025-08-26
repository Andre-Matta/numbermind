import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';
import LoadingScreen from './src/screens/LoadingScreen';
import EnhancedMainMenu from './src/screens/EnhancedMainMenu';
import LocalGameScreen from './src/screens/LocalGameScreen';
import MultiplayerLobby from './src/screens/MultiplayerLobby';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import LocalGameSetup from './src/components/LocalGameSetup';
import GameRules from './src/components/GameRules';
import RankedLobby from './src/components/RankedLobby';
import PlayerProfile from './src/components/PlayerProfile';
import Leaderboard from './src/components/Leaderboard';
import Shop from './src/screens/ShopScreen';
import LoginScreen from './src/screens/LoginScreen';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [showRules, setShowRules] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDataLoaded } = useData();

  // If still loading auth state, show loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {/* You can add a proper loading screen here */}
      </SafeAreaView>
    );
  }

  // If not authenticated and data not loaded, show loading screen
  if (!isAuthenticated && !isDataLoaded) {
    return (
      <LoadingScreen 
        onLoadingComplete={(data) => {
          // This will be called if user is authenticated
          setCurrentScreen('menu');
        }}
        onNavigateToLogin={() => {
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
    setCurrentScreen('multiplayer');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setGameData(null); // Clear game data when returning to menu
  };

  const handleGameStart = (gameData) => {
    setCurrentScreen('local');
    // Store game data for GameScreen
    setGameData(gameData);
  };

  const handleMultiplayerGameStart = (roomId) => {
    setMultiplayerRoomId(roomId);
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
            gameData={gameData}
          />
        );
      case 'multiplayer':
        return (
          <MultiplayerLobby
            onGameStart={handleMultiplayerGameStart}
            onBack={handleBackToMenu}
          />
        );
      case 'multiplayerGame':
        return (
          <MultiplayerGameScreen
            roomId={multiplayerRoomId}
            onBack={() => setCurrentScreen('multiplayer')}
            onGameEnd={() => setCurrentScreen('multiplayer')}
          />
        );
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
      {showRules && (
        <GameRules
          onClose={() => setShowRules(false)}
        />
      )}
    </SafeAreaView>
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