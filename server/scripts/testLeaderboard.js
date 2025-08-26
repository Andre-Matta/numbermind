const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Import User model
const User = require('../models/User');

async function testLeaderboard() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if users exist
    const userCount = await User.countDocuments({});
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found in database. Please run populateUsers.js first.');
      return;
    }

    // Get a few sample users to verify data structure
    const sampleUsers = await User.find({})
      .select('username gameStats.rating gameStats.level gameStats.gamesWon gameStats.gamesPlayed gameStats.rank')
      .limit(3);

    console.log('\n👥 Sample users:');
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Rating: ${user.gameStats.rating}`);
      console.log(`   Level: ${user.gameStats.level}`);
      console.log(`   Games: ${user.gameStats.gamesPlayed} played, ${user.gameStats.gamesWon} won`);
      console.log(`   Rank: ${user.gameStats.rank}`);
      console.log('');
    });

    // Test leaderboard queries manually
    console.log('🧪 Testing leaderboard queries manually:');
    console.log('========================================');

    // Test by rating
    const topByRating = await User.find({})
      .select('username gameStats.rating gameStats.rank')
      .sort({ 'gameStats.rating': -1 })
      .limit(5);
    
    console.log('\n🏅 Top 5 by Rating:');
    topByRating.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.gameStats.rating} rating (${user.gameStats.rank})`);
    });

    // Test by level
    const topByLevel = await User.find({})
      .select('username gameStats.level gameStats.rank')
      .sort({ 'gameStats.level': -1 })
      .limit(5);
    
    console.log('\n📈 Top 5 by Level:');
    topByLevel.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - Level ${user.gameStats.level} (${user.gameStats.rank})`);
    });

    // Test by wins
    const topByWins = await User.find({})
      .select('username gameStats.gamesWon gameStats.gamesPlayed')
      .sort({ 'gameStats.gamesWon': -1 })
      .limit(5);
    
    console.log('\n🎯 Top 5 by Wins:');
    topByWins.forEach((user, index) => {
      const winRate = user.gameStats.gamesPlayed > 0 
        ? Math.round((user.gameStats.gamesWon / user.gameStats.gamesPlayed) * 100)
        : 0;
      console.log(`${index + 1}. ${user.username} - ${user.gameStats.gamesWon} wins (${winRate}% win rate)`);
    });

    // Test win rate calculation
    console.log('\n💯 Testing win rate calculation:');
    const usersWithWinRate = await User.aggregate([
      {
        $addFields: {
          calculatedWinRate: {
            $cond: {
              if: { $gt: ['$gameStats.gamesPlayed', 0] },
              then: { $multiply: [{ $divide: ['$gameStats.gamesWon', '$gameStats.gamesPlayed'] }, 100] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { calculatedWinRate: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          username: 1,
          calculatedWinRate: 1,
          'gameStats.gamesPlayed': 1,
          'gameStats.gamesWon': 1
        }
      }
    ]);

    console.log('Top 5 by Win Rate (aggregate):');
    usersWithWinRate.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.calculatedWinRate.toFixed(1)}% win rate (${user.gameStats.gamesWon}/${user.gameStats.gamesPlayed} games)`);
    });

  } catch (error) {
    console.error('❌ Error testing leaderboard:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testLeaderboard();
}

module.exports = { testLeaderboard };
