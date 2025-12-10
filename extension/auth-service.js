(function () {
  'use strict';

  // Use extension API config
  const getApiBaseUrl = () => {
    if (window.SiderExtensionAPI) {
      return window.SiderExtensionAPI.getBaseUrl();
    }
    // Fallback if extension_api.js is not loaded
    return new Promise((resolve) => {
      chrome.storage.sync.get(['sider_api_base_url'], (result) => {
        let baseUrl = result.sider_api_base_url || 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
        baseUrl = baseUrl.replace(/\/docs\/?$/, '');
        resolve(baseUrl);
      });
    });
  };

  const AuthService = {
    async register(email, password, username) {
      try {
        const baseUrl = await getApiBaseUrl();
        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.auth?.register || '/api/auth/register') : `${baseUrl}/api/auth/register`;
        const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
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
        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.auth?.login || '/api/auth/login') : `${baseUrl}/api/auth/login`;
        const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
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

          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
              chrome.storage.sync.set({
                authToken: data.data.access_token,
                refreshToken: data.data.refresh_token || null,
                sider_user_email: email.trim(),
                sider_user_name: email.trim().split('@')[0]
              }, () => { });
            }

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({
                authToken: data.data.access_token,
                refreshToken: data.data.refresh_token || null
              }, () => { });
            }
            localStorage.setItem('authToken', data.data.access_token);

            // Store refresh_token if available
            if (data.data.refresh_token) {
              localStorage.setItem('refreshToken', data.data.refresh_token);
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

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.auth?.me || '/api/auth/me') : `${baseUrl}/api/auth/me`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetch(url, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Token expired in getCurrentUserInfo. Clearing auth.');
            await this.clearAuth();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('sider-auth-expired'));
            }
          }
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

    async googleSignIn(googleToken) {
      try {
        const baseUrl = await getApiBaseUrl();
        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl
          ? await api.buildUrl(api.endpoints?.auth?.googleSignin || '/api/auth/google/signin')
          : `${baseUrl}/api/auth/google/signin`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: googleToken   // this matches your backend
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Google sign in failed'
          };
        }

        if (data.code === 0 && data.data?.access_token) {
          await this.saveTokens(data.data.access_token, data.data.refresh_token);
          if (data.data.user) {
            await this.saveUserInfo(data.data.user);
          }
          return { success: true, data: data.data };
        }

        return { success: false, error: 'Invalid Google response format' };
      } catch (err) {
        console.error('Google Sign-In error:', err);
        return { success: false, error: err.message };
      }
    },


    async refreshToken() {
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
          localStorage.setItem('authToken', accessToken);

          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({
              authToken: accessToken,
              refreshToken: refreshToken || null
            }, () => { });
          }

          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              authToken: accessToken,
              refreshToken: refreshToken || null
            }, () => { });
          }

          const savedToken = localStorage.getItem('authToken');
          const savedRefreshToken = localStorage.getItem('refreshToken');

          if (savedToken && savedToken === accessToken) {
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
          let authToken = localStorage.getItem('authToken');
          let refreshToken = localStorage.getItem('refreshToken');

          if (!authToken && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['authToken', 'refreshToken'], (result) => {
              if (result.authToken) {
                authToken = result.authToken;
                refreshToken = result.refreshToken;

                localStorage.setItem('authToken', authToken);
                if (refreshToken) {
                  localStorage.setItem('refreshToken', refreshToken);
                }

                resolve({
                  accessToken: authToken,
                  refreshToken: refreshToken,
                  expiry: null
                });
              } else {
                if (chrome.storage.sync) {
                  chrome.storage.sync.get(['authToken', 'refreshToken'], (syncResult) => {
                    if (syncResult.authToken) {
                      authToken = syncResult.authToken;
                      refreshToken = syncResult.refreshToken;

                      localStorage.setItem('authToken', authToken);
                      if (refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                      }
                      chrome.storage.local.set({
                        authToken: authToken,
                        refreshToken: refreshToken || null
                      });

                      resolve({
                        accessToken: authToken,
                        refreshToken: refreshToken,
                        expiry: null
                      });
                    } else {
                      resolve({
                        accessToken: null,
                        refreshToken: null,
                        expiry: null
                      });
                    }
                  });
                } else {
                  resolve({
                    accessToken: null,
                    refreshToken: null,
                    expiry: null
                  });
                }
              }
            });
            return;
          }

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
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('google_client_id');

          if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.remove(['authToken', 'refreshToken', 'sider_user_email', 'sider_user_name', 'sider_user_profile']);
          }

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

    async verifyTokens() {
      const tokens = await this.getTokens();
      return tokens;
    }
  };

  if (typeof window !== 'undefined') {
    window.SiderAuthService = AuthService;
  }

  if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.SiderAuthService = AuthService;
  }

  try {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('message', (event) => {
        try {
          const msg = event?.data;
          if (!msg || msg.type !== 'SIDER_AUTH_SYNC' || msg.source !== 'app') return;
          if (msg.token) {
            localStorage.setItem('authToken', msg.token);
          }
          if (msg.refreshToken) {
            localStorage.setItem('refreshToken', msg.refreshToken);
          }
          if (msg.user) {
            try { localStorage.setItem('user', JSON.stringify(msg.user)); } catch (e) { }
          }

          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              authToken: msg.token || null,
              refreshToken: msg.refreshToken || null,
              sider_user_profile: msg.user || null,
              sider_user_logged_in: !!msg.token
            }, () => { });
          }
        } catch (err) {
          console.warn('⚠️ Error handling SIDER_AUTH_SYNC message in extension:', err);
        }
      }, false);
    }
  } catch (err) {
    console.warn('⚠️ Failed to attach message listener for auth sync in extension:', err);
  }

  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (changes.authToken) {
        if (changes.authToken.newValue === undefined || changes.authToken.newValue === null) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    });
  } catch (err) { }
})();