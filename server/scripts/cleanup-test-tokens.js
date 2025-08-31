const mongoose = require('mongoose');
const User = require('../models/User');
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

// Clean up test tokens
const cleanupTestTokens = async () => {
  try {
    console.log('\n🧹 Cleaning up test FCM tokens...');
    
    // Find users with test tokens
    const usersWithTestTokens = await User.find({
      'fcmTokens.token': { $regex: /^test_/ }
    });
    
    console.log(`📱 Found ${usersWithTestTokens.length} users with test tokens`);
    
    if (usersWithTestTokens.length === 0) {
      console.log('✅ No test tokens found to clean up');
      return { cleanedCount: 0 };
    }
    
    let cleanedCount = 0;
    
    for (const user of usersWithTestTokens) {
      try {
        // Remove test tokens
        const originalCount = user.fcmTokens.length;
        user.fcmTokens = user.fcmTokens.filter(token => !token.token.startsWith('test_'));
        const newCount = user.fcmTokens.length;
        
        if (originalCount !== newCount) {
          await user.save();
          cleanedCount++;
          console.log(`🧹 Cleaned ${originalCount - newCount} test tokens for ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Failed to clean tokens for ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Tokens cleaned: ${cleanedCount} users`);
    console.log(`📱 Total processed: ${usersWithTestTokens.length}`);
    
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
    
    return { cleanedCount };
  } catch (error) {
    console.error('❌ Error cleaning up test tokens:', error);
    return { cleanedCount: 0 };
  }
};

// Show current token status
const showTokenStatus = async () => {
  try {
    console.log('\n📊 Current FCM Token Status:');
    
    const stats = await User.aggregate([
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
          },
          usersWithTestTokens: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ['$fcmTokens', []] },
                          cond: { $regexMatch: { input: '$$this.token', regex: /^test_/ } }
                        }
                      }
                    },
                    0
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`   Total users: ${stat.totalUsers}`);
      console.log(`   Users with any FCM tokens: ${stat.usersWithTokens}`);
      console.log(`   Users with test tokens: ${stat.usersWithTestTokens}`);
      console.log(`   Users with real tokens: ${stat.usersWithTokens - stat.usersWithTestTokens}`);
      console.log(`   Coverage: ${((stat.usersWithTokens / stat.totalUsers) * 100).toFixed(1)}%`);
    }
    
    // Show sample users with test tokens
    const usersWithTestTokens = await User.find({
      'fcmTokens.token': { $regex: /^test_/ }
    }).limit(5);
    
    if (usersWithTestTokens.length > 0) {
      console.log('\n👥 Sample users with test tokens:');
      usersWithTestTokens.forEach(user => {
        const testTokenCount = user.fcmTokens.filter(t => t.token.startsWith('test_')).length;
        console.log(`   - ${user.username} (${user.email}): ${testTokenCount} test tokens`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error showing token status:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🧹 FCM Token Cleanup Script');
  console.log('============================\n');
  
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Show current status
    await showTokenStatus();
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will remove all test FCM tokens!');
    console.log('   Only run this after fixing client-side FCM token registration.');
    console.log('   Test tokens start with "test_" prefix.');
    
    // For now, just show what would be cleaned
    console.log('\n💡 To actually clean up test tokens, uncomment the cleanup line in this script.');
    
    // Uncomment the next line when you're ready to clean up
    // await cleanupTestTokens();
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Export functions for manual testing
module.exports = {
  cleanupTestTokens,
  showTokenStatus
};

// Run if called directly
if (require.main === module) {
  main();
}
