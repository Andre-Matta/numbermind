const io = require('socket.io-client');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Test configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

// Create different JWT tokens for each player to simulate real multiplayer
const PLAYER1_USER_ID = '68ae37b12c30194d2fc18711'; // Player 1
const PLAYER2_USER_ID = '68ae37bb2c30194d2fc18714'; // Player 2 (different ID)

const PLAYER1_TOKEN = require('jsonwebtoken').sign(
  { userId: PLAYER1_USER_ID },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  { expiresIn: '1h' }
);

const PLAYER2_TOKEN = require('jsonwebtoken').sign(
  { userId: PLAYER2_USER_ID },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  { expiresIn: '1h' }
);

console.log('🔗 Testing connection to:', SERVER_URL);
console.log('🔑 Player 1 token for user:', PLAYER1_USER_ID);
console.log('🔑 Player 2 token for user:', PLAYER2_USER_ID);

// Test data
let roomId = null;
let player1Socket = null;
let player2Socket = null;

async function testMultiplayer() {
  console.log('🧪 Starting multiplayer test...');
  
  try {
    // Test 1: Player 1 connects and creates room
    console.log('\n📱 Test 1: Player 1 connects and creates room');
    player1Socket = io(SERVER_URL, {
      auth: { token: PLAYER1_TOKEN },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
      
      player1Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Player 1 connected with ID:', player1Socket.id);
        resolve();
      });
      
      player1Socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Player 1 connection failed:', error.message);
        console.error('Error details:', error);
        reject(error);
      });

      player1Socket.on('error', (error) => {
        console.error('❌ Player 1 socket error:', error);
      });
    });

    // Create room
    roomId = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Create room timeout')), 10000);
      
      player1Socket.emit('createPrivateRoom', { gameMode: 'standard' }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Room created:', response.roomId);
          resolve(response.roomId);
        } else {
          reject(new Error(response?.error || 'Failed to create room'));
        }
      });
    });

    // Test 2: Player 2 connects and joins room
    console.log('\n📱 Test 2: Player 2 connects and joins room');
    player2Socket = io(SERVER_URL, {
      auth: { token: PLAYER2_TOKEN },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
      
      player2Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Player 2 connected with ID:', player2Socket.id);
        resolve();
      });
      
      player2Socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Player 2 connection failed:', error.message);
        console.error('Error details:', error);
        reject(error);
      });

      player2Socket.on('error', (error) => {
        console.error('❌ Player 2 socket error:', error);
      });
    });

    // Join room
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Join room timeout')), 10000);
      
      player2Socket.emit('joinPrivateRoom', { roomId }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 2 joined room');
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to join room'));
        }
      });
    });

    // Set up event listeners for gameStarted event after both players are connected
    console.log('👂 Setting up event listeners for gameStarted event...');
    let gameStartedReceived = false;
    let gameStartedData = null;
    
    const handleGameStarted = (data, source) => {
      if (!gameStartedReceived) {
        gameStartedReceived = true;
        console.log(`✅ Game started (${source}):`, data);
        gameStartedData = data;
      }
    };
    
    // Listen on both sockets
    player1Socket.on('gameStarted', (data) => handleGameStarted(data, 'Player 1'));
    player2Socket.on('gameStarted', (data) => handleGameStarted(data, 'Player 2'));
    
    console.log('👂 Event listeners set up for gameStarted event');
    console.log('🔍 Player 1 socket ID:', player1Socket.id);
    console.log('🔍 Player 2 socket ID:', player2Socket.id);

    // Test 3: Both players submit secret numbers
    console.log('\n📱 Test 3: Both players submit secret numbers');
    
    // Player 1 submits number
    console.log('🔢 Player 1 submitting number: 12345');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit number timeout')), 10000);
      
      player1Socket.emit('startMultiplayerGame', { 
        roomId, 
        playerNumber: '12345' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 1 submitted number successfully');
          resolve();
        } else {
          console.log('❌ Player 1 failed to submit number:', response?.error);
          reject(new Error(response?.error || 'Failed to submit number'));
        }
      });
    });

    // Player 2 submits number
    console.log('🔢 Player 2 submitting number: 67890');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit number timeout')), 10000);
      
      player2Socket.emit('startMultiplayerGame', { 
        roomId, 
        playerNumber: '67890' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 2 submitted number successfully');
          resolve();
        } else {
          console.log('❌ Player 2 failed to submit number:', response?.error);
          reject(new Error(response?.error || 'Failed to submit number'));
        }
      });
    });

    // Test 4: Game starts and players can submit guesses
    console.log('\n📱 Test 4: Game starts and players can submit guesses');
    console.log('⏳ Waiting for gameStarted event...');
    
    // Wait for game to start with timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!gameStartedReceived) {
          reject(new Error('Game start timeout - gameStarted event not received'));
        }
      }, 15000);
      
      // Check if game already started
      const checkGameStarted = () => {
        if (gameStartedReceived) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkGameStarted, 100);
        }
      };
      
      checkGameStarted();
    });

    console.log('🎮 Game is now active, proceeding with guess submission...');

    // Player 1 submits a guess
    console.log('🎯 Player 1 attempting to submit guess: 11111');
    console.log('🔍 Current turn from gameStarted event:', gameStartedData?.currentTurn);
    console.log('🔍 Player 1 ID:', PLAYER1_USER_ID);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit guess timeout')), 10000);
      
      player1Socket.emit('submitGuess', { 
        roomId, 
        guess: '11111' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 1 submitted guess successfully');
          resolve();
        } else {
          console.log('❌ Player 1 failed to submit guess:', response?.error);
          reject(new Error(response?.error || 'Failed to submit guess'));
        }
      });
    });

    console.log('\n🎉 All multiplayer tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Additional debugging info
    if (player1Socket) {
      console.log('Player 1 socket state:', player1Socket.connected);
      console.log('Player 1 socket ID:', player1Socket.id);
    }
    if (player2Socket) {
      console.log('Player 2 socket state:', player2Socket.connected);
      console.log('Player 2 socket ID:', player2Socket.id);
    }
  } finally {
    // Cleanup
    if (player1Socket) {
      player1Socket.disconnect();
      console.log('🔌 Player 1 disconnected');
    }
    if (player2Socket) {
      player2Socket.disconnect();
      console.log('🔌 Player 2 disconnected');
    }
  }
}

// Run the test
if (require.main === module) {
  testMultiplayer().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testMultiplayer };
