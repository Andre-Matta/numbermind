const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/database');
// Import User model
const User = require('../models/User');

// Define available skins with their requirements
const availableSkins = [
  { name: 'Gold Theme', minLevel: 5, minRank: 'Bronze', rarity: 'common' },
  { name: 'Neon Theme', minLevel: 10, minRank: 'Silver', rarity: 'uncommon' },
  { name: 'Crystal Theme', minLevel: 15, minRank: 'Gold', rarity: 'rare' },
  { name: 'Platinum Theme', minLevel: 20, minRank: 'Platinum', rarity: 'epic' },
  { name: 'Rainbow Theme', minLevel: 25, minRank: 'Diamond', rarity: 'legendary' }
];

// Function to get skins for a user based on their level and rank
function getSkinsForUser(level, rank) {
  const userSkins = ['default']; // All users start with default skin
  
  // Add skins based on level and rank requirements
  availableSkins.forEach(skin => {
    if (level >= skin.minLevel) {
      // Check rank requirement
      const rankOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4, 'Diamond': 5 };
      const userRankValue = rankOrder[rank] || 1;
      const requiredRankValue = rankOrder[skin.minRank] || 1;
      
      if (userRankValue >= requiredRankValue) {
        userSkins.push(skin.name);
      }
    }
  });
  
  // Add some random bonus skins based on level (higher level = more skins)
  if (level >= 25) {
    // High-level users get bonus rare skins
    if (!userSkins.includes('Platinum Theme')) {
      userSkins.push('Platinum Theme');
    }
  }
  
  if (level >= 18) {
    // Mid-high level users might get Crystal Theme
    if (!userSkins.includes('Crystal Theme')) {
      userSkins.push('Crystal Theme');
    }
  }
  
  return userSkins;
}

// Sample users data with different stats
const sampleUsers = [
  {
    username: 'AndyVen',
    email: 'andyadel39@gmail.com',
    password: 'Andy1234@Ven',
    coins: 5000,
    gameStats: {
      level: 25,
      rating: 5000,
      gamesPlayed: 500,
      gamesWon: 499,
      gamesLost: 1,
      winStreak: 499,
      bestWinStreak: 499,
      averageGuesses: 2,
      rank: 'Diamond'
    }
  },
  {
    username: 'NumberMind_Pro',
    email: 'pro@numbermind.com',
    password: 'password123',
    coins: 5000,
    gameStats: {
      level: 25,
      rating: 1850,
      gamesPlayed: 150,
      gamesWon: 120,
      gamesLost: 30,
      winStreak: 8,
      bestWinStreak: 15,
      averageGuesses: 4.2,
      rank: 'Diamond'
    }
  },
  {
    username: 'CodeBreaker_Elite',
    email: 'elite@numbermind.com',
    password: 'password123',
    coins: 3200,
    gameStats: {
      level: 18,
      rating: 1650,
      gamesPlayed: 95,
      gamesWon: 75,
      gamesLost: 20,
      winStreak: 5,
      bestWinStreak: 12,
      averageGuesses: 4.5,
      rank: 'Platinum'
    }
  },
  {
    username: 'NumberNinja',
    email: 'ninja@numbermind.com',
    password: 'password123',
    coins: 2800,
    gameStats: {
      level: 15,
      rating: 1450,
      gamesPlayed: 80,
      gamesWon: 60,
      gamesLost: 20,
      winStreak: 3,
      bestWinStreak: 8,
      averageGuesses: 4.8,
      rank: 'Gold'
    }
  },
  {
    username: 'LogicMaster',
    email: 'logic@numbermind.com',
    password: 'password123',
    coins: 2100,
    gameStats: {
      level: 12,
      rating: 1250,
      gamesPlayed: 65,
      gamesWon: 45,
      gamesLost: 20,
      winStreak: 2,
      bestWinStreak: 6,
      averageGuesses: 5.1,
      rank: 'Silver'
    }
  },
  {
    username: 'PuzzleSolver',
    email: 'puzzle@numbermind.com',
    password: 'password123',
    coins: 1800,
    gameStats: {
      level: 10,
      rating: 1100,
      gamesPlayed: 55,
      gamesWon: 35,
      gamesLost: 20,
      winStreak: 1,
      bestWinStreak: 4,
      averageGuesses: 5.5,
      rank: 'Bronze'
    }
  },
  {
    username: 'BrainTeaser',
    email: 'brain@numbermind.com',
    password: 'password123',
    coins: 1500,
    gameStats: {
      level: 8,
      rating: 950,
      gamesPlayed: 45,
      gamesWon: 25,
      gamesLost: 20,
      winStreak: 0,
      bestWinStreak: 3,
      averageGuesses: 6.0,
      rank: 'Bronze'
    }
  },
  {
    username: 'StrategyKing',
    email: 'strategy@numbermind.com',
    password: 'password123',
    coins: 4200,
    gameStats: {
      level: 22,
      rating: 1750,
      gamesPlayed: 120,
      gamesWon: 95,
      gamesLost: 25,
      winStreak: 7,
      bestWinStreak: 14,
      averageGuesses: 4.3,
      rank: 'Diamond'
    }
  },
  {
    username: 'QuickThinker',
    email: 'quick@numbermind.com',
    password: 'password123',
    coins: 1900,
    gameStats: {
      level: 9,
      rating: 1050,
      gamesPlayed: 50,
      gamesWon: 30,
      gamesLost: 20,
      winStreak: 1,
      bestWinStreak: 5,
      averageGuesses: 5.8,
      rank: 'Bronze'
    }
  },
  {
    username: 'MathWizard',
    email: 'math@numbermind.com',
    password: 'password123',
    coins: 3600,
    gameStats: {
      level: 20,
      rating: 1700,
      gamesPlayed: 110,
      gamesWon: 85,
      gamesLost: 25,
      winStreak: 6,
      bestWinStreak: 13,
      averageGuesses: 4.4,
      rank: 'Platinum'
    }
  },
  {
    username: 'DeductionPro',
    email: 'deduction@numbermind.com',
    password: 'password123',
    coins: 2400,
    gameStats: {
      level: 14,
      rating: 1350,
      gamesPlayed: 75,
      gamesWon: 55,
      gamesLost: 20,
      winStreak: 3,
      bestWinStreak: 7,
      averageGuesses: 4.9,
      rank: 'Gold'
    }
  }
];

// Calculate win rates and assign skins for each user
sampleUsers.forEach(user => {
  if (user.gameStats.gamesPlayed > 0) {
    user.gameStats.calculatedWinRate = Math.round((user.gameStats.gamesWon / user.gameStats.gamesPlayed) * 100);
  } else {
    user.gameStats.calculatedWinRate = 0;
  }
  
  // Assign skins based on user's level and rank
  user.availableSkins = getSkinsForUser(user.gameStats.level, user.gameStats.rank);
});

async function populateUsers() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Hash passwords and create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.username} already exists, Updating...`);
        await User.updateOne({ email: userData.email }, { $set: {
          isVerified: true,
          createdAt: new Date(),
          gameStats: userData.gameStats,
          availableSkins: userData.availableSkins,
          coins: userData.coins,
          email: userData.email,
          username: userData.username,
          lastLogin: new Date()
        }});
        continue;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user with hashed password
      const user = new User({
        ...userData,
        password: hashedPassword,
        isVerified: true, // Mark as verified for testing
        createdAt: new Date(),
        lastLogin: new Date()
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.username} (Level ${savedUser.gameStats.level}, Rating ${savedUser.gameStats.rating}, Coins: ${savedUser.coins}, Skins: ${savedUser.availableSkins.length})`);
    }

    console.log(`\n✅ Successfully created ${createdUsers.length} users!`);
    
    // Display summary
    console.log('\n📊 User Statistics Summary:');
    console.log('============================');
    
    const totalCoins = createdUsers.reduce((sum, user) => sum + user.coins, 0);
    const avgLevel = createdUsers.reduce((sum, user) => sum + user.gameStats.level, 0) / createdUsers.length;
    const avgRating = createdUsers.reduce((sum, user) => sum + user.gameStats.rating, 0) / createdUsers.length;
    const totalSkins = createdUsers.reduce((sum, user) => sum + user.availableSkins.length, 0);
    
    console.log(`Total Users: ${createdUsers.length}`);
    console.log(`Total Coins in Economy: ${totalCoins}`);
    console.log(`Average Level: ${avgLevel.toFixed(1)}`);
    console.log(`Average Rating: ${avgRating.toFixed(0)}`);
    console.log(`Total Skins Owned: ${totalSkins}`);
    console.log(`Average Skins per User: ${(totalSkins / createdUsers.length).toFixed(1)}`);
    
    // Show rank distribution
    const rankCounts = {};
    createdUsers.forEach(user => {
      const rank = user.gameStats.rank;
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    console.log('\n🏆 Rank Distribution:');
    Object.entries(rankCounts).forEach(([rank, count]) => {
      console.log(`${rank}: ${count} users`);
    });

    // Show skin distribution
    console.log('\n🎨 Skin Distribution:');
    const skinCounts = {};
    createdUsers.forEach(user => {
      user.availableSkins.forEach(skin => {
        skinCounts[skin] = (skinCounts[skin] || 0) + 1;
      });
    });
    
    Object.entries(skinCounts).forEach(([skin, count]) => {
      console.log(`${skin}: ${count} users`);
    });

  } catch (error) {
    console.error('Error populating users:', error);
  } finally {
    // Close connection
    await closeDB();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  populateUsers();
}

module.exports = { populateUsers, sampleUsers };
