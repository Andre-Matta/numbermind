const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    let serviceAccount;
    
    // First, try to use environment variables (preferred method)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
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
      console.log('✅ Loaded Firebase service account from environment variables');
    } else {
      // Fallback to service account file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        path.join(__dirname, '../firebase-service-account.json');
      
      console.log('📁 Environment variables not found, trying service account file...');
      console.log(`Path: ${serviceAccountPath}`);
      
      try {
        serviceAccount = require(serviceAccountPath);
        console.log('✅ Loaded Firebase service account from file');
      } catch (error) {
        throw new Error('Firebase service account not found. Please provide Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.) or a valid service account JSON file.');
      }
    }

    // Validate service account
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error('Invalid service account configuration. Missing required fields: private_key, client_email, or project_id');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
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
    console.log('2. If using environment variables, ensure FIREBASE_PRIVATE_KEY includes the full key with headers');
    console.log('3. Example format: "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...\\n-----END PRIVATE KEY-----"');
    console.log('4. Or use a service account JSON file instead');
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
