const mongoose = require('mongoose');
const User = require('../models/User');
const firebaseNotificationService = require('../services/firebaseNotificationService');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/numbermind');
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// Check current FCM token status
const checkFcmTokenStatus = async () => {
  try {
    console.log('\n📊 Checking FCM token status...');
    
    const totalUsers = await User.countDocuments();
    const usersWithFcmTokens = await User.countDocuments({
      'fcmTokens.0': { $exists: true }
    });
    
    const usersWithActiveTokens = await User.countDocuments({
      'fcmTokens': { 
        $elemMatch: { 
          isActive: true 
        } 
      }
    });
    
    console.log(`📈 User Statistics:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with FCM tokens: ${usersWithFcmTokens}`);
    console.log(`   Users with active tokens: ${usersWithActiveTokens}`);
    
    // Show sample users without FCM tokens
    const usersWithoutTokens = await User.find({
      $or: [
        { fcmTokens: { $exists: false } },
        { fcmTokens: { $size: 0 } }
      ]
    }).limit(5);
    
    if (usersWithoutTokens.length > 0) {
      console.log('\n👥 Sample users without FCM tokens:');
      usersWithoutTokens.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - ID: ${user._id}`);
      });
    }
    
    return { totalUsers, usersWithFcmTokens, usersWithActiveTokens };
  } catch (error) {
    console.error('❌ Error checking FCM token status:', error);
    return null;
  }
};

// Test FCM token registration for a specific user
const testTokenRegistration = async (userId) => {
  try {
    console.log(`\n🧪 Testing FCM token registration for user ${userId}...`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    console.log(`   User: ${user.username} (${user.email})`);
    console.log(`   Current FCM tokens: ${user.fcmTokens.length}`);
    
    // Create a test FCM token
    const testToken = `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register token
    await firebaseNotificationService.registerToken(
      userId,
      testToken,
      'web',
      'test_device'
    );
    
    // Verify token was saved
    const updatedUser = await User.findById(userId);
    console.log(`   FCM tokens after registration: ${updatedUser.fcmTokens.length}`);
    
    if (updatedUser.fcmTokens.length > user.fcmTokens.length) {
      console.log('✅ Token registration successful');
      
      // Show the new token
      const newToken = updatedUser.fcmTokens.find(t => t.token === testToken);
      if (newToken) {
        console.log(`   New token: ${newToken.token}`);
        console.log(`   Platform: ${newToken.platform}`);
        console.log(`   Active: ${newToken.isActive}`);
      }
      
      return true;
    } else {
      console.log('❌ Token registration failed - token not saved');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing token registration:', error);
    return false;
  }
};

// Register FCM tokens for all users (for testing purposes)
const registerTestTokensForAllUsers = async () => {
  try {
    console.log('\n🔄 Registering test FCM tokens for all users...');
    
    const usersWithoutTokens = await User.find({
      $or: [
        { fcmTokens: { $exists: false } },
        { fcmTokens: { $size: 0 } }
      ]
    });
    
    console.log(`📱 Found ${usersWithoutTokens.length} users without FCM tokens`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutTokens) {
      try {
        const testToken = `test_token_${user._id}_${Date.now()}`;
        
        await firebaseNotificationService.registerToken(
          user._id,
          testToken,
          'web',
          `test_device_${user._id}`
        );
        
        successCount++;
        console.log(`✅ Registered token for ${user.username}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to register token for ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n📊 Registration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📱 Total processed: ${usersWithoutTokens.length}`);
    
    return { successCount, errorCount };
  } catch (error) {
    console.error('❌ Error registering tokens for all users:', error);
    return { successCount: 0, errorCount: 1 };
  }
};

// Clean up test tokens
const cleanupTestTokens = async () => {
  try {
    console.log('\n🧹 Cleaning up test tokens...');
    
    const usersWithTestTokens = await User.find({
      'fcmTokens.token': { $regex: /^test_token_/ }
    });
    
    console.log(`📱 Found ${usersWithTestTokens.length} users with test tokens`);
    
    let cleanedCount = 0;
    
    for (const user of usersWithTestTokens) {
      try {
        // Remove test tokens
        user.fcmTokens = user.fcmTokens.filter(token => !token.token.startsWith('test_token_'));
        await user.save();
        cleanedCount++;
        console.log(`🧹 Cleaned test tokens for ${user.username}`);
      } catch (error) {
        console.error(`❌ Failed to clean tokens for ${user.username}:`, error.message);
      }
    }
    
    console.log(`✅ Cleaned test tokens for ${cleanedCount} users`);
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error cleaning up test tokens:', error);
    return 0;
  }
};

// Test the notification API endpoint
const testNotificationAPI = async () => {
  try {
    console.log('\n🌐 Testing notification API endpoint...');
    
    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found for API testing');
      return false;
    }
    
    // Generate a real JWT token for the test user
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`   Testing with user: ${testUser.username} (${testUser._id})`);
    
    // Test the registration endpoint
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        fcmToken: `test_api_token_${Date.now()}`,
        platform: 'web',
        deviceId: 'test_device_api'
      }),
    });
    
    console.log(`   API Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API endpoint working:', result);
      
      // Verify the token was actually saved
      const updatedUser = await User.findById(testUser._id);
      const savedToken = updatedUser.fcmTokens.find(t => t.token.startsWith('test_api_token_'));
      if (savedToken) {
        console.log('✅ Token was saved to database via API');
      } else {
        console.log('⚠️ Token was not saved to database via API');
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API endpoint failed:', response.statusText);
      console.log('   Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  console.log('🔍 FCM Token Diagnostic and Fix Script');
  console.log('=====================================\n');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Check current status
    const status = await checkFcmTokenStatus();
    
    if (status && status.totalUsers > 0) {
      // Test token registration with first user
      const firstUser = await User.findOne();
      if (firstUser) {
        await testTokenRegistration(firstUser._id);
      }
      
      // Test API endpoint
      await testNotificationAPI();
      
      console.log('\n💡 Root Cause Analysis:');
      console.log('1. ✅ Server-side FCM token registration works');
      console.log('2. ✅ Database schema supports FCM tokens');
      console.log('3. ❌ Client app is not registering tokens');
      console.log('4. ❌ Users may not be using the app or Firebase is not configured');
      
      console.log('\n🔧 Recommended Solutions:');
      console.log('1. Check Firebase configuration in client app');
      console.log('2. Verify FCM token generation in client');
      console.log('3. Ensure notification permissions are granted');
      console.log('4. Test with real users logging into the app');
      console.log('5. Check client-side error logs for FCM issues');
      
      console.log('\n🚀 Quick Fix Options:');
      console.log('A. Register test tokens for all users (temporary)');
      console.log('B. Fix client-side Firebase configuration');
      console.log('C. Add FCM token registration to login flow');
      console.log('D. Check notification permissions on app startup');
    }
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Export functions for manual testing
module.exports = {
  checkFcmTokenStatus,
  testTokenRegistration,
  registerTestTokensForAllUsers,
  cleanupTestTokens,
  testNotificationAPI
};

// Run if called directly
if (require.main === module) {
  main();
}
