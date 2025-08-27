const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_TOKEN = 'test-token'; // You'll need to replace this with a real token

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
      auth: { token: TEST_TOKEN },
      query: { token: TEST_TOKEN }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      
      player1Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Player 1 connected');
        resolve();
      });
      
      player1Socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Player 1 connection failed:', error.message);
        reject(error);
      });
    });

    // Create room
    roomId = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Create room timeout')), 5000);
      
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
      auth: { token: TEST_TOKEN },
      query: { token: TEST_TOKEN }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      
      player2Socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Player 2 connected');
        resolve();
      });
      
      player2Socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Player 2 connection failed:', error.message);
        reject(error);
      });
    });

    // Join room
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Join room timeout')), 5000);
      
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

    // Test 3: Both players submit secret numbers
    console.log('\n📱 Test 3: Both players submit secret numbers');
    
    // Player 1 submits number
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit number timeout')), 5000);
      
      player1Socket.emit('startMultiplayerGame', { 
        roomId, 
        playerNumber: '12345' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 1 submitted number');
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to submit number'));
        }
      });
    });

    // Player 2 submits number
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit number timeout')), 5000);
      
      player2Socket.emit('startMultiplayerGame', { 
        roomId, 
        playerNumber: '67890' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 2 submitted number');
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to submit number'));
        }
      });
    });

    // Test 4: Game starts and players can submit guesses
    console.log('\n📱 Test 4: Game starts and players can submit guesses');
    
    // Wait for game to start
    await new Promise((resolve) => {
      player1Socket.once('gameStarted', (data) => {
        console.log('✅ Game started:', data);
        resolve();
      });
    });

    // Player 1 submits a guess
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Submit guess timeout')), 5000);
      
      player1Socket.emit('submitGuess', { 
        roomId, 
        guess: '11111' 
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          console.log('✅ Player 1 submitted guess');
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to submit guess'));
        }
      });
    });

    console.log('\n🎉 All multiplayer tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
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
