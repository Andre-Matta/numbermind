import NotificationService from '../services/NotificationService';

/**
 * Initialize Firebase services when the app starts
 */
export const initializeFirebase = async () => {
  try {
    console.log('🚀 Initializing Firebase services...');
    
    // Initialize Firebase notification service
    const notificationInitialized = await NotificationService.initialize();
    
    if (notificationInitialized) {
      console.log('✅ Firebase services initialized successfully');
      
      // Register FCM token with server if user is logged in
      await NotificationService.registerTokenWithServer();
      
      return true;
    } else {
      console.log('⚠️ Firebase services initialization failed, using fallback');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase services:', error);
    return false;
  }
};

/**
 * Clean up Firebase services when the app is closed
 */
export const cleanupFirebase = () => {
  try {
    console.log('🧹 Cleaning up Firebase services...');
    NotificationService.cleanup();
    console.log('✅ Firebase services cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up Firebase services:', error);
  }
};

/**
 * Get Firebase initialization status
 */
export const getFirebaseStatus = () => {
  return {
    isInitialized: NotificationService.isInitialized,
    hasFcmToken: !!NotificationService.fcmToken,
    notificationsEnabled: NotificationService.areNotificationsEnabled()
  };
};

export default {
  initializeFirebase,
  cleanupFirebase,
  getFirebaseStatus
};
