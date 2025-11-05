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
        <div class="sider-panel-main">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="7" y1="8" x2="17" y2="8"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="7" y1="16" x2="15" y2="16"/>
                </svg>
                <span>Full Screen Chat</span>
              </button>
              <button class="sider-action-btn" data-action="research">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <span>Deep Research</span>
              </button>
              <button class="sider-action-btn" data-action="highlights">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="18"/>
                  <path d="M9 6h6M9 10h6M9 14h4"/>
                  <path d="M19 6h2v2h-2z"/>
                </svg>
                <span>My Highlights</span>
              </button>
              <button class="sider-action-btn" data-action="slides">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                  <rect x="6" y="6" width="12" height="6" rx="1"/>
                  <line x1="6" y1="9" x2="18" y2="9"/>
                </svg>
                <span>AI Slides</span>
              </button>
            </div>
            
            
            
          </div>
          
          <div class="sider-chat-container" id="sider-chat-container" style="display: none;">
            <div class="sider-chat-messages" id="sider-chat-messages"></div>
          </div>
        </div>
        
        <div class="sider-summarize-card" id="sider-summarize-card" style="display: none;">
              <button class="sider-summarize-close-btn" id="sider-summarize-close-btn" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div class="sider-summarize-card-left">
                <div class="sider-summarize-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#8b5cf6"/>
                    <line x1="2" y1="12" x2="22" y2="12" stroke="#ffffff" stroke-width="2"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="#ffffff" opacity="0.3"/>
                  </svg>
                </div>
                <span class="sider-summarize-site-name" id="sider-summarize-site-name"></span>
              </div>
              <div class="sider-summarize-card-right">
                <button class="sider-summarize-btn" id="sider-summarize-btn" data-action="summarize">
                  Summarize
                </button>
                <button class="sider-summarize-copy-btn" id="sider-summarize-copy-btn" title="Copy URL">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
        <div class="sider-panel-footer">
          <div class="sider-input-wrapper">
            <div class="sider-toolbar">
              <button class="sider-toolbar-btn sider-ai-selector-btn" id="sider-ai-selector-btn" title="Select AI Model">
                <div class="sider-ai-selector-icon">
                  <img src="${chrome.runtime.getURL('icons/fusion.png')}" alt="AI Model" style="width: 18px; height: 18px; object-fit: contain; display: block;" />
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-dropdown-arrow">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button class="sider-toolbar-btn" id="sider-screenshot-btn" title="Capture Selected Area">
                <img src="${chrome.runtime.getURL('icons/cut.png')}" alt="Cut" style="width: 18px; height: 18px; object-fit: contain;" />
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
            <div class="sider-input-area">
              <div class="sider-image-preview-section" id="sider-image-preview-section" style="display: none;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 8px; width: 100%;">
                  <div style="position: relative; flex-shrink: 0;">
                    <img id="sider-image-preview-thumb" src="" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;">
                    <button id="sider-image-preview-close" class="sider-image-preview-close-btn" title="Remove image" style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; color: #6b7280; transition: all 0.2s; z-index: 10;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div style="display: flex; flex-direction: row; gap: 8px; align-items: flex-start; flex-wrap: wrap;">
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
              <div class="sider-selected-text-section" id="sider-selected-text-section" style="display: none;">
                <div class="sider-selected-text-header">
                  <span class="sider-selected-text-title">Text from your selection</span>
                  <button id="sider-remove-selection-btn" class="sider-remove-selection-btn" title="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div id="sider-selected-text-display" class="sider-selected-text-display"></div>
                <div class="sider-selection-actions" id="sider-selection-actions">
                  <button class="sider-action-btn" data-action="explain">
                    <span>Explain</span>
                  </button>
                  <button class="sider-action-btn" data-action="translate">
                    <span>Translate</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <button class="sider-action-btn" data-action="summarize">
                    <span>Summarize</span>
                  </button>
                  <button class="sider-action-btn" id="sider-more-actions-btn">
                    <span>...</span>
                  </button>
                </div>
                <div class="sider-selection-divider"></div>
              </div>
              <div class="sider-attachments" id="sider-attachments"></div>
              <textarea 
                id="sider-chat-input" 
                class="sider-chat-input" 
                placeholder="Ask anything, @models, / prompts"
                rows="1"
              ></textarea>
              <div class="sider-input-buttons">
                <div class="sider-input-buttons-left">
                  <button class="sider-bottom-action-btn" data-action="think">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="6" x2="12" y2="8"/>
                      <line x1="12" y1="16" x2="12" y2="18"/>
                      <path d="M9 9h6M9 15h6"/>
                    </svg>
                    <span>Think</span>
                  </button>
                  <button class="sider-bottom-action-btn" data-action="deep-research">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <span>Deep Research</span>
                  </button>
                </div>
                <button class="sider-mic-btn" id="sider-mic-btn" title="Voice Input" style="display: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
                <button class="sider-send-btn" id="sider-send-btn" title="Send" style="display: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <input type="file" id="sider-file-input" style="display: none;" multiple>
        </div>
        </div>
        <div class="sider-panel-sidebar">
          <div class="sider-sidebar-icon" title="Code/Format">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon sider-sidebar-icon-purple" title="Chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Documents">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span class="sider-sidebar-badge">0</span>
          </div>
          <div class="sider-sidebar-icon" title="Refresh/Redo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="More Options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Link/Connect">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Send/Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Layers/List">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Mobile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon" title="Target">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div class="sider-sidebar-icon sider-sidebar-icon-active" id="sider-profile-icon" title="Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
        <div class="sider-profile-dropdown" id="sider-profile-dropdown" style="display: none;">
          <div class="sider-profile-dropdown-header">
            <div class="sider-profile-dropdown-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="sider-profile-dropdown-text">
              <span>Log in to start using Sider.</span>
            </div>
            <button class="sider-profile-login-btn" id="sider-profile-login-btn">Log in</button>
          </div>
          <div class="sider-profile-dropdown-divider"></div>
          <div class="sider-profile-dropdown-menu">
            <div class="sider-profile-menu-item" data-action="whats-new">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9s3-2 3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <path d="M2 8a6 6 0 0 1 10.33-4.5"/>
              </svg>
              <span>What's new</span>
            </div>
            <div class="sider-profile-menu-item" data-action="rewards">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              <span>Rewards center</span>
            </div>
            <div class="sider-profile-menu-item" data-action="help">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Help center</span>
            </div>
            <div class="sider-profile-menu-item" data-action="feedback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Feedback</span>
            </div>
          </div>
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
      
      // Show summarize card when panel opens
      setTimeout(() => {
        checkAndShowSummarizeCard();
      }, 300);
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
  
  function checkAndShowSummarizeCard() {
    // Get current page information
    const pageUrl = window.location.href;
    const pageTitle = document.title || new URL(pageUrl).hostname;
    
    // Show summarize card with page info
    const summarizeCard = document.getElementById('sider-summarize-card');
    const siteNameSpan = document.getElementById('sider-summarize-site-name');
    
    if (summarizeCard && siteNameSpan) {
      // Extract site name from URL or title
      let siteName = pageTitle;
      try {
        const url = new URL(pageUrl);
        siteName = url.hostname.replace('www.', '');
        // Take first part of hostname (e.g., "webbybutter" from "webbybutter.com")
        const parts = siteName.split('.');
        if (parts.length > 1) {
          siteName = parts[0];
        }
        // Capitalize first letter
        siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        
        // If title is shorter and more descriptive, use it
        if (pageTitle && pageTitle.length < 50 && pageTitle.length > siteName.length) {
          siteName = pageTitle.substring(0, 40);
          if (pageTitle.length > 40) {
            siteName += '...';
          }
        }
      } catch (e) {
        // Use title as fallback
        siteName = pageTitle.substring(0, 40);
        if (pageTitle.length > 40) {
          siteName += '...';
        }
      }
      
      siteNameSpan.textContent = siteName;
      summarizeCard.style.display = 'flex';
    }
  }
  
  function handleSummarizeClick() {
    const chatContainer = document.getElementById('sider-chat-container');
    const welcome = document.querySelector('.sider-welcome');
    const messagesContainer = document.getElementById('sider-chat-messages');
    const summarizeCard = document.getElementById('sider-summarize-card');
    
    if (!chatContainer || !messagesContainer) return;
    
    // Show chat container, hide welcome and summarize card
    chatContainer.style.display = 'flex';
    if (welcome) {
      welcome.style.display = 'none';
    }
    if (summarizeCard) {
      summarizeCard.style.display = 'none';
    }
    
    // Get page information
    const pageTitle = document.title || 'Page';
    const pageUrl = window.location.href;
    const pageText = document.body.innerText.substring(0, 3000) || '';
    
    // Create summarize message using URL
    const summarizePrompt = `Summarize this page: ${pageTitle}\n\nURL: ${pageUrl}${pageText ? `\n\nContent preview: ${pageText.substring(0, 2000)}${pageText.length > 2000 ? '...' : ''}` : ''}`;
    
    // Add user message
    addMessage('user', `📄 Summarize: ${pageTitle}`);
    
    // Add thinking message
    const thinkingMsg = addMessage('assistant', 'Thinking...', true);
    
    // Send to background for AI processing
    try {
      chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        message: summarizePrompt,
        model: currentModel || 'chatgpt'
      }, (response) => {
        if (response && response.error) {
          updateMessage(thinkingMsg, 'assistant', `Error: ${response.error}`);
        } else if (response && response.text) {
          updateMessage(thinkingMsg, 'assistant', response.text);
        } else {
          updateMessage(thinkingMsg, 'assistant', 'Unable to generate summary. Please try again.');
        }
      });
    } catch (error) {
      updateMessage(thinkingMsg, 'assistant', `Error: ${error.message}`);
    }
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
  
  function toggleProfileDropdown() {
    const profileDropdown = document.getElementById('sider-profile-dropdown');
    const profileIcon = document.getElementById('sider-profile-icon');
    
    if (!profileDropdown || !profileIcon) return;
    
    const isVisible = profileDropdown.style.display !== 'none';
    
    if (isVisible) {
      profileDropdown.style.display = 'none';
    } else {
      // Position dropdown relative to profile icon (bottom-right)
      const iconRect = profileIcon.getBoundingClientRect();
      
      if (iconRect) {
        profileDropdown.style.display = 'block';
        // Position above the icon with some spacing
        const dropdownHeight = 200; // Approximate height
        profileDropdown.style.bottom = `${window.innerHeight - iconRect.top + 8}px`;
        profileDropdown.style.right = `${window.innerWidth - iconRect.right - 48}px`;
        
        // Ensure dropdown stays within viewport
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
    if (window.SiderLoginModal) {
      window.SiderLoginModal.show('login');
    }
  }
  
  function handleProfileMenuAction(action) {
    switch (action) {
      case 'whats-new':
        console.log('What\'s new clicked');
        // Handle what's new action
        break;
      case 'rewards':
        console.log('Rewards center clicked');
        // Handle rewards action
        break;
      case 'help':
        console.log('Help center clicked');
        // Handle help action
        break;
      case 'feedback':
        console.log('Feedback clicked');
        // Handle feedback action
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
  
  function initializePanel() {
    chatPanel = createChatPanel();
    
    const toggleBtn = document.getElementById('sider-toggle-btn');
    const closeBtn = document.getElementById('sider-close-btn');
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
          if (window.toggleMicSendButton) window.toggleMicSendButton();
        } else if (action === 'deep-research') {
          // Trigger deep research functionality
          if (input) {
            input.value = input.value ? input.value + ' [Deep Research]' : '[Deep Research]';
            autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }
        }
      });
    });
    
    // Microphone button
    micBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Voice input feature not implemented
    });
    
    // Send button
    const sendBtn = document.getElementById('sider-send-btn');
    sendBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      sendMessage();
    });
    
    // Function to toggle between mic and send button based on input value
    // Make it accessible globally
    window.toggleMicSendButton = function() {
      const input = document.getElementById('sider-chat-input');
      const micButton = document.getElementById('sider-mic-btn');
      const sendButton = document.getElementById('sider-send-btn');
      
      if (!input || !micButton || !sendButton) {
        // If elements don't exist yet, try again later
        setTimeout(() => {
          if (window.toggleMicSendButton) window.toggleMicSendButton();
        }, 100);
        return;
      }
      
      // Check if input has any text (including whitespace)
      const hasText = input.value && input.value.trim().length > 0;
      
      if (hasText) {
        // Show send button, hide mic button
        micButton.style.setProperty('display', 'none', 'important');
        sendButton.style.setProperty('display', 'flex', 'important');
      } else {
        // Show mic button, hide send button
        micButton.style.setProperty('display', 'flex', 'important');
        sendButton.style.setProperty('display', 'none', 'important');
      }
    };
    
    // Also create a local reference
    const toggleMicSendButton = window.toggleMicSendButton;
    
    // Toggle button on input change
    chatInput?.addEventListener('input', (e) => {
      autoResize(e.target);
      toggleMicSendButton();
    });
    
    // Also toggle on keydown (for backspace, delete, etc.)
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else {
        autoResize(e.target);
        // Use setTimeout to check value after key is processed
        setTimeout(() => {
          toggleMicSendButton();
        }, 0);
      }
    });
    
    // Also resize on paste events
    chatInput?.addEventListener('paste', (e) => {
      setTimeout(() => {
        autoResize(e.target);
        toggleMicSendButton();
      }, 0);
    });
    
    // Initial resize to set correct height and set initial button state
    if (chatInput) {
      // Set initial button state immediately
      toggleMicSendButton();
      
      setTimeout(() => {
        autoResize(chatInput);
        // Ensure button state is correct after resize
        toggleMicSendButton();
      }, 100);
    } else {
      // If chatInput doesn't exist yet, set initial state
      toggleMicSendButton();
    }
    
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
    
    // Profile icon dropdown
    const profileIcon = document.getElementById('sider-profile-icon');
    const profileDropdown = document.getElementById('sider-profile-dropdown');
    const profileLoginBtn = document.getElementById('sider-profile-login-btn');
    
    if (profileIcon && profileDropdown) {
      profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfileDropdown();
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.style.display !== 'none') {
          if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
            profileDropdown.style.display = 'none';
          }
        }
      });
      
      // Menu item click handlers
      const menuItems = profileDropdown.querySelectorAll('.sider-profile-menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          handleProfileMenuAction(action);
          profileDropdown.style.display = 'none';
        });
      });
      
      // Login button handler
      if (profileLoginBtn) {
        profileLoginBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleProfileLogin();
          profileDropdown.style.display = 'none';
        });
      }
    }
    
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
    
    // Summarize button click handler
    const summarizeBtn = document.getElementById('sider-summarize-btn');
    const summarizeCopyBtn = document.getElementById('sider-summarize-copy-btn');
    const summarizeCloseBtn = document.getElementById('sider-summarize-close-btn');
    
    if (summarizeBtn) {
      summarizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSummarizeClick();
      });
    }
    
    if (summarizeCopyBtn) {
      summarizeCopyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageUrl = window.location.href;
        navigator.clipboard.writeText(pageUrl).then(() => {
          // Show feedback
          const originalTitle = summarizeCopyBtn.getAttribute('title');
          summarizeCopyBtn.setAttribute('title', 'Copied!');
          setTimeout(() => {
            summarizeCopyBtn.setAttribute('title', originalTitle || 'Copy URL');
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = pageUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        });
      });
    }
    
    if (summarizeCloseBtn) {
      summarizeCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const summarizeCard = document.getElementById('sider-summarize-card');
        if (summarizeCard) {
          summarizeCard.style.display = 'none';
        }
      });
    }
    
    // Don't auto-open panel on page load - only open when extension icon is clicked
    // Ensure panel is closed by default
    isPanelOpen = false;
    chatPanel.classList.remove('sider-panel-open');
    chatPanel.classList.remove('sider-panel-collapsed');
    chatPanel.style.transform = 'translateX(100%)';
    compressWebsite(false);
    
    // Clear the stored state so it doesn't auto-open on next page load
    chrome.storage.local.set({ siderPanelOpen: false });
    
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
    if (!textarea) return;
    
    // Remove any existing height to get accurate scrollHeight
    const currentHeight = textarea.style.height;
    textarea.style.height = 'auto';
    
    // Force a reflow to ensure accurate scrollHeight calculation
    void textarea.offsetHeight;
    
    // Get scrollHeight which includes all content including padding
    const scrollHeight = textarea.scrollHeight;
    
    // Set the new height - textarea will grow naturally with content
    textarea.style.height = scrollHeight + 'px';
    
    // Ensure no scrollbar appears inside textarea
    textarea.style.overflowY = 'hidden';
    textarea.style.overflowX = 'hidden';
    
    // Ensure the input area can grow with the textarea
    const inputArea = textarea.closest('.sider-input-area');
    if (inputArea) {
      // Don't constrain the input area height
      inputArea.style.height = 'auto';
    }
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
        // Unknown action
    }
  }
  
  function updateAISelectorIcon(model) {
    const iconMap = {
      'Sider Fusion': chrome.runtime.getURL('icons/fusion.png'),
      'GPT-5 mini': chrome.runtime.getURL('icons/gpt_5mini.png'),
      'Cloude Haiku 4.5': chrome.runtime.getURL('icons/claude.png'),
      'Gemini 2.5 Flash': chrome.runtime.getURL('icons/gemini.png'),
      'GPT-5': chrome.runtime.getURL('icons/chatgpt.png'),
      'GPT-4.0': chrome.runtime.getURL('icons/chatgpt.png'),
      'DeepSeek V3.1': chrome.runtime.getURL('icons/deepseek.png'),
      'Cloude Sonnet 4.5': chrome.runtime.getURL('icons/claude.png'),
      'Gemini 2.5 Pro': chrome.runtime.getURL('icons/gemini.png'),
      'Grok 4': chrome.runtime.getURL('icons/grok.png'),
      'claude-3.5-haiku': chrome.runtime.getURL('icons/claude.png'),
      'kimi-k2': chrome.runtime.getURL('icons/kimi.png'),
      'deepseek-v3': chrome.runtime.getURL('icons/deepseek.png'),
      'claude-3.7-sonnet': chrome.runtime.getURL('icons/claude.png'),
      'claude-sonnet-4': chrome.runtime.getURL('icons/claude.png'),
      'claude-opus-4.1': chrome.runtime.getURL('icons/claude.png'),
      // Legacy values for backward compatibility
      'chatgpt': chrome.runtime.getURL('icons/fusion.png'),
      'gpt4': chrome.runtime.getURL('icons/chatgpt.png'),
      'gemini': chrome.runtime.getURL('icons/gemini.png'),
      'claude': chrome.runtime.getURL('icons/claude.png'),
      'groq': chrome.runtime.getURL('icons/grok.png')
    };
    
    const btn = document.getElementById('sider-ai-selector-btn');
    if (btn) {
      const iconDiv = btn.querySelector('.sider-ai-selector-icon');
      if (iconDiv) {
        const imageUrl = iconMap[model] || iconMap['chatgpt'] || chrome.runtime.getURL('icons/fusion.png');
        iconDiv.innerHTML = `<img src="${imageUrl}" alt="${model}" style="width: 18px; height: 18px; object-fit: contain; display: block;" />`;
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
      // Screenshot error
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
      if (window.toggleMicSendButton) window.toggleMicSendButton();
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
    if (window.toggleMicSendButton) window.toggleMicSendButton();
    
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
      if (window.toggleMicSendButton) window.toggleMicSendButton();
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
    const summarizeCard = document.getElementById('sider-summarize-card');
    
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
    if (welcome) {
      welcome.style.display = 'block';
    }
    // Show summarize card again when creating new chat
    if (summarizeCard) {
      setTimeout(() => {
        checkAndShowSummarizeCard();
      }, 100);
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
      // Error handling message
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
      if (window.toggleMicSendButton) window.toggleMicSendButton();
      
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
      if (window.toggleMicSendButton) window.toggleMicSendButton();
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
          if (window.toggleMicSendButton) window.toggleMicSendButton();
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
          if (window.toggleMicSendButton) window.toggleMicSendButton();
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'translate':
        if (input) {
          input.value = `Translate to English: "${text}"`;
          autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
          setTimeout(() => sendMessage(), 200);
        }
        break;
      case 'summarize':
        if (input) {
          input.value = `Summarize this text: "${text}"`;
          autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
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
  // Only hide if explicitly requested, not when user is typing
  window.addEventListener('sider:text-cleared', (e) => {
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const input = document.getElementById('sider-chat-input');
    
    // Only hide selected text section if explicitly requested via event detail
    const shouldHideSelectedText = e.detail?.hideSelectedText === true;
    if (shouldHideSelectedText) {
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      if (selectedTextSection) {
        selectedTextSection.style.display = 'none';
      }
    }
    
    // Don't close image preview section on outside clicks - only via close button
    // Image preview section should only close when clicking the close button
    // if (imagePreviewSection) {
    //   imagePreviewSection.style.display = 'none';
    // }
    // Don't clear input value - let user keep typing
    // if (input) {
    //   input.value = '';
    //   autoResize(input);
    // }
  });

  // Add click listener to close selected text section when clicking outside the panel
  document.addEventListener('mousedown', (e) => {
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    if (!selectedTextSection || selectedTextSection.style.display === 'none') {
      return;
    }

    // Check if click is outside the extension panel
    const panel = document.getElementById('sider-ai-chat-panel');
    if (!panel) return;

    // Check if click is inside the panel
    const isInsidePanel = panel.contains(e.target);
    
    // Only hide if clicking outside the panel
    if (!isInsidePanel) {
      selectedTextSection.style.display = 'none';
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
        if (window.toggleMicSendButton) window.toggleMicSendButton();
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
      
      // Setup close button
      setupImagePreviewCloseButton();
    }
    
  });
  
  function handleImageAction(action, src, alt) {
    const input = document.getElementById('sider-chat-input');
    if (!input) return;
    
    switch (action) {
      case 'extract-text':
        input.value = 'Extract all text from this image';
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        break;
      case 'math-solver':
        input.value = 'Solve the math problems in this image';
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        break;
      case 'translate-image':
        input.value = 'Translate all text in this image to English';
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        break;
    }
    input.focus();
  }

  function setupImagePreviewCloseButton() {
    const closeBtn = document.getElementById('sider-image-preview-close');
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const imageThumb = document.getElementById('sider-image-preview-thumb');
    
    if (closeBtn && imagePreviewSection && imageThumb) {
      // Remove existing listeners by cloning the button
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      // Attach new listener
      newCloseBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        imagePreviewSection.style.display = 'none';
        imageThumb.src = '';
        imageThumb.alt = '';
      };
    }
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
      setupImagePreviewCloseButton();
    }
    
    // Set input with extract text prompt
    if (input) {
      input.value = 'Extract all text from this image';
      input.placeholder = 'Ask anything, @models, / prompts';
      autoResize(input);
    }
    
    // OCR/image text extraction feature not implemented
  });

  window.addEventListener('sider:save-wisebase', (e) => {
    const { src, alt } = e.detail || {};
    if (!src) return;
    
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
      setupImagePreviewCloseButton();
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
    
    // Image tool functionality not implemented
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

