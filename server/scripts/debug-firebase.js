const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Firebase Configuration Debug Script\n');

// Check service account file first (preferred method)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../firebase-service-account.json');

console.log('📁 Service Account File Check (Preferred Method):');
console.log(`Path: ${serviceAccountPath}`);

let serviceAccountFileExists = false;
let serviceAccountData = null;

try {
  const fs = require('fs');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('   Status: ✅ File exists');
    const stats = fs.statSync(serviceAccountPath);
    console.log(`   Size: ${stats.size} bytes`);
    
    // Try to parse the JSON
    try {
      serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('   JSON: ✅ Valid JSON');
      console.log(`   Project ID: ${serviceAccountData.project_id || '❌ Missing'}`);
      console.log(`   Client Email: ${serviceAccountData.client_email || '❌ Missing'}`);
      console.log(`   Private Key: ${serviceAccountData.private_key ? '✅ Present' : '❌ Missing'}`);
      serviceAccountFileExists = true;
    } catch (parseError) {
      console.log('   JSON: ❌ Invalid JSON format');
      console.log(`   Error: ${parseError.message}`);
    }
  } else {
    console.log('   Status: ❌ File does not exist');
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
}

// Only check environment variables if JSON file doesn't exist
if (!serviceAccountFileExists) {
  console.log('\n📋 Environment Variables Check (Fallback Method):');
  console.log(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`FIREBASE_PRIVATE_KEY_ID: ${process.env.FIREBASE_PRIVATE_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);
  console.log(`FIREBASE_CLIENT_ID: ${process.env.FIREBASE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`FIREBASE_CLIENT_CERT_URL: ${process.env.FIREBASE_CLIENT_CERT_URL ? '✅ Set' : '❌ Missing'}`);

  // Check private key
  if (process.env.FIREBASE_PRIVATE_KEY) {
    console.log(`FIREBASE_PRIVATE_KEY: ✅ Set (${process.env.FIREBASE_PRIVATE_KEY.length} characters)`);
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Check private key format
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('   Format: ✅ Includes proper headers');
    } else {
      console.log('   Format: ⚠️  Missing headers (will be added automatically)');
    }
    
    if (privateKey.includes('\\n')) {
      console.log('   Newlines: ✅ Contains escaped newlines');
    } else if (privateKey.includes('\n')) {
      console.log('   Newlines: ✅ Contains actual newlines');
    } else {
      console.log('   Newlines: ⚠️  No newlines detected');
    }
    
    // Show first and last few characters
    console.log(`   Preview: ${privateKey.substring(0, 50)}...${privateKey.substring(privateKey.length - 30)}`);
  } else {
    console.log('FIREBASE_PRIVATE_KEY: ❌ Missing');
  }
} else {
  console.log('\n📋 Environment Variables: ⏭️  Skipped (using JSON file)');
}

// Check service account file
console.log(`\n📁 Service Account File Check:`);
console.log(`Path: ${serviceAccountPath}`);

try {
  const fs = require('fs');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('   Status: ✅ File exists');
    const stats = fs.statSync(serviceAccountPath);
    console.log(`   Size: ${stats.size} bytes`);
    
    // Try to parse the JSON
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('   JSON: ✅ Valid JSON');
      console.log(`   Project ID: ${serviceAccount.project_id || '❌ Missing'}`);
      console.log(`   Client Email: ${serviceAccount.client_email || '❌ Missing'}`);
      console.log(`   Private Key: ${serviceAccount.private_key ? '✅ Present' : '❌ Missing'}`);
    } catch (parseError) {
      console.log('   JSON: ❌ Invalid JSON format');
      console.log(`   Error: ${parseError.message}`);
    }
  } else {
    console.log('   Status: ❌ File does not exist');
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
}

// Test Firebase initialization
console.log('\n🔥 Testing Firebase Initialization:');

try {
  // Temporarily disable the Firebase initialization to test configuration
  const originalRequire = require;
  const mockRequire = (module) => {
    if (module === './config/firebase') {
      throw new Error('Firebase config test - not actually initializing');
    }
    return originalRequire(module);
  };
  
  // Test the configuration logic
  let serviceAccount;
  
  try {
    serviceAccount = require(serviceAccountPath);
    console.log('✅ Service account loaded from file');
  } catch (error) {
    console.log('📁 File not found, checking environment variables...');
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('✅ Converted escaped newlines to actual newlines');
      }
      
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        console.log('✅ Added private key headers');
      }
      
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };
      
      console.log('✅ Service account created from environment variables');
    } else {
      throw new Error('Missing required environment variables');
    }
  }
  
  // Validate service account
  if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
    throw new Error('Invalid service account configuration');
  }
  
  console.log('✅ Service account validation passed');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  console.log(`   Private Key Length: ${serviceAccount.private_key.length} characters`);
  
} catch (error) {
  console.log(`❌ Configuration test failed: ${error.message}`);
}

console.log('\n📝 Next Steps:');
if (serviceAccountFileExists) {
  console.log('✅ Service account JSON file found!');
  console.log('1. Run "npm run test-firebase" to test the actual Firebase connection');
  console.log('2. Run "npm run dev" to start your server');
} else {
  console.log('❌ Service account JSON file not found');
  console.log('1. Download your Firebase service account key from Firebase Console');
  console.log('2. Place it as "firebase-service-account.json" in the server directory');
  console.log('3. Run "npm run debug-firebase" again to verify');
  console.log('4. Run "npm run test-firebase" to test the connection');
}

console.log('\n🔧 How to get the JSON file:');
console.log('1. Go to Firebase Console → Project Settings → Service accounts');
console.log('2. Click "Generate new private key"');
console.log('3. Download and rename to "firebase-service-account.json"');
console.log('4. Place in: server/firebase-service-account.json');
