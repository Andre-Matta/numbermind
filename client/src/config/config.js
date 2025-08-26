// Configuration file for environment variables
// This will be used by the frontend to get server URLs and other config

// For React Native, we need to use a different approach than dotenv
// We'll use a config object that can be easily updated

const config = {
  // Server configuration
  SERVER_URL: 'https://numbermind.onrender.com', // This should match your .env file
  
  // API endpoints
  API_BASE_URL: 'https://numbermind.onrender.com/api',
  
  // Socket configuration
  SOCKET_TIMEOUT: 15000,
  SOCKET_RECONNECTION_ATTEMPTS: 3,
  SOCKET_RECONNECTION_DELAY: 1000,
  
  // Game configuration
  MAX_GUESSES: 10,
  NUMBER_LENGTH: 5,
  
  // Feature flags
  ENABLE_HAPTICS: true,
  ENABLE_SOUND: false,
  ENABLE_ANIMATIONS: true,
};

export default config;
