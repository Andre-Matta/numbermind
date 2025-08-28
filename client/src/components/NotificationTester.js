import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import NotificationService from '../services/NotificationService';
import { useAuth } from '../context/AuthContext';

export default function NotificationTester({ onClose }) {
  const [testMessage, setTestMessage] = useState('Test notification message');
  const [testTitle, setTestTitle] = useState('Test Notification');
  const { user } = useAuth();

  const testLocalNotification = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.sendLocalNotification(
        testTitle,
        testMessage,
        { type: 'system', test: true, timestamp: Date.now() }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Test notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testGameInvite = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyGameInvite('TestPlayer', 'TEST123');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Game invite notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send game invite notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testMatchFound = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyMatchFound('TestOpponent', 'GAME456');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Match found notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send match found notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testYourTurn = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyYourTurn('GAME789');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your turn notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send your turn notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testGameResult = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyGameResult(true, 'TestOpponent', 150);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Game result notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send game result notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testAchievement = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyAchievement('Test Achievement', 'You unlocked a test achievement!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Achievement notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const testConnectionStatus = async () => {
    try {
      // Send local notification only for testing (no server save)
      await NotificationService.notifyConnectionStatus(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Connection status notification sent locally! Check your device notification center.');
    } catch (error) {
      console.error('Failed to send connection status notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAllNotifications();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const getPushToken = async () => {
    try {
      const token = await NotificationService.getPushToken();
      if (token) {
        Alert.alert('Push Token', `Token: ${token.substring(0, 50)}...`);
        console.log('Full push token:', token);
      } else {
        Alert.alert('No Token', 'No push token available');
      }
    } catch (error) {
      console.error('Failed to get push token:', error);
      Alert.alert('Error', 'Failed to get push token');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Tester</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Custom Notification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Notification</Text>
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              placeholderTextColor="#888"
              value={testTitle}
              onChangeText={setTestTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Notification Message"
              placeholderTextColor="#888"
              value={testMessage}
              onChangeText={setTestMessage}
              multiline
            />
            <TouchableOpacity style={styles.testButton} onPress={testLocalNotification}>
              <Ionicons name="notifications" size={20} color="#fff" />
              <Text style={styles.buttonText}>Send Custom Notification</Text>
            </TouchableOpacity>
          </View>

          {/* Game Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Notifications</Text>
            
            <TouchableOpacity style={styles.testButton} onPress={testGameInvite}>
              <Ionicons name="game-controller" size={20} color="#fff" />
              <Text style={styles.buttonText}>Game Invite</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testMatchFound}>
              <Ionicons name="trophy" size={20} color="#fff" />
              <Text style={styles.buttonText}>Match Found</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testYourTurn}>
              <Ionicons name="dice" size={20} color="#fff" />
              <Text style={styles.buttonText}>Your Turn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testGameResult}>
              <Ionicons name="star" size={20} color="#fff" />
              <Text style={styles.buttonText}>Game Result (Victory)</Text>
            </TouchableOpacity>
          </View>

          {/* Other Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Notifications</Text>
            
            <TouchableOpacity style={styles.testButton} onPress={testAchievement}>
              <Ionicons name="medal" size={20} color="#fff" />
              <Text style={styles.buttonText}>Achievement</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testConnectionStatus}>
              <Ionicons name="wifi" size={20} color="#fff" />
              <Text style={styles.buttonText}>Connection Status</Text>
            </TouchableOpacity>
          </View>

          {/* Utility Functions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Utility Functions</Text>
            
            <TouchableOpacity style={styles.testButton} onPress={getPushToken}>
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.buttonText}>Get Push Token</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.testButton, styles.clearButton]} onPress={clearAllNotifications}>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.buttonText}>Clear All Notifications</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Testing Instructions</Text>
            <Text style={styles.instructionText}>
              1. Make sure you've granted notification permissions{'\n'}
              2. Test notifications are LOCAL ONLY (not saved to server){'\n'}
              3. Check your device's notification center to see them{'\n'}
              4. These tests won't appear in the app's notification screen{'\n'}
              5. Use Expo Go for testing local notification behavior
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});
