(function() {
  'use strict';
  
  let currentModel = null;
  let currentTab = null;
  let lastActiveGroup1Tab = 'rec-note'; // Track last active tab from Group 1
  let activeSidebarTab = 'chat'; // Track currently active sidebar tab
  let lastTabUrl = null; // Track last URL to detect page reloads
  let lastTabId = null; // Track last tab ID
  
  // Get current tab info
  async function getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (e) {
      return null;
    }
  }
  
  // Update page title in summarize card (only in chat tab)
  async function updatePageTitle(showCard = false) {
    // Only update if chat tab is active (card only exists in chat-tab.html)
    if (activeSidebarTab !== 'chat') return;
    
    currentTab = await getCurrentTab();
    if (!currentTab) return;
    
    // Wait for the summarize card element to be available in DOM
    // Retry a few times if element is not found (in case HTML is still loading)
    let summarizeCard = document.getElementById('sider-summarize-card');
    let siteNameSpan = document.getElementById('sider-summarize-site-name');
    
    // If elements not found and we want to show the card, wait a bit and retry
    if (showCard && (!summarizeCard || !siteNameSpan)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      summarizeCard = document.getElementById('sider-summarize-card');
      siteNameSpan = document.getElementById('sider-summarize-site-name');
    }
    
    if (summarizeCard && siteNameSpan) {
      let siteName = currentTab.title || 'Page';
      let siteDomain = '';
      let faviconUrl = '';
      
      try {
        const url = new URL(currentTab.url);
        siteDomain = url.hostname.replace('www.', '');
        siteName = siteDomain;
        
        // Get favicon URL
        if (currentTab.favIconUrl) {
          faviconUrl = currentTab.favIconUrl;
        } else {
          // Fallback: use Google's favicon service
          faviconUrl = `https://www.google.com/s2/favicons?domain=${siteDomain}&sz=32`;
        }
      } catch (e) {
        siteName = (currentTab.title || 'Page').substring(0, 40);
        if ((currentTab.title || '').length > 40) {
          siteName += '...';
        }
      }
      
      // Update site name - always show the domain name
      const displayName = siteDomain || siteName;
      siteNameSpan.textContent = displayName;
      
      // Ensure site name is visible
      siteNameSpan.style.display = 'block';
      siteNameSpan.style.visibility = 'visible';
      siteNameSpan.style.opacity = '1';
      
      // Update favicon/logo
      const faviconImg = document.getElementById('sider-summarize-favicon');
      const iconSvg = document.getElementById('sider-summarize-icon-svg');
      if (faviconImg && faviconUrl) {
        faviconImg.src = faviconUrl;
        faviconImg.alt = siteDomain || siteName;
        faviconImg.onerror = function() {
          // If favicon fails to load, show fallback icon
          this.style.display = 'none';
          if (iconSvg) {
            iconSvg.style.display = 'block';
          }
        };
        faviconImg.onload = function() {
          // When favicon loads successfully, hide fallback
          this.style.display = 'block';
          if (iconSvg) {
            iconSvg.style.display = 'none';
          }
        };
        // Try to load the favicon
        faviconImg.style.display = 'block';
        if (iconSvg) {
          iconSvg.style.display = 'none';
        }
      } else if (iconSvg) {
        // No favicon URL, show fallback icon
        iconSvg.style.display = 'block';
        if (faviconImg) {
          faviconImg.style.display = 'none';
        }
      }
      
      // Only show card if explicitly requested (on page reload)
      if (showCard) {
        summarizeCard.style.display = 'flex';
      }
    } else if (showCard) {
      console.warn('Summarize card element not found when trying to show it. Chat tab HTML may not be loaded yet.');
    }
  }
  
  // Auto-resize is now handled by ChatTab component
  
  function toggleNavbar() {
    const sidebar = document.querySelector('.sider-panel-sidebar');
    const hamburger = document.getElementById('sider-sidebar-hamburger');
    const popup = document.getElementById('sider-sidebar-popup');
    
    if (sidebar) {
      const isCollapsed = sidebar.classList.contains('sider-sidebar-collapsed');
      if (isCollapsed) {
        sidebar.classList.remove('sider-sidebar-collapsed');
        sidebar.style.width = '48px';
        sidebar.style.padding = '12px 8px';
        sidebar.style.overflow = 'visible';
        if (hamburger) hamburger.style.display = 'none';
        if (popup) popup.style.display = 'none';
      } else {
        sidebar.classList.add('sider-sidebar-collapsed');
        sidebar.style.width = '0';
        sidebar.style.padding = '0';
        sidebar.style.overflow = 'hidden';
        if (hamburger) hamburger.style.display = 'flex';
      }
    }
  }
  
  function showSidebarPopup() {
    const popup = document.getElementById('sider-sidebar-popup');
    const collapseBtn = document.getElementById('sider-collapse-navbar-btn');
    if (popup && collapseBtn) {
      const btnRect = collapseBtn.getBoundingClientRect();
      if (btnRect) {
        popup.style.top = `${btnRect.top}px`;
        popup.style.right = `${window.innerWidth - btnRect.right}px`;
      }
      popup.style.display = 'block';
    }
  }
  
  function hideSidebarPopup() {
    const popup = document.getElementById('sider-sidebar-popup');
    if (popup) {
      popup.style.display = 'none';
    }
  }
  
  // Tab configuration for Group 1 tabs
  const group1Tabs = {
    'chat': {
      title: 'Chat',
      icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`
    },
    'rec-note': {
      title: 'REC Note',
      icon: `<path fill="currentColor" d="M17.372 15.366a.675.675 0 0 1 1.169.676 5 5 0 0 1-1.122 1.336 5 5 0 0 1-3.231 1.176 5 5 0 0 1-3.232-1.176 5 5 0 0 1-1.122-1.336.675.675 0 0 1 1.169-.676 3.7 3.7 0 0 0 .822.978 3.66 3.66 0 0 0 2.363.86c.9 0 1.724-.323 2.363-.86.327-.275.606-.606.821-.978M12.2.917c.828 0 1.494 0 2.031.043.547.045 1.027.14 1.472.366a3.75 3.75 0 0 1 1.638 1.639c.226.444.321.924.366 1.47.044.538.043 1.204.043 2.032v3.846l-.001.406a3.667 3.667 0 0 0-7.249.781v2q0 .15.013.299c-.326-.017-.66.05-.968.209H9.54l-.077.044a1.91 1.91 0 0 0-.696 2.608q.231.398.516.757H6.8c-.828 0-1.494 0-2.031-.043-.547-.045-1.027-.14-1.471-.366a3.75 3.75 0 0 1-1.64-1.638c-.225-.445-.32-.925-.365-1.472-.044-.537-.043-1.203-.043-2.031v-5.4c0-.828 0-1.494.043-2.031.045-.547.14-1.027.366-1.471a3.75 3.75 0 0 1 1.639-1.64c.444-.225.924-.32 1.47-.365C5.307.916 5.973.917 6.8.917zm1.967 8.25A2.333 2.333 0 0 1 16.5 11.5v2a2.333 2.333 0 0 1-4.667 0v-2a2.333 2.333 0 0 1 2.334-2.333"></path><path fill="#fff" d="M7.333 9.25a.75.75 0 1 1 0 1.5H5a.75.75 0 0 1 0-1.5zm3-4a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5z"></path>`,
      hasBadge: true
    },
    'agent': {
      title: 'Agent',
      icon: `<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`
    },
    'write': {
      title: 'Write',
      icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`
    },
    'translate': {
      title: 'Translate',
      icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M12 3v18M3 12h18"/>`
    },
    'ocr': {
      title: 'OCR',
      icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="12" y2="15"/>`
    },
    'grammar': {
      title: 'Grammar',
      icon: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`
    },
    'ask': {
      title: 'Ask',
      icon: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`
    },
    'search': {
      title: 'Search',
      icon: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`
    },
    'tools': {
      title: 'Tools',
      icon: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`
    }
  };
  
  // Update the 3rd tab icon based on last active tab
  function updateThirdTabIcon(tabId) {
    const thirdTabIcon = document.getElementById('sider-third-tab-icon');
    const thirdTabBadge = document.getElementById('sider-third-tab-badge');
    if (!thirdTabIcon) return;
    
    const tabConfig = group1Tabs[tabId];
    if (!tabConfig) return;
    
    // Update icon
    const svg = thirdTabIcon.querySelector('svg');
    if (svg) {
      if (tabId === 'rec-note') {
        // Special handling for REC Note with xmlns
        svg.innerHTML = tabConfig.icon;
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('viewBox', '0 0 20 20');
      } else {
        svg.innerHTML = tabConfig.icon;
        svg.removeAttribute('xmlns');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
      }
    }
    
    // Update title
    thirdTabIcon.setAttribute('title', tabConfig.title);
    thirdTabIcon.setAttribute('data-tab', tabId);
    
    // Update badge
    if (thirdTabBadge) {
      if (tabConfig.hasBadge) {
        thirdTabBadge.style.display = 'block';
      } else {
        thirdTabBadge.style.display = 'none';
      }
    }
    
    // Update purple class
    if (tabConfig.isPurple) {
      thirdTabIcon.classList.add('sider-sidebar-icon-purple');
    } else {
      thirdTabIcon.classList.remove('sider-sidebar-icon-purple');
    }
    
    // Remove active class when updating third tab icon (it will be added by updateActiveSidebarTab if needed)
    thirdTabIcon.classList.remove('sider-sidebar-icon-active');
  }
  
  // Update active state for sidebar icons
  function updateActiveSidebarTab(tabId) {
    // Remove active state from ALL sidebar icons (including those without data-tab)
    const sidebarIcons = document.querySelectorAll('.sider-panel-sidebar .sider-sidebar-icon');
    sidebarIcons.forEach(icon => {
      icon.classList.remove('sider-sidebar-icon-active');
    });
    
    // Add active state to clicked tab
    // First try to find by data-tab attribute
    let activeIcon = document.querySelector(`.sider-panel-sidebar .sider-sidebar-icon[data-tab="${tabId}"]`);
    
    // If not found, check if it's the third tab icon (which might have been just updated)
    if (!activeIcon) {
      const thirdTabIcon = document.getElementById('sider-third-tab-icon');
      if (thirdTabIcon && thirdTabIcon.getAttribute('data-tab') === tabId) {
        activeIcon = thirdTabIcon;
      }
    }
    
    if (activeIcon) {
      activeIcon.classList.add('sider-sidebar-icon-active');
    }
    
    // Update active state in popup
    const popupItems = document.querySelectorAll('#sider-group1-tabs-popup .sider-sidebar-popup-item[data-tab]');
    popupItems.forEach(item => {
      item.classList.remove('sider-sidebar-popup-item-active');
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('sider-sidebar-popup-item-active');
      }
    });
    
    activeSidebarTab = tabId;
  }
  
  // Load tab component dynamically
  async function loadTabComponent(tabName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }
    
    // Hide all other tab containers
    hideAllTabContainers();
    
    // Hide input footer for non-chat tabs
    toggleInputFooter(false);
    
    // Hide summarize card for non-chat tabs
    toggleSummarizeCard(false);
    
    // Check if HTML is already loaded
    if (container.innerHTML.trim() === '') {
      try {
        // Load HTML from file
        const url = chrome.runtime.getURL(`${tabName}-tab.html`);
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          container.innerHTML = html;
        } else {
          // Use fallback HTML
          const title = tabName.charAt(0).toUpperCase() + tabName.slice(1).replace(/-/g, ' ');
          container.innerHTML = `
            <div class="sider-${tabName}-container" id="sider-${tabName}-container">
              <div class="sider-${tabName}-content">
                <h2>${title}</h2>
                <p>This is the ${title} tab. Content coming soon.</p>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error(`Error loading ${tabName} tab:`, error);
        const title = tabName.charAt(0).toUpperCase() + tabName.slice(1).replace(/-/g, ' ');
        container.innerHTML = `
          <div class="sider-${tabName}-container" id="sider-${tabName}-container">
            <div class="sider-${tabName}-content">
              <h2>${title}</h2>
              <p>Error loading ${title} tab.</p>
            </div>
          </div>
        `;
      }
    }
    
    // Show container
    container.style.display = 'block';
    
    // Initialize tab component if available
    const componentName = `Sider${capitalizeFirst(tabName)}Tab`;
    if (window[componentName] && window[componentName].init) {
      await window[componentName].init();
    }
  }
  
  // Hide all tab containers
  function hideAllTabContainers() {
    const containers = [
      'sider-chat-tab-container',
      'sider-agent-tab-container',
      'sider-rec-note-tab-container',
      'sider-write-tab-container',
      'sider-translate-tab-container',
      'sider-ocr-container',
      'sider-grammar-tab-container',
      'sider-ask-tab-container',
      'sider-search-tab-container',
      'sider-tools-tab-container'
    ];
    
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.style.display = 'none';
      }
    });
  }
  
  // Show/hide input footer based on active tab
  function toggleInputFooter(show) {
    const footerContainer = document.getElementById('sider-chat-footer-container');
    if (footerContainer) {
      footerContainer.style.display = show ? 'block' : 'none';
    }
    // Persistent footer is always visible, no need to toggle
  }
  
  // Show/hide summarize card based on active tab (only show in chat)
  function toggleSummarizeCard(show) {
    // Only show summarize card if chat tab is active (card only exists in chat-tab.html)
    if (activeSidebarTab !== 'chat') return;
    const summarizeCard = document.getElementById('sider-summarize-card');
    if (summarizeCard) {
      summarizeCard.style.display = show ? 'flex' : 'none';
    }
  }
  
  // Capitalize first letter and handle hyphens
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
  
  // Handle tab switching
  async function switchToTab(tabId) {
    // Check if it's a Group 1 tab
    if (group1Tabs[tabId]) {
      // If it's not chat or agent, update the 3rd position
      if (tabId !== 'chat' && tabId !== 'agent') {
        lastActiveGroup1Tab = tabId;
        updateThirdTabIcon(tabId);
      }
      
      // Update active state
      updateActiveSidebarTab(tabId);
      
      // Hide welcome message
      const welcome = document.querySelector('.sider-welcome');
      if (welcome) {
        welcome.style.display = 'none';
      }
      
      // Handle specific tab actions
      switch(tabId) {
        case 'chat':
          // Switch to chat view
          toggleInputFooter(true); // Show input footer for chat
          // Summarize card will be shown/hidden by chat tab logic or updatePageTitle
          if (window.SiderChatTab) {
            window.SiderChatTab.switchToChat();
          }
          break;
        case 'ocr':
          toggleInputFooter(false); // Hide input footer for OCR
          openOCR();
          break;
        case 'agent':
          toggleInputFooter(false); // Hide input footer for other tabs
          await loadTabComponent('agent', 'sider-agent-tab-container');
          break;
        case 'rec-note':
          toggleInputFooter(false);
          await loadTabComponent('rec-note', 'sider-rec-note-tab-container');
          break;
        case 'write':
          toggleInputFooter(false);
          await loadTabComponent('write', 'sider-write-tab-container');
          break;
        case 'translate':
          toggleInputFooter(false);
          await loadTabComponent('translate', 'sider-translate-tab-container');
          break;
        case 'grammar':
          toggleInputFooter(false);
          await loadTabComponent('grammar', 'sider-grammar-tab-container');
          break;
        case 'ask':
          toggleInputFooter(false);
          await loadTabComponent('ask', 'sider-ask-tab-container');
          break;
        case 'search':
          toggleInputFooter(false);
          await loadTabComponent('search', 'sider-search-tab-container');
          break;
        case 'tools':
          toggleInputFooter(false);
          await loadTabComponent('tools', 'sider-tools-tab-container');
          break;
      }
    }
  }
  
  // Expose switchToTab globally so chat-tab.js can call it
  window.switchToTab = switchToTab;
  
  function openFullPageChat() {
    // Get base URL from storage or use default
    chrome.storage.sync.get(['sider_app_base_url'], (result) => {
      const baseUrl = result.sider_app_base_url || 'http://localhost:3000';
      window.open(baseUrl, '_blank');
    });
  }
  
  function handleSidebarAction(action) {
    switch(action) {
      case 'chat':
        // Handle chat action
        break;
      case 'documents':
        // Handle documents action
        break;
      case 'refresh':
        // Handle refresh action
        break;
      case 'more':
        // Handle more options
        break;
      case 'link':
        // Handle link action
        break;
      case 'share':
        // Handle share action
        break;
      case 'layers':
        // Handle layers action
        break;
      case 'mobile':
        // Handle mobile action
        break;
      case 'target':
        // Handle target action
        break;
      case 'profile':
        // Handle profile action
        const profileIcon = document.getElementById('sider-profile-icon');
        if (profileIcon) {
          profileIcon.click();
        }
        break;
      default:
        break;
    }
  }
  
  async function handleAction(action) {
    // Check authentication for actions that require it
    if (action === 'fullscreen' || action === 'research' || action === 'highlights' || action === 'slides') {
      const isAuthenticated = await requireAuth();
      if (!isAuthenticated) {
        return;
      }
    }
    
    // Handle fullscreen action through ChatTab
    if (action === 'fullscreen' && window.SiderChatTab) {
      window.SiderChatTab.handleAction(action);
    }
  }
  
  function updateAISelectorIcon(model) {
    const iconMap = {
      'webby fusion': chrome.runtime.getURL('icons/fusion.png'),
      'gpt -5 mini': chrome.runtime.getURL('icons/gpt_5mini.png'),
      'claude haiku 4.5': chrome.runtime.getURL('icons/claude.png'),
      'gemini 2.5 flash': chrome.runtime.getURL('icons/gemini.png'),
      'gpt -5': chrome.runtime.getURL('icons/chatgpt.png'),
      'gpt -4.1': chrome.runtime.getURL('icons/chatgpt.png'),
      'gpt -5.1': chrome.runtime.getURL('icons/chatgpt.png'),
      'deepseek v3.1': chrome.runtime.getURL('icons/deepseek.png'),
      'claude sonnet 4.5': chrome.runtime.getURL('icons/claude.png'),
      'gemini 2.5 pro': chrome.runtime.getURL('icons/gemini.png'),
      'grok 4': chrome.runtime.getURL('icons/grok.png'),
      'claude 3.5 haiku': chrome.runtime.getURL('icons/claude.png'),
      'kimi k2': chrome.runtime.getURL('icons/kimi.png'),
      'deepseek v3': chrome.runtime.getURL('icons/deepseek.png'),
      'claude 3.7 sonnet': chrome.runtime.getURL('icons/claude.png'),
      'claude sonnet 4': chrome.runtime.getURL('icons/claude.png'),
      'claude opus 4.1': chrome.runtime.getURL('icons/claude.png'),
      'chatgpt': chrome.runtime.getURL('icons/fusion.png'),
      'gpt4': chrome.runtime.getURL('icons/chatgpt.png'),
      'gemini': chrome.runtime.getURL('icons/gemini.png'),
      'claude': chrome.runtime.getURL('icons/claude.png'),
      'groq': chrome.runtime.getURL('icons/grok.png')
    };
    
    const aiIconImg = document.getElementById('sider-ai-icon-img');
    if (aiIconImg) {
      const imageUrl = iconMap[model] || chrome.runtime.getURL('icons/fusion.png');
      aiIconImg.src = imageUrl;
      aiIconImg.alt = model;
    }
  }
  
  // Make updateAISelectorIcon globally accessible
  window.updateAISelectorIcon = updateAISelectorIcon;
  
  async function startScreenshotMode() {
    // Refresh current tab to ensure we have the latest tab info
    currentTab = await getCurrentTab();
    
    if (!currentTab || !currentTab.id) {
      console.error('No active tab found');
      alert('No active tab found. Please open a webpage and try again.');
      return;
    }
    
    // Check if the tab URL is injectable (not chrome://, extension://, etc.)
    const url = currentTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('moz-extension://') || url.startsWith('edge://') ||
        url.startsWith('about:')) {
      console.error('Screenshot mode is not available on this page');
      alert('Screenshot mode is not available on Chrome internal pages or extension pages.');
      return;
    }
    
    try {
      // Send message to content script to start screenshot mode
      chrome.tabs.sendMessage(currentTab.id, {
        type: 'START_SCREENSHOT_MODE'
      }, (response) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          console.error('Error starting screenshot mode:', errorMsg);
          
          // If content script is not loaded, try to inject it
          if (errorMsg.includes('Receiving end does not exist') || 
              errorMsg.includes('Could not establish connection')) {
            // Try to inject all content scripts
            chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              files: ['ai-modules.js', 'toolbar.js', 'image-preview.js', 'login-modal.js', 'content.js']
            }).then(() => {
              // Retry sending message after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(currentTab.id, {
                  type: 'START_SCREENSHOT_MODE'
                }, (retryResponse) => {
                  if (chrome.runtime.lastError) {
                    console.error('Error starting screenshot mode after injection:', chrome.runtime.lastError);
                    alert('Failed to start screenshot mode. Please refresh the page and try again.');
                  }
                });
              }, 100);
            }).catch((error) => {
              console.error('Failed to inject content script:', error);
              alert('Failed to start screenshot mode. This page may not support content scripts. Please try on a regular webpage.');
            });
          } else {
            alert('Failed to start screenshot mode: ' + errorMsg);
          }
        }
      });
    } catch (error) {
      console.error('Error in startScreenshotMode:', error);
      alert('Failed to start screenshot mode. Please try again.');
    }
  }
  
  // Make startScreenshotMode globally accessible
  window.startScreenshotMode = startScreenshotMode;
  
  // Chat-related functions moved to chat-tab.js component
  
  // OCR Functions
  let ocrImageScale = 1;
  let ocrExtractedText = '';
  let isProcessingOCR = false; // Guard to prevent multiple simultaneous OCR calls
  
  function openOCR() {
    const ocrContainer = document.getElementById('sider-ocr-container');
    const welcome = document.querySelector('.sider-welcome');
    const chatContainer = document.getElementById('sider-chat-container');
    const panelFooter = document.querySelector('.sider-panel-footer');
    const panelBody = document.getElementById('sider-panel-body');
    
    // Hide summarize card when switching to OCR (only exists in chat tab)
    if (activeSidebarTab === 'chat') {
      const summarizeCard = document.getElementById('sider-summarize-card');
      if (summarizeCard) {
        summarizeCard.style.display = 'none';
      }
    }
    
    if (ocrContainer) {
      ocrContainer.style.display = 'flex';
    }
    if (welcome) {
      welcome.style.display = 'none';
    }
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
    // Hide summarize card for OCR
    toggleSummarizeCard(false);
    
    if (panelFooter) {
      panelFooter.style.display = 'none';
    }
    if (panelBody) {
      panelBody.classList.add('sider-ocr-active');
    }
    
    // Reset OCR state
    resetOCR();
  }
  
  function resetOCR() {
    const uploadArea = document.getElementById('sider-ocr-upload-area');
    const imageWrapper = document.getElementById('sider-ocr-image-wrapper');
    const result = document.getElementById('sider-ocr-result');
    const divider = document.getElementById('sider-ocr-divider');
    const divider2 = document.getElementById('sider-ocr-divider-2');
    const ocrImage = document.getElementById('sider-ocr-image');
    const ocrFileInput = document.getElementById('sider-ocr-file-input');
    const screenshotBtn = document.getElementById('sider-ocr-screenshot');
    const resultContent = document.getElementById('sider-ocr-result-content');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (imageWrapper) imageWrapper.style.display = 'none';
    if (result) result.style.display = 'none';
    if (divider) divider.style.display = 'none';
    if (divider2) divider2.style.display = 'block';
    if (ocrImage) {
      ocrImage.src = '';
      ocrImage.style.transform = 'scale(1)';
    }
    if (ocrFileInput) ocrFileInput.value = '';
    if (screenshotBtn) screenshotBtn.style.display = 'block';
    if (resultContent) resultContent.textContent = '';
    
    ocrImageScale = 1;
    ocrExtractedText = '';
  }
  
  function handleOCRFileUpload(file) {
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      displayOCRImage(dataUrl);
      
      // Process OCR
      processOCR(dataUrl);
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // Handle PDF - for now, show message
      alert('PDF OCR support coming soon. Please upload an image file.');
    } else {
      alert('Unsupported file type. Please upload an image or PDF.');
    }
  }
  
  function displayOCRImage(dataUrl) {
    const uploadArea = document.getElementById('sider-ocr-upload-area');
    const imageWrapper = document.getElementById('sider-ocr-image-wrapper');
    const ocrImage = document.getElementById('sider-ocr-image');
    const divider = document.getElementById('sider-ocr-divider');
    const divider2 = document.getElementById('sider-ocr-divider-2');
    const screenshotBtn = document.getElementById('sider-ocr-screenshot');
    const result = document.getElementById('sider-ocr-result');
    
    if (ocrImage) {
      ocrImage.src = dataUrl;
      ocrImageScale = 1;
      ocrImage.style.transform = `scale(${ocrImageScale})`;
      ocrImage.style.transformOrigin = 'center center';
    }
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (imageWrapper) imageWrapper.style.display = 'block';
    if (divider) divider.style.display = 'none';
    if (divider2) divider2.style.display = 'none';
    if (screenshotBtn) screenshotBtn.style.display = 'none';
    
    // Result section will be shown by processOCR when text is extracted
    // Only show result if image is available
    if (result && imageWrapper && imageWrapper.style.display !== 'none') {
      // Result will be shown after OCR processing
    } else if (result) {
      result.style.display = 'none';
    }
  }
  
  async function processOCR(imageDataUrl) {
    // Prevent multiple simultaneous OCR calls
    if (isProcessingOCR) {
      return;
    }
    
    const result = document.getElementById('sider-ocr-result');
    const resultContent = document.getElementById('sider-ocr-result-content');
    const imageWrapper = document.getElementById('sider-ocr-image-wrapper');
    
    if (!result || !resultContent) return;
    
    // Only show result if image is available
    if (!imageWrapper || imageWrapper.style.display === 'none') {
      result.style.display = 'none';
      return;
    }
    
    // Set processing flag
    isProcessingOCR = true;
    
    // Show loading state
    resultContent.textContent = 'Processing OCR...';
    result.style.display = 'block';
    
    try {
      // Call OCR API or service
      const extractedText = await performOCR(imageDataUrl);
      
      ocrExtractedText = extractedText;
      resultContent.textContent = extractedText || 'No text detected in the image.';
      
    } catch (error) {
      console.error('OCR processing error:', error);
      resultContent.textContent = 'Error processing image. Please try again.';
    } finally {
      // Always reset the processing flag
      isProcessingOCR = false;
    }
  }
  
  // Helper function to convert data URL to Blob
  function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async function performOCR(imageDataUrl) {
    // Check if ImageService is available
    if (!window.SiderImageService) {
      console.error('ImageService not available');
      return 'Error: Image service not available. Please refresh the page.';
    }

    try {
      // Convert data URL to Blob
      const blob = dataURLtoBlob(imageDataUrl);
      
      // Create a File object from the Blob (for better compatibility)
      const file = new File([blob], 'ocr-image.png', { type: blob.type || 'image/png' });

      const chatTabModel = (window.SiderChatTab && typeof window.SiderChatTab.getActiveModel === 'function')
        ? window.SiderChatTab.getActiveModel()
        : (window.SiderChatTab && window.SiderChatTab.currentModel);
      const ocrModel = currentModel || chatTabModel;
      
      // Use ImageService to upload and extract text
      const result = await window.SiderImageService.extractTextFromImage(file, {
        mime: blob.type || 'image/png',
        type: 'image'
      }, ocrModel);

      if (result.success && result.data) {
        return result.data.text || 'No text detected in the image.';
      } else {
        console.error('OCR extraction failed:', result.error);
        return `Error: ${result.error || 'Failed to extract text from image'}`;
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      return `Error: ${error.message || 'Failed to process image'}`;
    }
  }
  
  function setupOCREventListeners() {
    const ocrFileInput = document.getElementById('sider-ocr-file-input');
    const ocrUploadZone = document.getElementById('sider-ocr-upload-zone');
    const ocrDeleteBtn = document.getElementById('sider-ocr-delete');
    const ocrUploadNewBtn = document.getElementById('sider-ocr-upload-new');
    const ocrScreenshotActionBtn = document.getElementById('sider-ocr-screenshot-action');
    const ocrZoomInBtn = document.getElementById('sider-ocr-zoom-in');
    const ocrZoomOutBtn = document.getElementById('sider-ocr-zoom-out');
    const ocrZoomTargetBtn = document.getElementById('sider-ocr-zoom-target');
    const ocrCopyBtn = document.getElementById('sider-ocr-copy');
    const ocrPasteBtn = document.getElementById('sider-ocr-paste');
    const ocrRefreshBtn = document.getElementById('sider-ocr-refresh');
    const ocrEditBtn = document.getElementById('sider-ocr-edit');
    const ocrSpeakerBtn = document.getElementById('sider-ocr-speaker');
    const ocrChatBtn = document.getElementById('sider-ocr-chat');
    const ocrScreenshotBtn = document.getElementById('sider-ocr-screenshot');
    
    // File input
    if (ocrFileInput) {
      ocrFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleOCRFileUpload(file);
        }
      });
    }
    
    // Upload zone click
    if (ocrUploadZone) {
      ocrUploadZone.addEventListener('click', () => {
        if (ocrFileInput) {
          ocrFileInput.click();
        }
      });
      
      // Drag and drop
      ocrUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        ocrUploadZone.classList.add('dragover');
      });
      
      ocrUploadZone.addEventListener('dragleave', () => {
        ocrUploadZone.classList.remove('dragover');
      });
      
      ocrUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        ocrUploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
          handleOCRFileUpload(file);
        }
      });
    }
    
    // Delete button
    if (ocrDeleteBtn) {
      ocrDeleteBtn.addEventListener('click', () => {
        resetOCR();
      });
    }
    
    // Upload new button
    if (ocrUploadNewBtn) {
      ocrUploadNewBtn.addEventListener('click', () => {
        if (ocrFileInput) {
          ocrFileInput.click();
        }
      });
    }
    
    // Screenshot button
    if (ocrScreenshotActionBtn) {
      ocrScreenshotActionBtn.addEventListener('click', () => {
        startScreenshotMode();
      });
    }
    
    // Zoom controls
    if (ocrZoomInBtn) {
      ocrZoomInBtn.addEventListener('click', () => {
        ocrImageScale = Math.min(ocrImageScale + 0.1, 3);
        const ocrImage = document.getElementById('sider-ocr-image');
        if (ocrImage) {
          ocrImage.style.transform = `scale(${ocrImageScale})`;
          ocrImage.style.transformOrigin = 'center center';
        }
      });
    }
    
    if (ocrZoomOutBtn) {
      ocrZoomOutBtn.addEventListener('click', () => {
        ocrImageScale = Math.max(ocrImageScale - 0.1, 0.5);
        const ocrImage = document.getElementById('sider-ocr-image');
        if (ocrImage) {
          ocrImage.style.transform = `scale(${ocrImageScale})`;
          ocrImage.style.transformOrigin = 'center center';
        }
      });
    }
    
    if (ocrZoomTargetBtn) {
      ocrZoomTargetBtn.addEventListener('click', () => {
        ocrImageScale = 1;
        const ocrImage = document.getElementById('sider-ocr-image');
        if (ocrImage) {
          ocrImage.style.transform = `scale(${ocrImageScale})`;
          ocrImage.style.transformOrigin = 'center center';
        }
      });
    }
    
    // Copy button
    if (ocrCopyBtn) {
      ocrCopyBtn.addEventListener('click', async () => {
        if (ocrExtractedText) {
          try {
            await navigator.clipboard.writeText(ocrExtractedText);
            const originalTitle = ocrCopyBtn.getAttribute('title');
            ocrCopyBtn.setAttribute('title', 'Copied!');
            setTimeout(() => {
              ocrCopyBtn.setAttribute('title', originalTitle || 'Copy');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy text. Please try again.');
          }
        }
      });
    }
    
    // Paste button
    if (ocrPasteBtn) {
      ocrPasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          const resultContent = document.getElementById('sider-ocr-result-content');
          if (resultContent) {
            resultContent.textContent = text;
            ocrExtractedText = text;
          }
        } catch (err) {
          console.error('Failed to paste:', err);
          alert('Failed to paste text. Please try again.');
        }
      });
    }
    
    // Refresh button
    if (ocrRefreshBtn) {
      ocrRefreshBtn.addEventListener('click', () => {
        const ocrImage = document.getElementById('sider-ocr-image');
        if (ocrImage && ocrImage.src) {
          processOCR(ocrImage.src);
        }
      });
    }
    
    // Edit button
    if (ocrEditBtn) {
      ocrEditBtn.addEventListener('click', () => {
        const resultContent = document.getElementById('sider-ocr-result-content');
        if (resultContent) {
          resultContent.contentEditable = resultContent.contentEditable === 'true' ? 'false' : 'true';
          if (resultContent.contentEditable === 'true') {
            resultContent.focus();
            ocrEditBtn.style.background = '#8b5cf6';
            ocrEditBtn.style.color = '#ffffff';
          } else {
            ocrExtractedText = resultContent.textContent;
            ocrEditBtn.style.background = '';
            ocrEditBtn.style.color = '';
          }
        }
      });
    }
    
    // Speaker button (read aloud)
    if (ocrSpeakerBtn) {
      ocrSpeakerBtn.addEventListener('click', () => {
        if (ocrExtractedText && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(ocrExtractedText);
          speechSynthesis.speak(utterance);
        } else {
          alert('Text-to-speech is not supported in this browser.');
        }
      });
    }
    
    // Chat button
    if (ocrChatBtn) {
      ocrChatBtn.addEventListener('click', () => {
        if (ocrExtractedText) {
          // Switch to chat tab first
          switchToTab('chat');
          
          // Wait for tab switch to complete, then set input value
          setTimeout(() => {
          const input = document.getElementById('sider-chat-input');
          if (input) {
            input.value = `Extract and analyze this text from the image:\n\n${ocrExtractedText}`;
              
              // Auto-resize and update UI
              if (window.SiderChatTab) {
                window.SiderChatTab.autoResize(input);
              }
              if (window.toggleMicSendButton) {
                window.toggleMicSendButton();
              }
              
              // Focus the input and scroll into view
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'end' });
              
              // Ensure input is visible by scrolling to bottom
              const inputArea = input.closest('.sider-input-area');
              if (inputArea) {
                inputArea.scrollTop = inputArea.scrollHeight;
              }
            }
          }, 100);
            
            // Optionally auto-send
            // sendMessage();
        }
      });
    }
    
    // Screenshot button
    if (ocrScreenshotBtn) {
      ocrScreenshotBtn.addEventListener('click', () => {
        startScreenshotMode();
      });
    }
  }
  
  // Chat message functions moved to chat-tab.js component
  
  function toggleProfileDropdown() {
    const profileDropdown = document.getElementById('sider-profile-dropdown');
    const profileIcon = document.getElementById('sider-profile-icon');
    
    if (!profileDropdown || !profileIcon) return;
    
    const isVisible = profileDropdown.style.display !== 'none';
    
    if (isVisible) {
      profileDropdown.style.display = 'none';
    } else {
      const iconRect = profileIcon.getBoundingClientRect();
      if (iconRect) {
        profileDropdown.style.display = 'block';
        const dropdownHeight = 200;
        profileDropdown.style.bottom = `${window.innerHeight - iconRect.top + 8}px`;
        profileDropdown.style.right = `${window.innerWidth - iconRect.right - 48}px`;
        
        const dropdownRect = profileDropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth) {
          profileDropdown.style.right = '20px';
        }
        if (dropdownRect.bottom > window.innerHeight) {
          profileDropdown.style.bottom = '80px';
        }
      } else {
        profileDropdown.style.display = 'block';
      }
    }
  }
  
  function handleProfileLogin() {
    // Wait for login modal to be available
    if (window.SiderLoginModal) {
      window.SiderLoginModal.show('login');
    } else {
      setTimeout(() => {
        if (window.SiderLoginModal) {
          window.SiderLoginModal.show('login');
        } else {
          console.error('Login modal not available');
        }
      }, 100);
    }
  }
  
  function handleProfileMenuAction(action) {
    switch (action) {
      case 'whats-new':
        break;
      case 'rewards':
        break;
      case 'account':
        break;
      case 'wisebase':
        break;
      case 'help':
        break;
      case 'feedback':
        break;
      case 'logout':
        if (window.SiderAuthService) {
          window.SiderAuthService.clearAuth().then(() => {
            updateUIForAuthStatus();
          });
        }
        break;
      default:
    }
  }
  
  // Chat image and text selection functions moved to chat-tab.js component
  
  // Listen for messages to switch to chat tab
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SWITCH_TO_CHAT_TAB') {
      // Switch to chat tab
      switchToTab('chat');
      return false;
    }
    return false;
  });

  // Listen for screenshot - handle OCR only (chat is handled by ChatTab component)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SCREENSHOT_CAPTURED' && request.dataUrl) {
      // Check if OCR is open
      const ocrContainer = document.getElementById('sider-ocr-container');
      if (ocrContainer && ocrContainer.style.display !== 'none') {
        // Handle screenshot in OCR
        displayOCRImage(request.dataUrl);
        processOCR(request.dataUrl);
      }
      // Chat screenshots are now handled by ChatTab component's message listener
    }
    return false;
  });
  
  // Listen for extract text from image-preview.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'EXTRACT_TEXT') {
      // Switch to OCR tab first
      switchToTab('ocr');
      
      // Convert image to data URL if needed
      const processImage = (dataUrl) => {
        // Small delay to ensure OCR tab is fully opened
        setTimeout(() => {
          displayOCRImage(dataUrl);
          processOCR(dataUrl);
        }, 100);
      };
      
      if (request.dataUrl) {
        // Already a data URL
        processImage(request.dataUrl);
      } else if (request.imageUrl) {
        // Need to convert URL to data URL
        convertImageUrlToDataUrl(request.imageUrl).then(dataUrl => {
          processImage(dataUrl);
        }).catch(err => {
          console.error('Error converting image URL to data URL:', err);
          // Try to display the image URL directly (may not work due to CORS)
          processImage(request.imageUrl);
        });
      }
    }
    return false;
  });
  
  // Helper function to convert image URL to data URL
  function convertImageUrlToDataUrl(url) {
    return new Promise((resolve, reject) => {
      // Try using fetch first
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // Fallback: try using an image element
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function() {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = reject;
          img.src = url;
        });
    });
  }
  
  function initializePanel() {
    // Cleanup: Remove google_client_id from storage if it exists
    try {
      localStorage.removeItem('google_client_id');
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['google_client_id'], () => {
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup google_client_id:', error);
    }
    
    // Get current tab (don't set lastTabUrl yet - wait for first 'complete' status)
    getCurrentTab().then(tab => {
      currentTab = tab;
      if (window.SiderChatTab) {
        window.SiderChatTab.updateCurrentTab(tab);
      }
      updatePageTitle(false); // Don't show card on initial load
      // Note: lastTabUrl and lastTabId will be set after first page completes
      // This prevents the first load from being detected as a reload
      
      // Set initial tracking if tab is already loaded
      if (tab && tab.url && tab.status === 'complete') {
        lastTabUrl = tab.url;
        lastTabId = tab.id;
      }
    });
    
    // Show input footer by default since chat is the default tab
    toggleInputFooter(true);
    
    // Icon sources are now set up in chat-tab.js after HTML is loaded
    const ocrScreenshotActionIcon = document.getElementById('sider-ocr-screenshot-action-icon');
    if (ocrScreenshotActionIcon) {
      ocrScreenshotActionIcon.src = chrome.runtime.getURL('icons/cut.png');
    }
    const ocrScreenshotIcon = document.getElementById('sider-ocr-screenshot-icon');
    if (ocrScreenshotIcon) {
      ocrScreenshotIcon.src = chrome.runtime.getURL('icons/cut.png');
    }
    
    // Initialize ChatTab component
    if (window.SiderChatTab) {
      window.SiderChatTab.init({
        currentModel: currentModel,
        currentTab: currentTab,
        requireAuth: requireAuth,
        getCurrentTab: getCurrentTab,
        updatePageTitle: updatePageTitle
      });
    }
    
    // Screenshot button is now handled by ChatTab component
    // The event listeners are set up in chat-tab.js after HTML is loaded
    
    // AI Model Selector is now handled by ChatTab component
    // The event listeners are set up in chat-tab.js after HTML is loaded
    
    // Initialize AI Modules if available
    if (window.SiderAIModules) {
      window.SiderAIModules.init(
        (model) => {
          currentModel = model;
          updateAISelectorIcon(model);
          if (window.SiderChatTab) {
            window.SiderChatTab.updateModel(model);
          }
        },
        (model, text) => {
          if (window.SiderChatTab) {
            window.SiderChatTab.addMessage('assistant', `[${model}] ${text}`);
          }
        }
      );
    }
    
    // Load previously selected model
    chrome.storage.sync.get(['sider_selected_model'], (result) => {
      if (result.sider_selected_model) {
        currentModel = result.sider_selected_model;
        updateAISelectorIcon(currentModel);
        if (window.SiderChatTab) {
          window.SiderChatTab.updateModel(currentModel);
        }
      }
    });
    
    // Profile icon dropdown
    const profileIcon = document.getElementById('sider-profile-icon');
    const profileDropdown = document.getElementById('sider-profile-dropdown');
    const profileLoginBtn = document.getElementById('sider-profile-login-btn');
    
    if (profileIcon && profileDropdown) {
      profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfileDropdown();
      });
      
      document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.style.display !== 'none') {
          if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
            profileDropdown.style.display = 'none';
          }
        }
      });
      
      const menuItems = profileDropdown.querySelectorAll('.sider-profile-menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          handleProfileMenuAction(action);
          profileDropdown.style.display = 'none';
        });
      });
      
      if (profileLoginBtn) {
        profileLoginBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleProfileLogin();
          profileDropdown.style.display = 'none';
        });
      }
    }
    
    // File attachment and read page are now handled by ChatTab component
    // Screenshot button is now handled by ChatTab component
    
    // Chat control button is now handled in chat-tab.js after HTML is loaded
    
    // Generation Model Selection Modal
    const imageModelBtn = document.getElementById('sider-image-model-btn');
    const generationModelModal = document.getElementById('sider-generation-model-modal');
    const generationModelOptions = generationModelModal?.querySelectorAll('.sider-generation-model-option');
    const modelTextSpan = imageModelBtn?.querySelector('.sider-chat-controls-model-text');
    let selectedModel = 'nano-banana';
    
    imageModelBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (generationModelModal) {
        generationModelModal.style.display = 'block';
      }
    });
    
    generationModelOptions?.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const model = option.getAttribute('data-model');
        selectedModel = model;
        
        const modelNames = {
          'nano-banana': 'Nano Banana',
          'low': 'Low',
          'medium': 'Medium',
          'high': 'High'
        };
        if (modelTextSpan) {
          modelTextSpan.textContent = modelNames[model] || 'Nano Banana';
        }
        
        generationModelOptions.forEach(opt => opt.classList.remove('sider-generation-model-option-selected'));
        option.classList.add('sider-generation-model-option-selected');
        
        if (generationModelModal) {
          generationModelModal.style.display = 'none';
        }
      });
    });
    
    document.addEventListener('click', (e) => {
      if (generationModelModal && generationModelModal.style.display !== 'none') {
        if (!generationModelModal.contains(e.target) && !imageModelBtn?.contains(e.target)) {
          generationModelModal.style.display = 'none';
        }
      }
    });
    
    // Custom Instructions Modal
    const customInstructionsEditIcon = document.querySelector('.sider-chat-controls-edit-icon');
    const customInstructionsModal = document.getElementById('sider-custom-instructions-modal');
    const customInstructionsTextarea = document.getElementById('sider-custom-instructions-textarea');
    const customInstructionsClose = document.getElementById('sider-custom-instructions-close');
    const customInstructionsCancel = document.getElementById('sider-custom-instructions-cancel');
    const customInstructionsSave = document.getElementById('sider-custom-instructions-save');
    
    // Load saved custom instructions
    chrome.storage.sync.get(['sider_custom_instructions'], (result) => {
      if (customInstructionsTextarea && result.sider_custom_instructions) {
        customInstructionsTextarea.value = result.sider_custom_instructions;
      }
    });
    
    // Open modal when edit icon is clicked
    customInstructionsEditIcon?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customInstructionsModal) {
        customInstructionsModal.style.display = 'flex';
        // Focus textarea when modal opens
        setTimeout(() => {
          if (customInstructionsTextarea) {
            customInstructionsTextarea.focus();
          }
        }, 100);
      }
    });
    
    // Close modal functions
    const closeCustomInstructionsModal = () => {
      if (customInstructionsModal) {
        customInstructionsModal.style.display = 'none';
      }
    };
    
    customInstructionsClose?.addEventListener('click', closeCustomInstructionsModal);
    customInstructionsCancel?.addEventListener('click', closeCustomInstructionsModal);
    
    // Save custom instructions
    customInstructionsSave?.addEventListener('click', () => {
      if (customInstructionsTextarea) {
        const instructions = customInstructionsTextarea.value.trim();
        chrome.storage.sync.set({ sider_custom_instructions: instructions }, () => {
          closeCustomInstructionsModal();
        });
      }
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (customInstructionsModal && customInstructionsModal.style.display !== 'none') {
        if (!customInstructionsModal.contains(e.target) && !customInstructionsEditIcon?.contains(e.target)) {
          closeCustomInstructionsModal();
        }
      }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && customInstructionsModal && customInstructionsModal.style.display !== 'none') {
        closeCustomInstructionsModal();
      }
    });
    
    if (generationModelOptions && generationModelOptions.length > 0) {
      generationModelOptions[0].classList.add('sider-generation-model-option-selected');
    }
    
    // Collapse Nav Bar button - show popup with all Group 1 tabs
    const collapseNavbarBtn = document.getElementById('sider-collapse-navbar-btn');
    collapseNavbarBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const popup = document.getElementById('sider-sidebar-popup');
      if (popup) {
        const isVisible = popup.style.display !== 'none';
        if (isVisible) {
          popup.style.display = 'none';
        } else {
          showSidebarPopup();
        }
      }
    });
    
    // Sidebar icon click handlers
    const sidebarIcons = document.querySelectorAll('.sider-panel-sidebar .sider-sidebar-icon[data-tab]');
    sidebarIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = icon.getAttribute('data-tab');
        if (tabId) {
          switchToTab(tabId);
        }
      });
    });
    
    // Full page chat button
    const fullpageChatBtn = document.getElementById('sider-fullpage-chat-btn');
    fullpageChatBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openFullPageChat();
    });
    
    // Hamburger menu (when collapsed)
    const hamburger = document.getElementById('sider-sidebar-hamburger');
    const sidebarPopup = document.getElementById('sider-sidebar-popup');
    
    if (hamburger) {
      hamburger.addEventListener('mouseenter', () => {
        showSidebarPopup();
      });
      
      hamburger.addEventListener('mouseleave', (e) => {
        if (!sidebarPopup?.contains(e.relatedTarget)) {
          setTimeout(() => {
            if (!sidebarPopup?.matches(':hover')) {
              hideSidebarPopup();
            }
          }, 100);
        }
      });
    }
    
    if (sidebarPopup) {
      sidebarPopup.addEventListener('mouseenter', () => {
        sidebarPopup.style.display = 'block';
      });
      
      sidebarPopup.addEventListener('mouseleave', () => {
        hideSidebarPopup();
      });
      
      // Expand Nav Bar button in popup
      const expandNavbarPopupBtn = document.getElementById('sider-expand-navbar-popup-btn');
      expandNavbarPopupBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNavbar();
        hideSidebarPopup();
      });
      
      // Full page chat button in popup
      const fullpageChatPopupBtn = document.getElementById('sider-fullpage-chat-popup-btn');
      fullpageChatPopupBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openFullPageChat();
        hideSidebarPopup();
      });
      
      // Popup items click handlers - Group 1 tabs
      const popupItems = sidebarPopup.querySelectorAll('#sider-group1-tabs-popup .sider-sidebar-popup-item[data-tab]');
      popupItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const tabId = item.getAttribute('data-tab');
          if (tabId) {
            switchToTab(tabId);
          hideSidebarPopup();
          }
        });
      });
    }
    
    // Check initial state
    const sidebar = document.querySelector('.sider-panel-sidebar');
    if (sidebar && sidebar.classList.contains('sider-sidebar-collapsed')) {
      if (hamburger) hamburger.style.display = 'flex';
    }
    const moreOptionsIcon = document.getElementById('sider-more-options-icon');
    const moreOptionsPopup = document.getElementById('sider-more-options-popup');
    
    if (moreOptionsIcon && moreOptionsPopup) {
      let moreOptionsTimeout;
      
      // Function to filter out tabs already visible in sidebar
      const filterMoreOptionsPopup = () => {
        const allItems = moreOptionsPopup.querySelectorAll('.sider-more-options-item');
        const visibleTabs = ['chat', 'agent', lastActiveGroup1Tab]; // Tabs always visible in sidebar
        
        allItems.forEach(item => {
          const action = item.getAttribute('data-action');
          if (visibleTabs.includes(action)) {
            item.style.display = 'none';
          } else {
            item.style.display = 'flex';
          }
        });
      };
      
      const showMoreOptionsPopup = () => {
        clearTimeout(moreOptionsTimeout);
        if (moreOptionsIcon && moreOptionsPopup) {
          // Filter out tabs already visible in sidebar
          filterMoreOptionsPopup();
          
          const iconRect = moreOptionsIcon.getBoundingClientRect();
          if (iconRect) {
            moreOptionsPopup.style.display = 'block';
            const sidebar = document.querySelector('.sider-panel-sidebar');
            const sidebarWidth = sidebar ? sidebar.offsetWidth : 48;
            moreOptionsPopup.style.top = `${iconRect.top}px`;
            moreOptionsPopup.style.right = `${window.innerWidth - iconRect.right + sidebarWidth}px`;
          }
        }
      };
      
      const hideMoreOptionsPopup = () => {
        clearTimeout(moreOptionsTimeout);
        moreOptionsTimeout = setTimeout(() => {
          if (moreOptionsPopup && !moreOptionsPopup.matches(':hover') && !moreOptionsIcon.matches(':hover')) {
            moreOptionsPopup.style.display = 'none';
          }
        }, 200);
      };
      
      // Click handler to toggle popup
      moreOptionsIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = moreOptionsPopup.style.display !== 'none';
        if (isVisible) {
          moreOptionsPopup.style.display = 'none';
        } else {
          showMoreOptionsPopup();
        }
      });
      
      moreOptionsIcon.addEventListener('mouseenter', () => {
        showMoreOptionsPopup();
      });
      
      moreOptionsIcon.addEventListener('mouseleave', (e) => {
        if (!moreOptionsPopup.contains(e.relatedTarget)) {
          hideMoreOptionsPopup();
        }
      });
      
      moreOptionsPopup.addEventListener('mouseenter', () => {
        clearTimeout(moreOptionsTimeout);
        moreOptionsPopup.style.display = 'block';
      });
      
      moreOptionsPopup.addEventListener('mouseleave', () => {
        hideMoreOptionsPopup();
      });
      
      const moreOptionsItems = moreOptionsPopup.querySelectorAll('.sider-more-options-item');
      const selectedOptionIcon = document.getElementById('sider-selected-option-icon');
      
      // Map actions to their SVG icons
      const actionIconMap = {
        'chat': `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
        'rec-note': `<path fill="currentColor" d="M17.372 15.366a.675.675 0 0 1 1.169.676 5 5 0 0 1-1.122 1.336 5 5 0 0 1-3.231 1.176 5 5 0 0 1-3.232-1.176 5 5 0 0 1-1.122-1.336.675.675 0 0 1 1.169-.676 3.7 3.7 0 0 0 .822.978 3.66 3.66 0 0 0 2.363.86c.9 0 1.724-.323 2.363-.86.327-.275.606-.606.821-.978M12.2.917c.828 0 1.494 0 2.031.043.547.045 1.027.14 1.472.366a3.75 3.75 0 0 1 1.638 1.639c.226.444.321.924.366 1.47.044.538.043 1.204.043 2.032v3.846l-.001.406a3.667 3.667 0 0 0-7.249.781v2q0 .15.013.299c-.326-.017-.66.05-.968.209H9.54l-.077.044a1.91 1.91 0 0 0-.696 2.608q.231.398.516.757H6.8c-.828 0-1.494 0-2.031-.043-.547-.045-1.027-.14-1.471-.366a3.75 3.75 0 0 1-1.64-1.638c-.225-.445-.32-.925-.365-1.472-.044-.537-.043-1.203-.043-2.031v-5.4c0-.828 0-1.494.043-2.031.045-.547.14-1.027.366-1.471a3.75 3.75 0 0 1 1.639-1.64c.444-.225.924-.32 1.47-.365C5.307.916 5.973.917 6.8.917zm1.967 8.25A2.333 2.333 0 0 1 16.5 11.5v2a2.333 2.333 0 0 1-4.667 0v-2a2.333 2.333 0 0 1 2.334-2.333"></path><path fill="#fff" d="M7.333 9.25a.75.75 0 1 1 0 1.5H5a.75.75 0 0 1 0-1.5zm3-4a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5z"></path>`,
        'agent': `<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
        'write': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
        'translate': `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M12 3v18M3 12h18"/>`,
        'ocr': `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="12" y2="15"/>`,
        'grammar': `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
        'ask': `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
        'search': `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,
        'tools': `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`
      };
      
      // Map actions to their labels
      const actionLabelMap = {
        'chat': 'Chat',
        'rec-note': 'REC Note',
        'agent': 'Agent',
        'write': 'Write',
        'translate': 'Translate',
        'ocr': 'OCR',
        'grammar': 'Grammar',
        'ask': 'Ask',
        'search': 'Search',
        'tools': 'Tools'
      };
      
      moreOptionsItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          const iconSvg = item.querySelector('.sider-more-options-icon svg');
          
          if (selectedOptionIcon && iconSvg && actionIconMap[action]) {
            // Update the selected option icon
            const selectedIconSvg = selectedOptionIcon.querySelector('svg');
            if (selectedIconSvg) {
              selectedIconSvg.innerHTML = actionIconMap[action];
            }
            
            // Update title
            selectedOptionIcon.setAttribute('title', actionLabelMap[action] || action);
            
            // Show the selected option icon
            selectedOptionIcon.style.display = 'flex';
          }
          
          // Handle Group 1 tabs
          if (group1Tabs[action]) {
            switchToTab(action);
          }
          
          moreOptionsPopup.style.display = 'none';
        });
      });
    }
    
    // Action buttons
    document.querySelectorAll('.sider-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        handleAction(action);
      });
    });
    
    // Persistent Footer Event Listeners
    const footerUpgrade = document.querySelector('.sider-footer-upgrade');
    const footerGiftBtn = document.getElementById('sider-footer-gift-btn');
    const footerHeartBtn = document.getElementById('sider-footer-heart-btn');
    const footerHelpBtn = document.getElementById('sider-footer-help-btn');
    const footerMessageBtn = document.getElementById('sider-footer-message-btn');
    
    if (footerUpgrade) {
      footerUpgrade.addEventListener('click', () => {
      });
    }
    
    // Sparkle icon click handler (if needed)
    const footerSparkle = document.querySelector('.sider-footer-sparkle-wrapper');
    if (footerSparkle) {
      footerSparkle.addEventListener('click', () => {
      });
    }
    
    if (footerGiftBtn) {
      footerGiftBtn.addEventListener('click', () => {
        // Handle rewards action
        handleProfileMenuAction('rewards');
      });
    }
    
    if (footerHeartBtn) {
      footerHeartBtn.addEventListener('click', () => {
      });
    }
    
    if (footerHelpBtn) {
      footerHelpBtn.addEventListener('click', () => {
        // Handle help action
        handleProfileMenuAction('help');
      });
    }
    
    if (footerMessageBtn) {
      footerMessageBtn.addEventListener('click', () => {
        // Handle messages action
        handleProfileMenuAction('feedback');
      });
    }
    
    // Load credits from storage
    chrome.storage.local.get(['sider_credits'], (result) => {
      const creditsElement = document.getElementById('sider-footer-credits');
      if (creditsElement) {
        creditsElement.textContent = result.sider_credits || '0';
      }
    });
    
    // Listen for credits updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.sider_credits) {
        const creditsElement = document.getElementById('sider-footer-credits');
        if (creditsElement) {
          creditsElement.textContent = changes.sider_credits.newValue || '0';
        }
      }
      
      if (changes.authToken) {
        if (changes.authToken.newValue === undefined || changes.authToken.newValue === null) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          updateUIForAuthStatus();
        }
      }
    });
    
    // Summarize button
    const summarizeBtn = document.getElementById('sider-summarize-btn');
    const summarizeSaveBtn = document.getElementById('sider-summarize-save-btn');
    const summarizeCloseBtn = document.getElementById('sider-summarize-close-btn');
    
    if (summarizeBtn) {
      summarizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.SiderChatTab) {
          window.SiderChatTab.handleSummarizeClick();
        }
      });
    }
    
    if (summarizeSaveBtn) {
      summarizeSaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Save functionality - can be implemented later
        // For now, just show a feedback
        const originalTitle = summarizeSaveBtn.getAttribute('title');
        summarizeSaveBtn.setAttribute('title', 'Saved!');
        setTimeout(() => {
          summarizeSaveBtn.setAttribute('title', originalTitle || 'Save');
        }, 2000);
      });
    }
    
    if (summarizeCloseBtn) {
      summarizeCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Only hide if chat tab is active (card only exists in chat-tab.html)
        if (activeSidebarTab === 'chat') {
          const summarizeCard = document.getElementById('sider-summarize-card');
          if (summarizeCard) {
            summarizeCard.style.display = 'none';
          }
        }
      });
    }
    
    // Close AI dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const aiDropdown = document.getElementById('sider-ai-dropdown');
      const aiSelectorBtn = document.getElementById('sider-ai-selector-btn');
      if (aiDropdown && aiDropdown.style.display !== 'none') {
        if (!aiDropdown.contains(e.target) && !aiSelectorBtn?.contains(e.target)) {
          aiDropdown.style.display = 'none';
        }
      }
      
      // Close sidebar popup when clicking outside
      const sidebarPopup = document.getElementById('sider-sidebar-popup');
      const collapseNavbarBtn = document.getElementById('sider-collapse-navbar-btn');
      if (sidebarPopup && sidebarPopup.style.display !== 'none') {
        if (!sidebarPopup.contains(e.target) && !collapseNavbarBtn?.contains(e.target)) {
          hideSidebarPopup();
        }
      }
      
      // Close more options popup when clicking outside
      const moreOptionsPopup = document.getElementById('sider-more-options-popup');
      const moreOptionsIcon = document.getElementById('sider-more-options-icon');
      if (moreOptionsPopup && moreOptionsPopup.style.display !== 'none') {
        if (!moreOptionsPopup.contains(e.target) && !moreOptionsIcon?.contains(e.target)) {
          moreOptionsPopup.style.display = 'none';
        }
      }
    });
    
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          currentTab = tab;
          if (window.SiderChatTab) {
            window.SiderChatTab.updateCurrentTab(tab);
          }
          updatePageTitle();
        }
      } catch (e) {
        console.error('Error updating tab on activation:', e);
      }
    });
    
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && tabId === activeTab.id) {
          // Only process when page is complete or title changes
          if (changeInfo.status === 'complete' || changeInfo.title) {
            // Detect page reload: status is 'complete', URL exists, and URL/tabId match previous values
            // This means the same page was reloaded (not navigation to a new page)
            const isPageReload = changeInfo.status === 'complete' && 
                                 tab.url && 
                                 lastTabUrl !== null && // Must have a previous URL
                                 lastTabUrl === tab.url && 
                                 lastTabId === tabId;
            
            currentTab = tab;
            if (window.SiderChatTab) {
              window.SiderChatTab.updateCurrentTab(tab);
            }
            
            // Show summarize card only on page reload (not on initial load, navigation, or new chats)
            if (isPageReload && activeSidebarTab === 'chat') {
              // Use setTimeout to ensure DOM is ready and card isn't immediately hidden
              setTimeout(() => {
                updatePageTitle(true); // Pass true to show the card
              }, 100);
            } else {
              updatePageTitle(false); // Update title but don't show card
            }
            
            // Update tracking variables after checking for reload
            // This ensures next reload will be detected correctly
            if (tab.url && changeInfo.status === 'complete') {
              lastTabUrl = tab.url;
              lastTabId = tabId;
            }
          }
        }
      } catch (e) {
        console.error('Error updating tab on update:', e);
      }
    });
    
    // Initialize 3rd tab icon with last active tab
    updateThirdTabIcon(lastActiveGroup1Tab);
    
    // Set initial active state
    updateActiveSidebarTab(activeSidebarTab);
  }
  
  // Authentication functions
  async function checkAuthStatus() {
    if (!window.SiderAuthService) {
      return false;
    }
    return await window.SiderAuthService.isAuthenticated();
  }

  let updateUIForAuthStatusTimeout = null;
  let isUpdatingUI = false;
  let isFetchingUserInfo = false;

  async function updateUIForAuthStatus(skipUserInfoFetch = false) {
    // Debounce: cancel previous call if still pending
    if (updateUIForAuthStatusTimeout) {
      clearTimeout(updateUIForAuthStatusTimeout);
    }
    
    // Prevent concurrent calls
    if (isUpdatingUI) {
      return;
    }
    
    updateUIForAuthStatusTimeout = setTimeout(async () => {
      isUpdatingUI = true;
      try {
        // Add a small delay to ensure storage operations are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check auth status by reading from storage only (no API calls)
        const isAuthenticated = await checkAuthStatus();
        
        if (isAuthenticated) {
          // Hide login modal if open
          if (window.SiderLoginModal) {
            window.SiderLoginModal.hide();
          }
          
          // Update UI with cached data from storage only (no API calls)
          // All login logic and API calls are handled in login-modal.js
          updateProfileDropdown(true);
          updateProfileIcon(true);
          updateWelcomeMessage(true);
          
          // Enable all features
          enableFeatures(true);
          
          // Fetch current user info on extension open (only if not skipped and not already fetching)
          if (!skipUserInfoFetch && !isFetchingUserInfo) {
            const fetchCurrentUserInfo = () => {
              if (window.SiderAuthService && window.SiderAuthService.getCurrentUserInfo) {
                isFetchingUserInfo = true;
                window.SiderAuthService.getCurrentUserInfo().then((userInfoResult) => {
                  isFetchingUserInfo = false;
                if (userInfoResult.success && userInfoResult.data) {
                  // Store user info from API response
                  const userData = {
                    email: userInfoResult.data.email || '',
                    username: userInfoResult.data.username || '',
                    name: userInfoResult.data.username || '',
                    id: userInfoResult.data.id || '',
                    is_active: userInfoResult.data.is_active,
                    created_at: userInfoResult.data.created_at,
                    last_login: userInfoResult.data.last_login
                  };
                  localStorage.setItem('user', JSON.stringify(userData));
                  // Also save to chrome.storage.local for welcome message
                  chrome.storage.local.set({
                    sider_user_name: userInfoResult.data.username || userInfoResult.data.email?.split('@')[0] || '',
                    sider_user_email: userInfoResult.data.email || '',
                    sider_user_logged_in: true
                  }, () => {
                    updateProfileIcon(true);
                    updateProfileDropdown(true);
                    updateWelcomeMessage(true);
                  });
                } else {
                  console.warn('⚠️ User info fetch returned no data:', userInfoResult);
                }
              }).catch((error) => {
                isFetchingUserInfo = false;
                console.error('⚠️ Failed to fetch user info on extension open:', error);
              });
            } else {
              // Retry after a short delay if auth service not ready yet
              setTimeout(() => {
                if (window.SiderAuthService && window.SiderAuthService.getCurrentUserInfo && !isFetchingUserInfo) {
                  fetchCurrentUserInfo();
                } else {
                  console.warn('⚠️ SiderAuthService not available after retry for user info');
                }
              }, 500);
            }
          };
          fetchCurrentUserInfo();
          }
        } else {
          // Show login prompt in profile dropdown
          updateProfileDropdown(false);
          updateProfileIcon(false);
          
          // Reset welcome message
          updateWelcomeMessage(false);
          
          // Disable features (but don't block UI)
          enableFeatures(false);
        }
      } finally {
        isUpdatingUI = false;
      }
    }, 200); // 200ms debounce
  }

  function updateWelcomeMessage(isAuthenticated) {
    const welcomeHeading = document.querySelector('.sider-welcome h3');
    
    if (isAuthenticated) {
      chrome.storage.local.get(['sider_user_name', 'sider_user_email'], (result) => {
        const userName = result.sider_user_name || result.sider_user_email?.split('@')[0] || 'there';
        if (welcomeHeading) {
          welcomeHeading.textContent = `Hi ${userName}`;
        }
      });
    } else {
      if (welcomeHeading) {
        welcomeHeading.textContent = 'Hi,';
      }
    }
  }
  
  // Make function globally available
  window.updateUIForAuthStatus = updateUIForAuthStatus;

  function updateProfileIcon(isAuthenticated) {
    const profileIcon = document.getElementById('sider-profile-icon');
    if (!profileIcon) return;
    
    if (isAuthenticated) {
      chrome.storage.local.get(['sider_user_email', 'sider_user_name', 'sider_user_logged_in'], (result) => {
        if (!result.sider_user_logged_in) {
          // Show default icon
          const svg = profileIcon.querySelector('svg');
          if (svg) svg.style.display = 'block';
          return;
        }
        
        // Get first letter of username
        const userName = result.sider_user_name || result.sider_user_email?.split('@')[0] || 'U';
        const firstLetter = userName.charAt(0).toUpperCase();
        
        // Hide SVG and show letter
        const svg = profileIcon.querySelector('svg');
        if (svg) svg.style.display = 'none';
        
        // Create or update letter element
        let letterEl = profileIcon.querySelector('.sider-profile-icon-letter');
        if (!letterEl) {
          letterEl = document.createElement('span');
          letterEl.className = 'sider-profile-icon-letter';
          profileIcon.appendChild(letterEl);
        }
        letterEl.textContent = firstLetter;
        letterEl.style.display = 'flex';
      });
    } else {
      // Show default icon
      const svg = profileIcon.querySelector('svg');
      const letterEl = profileIcon.querySelector('.sider-profile-icon-letter');
      if (svg) svg.style.display = 'block';
      if (letterEl) letterEl.style.display = 'none';
    }
  }

  function updateProfileDropdown(isAuthenticated) {
    const profileDropdown = document.getElementById('sider-profile-dropdown');
    const profileDropdownText = document.getElementById('sider-profile-dropdown-text');
    const profileLoginText = document.getElementById('sider-profile-login-text');
    const profileUserInfo = document.getElementById('sider-profile-user-info');
    const profileUserName = document.getElementById('sider-profile-user-name');
    const profileUserStatus = document.getElementById('sider-profile-user-status');
    const profileUserEmail = document.getElementById('sider-profile-user-email');
    const profileLoginBtn = document.getElementById('sider-profile-login-btn');
    const profileRewardsBanner = document.getElementById('sider-profile-rewards-banner');
    const profileDropdownIcon = document.getElementById('sider-profile-dropdown-icon');
    const profileIconSvg = document.getElementById('sider-profile-icon-svg');
    const profileIconLetter = document.getElementById('sider-profile-icon-letter');
    const profileMenuAccount = document.getElementById('sider-profile-menu-account');
    const profileMenuWisebase = document.getElementById('sider-profile-menu-wisebase');
    const profileMenuLogout = document.getElementById('sider-profile-menu-logout');
    
    if (!profileDropdown) {
      console.warn('Profile dropdown not found');
      return;
    }
    
    if (isAuthenticated) {
      // Get user info from storage first (for immediate update)
      chrome.storage.local.get(['sider_user_email', 'sider_user_name', 'sider_user_logged_in'], (result) => {
        // Double-check authentication status
        if (!result.sider_user_logged_in) {
          // If not logged in, update to show login prompt
          if (profileLoginText) {
            profileLoginText.style.display = 'block';
            profileLoginText.textContent = 'Log in to start using Sider.';
          }
          if (profileUserInfo) {
            profileUserInfo.style.display = 'none';
          }
          if (profileLoginBtn) {
            profileLoginBtn.style.display = 'block';
            profileLoginBtn.textContent = 'Log in';
            profileLoginBtn.onclick = () => {
              if (window.SiderLoginModal) {
                window.SiderLoginModal.show('login');
              }
            };
          }
          if (profileRewardsBanner) {
            profileRewardsBanner.style.display = 'none';
          }
          if (profileMenuAccount) {
            profileMenuAccount.style.display = 'none';
          }
          if (profileMenuWisebase) {
            profileMenuWisebase.style.display = 'none';
          }
          if (profileMenuLogout) {
            profileMenuLogout.style.display = 'none';
          }
          // Show default icon in dropdown
          if (profileIconSvg) profileIconSvg.style.display = 'block';
          if (profileIconLetter) profileIconLetter.style.display = 'none';
          return;
        }
        
        // Display user info
        const userName = result.sider_user_name || result.sider_user_email?.split('@')[0] || 'User';
        const userEmail = result.sider_user_email || '';
        const firstLetter = userName.charAt(0).toUpperCase();
        
        // Update dropdown icon
        if (profileIconSvg) profileIconSvg.style.display = 'none';
        if (profileIconLetter) {
          profileIconLetter.textContent = firstLetter;
          profileIconLetter.style.display = 'flex';
        }
        
        // Update user info display
        if (profileLoginText) {
          profileLoginText.style.display = 'none';
        }
        if (profileUserInfo) {
          profileUserInfo.style.display = 'block';
        }
        if (profileUserName) {
          profileUserName.textContent = userName;
        }
        if (profileUserEmail) {
          profileUserEmail.textContent = userEmail;
        }
        // Status is already set to "Free" in HTML, can be updated later if needed
        
        // Show rewards banner
        if (profileRewardsBanner) {
          profileRewardsBanner.style.display = 'flex';
        }
        
        // Show logged-in menu items
        if (profileMenuAccount) {
          profileMenuAccount.style.display = 'flex';
        }
        if (profileMenuWisebase) {
          profileMenuWisebase.style.display = 'flex';
        }
        if (profileMenuLogout) {
          profileMenuLogout.style.display = 'flex';
        }
        
        // Hide login button when logged in (logout is in menu)
        if (profileLoginBtn) {
          profileLoginBtn.style.display = 'none';
        }
      });
    } else {
      // Not authenticated - show login prompt
      if (profileLoginText) {
        profileLoginText.style.display = 'block';
        profileLoginText.textContent = 'Log in to start using Sider.';
      }
      if (profileUserInfo) {
        profileUserInfo.style.display = 'none';
      }
      if (profileRewardsBanner) {
        profileRewardsBanner.style.display = 'none';
      }
      if (profileMenuAccount) {
        profileMenuAccount.style.display = 'none';
      }
      if (profileMenuWisebase) {
        profileMenuWisebase.style.display = 'none';
      }
      if (profileMenuLogout) {
        profileMenuLogout.style.display = 'none';
      }
      if (profileLoginBtn) {
        profileLoginBtn.style.display = 'block';
        profileLoginBtn.textContent = 'Log in';
        profileLoginBtn.onclick = () => {
          if (window.SiderLoginModal) {
            window.SiderLoginModal.show('login');
          }
        };
      }
      // Show default icon in dropdown
      if (profileIconSvg) profileIconSvg.style.display = 'block';
      if (profileIconLetter) profileIconLetter.style.display = 'none';
    }
  }

  // Make profile functions globally available (after they're defined)
  window.updateProfileIcon = updateProfileIcon;
  window.updateProfileDropdown = updateProfileDropdown;

  function enableFeatures(enabled) {
    // Features are always visible, but we can add visual indicators
    // The actual blocking happens in feature handlers
  }

  async function requireAuth(callback) {
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      // Show login modal
      if (window.SiderLoginModal) {
        window.SiderLoginModal.show('login');
      }
      return false;
    }
    
    if (callback) {
      callback();
    }
    return true;
  }

  // Listen for auth state changes (debounced to prevent multiple calls)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      // Only trigger UI update for actual auth-related changes
      if (changes.sider_access_token || changes.sider_refresh_token || changes.sider_user_logged_in) {
        updateUIForAuthStatus();
      }
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      initializePanel();
      setupOCREventListeners();
      // Update UI immediately with cached data
      updateProfileDropdown(false);
      updateWelcomeMessage(false);
      
      // Wait for auth service to load
      const checkAuthService = setInterval(() => {
        if (window.SiderAuthService) {
          clearInterval(checkAuthService);
          updateUIForAuthStatus();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkAuthService);
        if (window.SiderAuthService) {
          updateUIForAuthStatus();
        } else {
          // Even if auth service not loaded, check storage and update UI
          chrome.storage.local.get(['sider_user_logged_in'], (result) => {
            if (result.sider_user_logged_in) {
              updateProfileDropdown(true);
              updateWelcomeMessage(true);
            }
          });
        }
      }, 2000);
    });
  } else {
    initializePanel();
    setupOCREventListeners();
    // Update UI immediately with cached data
    updateProfileDropdown(false);
    updateWelcomeMessage(false);
    
    // Wait for auth service to load
    const checkAuthService = setInterval(() => {
      if (window.SiderAuthService) {
        clearInterval(checkAuthService);
        updateUIForAuthStatus();
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(checkAuthService);
      if (window.SiderAuthService) {
        updateUIForAuthStatus();
      } else {
        // Even if auth service not loaded, check storage and update UI
        chrome.storage.local.get(['sider_user_logged_in'], (result) => {
          if (result.sider_user_logged_in) {
            updateProfileDropdown(true);
            updateWelcomeMessage(true);
          }
        });
      }
    }, 2000);
  }
  
  // Initialize custom tooltips (hide native tooltips)
  function initTooltips(container) {
    if (!container) container = document;
    
    // Convert all title attributes to data-tooltip for custom styling
    const elementsWithTitle = container.querySelectorAll('[title]');
    elementsWithTitle.forEach(el => {
      if (el.title && !el.dataset.tooltip) {
        el.dataset.tooltip = el.title;
      }
    });
    
    // Use event delegation to hide native tooltips on hover
    container.addEventListener('mouseenter', function(e) {
      if (!e || !e.target) return;
      // Handle text nodes - get the parent element
      let element = e.target;
      if (element.nodeType !== 1) {
        element = element.parentElement;
      }
      if (!element || typeof element.closest !== 'function') return;
      const target = element.closest('[data-tooltip]');
      if (target && target.title) {
        // Store original title and remove it to hide native tooltip
        if (!target.dataset.originalTitle) {
          target.dataset.originalTitle = target.title;
        }
        target.removeAttribute('title');
      }
    }, true);
    
    container.addEventListener('mouseleave', function(e) {
      if (!e || !e.target) return;
      // Handle text nodes - get the parent element
      let element = e.target;
      if (element.nodeType !== 1) {
        element = element.parentElement;
      }
      if (!element || typeof element.closest !== 'function') return;
      const target = element.closest('[data-original-title]');
      if (target && target.dataset.originalTitle) {
        // Restore original title
        target.title = target.dataset.originalTitle;
      }
    }, true);
    
    // Watch for dynamically added elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.hasAttribute && node.hasAttribute('title') && !node.dataset.tooltip) {
              node.dataset.tooltip = node.title;
            }
            // Check children
            const childrenWithTitle = node.querySelectorAll ? node.querySelectorAll('[title]') : [];
            childrenWithTitle.forEach(el => {
              if (el.title && !el.dataset.tooltip) {
                el.dataset.tooltip = el.title;
              }
            });
          }
        });
      });
    });
    
    observer.observe(container, { childList: true, subtree: true });
  }
  
  // Initialize tooltips when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTooltips();
    });
  } else {
    initTooltips();
  }
  })();