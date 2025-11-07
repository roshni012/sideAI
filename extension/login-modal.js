(function() {
  'use strict';

  // API base URL - same as auth-service.js
  const API_BASE_URL = 'http://localhost:8000';

  let loginModal = null;

  function createLoginModal() {
    if (loginModal) {
      return loginModal;
    }

    const modal = document.createElement('div');
    modal.className = 'sider-login-modal';
    modal.id = 'sider-login-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="sider-login-modal-content">
        <button class="sider-login-close-btn" id="sider-login-close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="sider-login-header">
          <div class="sider-login-logo">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Left hemisphere (pink/orange) -->
              <path d="M50 20 Q30 30 20 50 Q30 70 50 80 Q50 60 50 50 Q50 40 50 20 Z" fill="url(#pinkGradient)"/>
              <path d="M50 20 Q40 25 35 35 Q30 40 25 50 Q30 60 40 65 Q50 60 50 50 Q50 40 50 20 Z" fill="url(#orangeGradient)"/>
              <!-- Right hemisphere (blue/purple) -->
              <path d="M50 20 Q70 30 80 50 Q70 70 50 80 Q50 60 50 50 Q50 40 50 20 Z" fill="url(#blueGradient)"/>
              <path d="M50 20 Q60 25 65 35 Q70 40 75 50 Q70 60 60 65 Q50 60 50 50 Q50 40 50 20 Z" fill="url(#purpleGradient)"/>
              <!-- Circuit-like lines -->
              <path d="M30 40 L40 45 L50 40 L60 45 L70 40" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
              <path d="M35 55 L45 60 L55 55 L65 60" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
              <path d="M30 65 L40 70 L50 65 L60 70 L70 65" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
              <defs>
                <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#fb923c;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="sider-login-title" id="sider-login-title">Log in</h1>
          <p class="sider-login-subtitle" id="sider-login-subtitle" style="display: none;"></p>
        </div>
        <div class="sider-login-form" id="sider-login-form">
          <div class="sider-login-form-group">
            <label for="sider-login-email" class="sider-login-label">Email</label>
            <input 
              type="email" 
              id="sider-login-email" 
              class="sider-login-input" 
              placeholder="Enter your email"
              autocomplete="email"
            />
          </div>
          <div class="sider-login-form-group" id="sider-login-username-group" style="display: none;">
            <label for="sider-login-username" class="sider-login-label">Username (optional)</label>
            <input 
              type="text" 
              id="sider-login-username" 
              class="sider-login-input" 
              placeholder="Enter username"
              autocomplete="username"
            />
          </div>
          <div class="sider-login-form-group">
            <label for="sider-login-password" class="sider-login-label">Password</label>
            <input 
              type="password" 
              id="sider-login-password" 
              class="sider-login-input" 
              placeholder="Enter your password"
              autocomplete="current-password"
            />
          </div>
          <button class="sider-login-submit-btn" id="sider-login-submit-btn">
            <span id="sider-login-submit-text">Log in</span>
          </button>
        </div>
        <div class="sider-login-divider">
          <span>or</span>
        </div>
        <div class="sider-login-options">
          <button class="sider-login-btn sider-login-btn-google" id="sider-login-google-btn">
            <div class="sider-login-btn-icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span>Continue with Google</span>
          </button>
        </div>
        <div class="sider-login-footer">
          <div class="sider-login-create-account" id="sider-login-create-account">
            <span>Don't have an account? </span>
            <a href="#" class="sider-login-link" id="sider-create-account-link">Create an account</a>
          </div>
          <div class="sider-login-already-account" id="sider-login-already-account" style="display: none;">
            <span>Already have an account? </span>
            <a href="#" class="sider-login-link" id="sider-login-link">Log in</a>
          </div>
          <div class="sider-login-privacy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Your data is never shared. No spam messages.</span>
          </div>
          <div class="sider-login-terms">
            <span>By continuing, you agree to the </span>
            <a href="#" class="sider-login-link">Privacy Policy</a>
            <span> & </span>
            <a href="#" class="sider-login-link">Terms of Use</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    loginModal = modal;
    return modal;
  }

  function showLoginModal(mode = 'login') {
    const modal = createLoginModal();
    if (modal) {
      setLoginModalMode(mode);
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.classList.add('sider-login-modal-open');
      }, 10);
    }
  }

  function hideLoginModal() {
    const modal = document.getElementById('sider-login-modal');
    if (modal) {
      modal.classList.remove('sider-login-modal-open');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }

  function setLoginModalMode(mode) {
    const title = document.getElementById('sider-login-title');
    const subtitle = document.getElementById('sider-login-subtitle');
    const usernameGroup = document.getElementById('sider-login-username-group');
    const submitBtn = document.getElementById('sider-login-submit-btn');
    const submitText = document.getElementById('sider-login-submit-text');
    const createAccountDiv = document.getElementById('sider-login-create-account');
    const alreadyAccountDiv = document.getElementById('sider-login-already-account');
    
    if (mode === 'signup') {
      if (title) title.textContent = 'Welcome';
      if (subtitle) {
        subtitle.innerHTML = 'Sign up to get <strong>30 free</strong> credits every day';
        subtitle.style.display = 'block';
      }
      if (usernameGroup) usernameGroup.style.display = 'block';
      if (submitText) submitText.textContent = 'Sign up';
      if (createAccountDiv) createAccountDiv.style.display = 'none';
      if (alreadyAccountDiv) alreadyAccountDiv.style.display = 'block';
    } else {
      if (title) title.textContent = 'Log in';
      if (subtitle) subtitle.style.display = 'none';
      if (usernameGroup) usernameGroup.style.display = 'none';
      if (submitText) submitText.textContent = 'Log in';
      if (createAccountDiv) createAccountDiv.style.display = 'block';
      if (alreadyAccountDiv) alreadyAccountDiv.style.display = 'none';
    }
  }

  async function handleEmailLogin() {
    const emailInput = document.getElementById('sider-login-email');
    const passwordInput = document.getElementById('sider-login-password');
    const submitBtn = document.getElementById('sider-login-submit-btn');
    const submitText = document.getElementById('sider-login-submit-text');
    
    if (!emailInput || !passwordInput || !submitBtn) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showLoginError('Please enter both email and password');
      return;
    }
    
    if (!window.SiderAuthService) {
      showLoginError('Auth service not loaded. Please refresh the page.');
      return;
    }
    
    submitBtn.disabled = true;
    submitText.textContent = 'Logging in...';
    
    try {
      console.log('Attempting login for:', email);
      const result = await window.SiderAuthService.login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        showLoginSuccess('Welcome back!');
        // Wait for storage to be fully written before updating UI
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch user profile after tokens are saved
        try {
          if (window.SiderAuthService) {
            // Wait a bit more to ensure tokens are fully saved
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const profileResult = await window.SiderAuthService.getCurrentUser();
            if (profileResult.success && profileResult.data) {
              console.log('User profile fetched:', profileResult.data);
            } else {
              console.warn('Failed to fetch user profile:', profileResult.error);
            }
          }
        } catch (error) {
          console.error('Error fetching profile after login:', error);
        }
        
        // Update UI immediately without reload
        setTimeout(() => {
          hideLoginModal();
          // Trigger UI update
          if (window.updateUIForAuthStatus) {
            window.updateUIForAuthStatus().catch(err => {
              console.error('Error updating UI:', err);
              // Retry after a short delay
              setTimeout(() => {
                if (window.updateUIForAuthStatus) {
                  window.updateUIForAuthStatus();
                }
              }, 500);
            });
          } else {
            // Fallback: reload if function not available
            if (window.location) {
              window.location.reload();
            }
          }
        }, 1500);
      } else {
        showLoginError(result.error || 'Login failed');
        submitBtn.disabled = false;
        submitText.textContent = 'Log in';
      }
    } catch (error) {
      console.error('Login error:', error);
      showLoginError(error.message || 'Login failed. Please check your connection.');
      submitBtn.disabled = false;
      submitText.textContent = 'Log in';
    }
  }

  async function handleEmailRegister() {
    const emailInput = document.getElementById('sider-login-email');
    const passwordInput = document.getElementById('sider-login-password');
    const usernameInput = document.getElementById('sider-login-username');
    const submitBtn = document.getElementById('sider-login-submit-btn');
    const submitText = document.getElementById('sider-login-submit-text');
    
    if (!emailInput || !passwordInput || !submitBtn) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput ? usernameInput.value.trim() : '';
    
    if (!email || !password) {
      showLoginError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      showLoginError('Password must be at least 6 characters');
      return;
    }
    
    if (!window.SiderAuthService) {
      showLoginError('Auth service not loaded. Please refresh the page.');
      return;
    }
    
    submitBtn.disabled = true;
    submitText.textContent = 'Signing up...';
    
    try {
      console.log('Attempting registration for:', email);
      const result = await window.SiderAuthService.register(email, password, username);
      console.log('Registration result:', result);
      
      if (result.success) {
        showLoginSuccess('Account created successfully! Please log in.');
        // After registration, automatically try to login
        setTimeout(async () => {
          const loginResult = await window.SiderAuthService.login(email, password);
          if (loginResult.success) {
            showLoginSuccess('Welcome! You are now logged in.');
            // Wait for storage to be fully written before updating UI
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Fetch user profile immediately after login
            try {
              if (window.SiderAuthService) {
                const profileResult = await window.SiderAuthService.getCurrentUser();
                if (profileResult.success && profileResult.data) {
                  console.log('User profile fetched:', profileResult.data);
                }
              }
            } catch (error) {
              console.error('Error fetching profile after login:', error);
            }
            
            // Update UI immediately without reload
            setTimeout(() => {
              hideLoginModal();
              // Trigger UI update
              if (window.updateUIForAuthStatus) {
                window.updateUIForAuthStatus().catch(err => {
                  console.error('Error updating UI:', err);
                  // Retry after a short delay
                  setTimeout(() => {
                    if (window.updateUIForAuthStatus) {
                      window.updateUIForAuthStatus();
                    }
                  }, 500);
                });
              } else {
                // Fallback: reload if function not available
                if (window.location) {
                  window.location.reload();
                }
              }
            }, 1500);
          } else {
            // Registration successful but login failed - show login form
            setLoginModalMode('login');
            showLoginError('Account created. Please log in with your credentials.');
          }
        }, 1000);
      } else {
        showLoginError(result.error || 'Registration failed');
        submitBtn.disabled = false;
        submitText.textContent = 'Sign up';
      }
    } catch (error) {
      console.error('Registration error:', error);
      showLoginError(error.message || 'Registration failed. Please check your connection.');
      submitBtn.disabled = false;
      submitText.textContent = 'Sign up';
    }
  }

  async function handleGoogleLogin() {
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    if (loginGoogleBtn) {
      loginGoogleBtn.disabled = true;
      loginGoogleBtn.innerHTML = '<span>Signing in...</span>';
    }
    
    if (!window.SiderAuthService) {
      showLoginError('Auth service not loaded. Please refresh the page.');
      resetGoogleButton();
      return;
    }

    try {
      // For Chrome extensions with Manifest V3, we can't load external scripts directly
      // Use Chrome Identity API or open a popup window for Google OAuth
      // For now, we'll use a popup window approach
      
      // Fetch Google Client ID from backend
      let googleClientId = null;
      try {
        // Get API base URL from storage or use default (same as auth-service.js)
        const getApiBaseUrl = () => {
          return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.sync.get(['sider_api_base_url'], (result) => {
                let baseUrl = result.sider_api_base_url || API_BASE_URL;
                baseUrl = baseUrl.replace(/\/docs\/?$/, '');
                resolve(baseUrl);
              });
            } else {
              resolve(API_BASE_URL);
            }
          });
        };
        
        const apiBaseUrl = await getApiBaseUrl();
        const clientIdResponse = await fetch(`${apiBaseUrl}/api/auth/google/client-id`);
        if (clientIdResponse.ok) {
          const clientIdData = await clientIdResponse.json();
          googleClientId = clientIdData?.data?.client_id || clientIdData?.client_id;
        }
      } catch (error) {
        console.error('Failed to fetch Google Client ID:', error);
      }

      if (!googleClientId) {
        showLoginError('Google OAuth is not configured. Please add GOOGLE_CLIENT_ID to your backend .env file.');
        resetGoogleButton();
        console.warn('Google OAuth not configured. Add GOOGLE_CLIENT_ID to backend .env file.');
        return;
      }

      // Use Chrome Identity API if available, otherwise use popup window
      if (typeof chrome !== 'undefined' && chrome.identity) {
        // Use Chrome Identity API for OAuth
        const redirectUrl = chrome.identity.getRedirectURL();
        console.log('Chrome extension redirect URL:', redirectUrl);
        console.log('IMPORTANT: Add this exact URL to Google Cloud Console authorized redirect URIs:', redirectUrl);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(googleClientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
          `response_type=id_token&` +
          `scope=openid email profile&` +
          `nonce=${Date.now()}`;
        
        chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true
        }, async (callbackUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Chrome identity error:', chrome.runtime.lastError);
            showLoginError('Google sign-in failed: ' + chrome.runtime.lastError.message);
            resetGoogleButton();
            return;
          }
          
          if (!callbackUrl) {
            showLoginError('Google sign-in was cancelled');
            resetGoogleButton();
            return;
          }
          
          // Extract ID token from callback URL
          // For Chrome Identity API, the token is in the URL fragment (after #)
          let idToken = null;
          const hashIndex = callbackUrl.indexOf('#');
          if (hashIndex !== -1) {
            const hashParams = new URLSearchParams(callbackUrl.substring(hashIndex + 1));
            idToken = hashParams.get('id_token');
          }
          
          // If not in hash, try query parameters
          if (!idToken) {
            const queryIndex = callbackUrl.indexOf('?');
            if (queryIndex !== -1) {
              const queryParams = new URLSearchParams(callbackUrl.substring(queryIndex + 1));
              idToken = queryParams.get('id_token');
            }
          }
          
          if (!idToken) {
            console.error('Callback URL:', callbackUrl);
            showLoginError('Failed to get ID token from Google');
            resetGoogleButton();
            return;
          }
          
          try {
            // Send the ID token to backend
            const result = await window.SiderAuthService.googleSignIn(idToken);
            
            if (result.success) {
              showLoginSuccess('Welcome! You are now logged in.');
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Fetch user profile immediately after login
              try {
                if (window.SiderAuthService) {
                  const profileResult = await window.SiderAuthService.getCurrentUser();
                  if (profileResult.success && profileResult.data) {
                    console.log('User profile fetched:', profileResult.data);
                  }
                }
              } catch (error) {
                console.error('Error fetching profile after login:', error);
              }
              
              setTimeout(() => {
                hideLoginModal();
                if (window.updateUIForAuthStatus) {
                  window.updateUIForAuthStatus().catch(err => {
                    console.error('Error updating UI:', err);
                    setTimeout(() => {
                      if (window.updateUIForAuthStatus) {
                        window.updateUIForAuthStatus();
                      }
                    }, 500);
                  });
                } else {
                  if (window.location) {
                    window.location.reload();
                  }
                }
              }, 1500);
            } else {
              showLoginError(result.error || 'Google sign-in failed');
              resetGoogleButton();
            }
          } catch (error) {
            console.error('Google sign-in error:', error);
            showLoginError(error.message || 'Google sign-in failed');
            resetGoogleButton();
          }
        });
      } else {
        // Fallback: Open popup window for Google OAuth
        const redirectUrl = typeof chrome !== 'undefined' && chrome.identity 
          ? chrome.identity.getRedirectURL() 
          : window.location.origin + '/oauth/callback';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(googleClientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
          `response_type=id_token&` +
          `scope=openid email profile&` +
          `nonce=${Date.now()}`;
        
        const popup = window.open(
          authUrl,
          'Google Sign In',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          showLoginError('Popup blocked. Please allow popups for this site.');
          resetGoogleButton();
          return;
        }
        
        // Listen for message from popup
        const messageListener = async (event) => {
          if (event.origin !== 'https://accounts.google.com' && event.origin !== window.location.origin) {
            return;
          }
          
          if (event.data.type === 'GOOGLE_OAUTH_TOKEN' && event.data.token) {
            window.removeEventListener('message', messageListener);
            popup.close();
            
            try {
              const result = await window.SiderAuthService.googleSignIn(event.data.token);
              
              if (result.success) {
                showLoginSuccess('Welcome! You are now logged in.');
                await new Promise(resolve => setTimeout(resolve, 200));
                
                try {
                  if (window.SiderAuthService) {
                    const profileResult = await window.SiderAuthService.getCurrentUser();
                    if (profileResult.success && profileResult.data) {
                      console.log('User profile fetched:', profileResult.data);
                    }
                  }
                } catch (error) {
                  console.error('Error fetching profile after login:', error);
                }
                
                setTimeout(() => {
                  hideLoginModal();
                  if (window.updateUIForAuthStatus) {
                    window.updateUIForAuthStatus().catch(err => {
                      console.error('Error updating UI:', err);
                      setTimeout(() => {
                        if (window.updateUIForAuthStatus) {
                          window.updateUIForAuthStatus();
                        }
                      }, 500);
                    });
                  } else {
                    if (window.location) {
                      window.location.reload();
                    }
                  }
                }, 1500);
              } else {
                showLoginError(result.error || 'Google sign-in failed');
                resetGoogleButton();
              }
            } catch (error) {
              console.error('Google sign-in error:', error);
              showLoginError(error.message || 'Google sign-in failed');
              resetGoogleButton();
            }
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Check if popup is closed
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageListener);
            if (!popup.closed) {
              showLoginError('Google sign-in was cancelled');
              resetGoogleButton();
            }
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Google login error:', error);
      showLoginError(error.message || 'Google sign-in failed. Please try again.');
      resetGoogleButton();
    }
  }

  function resetGoogleButton() {
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    if (loginGoogleBtn) {
      loginGoogleBtn.disabled = false;
      loginGoogleBtn.innerHTML = `
        <div class="sider-login-btn-icon">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <span>Continue with Google</span>
      `;
    }
  }

  function handleAppleLogin() {
    console.log('Apple login clicked');
  }

  function handlePhoneLogin() {
    console.log('Phone login clicked');
  }

  function showLoginError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'sider-login-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2147483650;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.style.opacity = '0';
      errorDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }

  function showLoginSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'sider-login-success';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2147483650;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => {
      successDiv.style.opacity = '0';
      successDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => successDiv.remove(), 300);
    }, 3000);
  }

  function initializeLoginModal() {
    createLoginModal();
    
    // Wait for auth service to be available
    const checkAuthService = setInterval(() => {
      if (window.SiderAuthService) {
        clearInterval(checkAuthService);
        setupLoginModal();
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkAuthService);
      if (!window.SiderAuthService) {
        console.error('Auth service not loaded after 5 seconds');
      } else {
        setupLoginModal();
      }
    }, 5000);
  }

  function setupLoginModal() {
    const loginModal = document.getElementById('sider-login-modal');
    const loginCloseBtn = document.getElementById('sider-login-close-btn');
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    const submitBtn = document.getElementById('sider-login-submit-btn');
    const emailInput = document.getElementById('sider-login-email');
    const passwordInput = document.getElementById('sider-login-password');
    const createAccountLink = document.getElementById('sider-create-account-link');
    const loginLink = document.getElementById('sider-login-link');
    
    let currentMode = 'login';
    
    if (loginModal) {
      if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideLoginModal();
        });
      }
      
      if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (currentMode === 'signup') {
            await handleEmailRegister();
          } else {
            await handleEmailLogin();
          }
        });
      }
      
      if (emailInput && passwordInput) {
        const handleEnterKey = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (submitBtn) submitBtn.click();
          }
        };
        emailInput.addEventListener('keydown', handleEnterKey);
        passwordInput.addEventListener('keydown', handleEnterKey);
      }
      
      if (loginGoogleBtn) {
        // Remove any existing event listeners
        const newBtn = loginGoogleBtn.cloneNode(true);
        loginGoogleBtn.parentNode.replaceChild(newBtn, loginGoogleBtn);
        
        newBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('Google button clicked, calling handleGoogleLogin');
          
          // Always call handleGoogleLogin which will handle the full flow
          await handleGoogleLogin();
        });
      }
      
      if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentMode = 'signup';
          setLoginModalMode('signup');
        });
      }
      
      if (loginLink) {
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentMode = 'login';
          setLoginModalMode('login');
        });
      }
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal.style.display !== 'none') {
          hideLoginModal();
        }
      });
    }
  }

  window.SiderLoginModal = {
    show: showLoginModal,
    hide: hideLoginModal,
    setMode: setLoginModalMode,
    init: initializeLoginModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginModal);
  } else {
    initializeLoginModal();
  }
})();
