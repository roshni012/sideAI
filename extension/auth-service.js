(function() {
    'use strict';
  
    // Get API base URL from storage or use default
    // Remove /docs if present as it's just for Swagger UI
    const getApiBaseUrl = () => {
      // Try to get from storage first (for production)
      return new Promise((resolve) => {
        chrome.storage.sync.get(['sider_api_base_url'], (result) => {
          let baseUrl = result.sider_api_base_url || 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
          // Remove /docs if present
          baseUrl = baseUrl.replace(/\/docs\/?$/, '');
          resolve(baseUrl);
        });
      });
    };
    
    const API_BASE_URL = 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
  
    const AuthService = {
      async register(email, password, username) {
        try {
          const baseUrl = await getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email.trim(),
              username: username?.trim() || email.split('@')[0],
              password: password
            })
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.detail || data.message || 'Registration failed'
            };
          }

          return {
            success: true,
            data: data
          };
        } catch (error) {
          console.error('Registration error:', error);
          return {
            success: false,
            error: error.message || 'Registration failed'
          };
        }
      },

      async login(email, password) {
        try {
          const baseUrl = await getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email.trim(),
              password: password
            })
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.detail || data.message || 'Login failed'
            };
          }

          // API returns { code: 0, data: { access_token, refresh_token, token_type }, msg: "" }
          if (data.code === 0 && data.data && data.data.access_token) {
            console.log('✅ Login successful, received tokens:', {
              hasAccessToken: !!data.data.access_token,
              hasRefreshToken: !!data.data.refresh_token,
              tokenType: data.data.token_type
            });
            
            // Save tokens to localStorage (like siderAI project)
            try {
              // Store access_token as 'authToken' (matching siderAI convention)
              localStorage.setItem('authToken', data.data.access_token);
              console.log('✅ Token stored in localStorage as "authToken"');
              
              // Store refresh_token if available
              if (data.data.refresh_token) {
                localStorage.setItem('refreshToken', data.data.refresh_token);
                console.log('✅ Refresh token stored in localStorage');
              }
              
              // Verify tokens were actually saved
              const savedToken = localStorage.getItem('authToken');
              if (savedToken && savedToken === data.data.access_token) {
                console.log('✅ Token verification successful - token is in localStorage');
              } else {
                console.error('❌ Token verification failed - token not found in localStorage');
                return {
                  success: false,
                  error: 'Tokens were not saved correctly'
                };
              }
            } catch (tokenError) {
              console.error('❌ Failed to save tokens to localStorage:', tokenError);
              return {
                success: false,
                error: 'Failed to save authentication tokens: ' + tokenError.message
              };
            }
            
            // Store basic user info temporarily (will be updated by updateUIForAuthStatus)
            // This prevents duplicate API calls - user info will be fetched
            // by updateUIForAuthStatus() when the UI updates after login
            try {
              const userData = {
                email: email.trim(),
                username: email.trim().split('@')[0],
                name: email.trim().split('@')[0]
              };
              localStorage.setItem('user', JSON.stringify(userData));
              chrome.storage.local.set({
                sider_user_name: email.trim().split('@')[0],
                sider_user_email: email.trim(),
                sider_user_logged_in: true
              });
              console.log('✅ Basic user info saved (will be updated by updateUIForAuthStatus)');
            } catch (userError) {
              console.error('⚠️ Failed to save basic user info:', userError);
            }
            
            return {
              success: true,
              data: data.data
            };
          }

          console.error('❌ Invalid response format:', data);
          return {
            success: false,
            error: 'Invalid response format from server'
          };
        } catch (error) {
          console.error('Login error:', error);
          return {
            success: false,
            error: error.message || 'Login failed'
          };
        }
      },

      async getCurrentUserInfo() {
        try {
          const baseUrl = await getApiBaseUrl();
          const authToken = localStorage.getItem('authToken');
          
          if (!authToken) {
            return {
              success: false,
              error: 'No authentication token found'
            };
          }

          const response = await fetch(`${baseUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.detail || data.message || 'Failed to fetch user info'
            };
          }

          // API returns { code: 0, data: { email, username, id, ... }, msg: "" }
          if (data.code === 0 && data.data) {
            return {
              success: true,
              data: data.data
            };
          }

          return {
            success: false,
            error: 'Invalid response format from server'
          };
        } catch (error) {
          console.error('Get user info error:', error);
          return {
            success: false,
            error: error.message || 'Failed to fetch user info'
          };
        }
      },

      async googleSignIn(token) {
        // UI only - just return success
        console.log('Google sign-in UI action (no logic)');
        return { success: true, data: {} };
      },

      async refreshToken() {
        // UI only - just return success
        console.log('Refresh token UI action (no logic)');
        return { success: true, data: {} };
      },
  
      async getCachedUser() {
        return new Promise((resolve) => {
          chrome.storage.local.get(['sider_user_profile', 'sider_profile_cached_at'], (result) => {
            if (result.sider_user_profile && result.sider_profile_cached_at) {
              resolve({
                success: true,
                data: result.sider_user_profile,
                cached: true,
                cachedAt: result.sider_profile_cached_at
              });
            } else {
              resolve({ success: false, error: 'No cached profile found' });
            }
          });
        });
      },

      async getCurrentUser(forceRefresh = false) {
        try {
          // Always use cached data - no API calls
          const cached = await this.getCachedUser();
          if (cached.success && cached.data) {
            console.log('✅ Using cached user profile (no API call)');
            return { success: true, data: cached.data, cached: true };
          }

          // If no cached data, try to get from basic storage fields (no API call)
          const { accessToken } = await this.getTokens();
          if (!accessToken) {
            throw new Error('No access token available');
          }

          // Get user info from storage only (no API call)
          return new Promise((resolve) => {
            chrome.storage.local.get(['sider_user_email', 'sider_user_name', 'sider_user_id'], (result) => {
              if (result.sider_user_email) {
                const userData = {
                  email: result.sider_user_email,
                  username: result.sider_user_name || result.sider_user_email.split('@')[0],
                  name: result.sider_user_name || result.sider_user_email.split('@')[0],
                  id: result.sider_user_id || 'local_user',
                  is_active: true,
                  created_at: new Date().toISOString()
                };
                // Save as full profile for future cache
                this.saveUserInfo(userData);
                console.log('✅ User profile loaded from storage (no API call)');
                resolve({ success: true, data: userData, cached: true });
              } else {
                resolve({ success: false, error: 'No user data found in storage' });
              }
            });
          });
        } catch (error) {
          console.error('❌ Get current user error:', error);
          return { success: false, error: error.message };
        }
      },
  
      async saveTokens(accessToken, refreshToken) {
        return new Promise((resolve, reject) => {
          if (!accessToken) {
            const error = new Error('Cannot save tokens: accessToken is missing');
            console.error('❌', error.message);
            reject(error);
            return;
          }

          // Check if localStorage is available
          if (typeof localStorage === 'undefined') {
            const error = new Error('localStorage is not available in this context');
            console.error('❌', error.message);
            reject(error);
            return;
          }

          try {
            console.log('💾 Saving tokens to localStorage...', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              accessTokenLength: accessToken.length,
              accessTokenPreview: accessToken.substring(0, 20) + '...'
            });

            // Store access_token as 'authToken' (matching siderAI convention)
            localStorage.setItem('authToken', accessToken);
            
            // Store refresh_token if available
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }

            // Verify tokens were saved
            const savedToken = localStorage.getItem('authToken');
            const savedRefreshToken = localStorage.getItem('refreshToken');

            console.log('🔍 Verification result:', {
              hasAccessToken: !!savedToken,
              hasRefreshToken: !!savedRefreshToken,
              tokenMatch: savedToken === accessToken
            });

            if (savedToken && savedToken === accessToken) {
              console.log('✅ Tokens successfully saved and verified in localStorage');
              resolve();
            } else {
              const error = new Error('Tokens were not saved correctly to localStorage');
              console.error('❌', error.message, { 
                expected: accessToken.substring(0, 20) + '...',
                saved: savedToken ? savedToken.substring(0, 20) + '...' : 'null'
              });
              reject(error);
            }
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            reject(error);
          }
        });
      },
  
      async getTokens() {
        return new Promise((resolve) => {
          if (typeof localStorage === 'undefined') {
            console.error('❌ localStorage is not available');
            resolve({
              accessToken: null,
              refreshToken: null,
              expiry: null
            });
            return;
          }

          try {
            const authToken = localStorage.getItem('authToken');
            const refreshToken = localStorage.getItem('refreshToken');

            console.log('🔍 Retrieved tokens from localStorage:', {
              hasAccessToken: !!authToken,
              hasRefreshToken: !!refreshToken
            });

            resolve({
              accessToken: authToken,
              refreshToken: refreshToken,
              expiry: null // localStorage doesn't have expiry, but keeping for compatibility
            });
          } catch (error) {
            console.error('❌ Error getting tokens from localStorage:', error);
            resolve({
              accessToken: null,
              refreshToken: null,
              expiry: null
            });
          }
        });
      },
  
      async saveUserInfo(user, setLoggedIn = true) {
        return new Promise((resolve) => {
          try {
            // Store user data in localStorage (matching siderAI convention)
            const userData = {
              email: user.email,
              name: user.name || user.username || user.email.split('@')[0],
              username: user.username || user.name || user.email.split('@')[0],
              id: user.id || user._id,
              ...user // Include all other fields from the user object
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User info saved to localStorage:', userData);
            
            // Also save to chrome.storage.local for backward compatibility
            if (chrome && chrome.storage && chrome.storage.local) {
              const dataToSave = {
                sider_user_email: user.email,
                sider_user_name: user.name || user.username || user.email.split('@')[0],
                sider_user_id: user.id || user._id,
                sider_user_profile: userData,
                sider_profile_cached_at: Date.now()
              };
              
              if (setLoggedIn) {
                dataToSave.sider_user_logged_in = true;
              }
              
              chrome.storage.local.set(dataToSave);
            }
            
            resolve();
          } catch (error) {
            console.error('❌ Error saving user info:', error);
            resolve();
          }
        });
      },
  
      async clearAuth() {
        return new Promise((resolve) => {
          try {
            // Clear localStorage (matching siderAI convention)
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('google_client_id');
            
            // Also clear chrome.storage.local for backward compatibility
            if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.remove([
                'sider_access_token',
                'sider_refresh_token',
                'sider_token_expiry',
                'sider_user_email',
                'sider_user_name',
                'sider_user_id',
                'sider_user_logged_in',
                'sider_user_profile',
                'sider_profile_cached_at',
                'google_client_id'
              ]);
            }
            
            const emailInput = document.getElementById('sider-login-email');
            const passwordInput = document.getElementById('sider-login-password');
            const submitBtn = document.getElementById('sider-login-submit-btn');
            const submitText = document.getElementById('sider-login-submit-text');
            
            if (emailInput) {
              emailInput.value = '';
            }
            if (passwordInput) {
              passwordInput.value = '';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
            }
            if (submitText) {
              submitText.textContent = 'Log in';
            }
            
            console.log('✅ Auth cleared from localStorage');
            resolve();
          } catch (error) {
            console.error('❌ Error clearing auth:', error);
            resolve();
          }
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
      },

      // Helper function to verify tokens are saved (can be called from console)
      async verifyTokens() {
        console.log('🔍 Verifying tokens in localStorage...');
        const tokens = await this.getTokens();
        console.log('📦 Current tokens:', {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          accessTokenPreview: tokens.accessToken ? tokens.accessToken.substring(0, 30) + '...' : 'null'
        });
        
        // Check user data
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            console.log('📦 User data:', JSON.parse(userData));
          } else {
            console.log('📦 No user data found');
          }
        } catch (error) {
          console.error('❌ Error reading user data:', error);
        }
        
        // Show all localStorage keys
        console.log('📦 All localStorage keys:', Object.keys(localStorage));
        
        return tokens;
      }
    };
  
    if (typeof window !== 'undefined') {
      window.SiderAuthService = AuthService;
    }
  
    if (typeof self !== 'undefined' && typeof window === 'undefined') {
      self.SiderAuthService = AuthService;
    }
  })();
  