(function () {
  'use strict';

  // Don't initialize on our own website
  const currentUrl = window.location.href;
  const isOwnWebsite = currentUrl.includes('localhost:4200') || currentUrl.includes('127.0.0.1:4200');
  if (isOwnWebsite) {
    return; // Exit early, don't initialize sidebar on our own website
  }

  window.SiderSidebar = {
    sidebar: null,
    dropdown: null,

    createDropdown() {
      if (this.dropdown) return this.dropdown;

      const dropdown = document.createElement('div');
      dropdown.className = 'sider-profile-dropdown';
      dropdown.style.display = 'none';
      
      dropdown.innerHTML = `
        <div class="sider-dropdown-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="sider-gift-icon">
            <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M7 7c0-1.66 1.34-3 3-3s3 1.34 3 3M17 7c0-1.66-1.34-3-3-3s-3 1.34-3 3" stroke="white" stroke-width="2" fill="none"/>
            <circle cx="12" cy="9" r="1" fill="white"/>
            <circle cx="12" cy="11" r="1" fill="white"/>
          </svg>
          <div class="sider-dropdown-banner-text">
            <span class="sider-banner-text-regular">Complete Tasks to</span>
            <span class="sider-banner-text-highlight">Earn Credits</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="sider-sparkle-icon">
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        <div class="sider-dropdown-menu">
          <button class="sider-dropdown-item" data-action="whats-new">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>What's new</span>
          </button>
          <button class="sider-dropdown-item" data-action="rewards">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M7 7c0-1.66 1.34-3 3-3s3 1.34 3 3M17 7c0-1.66-1.34-3-3-3s-3 1.34-3 3"/>
            </svg>
            <span>Rewards center</span>
          </button>
          <button class="sider-dropdown-item" data-action="account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>My account</span>
          </button>
          <button class="sider-dropdown-item" data-action="wisebase">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <rect x="7" y="7" width="10" height="10"/>
            </svg>
            <span>My wisebase</span>
          </button>
          <button class="sider-dropdown-item" data-action="help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Help center</span>
          </button>
          <button class="sider-dropdown-item" data-action="feedback">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Feedback</span>
          </button>
          <div class="sider-dropdown-divider"></div>
          <button class="sider-dropdown-item" data-action="logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Log out</span>
          </button>
        </div>
      `;

      document.body.appendChild(dropdown);
      this.dropdown = dropdown;
      return dropdown;
    },

    createSidebar() {
      if (this.sidebar) return this.sidebar;

      const sidebar = document.createElement('div');
      sidebar.className = 'sider-right-sidebar';

      sidebar.innerHTML = `
        <div class="sider-top-group">
          <button class="sider-sidebar-btn" title="Chat" data-action="chat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button class="sider-sidebar-btn" title="Document" data-action="document">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </button>
          <button class="sider-sidebar-btn" title="Eye" data-action="eye">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="sider-sidebar-btn" title="More" data-action="more">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
          <button class="sider-sidebar-btn" title="Settings" data-action="settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6"/>
            </svg>
          </button>
          <button class="sider-sidebar-btn" title="Download" data-action="download">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>

        <div class="sider-bottom-group">
          <button class="sider-sidebar-btn sider-profile-btn" title="Profile" data-action="profile">
            <div class="sider-profile-icon">P</div>
          </button>
        </div>
      `;

      // Don't append to body - it will be added to panel by content.js
      this.sidebar = sidebar;
      return sidebar;
    },

    init() {
      // Remove old event listeners by cloning
      if (this.sidebar) {
        const newSidebar = this.sidebar.cloneNode(true);
        this.sidebar.parentNode?.replaceChild(newSidebar, this.sidebar);
        this.sidebar = newSidebar;
      } else {
        this.createSidebar();
      }
      
      const dropdown = this.createDropdown();
      const sidebar = this.sidebar;

      // Add event listeners to sidebar buttons
      sidebar.querySelectorAll('.sider-sidebar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          console.log('Sidebar button clicked:', action);
          if (action === 'profile') {
            this.toggleDropdown();
          } else {
            this.handleAction(action);
          }
        });
      });

      // Close dropdown when clicking outside
      const clickOutsideHandler = (e) => {
        if (this.dropdown && !this.dropdown.contains(e.target) && 
            !sidebar.contains(e.target)) {
          this.hideDropdown();
        }
      };
      
      // Remove old listener if exists
      if (this._clickOutsideHandler) {
        document.removeEventListener('click', this._clickOutsideHandler);
      }
      this._clickOutsideHandler = clickOutsideHandler;
      document.addEventListener('click', clickOutsideHandler);

      // Handle dropdown menu items - remove old listeners first
      dropdown.querySelectorAll('.sider-dropdown-item').forEach((item) => {
        // Clone the item to remove old event listeners
        const newItem = item.cloneNode(true);
        item.parentNode?.replaceChild(newItem, item);
        
        newItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const action = newItem.getAttribute('data-action');
          this.handleDropdownAction(action);
        });
      });
    },

    toggleDropdown() {
      console.log('Toggle dropdown called', { dropdown: !!this.dropdown });
      if (!this.dropdown) {
        console.log('Creating dropdown...');
        this.createDropdown();
      }
      
      const isVisible = this.dropdown.style.display !== 'none' && this.dropdown.style.display !== '';
      console.log('Dropdown visibility:', { isVisible, display: this.dropdown.style.display });
      if (isVisible) {
        this.hideDropdown();
      } else {
        this.showDropdown();
      }
    },

    showDropdown() {
      if (!this.dropdown || !this.sidebar) {
        console.log('Dropdown or sidebar not found', { dropdown: !!this.dropdown, sidebar: !!this.sidebar });
        return;
      }
      
      const profileBtn = this.sidebar.querySelector('.sider-profile-btn');
      if (!profileBtn) {
        console.log('Profile button not found');
        return;
      }
      
      const rect = profileBtn.getBoundingClientRect();
      const dropdown = this.dropdown;
      
      dropdown.style.display = 'block';
      // Position dropdown to the left of the profile button
      dropdown.style.right = `${window.innerWidth - rect.left + 8}px`;
      dropdown.style.top = `${rect.bottom - 10}px`;
      dropdown.style.left = 'auto';
      dropdown.style.bottom = 'auto';
      
      console.log('Dropdown shown', { right: dropdown.style.right, top: dropdown.style.top });
      
      // Adjust position if dropdown goes off screen
      setTimeout(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.bottom > window.innerHeight) {
          dropdown.style.top = `${rect.top - dropdown.offsetHeight + 10}px`;
        }
        if (dropdownRect.left < 0) {
          dropdown.style.right = 'auto';
          dropdown.style.left = `${rect.right + 8}px`;
        }
      }, 0);
    },

    hideDropdown() {
      if (this.dropdown) {
        this.dropdown.style.display = 'none';
      }
    },

    handleAction(action) {
      console.log(`${action} clicked`);
    },

    handleDropdownAction(action) {
      // Prevent multiple executions
      if (this._isHandlingAction) {
        return;
      }
      this._isHandlingAction = true;
      
      this.hideDropdown();
      console.log(`Dropdown action: ${action}`);
      
      switch(action) {
        case 'whats-new':
          // Handle what's new
          break;
        case 'rewards':
          // Handle rewards center
          break;
        case 'account':
          // Handle my account
          break;
        case 'wisebase':
          // Handle my wisebase
          break;
        case 'help':
          // Handle help center
          break;
        case 'feedback':
          // Handle feedback
          break;
        case 'logout':
          // Close the extension panel and dropdown
          this.hideDropdown();
          
          // Close the extension panel if it exists
          if (typeof window.closeChatPanel === 'function') {
            window.closeChatPanel();
          }
          
          // Open Sider.ai landing page in a new tab
          // Get URL from Chrome storage or use default
          const handleNavigation = (appUrl) => {
            if (!appUrl) {
              appUrl = this.getFallbackUrl();
            }
            
            // Ensure URL is valid and complete
            if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
              appUrl = 'http://' + appUrl;
            }
            
            // Ensure URL ends with /
            if (!appUrl.endsWith('/')) {
              appUrl += '/';
            }
            
            console.log('Opening Sider.ai landing page in new tab:', appUrl);
            window.open(appUrl, '_blank');
          };
          
          // Try to get URL from Chrome storage
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
              chrome.storage.sync.get(['siderAppUrl'], (result) => {
                if (chrome.runtime.lastError) {
                  console.error('Chrome storage error:', chrome.runtime.lastError);
                  handleNavigation(null);
                } else {
                  handleNavigation(result?.siderAppUrl);
                }
              });
              return;
            }
          } catch (error) {
            console.error('Error accessing Chrome storage:', error);
          }
          
          // Fallback: use default URL
          handleNavigation(null);
          break;
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        this._isHandlingAction = false;
      }, 500);
    },

    getFallbackUrl() {
      // Always redirect to Sider.ai landing page
      // Default to localhost:4200 for development
      // In production, this should be configured via options page
      return 'http://localhost:4200/';
    },


    getSidebar() {
      return this.createSidebar();
    },
  };
})();
