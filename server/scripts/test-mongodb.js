const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📡 URI:', process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📍 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('🔌 Port:', conn.connection.port);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ name: String, timestamp: Date });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ 
      name: 'Connection Test', 
      timestamp: new Date() 
    });
    
    await testDoc.save();
    console.log('✅ Document created successfully:', testDoc);
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Make sure MongoDB is running and the URI is correct');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 MongoDB service might not be running. Try:');
      console.log('   - Start MongoDB service: net start MongoDB');
      console.log('   - Check if MongoDB is installed');
      console.log('   - Verify the port 27017 is not blocked');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Check your MONGODB_URI in env.env file');
    }
    
    if (error.message.includes('MONGODB_URI is not defined')) {
      console.log('💡 Environment variables not loaded. Check:');
      console.log('   - env.env file exists in server directory');
      console.log('   - MONGODB_URI is set in env.env file');
      console.log('   - File path is correct');
    }
  }
}

testConnection();
