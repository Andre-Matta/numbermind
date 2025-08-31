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

// Test notification with proper data format
const testNotification = async () => {
  try {
    console.log('\n📤 Testing notification with fixed data format...');
    
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
      'This is a test notification with fixed data format!',
      {
        type: 'system',
        test: 'true', // String value
        timestamp: new Date().toISOString(),
        userId: testUser._id.toString()
      }
    );
    
    if (result.success) {
      console.log('✅ Test notification sent successfully');
      console.log(`   Message: ${result.message}`);
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
  console.log('🧪 Notification Test Script');
  console.log('==========================\n');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    await testNotification();
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}
