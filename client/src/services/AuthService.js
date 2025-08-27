import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
  }

  // Initialize auth state from storage
  async initialize() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        this.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Check if response is ok and content type is JSON
      if (!response.ok) {
        console.error('Registration response not ok:', response.status, response.statusText);
        return { success: false, error: `Server error: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Registration response is not JSON:', contentType);
        const textResponse = await response.text();
        console.error('Response text:', textResponse);
        return { success: false, error: 'Server returned invalid response format' };
      }

      const data = await response.json();

      if (data.success) {
        await this.setAuthData(data.token, data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'SyntaxError') {
        return { success: false, error: 'Server returned invalid JSON response' };
      }
      return { success: false, error: 'Network error during registration' };
    }
  }

  // Login user
  async login(credentials) {
    try {
      console.log('Attempting login to:', `${config.API_BASE_URL}/auth/login`);
      console.log('Login credentials:', { email: credentials.email, password: '***' });
      
      const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok and content type is JSON
      if (!response.ok) {
        console.error('Login response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        return { success: false, error: `Server error: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Login response is not JSON:', contentType);
        const textResponse = await response.text();
        console.error('Response text:', textResponse);
        return { success: false, error: 'Server returned invalid response format' };
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success) {
        await this.setAuthData(data.token, data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'SyntaxError') {
        return { success: false, error: 'Server returned invalid JSON response' };
      }
      return { success: false, error: 'Network error during login' };
    }
  }

  // Logout user
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to get profile' };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'Network error while getting profile' };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const response = await fetch(`${config.API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        this.user = { ...this.user, ...data.user };
        await AsyncStorage.setItem('userData', JSON.stringify(this.user));
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error while updating profile' };
    }
  }

  // Set authentication data
  async setAuthData(token, user) {
    try {
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return true;
    } catch (error) {
      console.error('Error setting auth data:', error);
      return false;
    }
  }

  // Get auth token for API calls
  getToken() {
    return this.token;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  checkAuth() {
    return this.isAuthenticated;
  }

  // Refresh user data
  async refreshUserData() {
    if (this.isAuthenticated) {
      return await this.getProfile();
    }
    return { success: false, error: 'Not authenticated' };
  }
}

export default new AuthService();
