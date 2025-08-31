const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function debugRegistration() {
  try {
    await connectDB();

    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('👤 Test user:', testUser.username);

    // Generate a valid JWT token
    const testToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated test token');

    // Test the registration endpoint
    const testData = {
      fcmToken: 'test_fcm_token_123',
      platform: 'android',
      deviceId: 'test_device_123'
    };

    console.log('📤 Sending test data:', testData);

    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (!response.ok) {
      console.log('❌ Registration failed');
      return;
    }

    console.log('✅ Registration successful');

    // Check if token was saved
    const updatedUser = await User.findById(testUser._id);
    console.log('📱 User FCM tokens:', updatedUser.fcmTokens);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugRegistration();
