(function() {
  'use strict';

  // Get API base URL from storage or use default
  // Remove /docs if present as it's just for Swagger UI
  const getApiBaseUrl = () => {
    // Try to get from storage first (for production)
    return new Promise((resolve) => {
      chrome.storage.sync.get(['sider_api_base_url'], (result) => {
        let baseUrl = result.sider_api_base_url || 'http://localhost:8000';
        // Remove /docs if present
        baseUrl = baseUrl.replace(/\/docs\/?$/, '');
        resolve(baseUrl);
      });
    });
  };
  
  const API_BASE_URL = 'http://localhost:8000';

  const AuthService = {
    async register(email, password, username) {
      try {
        console.log('Registering user:', email);
        console.log('API URL:', `${API_BASE_URL}/api/auth/register`);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            username: username || email.split('@')[0]
          })
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            const text = await response.text();
            console.error('Response text:', text);
            throw new Error('Invalid response from server');
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned invalid response format');
        }

        // Backend uses BaseResponse wrapper: { code: 0, msg: "", data: {...} }
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.msg || data.detail || data.message || `Registration failed (${response.status})`;
          console.error('Registration failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Register doesn't return tokens - user needs to login after registration
        // But save user info if available
        if (data.data) {
          await this.saveUserInfo(data.data);
        } else if (data.email || data.username) {
          // If user object not available, create one from available data
          await this.saveUserInfo({
            email: data.email || email,
            username: data.username || username || email.split('@')[0],
            name: data.name || data.username || username || email.split('@')[0],
            id: data.id || data.userId
          });
        } else {
          // Save basic info from registration data
          await this.saveUserInfo({
            email: email,
            username: username || email.split('@')[0],
            name: username || email.split('@')[0]
          });
        }

        console.log('Registration successful');
        return { success: true, data: data.data || data };
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message || 'Registration failed' };
      }
    },

    async login(email, password) {
      try {
        console.log('Logging in user:', email);
        console.log('API URL:', `${API_BASE_URL}/api/auth/login`);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            const text = await response.text();
            console.error('Response text:', text);
            throw new Error('Invalid response from server');
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned invalid response format');
        }

        // Backend uses BaseResponse wrapper: { code: 0, msg: "", data: {...} }
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.msg || data.detail || data.message || `Login failed (${response.status})`;
          console.error('Login failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Extract tokens from data.data (BaseResponse wrapper)
        const tokenData = data.data || data;
        
        // Handle both camelCase and snake_case token field names
        const accessToken = tokenData.accessToken || tokenData.access_token;
        const refreshToken = tokenData.refreshToken || tokenData.refresh_token;
        
        if (accessToken && refreshToken) {
          await this.saveTokens(accessToken, refreshToken);
          console.log('Tokens saved successfully');
        } else {
          console.error('Tokens not found in response:', tokenData);
          throw new Error('Invalid response: tokens not found');
        }

        // Save user info if available in response
        if (tokenData.user) {
          await this.saveUserInfo(tokenData.user);
        } else if (tokenData.email || tokenData.username) {
          // If user object not available, create one from available data
          await this.saveUserInfo({
            email: tokenData.email,
            username: tokenData.username,
            name: tokenData.name || tokenData.username,
            id: tokenData.id || tokenData.userId
          });
        } else {
          // Wait a bit for tokens to be fully saved, then fetch user profile
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Fetch user profile from API after login
          try {
            const userResult = await this.getCurrentUser();
            if (userResult.success && userResult.data) {
              await this.saveUserInfo(userResult.data);
              console.log('User profile fetched and saved after login');
            } else {
              console.warn('Failed to fetch user profile after login:', userResult.error);
            }
          } catch (error) {
            console.error('Error fetching user profile after login:', error);
            // Continue even if profile fetch fails
          }
        }

        console.log('Login successful');
        return { success: true, data: tokenData };
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message || 'Login failed' };
      }
    },

    async googleSignIn(token) {
      try {
        console.log('Signing in with Google');
        console.log('API URL:', `${API_BASE_URL}/api/auth/google/signin`);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/google/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            const text = await response.text();
            console.error('Response text:', text);
            throw new Error('Invalid response from server');
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned invalid response format');
        }

        // Backend uses BaseResponse wrapper: { code: 0, msg: "", data: {...} }
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.msg || data.detail || data.message || `Google sign-in failed (${response.status})`;
          console.error('Google sign-in failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Extract tokens from data.data (BaseResponse wrapper)
        const tokenData = data.data || data;
        if (tokenData.access_token && tokenData.refresh_token) {
          await this.saveTokens(tokenData.access_token, tokenData.refresh_token);
        } else if (tokenData.accessToken && tokenData.refreshToken) {
          // Handle camelCase format
          await this.saveTokens(tokenData.accessToken, tokenData.refreshToken);
        }

        // Save user info if available in response
        if (tokenData.user) {
          await this.saveUserInfo(tokenData.user);
        } else if (tokenData.email || tokenData.username) {
          // If user object not available, create one from available data
          await this.saveUserInfo({
            email: tokenData.email,
            username: tokenData.username,
            name: tokenData.name || tokenData.username,
            id: tokenData.id || tokenData.userId
          });
        } else {
          // Fetch user profile from API after Google sign-in
          try {
            const userResult = await this.getCurrentUser();
            if (userResult.success && userResult.data) {
              await this.saveUserInfo(userResult.data);
            }
          } catch (error) {
            console.error('Error fetching user profile after Google sign-in:', error);
            // Continue even if profile fetch fails
          }
        }

        console.log('Google sign-in successful');
        return { success: true, data: tokenData };
      } catch (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: error.message || 'Google sign-in failed' };
      }
    },

    async refreshToken() {
      try {
        const { refreshToken } = await this.getTokens();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('Refreshing token');
        // FastAPI expects refresh_token as query parameter for POST with string param
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid response from server');
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned invalid response format');
        }

        // Backend uses BaseResponse wrapper: { code: 0, msg: "", data: {...} }
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          await this.clearAuth();
          const errorMsg = data.msg || data.detail || data.message || 'Token refresh failed';
          console.error('Token refresh failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Extract tokens from data.data (BaseResponse wrapper)
        const tokenData = data.data || data;
        if (tokenData.accessToken && tokenData.refreshToken) {
          await this.saveTokens(tokenData.accessToken, tokenData.refreshToken);
        }

        console.log('Token refresh successful');
        return { success: true, data: tokenData };
      } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false, error: error.message };
      }
    },

    async getCurrentUser() {
      try {
        const { accessToken } = await this.getTokens();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        // Get API base URL (remove /docs if present)
        const baseUrl = await getApiBaseUrl();
        const apiBaseUrl = baseUrl.replace(/\/docs\/?$/, '');

        console.log('Getting current user info from:', `${apiBaseUrl}/api/users/profile`);
        // Try /api/users/profile first, fallback to /api/auth/me
        let response = await fetch(`${apiBaseUrl}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        });

        // If profile endpoint fails, try auth/me as fallback
        if (response.status === 404 || response.status === 500) {
          console.log('Profile endpoint not available, trying /api/auth/me');
          response = await fetch(`${apiBaseUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }).catch((fetchError) => {
            console.error('Fetch error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}`);
          });
        }

        if (response.status === 401) {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            return await this.getCurrentUser();
          }
          throw new Error('Authentication failed');
        }

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid response from server');
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned invalid response format');
        }

        // Backend uses BaseResponse wrapper: { code: 0, msg: "", data: {...} }
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.msg || data.detail || data.message || 'Failed to get user info';
          console.error('Get user info failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Extract user data from data.data (BaseResponse wrapper)
        const userData = data.data || data;
        await this.saveUserInfo(userData);
        return { success: true, data: userData };
      } catch (error) {
        console.error('Get current user error:', error);
        return { success: false, error: error.message };
      }
    },

    async saveTokens(accessToken, refreshToken) {
      return new Promise((resolve) => {
        chrome.storage.local.set({
          sider_access_token: accessToken,
          sider_refresh_token: refreshToken,
          sider_token_expiry: Date.now() + (15 * 60 * 1000)
        }, resolve);
      });
    },

    async getTokens() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['sider_access_token', 'sider_refresh_token', 'sider_token_expiry'], (result) => {
          resolve({
            accessToken: result.sider_access_token || null,
            refreshToken: result.sider_refresh_token || null,
            expiry: result.sider_token_expiry || null
          });
        });
      });
    },

    async saveUserInfo(user) {
      return new Promise((resolve) => {
        chrome.storage.local.set({
          sider_user_email: user.email,
          sider_user_name: user.name || user.username || user.email.split('@')[0],
          sider_user_id: user.id || user._id,
          sider_user_logged_in: true
        }, resolve);
      });
    },

    async clearAuth() {
      return new Promise((resolve) => {
        chrome.storage.local.remove([
          'sider_access_token',
          'sider_refresh_token',
          'sider_token_expiry',
          'sider_user_email',
          'sider_user_name',
          'sider_user_id',
          'sider_user_logged_in'
        ], resolve);
      });
    },

    async isAuthenticated() {
      const { accessToken, expiry } = await this.getTokens();
      if (!accessToken) return false;
      if (expiry && Date.now() > expiry) {
        const refreshResult = await this.refreshToken();
        return refreshResult.success;
      }
      return true;
    },

    async getAuthHeaders() {
      const { accessToken, expiry } = await this.getTokens();
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      if (expiry && Date.now() > expiry) {
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          throw new Error('Token refresh failed');
        }
        const tokens = await this.getTokens();
        return {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        };
      }

      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.SiderAuthService = AuthService;
  }

  if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.SiderAuthService = AuthService;
  }
})();

