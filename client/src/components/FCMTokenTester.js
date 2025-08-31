import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { forceFcmTokenRegistration, getFirebaseStatus } from '../utils/firebaseInit';
import NotificationService from '../services/NotificationService';
import messaging from '@react-native-firebase/messaging';

const FCMTokenTester = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const firebaseStatus = getFirebaseStatus();
      const fcmToken = await NotificationService.getFcmToken();
      
      // Check if Firebase messaging is available
      let messagingAvailable = false;
      try {
        await messaging().getToken();
        messagingAvailable = true;
      } catch (error) {
        console.log('Firebase messaging not available:', error.message);
      }
      
      setStatus({
        firebase: firebaseStatus,
        fcmToken: fcmToken,
        messagingAvailable,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error checking status:', error);
      Alert.alert('Error', 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const testTokenRegistration = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing FCM token registration...');
      
      const success = await forceFcmTokenRegistration();
      
      if (success) {
        Alert.alert('Success', 'FCM token registration successful!');
      } else {
        Alert.alert('Error', 'FCM token registration failed. Check console for details.');
      }
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('Error testing token registration:', error);
      Alert.alert('Error', 'Failed to test token registration');
    } finally {
      setLoading(false);
    }
  };

  const testServerRegistration = async () => {
    try {
      setLoading(true);
      console.log('🌐 Testing server registration...');
      
      const success = await NotificationService.registerTokenWithServer();
      
      if (success) {
        Alert.alert('Success', 'Server registration successful!');
      } else {
        Alert.alert('Error', 'Server registration failed. Check console for details.');
      }
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('Error testing server registration:', error);
      Alert.alert('Error', 'Failed to test server registration');
    } finally {
      setLoading(false);
    }
  };

  const initializeFirebase = async () => {
    try {
      setLoading(true);
      console.log('🔥 Initializing Firebase...');
      
      const success = await NotificationService.initialize();
      
      if (success) {
        Alert.alert('Success', 'Firebase initialized successfully!');
      } else {
        Alert.alert('Error', 'Firebase initialization failed. Check console for details.');
      }
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      Alert.alert('Error', 'Failed to initialize Firebase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FCM Token Tester</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={checkStatus}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={initializeFirebase}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Initialize Firebase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testTokenRegistration}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Token Registration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testServerRegistration}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Server Registration</Text>
          </TouchableOpacity>
        </View>

        {status && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status ({status.timestamp})</Text>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Firebase Initialized:</Text>
              <Text style={[styles.statusValue, status.firebase.isInitialized ? styles.success : styles.error]}>
                {status.firebase.isInitialized ? 'Yes' : 'No'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Has FCM Token:</Text>
              <Text style={[styles.statusValue, status.firebase.hasFcmToken ? styles.success : styles.error]}>
                {status.firebase.hasFcmToken ? 'Yes' : 'No'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Firebase Messaging:</Text>
              <Text style={[styles.statusValue, status.messagingAvailable ? styles.success : styles.error]}>
                {status.messagingAvailable ? 'Available' : 'Not Available'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Notifications Enabled:</Text>
              <Text style={[styles.statusValue, status.firebase.notificationsEnabled ? styles.success : styles.error]}>
                {status.firebase.notificationsEnabled ? 'Yes' : 'No'}
              </Text>
            </View>

            {status.fcmToken && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>FCM Token:</Text>
                <Text style={styles.tokenText} numberOfLines={3}>
                  {status.fcmToken}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            1. Press "Check Status" to see current Firebase and FCM token status{'\n'}
            2. If Firebase is not initialized, press "Initialize Firebase"{'\n'}
            3. Press "Test Token Registration" to force FCM token registration{'\n'}
            4. Press "Test Server Registration" to test server communication{'\n'}
            5. Check the console for detailed logs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
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
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  tokenText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default FCMTokenTester;
