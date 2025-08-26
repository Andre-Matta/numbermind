const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Configuration
const BASE_URL = process.env.SERVER_URL || 'https://mastermind-numbers.onrender.com';
const API_BASE_URL = `${BASE_URL}/api`;

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123'
};

const testLoginCredentials = {
  email: 'test@example.com',
  password: 'TestPass123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test functions
async function testHealthCheck() {
  try {
    logInfo('Testing health check endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      logSuccess(`Health check passed: ${response.data.status}`);
      return true;
    } else {
      logError(`Health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testRegistration() {
  try {
    logInfo('Testing user registration...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('User registration successful');
      logInfo(`User ID: ${response.data.data.user.id}`);
      logInfo(`Token: ${response.data.data.token.substring(0, 20)}...`);
      return response.data.data.token;
    } else {
      logError('User registration failed');
      logError(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logWarning('User might already exist, continuing with login test...');
      return null;
    } else {
      logError(`Registration error: ${error.message}`);
      if (error.response) {
        logError(`Response status: ${error.response.status}`);
        logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return null;
    }
  }
}

async function testLogin() {
  try {
    logInfo('Testing user login...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testLoginCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('User login successful');
      logInfo(`User ID: ${response.data.user.id}`);
      logInfo(`Username: ${response.data.user.username}`);
      logInfo(`Email: ${response.data.user.email}`);
      logInfo(`Token: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    } else {
      logError('User login failed');
      logError(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Login error: ${error.message}`);
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function testProfileAccess(token) {
  if (!token) {
    logWarning('No token available, skipping profile test');
    return false;
  }
  
  try {
    logInfo('Testing profile access...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('Profile access successful');
      logInfo(`Username: ${response.data.username}`);
      logInfo(`Email: ${response.data.email}`);
      logInfo(`Verified: ${response.data.isVerified}`);
      return true;
    } else {
      logError('Profile access failed');
      logError(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Profile access error: ${error.message}`);
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testInvalidLogin() {
  try {
    logInfo('Testing invalid login credentials...');
    
    const invalidCredentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, invalidCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // This should fail, so we expect an error
    logError('Invalid login should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess('Invalid login correctly rejected with 401 status');
      return true;
    } else {
      logError(`Unexpected error for invalid login: ${error.message}`);
      if (error.response) {
        logError(`Response status: ${error.response.status}`);
        logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testInvalidRegistration() {
  try {
    logInfo('Testing invalid registration data...');
    
    const invalidUser = {
      username: 'a', // Too short
      email: 'invalid-email', // Invalid email
      password: '123' // Too short and no uppercase/lowercase
    };
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, invalidUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // This should fail, so we expect an error
    logError('Invalid registration should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Invalid registration correctly rejected with 400 status');
      if (error.response.data.errors) {
        logInfo('Validation errors:');
        error.response.data.errors.forEach(err => {
          logInfo(`  - ${err.msg}`);
        });
      }
      return true;
    } else {
      logError(`Unexpected error for invalid registration: ${error.message}`);
      if (error.response) {
        logError(`Response status: ${error.response.status}`);
        logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Authentication Tests', 'bright');
  log(`📍 Testing against: ${BASE_URL}`, 'cyan');
  log('', 'reset');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Health Check
  totalTests++;
  if (await testHealthCheck()) {
    passedTests++;
  }
  log('', 'reset');
  
  // Test 2: Registration
  totalTests++;
  const token = await testRegistration();
  if (token) {
    passedTests++;
  }
  log('', 'reset');
  
  // Test 3: Login
  totalTests++;
  const loginToken = await testLogin();
  if (loginToken) {
    passedTests++;
  }
  log('', 'reset');
  
  // Test 4: Profile Access
  totalTests++;
  if (await testProfileAccess(loginToken || token)) {
    passedTests++;
  }
  log('', 'reset');
  
  // Test 5: Invalid Login
  totalTests++;
  if (await testInvalidLogin()) {
    passedTests++;
  }
  log('', 'reset');
  
  // Test 6: Invalid Registration
  totalTests++;
  if (await testInvalidRegistration()) {
    passedTests++;
  }
  log('', 'reset');
  
  // Summary
  log('', 'reset');
  log('📊 Test Summary', 'bright');
  log(`Tests passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed!', 'green');
  } else {
    log(`⚠️  ${totalTests - passedTests} test(s) failed`, 'yellow');
  }
  
  log('', 'reset');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testRegistration,
  testLogin,
  testProfileAccess,
  testInvalidLogin,
  testInvalidRegistration
};
