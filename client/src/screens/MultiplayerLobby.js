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

export default function MultiplayerLobby({ onGameStart, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);

  useEffect(() => {
    autoConnectToServer();
    return () => {
      // Don't disconnect when component unmounts to preserve connections
      console.log('MultiplayerLobby unmounting - preserving connections');
    };
  }, []);

  const autoConnectToServer = async () => {
    try {
      console.log('Auto-connecting to internet server...');
      await NetworkService.connect();
      setConnectionStatus('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set up room discovery callback
      NetworkService.onPlayerJoined = (data) => {
        console.log('Player joined room:', data);
        refreshRooms();
      };
      
      NetworkService.onPlayerLeft = (data) => {
        console.log('Player left room:', data);
        refreshRooms();
      };
      
      // Initial room refresh
      await refreshRooms();
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

  const refreshRooms = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to internet server');
      return;
    }

    setIsRefreshing(true);
    try {
      // Get rooms from the network service
      const roomInfo = NetworkService.getRoomInfo();
      
      // For now, we'll simulate available rooms since the server doesn't provide a list
      // In a real implementation, you'd emit a 'getAvailableRooms' event to the server
      const mockAvailableRooms = [
        {
          roomId: 'ABC123',
          hostName: 'Player1',
          players: 1,
          maxPlayers: 2,
          timestamp: Date.now() - 300000, // 5 minutes ago
          type: 'available_room'
        },
        {
          roomId: 'DEF456',
          hostName: 'Player2',
          players: 1,
          maxPlayers: 2,
          timestamp: Date.now() - 600000, // 10 minutes ago
          type: 'available_room'
        }
      ];

      // Update my rooms (rooms I'm hosting)
      if (roomInfo.isHost && roomInfo.roomId) {
        const myRoom = {
          roomId: roomInfo.roomId,
          hostName: 'You',
          players: 1,
          maxPlayers: 2,
          timestamp: Date.now(),
          type: 'my_room'
        };
        setMyRooms([myRoom]);
      } else {
        setMyRooms([]);
      }

      // Update joined rooms (rooms I've joined but don't host)
      if (roomInfo.roomId && !roomInfo.isHost) {
        const joinedRoom = {
          roomId: roomInfo.roomId,
          hostName: 'Other Player',
          players: 2,
          maxPlayers: 2,
          timestamp: Date.now(),
          type: 'joined_room'
        };
        setJoinedRooms([joinedRoom]);
      } else {
        setJoinedRooms([]);
      }

      // Set available rooms (excluding my rooms and joined rooms)
      const myRoomIds = myRooms.map(room => room.roomId);
      const joinedRoomIds = joinedRooms.map(room => room.roomId);
      const filteredAvailableRooms = mockAvailableRooms.filter(
        room => !myRoomIds.includes(room.roomId) && !joinedRoomIds.includes(room.roomId)
      );
      setAvailableRooms(filteredAvailableRooms);

      setIsRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setIsRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to refresh rooms: ' + error.message);
    }
  };

  const createRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to internet server');
      return;
    }

    setIsCreatingRoom(true);
    try {
      console.log('Creating internet room...');
      const response = await NetworkService.createRoom();
      console.log('Internet room created successfully:', response);
      
      setRoomId(response.roomId);
      setIsCreatingRoom(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show room created with copy option
      Alert.alert(
        'Internet Room Created!',
        `Room ID: ${response.roomId}\n\nShare this code with your friend to start playing over the internet!`,
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

      // Refresh rooms to show the new room
      await refreshRooms();
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

  const joinRoom = async (roomIdToJoin = null) => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Not connected to internet server');
      return;
    }

    const targetRoomId = roomIdToJoin || roomId;
    
    if (!targetRoomId || !targetRoomId.trim()) {
      Alert.alert('Error', 'Please enter a room ID');
      return;
    }

    setIsJoiningRoom(true);
    try {
      await NetworkService.joinRoom(targetRoomId.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set the roomId state to the joined room
      setRoomId(targetRoomId.trim());
      
      Alert.alert('Success', 'Joined internet room successfully!\n\nYou can now start the game!');
      
      // Refresh rooms to update the UI
      await refreshRooms();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to join internet room');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    // Security check: Only allow deleting rooms you're hosting
    const roomInfo = NetworkService.getRoomInfo();
    if (!roomInfo.isHost || roomInfo.roomId !== roomIdToDelete) {
      Alert.alert('Access Denied', 'You can only delete rooms you are hosting.');
      return;
    }

    Alert.alert(
      'Delete Room',
      `Are you sure you want to delete room ${roomIdToDelete}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Leave the room (this will delete it on the server)
              NetworkService.leaveRoom();
              
              // Update local state
              setMyRooms(prev => prev.filter(room => room.roomId !== roomIdToDelete));
              setRoomId('');
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Room deleted successfully');
              
              // Refresh rooms
              await refreshRooms();
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete room: ' + error.message);
            }
          }
        }
      ]
    );
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
      case 'connected': return 'Internet Server Connected';
      case 'connecting': return 'Connecting to Internet Server...';
      default: return 'Internet Server Disconnected';
    }
  };

  // Handle back navigation with cleanup option
  const handleBack = () => {
    if (roomId || myRooms.length > 0 || joinedRooms.length > 0) {
      Alert.alert(
        'Exit Internet Multiplayer?',
        'Do you want to exit and leave all rooms?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit & Leave Rooms', 
            style: 'destructive',
            onPress: () => {
              // Leave all rooms
              if (roomId) {
                NetworkService.leaveRoom();
              }
              onBack();
            }
          },
          { 
            text: 'Exit & Keep Rooms', 
            onPress: () => {
              onBack();
            }
          }
        ]
      );
    } else {
      onBack();
    }
  };

  const renderRoomItem = (room, index) => {
    const isMyRoom = room.type === 'my_room';
    const isJoinedRoom = room.type === 'joined_room';
    const isAvailableRoom = room.type === 'available_room';

    return (
      <View key={index} style={styles.roomItemContainer}>
        <TouchableOpacity
          style={[
            styles.roomItem,
            isMyRoom ? styles.myRoomItem : null,
            isJoinedRoom ? styles.joinedRoomItem : null
          ]}
          onPress={async () => {
            try {
              if (isMyRoom) {
                // If it's my room, start the game directly
                console.log('🏠 My room - starting game directly');
                onGameStart(room.roomId);
              } else if (isJoinedRoom) {
                // If I'm already joined, start the game directly
                console.log('👤 Already joined - starting game directly');
                onGameStart(room.roomId);
              } else if (isAvailableRoom) {
                // If it's an available room, join it first
                console.log('👤 Joining available room');
                await joinRoom(room.roomId);
              }
            } catch (error) {
              // Error handling is already in joinRoom
            }
          }}
        >
          <Text style={styles.roomIdText}>
            {isMyRoom ? (
              <>Room: {room.roomId} (Your Room)</>
            ) : (
              `Room: ${room.roomId}`
            )}
          </Text>
          <Text style={styles.roomHostText}>Host: {room.hostName}</Text>
          <Text style={styles.roomPlayersText}>Players: {room.players}/{room.maxPlayers}</Text>
          <Text style={styles.roomJoinText}>
            {isMyRoom ? '🏠 Your room - Tap to start' : 
             isJoinedRoom ? '👤 Joined - Tap to start' : 
             '🎮 Tap to join'}
          </Text>
        </TouchableOpacity>
        
        {/* Only show delete button for rooms you're hosting */}
        {isMyRoom && (
          <TouchableOpacity
            style={[styles.deleteRoomButton, styles.myRoomDeleteButton]}
            onPress={() => handleDeleteRoom(room.roomId)}
          >
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
        {connectionStatus === 'connected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internet Multiplayer Gaming</Text>
            <Text style={styles.sectionSubtitle}>Play with friends over the internet - Requires internet connection!</Text>
            
            {/* Create Room and Refresh Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={createRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Internet Room</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.refreshButton]}
                onPress={refreshRooms}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Refresh Rooms</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Manual Join Room */}
            <View style={styles.manualJoinContainer}>
              <Text style={styles.manualJoinTitle}>Join Room by Code:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={roomId}
                  onChangeText={setRoomId}
                  placeholder="Enter room code"
                  placeholderTextColor="#6c757d"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.button, styles.joinButton]}
                  onPress={() => joinRoom()}
                  disabled={isJoiningRoom || !roomId.trim()}
                >
                  {isJoiningRoom ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Join</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* My Rooms (Rooms I'm Hosting) */}
            {myRooms.length > 0 && (
              <View style={styles.roomsSection}>
                <Text style={styles.roomsSectionTitle}>My Rooms (Hosting):</Text>
                <View style={styles.roomsList}>
                  {myRooms.map((room, index) => renderRoomItem(room, index))}
                </View>
              </View>
            )}

            {/* Joined Rooms (Rooms I've Joined) */}
            {joinedRooms.length > 0 && (
              <View style={styles.roomsSection}>
                <Text style={styles.roomsSectionTitle}>Joined Rooms:</Text>
                <View style={styles.roomsList}>
                  {joinedRooms.map((room, index) => renderRoomItem(room, index))}
                </View>
              </View>
            )}

            {/* Available Rooms */}
            <View style={styles.roomsSection}>
              <Text style={styles.roomsSectionTitle}>Available Internet Rooms:</Text>
              
              {/* Room Management Info */}
              <Text style={styles.roomManagementInfo}>
                💡 You can only delete rooms you're hosting. Other players' rooms cannot be deleted.
              </Text>
              
              {/* Current Room Status */}
              {(() => {
                const roomInfo = NetworkService.getRoomInfo();
                if (roomInfo.isHost && roomInfo.roomId) {
                  return (
                    <View style={styles.currentRoomStatus}>
                      <Ionicons name="home" size={16} color="#28a745" />
                      <Text style={styles.currentRoomStatusText}>
                        Hosting: {roomInfo.roomId}
                      </Text>
                    </View>
                  );
                } else if (roomInfo.roomId && !roomInfo.isHost) {
                  return (
                    <View style={styles.currentRoomStatus}>
                      <Ionicons name="people" size={16} color="#4a90e2" />
                      <Text style={styles.currentRoomStatusText}>
                        Joined: {roomInfo.roomId}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
              
              {isRefreshing ? (
                <View style={styles.refreshingContainer}>
                  <ActivityIndicator color="#4a90e2" size="small" />
                  <Text style={styles.refreshingText}>Refreshing rooms...</Text>
                </View>
              ) : availableRooms.length > 0 ? (
                <View style={styles.roomsList}>
                  {availableRooms.map((room, index) => renderRoomItem(room, index))}
                </View>
              ) : (
                <Text style={styles.noRoomsText}>No internet rooms found. Create a room to start!</Text>
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
    flex: 1,
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    marginBottom: 15,
    flex: 1,
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: '#6f42c1',
    marginLeft: 10,
    flex: 0.3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  manualJoinContainer: {
    marginBottom: 20,
  },
  manualJoinTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  roomsSection: {
    marginTop: 20,
  },
  roomsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  roomsList: {
    maxHeight: 200,
  },
  roomItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  myRoomItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  joinedRoomItem: {
    backgroundColor: 'rgba(111, 66, 193, 0.15)',
    borderWidth: 2,
    borderColor: '#6f42c1',
  },
  deleteRoomButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRoomDeleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderWidth: 2,
    borderColor: '#dc3545',
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
  roomPlayersText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  roomJoinText: {
    fontSize: 12,
    color: '#4a90e2',
    fontStyle: 'italic',
    marginTop: 4,
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  refreshingText: {
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
  currentRoomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  currentRoomStatusText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 8,
    fontWeight: '500',
  },
  roomManagementInfo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
}); 