(function() {
  'use strict';

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
          <button class="sider-login-btn sider-login-btn-apple" id="sider-login-apple-btn">
            <div class="sider-login-btn-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </div>
            <span>Continue with Apple</span>
          </button>
          <button class="sider-login-btn sider-login-btn-phone" id="sider-login-phone-btn">
            <div class="sider-login-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <span>Continue with Phone</span>
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
    const phoneBtn = document.getElementById('sider-login-phone-btn');
    const createAccountDiv = document.getElementById('sider-login-create-account');
    const alreadyAccountDiv = document.getElementById('sider-login-already-account');
    
    if (mode === 'signup') {
      if (title) title.textContent = 'Welcome';
      if (subtitle) {
        subtitle.innerHTML = 'Sign up to get <strong>30 free</strong> credits every day';
        subtitle.style.display = 'block';
      }
      if (phoneBtn) phoneBtn.style.display = 'none';
      if (createAccountDiv) createAccountDiv.style.display = 'none';
      if (alreadyAccountDiv) alreadyAccountDiv.style.display = 'block';
    } else {
      if (title) title.textContent = 'Log in';
      if (subtitle) subtitle.style.display = 'none';
      if (phoneBtn) phoneBtn.style.display = 'flex';
      if (createAccountDiv) createAccountDiv.style.display = 'block';
      if (alreadyAccountDiv) alreadyAccountDiv.style.display = 'none';
    }
  }

  function handleGoogleLogin() {
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    if (loginGoogleBtn) {
      loginGoogleBtn.disabled = true;
      loginGoogleBtn.innerHTML = '<span>Signing in...</span>';
    }
    
    try {
      chrome.runtime.sendMessage({
        type: 'GOOGLE_LOGIN'
      }, async (response) => {
        if (chrome.runtime.lastError) {
          showLoginError(chrome.runtime.lastError.message || 'Google Sign-In failed');
          resetGoogleButton();
          return;
        }
        
        if (response && response.success) {
          const { email, username, name } = response;
          
          chrome.runtime.sendMessage({
            type: 'REGISTER_USER',
            email: email,
            username: username,
            password: ''
          }, (registerResponse) => {
            if (registerResponse && registerResponse.success) {
              showLoginSuccess(`Welcome, ${name || username}!`);
              setTimeout(() => {
                hideLoginModal();
              }, 1500);
              chrome.storage.local.set({
                sider_user_email: email,
                sider_user_name: name || username,
                sider_user_logged_in: true
              });
            } else {
              showLoginError(registerResponse?.error || 'Registration failed');
              resetGoogleButton();
            }
          });
        } else {
          showLoginError(response?.error || 'Google Sign-In failed');
          resetGoogleButton();
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      showLoginError('Google Sign-In failed');
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
    
    const loginModal = document.getElementById('sider-login-modal');
    const loginCloseBtn = document.getElementById('sider-login-close-btn');
    const loginGoogleBtn = document.getElementById('sider-login-google-btn');
    const loginAppleBtn = document.getElementById('sider-login-apple-btn');
    const loginPhoneBtn = document.getElementById('sider-login-phone-btn');
    const createAccountLink = document.getElementById('sider-create-account-link');
    const loginLink = document.getElementById('sider-login-link');
    
    if (loginModal) {
      if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideLoginModal();
        });
      }
      
      if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleGoogleLogin();
        });
      }
      
      if (loginAppleBtn) {
        loginAppleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleAppleLogin();
        });
      }
      
      if (loginPhoneBtn) {
        loginPhoneBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handlePhoneLogin();
        });
      }
      
      if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setLoginModalMode('signup');
        });
      }
      
      if (loginLink) {
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
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

