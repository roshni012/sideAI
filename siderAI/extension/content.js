(function() {
  'use strict';
  
  let chatPanel = null;
  let isPanelOpen = false;
  
  function getPanelWidth() {
    if (window.innerWidth <= 768) {
      return window.innerWidth; // Full width on mobile
    } else if (window.innerWidth <= 1024) {
      return 320; // Smaller panel on tablets
    }
    return 380; // Default desktop width
  }
  
  function findAndAdjustContainers() {
    // Common container selectors
    const containerSelectors = [
      'main',
      '[class*="container"]',
      '[class*="wrapper"]',
      '[class*="content"]',
      '[class*="page"]',
      '[id*="container"]',
      '[id*="wrapper"]',
      '[id*="content"]',
      '[id*="main"]'
    ];
    
    const containers = [];
    containerSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          const maxWidth = computedStyle.maxWidth;
          const width = computedStyle.width;
          
          // Only adjust if element has a max-width or fixed width
          if (maxWidth && maxWidth !== 'none' && maxWidth !== '100%') {
            const originalMaxWidth = el.getAttribute('data-sider-original-maxwidth');
            if (!originalMaxWidth) {
              el.setAttribute('data-sider-original-maxwidth', maxWidth);
            }
            containers.push(el);
          } else if (width && width !== 'auto' && width !== '100%' && !width.includes('calc')) {
            const originalWidth = el.getAttribute('data-sider-original-width');
            if (!originalWidth) {
              el.setAttribute('data-sider-original-width', width);
            }
            containers.push(el);
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });
    
    return containers;
  }
  
  function findFixedElements() {
    const fixedElements = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
      // Skip our own elements
      if (el.id === 'sider-ai-chat-panel' || el.id === 'sider-right-spacer') return;
      
      const style = window.getComputedStyle(el);
      const position = style.position;
      
      // Find fixed or sticky positioned elements that span full width
      if (position === 'fixed' || position === 'sticky') {
        const width = style.width;
        const maxWidth = style.maxWidth;
        const left = style.left;
        const right = style.right;
        
        // Check if element spans full viewport width
        const rect = el.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If element is full width or positioned at edges, it needs adjustment
        if (rect.width >= viewportWidth - 10 || 
            (width === '100%' || width === '100vw') ||
            (left === '0px' && (right === '0px' || right === 'auto'))) {
          
          // Store original values if not already stored
          if (!el.hasAttribute('data-sider-original-width')) {
            const originalWidth = width !== 'auto' ? width : '';
            const originalMaxWidth = maxWidth !== 'none' ? maxWidth : '';
            const originalRight = right !== 'auto' ? right : '';
            
            if (originalWidth) el.setAttribute('data-sider-original-width', originalWidth);
            if (originalMaxWidth) el.setAttribute('data-sider-original-maxwidth', originalMaxWidth);
            if (originalRight) el.setAttribute('data-sider-original-right', originalRight);
          }
          
          fixedElements.push(el);
        }
      }
    });
    
    return fixedElements;
  }
  
  function compressWebsite(compress) {
    const html = document.documentElement;
    const body = document.body;
    const panelWidth =
      window.innerWidth <= 768
        ? window.innerWidth
        : window.innerWidth <= 1024
        ? 320
        : 380;
  
    // Expose panel width to CSS
    html.style.setProperty('--sider-panel-width', `${panelWidth}px`);
  
    if (compress) {
      html.classList.add('sider-panel-active');
      body.classList.add('sider-panel-active');
  
      // Apply compression only on desktop/tablet
      if (window.innerWidth > 768) {
        html.style.marginRight = `${panelWidth}px`;
        html.style.transition = 'margin-right 0.3s ease';
        body.style.width = `calc(100vw - ${panelWidth}px)`;
        body.style.transition = 'width 0.3s ease';
        
        // Adjust fixed/sticky elements (headers, navs, etc.)
        const fixedElements = findFixedElements();
        fixedElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const position = style.position;
          
          // Adjust width for fixed/sticky elements
          if (position === 'fixed' || position === 'sticky') {
            // Use calc to reduce width
            if (style.width === '100%' || style.width === '100vw') {
              el.style.width = `calc(100% - ${panelWidth}px)`;
            } else if (style.width && style.width !== 'auto') {
              // If it has a specific width, try to reduce it
              const currentWidth = parseFloat(style.width);
              if (!isNaN(currentWidth) && currentWidth > 400) {
                el.style.maxWidth = `calc(100% - ${panelWidth}px)`;
              }
            } else {
              // Use max-width as fallback
              el.style.maxWidth = `calc(100vw - ${panelWidth}px)`;
            }
            
            el.style.transition = 'width 0.3s ease, max-width 0.3s ease';
          }
        });
      } else {
        // Mobile – full screen panel
        html.style.marginRight = '0';
        body.style.width = '100%';
      }
  
      // Prevent horizontal scroll
      body.style.overflowX = 'hidden';
    } else {
      html.classList.remove('sider-panel-active');
      body.classList.remove('sider-panel-active');
      html.style.removeProperty('margin-right');
      body.style.removeProperty('width');
      body.style.removeProperty('overflow-x');
      html.style.removeProperty('--sider-panel-width');
      
      // Restore fixed/sticky elements to original values
      const fixedElements = document.querySelectorAll('[data-sider-original-width], [data-sider-original-maxwidth], [data-sider-original-right]');
      fixedElements.forEach(el => {
        const originalWidth = el.getAttribute('data-sider-original-width');
        const originalMaxWidth = el.getAttribute('data-sider-original-maxwidth');
        const originalRight = el.getAttribute('data-sider-original-right');
        
        if (originalWidth) {
          el.style.width = originalWidth;
          el.removeAttribute('data-sider-original-width');
        } else {
          el.style.removeProperty('width');
        }
        
        if (originalMaxWidth) {
          el.style.maxWidth = originalMaxWidth;
          el.removeAttribute('data-sider-original-maxwidth');
        } else {
          el.style.removeProperty('max-width');
        }
        
        if (originalRight) {
          el.style.right = originalRight;
          el.removeAttribute('data-sider-original-right');
        }
        
        el.style.removeProperty('transition');
      });
    }
  }
  
  
  function createChatPanel() {
    if (chatPanel) {
      return chatPanel;
    }
    
    const panel = document.createElement('div');
    panel.id = 'sider-ai-chat-panel';
    panel.innerHTML = `
      <div class="sider-panel-container">
        <div class="sider-panel-header">
          <div class="sider-panel-title">
            <span>Sider: Chat with all AI</span>
            <div class="sider-panel-controls">
              <button class="sider-btn-toggle" id="sider-toggle-btn" title="Collapse/Expand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18L15 12L9 6"/>
                </svg>
              </button>
              <button class="sider-btn-close" id="sider-close-btn" title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="sider-panel-body" id="sider-panel-body">
          <div class="sider-welcome">
            <h3>Hi,</h3>
            <p>How can I assist you today?</p>
            
            <div class="sider-action-buttons">
              <button class="sider-action-btn" data-action="fullscreen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M7 8h10M7 12h10M7 16h8"/>
                </svg>
                <span>Full Screen Chat</span>
              </button>
              <button class="sider-action-btn" data-action="research">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
                <span>Deep Research</span>
              </button>
              <button class="sider-action-btn" data-action="highlights">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                <span>My Highlights</span>
              </button>
              <button class="sider-action-btn" data-action="slides">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>AI Slides</span>
              </button>
            </div>
            
          </div>
          
          <div class="sider-chat-container" id="sider-chat-container" style="display: none;">
            <div class="sider-chat-messages" id="sider-chat-messages"></div>
          </div>
        </div>
        
        <div class="sider-panel-footer">
          <div class="sider-input-wrapper">
            <div class="sider-toolbar">
              <button class="sider-toolbar-btn sider-ai-selector-btn" id="sider-ai-selector-btn" title="Select AI Model">
                <div class="sider-ai-selector-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#3b82f6"/>
                    <circle cx="12" cy="12" r="6" fill="#3b82f6"/>
                  </svg>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-dropdown-arrow">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-screenshot-btn" title="Capture Selected Area">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <path d="M6 14h12"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-attach-btn" title="Attach File">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-read-page-btn" title="Read This Page">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  <line x1="8" y1="7" x2="16" y2="7"/>
                  <line x1="8" y1="11" x2="16" y2="11"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-filter-btn" title="Filters">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                <span class="sider-notification-dot"></span>
              </button>
              <button class="sider-toolbar-btn" id="sider-history-btn" title="Chat History">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-new-chat-btn" title="New Chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <div class="sider-ai-dropdown" id="sider-ai-dropdown" style="display: none;">
              <div class="sider-ai-dropdown-section">
                <div class="sider-ai-dropdown-title">Basic</div>
                <div class="sider-ai-option" data-model="chatgpt">
                  <div class="sider-ai-option-icon">🤖</div>
                  <span>GPT-3.5</span>
                </div>
                <div class="sider-ai-option" data-model="gpt4">
                  <div class="sider-ai-option-icon">🧠</div>
                  <span>GPT-4</span>
                </div>
                <div class="sider-ai-option" data-model="gemini">
                  <div class="sider-ai-option-icon">⭐</div>
                  <span>Gemini</span>
                </div>
                <div class="sider-ai-option" data-model="claude">
                  <div class="sider-ai-option-icon">🌟</div>
                  <span>Claude</span>
                </div>
              </div>
            </div>
            <div class="sider-selected-text-section" id="sider-selected-text-section" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 500; color: #6b7280;">Text from your selection</span>
                <button id="sider-remove-selection-btn" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: #9ca3af;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div id="sider-selected-text-display" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 14px; color: #111827; line-height: 1.5; max-height: 120px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; margin-bottom: 12px;"></div>
              <div class="sider-selection-actions" id="sider-selection-actions" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
                <button class="sider-action-btn" data-action="explain" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 500; color: #111827; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                  <span>Explain</span>
                </button>
                <button class="sider-action-btn" data-action="translate" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 500; color: #111827; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; transition: all 0.2s;">
                  <span>Translate</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <button class="sider-action-btn" data-action="summarize" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 500; color: #111827; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                  <span>Summarize</span>
                </button>
                <button class="sider-action-btn" id="sider-more-actions-btn" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 500; color: #111827; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                  <span>...</span>
                </button>
              </div>
              <div style="height: 1px; background: #e5e7eb; margin: 0 -16px 12px;"></div>
            </div>
            <div class="sider-image-preview-section" id="sider-image-preview-section" style="display: none;">
              <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <img id="sider-image-preview-thumb" src="" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; flex-shrink: 0;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="sider-image-action-btn" data-action="extract-text" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                      Extract text
                    </button>
                    <button class="sider-image-action-btn" data-action="math-solver" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                      Math Solver
                    </button>
                    <button class="sider-image-action-btn" data-action="translate-image" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                      <span>Translate</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div style="height: 1px; background: #e5e7eb; margin: 0 -16px 12px;"></div>
            </div>
            <div class="sider-input-area">
              <div class="sider-attachments" id="sider-attachments"></div>
              <textarea 
                id="sider-chat-input" 
                class="sider-chat-input" 
                placeholder="Ask anything, @models, / prompts"
                rows="1"
              ></textarea>
            </div>
            <div class="sider-input-buttons">
              <div style="display: flex; gap: 8px; flex: 1;">
                <button class="sider-bottom-action-btn" data-action="think" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #111827; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="6" x2="12" y2="8"/>
                    <line x1="12" y1="16" x2="12" y2="18"/>
                    <path d="M9 9h6M9 15h6"/>
                  </svg>
                  <span>Think</span>
                </button>
                <button class="sider-bottom-action-btn" data-action="deep-research" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #111827; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>Deep Research</span>
                </button>
              </div>
              <button class="sider-mic-btn" id="sider-mic-btn" title="Voice Input" style="background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: all 0.2s;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button class="sider-send-btn" id="sider-send-btn" title="Send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
          <input type="file" id="sider-file-input" style="display: none;" multiple>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    return panel;
  }
  
  function togglePanel() {
    if (!chatPanel) {
      chatPanel = createChatPanel();
    }
    
    isPanelOpen = !isPanelOpen;
    
    if (isPanelOpen) {
      chatPanel.classList.add('sider-panel-open');
      chatPanel.classList.remove('sider-panel-collapsed');
      chatPanel.style.transform = 'translateX(0)';
      // Compress website when panel opens
      compressWebsite(true);
    } else {
      chatPanel.classList.remove('sider-panel-open');
      chatPanel.classList.remove('sider-panel-collapsed');
      chatPanel.style.transform = 'translateX(100%)';
      // Fully restore website when panel closes
      compressWebsite(false);
      // Small delay to ensure clean restoration
      setTimeout(() => {
        compressWebsite(false);
      }, 100);
    }
    
    chrome.storage.local.set({ siderPanelOpen: isPanelOpen });
  }
  
  function closePanel() {
    if (chatPanel) {
      isPanelOpen = false;
      chatPanel.classList.remove('sider-panel-open');
      chatPanel.classList.remove('sider-panel-collapsed');
      
      // Completely hide the panel (slide it off screen)
      chatPanel.style.transform = 'translateX(100%)';
      
      // Fully restore website when panel closes
      compressWebsite(false);
      
      // Double check to ensure complete restoration after transition
      setTimeout(() => {
        compressWebsite(false);
        // Force layout recalculation
        void document.body.offsetHeight;
      }, 350);
      
      chrome.storage.local.set({ siderPanelOpen: false });
    }
  }
  
  let currentModel = 'chatgpt';
  let isScreenshotMode = false;
  let screenshotOverlay = null;
  let screenshotStartX = 0;
  let screenshotStartY = 0;
  let screenshotSelection = null;
  let fileInput = null;
  let pendingAttachments = [];
  
  function initializePanel() {
    chatPanel = createChatPanel();
    
    const toggleBtn = document.getElementById('sider-toggle-btn');
    const closeBtn = document.getElementById('sider-close-btn');
    const sendBtn = document.getElementById('sider-send-btn');
    const chatInput = document.getElementById('sider-chat-input');
    const aiSelectorBtn = document.getElementById('sider-ai-selector-btn');
    const aiDropdown = document.getElementById('sider-ai-dropdown');
    const screenshotBtn = document.getElementById('sider-screenshot-btn');
    const attachBtn = document.getElementById('sider-attach-btn');
    const readPageBtn = document.getElementById('sider-read-page-btn');
    const newChatBtn = document.getElementById('sider-new-chat-btn');
    const micBtn = document.getElementById('sider-mic-btn');
    fileInput = document.getElementById('sider-file-input');
    const attachmentsContainer = document.getElementById('sider-attachments');
    
    toggleBtn?.addEventListener('click', togglePanel);
    closeBtn?.addEventListener('click', closePanel);
    
    // New Chat button
    newChatBtn?.addEventListener('click', () => {
      createNewChat();
    });
    
    // Bottom action buttons (Think, Deep Research)
    const bottomActionBtns = document.querySelectorAll('.sider-bottom-action-btn');
    bottomActionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const input = document.getElementById('sider-chat-input');
        if (action === 'think' && input) {
          input.value = input.value ? input.value + ' [Think step by step]' : '[Think step by step]';
          autoResize(input);
        } else if (action === 'deep-research') {
          // Trigger deep research functionality
          if (input) {
            input.value = input.value ? input.value + ' [Deep Research]' : '[Deep Research]';
            autoResize(input);
          }
        }
      });
    });
    
    // Microphone button
    micBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      // TODO: Implement voice input
      console.log('Voice input clicked');
    });
    
    sendBtn?.addEventListener('click', () => sendMessage());
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      autoResize(e.target);
    });
    
    chatInput?.addEventListener('input', (e) => {
      autoResize(e.target);
    });
    
    // AI Model Selector - open AI Modules popup
    aiSelectorBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.SiderAIModules) {
        window.SiderAIModules.open();
      }
    });

    // Initialize AI Modules component
    if (window.SiderAIModules) {
      window.SiderAIModules.init(
        // onModelChange callback
        (model) => {
          currentModel = model;
          updateAISelectorIcon(model);
        },
        // onTestResult callback
        (model, text) => {
          addMessage('assistant', `[${model}] ${text}`);
        }
      );
    }

    // Load previously selected model on startup
    chrome.storage.sync.get(['sider_selected_model'], (result) => {
      if (result.sider_selected_model) {
        currentModel = result.sider_selected_model;
        updateAISelectorIcon(currentModel);
      }
    });
    
    // Screenshot capture
    screenshotBtn?.addEventListener('click', () => {
      startScreenshotMode();
    });
    
    // File attachment
    attachBtn?.addEventListener('click', () => {
      fileInput?.click();
    });
    
    fileInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFileAttachments(files);
    });
    
    // Read page
    readPageBtn?.addEventListener('click', () => {
      readCurrentPage();
    });
    
    document.querySelectorAll('.sider-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        handleAction(action);
      });
    });
    
    chrome.storage.local.get(['siderPanelOpen'], (result) => {
      if (result.siderPanelOpen) {
        isPanelOpen = true;
        chatPanel.classList.add('sider-panel-open');
        chatPanel.classList.remove('sider-panel-collapsed');
        chatPanel.style.transform = 'translateX(0)';
        compressWebsite(true);
      } else {
        // Ensure panel is closed if state says it should be
        isPanelOpen = false;
        chatPanel.classList.remove('sider-panel-open');
        chatPanel.classList.remove('sider-panel-collapsed');
        chatPanel.style.transform = 'translateX(100%)';
        compressWebsite(false);
      }
    });
    
    // Handle window resize for responsiveness
    window.addEventListener('resize', () => {
      if (isPanelOpen) {
        requestAnimationFrame(() => compressWebsite(true));
      }
    });
    
    // Handle dynamic content changes (for SPAs) - debounced
    const observer = new MutationObserver(() => {
      if (isPanelOpen) {
        clearTimeout(window.__siderResizeTimeout);
        window.__siderResizeTimeout = setTimeout(() => {
          compressWebsite(true);
        }, 150);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }
  
  function handleAction(action) {
    const chatContainer = document.getElementById('sider-chat-container');
    const welcome = document.querySelector('.sider-welcome');
    
    switch(action) {
      case 'fullscreen':
        chatContainer.style.display = 'flex';
        welcome.style.display = 'none';
        break;
      default:
        console.log('Action:', action);
    }
  }
  
  function updateAISelectorIcon(model) {
    const icons = {
      chatgpt: '🤖',
      gpt4: '🧠',
      gemini: '⭐',
      claude: '🌟',
      groq: '⚡'
    };
    const btn = document.getElementById('sider-ai-selector-btn');
    if (btn) {
      const iconDiv = btn.querySelector('.sider-ai-selector-icon');
      if (iconDiv) {
        iconDiv.textContent = icons[model] || '🤖';
      }
    }
  }
  
  function startScreenshotMode() {
    if (isScreenshotMode) {
      stopScreenshotMode();
      return;
    }
    
    isScreenshotMode = true;
    document.body.style.cursor = 'crosshair';
    
    // Create overlay
    screenshotOverlay = document.createElement('div');
    screenshotOverlay.id = 'sider-screenshot-overlay';
    screenshotOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483646;
      cursor: crosshair;
    `;
    document.body.appendChild(screenshotOverlay);
    
    // Create selection rectangle
    screenshotSelection = document.createElement('div');
    screenshotSelection.style.cssText = `
      position: fixed;
      border: 2px dashed #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(screenshotSelection);
    
    screenshotOverlay.addEventListener('mousedown', handleScreenshotMouseDown);
    screenshotOverlay.addEventListener('mousemove', handleScreenshotMouseMove);
    screenshotOverlay.addEventListener('mouseup', handleScreenshotMouseUp);
    
    // Add cancel instruction
    const instruction = document.createElement('div');
    instruction.textContent = 'Select area to capture (Press ESC to cancel)';
    instruction.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      z-index: 2147483647;
      font-size: 14px;
    `;
    screenshotOverlay.appendChild(instruction);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isScreenshotMode) {
        stopScreenshotMode();
      }
    });
  }
  
  function handleScreenshotMouseDown(e) {
    screenshotStartX = e.clientX;
    screenshotStartY = e.clientY;
    screenshotSelection.style.left = `${screenshotStartX}px`;
    screenshotSelection.style.top = `${screenshotStartY}px`;
    screenshotSelection.style.width = '0px';
    screenshotSelection.style.height = '0px';
    screenshotSelection.style.display = 'block';
  }
  
  function handleScreenshotMouseMove(e) {
    if (!screenshotSelection || screenshotSelection.style.display === 'none') return;
    
    const width = Math.abs(e.clientX - screenshotStartX);
    const height = Math.abs(e.clientY - screenshotStartY);
    const left = Math.min(e.clientX, screenshotStartX);
    const top = Math.min(e.clientY, screenshotStartY);
    
    screenshotSelection.style.left = `${left}px`;
    screenshotSelection.style.top = `${top}px`;
    screenshotSelection.style.width = `${width}px`;
    screenshotSelection.style.height = `${height}px`;
  }
  
  function handleScreenshotMouseUp(e) {
    if (!screenshotSelection || screenshotSelection.style.display === 'none') return;
    
    const width = Math.abs(e.clientX - screenshotStartX);
    const height = Math.abs(e.clientY - screenshotStartY);
    
    const left = Math.min(e.clientX, screenshotStartX);
    const top = Math.min(e.clientY, screenshotStartY);
    
    // Hide overlay BEFORE capturing to avoid overlay tint/border in the image
    stopScreenshotMode();
    
    if (width > 10 && height > 10) {
      // Wait a frame so the overlay is removed from the compositor, then capture
      requestAnimationFrame(() => {
        setTimeout(() => {
          captureScreenshotArea(left, top, width, height);
        }, 10);
      });
    }
  }
  
  function stopScreenshotMode() {
    isScreenshotMode = false;
    document.body.style.cursor = '';
    if (screenshotOverlay) {
      screenshotOverlay.remove();
      screenshotOverlay = null;
    }
    if (screenshotSelection) {
      screenshotSelection.remove();
      screenshotSelection = null;
    }
  }
  
  async function captureScreenshotArea(x, y, width, height) {
    try {
      // Request screenshot from background script
      chrome.runtime.sendMessage({
        type: 'CAPTURE_SCREENSHOT',
        bounds: { x, y, width, height }
      }, (response) => {
        if (response && response.dataUrl) {
          // Crop the captured full screenshot to the selected rectangle
          const dpr = window.devicePixelRatio || 1;
          const crop = { sx: Math.round(x * dpr), sy: Math.round(y * dpr), sw: Math.round(width * dpr), sh: Math.round(height * dpr) };
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = crop.sw;
            canvas.height = crop.sh;
            const ctx = canvas.getContext('2d');
            try {
              ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.sw, crop.sh);
              const croppedUrl = canvas.toDataURL('image/png');
              const attachment = {
                type: 'image',
                name: `screenshot-${Date.now()}.png`,
                dataUrl: croppedUrl,
                width: Math.round(width),
                height: Math.round(height)
              };
              pendingAttachments.push(attachment);
              renderAttachments();
            } catch (e) {
              // Fallback: attach full image if cropping fails
              pendingAttachments.push({ type: 'image', name: `screenshot-${Date.now()}.png`, dataUrl: response.dataUrl, width: image.width, height: image.height });
              renderAttachments();
            }
          };
          image.src = response.dataUrl;
        }
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      // Fallback: use html2canvas if available
      alert('Screenshot captured. Note: Full screenshot feature requires additional permissions.');
    }
  }

  function renderAttachments() {
    const container = document.getElementById('sider-attachments');
    if (!container) return;
    container.innerHTML = '';
    pendingAttachments.forEach((att, idx) => {
      if (att.type === 'image') {
        const chip = document.createElement('div');
        chip.className = 'sider-attachment-chip';
        chip.innerHTML = `
          <img class="sider-attachment-thumb" src="${att.dataUrl}" alt="attachment" />
          <div style="display:flex;flex-direction:column;gap:2px;">
            <span style="font-size:12px;color:#374151;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${att.name}</span>
            <span style="font-size:11px;color:#6b7280;">${att.width}×${att.height}</span>
          </div>
          <button class="sider-attachment-remove" title="Remove">✕</button>
        `;
        chip.querySelector('.sider-attachment-remove').addEventListener('click', () => {
          pendingAttachments.splice(idx, 1);
          renderAttachments();
        });
        container.appendChild(chip);
      }
    });
    updateInputPaddingForAttachments();
  }

  function updateInputPaddingForAttachments() {
    const input = document.getElementById('sider-chat-input');
    const container = document.getElementById('sider-attachments');
    if (!input || !container) return;
    // Compute needed top padding so the chips sit "inside" the input area
    const basePadding = 12; // matches CSS
    const needed = container.childElementCount > 0 ? container.clientHeight + basePadding : basePadding;
    input.style.paddingTop = `${needed}px`;
  }
  
  function handleFileAttachments(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const attachment = {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          size: file.size,
          dataUrl
        };
        pendingAttachments.push(attachment);
        renderAttachments();
      };
      reader.readAsDataURL(file);
    });
  }
  
  async function readCurrentPage() {
    const pageContent = {
      title: document.title,
      url: window.location.href,
      text: document.body.innerText.substring(0, 5000) // Limit to 5000 chars
    };
    
    const input = document.getElementById('sider-chat-input');
    if (input) {
      const pageText = `📖 Read this page: ${pageContent.title}\nURL: ${pageContent.url}\n\n${pageContent.text.substring(0, 500)}...`;
      input.value = pageText + (input.value ? '\n\n' + input.value : '');
      autoResize(input);
    }
    
    addMessage('user', `📖 Reading page: ${pageContent.title}`);
    
    // Auto-send a summary request
    const summaryPrompt = `Please summarize this page: ${pageContent.title}\n\nContent preview: ${pageContent.text.substring(0, 1000)}`;
    setTimeout(() => {
      const input = document.getElementById('sider-chat-input');
      if (input) {
        input.value = summaryPrompt;
        sendMessage();
      }
    }, 500);
  }
  
  async function sendMessage() {
    const input = document.getElementById('sider-chat-input');
    const messagesContainer = document.getElementById('sider-chat-messages');
    const chatContainer = document.getElementById('sider-chat-container');
    const welcome = document.querySelector('.sider-welcome');
    
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    const model = currentModel;
    
    input.value = '';
    autoResize(input);
    
    if (chatContainer) {
      chatContainer.style.display = 'flex';
    }
    if (welcome) {
      welcome.style.display = 'none';
    }
    
    // Append a textual hint if there are attachments
    if (pendingAttachments.length > 0) {
      const attachedHint = pendingAttachments
        .map(att => att.type === 'image' ? `📎 [image] ${att.name}` : `📎 ${att.name}`)
        .join('\n');
      addMessage('user', `${attachedHint}\n\n${message}`);
      // Clear previews after sending
      pendingAttachments = [];
      renderAttachments();
      // Reset padding after clearing
      updateInputPaddingForAttachments();
    } else {
      addMessage('user', message);
    }
    const thinkingMsg = addMessage('assistant', 'Thinking...', true);
    
    try {
      chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        message: message,
        model: model
      }, (response) => {
        if (response && response.error) {
          updateMessage(thinkingMsg, 'assistant', `Error: ${response.error}`);
        } else if (response && response.text) {
          updateMessage(thinkingMsg, 'assistant', response.text);
        } else {
          updateMessage(thinkingMsg, 'assistant', 'No response received');
        }
      });
    } catch (error) {
      updateMessage(thinkingMsg, 'assistant', `Error: ${error.message}`);
    }
  }
  
  function createNewChat() {
    // Clear all chat messages
    const messagesContainer = document.getElementById('sider-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    // Clear input field
    const chatInput = document.getElementById('sider-chat-input');
    if (chatInput) {
      chatInput.value = '';
      autoResize(chatInput);
    }
    
    // Hide preview sections
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    if (imagePreviewSection) {
      imagePreviewSection.style.display = 'none';
    }
    
    // Reset chat container and show welcome screen
    const chatContainer = document.getElementById('sider-chat-container');
    const welcome = document.querySelector('.sider-welcome');
    
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
    if (welcome) {
      welcome.style.display = 'block';
    }
    
    // Close AI dropdown if open
    const aiDropdown = document.getElementById('sider-ai-dropdown');
    if (aiDropdown) {
      aiDropdown.style.display = 'none';
    }
    
    // Reset file input
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Scroll to top
    if (messagesContainer) {
      messagesContainer.scrollTop = 0;
    }
  }
  
  function addMessage(role, text, isThinking = false) {
    const messagesContainer = document.getElementById('sider-chat-messages');
    if (!messagesContainer) return null;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `sider-message sider-message-${role}`;
    
    if (isThinking) {
      messageDiv.classList.add('sider-thinking');
    }
    
    messageDiv.innerHTML = `
      <div class="sider-message-avatar">
        ${role === 'user' ? '👤' : '🤖'}
      </div>
      <div class="sider-message-content">
        <div class="sider-message-text">${text}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
  }
  
  function updateMessage(messageDiv, role, text) {
    if (!messageDiv) return;
    
    messageDiv.classList.remove('sider-thinking');
    const textElement = messageDiv.querySelector('.sider-message-text');
    if (textElement) {
      textElement.textContent = text;
    }
    
    const messagesContainer = document.getElementById('sider-chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.type === 'TOGGLE_PANEL') {
        togglePanel();
        if (sendResponse) {
          sendResponse({ success: true, isOpen: isPanelOpen });
        }
        return true;
      } else if (request.type === 'CLOSE_PANEL') {
        closePanel();
        if (sendResponse) {
          sendResponse({ success: true, isOpen: false });
        }
        return true;
      } else if (request.type === 'GET_PANEL_STATE') {
        if (sendResponse) {
          sendResponse({ isOpen: isPanelOpen });
        }
        return true;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      if (sendResponse) {
        sendResponse({ error: error.message });
      }
    }
    return true;
  });
  
  // Text Selection Toolbar
  let selectionToolbar = null;
  let selectedText = '';
  
  function createSelectionToolbar() {
    if (selectionToolbar) {
      return selectionToolbar;
    }
    
    const toolbar = document.createElement('div');
    toolbar.id = 'sider-selection-toolbar';
    toolbar.innerHTML = `
      <button class="sider-selection-btn" id="sider-ai-analyze-btn" title="Ask AI about this text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="url(#brain-gradient)"/>
          <circle cx="12" cy="12" r="6" fill="url(#brain-gradient)"/>
          <defs>
            <linearGradient id="brain-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#9333ea;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-copy-btn" title="Copy">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-highlight-btn" title="Highlight">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="#fbbf24" stroke="#f59e0b"/>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-notes-btn" title="Add to Notes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="16" y2="11"/>
          <line x1="8" y1="15" x2="12" y2="15"/>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-more-btn" title="More options">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-close-selection-btn" title="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    
    document.body.appendChild(toolbar);
    return toolbar;
  }
  
  function showSelectionToolbar() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      hideSelectionToolbar();
      return;
    }
    
    selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      hideSelectionToolbar();
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (!selectionToolbar) {
      selectionToolbar = createSelectionToolbar();
    }
    
    // Position toolbar above selection
    const toolbar = selectionToolbar;
    const toolbarHeight = 40;
    const toolbarPadding = 8;
    
    let top = rect.top - toolbarHeight - toolbarPadding;
    let left = rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2);
    
    // Keep toolbar within viewport
    if (top < 10) {
      top = rect.bottom + toolbarPadding;
    }
    if (left < 10) {
      left = 10;
    }
    if (left + toolbar.offsetWidth > window.innerWidth - 10) {
      left = window.innerWidth - toolbar.offsetWidth - 10;
    }
    
    toolbar.style.top = `${top + window.scrollY}px`;
    toolbar.style.left = `${left + window.scrollX}px`;
    toolbar.style.display = 'flex';
  }
  
  function hideSelectionToolbar() {
    if (selectionToolbar) {
      selectionToolbar.style.display = 'none';
    }
    selectedText = '';
  }
  
  function initializeSelectionToolbar() {
    selectionToolbar = createSelectionToolbar();
    
    // AI Analyze button
    document.getElementById('sider-ai-analyze-btn')?.addEventListener('click', () => {
      if (selectedText) {
        analyzeTextWithAI(selectedText);
        hideSelectionToolbar();
        window.getSelection().removeAllRanges();
      }
    });
    
    // Copy button
    document.getElementById('sider-copy-btn')?.addEventListener('click', () => {
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
          showCopyFeedback();
        });
        hideSelectionToolbar();
        window.getSelection().removeAllRanges();
      }
    });
    
    // Highlight button
    document.getElementById('sider-highlight-btn')?.addEventListener('click', () => {
      if (selectedText) {
        highlightSelectedText();
        hideSelectionToolbar();
      }
    });
    
    // Notes button
    document.getElementById('sider-notes-btn')?.addEventListener('click', () => {
      if (selectedText) {
        addToNotes(selectedText);
        hideSelectionToolbar();
        window.getSelection().removeAllRanges();
      }
    });
    
    // More options button
    document.getElementById('sider-more-btn')?.addEventListener('click', () => {
      showMoreOptions();
    });
    
    // Close button
    document.getElementById('sider-close-selection-btn')?.addEventListener('click', () => {
      hideSelectionToolbar();
      window.getSelection().removeAllRanges();
    });
    
    // Show toolbar on text selection
    document.addEventListener('mouseup', showSelectionToolbar);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        hideSelectionToolbar();
      } else {
        showSelectionToolbar();
      }
    });
    
    // Hide toolbar on click outside
    document.addEventListener('mousedown', (e) => {
      if (selectionToolbar && !selectionToolbar.contains(e.target)) {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          hideSelectionToolbar();
        }
      }
    });
  }
  
  function analyzeTextWithAI(text) {
    // Open chat panel if closed
    if (!isPanelOpen) {
      togglePanel();
    }
    
    // Set the input with the selected text
    const input = document.getElementById('sider-chat-input');
    if (input) {
      const prompt = `Analyze this text: "${text}"\n\nWhat does this mean? Provide insights and context.`;
      input.value = prompt;
      autoResize(input);
      
      // Auto-send after a short delay
      setTimeout(() => {
        sendMessage();
      }, 300);
    }
  }
  
  function showCopyFeedback() {
    const feedback = document.createElement('div');
    feedback.textContent = '✓ Copied!';
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.3s';
      setTimeout(() => feedback.remove(), 300);
    }, 1500);
  }
  
  function highlightSelectedText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.cssText = 'background-color: #fef08a; padding: 2px 0;';
    span.className = 'sider-highlight';
    
    try {
      range.surroundContents(span);
      hideSelectionToolbar();
      selection.removeAllRanges();
    } catch (e) {
      // If surroundContents fails, create a highlight differently
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      hideSelectionToolbar();
      selection.removeAllRanges();
    }
  }
  
  function addToNotes(text) {
    // Store note in chrome storage
    chrome.storage.local.get(['sider_notes'], (result) => {
      const notes = result.sider_notes || [];
      notes.push({
        text: text,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
      
      chrome.storage.local.set({ sider_notes: notes }, () => {
        showCopyFeedback();
        setTimeout(() => {
          const feedback = document.querySelector('.sider-copy-feedback');
          if (feedback) {
            feedback.textContent = '✓ Added to Notes!';
          }
        }, 0);
      });
    });
  }
  
  // Listen for analyze requests from toolbar component
  window.addEventListener('sider:analyze-text', (e) => {
    const text = e.detail?.text || '';
    if (text) analyzeTextWithAI(text);
  });

  // Optional: add-note request from toolbar
  window.addEventListener('sider:add-note', (e) => {
    const text = e.detail?.text || '';
    if (text) addToNotes(text);
  });

  // Handle prompt requests from toolbar (explain, translate, etc.)
  window.addEventListener('sider:prompt-text', (e) => {
    const { text, prompt } = e.detail || {};
    if (!text) return;
    
    // Open chat panel if closed
    if (!isPanelOpen) {
      togglePanel();
    }
    
    // Set the input with the prompt and selected text
    const input = document.getElementById('sider-chat-input');
    if (input) {
      input.value = `${prompt}: "${text}"`;
      autoResize(input);
      setTimeout(() => sendMessage(), 200);
    }
  });

  // Handle text selection to show in input box
  function updateSelectedTextInInput(text) {
    if (!text || text.trim().length === 0) {
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      if (selectedTextSection) {
        selectedTextSection.style.display = 'none';
      }
      return;
    }
    
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const selectedTextDisplay = document.getElementById('sider-selected-text-display');
    const removeSelectionBtn = document.getElementById('sider-remove-selection-btn');
    const input = document.getElementById('sider-chat-input');
    const actionButtons = document.querySelectorAll('.sider-action-btn');
    const moreActionsBtn = document.getElementById('sider-more-actions-btn');
    
    if (selectedTextSection && selectedTextDisplay && input) {
      selectedTextDisplay.textContent = text;
      selectedTextSection.style.display = 'block';
      
      // Don't populate input with selected text - keep it empty
      // input.value = text;
      // autoResize(input);
      
      // Remove selection handler
      if (removeSelectionBtn) {
        removeSelectionBtn.onclick = () => {
          selectedTextSection.style.display = 'none';
          input.value = '';
          autoResize(input);
        };
      }
      
      // Attach action button handlers
      actionButtons.forEach(btn => {
        if (btn.id !== 'sider-more-actions-btn') {
          btn.onclick = (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            if (action && text) {
              handleSelectionAction(action, text);
            }
          };
        }
      });
      
      // More actions button
      if (moreActionsBtn) {
        moreActionsBtn.onclick = (e) => {
          e.stopPropagation();
          showMoreSelectionActions(text);
        };
      }
    }
  }

  function handleSelectionAction(action, text) {
    if (!text) return;
    
    const input = document.getElementById('sider-chat-input');
    
    switch (action) {
      case 'explain':
        if (input) {
          input.value = `Explain this text: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'translate':
        if (input) {
          input.value = `Translate to English: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'summarize':
        if (input) {
          input.value = `Summarize this text: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(text).then(() => {
          showCopyFeedback();
        });
        break;
      case 'highlight':
        // Dispatch event for toolbar to handle highlighting
        window.dispatchEvent(new CustomEvent('sider:highlight-text', { detail: { text } }));
        break;
      case 'readaloud':
        try {
          const utter = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch (_) {}
        break;
      case 'answer':
        if (input) {
          input.value = `Answer this question: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'explaincodes':
        if (input) {
          input.value = `Explain the code: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
        break;
      default:
        if (input) {
          input.value = `${action}: "${text}"`;
          autoResize(input);
          setTimeout(() => sendMessage(), 200);
        }
    }
  }

  function showMoreSelectionActions(text) {
    // This would show a dropdown/menu with more actions like the toolbar menu
    // For now, we can dispatch the same events as the toolbar does
    const menu = document.createElement('div');
    menu.className = 'sider-more-actions-menu';
    menu.style.cssText = `
      position: fixed;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 8px;
      z-index: 2147483647;
      min-width: 180px;
    `;
    
    const actions = [
      { label: 'Copy', action: 'copy' },
      { label: 'Highlight', action: 'highlight' },
      { label: 'Read aloud', action: 'readaloud' },
      { label: 'Answer this question', action: 'answer' },
      { label: 'Explain codes', action: 'explaincodes' }
    ];
    
    actions.forEach(item => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #111827;
        border-radius: 6px;
      `;
      btn.textContent = item.label;
      btn.onmouseover = () => btn.style.background = '#f3f4f6';
      btn.onmouseout = () => btn.style.background = 'transparent';
      btn.onclick = () => {
        handleSelectionAction(item.action, text);
        document.body.removeChild(menu);
      };
      menu.appendChild(btn);
    });
    
    const moreBtn = document.getElementById('sider-more-actions-btn');
    if (moreBtn) {
      const rect = moreBtn.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.left = `${rect.left}px`;
      document.body.appendChild(menu);
      
      const removeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== moreBtn) {
          if (menu.parentNode) {
            document.body.removeChild(menu);
          }
          document.removeEventListener('click', removeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', removeMenu), 0);
    }
  }

  // Listen for text selection events
  window.addEventListener('sider:text-selected', (e) => {
    const text = e.detail?.text || '';
    if (text) {
      updateSelectedTextInInput(text);
    }
  });

  // Listen for text cleared events (when clicking outside)
  window.addEventListener('sider:text-cleared', () => {
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const input = document.getElementById('sider-chat-input');
    
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    if (imagePreviewSection) {
      imagePreviewSection.style.display = 'none';
    }
    if (input) {
      input.value = '';
      autoResize(input);
    }
  });

  // Listen for image preview events
  window.addEventListener('sider:chat-image', (e) => {
    const { src, alt, element } = e.detail || {};
    if (!src) return;
    
    // Open chat panel if closed
    if (!isPanelOpen) {
      togglePanel();
    }
    
    // Show image preview section
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const imageThumb = document.getElementById('sider-image-preview-thumb');
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const input = document.getElementById('sider-chat-input');
    
    // Hide selected text section if visible
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    
    // Show image preview section
    if (imagePreviewSection && imageThumb) {
      imageThumb.src = src;
      imageThumb.alt = alt || 'Image';
      imagePreviewSection.style.display = 'block';
      
      // Clear input but keep placeholder visible
      if (input) {
        input.value = '';
        input.placeholder = 'Ask anything, @models, / prompts';
        autoResize(input);
      }
      
      // Attach event listeners to image action buttons
      const imageActionBtns = imagePreviewSection.querySelectorAll('.sider-image-action-btn');
      imageActionBtns.forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          handleImageAction(action, src, alt);
        };
      });
    }
    
    console.log('Chat with image:', src);
  });
  
  function handleImageAction(action, src, alt) {
    const input = document.getElementById('sider-chat-input');
    if (!input) return;
    
    switch (action) {
      case 'extract-text':
        input.value = 'Extract all text from this image';
        break;
      case 'math-solver':
        input.value = 'Solve the math problems in this image';
        break;
      case 'translate-image':
        input.value = 'Translate all text in this image to English';
        break;
    }
    autoResize(input);
    input.focus();
  }

  window.addEventListener('sider:extract-text', (e) => {
    const { src, alt, element } = e.detail || {};
    if (!src) return;
    
    // Open chat panel if closed
    if (!isPanelOpen) {
      togglePanel();
    }
    
    // Show image preview section
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const imageThumb = document.getElementById('sider-image-preview-thumb');
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const input = document.getElementById('sider-chat-input');
    
    // Hide selected text section if visible
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    
    // Show image preview section
    if (imagePreviewSection && imageThumb) {
      imageThumb.src = src;
      imageThumb.alt = alt || 'Image';
      imagePreviewSection.style.display = 'block';
    }
    
    // Set input with extract text prompt
    if (input) {
      input.value = 'Extract all text from this image';
      input.placeholder = 'Ask anything, @models, / prompts';
      autoResize(input);
    }
    
    console.log('Extract text from image:', src);
    // TODO: Implement OCR/image text extraction
  });

  window.addEventListener('sider:save-wisebase', (e) => {
    const { src, alt } = e.detail || {};
    if (!src) return;
    
    console.log('Save to Wisebase:', src, alt);
    // TODO: Implement Wisebase save functionality
    alert('Save to Wisebase feature coming soon!');
  });

  window.addEventListener('sider:image-tool', (e) => {
    const { tool, src, alt, element } = e.detail || {};
    if (!tool || !src) return;
    
    // Open chat panel if closed
    if (!isPanelOpen) {
      togglePanel();
    }
    
    // Show image preview section
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const imageThumb = document.getElementById('sider-image-preview-thumb');
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    
    // Hide selected text section if visible
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    
    // Show image preview section
    if (imagePreviewSection && imageThumb) {
      imageThumb.src = src;
      imageThumb.alt = alt || 'Image';
      imagePreviewSection.style.display = 'block';
    }
    
    const toolLabels = {
      'bg-remover': 'Remove background from this image',
      'text-remover': 'Remove text from this image',
      'inpaint': 'Inpaint this image',
      'photo-eraser': 'Erase unwanted parts from this image',
      'bg-changer': 'Change background of this image',
      'upscaler': 'Upscale this image',
      'variations': 'Create variations of this image'
    };
    
    const input = document.getElementById('sider-chat-input');
    if (input) {
      input.value = toolLabels[tool] || `Apply ${tool} to this image`;
      input.placeholder = 'Ask anything, @models, / prompts';
      autoResize(input);
    }
    
    console.log('Image tool:', tool, src);
    // TODO: Implement image tool functionality
  });

  // Initialize core panel only; toolbar handled by toolbar.js, image preview by image-preview.js
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializePanel();
      try { window.SiderToolbar?.init(); } catch (_) {}
      try { window.SiderImagePreview?.init(); } catch (_) {}
    });
  } else {
    initializePanel();
    try { window.SiderToolbar?.init(); } catch (_) {}
    try { window.SiderImagePreview?.init(); } catch (_) {}
  }
})();

