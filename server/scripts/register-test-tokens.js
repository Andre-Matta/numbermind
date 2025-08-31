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

// Register test FCM tokens for all users
const registerTestTokensForAllUsers = async () => {
  try {
    console.log('\n🔄 Registering test FCM tokens for all users...');
    
    const allUsers = await User.find({});
    console.log(`📱 Found ${allUsers.length} total users`);
    
    const usersWithoutTokens = allUsers.filter(user => 
      !user.fcmTokens || user.fcmTokens.length === 0
    );
    
    console.log(`📱 Users without FCM tokens: ${usersWithoutTokens.length}`);
    
    if (usersWithoutTokens.length === 0) {
      console.log('✅ All users already have FCM tokens!');
      return { successCount: 0, errorCount: 0 };
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutTokens) {
      try {
        // Create a realistic test FCM token
        const testToken = `test_fcm_token_${user._id}_${Date.now()}`;
        
        await firebaseNotificationService.registerToken(
          user._id,
          testToken,
          'web',
          `test_device_${user._id}`
        );
        
        successCount++;
        console.log(`✅ Registered token for ${user.username} (${user.email})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to register token for ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n📊 Registration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📱 Total processed: ${usersWithoutTokens.length}`);
    
    // Show final statistics
    const finalStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithTokens: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$fcmTokens', []] } }, 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    if (finalStats.length > 0) {
      const stats = finalStats[0];
      console.log(`\n📈 Final Statistics:`);
      console.log(`   Total users: ${stats.totalUsers}`);
      console.log(`   Users with FCM tokens: ${stats.usersWithTokens}`);
      console.log(`   Coverage: ${((stats.usersWithTokens / stats.totalUsers) * 100).toFixed(1)}%`);
    }
    
    return { successCount, errorCount };
  } catch (error) {
    console.error('❌ Error registering tokens for all users:', error);
    return { successCount: 0, errorCount: 1 };
  }
};

// Test sending a notification to all users with tokens
const testNotificationToAllUsers = async () => {
  try {
    console.log('\n📤 Testing notification to all users with FCM tokens...');
    
    const usersWithTokens = await User.find({
      'fcmTokens.0': { $exists: true }
    });
    
    console.log(`📱 Found ${usersWithTokens.length} users with FCM tokens`);
    
    if (usersWithTokens.length === 0) {
      console.log('⚠️ No users with FCM tokens found');
      return false;
    }
    
    // Send test notification to first user
    const testUser = usersWithTokens[0];
    console.log(`🧪 Sending test notification to ${testUser.username}...`);
    
    const result = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Test Notification 🧪',
      'This is a test notification to verify FCM tokens are working!',
      {
        type: 'system',
        test: 'true', // String value
        timestamp: new Date().toISOString(),
        userId: testUser._id.toString()
      }
    );
    
    if (result.success) {
      console.log('✅ Test notification sent successfully');
      console.log(`   Results: ${JSON.stringify(result.results, null, 2)}`);
    } else {
      console.log('❌ Test notification failed');
      console.log(`   Error: ${result.message}`);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error testing notification:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  console.log('🚀 FCM Token Registration Script');
  console.log('================================\n');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Register test tokens
    const registrationResult = await registerTestTokensForAllUsers();
    
    if (registrationResult.successCount > 0) {
      console.log('\n⏳ Waiting 2 seconds before testing notifications...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test notifications
      await testNotificationToAllUsers();
    }
    
    console.log('\n✅ Script completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Test the FCM Token Tester in your app');
    console.log('2. Check if notifications are received');
    console.log('3. Fix client-side Firebase configuration');
    console.log('4. Remove test tokens once client is working');
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Export functions for manual testing
module.exports = {
  registerTestTokensForAllUsers,
  testNotificationToAllUsers
};

// Run if called directly
if (require.main === module) {
  main();
}
