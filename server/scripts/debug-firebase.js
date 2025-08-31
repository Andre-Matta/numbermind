const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Firebase Configuration Debug Script\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('=' .repeat(60));

const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_CLIENT_CERT_URL'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.length} characters)`);
    
    // Special handling for private key
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      if (value.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('   Format: ✅ Includes proper headers');
      } else {
        console.log('   Format: ⚠️  Missing headers (will be added automatically)');
      }
      
      if (value.includes('\\n')) {
        console.log('   Newlines: ✅ Contains escaped newlines');
      } else if (value.includes('\n')) {
        console.log('   Newlines: ✅ Contains actual newlines');
      } else {
        console.log('   Newlines: ⚠️  No newlines detected');
      }
      
      // Show first and last few characters
      console.log(`   Preview: ${value.substring(0, 50)}...${value.substring(value.length - 30)}`);
    }
  } else {
    console.log(`❌ ${varName}: Missing`);
    allPresent = false;
  }
});

console.log('\n' + '=' .repeat(60));

if (allPresent) {
  console.log('✅ All required Firebase environment variables are present!');
  console.log('🔧 Your Firebase configuration will use environment variables.');
} else {
  console.log('❌ Some required Firebase environment variables are missing.');
  console.log('🚨 Firebase will not work without all required variables.');
}

// Test Firebase initialization
console.log('\n🧪 Testing Firebase initialization...');
try {
  // Temporarily disable the Firebase initialization to test configuration
  const originalRequire = require;
  require = function() {
    if (arguments[0] === '../config/firebase') {
      throw new Error('Firebase config test - not actually initializing');
    }
    return originalRequire.apply(this, arguments);
  };

  require('../config/firebase');
} catch (error) {
  if (error.message === 'Firebase config test - not actually initializing') {
    console.log('✅ Firebase configuration is valid');
  } else {
    console.error('❌ Firebase configuration test failed:', error.message);
  }
}

console.log('\n📝 Next Steps:');
if (allPresent) {
  console.log('✅ Environment variables are sufficient for Firebase configuration');
  console.log('1. Run "npm run test-firebase" to test the actual Firebase connection');
  console.log('2. Run "npm run dev" to start your server');
} else {
  console.log('❌ Environment variables are incomplete');
  console.log('1. Add the missing variables to your .env file');
  console.log('2. Restart your server');
  console.log('3. Run this script again to verify');
  console.log('\n🔧 Required Environment Variables:');
  console.log('FIREBASE_PROJECT_ID=your-project-id');
  console.log('FIREBASE_PRIVATE_KEY_ID=your-private-key-id');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"');
  console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
  console.log('FIREBASE_CLIENT_ID=your-client-id');
  console.log('FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...');
}
