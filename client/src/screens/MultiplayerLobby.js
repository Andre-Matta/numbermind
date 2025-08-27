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
import LANDiscoveryService from '../services/LANDiscoveryService';


export default function MultiplayerLobby({ onGameStart, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // disconnected, connecting, connected
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);


  useEffect(() => {
    autoConnectToServer();
    return () => {
      NetworkService.disconnect();
    };
  }, []);

  const autoConnectToServer = async () => {
    try {
      console.log('Auto-connecting to server...');
      await NetworkService.connect();
      setConnectionStatus('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setConnectionStatus('disconnected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to connect to server';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type === 'timeout') {
        errorMessage = 'Connection timed out. Server might be sleeping or unreachable.';
      } else if (error.description) {
        errorMessage = error.description;
      }
      
      Alert.alert('Connection Failed', errorMessage);
      console.error('Connection error:', error);
    }
  };





  const createRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    setIsCreatingRoom(true);
    try {
      console.log('Creating room...');
      console.log('NetworkService connection status:', NetworkService.isConnected());
      console.log('Socket connected:', NetworkService.socket?.connected);
      
      const response = await NetworkService.createRoom();
      console.log('Room created successfully:', response);
      
      setRoomId(response.roomId);
      setIsCreatingRoom(false);
      
      // Note: Room creator is automatically added to the room on the server
      // No need to join again
      console.log('Room creator automatically in room');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show room created with copy option
      Alert.alert(
        'Room Created!',
        `Room ID: ${response.roomId}\n\nShare this code with your friend to start playing!`,
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
              onGameStart(response.roomId);
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error creating room:', error);
      setIsCreatingRoom(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to create room';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type === 'timeout') {
        errorMessage = 'Request timed out. Server might be sleeping or unreachable.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const joinRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to server');
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
      Alert.alert('Success', 'Joined room successfully!');
      // Navigate to multiplayer game screen
      setTimeout(() => {
        onGameStart(roomId.trim());
      }, 1000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to join room');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const startLANDiscovery = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }
    setIsDiscovering(true);
    try {
      const rooms = await LANDiscoveryService.discoverRooms();
      setAvailableRooms(rooms);
      if (rooms.length === 0) {
        Alert.alert('No LAN Rooms Found', 'No LAN rooms found on your network. Create one to play!');
      }
    } catch (error) {
      Alert.alert('LAN Discovery Error', error.message);
    } finally {
      setIsDiscovering(false);
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
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
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
          <Text style={styles.title}>Multiplayer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>



        {/* LAN Section */}
        {NetworkService.isConnected() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LAN Multiplayer</Text>
            <Text style={styles.sectionSubtitle}>Play with friends on the same WiFi network</Text>
            
            {/* Test LAN Button */}
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={async () => {
                try {
                  const result = await LANDiscoveryService.testLANFunctionality();
                  Alert.alert(
                    'LAN Test Result',
                    result.success 
                      ? `Success!\nRoom ID: ${result.roomId}\nIP: ${result.connectionInfo.hostIP}`
                      : `Failed: ${result.message || result.error}`
                  );
                } catch (error) {
                  Alert.alert('Test Error', error.message);
                }
              }}
            >
              <Text style={styles.buttonText}>Test LAN Functionality</Text>
            </TouchableOpacity>
            
            {/* Available LAN Rooms */}
            <View style={styles.lanRoomsContainer}>
              <Text style={styles.lanRoomsTitle}>Available LAN Rooms:</Text>
              {isDiscovering ? (
                <View style={styles.discoveringContainer}>
                  <ActivityIndicator color="#4a90e2" size="small" />
                  <Text style={styles.discoveringText}>Discovering rooms...</Text>
                </View>
              ) : availableRooms.length > 0 ? (
                <ScrollView style={styles.roomsList}>
                  {availableRooms.map((room, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.roomItem}
                      onPress={() => setRoomId(room.roomId)}
                    >
                      <Text style={styles.roomIdText}>Room: {room.roomId}</Text>
                      <Text style={styles.roomHostText}>Host: {room.hostIP}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noRoomsText}>No LAN rooms found. Create a room to start!</Text>
              )}
            </View>
          </View>
        )}



        {/* Room Management */}
        {connectionStatus === 'connected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Management</Text>
            
            <View style={styles.roomActions}>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={createRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Room</Text>
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
                onPress={joinRoom}
                disabled={isJoiningRoom || !roomId.trim()}
              >
                {isJoiningRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Join Room</Text>
                )}
              </TouchableOpacity>

              {/* Start Game Button - Only show when in a room */}
              {roomId && (
                <TouchableOpacity
                  style={[styles.button, styles.startButton]}
                  onPress={() => onGameStart(roomId)}
                >
                  <Text style={styles.buttonText}>Start Game</Text>
                </TouchableOpacity>
              )}
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
  testButton: {
    backgroundColor: '#007bff',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomActions: {
    alignItems: 'center',
  },
  lanRoomsContainer: {
    marginTop: 15,
  },
  lanRoomsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  roomsList: {
    maxHeight: 150,
  },
  roomItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roomIdText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  roomHostText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  discoveringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  discoveringText: {
    color: '#4a90e2',
    fontSize: 16,
    marginLeft: 10,
  },
  noRoomsText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    paddingVertical: 20,
  },

}); 