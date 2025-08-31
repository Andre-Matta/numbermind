const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const firebaseNotificationService = require('../services/firebaseNotificationService');
const User = require('../models/User');
const mongoose = require('mongoose');

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

// Test notification types
const testNotifications = async () => {
  console.log('🧪 Testing Multiplayer Game Notifications\n');

  try {
    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📱 Testing notifications for user: ${testUser.username} (${testUser._id})`);

    // Test 1: Player joined notification
    console.log('\n1️⃣ Testing Player Joined Notification');
    const playerJoinedResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Player Joined! 👥',
      'TestPlayer joined your room',
      {
        type: 'player_joined',
        roomId: 'TEST123',
        playerName: 'TestPlayer',
        playerId: 'test-player-id'
      }
    );
    console.log('✅ Player joined notification result:', playerJoinedResult);

    // Test 2: Room ready notification
    console.log('\n2️⃣ Testing Room Ready Notification');
    const roomReadyResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Room Ready! 🎮',
      'Both players are in the room. Set up your secret number to start!',
      {
        type: 'room_ready',
        roomId: 'TEST123',
        players: [testUser._id.toString(), 'other-player-id']
      }
    );
    console.log('✅ Room ready notification result:', roomReadyResult);

    // Test 3: Game started notification
    console.log('\n3️⃣ Testing Game Started Notification');
    const gameStartedResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Game Started! 🎮',
      'The game has begun! Good luck!',
      {
        type: 'game_started',
        roomId: 'TEST123',
        currentTurn: testUser._id.toString(),
        gameMode: 'standard'
      }
    );
    console.log('✅ Game started notification result:', gameStartedResult);

    // Test 4: Your turn notification
    console.log('\n4️⃣ Testing Your Turn Notification');
    const yourTurnResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Your Turn! 🎲',
      'It\'s your turn to make a guess!',
      {
        type: 'your_turn',
        roomId: 'TEST123',
        gameMode: 'standard'
      }
    );
    console.log('✅ Your turn notification result:', yourTurnResult);

    // Test 5: Game result notification (victory)
    console.log('\n5️⃣ Testing Game Result Notification (Victory)');
    const victoryResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Victory! 🏆',
      'Congratulations! You beat TestOpponent!',
      {
        type: 'game_result',
        roomId: 'TEST123',
        won: true,
        opponentName: 'TestOpponent'
      }
    );
    console.log('✅ Victory notification result:', victoryResult);

    // Test 6: Game result notification (defeat)
    console.log('\n6️⃣ Testing Game Result Notification (Defeat)');
    const defeatResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Game Over 💔',
      'Better luck next time! TestOpponent won the game.',
      {
        type: 'game_result',
        roomId: 'TEST123',
        won: false,
        opponentName: 'TestOpponent'
      }
    );
    console.log('✅ Defeat notification result:', defeatResult);

    // Test 7: Player disconnected notification
    console.log('\n7️⃣ Testing Player Disconnected Notification');
    const disconnectResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Player Disconnected 📡',
      'TestPlayer has left the game',
      {
        type: 'player_disconnected',
        roomId: 'TEST123',
        playerName: 'TestPlayer',
        playerId: 'test-player-id',
        gameState: 'abandoned'
      }
    );
    console.log('✅ Player disconnected notification result:', disconnectResult);

    // Test 8: Match found notification
    console.log('\n8️⃣ Testing Match Found Notification');
    const matchFoundResult = await firebaseNotificationService.sendToUser(
      testUser._id,
      'Match Found! 🎯',
      'You\'ve been matched with TestOpponent. Tap to join!',
      {
        type: 'match_found',
        roomId: 'TEST123',
        matchType: 'ranked',
        gameMode: 'standard',
        opponentName: 'TestOpponent'
      }
    );
    console.log('✅ Match found notification result:', matchFoundResult);

    console.log('\n🎉 All notification tests completed!');
    console.log('\n📝 Check your device to see if you received the notifications.');
    console.log('💡 If you didn\'t receive notifications, make sure:');
    console.log('   1. Your device has FCM tokens registered');
    console.log('   2. Firebase configuration is correct');
    console.log('   3. App has notification permissions');

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
};

// Run the test
const runTest = async () => {
  try {
    await connectDB();
    await testNotifications();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

runTest();
