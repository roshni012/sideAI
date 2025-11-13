(function() {
  'use strict';

  // API base URL - same as auth-service.js
  const API_BASE_URL = 'https://webby-sider-backend-175d47f9225b.herokuapp.com';

  let loginModal = null;
  let currentMode = 'login'; // Store current mode globally

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
    // Update global currentMode variable
    currentMode = mode;
    
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
    
    console.log('Modal mode changed to:', mode);
  }

  // Track if login is in progress to prevent duplicate calls
  let isLoginInProgress = false;

  async function handleEmailLogin() {
    // Prevent duplicate login calls
    if (isLoginInProgress) {
      console.log('Login already in progress, ignoring duplicate call');
      return;
    }

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
    
    isLoginInProgress = true;
    submitBtn.disabled = true;
    submitText.textContent = 'Logging in...';
    
    try {
      if (!window.SiderAuthService) {
        throw new Error('Auth service not available');
      }

      console.log('Calling login API for:', email);
      const result = await window.SiderAuthService.login(email, password);
      
      if (result.success) {
        console.log('Login successful, tokens should be saved');
        showLoginSuccess('Welcome back!');
        
        // Close modal after success message
        setTimeout(() => {
          hideLoginModal();
          // Clear password field for security
          passwordInput.value = '';
          // Wait a bit for storage to be set, then trigger UI update
          // Skip user info fetch since we already have the data from login
          setTimeout(() => {
            if (window.updateUIForAuthStatus) {
              window.updateUIForAuthStatus(true); // Pass true to skip user info fetch
            }
            // Also directly update profile icon and dropdown after a short delay
            setTimeout(() => {
              if (window.updateProfileIcon) {
                window.updateProfileIcon(true);
              }
              if (window.updateProfileDropdown) {
                window.updateProfileDropdown(true);
              }
            }, 200);
          }, 100);
        }, 1000);
      } else {
        console.error('Login failed:', result.error);
        showLoginError(result.error || 'Login failed');
        submitBtn.disabled = false;
        submitText.textContent = 'Log in';
      }
    } catch (error) {
      console.error('Login error:', error);
      showLoginError(error.message || 'Login failed');
      submitBtn.disabled = false;
      submitText.textContent = 'Log in';
    } finally {
      isLoginInProgress = false;
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
    
    submitBtn.disabled = true;
    submitText.textContent = 'Signing up...';
    
    try {
      if (!window.SiderAuthService) {
        throw new Error('Auth service not available');
      }

      const result = await window.SiderAuthService.register(email, password, username);
      
      if (result.success) {
        showLoginSuccess('Account created successfully! Please log in.');
        // Clear password field for security
        passwordInput.value = '';
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.textContent = 'Log in';
        
        // Switch to login mode after a short delay
        setTimeout(() => {
          setLoginModalMode('login');
          // Keep email filled in for convenience
          emailInput.value = email;
          // Focus on password field
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 1500);
      } else {
        showLoginError(result.error || 'Registration failed');
        submitBtn.disabled = false;
        submitText.textContent = 'Sign up';
      }
    } catch (error) {
      console.error('Registration error:', error);
      showLoginError(error.message || 'Registration failed');
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
    
    // UI only - no authentication logic
    try {
      // Simulate Google sign-in delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showLoginSuccess('Welcome! You are now logged in.');
      
      setTimeout(() => {
        hideLoginModal();
        // Trigger UI update if available
        if (window.updateUIForAuthStatus) {
          window.updateUIForAuthStatus();
        }
      }, 1000);
      
      resetGoogleButton();
    } catch (error) {
      console.error('Google login error:', error);
      showLoginError('Google sign-in failed. Please try again.');
      resetGoogleButton();
    }
  }

  // All Google OAuth logic removed - UI only now

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

  // Track if setup has been done to prevent duplicate listeners
  let setupDone = false;

  function setupLoginModal() {
    // Prevent duplicate setup
    if (setupDone) {
      return;
    }
    
    const loginModal = document.getElementById('sider-login-modal');
    const loginCloseBtn = document.getElementById('sider-login-close-btn');
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    const submitBtn = document.getElementById('sider-login-submit-btn');
    const emailInput = document.getElementById('sider-login-email');
    const passwordInput = document.getElementById('sider-login-password');
    const createAccountLink = document.getElementById('sider-create-account-link');
    const loginLink = document.getElementById('sider-login-link');
    
    // Initialize mode based on current button text
    const submitText = document.getElementById('sider-login-submit-text');
    if (submitText) {
      currentMode = submitText.textContent.trim() === 'Sign up' ? 'signup' : 'login';
    }
    
    if (loginModal) {
      if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideLoginModal();
        });
      }
      
      if (submitBtn) {
        // Remove any existing listeners by cloning the button
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          // Prevent multiple simultaneous clicks
          if (newSubmitBtn.disabled) {
            return;
          }
          
          // Check button text to determine mode (most reliable)
          const submitText = document.getElementById('sider-login-submit-text');
          const isSignupMode = submitText && submitText.textContent.trim() === 'Sign up';
          
          console.log('Submit button clicked, button text:', submitText?.textContent, 'isSignupMode:', isSignupMode, 'currentMode:', currentMode);
          
          if (isSignupMode) {
            await handleEmailRegister();
          } else {
            await handleEmailLogin();
          }
        });
      }
      
      if (emailInput && passwordInput) {
        // Remove existing listeners
        const newEmailInput = emailInput.cloneNode(true);
        const newPasswordInput = passwordInput.cloneNode(true);
        emailInput.parentNode.replaceChild(newEmailInput, emailInput);
        passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);
        
        const handleEnterKey = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const currentSubmitBtn = document.getElementById('sider-login-submit-btn');
            if (currentSubmitBtn && !currentSubmitBtn.disabled) {
              currentSubmitBtn.click();
            }
          }
        };
        newEmailInput.addEventListener('keydown', handleEnterKey);
        newPasswordInput.addEventListener('keydown', handleEnterKey);
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
          setLoginModalMode('signup'); // This will update currentMode
        });
      }
      
      if (loginLink) {
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setLoginModalMode('login'); // This will update currentMode
        });
      }
      
      // Only add escape key listener once
      if (!window.siderEscapeListenerAdded) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const modal = document.getElementById('sider-login-modal');
            if (modal && modal.style.display !== 'none') {
              hideLoginModal();
            }
          }
        });
        window.siderEscapeListenerAdded = true;
      }
      
      setupDone = true;
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
