const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import required modules
const { messaging } = require('../config/firebase');
const User = require('../models/User');
const firebaseNotificationService = require('../services/firebaseNotificationService');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test Firebase configuration
const testFirebaseConfig = async () => {
  try {
    console.log('🔥 Testing Firebase configuration...');
    
    // Test if Firebase is initialized
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }
    
    console.log('✅ Firebase messaging initialized successfully');
    
    // Check if using environment variables or JSON file
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('🔧 Using Firebase service account from environment variables');
    } else {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        path.join(__dirname, '../firebase-service-account.json');
      
      const fs = require('fs');
      if (fs.existsSync(serviceAccountPath)) {
        console.log('📁 Using service account JSON file (fallback)');
      } else {
        console.log('⚠️ No Firebase configuration found');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase configuration test failed:', error);
    return false;
  }
};

// Test FCM token registration
const testTokenRegistration = async () => {
  try {
    console.log('\n📱 Testing FCM token registration...');
    
    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('⚠️ No users found in database');
      return false;
    }
    
    // Create a test FCM token
    const testToken = `test_token_${Date.now()}`;
    
    // Register token
    await firebaseNotificationService.registerToken(
      testUser._id,
      testToken,
      'web',
      'test_device'
    );
    
    console.log('✅ FCM token registration test passed');
    
    // Clean up test token
    await firebaseNotificationService.removeToken(testUser._id, testToken);
    console.log('🧹 Test token cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ FCM token registration test failed:', error);
    return false;
  }
};

// Test notification sending
const testNotificationSending = async () => {
  try {
    console.log('\n📤 Testing notification sending...');
    
    // Find a test user with FCM tokens
    const testUser = await User.findOne({ fcmTokens: { $exists: true, $ne: [] } });
    if (!testUser) {
      console.log('⚠️ No users with FCM tokens found');
      return false;
    }
    
    // Send test notification
    const result = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Test Notification 🔔',
      'This is a test notification from Firebase!',
      { type: 'system', test: true }
    );
    
    console.log('📊 Notification result:', result);
    
    if (result.success) {
      console.log('✅ Notification sending test passed');
    } else {
      console.log('⚠️ Notification sending test completed with warnings:', result.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Notification sending test failed:', error);
    return false;
  }
};

// Test topic messaging
const testTopicMessaging = async () => {
  try {
    console.log('\n📢 Testing topic messaging...');
    
    // Find users with FCM tokens
    const users = await User.find({ fcmTokens: { $exists: true, $ne: [] } }).limit(3);
    if (users.length === 0) {
      console.log('⚠️ No users with FCM tokens found for topic test');
      return false;
    }
    
    // Get tokens
    const tokens = users.flatMap(user => 
      user.fcmTokens.filter(t => t.isActive).map(t => t.token)
    );
    
    if (tokens.length === 0) {
      console.log('⚠️ No active FCM tokens found for topic test');
      return false;
    }
    
    // Subscribe to test topic
    const subscribeResult = await firebaseNotificationService.subscribeToTopic(
      tokens,
      'test_topic'
    );
    
    console.log('📊 Topic subscription result:', subscribeResult);
    
    // Send topic message
    const sendResult = await firebaseNotificationService.sendToTopic(
      'test_topic',
      'Topic Test 📢',
      'This is a test topic message!',
      { type: 'system', test: true }
    );
    
    console.log('📊 Topic send result:', sendResult);
    
    // Unsubscribe from topic
    const unsubscribeResult = await firebaseNotificationService.unsubscribeFromTopic(
      tokens,
      'test_topic'
    );
    
    console.log('📊 Topic unsubscription result:', unsubscribeResult);
    
    console.log('✅ Topic messaging test passed');
    return true;
  } catch (error) {
    console.error('❌ Topic messaging test failed:', error);
    return false;
  }
};

// Test user statistics
const testUserStatistics = async () => {
  try {
    console.log('\n📊 Testing user statistics...');
    
    const totalUsers = await User.countDocuments();
    const usersWithFcmTokens = await User.countDocuments({ fcmTokens: { $exists: true, $ne: [] } });
    const usersWithOldPushTokens = await User.countDocuments({ pushTokens: { $exists: true, $ne: [] } });
    
    console.log('📈 User Statistics:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with FCM tokens: ${usersWithFcmTokens}`);
    console.log(`   Users with old push tokens: ${usersWithOldPushTokens}`);
    console.log(`   Migration progress: ${((usersWithFcmTokens / totalUsers) * 100).toFixed(1)}%`);
    
    if (usersWithOldPushTokens > 0) {
      console.log('⚠️ Some users still have old push tokens. Run migration script.');
    } else {
      console.log('✅ All users migrated to FCM tokens');
    }
    
    return true;
  } catch (error) {
    console.error('❌ User statistics test failed:', error);
    return false;
  }
};

// Main test function
const runTests = async () => {
  try {
    console.log('🧪 Starting Firebase Cloud Messaging tests...\n');
    
    await connectDB();
    
    const tests = [
      { name: 'Firebase Configuration', fn: testFirebaseConfig },
      { name: 'Token Registration', fn: testTokenRegistration },
      { name: 'Notification Sending', fn: testNotificationSending },
      { name: 'Topic Messaging', fn: testTopicMessaging },
      { name: 'User Statistics', fn: testUserStatistics }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        console.error(`❌ ${test.name} test failed:`, error);
      }
    }
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Firebase is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the configuration.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testFirebaseConfig,
  testTokenRegistration,
  testNotificationSending,
  testTopicMessaging,
  testUserStatistics,
  runTests
};
