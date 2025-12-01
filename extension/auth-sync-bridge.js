(function() {
  'use strict';

  window.SiderStorageBridge = {
    async getAuthToken() {
      return new Promise((resolve) => {
        try {
          chrome.storage.sync.get(['authToken'], (result) => {
            const token = result?.authToken || null;
            resolve(token);
          });
        } catch (err) {
          console.warn('🌉 auth-sync-bridge: getAuthToken error', err);
          resolve(null);
        }
      });
    },

    async getRefreshToken() {
      return new Promise((resolve) => {
        try {
          chrome.storage.sync.get(['refreshToken'], (result) => {
            const token = result?.refreshToken || null;
            resolve(token);
          });
        } catch (err) {
          console.warn('🌉 auth-sync-bridge: getRefreshToken error', err);
          resolve(null);
        }
      });
    },

    async getUser() {
      return new Promise((resolve) => {
        try {
          chrome.storage.sync.get(['sider_user_profile'], (result) => {
            const user = result?.sider_user_profile || null;
            resolve(user);
          });
        } catch (err) {
          console.warn('🌉 auth-sync-bridge: getUser error', err);
          resolve(null);
        }
      });
    },

    async syncToLocalStorage() {
      try {
        const token = await this.getAuthToken();
        const refreshToken = await this.getRefreshToken();
        const user = await this.getUser();

        if (token) {
          localStorage.setItem('authToken', token);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        return { token, refreshToken, user };
      } catch (err) {
        console.warn('🌉 auth-sync-bridge: syncToLocalStorage error', err);
        return { token: null, refreshToken: null, user: null };
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.SiderStorageBridge.syncToLocalStorage();
    });
  } else {
    window.SiderStorageBridge.syncToLocalStorage();
  }

  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;


      if (changes.authToken) {
        if (changes.authToken.newValue) {
          localStorage.setItem('authToken', changes.authToken.newValue);
        } else {
          localStorage.removeItem('authToken');
        }
      }

      if (changes.refreshToken) {
        if (changes.refreshToken.newValue) {
          localStorage.setItem('refreshToken', changes.refreshToken.newValue);
        } else {
          localStorage.removeItem('refreshToken');
        }
      }

      if (changes.sider_user_profile) {
        if (changes.sider_user_profile.newValue) {
          localStorage.setItem('user', JSON.stringify(changes.sider_user_profile.newValue));
        } else {
          localStorage.removeItem('user');
        }
      }
    });
  } catch (err) {
    console.warn('🌉 auth-sync-bridge: Failed to attach storage listener', err);
  }

  let lastAuthToken = null;
  let lastRefreshToken = null;
  let lastUser = null;
  
  function syncAppStorageToExtension() {
    const currentAuthToken = localStorage.getItem('authToken');
    const currentRefreshToken = localStorage.getItem('refreshToken');
    const currentUser = localStorage.getItem('user');
    
    if (currentAuthToken !== lastAuthToken) {
      lastAuthToken = currentAuthToken;
      
      if (currentAuthToken) {
        let userData = null;
        try {
          userData = currentUser ? JSON.parse(currentUser) : null;
        } catch (e) {
          userData = null;
        }
        
        const storageData = {
          authToken: currentAuthToken,
          refreshToken: currentRefreshToken || null,
          sider_user_email: userData?.email || '',
          sider_user_name: userData?.name || '',
          sider_user_profile: userData || null
        };
        
        try {
          chrome.storage.sync.set(storageData, () => {
            const error = chrome.runtime.lastError;
            if (error) {
              console.warn('🌉 auth-sync-bridge: ⚠️ chrome.storage.sync error:', error);
            }
          });
        } catch (syncErr) {
          console.warn('🌉 auth-sync-bridge: ❌ chrome.storage.sync failed:', syncErr);
        }
        
        try {
          chrome.storage.local.set(storageData, () => {
            const error = chrome.runtime.lastError;
            if (error) {
              console.warn('🌉 auth-sync-bridge: ⚠️ chrome.storage.local error:', error);
            }
          });
        } catch (localErr) {
          console.warn('🌉 auth-sync-bridge: ❌ chrome.storage.local failed:', localErr);
        }
      } else {
        try {
          chrome.storage.sync.remove(['authToken', 'refreshToken', 'sider_user_profile', 'sider_user_email', 'sider_user_name'], () => {
            const error = chrome.runtime.lastError;
            if (error) {
              console.warn('🌉 auth-sync-bridge: ⚠️ Error clearing chrome.storage.sync:', error);
            }
          });
        } catch (syncErr) {
          console.warn('🌉 auth-sync-bridge: ❌ Error clearing sync:', syncErr);
        }
        
        try {
          chrome.storage.local.remove(['authToken', 'refreshToken', 'sider_user_profile', 'sider_user_email', 'sider_user_name'], () => {
            const error = chrome.runtime.lastError;
            if (error) {
              console.warn('🌉 auth-sync-bridge: ⚠️ Error clearing chrome.storage.local:', error);
            }
          });
        } catch (localErr) {
          console.warn('🌉 auth-sync-bridge: ❌ Error clearing local:', localErr);
        }
      }
    }
  }
  
  try {
    window.addEventListener('storage', (event) => {
      if (event.key === 'authToken' || event.key === 'refreshToken' || event.key === 'user') {
        syncAppStorageToExtension();
      }
    });
  } catch (err) {
    console.warn('🌉 auth-sync-bridge: Failed to attach storage listener:', err);
  }
  
  setInterval(syncAppStorageToExtension, 2000);
})();
