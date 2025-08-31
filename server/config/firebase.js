const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    // Check if required environment variables are present
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase environment variables not found. Please set FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY in your .env file.');
    }

    console.log('🔧 Using Firebase service account from environment variables');
    
    // Properly format the private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    if (privateKey.includes('\\n')) {
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    } else if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // If it's a raw key without headers, add them
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    
    const serviceAccount = {
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

    // Validate service account
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error('Invalid service account configuration. Missing required fields: private_key, client_email, or project_id');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully using environment variables');
  } else {
    firebaseApp = admin.app();
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  
  // Provide helpful debugging information
  if (error.message.includes('Failed to parse private key')) {
    console.log('\n🔧 Private Key Debugging Tips:');
    console.log('1. Make sure your private key is properly formatted');
    console.log('2. Ensure FIREBASE_PRIVATE_KEY includes the full key with headers');
    console.log('3. Example format: "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...\\n-----END PRIVATE KEY-----"');
  } else if (error.message.includes('environment variables not found')) {
    console.log('\n🔧 Environment Variables Setup:');
    console.log('1. Make sure you have a .env file in the server directory');
    console.log('2. Add the following variables to your .env file:');
    console.log('   FIREBASE_PROJECT_ID=your-project-id');
    console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"');
    console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
    console.log('   FIREBASE_CLIENT_ID=your-client-id');
    console.log('   FIREBASE_PRIVATE_KEY_ID=your-private-key-id');
    console.log('   FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...');
  }
  
  throw error;
}

// Get Firebase Messaging instance
const messaging = admin.messaging();

module.exports = {
  admin,
  messaging,
  firebaseApp
};
