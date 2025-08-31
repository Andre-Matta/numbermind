const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

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

// Migration function
const migrateToFirebase = async () => {
  try {
    console.log('🔄 Starting migration from pushTokens to fcmTokens...');
    
    // Find all users with pushTokens
    const usersWithPushTokens = await User.find({
      pushTokens: { $exists: true, $ne: [] }
    });
    
    console.log(`📊 Found ${usersWithPushTokens.length} users with pushTokens`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithPushTokens) {
      try {
        // Convert pushTokens to fcmTokens
        if (user.pushTokens && user.pushTokens.length > 0) {
          user.fcmTokens = user.pushTokens.map(tokenInfo => ({
            token: tokenInfo.token,
            platform: tokenInfo.platform,
            deviceId: tokenInfo.deviceId,
            isActive: tokenInfo.isActive,
            lastUsed: tokenInfo.lastUsed
          }));
          
          // Remove old pushTokens field
          user.pushTokens = undefined;
          
          await user.save();
          migratedCount++;
          console.log(`✅ Migrated user ${user.username} (${user._id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating user ${user.username}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total processed: ${usersWithPushTokens.length} users`);
    
    // Verify migration
    const usersWithFcmTokens = await User.find({
      fcmTokens: { $exists: true, $ne: [] }
    });
    
    const usersWithOldPushTokens = await User.find({
      pushTokens: { $exists: true, $ne: [] }
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`📱 Users with fcmTokens: ${usersWithFcmTokens.length}`);
    console.log(`📱 Users with old pushTokens: ${usersWithOldPushTokens.length}`);
    
    if (usersWithOldPushTokens.length === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Some users still have old pushTokens. Manual review may be needed.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Clean up old Notification collection (optional)
const cleanupNotificationCollection = async () => {
  try {
    console.log('\n🧹 Cleaning up old Notification collection...');
    
    // Check if Notification model exists
    const Notification = mongoose.models.Notification;
    if (Notification) {
      const count = await Notification.countDocuments();
      console.log(`📊 Found ${count} notifications in old collection`);
      
      if (count > 0) {
        const result = await Notification.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} notifications`);
      }
    } else {
      console.log('ℹ️  Notification collection not found (already cleaned up)');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up Notification collection:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateToFirebase();
    await cleanupNotificationCollection();
    
    console.log('\n🎉 Migration process completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  main();
}

module.exports = { migrateToFirebase, cleanupNotificationCollection };
