import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QRCodeShare({ connectionInfo, onClose }) {
  if (!connectionInfo) {
    return null;
  }

  const shareConnectionInfo = async () => {
    try {
      const shareText = `Join my NumberMind game!\n\nRoom ID: ${connectionInfo.roomId}\nHost IP: ${connectionInfo.hostIP}\nPort: ${connectionInfo.port}\n\nMake sure both devices are on the same WiFi network.`;
      
      await Share.share({
        message: shareText,
        title: 'NumberMind - Join Game',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share connection info');
    }
  };

  const copyToClipboard = () => {
    const connectionText = `${connectionInfo.roomId}|${connectionInfo.hostIP}|${connectionInfo.port}`;
    
    // In a real app, you'd use Clipboard API
    Alert.alert(
      'Connection Info Copied',
      `Room ID: ${connectionInfo.roomId}\nHost IP: ${connectionInfo.hostIP}\nPort: ${connectionInfo.port}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Game Room</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={80} color="#4a90e2" />
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>(Would show connection info)</Text>
          </View>

          <View style={styles.connectionInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room ID:</Text>
              <Text style={styles.infoValue}>{connectionInfo.roomId}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Host IP:</Text>
              <Text style={styles.infoValue}>{connectionInfo.hostIP}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Port:</Text>
              <Text style={styles.infoValue}>{connectionInfo.port}</Text>
            </View>
          </View>

          <Text style={styles.instructions}>
            Share this information with your friend to join the game.
            Both devices must be on the same WiFi network.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={shareConnectionInfo}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.copyButton]}
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Copy Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrText: {
    fontSize: 18,
    color: '#4a90e2',
    fontWeight: '600',
    marginTop: 10,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  connectionInfo: {
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#28a745',
  },
  copyButton: {
    backgroundColor: '#6f42c1',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
}); 