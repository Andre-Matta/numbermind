const io = require('socket.io-client');

console.log('🧪 Testing basic socket connection...');

// Test configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

console.log('🔗 Attempting to connect to:', SERVER_URL);

// Test basic connection without authentication first
const testSocket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

testSocket.on('connect', () => {
  console.log('✅ Basic connection successful!');
  console.log('🔌 Socket ID:', testSocket.id);
  console.log('🌐 Transport:', testSocket.io.engine.transport.name);
  
  // Test a simple emit
  testSocket.emit('ping', {}, (response) => {
    console.log('📡 Ping response:', response);
  });
  
  // Disconnect after test
  setTimeout(() => {
    testSocket.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }, 2000);
});

testSocket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.error('Error details:', error);
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('💡 Server might not be running. Start the server with: npm start');
  }
  
  process.exit(1);
});

testSocket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

testSocket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('⏰ Connection timeout');
  testSocket.disconnect();
  process.exit(1);
}, 15000);
