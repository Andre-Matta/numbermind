import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import NetworkService from '../services/NetworkService';

export default function InternetMultiplayerLobby({ onGameStart, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  useEffect(() => {
    autoConnectToServer();
    return () => {
      NetworkService.disconnect();
    };
  }, []);

  const autoConnectToServer = async () => {
    try {
      console.log('Auto-connecting to internet server...');
      await NetworkService.connect();
      setConnectionStatus('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setConnectionStatus('disconnected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to connect to internet server';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type === 'timeout') {
        errorMessage = 'Connection timed out. Internet server might be sleeping or unreachable.';
      } else if (error.description) {
        errorMessage = error.description;
      }
      
      Alert.alert('Internet Connection Failed', errorMessage);
      console.error('Internet Connection error:', error);
    }
  };

  const createInternetRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to internet server');
      return;
    }

    setIsCreatingRoom(true);
    try {
      console.log('Creating internet room...');
      console.log('NetworkService connection status:', NetworkService.isConnected());
      console.log('Socket connected:', NetworkService.socket?.connected);
      
      const response = await NetworkService.createRoom();
      console.log('Internet room created successfully:', response);
      
      setRoomId(response.roomId);
      setIsCreatingRoom(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Internet Room Created!',
        `Room ID: ${response.roomId}\n\nShare this code with your friend anywhere in the world!`,
        [
          { 
            text: 'Copy Code', 
            onPress: async () => {
              try {
                await Clipboard.setStringAsync(response.roomId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Copied!', 'Room code copied to clipboard');
              } catch (error) {
                Alert.alert('Error', 'Failed to copy to clipboard');
              }
            }
          },
          { 
            text: 'Start Game', 
            onPress: () => {
              onGameStart(response.roomId, 'internet');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error creating internet room:', error);
      setIsCreatingRoom(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to create internet room';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type === 'timeout') {
        errorMessage = 'Request timed out. Internet server might be sleeping or unreachable.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const joinInternetRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to internet server');
      return;
    }

    if (!roomId.trim()) {
      Alert.alert('Error', 'Please enter a room ID');
      return;
    }

    setIsJoiningRoom(true);
    try {
      await NetworkService.joinRoom(roomId.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Joined internet room successfully!');
      setTimeout(() => {
        onGameStart(roomId.trim(), 'internet');
      }, 1000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to join internet room');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      default: return '#dc3545';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Internet Connected';
      case 'connecting': return 'Connecting to Internet...';
      default: return 'Internet Disconnected';
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Internet Multiplayer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* Internet Multiplayer Section */}
        {NetworkService.isConnected() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global Multiplayer</Text>
            <Text style={styles.sectionSubtitle}>Play with friends anywhere in the world</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="globe" size={24} color="#4a90e2" />
                <Text style={styles.infoText}>Global reach</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="wifi" size={24} color="#4a90e2" />
                <Text style={styles.infoText}>Internet connection required</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={24} color="#4a90e2" />
                <Text style={styles.infoText}>Play with anyone, anywhere</Text>
              </View>
            </View>
          </View>
        )}

        {/* Room Management */}
        {connectionStatus === 'connected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internet Room Management</Text>
            
            <View style={styles.roomActions}>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={createInternetRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Internet Room</Text>
                )}
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Room ID:</Text>
                <TextInput
                  style={styles.input}
                  value={roomId}
                  onChangeText={setRoomId}
                  placeholder="Enter room ID"
                  placeholderTextColor="#6c757d"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.joinButton]}
                onPress={joinInternetRoom}
                disabled={isJoiningRoom || !roomId.trim()}
              >
                {isJoiningRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Join Internet Room</Text>
                )}
              </TouchableOpacity>

              {/* Start Game Button - Only show when in a room */}
              {roomId && (
                <TouchableOpacity
                  style={[styles.button, styles.startButton]}
                  onPress={() => onGameStart(roomId, 'internet')}
                >
                  <Text style={styles.buttonText}>Start Internet Game</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Connection Tips */}
        {connectionStatus === 'disconnected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Tips</Text>
            <View style={styles.tipsContainer}>
              <Text style={styles.tipText}>• Ensure you have a stable internet connection</Text>
              <Text style={styles.tipText}>• Check if the server is online</Text>
              <Text style={styles.tipText}>• Try refreshing the connection</Text>
              <Text style={styles.tipText}>• Contact support if issues persist</Text>
            </View>
          </View>
        )}
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
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  title: {
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
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 15,
  },
  infoContainer: {
    marginTop: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#007bff',
    marginBottom: 15,
  },
  joinButton: {
    backgroundColor: '#6f42c1',
  },
  startButton: {
    backgroundColor: '#28a745',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomActions: {
    alignItems: 'center',
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
});
