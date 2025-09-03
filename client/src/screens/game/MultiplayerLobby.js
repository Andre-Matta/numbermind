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
import NetworkService from '../../services/NetworkService';

export default function MultiplayerLobby({ onGameStart, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [hostedRoomSettings, setHostedRoomSettings] = useState({}); // roomId -> { mode, timer }
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [mpMode, setMpMode] = useState('standard');
  const [timerMode, setTimerMode] = useState('none'); // 'none' | 'custom'
  const [timerSeconds, setTimerSeconds] = useState(30);

  useEffect(() => {
    initializeInternetMultiplayer();
    return () => {
      // Don't clear rooms or disconnect when component unmounts
      // This preserves rooms when navigating between screens
      // Rooms will only be cleared when explicitly requested by the user
      console.log('MultiplayerLobby unmounting - preserving rooms for navigation');
    };
  }, []);

  const initializeInternetMultiplayer = async () => {
    try {
      console.log('Initializing internet multiplayer...');
      await NetworkService.connect();
      setConnectionStatus(NetworkService.getConnectionStatus());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set up room discovery callback
      NetworkService.onRoomsUpdated = (rooms) => {
        // Only update rooms if we're not in the middle of discovery
        if (!isDiscovering) {
          // Combine hosted rooms with available rooms
          let updatedRooms = [...rooms.hostedRooms];
          
          // Add available rooms that we're not hosting
          const hostedRoomIds = rooms.hostedRooms.map(room => room.roomId);
          const availableRoomsFromServer = rooms.availableRooms.filter(room => 
            !hostedRoomIds.includes(room.roomId)
          );
          updatedRooms = [...updatedRooms, ...availableRoomsFromServer];
          
          setAvailableRooms(updatedRooms);
        }
      };
      
      // Check if we have existing rooms or connection state to restore
      const serviceStatus = NetworkService.getAllRoomsInfo();
      if (serviceStatus.hostedRooms && serviceStatus.hostedRooms.length > 0) {
        console.log('Restoring existing hosted rooms:', serviceStatus.hostedRooms.length);
        setAvailableRooms(serviceStatus.hostedRooms);
      }
      
      // Initial room refresh
      await refreshInternetRooms();
    } catch (error) {
      setConnectionStatus(NetworkService.getConnectionStatus());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to connect to internet server';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type === 'timeout') {
        errorMessage = 'Connection timed out. Internet server might be sleeping or unreachable.';
      } else if (error.description) {
        errorMessage = error.description;
      }
      
      console.error('Internet Connection error:', error);
    }
  };

  const createInternetRoom = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Internet connection required for multiplayer');
      return;
    }
    // Show setup modal instead of creating immediately
    setShowSetupModal(true);
  };

  // Helper function to create a new room
  const createNewRoom = async () => {
    setIsCreatingRoom(true);
    try {
      console.log('Creating internet room...');
      
      const response = await NetworkService.createRoom();
      console.log('Internet room created successfully:', response);
      
      setRoomId(response.roomId);
      setIsCreatingRoom(false);
      
      // Add the new room to available rooms list (prepend to show newest first)
      const newRoom = {
        roomId: response.roomId,
        hostName: 'You',
        players: 1,
        maxPlayers: 2,
        timestamp: Date.now(),
        type: 'hosted_room'
      };
      setAvailableRooms(prev => [newRoom, ...prev]);
      // Store selected settings locally for this hosted room
      setHostedRoomSettings(prev => ({
        ...prev,
        [response.roomId]: {
          mode: mpMode,
          timer: timerMode === 'none' ? null : timerSeconds,
        },
      }));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Internet Room Created!',
        `Room ID: ${response.roomId}\n\nShare this code with friends to start playing over the internet!`,
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
            text: 'Start Game Now', 
            onPress: () => {
              onGameStart(response.roomId);
            }
          },
          { 
            text: 'OK', 
            onPress: () => {
              // Don't auto-start the game - let user decide when to start
              console.log('Room created successfully - waiting for user to start game');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating internet room:', error);
      setIsCreatingRoom(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const joinInternetRoom = async (roomIdToJoin = null) => {
    if (!NetworkService.isConnected()) {
      return;
    }

    // Use the passed roomId or the state roomId
    const targetRoomId = roomIdToJoin || roomId;
    
    if (!targetRoomId || !targetRoomId.trim()) {
      Alert.alert('Error', 'Please select a room to join');
      return;
    }

    // Check if the room actually exists in available rooms
    const roomExists = availableRooms.some(room => room.roomId === targetRoomId.trim());
    if (!roomExists) {
      Alert.alert('Room Not Found', 'This room ID does not exist. Please check the room ID or refresh to discover available rooms.');
      return;
    }

    try {
      // Find the room details from available rooms
      const targetRoom = availableRooms.find(room => room.roomId === targetRoomId.trim());
      if (!targetRoom) {
        throw new Error('Room not found');
      }

      await NetworkService.joinRoom(targetRoom.roomId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set the roomId state to the joined room
      setRoomId(targetRoomId.trim());
      
      // Don't show success alert since we're automatically starting the game
      console.log('Joined room successfully - game will start automatically');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const refreshInternetRooms = async () => {
    if (!NetworkService.isConnected()) {
      Alert.alert('Error', 'Internet connection required for multiplayer');
      return;
    }
    
    setIsDiscovering(true);
    
    try {
      // Refresh available rooms from server
      const rooms = await NetworkService.refreshAvailableRooms();
      
      // Get hosted rooms from service
      const hostedRooms = NetworkService.getHostedRooms();
      
      // Combine hosted rooms with available rooms
      let updatedRooms = [...hostedRooms];
      
      // Add available rooms that we're not hosting
      const hostedRoomIds = hostedRooms.map(room => room.roomId);
      const availableRoomsFromServer = rooms.filter(room => 
        !hostedRoomIds.includes(room.roomId)
      );
      updatedRooms = [...updatedRooms, ...availableRoomsFromServer];
      
      setAvailableRooms(updatedRooms);
      setIsDiscovering(false);
      
      if (updatedRooms.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`Discovery completed: Found ${updatedRooms.length} room(s)`);
      } else {
        console.log('Discovery completed: No rooms found');
      }
    } catch (error) {
      setIsDiscovering(false);
      Alert.alert('Internet Discovery Error', error.message);
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    // Security check: Only allow deleting rooms you're hosting
    const hostedRooms = NetworkService.getHostedRooms();
    const isHostedRoom = hostedRooms.some(room => room.roomId === roomIdToDelete);
    if (!isHostedRoom) {
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
              // Delete the room
              NetworkService.deleteRoom(roomIdToDelete);
              
              // Update local state
              setAvailableRooms(prev => prev.filter(room => room.roomId !== roomIdToDelete));
              
              // If this was the selected room, clear it
              if (roomIdToDelete === roomId) {
                setRoomId('');
              }
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Room deleted successfully');
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
    const status = NetworkService.getConnectionStatus();
    switch (status) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      default: return '#dc3545';
    }
  };

  const getStatusText = () => {
    const status = NetworkService.getConnectionStatus();
    switch (status) {
      case 'connected': return 'Internet Server Connected';
      case 'connecting': return 'Connecting to Internet Server...';
      default: return 'Internet Server Disconnected';
    }
  };

  // Clean up Network service when actually exiting (not just navigating)
  const cleanupNetworkService = () => {
    console.log('Cleaning up Network service...');
    NetworkService.clearAllRooms();
    NetworkService.disconnect();
  };

  // Handle back navigation with cleanup option
  const handleBack = () => {
    if (roomId || availableRooms.length > 0) {
      Alert.alert(
        'Exit Internet Multiplayer?',
        'Do you want to exit and clear all rooms?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit & Clear', 
            style: 'destructive',
            onPress: () => {
              cleanupNetworkService();
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
         {NetworkService.isConnected() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internet Multiplayer Gaming</Text>
            <Text style={styles.sectionSubtitle}>Play with friends over the internet - Requires internet connection!</Text>
            
            {/* Create Room and Refresh Buttons */}
            <View style={styles.buttonRow}>
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
              
              <TouchableOpacity
                style={[styles.button, styles.refreshButton]}
                onPress={refreshInternetRooms}
              >
                <Text style={styles.buttonText}>Refresh Rooms</Text>
              </TouchableOpacity>
            </View>
             
                         {/* Available Internet Rooms */}
             <View style={styles.lanRoomsContainer}>
               <Text style={styles.lanRoomsTitle}>Available Internet Rooms:</Text>
               
               {/* Room Management Info */}
               <Text style={styles.roomManagementInfo}>
                 💡 You can only delete rooms you're hosting. Other players' rooms cannot be deleted.
               </Text>
               
               {/* Current Room Status */}
               {(() => {
                 const currentRoomInfo = NetworkService.getCurrentRoomInfo();
                 if (currentRoomInfo.isHost && currentRoomInfo.roomId) {
                   return (
                     <View style={styles.currentRoomStatus}>
                       <Ionicons name="home" size={16} color="#28a745" />
                       <Text style={styles.currentRoomStatusText}>
                         Hosting: {currentRoomInfo.roomId}
                       </Text>
                     </View>
                   );
                 } else if (currentRoomInfo.roomId && !currentRoomInfo.isHost) {
                   return (
                     <View style={styles.currentRoomStatus}>
                       <Ionicons name="people" size={16} color="#4a90e2" />
                       <Text style={styles.currentRoomStatusText}>
                         Joined: {currentRoomInfo.roomId}
                       </Text>
                     </View>
                   );
                 }
                 return null;
               })()}
               
               {isDiscovering ? (
                 <View style={styles.discoveringContainer}>
                   <ActivityIndicator color="#4a90e2" size="small" />
                   <Text style={styles.discoveringText}>Discovering rooms...</Text>
                 </View>
               ) : availableRooms.length > 0 ? (
                 <ScrollView style={styles.roomsList}>
                   {availableRooms.map((room, index) => (
                     <View key={index} style={styles.roomItemContainer}>
                       <TouchableOpacity
                         style={[
                           styles.roomItem,
                           (() => {
                             const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                             return isHostingThisRoom ? styles.ownRoomItem : null;
                           })()
                         ]}
                                                   onPress={async () => {
                            try {
                              // Check if we're hosting this room
                              const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                              const hasJoinedThisRoom = NetworkService.hasJoinedRoom(room.roomId);
                              
                              if (isHostingThisRoom) {
                                // If we're hosting this room, set it as current and start the game
                                console.log('🏠 Host detected - setting as current room and starting game');
                                NetworkService.setCurrentRoom(room.roomId);
                                onGameStart(room.roomId);
                              } else if (hasJoinedThisRoom) {
                                // If we've joined this room, set it as current and start the game
                                console.log('👤 Already joined to room - setting as current and starting game');
                                NetworkService.setCurrentRoom(room.roomId);
                                onGameStart(room.roomId);
                              } else {
                                // If we're not joined, join the room first and then start the game
                                console.log('👤 Joining room as player and starting game');
                                await joinInternetRoom(room.roomId);
                                // After successfully joining, automatically start the game
                                NetworkService.setCurrentRoom(room.roomId);
                                onGameStart(room.roomId);
                              }
                            } catch (error) {
                              // Error handling is already in joinInternetRoom
                              console.error('Error joining/starting room:', error);
                            }
                          }}
                       >
                         <Text style={styles.roomIdText}>
                           {(() => {
                             const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                             return isHostingThisRoom ? (
                               <>
                                 Room: {room.roomId} (Your Room)
                               </>
                             ) : (
                               `Room: ${room.roomId}`
                             );
                           })()}
                         </Text>
                         <Text style={styles.roomHostText}>Host: {room.hostName}</Text>
                         {(() => {
                           const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                           const settings = hostedRoomSettings[room.roomId];
                           if (isHostingThisRoom && settings) {
                             return (
                               <Text style={styles.roomMetaText}>
                                 Mode: {settings.mode === 'hard' ? 'Hard' : 'Standard'}
                                 {`  |  Timer: ${settings.timer ? settings.timer + 's' : 'None'}`}
                               </Text>
                             );
                           }
                           return null;
                         })()}
                         <Text style={styles.roomPlayersText}>Players: {room.players}/{room.maxPlayers}</Text>
                         <Text style={styles.roomJoinText}>
                           {(() => {
                             const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                             const hasJoinedThisRoom = NetworkService.hasJoinedRoom(room.roomId);
                             
                             if (isHostingThisRoom) {
                               return '🏠 Your room - Tap to start';
                             } else if (hasJoinedThisRoom) {
                               return '👤 Joined - Tap to start';
                             } else {
                               return '🎮 Tap to join';
                             }
                           })()}
                         </Text>
                       </TouchableOpacity>
                       {/* Only show delete button for rooms you're hosting */}
                       {(() => {
                         const isHostingThisRoom = NetworkService.isHostingRoom(room.roomId);
                         return isHostingThisRoom ? (
                           <TouchableOpacity
                             style={[styles.deleteRoomButton, styles.ownRoomDeleteButton]}
                             onPress={() => handleDeleteRoom(room.roomId)}
                           >
                             <Ionicons name="trash-outline" size={20} color="#dc3545" />
                           </TouchableOpacity>
                         ) : null;
                       })()}
                     </View>
                   ))}
                 </ScrollView>
               ) : (
                 <Text style={styles.noRoomsText}>No internet rooms found. Create a room to start!</Text>
               )}
             </View>
          </View>
        )}
      </ScrollView>

      {/* Setup Modal */}
      {showSetupModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Room Setup</Text>

            {/* Mode Selection */}
            <Text style={styles.modalLabel}>Mode</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.optionButton, mpMode === 'standard' && styles.optionButtonActive]}
                onPress={() => setMpMode('standard')}
              >
                <Text style={[styles.optionText, mpMode === 'standard' && styles.optionTextActive]}>Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, mpMode === 'hard' && styles.optionButtonActive]}
                onPress={() => setMpMode('hard')}
              >
                <Text style={[styles.optionText, mpMode === 'hard' && styles.optionTextActive]}>Hard</Text>
              </TouchableOpacity>
            </View>

            {/* Timer Selection */}
            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Turn Timer</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.optionButton, timerMode === 'none' && styles.optionButtonActive]}
                onPress={() => setTimerMode('none')}
              >
                <Text style={[styles.optionText, timerMode === 'none' && styles.optionTextActive]}>None</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, timerMode === 'custom' && styles.optionButtonActive]}
                onPress={() => setTimerMode('custom')}
              >
                <Text style={[styles.optionText, timerMode === 'custom' && styles.optionTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {timerMode === 'custom' && (
              <View style={styles.timerSliderContainer}>
                <Text style={styles.timerLabel}>Seconds: {timerSeconds}</Text>
                <View style={styles.timerTrack}>
                  {[5,10,15,20,25,30,35,40,45,50,55,60].map(val => (
                    <TouchableOpacity key={val} style={[styles.timerTick, timerSeconds === val && styles.timerTickActive]} onPress={() => setTimerSeconds(val)}>
                      <Text style={[styles.timerTickText, timerSeconds === val && styles.timerTickTextActive]}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowSetupModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalStart]}
                onPress={async () => {
                  setShowSetupModal(false);
                  await createNewRoom();
                }}
              >
                <Text style={styles.modalButtonText}>Start Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  roomManagementInfo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
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
  ownRoomItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#007bff',
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
  ownRoomDeleteButton: {
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
  roomMetaText: {
    fontSize: 12,
    color: '#9fb3c8',
    marginTop: 4,
  },
  roomJoinText: {
    fontSize: 12,
    color: '#4a90e2',
    fontStyle: 'italic',
    marginTop: 4,
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(26,26,46,1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#9fb3c8',
    marginBottom: 6,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(74,144,226,0.25)',
    borderColor: '#4a90e2',
  },
  optionText: {
    color: '#9fb3c8',
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#fff',
  },
  timerSliderContainer: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  timerLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center'
  },
  timerTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  timerTick: {
    width: (360 - 24) / 6,
    maxWidth: 56,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  timerTickActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    borderColor: '#4a90e2'
  },
  timerTickText: {
    color: '#9fb3c8',
    fontWeight: '600'
  },
  timerTickTextActive: {
    color: '#fff'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: 'rgba(220,53,69,0.15)',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  modalStart: {
    backgroundColor: 'rgba(40,167,69,0.2)',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
}); 