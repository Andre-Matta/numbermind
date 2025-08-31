#!/usr/bin/env node

/**
 * Firebase Configuration Extractor
 * 
 * This script helps you extract Firebase configuration values
 * from your downloaded google-services.json and GoogleService-Info.plist files
 * to use in your client/src/config/firebase.js file
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Configuration Extractor\n');

// Check for Android config
const androidConfigPath = path.join(__dirname, '../android/app/google-services.json');
const iosConfigPath = path.join(__dirname, '../ios/GoogleService-Info.plist');

let androidConfig = null;
let iosConfig = null;

// Read Android config
if (fs.existsSync(androidConfigPath)) {
  try {
    const androidData = fs.readFileSync(androidConfigPath, 'utf8');
    androidConfig = JSON.parse(androidData);
    console.log('✅ Found Android configuration file');
  } catch (error) {
    console.log('❌ Error reading Android configuration file:', error.message);
  }
} else {
  console.log('⚠️  Android configuration file not found at:', androidConfigPath);
}

// Read iOS config (simplified parsing)
if (fs.existsSync(iosConfigPath)) {
  try {
    const iosData = fs.readFileSync(iosConfigPath, 'utf8');
    console.log('✅ Found iOS configuration file');
    
    // Simple parsing for plist file
    const apiKeyMatch = iosData.match(/<key>API_KEY<\/key>\s*<string>(.*?)<\/string>/);
    const projectIdMatch = iosData.match(/<key>PROJECT_ID<\/key>\s*<string>(.*?)<\/string>/);
    const storageBucketMatch = iosData.match(/<key>STORAGE_BUCKET<\/key>\s*<string>(.*?)<\/string>/);
    const messagingSenderIdMatch = iosData.match(/<key>GCM_SENDER_ID<\/key>\s*<string>(.*?)<\/string>/);
    const appIdMatch = iosData.match(/<key>GOOGLE_APP_ID<\/key>\s*<string>(.*?)<\/string>/);
    
    iosConfig = {
      apiKey: apiKeyMatch ? apiKeyMatch[1] : null,
      projectId: projectIdMatch ? projectIdMatch[1] : null,
      storageBucket: storageBucketMatch ? storageBucketMatch[1] : null,
      messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : null,
      appId: appIdMatch ? appIdMatch[1] : null
    };
  } catch (error) {
    console.log('❌ Error reading iOS configuration file:', error.message);
  }
} else {
  console.log('⚠️  iOS configuration file not found at:', iosConfigPath);
}

// Extract and display configuration
console.log('\n📋 Firebase Configuration Values:\n');

if (androidConfig) {
  console.log('📱 Android Configuration:');
  const client = androidConfig.client && androidConfig.client[0];
  if (client) {
    console.log(`  apiKey: "${client.api_key[0].current_key}"`);
    console.log(`  projectId: "${androidConfig.project_info.project_id}"`);
    console.log(`  storageBucket: "${androidConfig.project_info.storage_bucket}"`);
    console.log(`  messagingSenderId: "${androidConfig.project_info.project_number}"`);
    console.log(`  appId: "${client.client_info.mobilesdk_app_id}"`);
  }
}

if (iosConfig) {
  console.log('\n🍎 iOS Configuration:');
  console.log(`  apiKey: "${iosConfig.apiKey || 'NOT_FOUND'}"`);
  console.log(`  projectId: "${iosConfig.projectId || 'NOT_FOUND'}"`);
  console.log(`  storageBucket: "${iosConfig.storageBucket || 'NOT_FOUND'}"`);
  console.log(`  messagingSenderId: "${iosConfig.messagingSenderId || 'NOT_FOUND'}"`);
  console.log(`  appId: "${iosConfig.appId || 'NOT_FOUND'}"`);
}

// Generate the complete config
console.log('\n🔧 Complete Firebase Configuration for client/src/config/firebase.js:\n');

const config = androidConfig || iosConfig;
if (config) {
  const client = androidConfig?.client?.[0];
  const projectInfo = androidConfig?.project_info;
  
  console.log('export const firebaseConfig = {');
  console.log(`  apiKey: "${client?.api_key?.[0]?.current_key || iosConfig?.apiKey || 'your-api-key-here'}",`);
  console.log(`  authDomain: "${projectInfo?.project_id || iosConfig?.projectId || 'your-project-id'}.firebaseapp.com",`);
  console.log(`  projectId: "${projectInfo?.project_id || iosConfig?.projectId || 'your-project-id'}",`);
  console.log(`  storageBucket: "${projectInfo?.storage_bucket || iosConfig?.storageBucket || 'your-project-id.appspot.com'}",`);
  console.log(`  messagingSenderId: "${projectInfo?.project_number || iosConfig?.messagingSenderId || '123456789'}",`);
  console.log(`  appId: "${client?.client_info?.mobilesdk_app_id || iosConfig?.appId || 'your-app-id'}",`);
  console.log(`  measurementId: "your-measurement-id" // Optional - add if you have Analytics enabled`);
  console.log('};');
} else {
  console.log('❌ No configuration files found. Please download them from Firebase Console first.');
}

console.log('\n📝 Instructions:');
console.log('1. Copy the configuration above');
console.log('2. Replace the firebaseConfig object in client/src/config/firebase.js');
console.log('3. Update any missing values with your actual Firebase project details');
console.log('4. Test the integration using the Firebase Test component in your app');

console.log('\n🎯 Next Steps:');
console.log('- Run: cd client && npm start');
console.log('- Open the app and go to Firebase Test');
console.log('- Check if Firebase initializes successfully');
