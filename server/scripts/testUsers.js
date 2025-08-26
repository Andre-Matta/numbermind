const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function testUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('username email coins gameStats.level gameStats.rating gameStats.rank gameStats.gamesPlayed gameStats.gamesWon gameStats.calculatedWinRate');
    
    console.log(`\n📊 Found ${users.length} users in database:`);
    console.log('=====================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🪙 ${user.coins} coins`);
      console.log(`   🏆 Level ${user.gameStats.level} | Rating ${user.gameStats.rating} | Rank ${user.gameStats.rank}`);
      console.log(`   🎮 ${user.gameStats.gamesPlayed} games | ${user.gameStats.gamesWon} wins | ${user.gameStats.calculatedWinRate}% win rate`);
      console.log('');
    });

    // Test leaderboard queries
    console.log('🧪 Testing Leaderboard Queries:');
    console.log('================================');
    
    // Test by rating
    const topByRating = await User.find({})
      .sort({ 'gameStats.rating': -1 })
      .limit(5)
      .select('username gameStats.rating gameStats.rank');
    
    console.log('\n🏅 Top 5 by Rating:');
    topByRating.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.gameStats.rating} rating (${user.gameStats.rank})`);
    });

    // Test by level
    const topByLevel = await User.find({})
      .sort({ 'gameStats.level': -1 })
      .limit(5)
      .select('username gameStats.level gameStats.rank');
    
    console.log('\n📈 Top 5 by Level:');
    topByLevel.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - Level ${user.gameStats.level} (${user.gameStats.rank})`);
    });

    // Test by wins
    const topByWins = await User.find({})
      .sort({ 'gameStats.gamesWon': -1 })
      .limit(5)
      .select('username gameStats.gamesWon gameStats.gamesPlayed gameStats.calculatedWinRate');
    
    console.log('\n🎯 Top 5 by Wins:');
    topByWins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.gameStats.gamesWon} wins (${user.gameStats.calculatedWinRate}% win rate)`);
    });

    // Test by win rate
    const topByWinRate = await User.find({})
      .sort({ 'gameStats.calculatedWinRate': -1 })
      .limit(5)
      .select('username gameStats.calculatedWinRate gameStats.gamesPlayed gameStats.rank');
    
    console.log('\n💯 Top 5 by Win Rate:');
    topByWinRate.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.gameStats.calculatedWinRate}% win rate (${user.gameStats.gamesPlayed} games, ${user.gameStats.rank})`);
    });

    // Test coin economy
    const totalCoins = users.reduce((sum, user) => sum + user.coins, 0);
    const avgCoins = totalCoins / users.length;
    const richestUser = users.reduce((richest, user) => user.coins > richest.coins ? user : richest);
    
    console.log('\n💰 Coin Economy Summary:');
    console.log(`Total Coins: ${totalCoins.toLocaleString()}`);
    console.log(`Average Coins: ${avgCoins.toFixed(0)}`);
    console.log(`Richest User: ${richestUser.username} with ${richestUser.coins} coins`);

  } catch (error) {
    console.error('❌ Error testing users:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testUsers();
}

module.exports = { testUsers };
