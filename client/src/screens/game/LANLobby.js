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
import OfflineLANService from '../../services/OfflineLANService';

export default function LANLobby({ onGameStart, onBack }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => {
    initializeOfflineLAN();
    return () => {
      // Don't clear rooms or disconnect when component unmounts
      // This preserves rooms when navigating between screens
      // Rooms will only be cleared when explicitly requested by the user
      console.log('LANLobby unmounting - preserving rooms for navigation');
    };
  }, []);

  const initializeOfflineLAN = async () => {
    try {
      console.log('Initializing offline LAN...');
      const networkStatus = await OfflineLANService.getNetworkStatus();
      
      if (networkStatus.isWifi) {
        setConnectionStatus('connected');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Set up room discovery callback
        OfflineLANService.setOnRoomDiscovered((rooms) => {
          // Only update rooms if we're not in the middle of discovery
          if (!isDiscovering) {
            setAvailableRooms(rooms);
          }
        });
        
        // Check if we have existing rooms or connection state to restore
        const serviceStatus = OfflineLANService.getStatus();
        if (serviceStatus.roomId) {
          console.log('Restoring existing room connection:', serviceStatus.roomId);
          setRoomId(serviceStatus.roomId);
          
          // If we're hosting, restore the room to available rooms
          if (serviceStatus.isHost) {
            const hostRoom = {
              roomId: serviceStatus.roomId,
              hostIP: serviceStatus.localIP,
              port: 8080,
              timestamp: Date.now(),
              type: 'hosted_room'
            };
            setAvailableRooms([hostRoom]);
          }
        }
        
        // Check if there are any discovered rooms to restore
        const existingRooms = OfflineLANService.getDiscoveredRooms();
        if (existingRooms && existingRooms.length > 0) {
          console.log('Restoring discovered rooms:', existingRooms.length);
          setAvailableRooms(existingRooms);
        }
        
        // Restore connection if we were previously connected
        OfflineLANService.restoreConnection();
      } else {
        setConnectionStatus('disconnected');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('WiFi Required', 'WiFi connection is required for offline LAN multiplayer');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Offline LAN Error', error.message || 'Failed to initialize offline LAN');
      console.error('Offline LAN error:', error);
    }
  };

  const createLANRoom = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'WiFi connection required for offline LAN');
      return;
    }

    // Check if we're already hosting a room
    const serviceStatus = OfflineLANService.getStatus();
    if (serviceStatus.isHost && serviceStatus.roomId) {
      Alert.alert(
        'Room Already Hosted',
        `You are already hosting room ${serviceStatus.roomId}. Please delete the existing room first or use it.`,
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'Delete Existing Room', 
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the existing room
                OfflineLANService.deleteRoom(serviceStatus.roomId);
                setAvailableRooms(prev => prev.filter(room => room.roomId !== serviceStatus.roomId));
                setRoomId('');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                
                // After deleting, create the new room
                await createNewRoom();
              } catch (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Failed to delete existing room: ' + error.message);
              }
            }
          }
        ]
      );
      return;
    }

    // If no existing room, create new one directly
    await createNewRoom();
  };

  // Helper function to create a new room
  const createNewRoom = async () => {
    setIsCreatingRoom(true);
    try {
      console.log('Creating offline LAN room...');
      
      const response = await OfflineLANService.startHosting();
      console.log('Offline LAN room created successfully:', response);
      
      setRoomId(response.roomId);
      setIsCreatingRoom(false);
      
      // Add the new room to available rooms list
      const newRoom = {
        roomId: response.roomId,
        hostIP: response.localIP,
        port: 8080,
        timestamp: Date.now(),
        type: 'hosted_room'
      };
      setAvailableRooms([newRoom]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Offline LAN Room Created!',
        `Room ID: ${response.roomId}\n\nShare this code with friends on your WiFi network!\n\nNo internet required - works completely offline!`,
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
              onGameStart(response.roomId, 'lan');
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
      console.error('Error creating offline LAN room:', error);
      setIsCreatingRoom(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create offline LAN room');
    }
  };

  const joinLANRoom = async (roomIdToJoin = null) => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'WiFi connection required for offline LAN');
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

      // Use the actual room information instead of mock data
      const connectionInfo = {
        roomId: targetRoom.roomId,
        hostIP: targetRoom.hostIP,
        port: targetRoom.port
      };
      
      await OfflineLANService.joinRoom(connectionInfo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set the roomId state to the joined room
      setRoomId(targetRoomId.trim());
      
      Alert.alert('Success', 'Joined offline LAN room successfully!\n\nNo internet required!');
      // Don't auto-start the game - let user decide when to start
      console.log('Joined room successfully - waiting for user to start game');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to join offline LAN room');
    }
  };

  const startLANDiscovery = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'WiFi connection required for offline LAN');
      return;
    }
    
    setIsDiscovering(true);
    
    try {
      // Start the discovery process
      OfflineLANService.startDiscovery();
      
      // Wait a moment for discovery to complete
      setTimeout(async () => {
        const rooms = await OfflineLANService.discoverRooms();
        
        // Preserve any existing hosted room in the list
        const serviceStatus = OfflineLANService.getStatus();
        let updatedRooms = [...rooms];
        
        if (serviceStatus.isHost && serviceStatus.roomId) {
          const hostRoom = {
            roomId: serviceStatus.roomId,
            hostIP: serviceStatus.localIP,
            port: 8080,
            timestamp: Date.now(),
            type: 'hosted_room'
          };
          
          // Remove any duplicate host room and add the current one
          updatedRooms = updatedRooms.filter(room => room.roomId !== serviceStatus.roomId);
          updatedRooms.unshift(hostRoom); // Add host room at the beginning
        }
        
        setAvailableRooms(updatedRooms);
        setIsDiscovering(false);
        
        if (updatedRooms.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log(`Discovery completed: Found ${updatedRooms.length} room(s)`);
        } else {
          console.log('Discovery completed: No rooms found');
          // Show helpful message when no rooms are found
          Alert.alert(
            'No Rooms Found', 
            'No LAN rooms were discovered on your network.\n\n' +
            '• Make sure other devices are hosting rooms\n' +
            '• Try creating a room yourself\n' +
            '• Check that all devices are on the same WiFi network',
            [{ text: 'OK' }]
          );
        }
      }, 2000);
    } catch (error) {
      setIsDiscovering(false);
      Alert.alert('Offline LAN Discovery Error', error.message);
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    // Security check: Only allow deleting rooms you're hosting
    const serviceStatus = OfflineLANService.getStatus();
    if (!serviceStatus.isHost || serviceStatus.roomId !== roomIdToDelete) {
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
              const deleted = OfflineLANService.deleteRoom(roomIdToDelete);
              if (deleted) {
                // Update local state
                setAvailableRooms(prev => prev.filter(room => room.roomId !== roomIdToDelete));
                
                // If this was the selected room, clear it
                if (roomIdToDelete === roomId) {
                  setRoomId('');
                }
                
                // If this was a host room, update the service status
                const serviceStatus = OfflineLANService.getStatus();
                if (serviceStatus.isHost && serviceStatus.roomId === roomIdToDelete) {
                  console.log('Host room deleted, updating service status');
                  // The service should have already stopped hosting
                }
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Room deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete room');
              }
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
      case 'connected': return 'Offline LAN Ready';
      case 'connecting': return 'Initializing Offline LAN...';
      default: return 'WiFi Required';
    }
  };

  // Clean up LAN service when actually exiting (not just navigating)
  const cleanupLANService = () => {
    console.log('Cleaning up LAN service...');
    OfflineLANService.clearRooms();
    OfflineLANService.disconnect();
  };

  // Handle back navigation with cleanup option
  const handleBack = () => {
    if (roomId || availableRooms.length > 0) {
      Alert.alert(
        'Exit LAN Multiplayer?',
        'Do you want to exit and clear all rooms?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit & Clear', 
            style: 'destructive',
            onPress: () => {
              cleanupLANService();
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
          <Text style={styles.title}>Offline LAN Multiplayer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* Offline LAN Section */}
        {connectionStatus === 'connected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offline Local Network Gaming</Text>
            <Text style={styles.sectionSubtitle}>Play with friends on the same WiFi network - No internet required!</Text>
            
                                       {/* Create Room and Refresh Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={createLANRoom}
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Create Offline Room</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.refreshButton]}
                  onPress={startLANDiscovery}
                >
                  <Text style={styles.buttonText}>Refresh Rooms</Text>
                </TouchableOpacity>
              </View>
             
             {/* Available LAN Rooms */}
             <View style={styles.lanRoomsContainer}>
               <Text style={styles.lanRoomsTitle}>Available LAN Rooms:</Text>
               
               {/* Room Management Info */}
               <Text style={styles.roomManagementInfo}>
                 💡 You can only delete rooms you're hosting. Other players' rooms cannot be deleted.
               </Text>
               
               {/* Current Room Status */}
               {(() => {
                 const serviceStatus = OfflineLANService.getStatus();
                 if (serviceStatus.isHost && serviceStatus.roomId) {
                   return (
                     <View style={styles.currentRoomStatus}>
                       <Ionicons name="home" size={16} color="#28a745" />
                       <Text style={styles.currentRoomStatusText}>
                         Hosting: {serviceStatus.roomId}
                       </Text>
                     </View>
                   );
                 } else if (serviceStatus.roomId && !serviceStatus.isHost) {
                   return (
                     <View style={styles.currentRoomStatus}>
                       <Ionicons name="people" size={16} color="#4a90e2" />
                       <Text style={styles.currentRoomStatusText}>
                         Joined: {serviceStatus.roomId}
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
                              const serviceStatus = OfflineLANService.getStatus();
                              const isHostOfThisRoom = serviceStatus.isHost && serviceStatus.roomId === room.roomId;
                              return isHostOfThisRoom ? styles.ownRoomItem : null;
                            })()
                          ]}
                          onPress={async () => {
                            try {
                              // Check if we're the host of this room
                              const serviceStatus = OfflineLANService.getStatus();
                              const isHostOfThisRoom = serviceStatus.isHost && serviceStatus.roomId === room.roomId;
                              const isJoinedToThisRoom = serviceStatus.roomId === room.roomId && !serviceStatus.isHost;
                              
                              if (isHostOfThisRoom) {
                                // If we're the host, start the game directly
                                console.log('🏠 Host detected - starting game directly');
                                onGameStart(room.roomId, 'lan');
                              } else if (isJoinedToThisRoom) {
                                // If we're already joined to this room, start the game directly
                                console.log('👤 Already joined to room - starting game directly');
                                onGameStart(room.roomId, 'lan');
                              } else {
                                // If we're not joined, join the room first
                                console.log('👤 Joining room as player');
                                await joinLANRoom(room.roomId);
                              }
                            } catch (error) {
                              // Error handling is already in joinLANRoom
                            }
                          }}
                        >
                         <Text style={styles.roomIdText}>
                           {(() => {
                             const serviceStatus = OfflineLANService.getStatus();
                             const isHostOfThisRoom = serviceStatus.isHost && serviceStatus.roomId === room.roomId;
                             return isHostOfThisRoom ? (
                               <>
                                 Room: {room.roomId} (Your Room)
                               </>
                             ) : (
                               `Room: ${room.roomId}`
                             );
                           })()}
                         </Text>
                         <Text style={styles.roomHostText}>Host: {room.hostIP}</Text>
                         <Text style={styles.roomJoinText}>
                           {(() => {
                             const serviceStatus = OfflineLANService.getStatus();
                             const isHostOfThisRoom = serviceStatus.isHost && serviceStatus.roomId === room.roomId;
                             const isJoinedToThisRoom = serviceStatus.roomId === room.roomId && !serviceStatus.isHost;
                             
                             if (isHostOfThisRoom) {
                               return '🏠 Your room - Tap to start';
                             } else if (isJoinedToThisRoom) {
                               return '👤 Joined - Tap to start';
                             } else {
                               return '🎮 Tap to join';
                             }
                           })()}
                         </Text>
                       </TouchableOpacity>
                                               {/* Only show delete button for rooms you're hosting */}
                        {(() => {
                          const serviceStatus = OfflineLANService.getStatus();
                          const isHostOfThisRoom = serviceStatus.isHost && serviceStatus.roomId === room.roomId;
                          return isHostOfThisRoom ? (
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
                 <Text style={styles.noRoomsText}>No LAN rooms found. Create a room to start!</Text>
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
  roomJoinText: {
    fontSize: 12,
    color: '#4a90e2',
    fontStyle: 'italic',
    marginTop: 4,
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
