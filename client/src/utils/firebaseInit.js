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
      await registerFcmTokenWithRetry();
      
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
 * Register FCM token with retry logic
 */
const registerFcmTokenWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting FCM token registration (attempt ${attempt}/${maxRetries})...`);
      
      const success = await NotificationService.registerTokenWithServer();
      
      if (success) {
        console.log('✅ FCM token registered successfully');
        return true;
      } else {
        console.log(`⚠️ FCM token registration failed (attempt ${attempt})`);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error(`❌ Error registering FCM token (attempt ${attempt}):`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log('❌ FCM token registration failed after all retries');
  return false;
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

/**
 * Force FCM token registration (useful for debugging)
 */
export const forceFcmTokenRegistration = async () => {
  try {
    console.log('🔧 Force registering FCM token...');
    
    // Re-initialize if needed
    if (!NotificationService.isInitialized) {
      await NotificationService.initialize();
    }
    
    // Force token registration
    const success = await registerFcmTokenWithRetry(5);
    
    if (success) {
      console.log('✅ Force FCM token registration successful');
    } else {
      console.log('❌ Force FCM token registration failed');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error in force FCM token registration:', error);
    return false;
  }
};

export default {
  initializeFirebase,
  cleanupFirebase,
  getFirebaseStatus,
  forceFcmTokenRegistration
};
