// Test script to check multiplayer connection and authentication
import config from './src/config/config.js';
import AuthService from './src/services/AuthService.js';
import NetworkService from './src/services/NetworkService.js';

async function testMultiplayerConnection() {
  console.log('🧪 Testing multiplayer connection...');
  
  // Test 1: Check server health
  console.log('\n1️⃣ Testing server health...');
  try {
    const response = await fetch(`${config.SERVER_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is healthy:', data);
    } else {
      console.log('❌ Server health check failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Server health check error:', error.message);
  }
  
  // Test 2: Check authentication status
  console.log('\n2️⃣ Checking authentication status...');
  await AuthService.initialize();
  const authStatus = NetworkService.getAuthStatus();
  console.log('Auth status:', authStatus);
  
  if (!authStatus.isAuthenticated) {
    console.log('❌ User is not authenticated');
    console.log('💡 Please log in first to test multiplayer functionality');
    return;
  }
  
  // Test 3: Test NetworkService connection
  console.log('\n3️⃣ Testing NetworkService connection...');
  try {
    await NetworkService.connect();
    console.log('✅ Successfully connected to server');
    
    // Test 4: Create a room
    console.log('\n4️⃣ Testing room creation...');
    const roomResponse = await NetworkService.createRoom();
    console.log('✅ Room created:', roomResponse);
    
    // Test 5: Leave the room
    console.log('\n5️⃣ Testing room cleanup...');
    NetworkService.leaveRoom();
    console.log('✅ Room left successfully');
    
    // Test 6: Disconnect
    console.log('\n6️⃣ Testing disconnect...');
    NetworkService.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
  
  console.log('\n🏁 Multiplayer connection test completed');
}

// Run the test
testMultiplayerConnection().catch(console.error);
