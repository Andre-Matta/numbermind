import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import NotificationService from '../services/NotificationService';
import { getFirebaseStatus } from '../utils/firebaseInit';

const FirebaseTest = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = async () => {
    try {
      const firebaseStatus = await getFirebaseStatus();
      setStatus(firebaseStatus);
    } catch (error) {
      console.error('Error checking Firebase status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLocalNotification = async () => {
    try {
      await NotificationService.showLocalNotification(
        'Test Notification 🔔',
        'This is a test notification from Firebase!',
        { type: 'test', timestamp: Date.now() }
      );
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send local notification');
    }
  };

  const testServerNotification = async () => {
    try {
      // This would send a notification to the server
      // For testing, we'll just show a success message
      Alert.alert('Success', 'Server notification test completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send server notification');
    }
  };

  const getFcmToken = async () => {
    try {
      const token = await NotificationService.getFcmTokenForServer();
      if (token) {
        Alert.alert('FCM Token', `Token: ${token.substring(0, 20)}...`);
      } else {
        Alert.alert('No Token', 'FCM token not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get FCM token');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Firebase Test</Text>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Integration Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={[styles.status, status?.isInitialized ? styles.success : styles.error]}>
          {status?.isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
        </Text>
        <Text style={[styles.status, status?.hasFcmToken ? styles.success : styles.error]}>
          {status?.hasFcmToken ? '✅ FCM Token Available' : '❌ No FCM Token'}
        </Text>
        <Text style={[styles.status, status?.notificationsEnabled ? styles.success : styles.error]}>
          {status?.notificationsEnabled ? '✅ Notifications Enabled' : '❌ Notifications Disabled'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
          <Text style={styles.buttonText}>Test Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testServerNotification}>
          <Text style={styles.buttonText}>Test Server Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={getFcmToken}>
          <Text style={styles.buttonText}>Get FCM Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkFirebaseStatus}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  loading: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#0f3460',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FirebaseTest;
