(function() {
  'use strict';
  
  // Chat Tab Component
  const ChatTab = {
    currentModel: null,
    lastUserMessage: null, // Store last user message for regeneration
    currentConversationId: null,
    pendingAttachments: [],
    currentTab: null,
    messageListenerSetup: false,
    conversationsCache: null,
    isLoadingConversations: false,
    historyModalEventsSetup: false,
    selectedTranslateLanguage: 'en', // Default to English
    isGenerating: false, // Track if response is being generated
    currentAbortController: null, // AbortController for current request
    currentThinkingMsg: null, // Current thinking message being updated
    responseVersionCache: new Map(), // In-memory cache for response versions
    
    // Scroll to bottom of the active scroll container (messages or panel body)
    scrollToBottom: function(smooth = true) {
      const messagesContainer = document.getElementById('sider-chat-messages');
      const panelBody = document.getElementById('sider-panel-body');
      const scrollTargets = [];
      
      if (messagesContainer) {
        scrollTargets.push(messagesContainer);
      }
      
      // When messages container isn't scrollable (e.g. takes natural height),
      // the panel body handles the scrolling, so include it as a fallback.
      if (panelBody && panelBody !== messagesContainer) {
        scrollTargets.push(panelBody);
      }
      
      if (scrollTargets.length === 0) return;
      
      const runScroll = () => {
        scrollTargets.forEach((el) => {
          if (!el) return;
          if (typeof el.scrollTo === 'function') {
            el.scrollTo({
              top: el.scrollHeight,
              behavior: smooth ? 'smooth' : 'auto'
            });
          } else {
            el.scrollTop = el.scrollHeight;
          }
        });
      };
      
      // Use double requestAnimationFrame to ensure DOM/layout updates finish first
      requestAnimationFrame(() => {
        requestAnimationFrame(runScroll);
      });
    },
    
    // Load HTML content from chat-tab.html
    loadHTML: async function() {
      try {
        const url = chrome.runtime.getURL('chat-tab.html');
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load chat-tab.html: ${response.status}`);
        }
        const html = await response.text();
        
        // Parse HTML and inject chat container
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const welcomeSection = doc.querySelector('.sider-welcome');
        const summarizeCard = doc.querySelector('#sider-summarize-card');
        const chatContainer = doc.querySelector('.sider-chat-container');
        const footerContainer = doc.querySelector('.sider-panel-footer');
        const historyModal = doc.querySelector('.sider-chat-history-modal');
        const deleteConfirmationModal = doc.querySelector('#sider-delete-confirmation-modal');
        const editTitleModal = doc.querySelector('#sider-edit-title-modal');
        
        const chatTabContainer = document.getElementById('sider-chat-tab-container');
        const chatFooterContainer = document.getElementById('sider-chat-footer-container');
        
        if (chatTabContainer) {
          let htmlContent = '';
          
          // Add welcome section if it exists
          if (welcomeSection) {
            htmlContent += welcomeSection.outerHTML;
          }
          
          // Add summarize card if it exists (between welcome and chat container)
          if (summarizeCard) {
            htmlContent += summarizeCard.outerHTML;
          }
          
          // Add chat container if it exists
          if (chatContainer) {
            htmlContent += chatContainer.outerHTML;
          }
          
          chatTabContainer.innerHTML = htmlContent;
        }
        
        if (footerContainer && chatFooterContainer) {
          chatFooterContainer.innerHTML = footerContainer.outerHTML;
        }
        
        // Add history modal to the main panel body (so it overlays everything)
        if (historyModal) {
          const panelBody = document.getElementById('sider-panel-body');
          if (panelBody) {
            // Check if modal already exists
            const existingModal = document.getElementById('sider-chat-history-modal');
            if (!existingModal) {
              panelBody.appendChild(historyModal.cloneNode(true));
            }
          }
        }
        
        // Add delete confirmation modal to document body (so it overlays everything)
        if (deleteConfirmationModal) {
          // Check if modal already exists
          const existingDeleteModal = document.getElementById('sider-delete-confirmation-modal');
          if (!existingDeleteModal) {
            // Add to document.body for proper overlay
            document.body.appendChild(deleteConfirmationModal.cloneNode(true));
            console.log('Delete confirmation modal added to DOM');
          }
        }
        
        // Add edit title modal to document body (so it overlays everything)
        if (editTitleModal) {
          // Check if modal already exists
          const existingEditTitleModal = document.getElementById('sider-edit-title-modal');
          if (!existingEditTitleModal) {
            // Add to document.body for proper overlay
            document.body.appendChild(editTitleModal.cloneNode(true));
            console.log('Edit title modal added to DOM');
          }
        }
      } catch (error) {
        console.error('Error loading chat-tab.html:', error);
        // Fallback: create elements programmatically if fetch fails
        this.createFallbackHTML();
      }
    },
    
    // Fallback: create HTML elements programmatically
    createFallbackHTML: function() {
      const chatTabContainer = document.getElementById('sider-chat-tab-container');
      const chatFooterContainer = document.getElementById('sider-chat-footer-container');
      
      if (chatTabContainer && !chatTabContainer.innerHTML.trim()) {
        chatTabContainer.innerHTML = `
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
        `;
      }
      
      if (chatFooterContainer && !chatFooterContainer.innerHTML.trim()) {
        // Footer will be created by setupEventListeners if needed
        // For now, create a basic structure
        chatFooterContainer.innerHTML = `
          <div class="sider-panel-footer">
            <div class="sider-input-wrapper">
              <div class="sider-toolbar">
                <button class="sider-toolbar-btn sider-ai-selector-btn" id="sider-ai-selector-btn" title="Select AI Model">
                  <div class="sider-ai-selector-icon">
                    <img id="sider-ai-icon-img" src="" alt="AI Model" style="width: 18px; height: 18px; object-fit: contain; display: block;" />
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-dropdown-arrow">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <button class="sider-toolbar-btn" id="sider-screenshot-btn" title="Capture Selected Area">
                  <img id="sider-screenshot-icon" src="" alt="Cut" style="width: 18px; height: 18px; object-fit: contain;" />
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
                <button class="sider-toolbar-btn" id="sider-filter-btn" title="Chat control">
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
                    <div class="sider-images-row" style="display: flex; flex-direction: row; gap: 8px; align-items: flex-start; flex-wrap: wrap;">
                    </div>
                    <div style="display: flex; flex-direction: row; gap: 8px; align-items: flex-start; flex-wrap: wrap;">
                      <button class="sider-image-action-btn" data-action="extract-text" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 10px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                        Extract text
                      </button>
                      <button class="sider-image-action-btn" data-action="math-solver" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 10px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                        Math Solver
                      </button>
                      <button class="sider-image-action-btn" data-action="translate-image" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 10px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 4px; position: relative;">
                        <span class="sider-translate-text">Translate</span>
                        <svg class="sider-translate-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="cursor: pointer;">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        <div class="sider-translate-language-dropdown" id="sider-translate-language-dropdown" style="display: none;">
                          <div class="sider-translate-language-list">
                            <div class="sider-translate-language-item" data-lang="en">English</div>
                            <div class="sider-translate-language-item" data-lang="es">Spanish</div>
                            <div class="sider-translate-language-item" data-lang="fr">French</div>
                            <div class="sider-translate-language-item" data-lang="de">German</div>
                            <div class="sider-translate-language-item" data-lang="it">Italian</div>
                            <div class="sider-translate-language-item" data-lang="pt">Portuguese</div>
                            <div class="sider-translate-language-item" data-lang="ru">Russian</div>
                            <div class="sider-translate-language-item" data-lang="ja">Japanese</div>
                            <div class="sider-translate-language-item" data-lang="ko">Korean</div>
                            <div class="sider-translate-language-item" data-lang="zh">Chinese</div>
                            <div class="sider-translate-language-item" data-lang="ar">Arabic</div>
                            <div class="sider-translate-language-item" data-lang="hi">Hindi</div>
                            <div class="sider-translate-language-item" data-lang="nl">Dutch</div>
                            <div class="sider-translate-language-item" data-lang="pl">Polish</div>
                            <div class="sider-translate-language-item" data-lang="tr">Turkish</div>
                            <div class="sider-translate-language-item" data-lang="vi">Vietnamese</div>
                            <div class="sider-translate-language-item" data-lang="th">Thai</div>
                            <div class="sider-translate-language-item" data-lang="id">Indonesian</div>
                          </div>
                        </div>
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
                    <button class="sider-bottom-action-btn" data-action="think" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="6" x2="12" y2="8"/>
                        <line x1="12" y1="16" x2="12" y2="18"/>
                        <path d="M9 9h6M9 15h6"/>
                      </svg>
                      <span>Think</span>
                    </button>
                    <button class="sider-bottom-action-btn" data-action="deep-research" disabled>
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
        `;
      }
    },
    
    // Initialize chat tab
    init: async function(dependencies) {
      this.currentModel = dependencies.currentModel || this.currentModel;
      
      await this.initializeModelPreference();
      
      this.currentTab = dependencies.currentTab || null;
      this.requireAuth = dependencies.requireAuth || (async () => true);
      this.getCurrentTab = dependencies.getCurrentTab || (async () => null);
      this.updatePageTitle = dependencies.updatePageTitle || (() => {});
      
      // Load saved translate language preference
      chrome.storage.local.get(['sider_translate_language'], (result) => {
        if (result.sider_translate_language) {
          this.selectedTranslateLanguage = result.sider_translate_language;
        }
      });
      
      // Load HTML content first
      await this.loadHTML();
      
      // Initialize AI selector icon after HTML is loaded
      if (window.updateAISelectorIcon) {
        window.updateAISelectorIcon(this.getActiveModel());
      }
      
      this.setupEventListeners();
      this.setupMessageListeners();
    },
    
    // Ensure we load the latest saved model selection
    initializeModelPreference: function() {
      return new Promise((resolve) => {
        try {
          chrome.storage.sync.get(['sider_selected_model'], (result) => {
            if (result && result.sider_selected_model) {
              this.currentModel = result.sider_selected_model;
            }
            resolve();
          });
        } catch (error) {
          console.error('Error loading saved model preference:', error);
          resolve();
        }
      });
    },
    
    getActiveModel: function() {
      return this.currentModel;
    },
    
    // Auto-resize textarea
    autoResize: function(textarea) {
      if (!textarea) return;
      
      const currentHeight = textarea.style.height;
      textarea.style.height = 'auto';
      void textarea.offsetHeight;
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight + 'px';
      textarea.style.overflowY = 'hidden';
      textarea.style.overflowX = 'hidden';
      
      const inputArea = textarea.closest('.sider-input-area');
      if (inputArea) {
        inputArea.style.height = 'auto';
      }
    },
    
    // Render attachments
    renderAttachments: function() {
      const container = document.getElementById('sider-attachments');
      if (!container) return;
      container.innerHTML = '';
      this.pendingAttachments.forEach((att, idx) => {
        const chip = document.createElement('div');
        chip.className = `sider-attachment-chip${att.type === 'file' ? ' sider-attachment-file' : att.type === 'url' ? ' sider-attachment-url' : ''}`;
        chip.setAttribute('data-attachment-index', idx);
        
        if (att.type === 'image' && att.dataUrl) {
          chip.innerHTML = `
            <img class="sider-attachment-thumb" src="${att.dataUrl}" alt="attachment" />
            <div class="sider-attachment-meta">
              <span class="sider-attachment-name">${att.name}</span>
              <span class="sider-attachment-subtext">${att.width || ''}${att.width && att.height ? '×' : ''}${att.height || ''}</span>
            </div>
            <button class="sider-attachment-remove" title="Remove">✕</button>
          `;
        } else if (att.type === 'url') {
          const uploadStatus = att.uploadStatus || 'uploaded';
          const statusText = uploadStatus === 'uploading' ? 'Uploading...' : 
                           uploadStatus === 'failed' ? 'Upload failed' : 
                           att.url || '';
          
          chip.innerHTML = `
            <div class="sider-attachment-url-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div class="sider-attachment-meta">
              <span class="sider-attachment-name">${att.name || 'Website'}</span>
              <span class="sider-attachment-subtext ${uploadStatus === 'uploading' ? 'sider-uploading' : uploadStatus === 'failed' ? 'sider-upload-failed' : ''}">${statusText}</span>
            </div>
            <button class="sider-attachment-remove" title="Remove">✕</button>
          `;
        } else {
          const extension = (att.name?.split('.').pop() || '').toUpperCase();
          const uploadStatus = att.uploadStatus || 'uploaded';
          const statusText = uploadStatus === 'uploading' ? 'Uploading...' : 
                           uploadStatus === 'failed' ? 'Upload failed' : 
                           this.formatFileSize(att.size);
          
          chip.innerHTML = `
            <div class="sider-attachment-file-icon">${extension ? extension.slice(0, 4) : 'FILE'}</div>
            <div class="sider-attachment-meta">
              <span class="sider-attachment-name">${att.name || 'Attachment'}</span>
              <span class="sider-attachment-subtext ${uploadStatus === 'uploading' ? 'sider-uploading' : uploadStatus === 'failed' ? 'sider-upload-failed' : ''}">${statusText}</span>
            </div>
            <button class="sider-attachment-remove" title="Remove">✕</button>
          `;
        }
        
        chip.querySelector('.sider-attachment-remove').addEventListener('click', () => {
          this.pendingAttachments.splice(idx, 1);
          this.renderAttachments();
        });
        container.appendChild(chip);
      });
      this.updateInputPaddingForAttachments();
    },
    
    formatFileSize: function(bytes) {
      if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      const value = size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1);
      return `${value} ${units[unitIndex]}`;
    },
    
    // Update input padding for attachments
    updateInputPaddingForAttachments: function() {
      const input = document.getElementById('sider-chat-input');
      const container = document.getElementById('sider-attachments');
      if (!input || !container) return;
      const basePadding = 12;
      const needed = container.childElementCount > 0 ? container.clientHeight + basePadding : basePadding;
      input.style.paddingTop = `${needed}px`;
    },
    
    // Handle file attachments
    handleFileAttachments: function(files) {
      files.forEach(file => {
        if (!(file instanceof File)) return;
        
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.showImagePreview(dataUrl, file.name || 'Image');
          };
          reader.readAsDataURL(file);
          return;
        }
        
        // For non-image files, create attachment and upload immediately
        const attachment = {
          type: 'file',
          name: file.name,
          size: file.size,
          dataUrl: null,
          mimeType: file.type || '',
          fileUrl: null,
          fileId: null,
          uploadStatus: 'uploading'
        };
        this.pendingAttachments.push(attachment);
        this.renderAttachments();
        
        // Upload document to server
        this.uploadDocument(file, attachment);
      });
    },
    
    // Upload document to server (similar to image upload)
    uploadDocument: async function(file, attachment) {
      if (!window.SiderImageService || !window.SiderImageService.uploadImage) {
        console.error('ImageService not available for document upload');
        attachment.uploadStatus = 'failed';
        this.renderAttachments();
        return;
      }
      
      try {
        // Get conversation ID if available
        const conversationId = this.currentConversationId || '';
        
        // Determine MIME type
        const mimeType = file.type || 'application/octet-stream';
        
        // Upload file using ImageService (it handles any file type)
        const result = await window.SiderImageService.uploadImage(file, {
          conversation_id: conversationId,
          mime: mimeType,
          hash: '',
          meta: '',
          app_name: '',
          app_version: '',
          tz_name: '',
          tasks: '[]'
        });
        
        if (result.success && result.data) {
          // Store uploaded file info
          const fileId = result.data.fileID || result.data.file_id;
          const fileUrl = result.data.cdnURL || result.data.signedCDNURL || result.data.file_url || result.data.storage_url;
          attachment.fileId = fileId || '';
          attachment.fileUrl = fileUrl || '';
          attachment.uploadStatus = 'uploaded';
          
          console.log('✅ Document uploaded successfully:', result.data);
        } else {
          console.error('Failed to upload document:', result.error);
          attachment.uploadStatus = 'failed';
        }
      } catch (error) {
        console.error('Error during document upload:', error);
        attachment.uploadStatus = 'failed';
      }
      
      // Re-render to update status
      this.renderAttachments();
    },
    
    // Upload URL/website content to server
    uploadUrl: async function(attachment) {
      if (!window.SiderImageService || !window.SiderImageService.uploadImage) {
        console.error('ImageService not available for URL upload');
        attachment.uploadStatus = 'failed';
        this.renderAttachments();
        return;
      }
      
      if (!this.currentTab || !this.currentTab.id) {
        console.error('No current tab available for URL upload');
        attachment.uploadStatus = 'failed';
        this.renderAttachments();
        return;
      }
      
      try {
        attachment.uploadStatus = 'uploading';
        this.renderAttachments();
        
        // Get page HTML content from content script
        const pageContent = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'getPageContent'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        
        // Convert page content to a File/Blob
        const pageHtml = pageContent.html || '';
        const pageText = pageContent.text || '';
        const contentToUpload = pageHtml || pageText;
        
        if (!contentToUpload) {
          throw new Error('Could not retrieve page content');
        }
        
        // Create a Blob from the content
        const blob = new Blob([contentToUpload], { type: 'text/plain' });
        const fileName = `${(attachment.title || 'page').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        const file = new File([blob], fileName, { type: 'text/plain' });
        
        // Calculate hash for the file content
        async function calculateHash(content) {
          const encoder = new TextEncoder();
          const data = encoder.encode(content);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        const fileHash = await calculateHash(contentToUpload);
        
        // Get conversation ID if available
        const conversationId = this.currentConversationId || '';
        
        // Upload file using ImageService
        const result = await window.SiderImageService.uploadImage(file, {
          conversation_id: conversationId,
          mime: 'text/plain',
          hash: fileHash,
          meta: JSON.stringify({ 
            url: attachment.url, 
            title: attachment.title, 
            desc: attachment.title, 
            fileFor: '' 
          }),
          app_name: 'ChitChat_Chrome_Ext',
          app_version: '5.21.1',
          tz_name: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          tasks: JSON.stringify([{ type: 'RAG' }]),
          type: 'webpage'
        });
        
        if (result.success && result.data) {
          // Store uploaded file info
          const fileId = result.data.fileID || result.data.file_id;
          const fileUrl = result.data.cdnURL || result.data.signedCDNURL || result.data.file_url || result.data.storage_url;
          attachment.fileId = fileId || '';
          attachment.fileUrl = fileUrl || '';
          attachment.uploadStatus = 'uploaded';
          
          console.log('✅ URL uploaded successfully:', result.data);
        } else {
          console.error('Failed to upload URL:', result.error);
          attachment.uploadStatus = 'failed';
        }
      } catch (error) {
        console.error('Error during URL upload:', error);
        attachment.uploadStatus = 'failed';
      }
      
      // Re-render to update status
      this.renderAttachments();
    },
    
    // Read current page
    readCurrentPage: async function() {
      if (!this.currentTab || !this.currentTab.id) return;
      
      // Request page content from content script
      chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'READ_PAGE'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error reading page:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.content) {
          // Check if this URL is already attached
          const existingUrlAttachment = this.pendingAttachments.find(att => 
            att.type === 'url' && att.url === response.content.url
          );
          
          if (existingUrlAttachment) {
            // URL already attached, just focus the input
            const input = document.getElementById('sider-chat-input');
            if (input) {
              input.focus();
            }
            return;
          }
          
          // Add website as attachment
          const urlAttachment = {
            type: 'url',
            name: response.content.title || 'Website',
            url: response.content.url,
            title: response.content.title,
            text: response.content.text,
            uploadStatus: 'uploading',
            fileId: null,
            fileUrl: null
          };
          
          this.pendingAttachments.push(urlAttachment);
          this.renderAttachments();
          
          // Upload the URL content immediately
          this.uploadUrl(urlAttachment);
          
          // Focus the input
          const input = document.getElementById('sider-chat-input');
          if (input) {
            input.focus();
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }
        }
      });
    },
    
    // Send message
    sendMessage: async function() {
      // Check authentication before sending message
      const isAuthenticated = await this.requireAuth();
      if (!isAuthenticated) {
        return;
      }
      
      const input = document.getElementById('sider-chat-input');
      const messagesContainer = document.getElementById('sider-chat-messages');
      const chatContainer = document.getElementById('sider-chat-container');
      const welcome = document.querySelector('.sider-welcome');
      
      if (!input || !input.value.trim()) return;
      
      let message = input.value.trim();
      const model = this.getActiveModel();
      
      // Check if there's selected text visible and include it in the message
      // Only append if the message doesn't already contain the selected text (to avoid double-appending from button clicks)
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      const selectedTextDisplay = document.getElementById('sider-selected-text-display');
      if (selectedTextSection && selectedTextSection.style.display !== 'none' && selectedTextDisplay && selectedTextDisplay.textContent) {
        const selectedText = selectedTextDisplay.textContent.trim();
        if (selectedText) {
          // Check if the message already contains the selected text (button clicks already format it)
          const selectedTextInQuotes = `"${selectedText}"`;
          const selectedTextWithoutQuotes = selectedText;
          
          // Only append if the selected text is not already in the message
          if (!message.includes(selectedTextInQuotes) && !message.includes(selectedTextWithoutQuotes)) {
            // Append selected text to the message
            message = `${message}: "${selectedText}"`;
          }
        }
      }
      
      // Check for URL attachments and include them in the message
      const urlAttachments = this.pendingAttachments.filter(att => att.type === 'url');
      if (urlAttachments.length > 0) {
        urlAttachments.forEach(urlAtt => {
          const urlText = `\n\n📖 ${urlAtt.title || 'Website'}\nURL: ${urlAtt.url}`;
          // Only append if URL is not already in the message
          if (!message.includes(urlAtt.url)) {
            message = message + urlText;
          }
        });
      }
      
      input.value = '';
      this.autoResize(input);
      if (window.toggleMicSendButton) window.toggleMicSendButton();
      
      // Hide selected text section after sending
      if (selectedTextSection) {
        selectedTextSection.style.display = 'none';
      }
      
      if (chatContainer) {
        chatContainer.style.display = 'flex';
      }
      if (welcome) {
        welcome.style.display = 'none';
      }
      
      const imagePreviewSection = document.getElementById('sider-image-preview-section');
      let hasImagePreview = false;
      let imageUrl = null; // For API call - should be CDN URL
      let imageDisplayUrl = null; // For display - can be CDN URL or data URL
      
      // Check for image preview items (new structure)
      if (imagePreviewSection && imagePreviewSection.style.display !== 'none') {
        const imageItems = imagePreviewSection.querySelectorAll('.sider-image-preview-item');
        if (imageItems.length > 0) {
          // Get the first image's cdnURL from data-file-url attribute
          const firstImageItem = imageItems[0];
          const uploadStatus = firstImageItem.getAttribute('data-upload-status');
          imageUrl = firstImageItem.getAttribute('data-file-url'); // CDN URL for API
          imageDisplayUrl = imageUrl; // For display, prefer CDN URL
          
          // If upload is still in progress, wait for it to complete (max 10 seconds)
          if (!imageUrl && uploadStatus === 'uploading') {
            console.log('⏳ Waiting for image upload to complete...');
            let waitCount = 0;
            const maxWait = 50; // 50 * 200ms = 10 seconds max
            let currentStatus = uploadStatus;
            while (waitCount < maxWait && !imageUrl && currentStatus === 'uploading') {
              await new Promise(resolve => setTimeout(resolve, 200));
              imageUrl = firstImageItem.getAttribute('data-file-url');
              imageDisplayUrl = imageUrl;
              currentStatus = firstImageItem.getAttribute('data-upload-status');
              if (currentStatus === 'failed') {
                console.error('❌ Image upload failed');
                break;
              }
              waitCount++;
            }
          }
          
          // For display, if no CDN URL, use the original image source (data URL) as fallback
          if (!imageDisplayUrl) {
            imageDisplayUrl = firstImageItem.getAttribute('data-image-src');
          }
          
          if (imageUrl || imageDisplayUrl) {
            hasImagePreview = true;
          } else {
            // Check final status after waiting
            const finalStatus = firstImageItem.getAttribute('data-upload-status');
            if (finalStatus === 'uploading') {
              // Upload is still in progress after waiting, show error
              this.addMessage('assistant', 'Error: Image is still uploading. Please wait a moment and try again.', true);
              return;
            } else if (finalStatus === 'failed') {
              // Upload failed, show error
              this.addMessage('assistant', 'Error: Image upload failed. Please try again.', true);
              return;
            }
            // If no status or unknown status, but no URL, we'll proceed without image
          }
        }
      }
      
      // Fallback: check for old imageThumb structure
      if (!hasImagePreview) {
        const imageThumb = document.getElementById('sider-image-preview-thumb');
        if (imagePreviewSection && imagePreviewSection.style.display !== 'none' && imageThumb && imageThumb.src) {
          hasImagePreview = true;
        }
      }
      
      // Check for document attachments (files and URLs) and wait for uploads to complete
      const documentAttachments = this.pendingAttachments.filter(att => att.type === 'file' || att.type === 'url');
      if (documentAttachments.length > 0) {
        // Wait for all document uploads to complete (max 10 seconds per document)
        console.log('⏳ Waiting for document uploads to complete...');
        for (const doc of documentAttachments) {
          if (doc.uploadStatus === 'uploading') {
            let waitCount = 0;
            const maxWait = 50; // 50 * 200ms = 10 seconds max
            while (waitCount < maxWait && doc.uploadStatus === 'uploading' && (!doc.fileUrl || !doc.fileId)) {
              await new Promise(resolve => setTimeout(resolve, 200));
              waitCount++;
            }
          }
          
          if (doc.uploadStatus === 'uploaded' && doc.fileUrl && doc.fileId) {
            continue;
          } else if (doc.uploadStatus === 'uploading') {
            this.addMessage('assistant', 'Error: Document is still uploading. Please wait a moment and try again.', true);
            return;
          } else if (doc.uploadStatus === 'failed') {
            this.addMessage('assistant', `Error: Failed to upload ${doc.type === 'url' ? 'website' : 'document'} "${doc.name}". Please try again.`, true);
            return;
          } else if (!doc.fileId || !doc.fileUrl) {
            this.addMessage('assistant', `Error: Missing file information for "${doc.name}". Please re-upload.`, true);
            return;
          }
        }
      }
      
      // Prepare attachment previews before clearing them from the input
      const attachmentsToClear = [...this.pendingAttachments];
      const attachmentPreviewData = attachmentsToClear
        .filter(att => att.type === 'file')
        .map(att => ({
          name: att.name,
          size: att.size,
          fileUrl: att.fileUrl || ''
        }));
      
      const hasDocumentAttachments = documentAttachments.length > 0;
      let documentCompletionOptions = null;
      
      if (hasDocumentAttachments) {
        const documentMultiContent = documentAttachments
          .filter(doc => doc.fileId)
          .map(doc => {
            // For URL attachments, use 'webpage' type; for files, determine from mime/extension
            let fileType = 'file';
            if (doc.type === 'url') {
              fileType = 'webpage';
            } else {
              const mimeType = doc.mimeType || '';
              const extensionFromMime = mimeType.includes('/') ? mimeType.split('/').pop() : '';
              const extensionFromName = doc.name?.split('.').pop() || '';
              fileType = (extensionFromMime || extensionFromName || 'file').toLowerCase();
            }
            return {
              type: 'file',
              file: {
                file_id: doc.fileId,
                type: fileType
              }
            };
          });
        
        if (documentMultiContent.length === 0) {
          this.addMessage('assistant', 'Error: Unable to attach document metadata. Please try again.', true);
          return;
        }
        
        documentMultiContent.push({
          type: 'text',
          text: message,
          user_input_text: message
        });
        
        documentCompletionOptions = {
          stream: false,
          filter_search_history: false,
          from: 'chat',
          chat_models: [],
          multi_content: documentMultiContent,
          prompt_templates: []
        };
      }
      
      // Store last user message context for regeneration
      this.lastUserMessage = {
        text: message,
        imageUrl: hasImagePreview ? imageUrl : null,
        imageDisplayUrl: hasImagePreview ? (imageDisplayUrl || imageUrl) : null,
        documentAttachments: hasDocumentAttachments ? documentAttachments.map(doc => ({
          fileId: doc.fileId,
          fileUrl: doc.fileUrl,
          name: doc.name,
          size: doc.size,
          mimeType: doc.mimeType
        })) : [],
        documentCompletionOptions: documentCompletionOptions,
        model: model
      };
      
      if (attachmentsToClear.length > 0) {
        const displayImageUrl = hasImagePreview ? (imageDisplayUrl || imageUrl) : null;
        this.addMessage('user', message, false, displayImageUrl, attachmentPreviewData);
        this.pendingAttachments = [];
        this.renderAttachments();
        this.updateInputPaddingForAttachments();
      } else if (hasImagePreview && (imageUrl || imageDisplayUrl)) {
        // Display message with image - remove the image hint text since we're showing the actual image
        const cleanMessage = message.trim();
        // Use display URL (can be CDN or data URL) for showing the image
        this.addMessage('user', cleanMessage || 'See image above', false, imageDisplayUrl || imageUrl);
      } else {
        this.addMessage('user', message);
      }
      
      if (hasImagePreview && imagePreviewSection) {
        imagePreviewSection.style.display = 'none';
        // Clear all image preview items
        const imageItems = imagePreviewSection.querySelectorAll('.sider-image-preview-item');
        imageItems.forEach(item => item.remove());
        // Also clear old imageThumb if it exists
        const imageThumb = document.getElementById('sider-image-preview-thumb');
        if (imageThumb) {
          imageThumb.src = '';
          imageThumb.alt = '';
        }
      }
      
      const thinkingMsg = this.addMessage('assistant', 'Thinking...', true);
      
      // Set generation state
      this.isGenerating = true;
      this.currentAbortController = new AbortController();
      this.currentThinkingMsg = thinkingMsg;
      
      // Update button visibility
      if (window.toggleMicSendButton) window.toggleMicSendButton();
      
      try {
        // If no conversation ID exists, create a new conversation first
        if (!this.currentConversationId) {
          if (window.SiderChatService) {
            console.log('🔄 Creating new conversation...');
            const conversationResult = await window.SiderChatService.createConversation(
              message.substring(0, 50) || 'New Conversation',
              model
            );
            
            if (conversationResult.success && conversationResult.data) {
              // Store conversation ID - check multiple possible field names
              this.currentConversationId = conversationResult.data.id || 
                                           conversationResult.data.conversation_id || 
                                           conversationResult.data.cid ||
                                           conversationResult.data._id;
              console.log('✅ Conversation created:', this.currentConversationId);
            } else {
              this.updateMessage(thinkingMsg, 'assistant', `Error creating conversation: ${conversationResult.error || 'Unknown error'}`);
              return;
            }
          } else {
            this.updateMessage(thinkingMsg, 'assistant', 'Error: Chat service not available');
            return;
          }
        }
        
        // Use image API only when there are no document attachments
        if (!hasDocumentAttachments && hasImagePreview && imageUrl && window.SiderChatService && this.currentConversationId) {
          console.log('🔄 Calling sendMessageWithImage API with file_url:', imageUrl);
          const sendResult = await window.SiderChatService.sendMessageWithImage(
            this.currentConversationId,
            message,
            model,
            imageUrl,
            false, // stream = false
            this.currentAbortController
          );
          
          if (sendResult.success) {
            // The API might return response data or we might need to fetch the conversation
            // For now, let's fetch the conversation to get the latest messages
            try {
              const conversationResult = await window.SiderChatService.getConversation(this.currentConversationId);
              if (conversationResult.success && conversationResult.data) {
                console.log('✅ Conversation data fetched after sendMessageWithImage:', conversationResult.data);
                // Extract the latest assistant message from conversation
                // The structure may vary, so we check multiple possible fields
                let responseText = '';
                if (conversationResult.data.messages && Array.isArray(conversationResult.data.messages)) {
                  // Find the last assistant message
                  const assistantMessages = conversationResult.data.messages
                    .filter(msg => msg.role === 'assistant' || msg.type === 'assistant')
                    .reverse();
                  if (assistantMessages.length > 0) {
                    responseText = assistantMessages[0].content || 
                                 assistantMessages[0].text || 
                                 assistantMessages[0].message || 
                                 '';
                  }
                } else if (conversationResult.data.content) {
                  responseText = conversationResult.data.content;
                } else if (conversationResult.data.message) {
                  responseText = conversationResult.data.message;
                }
                
                if (responseText) {
                  // Save initial response as first version
                  this.updateMessageWithVersions(thinkingMsg, responseText, [responseText], 1, 1);
                } else {
                  this.updateMessage(thinkingMsg, 'assistant', 'Message sent successfully. Waiting for response...');
                }
              } else {
                this.updateMessage(thinkingMsg, 'assistant', 'Message sent successfully. Waiting for response...');
              }
            } catch (error) {
              console.error('Error fetching conversation after sendMessageWithImage:', error);
              this.updateMessage(thinkingMsg, 'assistant', 'Message sent successfully. Waiting for response...');
            }
          } else {
            this.updateMessage(thinkingMsg, 'assistant', `Error: ${sendResult.error || 'Failed to send message with image'}`);
          }
        } else if (window.SiderChatService && this.currentConversationId) {
          // Send message using chat completions API (text only or document attachments)
          console.log('🔄 Calling chat completions API...');
          const completionOptions = documentCompletionOptions || {};
          completionOptions.abortController = this.currentAbortController;
          const completionsResult = await window.SiderChatService.chatCompletions(
            this.currentConversationId,
            message,
            documentCompletionOptions ? this.getActiveModel() : model,
            completionOptions
          );
          
          if (completionsResult.success && completionsResult.data) {
            // Extract response text from the completions response
            // The response structure may vary, so we check multiple possible fields
            let responseText = '';
            if (completionsResult.data.choices && completionsResult.data.choices[0]) {
              responseText = completionsResult.data.choices[0].message?.content || 
                           completionsResult.data.choices[0].text || 
                           completionsResult.data.choices[0].content || '';
            } else if (completionsResult.data.content) {
              responseText = completionsResult.data.content;
            } else if (completionsResult.data.message) {
              responseText = completionsResult.data.message;
            } else if (completionsResult.data.text) {
              responseText = completionsResult.data.text;
            } else if (typeof completionsResult.data === 'string') {
              responseText = completionsResult.data;
            } else {
              responseText = JSON.stringify(completionsResult.data);
            }
            
            if (responseText) {
              // Save initial response as first version
              this.updateMessageWithVersions(thinkingMsg, responseText, [responseText], 1, 1);
            } else {
              this.updateMessage(thinkingMsg, 'assistant', 'Response received but no content found');
            }

            // Note: getConversation is already called inside chatCompletions, so no need to call it again here
          } else {
            this.updateMessage(thinkingMsg, 'assistant', `Error: ${completionsResult.error || 'Failed to get chat completion'}`);
          }
        } else {
          // Fallback to old method
        chrome.runtime.sendMessage({
          type: 'CHAT_REQUEST',
          message: message,
          model: model
        }, (response) => {
          if (response && response.error) {
            this.updateMessage(thinkingMsg, 'assistant', `Error: ${response.error}`);
          } else if (response && response.text) {
            this.updateMessage(thinkingMsg, 'assistant', response.text);
          } else {
            this.updateMessage(thinkingMsg, 'assistant', 'No response received');
          }
        });
        }
      } catch (error) {
        console.error('Send message error:', error);
        // Check if error is due to abort
        if (error.name === 'AbortError') {
          if (this.currentThinkingMsg) {
            this.updateMessage(this.currentThinkingMsg, 'assistant', 'Generation stopped by user.');
          }
        } else {
          this.updateMessage(thinkingMsg, 'assistant', `Error: ${error.message}`);
        }
      } finally {
        // Reset generation state
        this.isGenerating = false;
        this.currentAbortController = null;
        this.currentThinkingMsg = null;
        if (window.toggleMicSendButton) window.toggleMicSendButton();
      }
    },
    
    // Stop generation
    stopGeneration: function() {
      if (!this.isGenerating || !this.currentAbortController) {
        return;
      }
      
      console.log('🛑 Stopping generation...');
      
      // Abort the current request
      this.currentAbortController.abort();
      
      // Update the thinking message
      if (this.currentThinkingMsg) {
        this.updateMessage(this.currentThinkingMsg, 'assistant', 'Generation stopped by user.');
      }
      
      // Reset generation state
      this.isGenerating = false;
      this.currentAbortController = null;
      this.currentThinkingMsg = null;
      
      // Update button visibility
      if (window.toggleMicSendButton) window.toggleMicSendButton();
    },
    
    // Create new chat
    createNewChat: function() {
      // Reset conversation ID for new chat
      this.currentConversationId = null;
      // Clear last user message for regeneration
      this.lastUserMessage = null;
      // Reset generation state
      this.isGenerating = false;
      if (this.currentAbortController) {
        this.currentAbortController.abort();
      }
      this.currentAbortController = null;
      this.currentThinkingMsg = null;
      
      const messagesContainer = document.getElementById('sider-chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
      
      const chatInput = document.getElementById('sider-chat-input');
      if (chatInput) {
        chatInput.value = '';
        this.autoResize(chatInput);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
      }
      
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      const imagePreviewSection = document.getElementById('sider-image-preview-section');
      if (selectedTextSection) {
        selectedTextSection.style.display = 'none';
      }
      if (imagePreviewSection) {
        imagePreviewSection.style.display = 'none';
      }
      
      const chatContainer = document.getElementById('sider-chat-container');
      const welcome = document.querySelector('.sider-welcome');
      const summarizeCard = document.getElementById('sider-summarize-card');
      const ocrContainer = document.getElementById('sider-ocr-container');
      const panelFooter = document.querySelector('.sider-panel-footer');
      const panelBody = document.getElementById('sider-panel-body');
      
      if (chatContainer) {
        chatContainer.style.display = 'none';
      }
      if (ocrContainer) {
        ocrContainer.style.display = 'none';
      }
      if (welcome) {
        welcome.style.display = 'block';
      }
      if (summarizeCard) {
        // Hide summarize card when creating new chat (don't show it)
        summarizeCard.style.display = 'none';
      }
      if (panelFooter) {
        panelFooter.style.display = 'block';
      }
      if (panelBody) {
        panelBody.classList.remove('sider-ocr-active');
      }
      
      const aiDropdown = document.getElementById('sider-ai-dropdown');
      if (aiDropdown) {
        aiDropdown.style.display = 'none';
      }
      
      if (messagesContainer) {
        messagesContainer.scrollTop = 0;
      }
    },
    
    // Add message
    addMessage: function(role, text, isThinking = false, imageUrl = null, attachments = []) {
      const messagesContainer = document.getElementById('sider-chat-messages');
      if (!messagesContainer) return null;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `sider-message sider-message-${role}`;
      
      if (isThinking) {
        messageDiv.classList.add('sider-thinking');
      }
      
      // Get avatar content based on role
      let avatarContent = '';
      if (role === 'user') {
        // Get username first letter - try localStorage first for immediate display
        let userName = 'U';
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            userName = user.username || user.name || user.email?.split('@')[0] || 'U';
          }
        } catch (e) {
          // Fallback to chrome.storage
        }
        const firstLetter = userName.charAt(0).toUpperCase();
        avatarContent = firstLetter;
        
        // Update from chrome.storage if available (async)
        chrome.storage.local.get(['sider_user_name', 'sider_user_email'], (result) => {
          const updatedUserName = result.sider_user_name || result.sider_user_email?.split('@')[0] || 'U';
          const updatedFirstLetter = updatedUserName.charAt(0).toUpperCase();
          const avatarEl = messageDiv.querySelector('.sider-message-avatar');
          if (avatarEl && avatarEl.textContent !== updatedFirstLetter) {
            avatarEl.textContent = updatedFirstLetter;
          }
        });
      } else {
        // Get model icon for assistant
        const iconMap = {
          'gpt-4o-mini': chrome.runtime.getURL('icons/chatgpt.png'),
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
          'chatgpt': chrome.runtime.getURL('icons/fusion.png'),
          'gpt4': chrome.runtime.getURL('icons/chatgpt.png'),
          'gemini': chrome.runtime.getURL('icons/gemini.png'),
          'claude': chrome.runtime.getURL('icons/claude.png'),
          'groq': chrome.runtime.getURL('icons/grok.png')
        };
        const model = this.getActiveModel();
        const iconUrl = iconMap[model] || chrome.runtime.getURL('icons/fusion.png');
        avatarContent = `<img src="${iconUrl}" alt="${model}" style="width: 20px; height: 20px; object-fit: contain;" />`;
      }
      
      // Build message content with optional image
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0 && role === 'user';
      const attachmentsHtml = hasAttachments ? `
        <div class="sider-message-attachments">
          ${attachments.map(att => {
            const extension = (att.name?.split('.').pop() || '').toUpperCase();
            const displayExt = extension ? extension.slice(0, 4) : 'FILE';
            const sizeText = this.formatFileSize ? this.formatFileSize(att.size) : '';
            const safeName = this.escapeHtml(att.name || 'Attachment');
            const url = att.fileUrl || '#';
            const isLink = url && url !== '#';
            return `
              <a class="sider-message-attachment" ${isLink ? `href="${url}" target="_blank" rel="noopener noreferrer"` : ''}>
                <div class="sider-message-attachment-icon">${displayExt}</div>
                <div class="sider-message-attachment-info">
                  <span class="sider-message-attachment-name">${safeName}</span>
                  <span class="sider-message-attachment-size">${sizeText || ''}</span>
                </div>
                <svg class="sider-message-attachment-open" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </a>
            `;
          }).join('')}
        </div>
      ` : '';
      
      let messageContent = '';
      if (imageUrl && role === 'user') {
        // Display image above text for user messages
        messageContent = `
          <div class="sider-message-image" style="margin-bottom: 8px; border-radius: 8px; overflow: hidden; max-width: 100%;">
            <img src="${imageUrl}" alt="Attached image" style="max-width: 100%; max-height: 400px; object-fit: contain; display: block; border-radius: 8px; cursor: pointer;" onclick="window.open('${imageUrl}', '_blank')" />
          </div>
          ${attachmentsHtml}
          <div class="sider-message-text">${this.escapeHtml(text)}</div>
        `;
      } else {
        messageContent = `
          ${attachmentsHtml}
          <div class="sider-message-text">${this.escapeHtml(text)}</div>
        `;
      }
      
      // Add action buttons for assistant messages
      const actionButtonsHtml = role === 'assistant' && !isThinking ? `
        <div class="sider-message-actions">
          <button class="sider-message-action-btn" title="Copy" data-action="copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="sider-message-action-btn" title="Add to list" data-action="add-to-list">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="12" y1="9" x2="12" y2="15"></line>
              <circle cx="19" cy="5" r="1.5"></circle>
            </svg>
          </button>
          <button class="sider-message-action-btn" title="Regenerate" data-action="regenerate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button class="sider-message-action-btn" title="Quote" data-action="quote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </button>
          <button class="sider-message-action-btn" title="Share" data-action="share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          <button class="sider-message-action-btn" title="Read aloud" data-action="read-aloud">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
        </div>
      ` : '';
      
      // Add response navigation for assistant messages with multiple versions
      const responseVersions = messageDiv.getAttribute('data-response-versions');
      const currentVersion = parseInt(messageDiv.getAttribute('data-current-version') || '1');
      const totalVersions = parseInt(messageDiv.getAttribute('data-total-versions') || '1');
      const navigationHtml = role === 'assistant' && !isThinking && totalVersions > 1 ? `
        <div class="sider-response-navigation">
          <button class="sider-nav-btn sider-nav-prev" ${currentVersion === 1 ? 'disabled' : ''} data-action="prev-response" title="Previous response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="sider-nav-counter">${currentVersion}/${totalVersions}</span>
          <button class="sider-nav-btn sider-nav-next" ${currentVersion === totalVersions ? 'disabled' : ''} data-action="next-response" title="Next response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      ` : '';
      
      messageDiv.innerHTML = `
        <div class="sider-message-avatar">
          ${avatarContent}
        </div>
        <div class="sider-message-content">
          ${navigationHtml}
          ${messageContent}
          ${actionButtonsHtml}
        </div>
      `;
      
      // Restore stored response versions if they exist
      if (responseVersions && role === 'assistant') {
        try {
          const versions = JSON.parse(responseVersions);
          messageDiv.setAttribute('data-response-versions', responseVersions);
          messageDiv.setAttribute('data-current-version', currentVersion.toString());
          messageDiv.setAttribute('data-total-versions', totalVersions.toString());
        } catch (e) {
          console.error('Error parsing response versions:', e);
        }
      }
      
      // Add event listeners for action buttons
      if (role === 'assistant' && !isThinking) {
        const actionBtns = messageDiv.querySelectorAll('.sider-message-action-btn');
        actionBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            this.handleMessageAction(action, messageDiv, text);
          });
        });
        
        // Add event listeners for navigation buttons
        const navPrev = messageDiv.querySelector('.sider-nav-prev');
        const navNext = messageDiv.querySelector('.sider-nav-next');
        if (navPrev) {
          navPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateResponse(messageDiv, 'prev');
          });
        }
        if (navNext) {
          navNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateResponse(messageDiv, 'next');
          });
        }
      }
      
      messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
      
      return messageDiv;
    },
    
    // Handle message action buttons
    handleMessageAction: function(action, messageDiv, text) {
      switch (action) {
        case 'copy':
          navigator.clipboard.writeText(text).then(() => {
            const btn = messageDiv.querySelector(`[data-action="copy"]`);
            if (btn) {
              const originalTitle = btn.getAttribute('title');
              btn.setAttribute('title', 'Copied!');
              setTimeout(() => {
                btn.setAttribute('title', originalTitle);
              }, 2000);
            }
          }).catch(err => {
            console.error('Failed to copy text:', err);
          });
          break;
        case 'add-to-list':
          // TODO: Implement add to list functionality
          console.log('Add to list:', text);
          break;
        case 'regenerate':
          this.regenerateResponse(messageDiv);
          break;
        case 'quote':
          // TODO: Implement quote functionality
          console.log('Quote message:', text);
          break;
        case 'share':
          // TODO: Implement share functionality
          console.log('Share message:', text);
          break;
        case 'read-aloud':
          // TODO: Implement read aloud functionality
          console.log('Read aloud:', text);
          break;
      }
    },
    
    // Navigate between response versions
    navigateResponse: function(messageDiv, direction) {
      const currentVersion = parseInt(messageDiv.getAttribute('data-current-version') || '1');
      const totalVersions = parseInt(messageDiv.getAttribute('data-total-versions') || '1');
      const responseVersions = messageDiv.getAttribute('data-response-versions');
      
      if (!responseVersions) return;
      
      try {
        const versions = JSON.parse(responseVersions);
        let newVersion = direction === 'next' ? currentVersion + 1 : currentVersion - 1;
        
        if (newVersion < 1 || newVersion > totalVersions) return;
        
        const versionText = versions[newVersion - 1];
        if (versionText) {
          const textElement = messageDiv.querySelector('.sider-message-text');
          if (textElement) {
            textElement.textContent = versionText;
          }
          
          messageDiv.setAttribute('data-current-version', newVersion.toString());
          
          // Update navigation buttons
          const navPrev = messageDiv.querySelector('.sider-nav-prev');
          const navNext = messageDiv.querySelector('.sider-nav-next');
          const navCounter = messageDiv.querySelector('.sider-nav-counter');
          
          if (navPrev) navPrev.disabled = newVersion === 1;
          if (navNext) navNext.disabled = newVersion === totalVersions;
          if (navCounter) navCounter.textContent = `${newVersion}/${totalVersions}`;
        }
      } catch (e) {
        console.error('Error navigating responses:', e);
      }
    },
    
    // Regenerate response (like ChatGPT)
    regenerateResponse: async function(assistantMessageDiv) {
      if (!this.lastUserMessage) {
        console.warn('No previous user message found for regeneration');
        return;
      }
      
      // Check authentication
      const isAuthenticated = await this.requireAuth();
      if (!isAuthenticated) {
        return;
      }
      
      // Get current response versions or initialize
      let responseVersions = [];
      let currentVersion = 1;
      let totalVersions = 1;
      
      const storedVersions = assistantMessageDiv.getAttribute('data-response-versions');
      if (storedVersions) {
        try {
          responseVersions = JSON.parse(storedVersions);
          currentVersion = parseInt(assistantMessageDiv.getAttribute('data-current-version') || '1');
          totalVersions = parseInt(assistantMessageDiv.getAttribute('data-total-versions') || '1');
        } catch (e) {
          console.error('Error parsing stored versions:', e);
        }
      } else {
        // Store current response as first version
        const currentText = assistantMessageDiv.querySelector('.sider-message-text')?.textContent || '';
        if (currentText) {
          responseVersions = [currentText];
        }
      }
      
      // Replace current assistant message with "Thinking..."
      this.updateMessage(assistantMessageDiv, 'assistant', 'Thinking...');
      assistantMessageDiv.classList.add('sider-thinking');
      
      // Set generation state
      this.isGenerating = true;
      this.currentAbortController = new AbortController();
      this.currentThinkingMsg = assistantMessageDiv;
      
      // Update button visibility
      if (window.toggleMicSendButton) window.toggleMicSendButton();
      
      const { text, imageUrl, documentAttachments, documentCompletionOptions, model } = this.lastUserMessage;
      
      try {
        if (!this.currentConversationId) {
          if (window.SiderChatService) {
            const conversationResult = await window.SiderChatService.createConversation(
              text.substring(0, 50) || 'New Conversation',
              model || this.getActiveModel()
            );
            
            if (conversationResult.success && conversationResult.data) {
              this.currentConversationId = conversationResult.data.id || 
                                           conversationResult.data.conversation_id || 
                                           conversationResult.data.cid ||
                                           conversationResult.data._id;
            } else {
              this.updateMessage(assistantMessageDiv, 'assistant', `Error creating conversation: ${conversationResult.error || 'Unknown error'}`);
              return;
            }
          } else {
            this.updateMessage(assistantMessageDiv, 'assistant', 'Error: Chat service not available');
            return;
          }
        }
        
        // Use the same API path as the original message
        if (!documentCompletionOptions && imageUrl && window.SiderChatService && this.currentConversationId) {
          console.log('🔄 Regenerating with sendMessageWithImage API...');
          const sendResult = await window.SiderChatService.sendMessageWithImage(
            this.currentConversationId,
            text,
            model,
            imageUrl,
            false,
            this.currentAbortController
          );
          
          if (sendResult.success) {
            try {
              const conversationResult = await window.SiderChatService.getConversation(this.currentConversationId);
              if (conversationResult.success && conversationResult.data) {
                let responseText = '';
                if (conversationResult.data.messages && Array.isArray(conversationResult.data.messages)) {
                  const assistantMessages = conversationResult.data.messages
                    .filter(msg => msg.role === 'assistant' || msg.type === 'assistant')
                    .reverse();
                  if (assistantMessages.length > 0) {
                    responseText = assistantMessages[0].content || 
                                 assistantMessages[0].text || 
                                 assistantMessages[0].message || 
                                 '';
                  }
                } else if (conversationResult.data.content) {
                  responseText = conversationResult.data.content;
                } else if (conversationResult.data.message) {
                  responseText = conversationResult.data.message;
                }
                
                if (responseText) {
                  // Add new response to versions array
                  responseVersions.push(responseText);
                  totalVersions = responseVersions.length;
                  currentVersion = totalVersions;
                  
                  // Update message with new response and navigation
                  this.updateMessageWithVersions(assistantMessageDiv, responseText, responseVersions, currentVersion, totalVersions);
                } else {
                  this.updateMessage(assistantMessageDiv, 'assistant', 'Message sent successfully. Waiting for response...');
                }
              } else {
                this.updateMessage(assistantMessageDiv, 'assistant', 'Message sent successfully. Waiting for response...');
              }
            } catch (error) {
              console.error('Error fetching conversation after regenerate:', error);
              this.updateMessage(assistantMessageDiv, 'assistant', 'Message sent successfully. Waiting for response...');
            }
          } else {
            this.updateMessage(assistantMessageDiv, 'assistant', `Error: ${sendResult.error || 'Failed to regenerate message'}`);
          }
        } else if (window.SiderChatService && this.currentConversationId) {
          console.log('🔄 Regenerating with chat completions API...');
          const completionOptions = documentCompletionOptions || {};
          completionOptions.abortController = this.currentAbortController;
          const completionsResult = await window.SiderChatService.chatCompletions(
            this.currentConversationId,
            text,
            documentCompletionOptions ? this.getActiveModel() : (model || this.getActiveModel()),
            completionOptions
          );
          
          if (completionsResult.success && completionsResult.data) {
            let responseText = '';
            if (completionsResult.data.choices && completionsResult.data.choices[0]) {
              responseText = completionsResult.data.choices[0].message?.content || 
                           completionsResult.data.choices[0].text || 
                           completionsResult.data.choices[0].content || '';
            } else if (completionsResult.data.content) {
              responseText = completionsResult.data.content;
            } else if (completionsResult.data.message) {
              responseText = completionsResult.data.message;
            } else if (completionsResult.data.text) {
              responseText = completionsResult.data.text;
            } else if (typeof completionsResult.data === 'string') {
              responseText = completionsResult.data;
            } else {
              responseText = JSON.stringify(completionsResult.data);
            }
            
            if (responseText) {
              // Add new response to versions array
              responseVersions.push(responseText);
              totalVersions = responseVersions.length;
              currentVersion = totalVersions;
              
              // Update message with new response and navigation
              this.updateMessageWithVersions(assistantMessageDiv, responseText, responseVersions, currentVersion, totalVersions);
            } else {
              this.updateMessage(assistantMessageDiv, 'assistant', 'Response received but no content found');
            }
          } else {
            this.updateMessage(assistantMessageDiv, 'assistant', `Error: ${completionsResult.error || 'Failed to regenerate message'}`);
          }
        } else {
          this.updateMessage(assistantMessageDiv, 'assistant', 'Error: Chat service not available');
        }
      } catch (error) {
        console.error('Regenerate error:', error);
        // Check if error is due to abort
        if (error.name === 'AbortError') {
          this.updateMessage(assistantMessageDiv, 'assistant', 'Generation stopped by user.');
        } else {
          this.updateMessage(assistantMessageDiv, 'assistant', `Error: ${error.message || 'Failed to regenerate response'}`);
        }
      } finally {
        // Reset generation state
        this.isGenerating = false;
        this.currentAbortController = null;
        this.currentThinkingMsg = null;
        if (window.toggleMicSendButton) window.toggleMicSendButton();
      }
    },
    
    // Save response versions to in-memory cache instead of localStorage
    saveResponseVersions: function(messageDiv, versions) {
      if (!this.currentConversationId || !versions || versions.length === 0) return;
      
      try {
        // Get assistant message index (count only assistant messages, not all messages)
        const messagesContainer = document.getElementById('sider-chat-messages');
        if (!messagesContainer) return;
        
        const allMessages = Array.from(messagesContainer.querySelectorAll('.sider-message'));
        const messageIndex = allMessages.indexOf(messageDiv);
        
        if (messageIndex === -1) return;
        
        // Count only assistant messages up to this point
        let assistantMessageIndex = 0;
        for (let i = 0; i < messageIndex; i++) {
          const msg = allMessages[i];
          const isAssistant = msg.classList.contains('sider-message-assistant');
          if (isAssistant) {
            assistantMessageIndex++;
          }
        }
        // The current message is also an assistant message, so this is its index
        
        // Store versions in memory using conversation and assistant message index
        if (!this.responseVersionCache.has(this.currentConversationId)) {
          this.responseVersionCache.set(this.currentConversationId, new Map());
        }
        
        const conversationCache = this.responseVersionCache.get(this.currentConversationId);
        conversationCache.set(assistantMessageIndex, [...versions]);
        
        console.log('💾 Cached response versions:', this.currentConversationId, 'assistant index:', assistantMessageIndex, 'versions count:', versions.length);
      } catch (error) {
        console.error('Error saving response versions:', error);
      }
    },
    
    // Load response versions from in-memory cache
    loadResponseVersions: function(conversationId, messageIndex) {
      if (!conversationId || messageIndex === undefined) return null;
      
      try {
        const conversationCache = this.responseVersionCache.get(conversationId);
        if (conversationCache && conversationCache.has(messageIndex)) {
          const versions = conversationCache.get(messageIndex);
          console.log('📂 Loaded cached response versions:', conversationId, 'index:', messageIndex, 'versions:', versions.length, 'content preview:', versions[0]?.substring(0, 50));
          return versions;
        }
        
        console.log('📂 No cached versions found for:', conversationId, 'index:', messageIndex);
      } catch (error) {
        console.error('Error loading response versions:', error);
      }
      
      return null;
    },
    
    // Update message with response versions and navigation
    updateMessageWithVersions: function(messageDiv, text, versions, currentVersion, totalVersions) {
      if (!messageDiv) return;
      
      messageDiv.classList.remove('sider-thinking');
      const textElement = messageDiv.querySelector('.sider-message-text');
      if (textElement) {
        textElement.textContent = text;
      }
      
      // Store versions in data attributes
      messageDiv.setAttribute('data-response-versions', JSON.stringify(versions));
      messageDiv.setAttribute('data-current-version', currentVersion.toString());
      messageDiv.setAttribute('data-total-versions', totalVersions.toString());
      
      // Persist version history to localStorage
      this.saveResponseVersions(messageDiv, versions);
      
      // Add or update navigation UI
      const messageContent = messageDiv.querySelector('.sider-message-content');
      if (messageContent && totalVersions > 1) {
        let navigation = messageContent.querySelector('.sider-response-navigation');
        if (!navigation) {
          // Create navigation if it doesn't exist
          navigation = document.createElement('div');
          navigation.className = 'sider-response-navigation';
          messageContent.insertBefore(navigation, messageContent.firstChild);
        }
        
        navigation.innerHTML = `
          <button class="sider-nav-btn sider-nav-prev" ${currentVersion === 1 ? 'disabled' : ''} data-action="prev-response" title="Previous response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="sider-nav-counter">${currentVersion}/${totalVersions}</span>
          <button class="sider-nav-btn sider-nav-next" ${currentVersion === totalVersions ? 'disabled' : ''} data-action="next-response" title="Next response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `;
        
        // Re-attach event listeners
        const navPrev = navigation.querySelector('.sider-nav-prev');
        const navNext = navigation.querySelector('.sider-nav-next');
        if (navPrev) {
          navPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateResponse(messageDiv, 'prev');
          });
        }
        if (navNext) {
          navNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateResponse(messageDiv, 'next');
          });
        }
      }
      
      // Re-add action buttons if they don't exist
      if (!messageContent.querySelector('.sider-message-actions')) {
        const actionButtonsHtml = `
          <div class="sider-message-actions">
            <button class="sider-message-action-btn" title="Copy" data-action="copy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="sider-message-action-btn" title="Add to list" data-action="add-to-list">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="12" x2="15" y2="12"></line>
                <line x1="12" y1="9" x2="12" y2="15"></line>
                <circle cx="19" cy="5" r="1.5"></circle>
              </svg>
            </button>
            <button class="sider-message-action-btn" title="Regenerate" data-action="regenerate">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            <button class="sider-message-action-btn" title="Quote" data-action="quote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
              </svg>
            </button>
            <button class="sider-message-action-btn" title="Share" data-action="share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
            <button class="sider-message-action-btn" title="Read aloud" data-action="read-aloud">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
        `;
        messageContent.insertAdjacentHTML('beforeend', actionButtonsHtml);
        
        // Re-attach action button listeners
        const actionBtns = messageDiv.querySelectorAll('.sider-message-action-btn');
        actionBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            this.handleMessageAction(action, messageDiv, text);
          });
        });
      }
      
      this.scrollToBottom();
    },
    
    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    // Update message
    updateMessage: function(messageDiv, role, text) {
      if (!messageDiv) return;
      
      messageDiv.classList.remove('sider-thinking');
      const textElement = messageDiv.querySelector('.sider-message-text');
      if (textElement) {
        textElement.textContent = text;
      }
      
      // Store first version if this is a new assistant message
      if (role === 'assistant' && !messageDiv.getAttribute('data-response-versions')) {
        messageDiv.setAttribute('data-response-versions', JSON.stringify([text]));
        messageDiv.setAttribute('data-current-version', '1');
        messageDiv.setAttribute('data-total-versions', '1');
      }
      
      // Add action buttons if this is an assistant message and they don't exist yet
      if (role === 'assistant' && !messageDiv.querySelector('.sider-message-actions')) {
        const messageContent = messageDiv.querySelector('.sider-message-content');
        if (messageContent) {
          const actionButtonsHtml = `
            <div class="sider-message-actions">
              <button class="sider-message-action-btn" title="Copy" data-action="copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="sider-message-action-btn" title="Add to list" data-action="add-to-list">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                  <line x1="12" y1="9" x2="12" y2="15"></line>
                  <circle cx="19" cy="5" r="1.5"></circle>
                </svg>
              </button>
              <button class="sider-message-action-btn" title="Regenerate" data-action="regenerate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
              <button class="sider-message-action-btn" title="Quote" data-action="quote">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </button>
              <button class="sider-message-action-btn" title="Share" data-action="share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
              <button class="sider-message-action-btn" title="Read aloud" data-action="read-aloud">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          `;
          messageContent.insertAdjacentHTML('beforeend', actionButtonsHtml);
          
          // Add event listeners
          const actionBtns = messageDiv.querySelectorAll('.sider-message-action-btn');
          actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const action = btn.getAttribute('data-action');
              this.handleMessageAction(action, messageDiv, text);
            });
          });
        }
      }
      
      this.scrollToBottom();
    },
    
    // Handle summarize click
    handleSummarizeClick: async function() {
      // Check authentication before summarizing
      const isAuthenticated = await this.requireAuth();
      if (!isAuthenticated) {
        return;
      }
      
      if (!this.currentTab || !this.currentTab.id) return;
      
      const chatContainer = document.getElementById('sider-chat-container');
      const welcome = document.querySelector('.sider-welcome');
      const messagesContainer = document.getElementById('sider-chat-messages');
      const summarizeCard = document.getElementById('sider-summarize-card');
      
      if (!chatContainer || !messagesContainer) return;
      
      chatContainer.style.display = 'flex';
      if (welcome) {
        welcome.style.display = 'none';
      }
      if (summarizeCard) {
        summarizeCard.style.display = 'none';
      }
      
      const pageTitle = this.currentTab.title || 'Page';
      const pageUrl = this.currentTab.url || '';
      
      // Show user message
      this.addMessage('user', `📄 Summarize: ${pageTitle}`);
      const thinkingMsg = this.addMessage('assistant', 'Uploading page and generating summary...', true);
      
      try {
        // Get page HTML content from content script
        const pageContent = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'getPageContent'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        
        // Convert page content to a File/Blob
        const pageHtml = pageContent.html || '';
        const pageText = pageContent.text || '';
        const contentToUpload = pageHtml || pageText;
        
        if (!contentToUpload) {
          this.updateMessage(thinkingMsg, 'assistant', 'Error: Could not retrieve page content');
          return;
        }
        
        // Create a Blob from the content
        const blob = new Blob([contentToUpload], { type: 'text/plain' });
        const fileName = `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        const file = new File([blob], fileName, { type: 'text/plain' });
        
        // Calculate hash for the file content (simple hash function)
        async function calculateHash(content) {
          const encoder = new TextEncoder();
          const data = encoder.encode(content);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        const fileHash = await calculateHash(contentToUpload);
        
        // Ensure we have a conversation ID
        if (!this.currentConversationId) {
          if (!window.SiderChatService) {
            this.updateMessage(thinkingMsg, 'assistant', 'Error: Chat service not available');
            return;
          }
          
          const conversationResult = await window.SiderChatService.createConversation(
            `Summarize: ${pageTitle}`,
            this.currentModel
          );
          
          if (conversationResult.success && conversationResult.data) {
            this.currentConversationId = conversationResult.data.conversation_id || conversationResult.data.id;
          } else {
            this.updateMessage(thinkingMsg, 'assistant', `Error: ${conversationResult.error || 'Failed to create conversation'}`);
            return;
          }
        }
        
        // Upload file using ImageService
        if (!window.SiderImageService || !window.SiderImageService.uploadImage) {
          this.updateMessage(thinkingMsg, 'assistant', 'Error: Image service not available');
          return;
        }
        
        this.updateMessage(thinkingMsg, 'assistant', 'Uploading page content...', true);
        
        const uploadResult = await window.SiderImageService.uploadImage(file, {
          conversation_id: this.currentConversationId,
          mime: 'text/plain',
          hash: fileHash,
          meta: JSON.stringify({ url: pageUrl, title: pageTitle, desc: pageTitle, fileFor: '' }),
          app_name: 'ChitChat_Chrome_Ext',
          app_version: '5.21.1',
          tz_name: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          tasks: JSON.stringify([{ type: 'RAG' }]),
          type: 'webpage'
        });
        
        if (!uploadResult.success || !uploadResult.data) {
          this.updateMessage(thinkingMsg, 'assistant', `Error uploading file: ${uploadResult.error || 'Upload failed'}`);
          return;
        }
        
        // API returns fileID (capital ID), not file_id
        const fileId = uploadResult.data.fileID || uploadResult.data.file_id;
        if (!fileId) {
          this.updateMessage(thinkingMsg, 'assistant', 'Error: No fileID returned from upload');
          return;
        }
        
        // Check if file is ready for processing
        const textReady = uploadResult.data.textReady;
        if (!textReady) {
          // Wait a bit and check again, or proceed anyway
          console.log('File textReady is false, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Call chatCompletions with file_id
        this.updateMessage(thinkingMsg, 'assistant', 'Generating summary...', true);
        
        // Use a prompt that explicitly references the uploaded file content
        const summarizePrompt = `Summarize the content of the webpage`;
        
        const completionsResult = await window.SiderChatService.chatCompletions(
          this.currentConversationId,
          summarizePrompt,
          this.currentModel,
          {
            multi_content: [
              {
                type: 'file',
                file: {
                  type: 'webpage',
                  file_id: fileId
                }
              },
              {
                type: 'text',
                text: summarizePrompt,
                user_input_text: summarizePrompt
              }
            ]
          }
        );
        
        if (completionsResult.success && completionsResult.data) {
          // Extract response text
          let responseText = '';
          if (completionsResult.data.choices && completionsResult.data.choices[0]) {
            responseText = completionsResult.data.choices[0].message?.content || 
                         completionsResult.data.choices[0].text || 
                         completionsResult.data.choices[0].content || '';
          } else if (completionsResult.data.content) {
            responseText = completionsResult.data.content;
          } else if (completionsResult.data.message) {
            responseText = completionsResult.data.message;
          } else if (completionsResult.data.text) {
            responseText = completionsResult.data.text;
          } else if (typeof completionsResult.data === 'string') {
            responseText = completionsResult.data;
          } else {
            responseText = JSON.stringify(completionsResult.data);
          }
          
          if (responseText) {
            this.updateMessage(thinkingMsg, 'assistant', responseText);
          } else {
            this.updateMessage(thinkingMsg, 'assistant', 'Summary generated but no content found');
          }
        } else {
          // Provide user-friendly error messages
          let errorMessage = completionsResult.error || 'Failed to generate summary';
          if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
            errorMessage = 'The server is temporarily unavailable. Please try again in a moment. The request was automatically retried but the server is still not responding.';
          } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
            errorMessage = 'Server error occurred. Please try again in a moment.';
          } else if (errorMessage.includes('504') || errorMessage.includes('Gateway Timeout')) {
            errorMessage = 'The request took too long to process. Please try again.';
          }
          this.updateMessage(thinkingMsg, 'assistant', `Error: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error in handleSummarizeClick:', error);
        this.updateMessage(thinkingMsg, 'assistant', `Error: ${error.message || 'Failed to summarize page'}`);
      }
    },
    
    // Handle action
    handleAction: async function(action) {
      // Check authentication for actions that require it
      if (action === 'fullscreen' || action === 'research' || action === 'highlights' || action === 'slides') {
        const isAuthenticated = await this.requireAuth();
        if (!isAuthenticated) {
          return;
        }
      }
      
      const chatContainer = document.getElementById('sider-chat-container');
      const welcome = document.querySelector('.sider-welcome');
      const ocrContainer = document.getElementById('sider-ocr-container');
      const panelFooter = document.querySelector('.sider-panel-footer');
      const panelBody = document.getElementById('sider-panel-body');
      
      switch(action) {
        case 'fullscreen':
          // Navigate to full screen chat
          chrome.tabs.create({
            url: 'http://localhost:3000/chat'
          });
          break;
        default:
          // Unknown action
      }
    },
    
    // Show image preview
    showImagePreview: function(src, alt = 'Image') {
      const imagePreviewSection = document.getElementById('sider-image-preview-section');
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      const input = document.getElementById('sider-chat-input');
      
      if (selectedTextSection) {
        selectedTextSection.style.display = 'none';
      }
      
      if (imagePreviewSection) {
        const imagesContainer = imagePreviewSection.querySelector('div:first-child');
        if (!imagesContainer) return;
        
        // Check if this image already exists to prevent duplicates
        const existingImages = imagesContainer.querySelectorAll('.sider-image-preview-item');
        for (let existingImg of existingImages) {
          if (existingImg.getAttribute('data-image-src') === src) {
            // Image already exists, don't add duplicate
            return;
          }
        }
        
        const imageWrapper = document.createElement('div');
        imageWrapper.style.position = 'relative';
        imageWrapper.style.flexShrink = '0';
        imageWrapper.className = 'sider-image-preview-item';
        imageWrapper.setAttribute('data-image-src', src);
        imageWrapper.setAttribute('data-image-alt', alt);
        
        const imageThumb = document.createElement('img');
        imageThumb.src = src;
        imageThumb.alt = alt || 'Image';
        imageThumb.style.width = '60px';
        imageThumb.style.height = '60px';
        imageThumb.style.objectFit = 'cover';
        imageThumb.style.borderRadius = '8px';
        imageThumb.style.border = '1px solid #e5e7eb';
        imageThumb.style.display = 'block';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sider-image-preview-close-btn';
        closeBtn.title = 'Remove image';
        closeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; color: #6b7280; transition: all 0.2s; z-index: 10;';
        closeBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          imageWrapper.remove();
          const remainingImages = imagesContainer.querySelectorAll('.sider-image-preview-item');
          if (remainingImages.length === 0) {
            imagePreviewSection.style.display = 'none';
          }
        };
        
        imageWrapper.appendChild(imageThumb);
        imageWrapper.appendChild(closeBtn);
        
        let imagesRow = imagesContainer.querySelector('.sider-images-row');
        if (!imagesRow) {
          imagesRow = document.createElement('div');
          imagesRow.style.cssText = 'display: flex; flex-direction: row; gap: 8px; align-items: flex-start; flex-wrap: wrap;';
          imagesRow.className = 'sider-images-row';
          const actionButtonsDiv = imagesContainer.querySelector('div:last-child');
          if (actionButtonsDiv && actionButtonsDiv.querySelector('.sider-image-action-btn')) {
            imagesContainer.insertBefore(imagesRow, actionButtonsDiv);
          } else {
            imagesContainer.insertBefore(imagesRow, imagesContainer.firstChild);
          }
        }
        
        imagesRow.appendChild(imageWrapper);
        imagePreviewSection.style.display = 'block';
        
        if (input) {
          input.value = '';
          input.placeholder = 'Ask anything, @models, / prompts';
          this.autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
        }
        
        // Upload image to server
        this.uploadImageToServer(src, alt, imageWrapper);
        
        const imageActionBtns = imagePreviewSection.querySelectorAll('.sider-image-action-btn');
        imageActionBtns.forEach(btn => {
          const action = btn.getAttribute('data-action');
          
          // Special handling for translate button with arrow
          if (action === 'translate-image') {
            const translateText = btn.querySelector('.sider-translate-text');
            const translateArrow = btn.querySelector('.sider-translate-arrow');
            const languageDropdown = btn.querySelector('.sider-translate-language-dropdown');
            
            // Prevent default button click behavior
            btn.onclick = (e) => {
              // If clicking on arrow, don't trigger translate action
              if (e.target === translateArrow || translateArrow.contains(e.target)) {
                return;
              }
              // If clicking on dropdown, don't trigger translate action
              if (languageDropdown && (e.target === languageDropdown || languageDropdown.contains(e.target))) {
                return;
              }
              
              // Otherwise, trigger translate action
              e.stopPropagation();
              const allImages = Array.from(imagesContainer.querySelectorAll('.sider-image-preview-item')).map(item => ({
                src: item.getAttribute('data-image-src'),
                alt: item.getAttribute('data-image-alt'),
                fileId: item.getAttribute('data-file-id'),
                fileUrl: item.getAttribute('data-file-url')
              }));
              this.handleImageAction(action, allImages.length === 1 ? allImages[0].src : allImages, allImages.length === 1 ? allImages[0].alt : 'Images');
            };
            
            // Handle click on translate text (main button) - trigger translate action
            if (translateText) {
              translateText.onclick = (e) => {
                e.stopPropagation();
                const allImages = Array.from(imagesContainer.querySelectorAll('.sider-image-preview-item')).map(item => ({
                  src: item.getAttribute('data-image-src'),
                  alt: item.getAttribute('data-image-alt'),
                  fileId: item.getAttribute('data-file-id'),
                  fileUrl: item.getAttribute('data-file-url')
                }));
                this.handleImageAction(action, allImages.length === 1 ? allImages[0].src : allImages, allImages.length === 1 ? allImages[0].alt : 'Images');
              };
            }
            
            // Handle click on arrow - toggle dropdown
            if (translateArrow && languageDropdown) {
              translateArrow.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const isVisible = languageDropdown.style.display !== 'none';
                
                // Close all other dropdowns first
                document.querySelectorAll('.sider-translate-language-dropdown').forEach(dropdown => {
                  if (dropdown !== languageDropdown) {
                    dropdown.style.display = 'none';
                  }
                });
                
                if (!isVisible) {
                  // Calculate position for fixed dropdown
                  const buttonRect = btn.getBoundingClientRect();
                  const dropdownMaxHeight = 300; // max-height
                  const spaceAbove = buttonRect.top;
                  const spaceBelow = window.innerHeight - buttonRect.bottom;
                  
                  let top, maxHeight;
                  
                  // Position above the button if there's enough space, otherwise below
                  if (spaceAbove >= dropdownMaxHeight + 8) {
                    // Position above
                    top = buttonRect.top - dropdownMaxHeight - 4;
                    maxHeight = dropdownMaxHeight;
                  } else if (spaceAbove >= 200) {
                    // Position above with reduced height
                    top = 4;
                    maxHeight = spaceAbove - 8;
                  } else {
                    // Position below if not enough space above
                    top = buttonRect.bottom + 4;
                    maxHeight = Math.min(dropdownMaxHeight, spaceBelow - 8);
                  }
                  
                  // Ensure dropdown doesn't go off-screen
                  const dropdownWidth = 180; // min-width
                  let left = buttonRect.left;
                  
                  // Adjust if dropdown would go off right edge
                  if (left + dropdownWidth > window.innerWidth - 8) {
                    left = window.innerWidth - dropdownWidth - 8;
                  }
                  
                  // Ensure minimum left margin
                  if (left < 8) {
                    left = 8;
                  }
                  
                  languageDropdown.style.top = `${top}px`;
                  languageDropdown.style.left = `${left}px`;
                  languageDropdown.style.maxHeight = `${maxHeight}px`;
                  languageDropdown.style.minWidth = `${Math.max(dropdownWidth, buttonRect.width)}px`;
                  languageDropdown.style.display = 'block';
                } else {
                  languageDropdown.style.display = 'none';
                }
              };
            }
            
            // Handle language selection
            if (languageDropdown) {
              const languageItems = languageDropdown.querySelectorAll('.sider-translate-language-item');
              const input = document.getElementById('sider-chat-input');
              
              languageItems.forEach(item => {
                item.onclick = (e) => {
                  e.stopPropagation();
                  const langCode = item.getAttribute('data-lang');
                  const langName = item.getAttribute('data-lang-name') || item.textContent.trim() || 'English';
                  
                  // Update selected language
                  this.selectedTranslateLanguage = langCode;
                  
                  // Update UI - mark selected item
                  languageItems.forEach(li => li.classList.remove('selected'));
                  item.classList.add('selected');
                  
                  // Populate input field with translation prompt
                  if (input) {
                    input.value = `Translate all text in this image to ${langName}`;
                    this.autoResize(input);
                    if (window.toggleMicSendButton) window.toggleMicSendButton();
                    input.focus();
                  }
                  
                  // Close dropdown
                  languageDropdown.style.display = 'none';
                  
                  // Save preference
                  chrome.storage.local.set({ sider_translate_language: langCode });
                };
              });
              
              // Mark default selected language
              const defaultItem = languageDropdown.querySelector(`[data-lang="${this.selectedTranslateLanguage}"]`);
              if (defaultItem) {
                defaultItem.classList.add('selected');
              }
            }
          } else {
            // Regular button click handler for other actions
            btn.onclick = (e) => {
              e.stopPropagation();
              const allImages = Array.from(imagesContainer.querySelectorAll('.sider-image-preview-item')).map(item => ({
                src: item.getAttribute('data-image-src'),
                alt: item.getAttribute('data-image-alt'),
                fileId: item.getAttribute('data-file-id'),
                fileUrl: item.getAttribute('data-file-url')
              }));
              this.handleImageAction(action, allImages.length === 1 ? allImages[0].src : allImages, allImages.length === 1 ? allImages[0].alt : 'Images');
            };
          }
        });
        
        // Close dropdown when clicking outside
        setTimeout(() => {
          const handleOutsideClick = (e) => {
            const translateDropdowns = document.querySelectorAll('.sider-translate-language-dropdown');
            translateDropdowns.forEach(dropdown => {
              if (dropdown.style.display !== 'none') {
                const translateBtn = dropdown.closest('[data-action="translate-image"]');
                if (translateBtn && !translateBtn.contains(e.target)) {
                  dropdown.style.display = 'none';
                }
              }
            });
          };
          document.addEventListener('click', handleOutsideClick);
        }, 100);
      }
    },
    
    // Upload image to server
    uploadImageToServer: async function(src, alt, imageWrapper) {
      try {
        // Convert data URL or URL to File/Blob
        let file;
        let fileName = alt || 'image.png';
        
        if (src.startsWith('data:')) {
          // Data URL - convert to Blob
          const response = await fetch(src);
          const blob = await response.blob();
          
          // Determine file extension from MIME type
          const mimeType = blob.type || 'image/png';
          const extension = mimeType.split('/')[1] || 'png';
          if (!fileName.includes('.')) {
            fileName = `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
          }
          
          file = new File([blob], fileName, { type: mimeType });
        } else {
          // URL - fetch and convert to File
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            
            // Determine file extension from URL or MIME type
            const urlExtension = src.split('.').pop()?.split('?')[0] || 'png';
            const mimeType = blob.type || `image/${urlExtension}`;
            if (!fileName.includes('.')) {
              fileName = `${fileName.replace(/\.[^/.]+$/, '')}.${urlExtension}`;
            }
            
            file = new File([blob], fileName, { type: mimeType });
          } catch (fetchError) {
            console.error('Error fetching image from URL:', fetchError);
            // If fetch fails (CORS), try to create from canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    const urlExtension = src.split('.').pop()?.split('?')[0] || 'png';
                    if (!fileName.includes('.')) {
                      fileName = `${fileName.replace(/\.[^/.]+$/, '')}.${urlExtension}`;
                    }
                    file = new File([blob], fileName, { type: blob.type || 'image/png' });
                    await this.performUpload(file, imageWrapper);
                  }
                }, 'image/png');
              } catch (canvasError) {
                console.error('Error converting image to canvas:', canvasError);
              }
            };
            img.onerror = () => {
              console.error('Error loading image for upload');
            };
            img.src = src;
            return; // Will continue in img.onload
          }
        }
        
        // Perform upload
        await this.performUpload(file, imageWrapper);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    },
    
    // Perform the actual upload
    performUpload: async function(file, imageWrapper) {
      if (!window.SiderImageService || !window.SiderImageService.uploadImage) {
        console.error('ImageService not available for upload');
        return;
      }
      
      // Show uploading state (optional - add a small indicator)
      imageWrapper.setAttribute('data-upload-status', 'uploading');
      
      try {
        // Get conversation ID if available
        const conversationId = this.currentConversationId || '';
        
        // Determine MIME type
        const mimeType = file.type || 'image/png';
        
        // Upload file using ImageService
        const result = await window.SiderImageService.uploadImage(file, {
          conversation_id: conversationId,
          mime: mimeType,
          hash: '',
          meta: '',
          app_name: '',
          app_version: '',
          tz_name: '',
          tasks: '[]'
        });
        
        if (result.success && result.data) {
          // Store uploaded file info
          // ImageService returns fileID, cdnURL, file_id, file_url, etc.
          const fileId = result.data.fileID || result.data.file_id;
          const fileUrl = result.data.cdnURL || result.data.signedCDNURL || result.data.file_url || result.data.storage_url;
          imageWrapper.setAttribute('data-file-id', fileId || '');
          imageWrapper.setAttribute('data-file-url', fileUrl || '');
          imageWrapper.setAttribute('data-upload-status', 'uploaded');
          
          console.log('✅ Image uploaded successfully:', result.data);
        } else {
          console.error('Failed to upload image:', result.error);
          imageWrapper.setAttribute('data-upload-status', 'failed');
        }
      } catch (error) {
        console.error('Error during upload:', error);
        imageWrapper.setAttribute('data-upload-status', 'failed');
      }
    },
    
    // Handle image action
    handleImageAction: function(action, src, alt) {
      const input = document.getElementById('sider-chat-input');
      if (!input) return;
      
      let prompt = '';
      
      switch (action) {
        case 'extract-text':
          prompt = 'Extract all text from this image';
          break;
        case 'math-solver':
          prompt = 'Solve the math problems in this image';
          break;
        case 'translate-image':
          // Get language name from dropdown or fallback to mapping
          let langName = 'English';
          const imagePreviewSection = document.getElementById('sider-image-preview-section');
          if (imagePreviewSection) {
            const translateBtn = imagePreviewSection.querySelector('[data-action="translate-image"]');
            if (translateBtn) {
              const languageDropdown = translateBtn.querySelector('.sider-translate-language-dropdown');
              if (languageDropdown) {
                const selectedItem = languageDropdown.querySelector(`[data-lang="${this.selectedTranslateLanguage}"]`);
                if (selectedItem) {
                  langName = selectedItem.getAttribute('data-lang-name') || selectedItem.textContent.trim() || 'English';
                }
              }
            }
          }
          
          // Fallback language mapping if dropdown not found
          if (langName === 'English') {
            const langNames = {
              'en': 'English',
              'es': 'Spanish',
              'es-co': 'Spanish (Colombia)',
              'es-mx': 'Mexican Spanish',
              'fr': 'French',
              'de': 'German',
              'it': 'Italian',
              'pt': 'Portuguese',
              'pt-br': 'Brazilian Portuguese',
              'ru': 'Russian',
              'ja': 'Japanese',
              'ko': 'Korean',
              'zh': 'Chinese',
              'ar': 'Arabic',
              'hi': 'Hindi',
              'nl': 'Dutch',
              'pl': 'Polish',
              'tr': 'Turkish',
              'vi': 'Vietnamese',
              'th': 'Thai',
              'id': 'Indonesian'
            };
            langName = langNames[this.selectedTranslateLanguage] || 'English';
          }
          
          prompt = `Translate all text in this image to ${langName}`;
          break;
      }
      
      if (prompt) {
        input.value = prompt;
        this.autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        
        // Automatically send the message
        setTimeout(() => {
          this.sendMessage();
        }, 100);
      }
    },
    
    // Convert image URL to data URL
    convertImageUrlToDataUrl: function(url) {
      return new Promise((resolve, reject) => {
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
        img.onerror = () => {
          // Try using fetch as fallback
          fetch(url)
            .then(response => response.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
            .catch(reject);
        };
        img.src = url;
      });
    },
    
    // Handle selection action
    handleSelectionAction: function(action, text) {
      if (!text) return;
      
      const input = document.getElementById('sider-chat-input');
      if (!input) return;
      
      let prompt = '';
      
      switch (action) {
        case 'explain':
          prompt = `Explain this text: "${text}"`;
          break;
        case 'translate':
          prompt = `Translate to English: "${text}"`;
          break;
        case 'summarize':
          prompt = `Summarize this text: "${text}"`;
          break;
        case 'improve':
          prompt = `Improve the writing of this text: "${text}"`;
          break;
        case 'fix-grammar':
          prompt = `Fix spelling and grammar in this text: "${text}"`;
          break;
        case 'answer':
          prompt = `Answer this question: "${text}"`;
          break;
        case 'explain-codes':
          prompt = `Explain this code: "${text}"`;
          break;
        case 'action-items':
          prompt = `Find action items in this text: "${text}"`;
          break;
        case 'shorter':
          prompt = `Make this text shorter: "${text}"`;
          break;
        case 'longer':
          prompt = `Make this text longer: "${text}"`;
          break;
        case 'simplify':
          prompt = `Simplify the language in this text: "${text}"`;
          break;
        case 'tone-professional':
          prompt = `Change the tone of this text to professional: "${text}"`;
          break;
        case 'brainstorm':
          prompt = `Brainstorm about: "${text}"`;
          break;
        case 'outline':
          prompt = `Create an outline for: "${text}"`;
          break;
        case 'blog-post':
          prompt = `Write a blog post about: "${text}"`;
          break;
        default:
          prompt = `${action}: "${text}"`;
      }
      
      if (prompt) {
        input.value = prompt;
        this.autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        
        // Hide the selected text section
        const selectedTextSection = document.getElementById('sider-selected-text-section');
        if (selectedTextSection) {
          selectedTextSection.style.display = 'none';
        }
        
        // Automatically send the message
        setTimeout(() => {
          this.sendMessage();
        }, 100);
      }
    },
    
    // Show more selection actions
    showMoreSelectionActions: function(text) {
      // Remove existing menu if present
      const existingMenu = document.querySelector('.sider-prompt-selector-dropdown');
      if (existingMenu) {
        existingMenu.remove();
      }

      const menu = document.createElement('div');
      menu.className = 'sider-prompt-selector-dropdown';
      menu.style.cssText = `
        position: fixed;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100000;
        min-width: 200px;
        max-height: 400px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      `;
      
      // Header with "Select prompt" and gear icon
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
        font-weight: 600;
        color: #111827;
      `;
      header.innerHTML = `
        <span>Select prompt</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="cursor: pointer; color: #6b7280;">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
        </svg>
      `;
      menu.appendChild(header);
      
      // Prompt options list
      const list = document.createElement('div');
      list.style.cssText = `
        padding: 4px 0;
        max-height: 350px;
        overflow-y: auto;
      `;
      
      const prompts = [
        { label: 'Summarize', action: 'summarize' },
        { label: 'Improve writing', action: 'improve' },
        { label: 'Fix spelling & grammar', action: 'fix-grammar' },
        { label: 'Answer this question', action: 'answer' },
        { label: 'Explain codes', action: 'explain-codes' },
        { label: 'Find action items', action: 'action-items' },
        { label: 'Make shorter', action: 'shorter' },
        { label: 'Make longer', action: 'longer' },
        { label: 'Simplify language', action: 'simplify' },
        { label: 'Change tone (Professional)', action: 'tone-professional' },
        { label: 'Brainstorm about...', action: 'brainstorm' },
        { label: 'Outline...', action: 'outline' },
        { label: 'Blog post...', action: 'blog-post' }
      ];
      
      prompts.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'sider-prompt-option';
        btn.style.cssText = `
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: #111827;
          transition: background-color 0.2s;
        `;
        btn.textContent = item.label;
        btn.onmouseover = () => btn.style.background = '#f3f4f6';
        btn.onmouseout = () => btn.style.background = 'transparent';
        btn.onclick = () => {
          this.handleSelectionAction(item.action, text);
          if (menu.parentNode) {
            document.body.removeChild(menu);
          }
        };
        list.appendChild(btn);
      });
      
      menu.appendChild(list);
      
      const moreBtn = document.getElementById('sider-more-actions-btn');
      if (moreBtn) {
        const rect = moreBtn.getBoundingClientRect();
        const dropdownMaxHeight = 400;
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        let top, maxHeight;
        
        // Always position above the button (like translate dropdown)
        // Calculate approximate dropdown height (header ~50px + items ~40px each)
        const headerHeight = 50;
        const itemHeight = 40;
        const estimatedHeight = Math.min(dropdownMaxHeight, headerHeight + (prompts.length * itemHeight));
        
        // Position above the button
        if (spaceAbove >= estimatedHeight + 8) {
          // Full height above
          top = rect.top - estimatedHeight - 4;
          maxHeight = dropdownMaxHeight;
        } else if (spaceAbove >= 100) {
          // Reduced height above (fit available space)
          top = 4;
          maxHeight = spaceAbove - 8;
        } else {
          // Very little space - position above with minimal height, or below if absolutely necessary
          if (spaceAbove >= 50) {
            top = 4;
            maxHeight = spaceAbove - 8;
          } else {
            // Fallback to below only if absolutely no space above
            top = rect.bottom + 4;
            maxHeight = Math.min(dropdownMaxHeight, spaceBelow - 8);
          }
        }
        
        // Ensure dropdown doesn't go off-screen horizontally
        const dropdownWidth = 200;
        let left = rect.left;
        
        if (left + dropdownWidth > window.innerWidth - 8) {
          left = window.innerWidth - dropdownWidth - 8;
        }
        
        if (left < 8) {
          left = 8;
        }
        
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        menu.style.maxHeight = `${maxHeight}px`;
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
    },
    
    // Setup event listeners
    setupEventListeners: function() {
      const chatInput = document.getElementById('sider-chat-input');
      const sendBtn = document.getElementById('sider-send-btn');
      const micBtn = document.getElementById('sider-mic-btn');
      const newChatBtn = document.getElementById('sider-new-chat-btn');
      const fileInput = document.getElementById('sider-file-input');
      const attachBtn = document.getElementById('sider-attach-btn');
      const readPageBtn = document.getElementById('sider-read-page-btn');
      
      // New Chat button
      newChatBtn?.addEventListener('click', () => {
        this.createNewChat();
      });
      
      // History button
      const historyBtn = document.getElementById('sider-history-btn');
      if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('History button clicked');
          this.openChatHistory();
        });
      } else {
        console.warn('History button not found');
      }
      
      // Bottom action buttons
      const bottomActionBtns = document.querySelectorAll('.sider-bottom-action-btn');
      bottomActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Don't handle click if button is disabled
          if (btn.disabled) return;
          const action = btn.getAttribute('data-action');
          const input = document.getElementById('sider-chat-input');
          if (action === 'think' && input) {
            input.value = input.value ? input.value + ' [Think step by step]' : '[Think step by step]';
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          } else if (action === 'deep-research') {
            if (input) {
              input.value = input.value ? input.value + ' [Deep Research]' : '[Deep Research]';
              this.autoResize(input);
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
      sendBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.sendMessage();
      });
      
      // Stop button
      const stopBtn = document.getElementById('sider-stop-btn');
      stopBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.stopGeneration();
      });
      
      // Toggle mic/send button
      window.toggleMicSendButton = () => {
        const input = document.getElementById('sider-chat-input');
        const micButton = document.getElementById('sider-mic-btn');
        const sendButton = document.getElementById('sider-send-btn');
        const stopButton = document.getElementById('sider-stop-btn');
        
        if (!input || !micButton || !sendButton || !stopButton) {
          setTimeout(() => {
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }, 100);
          return;
        }
        
        // If generating, show stop button and hide others
        if (this.isGenerating) {
          micButton.style.setProperty('display', 'none', 'important');
          sendButton.style.setProperty('display', 'none', 'important');
          stopButton.style.setProperty('display', 'flex', 'important');
          return;
        }
        
        // Otherwise, show send/mic based on text
        stopButton.style.setProperty('display', 'none', 'important');
        const hasText = input.value && input.value.trim().length > 0;
        
        if (hasText) {
          micButton.style.setProperty('display', 'none', 'important');
          sendButton.style.setProperty('display', 'flex', 'important');
        } else {
          micButton.style.setProperty('display', 'flex', 'important');
          sendButton.style.setProperty('display', 'none', 'important');
        }
      };
      
      const toggleMicSendButton = window.toggleMicSendButton;
      
      chatInput?.addEventListener('input', (e) => {
        this.autoResize(e.target);
        toggleMicSendButton();
        
        // Hide summarize card when user starts typing
        const summarizeCard = document.getElementById('sider-summarize-card');
        if (summarizeCard && e.target.value.trim().length > 0) {
          summarizeCard.style.display = 'none';
        }
      });
      
      chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        } else {
          this.autoResize(e.target);
          setTimeout(() => {
            toggleMicSendButton();
          }, 0);
        }
      });
      
      chatInput?.addEventListener('paste', (e) => {
        setTimeout(() => {
          this.autoResize(e.target);
          toggleMicSendButton();
        }, 0);
      });
      
      if (chatInput) {
        toggleMicSendButton();
        setTimeout(() => {
          this.autoResize(chatInput);
          toggleMicSendButton();
        }, 100);
      } else {
        toggleMicSendButton();
      }
      
      // File attachment
      attachBtn?.addEventListener('click', () => {
        fileInput?.click();
      });
      
      fileInput?.addEventListener('change', (e) => {
        const target = e.target;
        const files = Array.from(target.files || []);
        if (!files.length) return;
        this.handleFileAttachments(files);
        target.value = '';
      });
      
      // Read page
      readPageBtn?.addEventListener('click', () => {
        this.readCurrentPage();
      });
      
      // Action buttons
      document.querySelectorAll('.sider-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action;
          this.handleAction(action);
        });
      });
      
      // Summarize button
      const summarizeBtn = document.getElementById('sider-summarize-btn');
      if (summarizeBtn) {
        summarizeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSummarizeClick();
        });
      }
      
      // Summarize card close button
      const summarizeCloseBtn = document.getElementById('sider-summarize-close-btn');
      if (summarizeCloseBtn) {
        summarizeCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const summarizeCard = document.getElementById('sider-summarize-card');
          if (summarizeCard) {
            summarizeCard.style.display = 'none';
            console.log('Summarize card closed');
          }
        });
      }
      
      // Summarize card save button
      const summarizeSaveBtn = document.getElementById('sider-summarize-save-btn');
      if (summarizeSaveBtn) {
        summarizeSaveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Save functionality - can be implemented later
          const originalTitle = summarizeSaveBtn.getAttribute('title');
          summarizeSaveBtn.setAttribute('title', 'Saved!');
          setTimeout(() => {
            summarizeSaveBtn.setAttribute('title', originalTitle || 'Save');
          }, 2000);
          console.log('Save button clicked - save functionality to be implemented');
        });
      }
      
      // Selected text section handlers
      const removeSelectionBtn = document.getElementById('sider-remove-selection-btn');
      if (removeSelectionBtn) {
        removeSelectionBtn.addEventListener('click', () => {
          const selectedTextSection = document.getElementById('sider-selected-text-section');
          const input = document.getElementById('sider-chat-input');
          if (selectedTextSection) {
            selectedTextSection.style.display = 'none';
          }
          if (input) {
            input.value = '';
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }
        });
      }
      
      // Selection action buttons
      const actionButtons = document.querySelectorAll('.sider-selection-actions .sider-action-btn');
      actionButtons.forEach(btn => {
        if (btn.id !== 'sider-more-actions-btn') {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const selectedTextDisplay = document.getElementById('sider-selected-text-display');
            if (action && selectedTextDisplay && selectedTextDisplay.textContent) {
              this.handleSelectionAction(action, selectedTextDisplay.textContent);
            }
          });
        }
      });
      
      // More actions button
      const moreActionsBtn = document.getElementById('sider-more-actions-btn');
      if (moreActionsBtn) {
        moreActionsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedTextDisplay = document.getElementById('sider-selected-text-display');
          if (selectedTextDisplay && selectedTextDisplay.textContent) {
            this.showMoreSelectionActions(selectedTextDisplay.textContent);
          }
        });
      }
      
      // Screenshot button
      const screenshotBtn = document.getElementById('sider-screenshot-btn');
      const screenshotIcon = document.getElementById('sider-screenshot-icon');
      
      // Set screenshot icon
      if (screenshotIcon) {
        screenshotIcon.src = chrome.runtime.getURL('icons/cut.png');
      }
      
      if (screenshotBtn) {
        screenshotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.startScreenshotMode) {
            window.startScreenshotMode();
          }
        });
      }
      
      // Chat control (filter) button
      const filterBtn = document.getElementById('sider-filter-btn');
      const chatControlsPopup = document.getElementById('sider-chat-controls-popup');
      if (filterBtn && chatControlsPopup) {
        filterBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = chatControlsPopup.style.display !== 'none';
          chatControlsPopup.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
          if (chatControlsPopup && chatControlsPopup.style.display !== 'none') {
            if (!chatControlsPopup.contains(e.target) && !filterBtn.contains(e.target)) {
              chatControlsPopup.style.display = 'none';
            }
          }
        });
      }
      
      // AI Model Selector
      const aiSelectorBtn = document.getElementById('sider-ai-selector-btn');
      const aiDropdown = document.getElementById('sider-ai-dropdown');
      
      if (aiSelectorBtn) {
        aiSelectorBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.SiderAIModules) {
            window.SiderAIModules.open();
          } else if (aiDropdown) {
            const isVisible = aiDropdown.style.display !== 'none';
            aiDropdown.style.display = isVisible ? 'none' : 'block';
          }
        });
      }
      
      // AI dropdown options
      if (aiDropdown) {
        const aiOptions = aiDropdown.querySelectorAll('.sider-ai-option');
        aiOptions.forEach(option => {
          option.addEventListener('click', (e) => {
            e.stopPropagation();
            const model = option.getAttribute('data-model');
            if (model) {
              this.updateModel(model);
              if (window.updateAISelectorIcon) {
                window.updateAISelectorIcon(model);
              }
              aiDropdown.style.display = 'none';
              chrome.storage.sync.set({ sider_selected_model: model });
            }
          });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (aiDropdown && aiDropdown.style.display !== 'none') {
            if (!aiDropdown.contains(e.target) && !aiSelectorBtn?.contains(e.target)) {
              aiDropdown.style.display = 'none';
            }
          }
        });
      }
    },
    
    // Setup message listeners
    setupMessageListeners: function() {
      // Prevent duplicate listeners
      if (this.messageListenerSetup) {
        return;
      }
      this.messageListenerSetup = true;
      
      // Listen for screenshot and chat with image from content script
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'SCREENSHOT_CAPTURED' && request.dataUrl) {
          // Check if OCR is open
          const ocrContainer = document.getElementById('sider-ocr-container');
          if (ocrContainer && ocrContainer.style.display !== 'none') {
            // Handle screenshot in OCR - this will be handled by OCR component
            return false;
          } else {
            // Handle screenshot in chat
            this.showImagePreview(request.dataUrl, `screenshot-${Date.now()}.png`);
          }
        } else if (request.type === 'CHAT_WITH_IMAGE') {
          // Ensure we're on the chat tab
          if (window.switchToTab && typeof window.switchToTab === 'function') {
            window.switchToTab('chat');
          } else if (window.SiderChatTab && window.SiderChatTab.switchToChat) {
            window.SiderChatTab.switchToChat();
          }
          
          // Wait a bit for tab to switch, then show image
          setTimeout(() => {
            if (request.dataUrl) {
              // Image is already a data URL
              this.showImagePreview(request.dataUrl, request.alt || 'Image');
            } else if (request.imageUrl) {
              // Image is a URL, need to convert to data URL
              this.convertImageUrlToDataUrl(request.imageUrl).then(dataUrl => {
                this.showImagePreview(dataUrl, request.alt || 'Image');
              }).catch(err => {
                console.error('Error loading image:', err);
                // Fallback: try to show the URL directly (may not work due to CORS)
                this.showImagePreview(request.imageUrl, request.alt || 'Image');
              });
            }
          }, 200);
        } else if (request.type === 'TEXT_ACTION') {
          // Ensure we're on the chat tab
          if (window.switchToTab && typeof window.switchToTab === 'function') {
            window.switchToTab('chat');
          } else if (window.SiderChatTab && window.SiderChatTab.switchToChat) {
            window.SiderChatTab.switchToChat();
          }
          
          // Wait a bit for tab to switch, then handle action
          setTimeout(() => {
            const input = document.getElementById('sider-chat-input');
            if (!input) return false;
            
            if (request.action === 'analyze') {
              // Show selected text section and set up for analysis
              const selectedTextSection = document.getElementById('sider-selected-text-section');
              const selectedTextDisplay = document.getElementById('sider-selected-text-display');
              if (selectedTextSection && selectedTextDisplay) {
                selectedTextDisplay.textContent = request.text;
                selectedTextSection.style.display = 'block';
              }
              input.value = `Analyze this text: "${request.text}"`;
              this.autoResize(input);
              if (window.toggleMicSendButton) window.toggleMicSendButton();
              setTimeout(() => this.sendMessage(), 200);
            } else if (request.action === 'prompt' && request.prompt) {
              // Show selected text section and set up with prompt
              const selectedTextSection = document.getElementById('sider-selected-text-section');
              const selectedTextDisplay = document.getElementById('sider-selected-text-display');
              if (selectedTextSection && selectedTextDisplay) {
                selectedTextDisplay.textContent = request.text;
                selectedTextSection.style.display = 'block';
              }
              input.value = `${request.prompt}: "${request.text}"`;
              this.autoResize(input);
              if (window.toggleMicSendButton) window.toggleMicSendButton();
              setTimeout(() => this.sendMessage(), 200);
            } else if (request.action === 'add-note') {
              // Handle add to notes action
              const selectedTextSection = document.getElementById('sider-selected-text-section');
              const selectedTextDisplay = document.getElementById('sider-selected-text-display');
              if (selectedTextSection && selectedTextDisplay) {
                selectedTextDisplay.textContent = request.text;
                selectedTextSection.style.display = 'block';
              }
              input.value = `Add to notes: "${request.text}"`;
              this.autoResize(input);
              if (window.toggleMicSendButton) window.toggleMicSendButton();
            }
          }, 200);
          return false;
        } else if (request.type === 'TEXT_SELECTED' && request.text) {
          // Ensure we're on the chat tab
          if (window.switchToTab && typeof window.switchToTab === 'function') {
            window.switchToTab('chat');
          } else if (window.SiderChatTab && window.SiderChatTab.switchToChat) {
            window.SiderChatTab.switchToChat();
          }
          
          // Wait a bit for tab to switch, then show selected text
          setTimeout(() => {
            const selectedTextSection = document.getElementById('sider-selected-text-section');
            const selectedTextDisplay = document.getElementById('sider-selected-text-display');
            const removeSelectionBtn = document.getElementById('sider-remove-selection-btn');
            const input = document.getElementById('sider-chat-input');
            const actionButtons = document.querySelectorAll('.sider-action-btn');
            const moreActionsBtn = document.getElementById('sider-more-actions-btn');
            
            if (selectedTextSection && selectedTextDisplay && input) {
              selectedTextDisplay.textContent = request.text;
              selectedTextSection.style.display = 'block';
              
              if (removeSelectionBtn) {
                removeSelectionBtn.onclick = () => {
                  selectedTextSection.style.display = 'none';
                  input.value = '';
                  this.autoResize(input);
                  if (window.toggleMicSendButton) window.toggleMicSendButton();
                };
              }
              
              actionButtons.forEach(btn => {
                if (btn.id !== 'sider-more-actions-btn') {
                  btn.onclick = (e) => {
                    e.stopPropagation();
                    const action = btn.getAttribute('data-action');
                    if (action && request.text) {
                      this.handleSelectionAction(action, request.text);
                    }
                  };
                }
              });
              
              if (moreActionsBtn) {
                moreActionsBtn.onclick = (e) => {
                  e.stopPropagation();
                  this.showMoreSelectionActions(request.text);
                };
              }
            }
          }, 200);
        }
        return false;
      });
    },
    
    // Switch to chat view
    switchToChat: function() {
      // Hide all other tab containers first
      const tabContainers = [
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
      
      tabContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
          container.style.display = 'none';
        }
      });
      
      // Show chat tab container (this contains the welcome section and chat container)
      const chatTabContainer = document.getElementById('sider-chat-tab-container');
      if (chatTabContainer) {
        chatTabContainer.style.display = 'block';
      }
      
      const chatContainer = document.getElementById('sider-chat-container');
      const welcome = document.querySelector('.sider-welcome');
      const messagesContainer = document.getElementById('sider-chat-messages');
      const ocrContainer = document.getElementById('sider-ocr-container');
      const panelFooter = document.querySelector('.sider-panel-footer');
      const panelBody = document.getElementById('sider-panel-body');
      
      if (chatContainer) chatContainer.style.display = 'flex';
      
      // Show welcome section only if there are no messages
      if (welcome && messagesContainer) {
        const hasMessages = messagesContainer.children.length > 0;
        welcome.style.display = hasMessages ? 'none' : 'block';
      } else if (welcome) {
        welcome.style.display = 'block';
      }
      
      if (ocrContainer) ocrContainer.style.display = 'none';
      if (panelFooter) panelFooter.style.display = 'block';
      if (panelBody) panelBody.classList.remove('sider-ocr-active');
    },
    
    // Update current model
    updateModel: function(model) {
      this.currentModel = model;
    },
    
    // Update current tab
    updateCurrentTab: function(tab) {
      this.currentTab = tab;
    },
    
    // Open chat history modal
    openChatHistory: function() {
      console.log('openChatHistory called');
      let modal = document.getElementById('sider-chat-history-modal');
      
      // If modal doesn't exist, create it
      if (!modal) {
        console.log('Modal not found, creating it...');
        this.createHistoryModal();
        modal = document.getElementById('sider-chat-history-modal');
        if (!modal) {
          console.error('Failed to create modal');
          return;
        }
      }
      
      console.log('Modal found, displaying...');
      modal.style.display = 'flex';
      
      // Setup event listeners only once
      if (!this.historyModalEventsSetup) {
        this.setupHistoryModalEvents();
        this.historyModalEventsSetup = true;
      }
      
      // Clear cache and load fresh chat history every time
      this.conversationsCache = null;
      this.loadChatHistory('all', '', true);
    },
    
    // Setup history modal event listeners (only once)
    setupHistoryModalEvents: function() {
      const modal = document.getElementById('sider-chat-history-modal');
      if (!modal) return;
      
      // Close button
      const closeBtn = document.getElementById('sider-chat-history-close');
      if (closeBtn && !closeBtn.hasAttribute('data-listener-attached')) {
        closeBtn.setAttribute('data-listener-attached', 'true');
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          this.closeChatHistory();
        };
      }
      
      // Close on outside click
      if (!modal.hasAttribute('data-listener-attached')) {
        modal.setAttribute('data-listener-attached', 'true');
        modal.onclick = (e) => {
          if (e.target === modal) {
            this.closeChatHistory();
          }
        };
      }
      
      // Tab switching - use cached data, no API call
      const tabs = document.querySelectorAll('.sider-chat-history-tab');
      tabs.forEach(tab => {
        if (!tab.hasAttribute('data-listener-attached')) {
          tab.setAttribute('data-listener-attached', 'true');
          tab.onclick = (e) => {
            e.stopPropagation();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabType = tab.getAttribute('data-tab');
            // Use cached data for filtering, no API call needed
            const listContainer = document.getElementById('sider-chat-history-list');
            const countElement = document.getElementById('sider-chat-history-count');
            if (listContainer && this.conversationsCache) {
              this.renderFilteredConversations(listContainer, countElement, this.conversationsCache, tabType, '');
            } else {
              this.loadChatHistory(tabType);
            }
          };
        }
      });
      
      // Search functionality - use cached data for filtering
      const searchInput = document.getElementById('sider-chat-history-search-input');
      if (searchInput && !searchInput.hasAttribute('data-listener-attached')) {
        searchInput.setAttribute('data-listener-attached', 'true');
        let searchTimeout;
        searchInput.oninput = (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            const query = e.target.value;
            // Use cached data for filtering, no API call needed
            if (this.conversationsCache) {
              const listContainer = document.getElementById('sider-chat-history-list');
              const countElement = document.getElementById('sider-chat-history-count');
              const activeTab = document.querySelector('.sider-chat-history-tab.active');
              const tabType = activeTab ? activeTab.getAttribute('data-tab') : 'all';
              this.renderFilteredConversations(listContainer, countElement, this.conversationsCache, tabType, query);
            } else {
              // Only call API if we don't have cache yet
              this.loadChatHistory(null, query);
            }
          }, 300);
        };
      }
    },
    
    // Create history modal if it doesn't exist
    createHistoryModal: function() {
      const panelBody = document.getElementById('sider-panel-body');
      if (!panelBody) {
        console.error('Panel body not found');
        return;
      }
      
      const modalHTML = `
        <div class="sider-chat-history-modal" id="sider-chat-history-modal" style="display: none;">
          <div class="sider-chat-history-modal-content">
            <div class="sider-chat-history-header">
              <h2 class="sider-chat-history-title">Chat history <span class="sider-chat-history-count" id="sider-chat-history-count">(0)</span></h2>
              <button class="sider-chat-history-close" id="sider-chat-history-close" title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="sider-chat-history-tabs">
              <button class="sider-chat-history-tab active" data-tab="all">All</button>
              <button class="sider-chat-history-tab" data-tab="starred">Starred</button>
            </div>
            <div class="sider-chat-history-search-wrapper">
              <div class="sider-chat-history-search">
                <svg class="sider-chat-history-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" class="sider-chat-history-search-input" id="sider-chat-history-search-input" placeholder="Search" />
              </div>
              <button class="sider-chat-history-delete-all" id="sider-chat-history-delete-all" title="Delete All">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>All</span>
              </button>
            </div>
            <div class="sider-chat-history-list" id="sider-chat-history-list">
              <!-- Conversations will be dynamically loaded here -->
            </div>
          </div>
        </div>
      `;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = modalHTML;
      const modal = tempDiv.firstElementChild;
      panelBody.appendChild(modal);
      console.log('Modal created and added to DOM');
    },
    
    // Close chat history modal
    closeChatHistory: function() {
      const modal = document.getElementById('sider-chat-history-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    },
    
    // Load chat history
    loadChatHistory: async function(tabType = 'all', searchQuery = '', forceRefresh = false) {
      const listContainer = document.getElementById('sider-chat-history-list');
      const countElement = document.getElementById('sider-chat-history-count');
      if (!listContainer) return;
      
      // If force refresh is requested, clear cache
      if (forceRefresh) {
        this.conversationsCache = null;
      }
      
      // If we have cached data and no search query and not forcing refresh, use cache
      if (this.conversationsCache && !searchQuery && tabType === 'all' && !forceRefresh) {
        this.renderFilteredConversations(listContainer, countElement, this.conversationsCache, tabType, searchQuery);
        return;
      }
      
      // Show loading state
      listContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">Loading...</div>';
      
      try {
        // Fetch from API if cache is empty, search is active, or force refresh
        let conversations = this.conversationsCache;
        if (!conversations || searchQuery || forceRefresh) {
          // Prevent multiple simultaneous API calls
          if (this.isLoadingConversations) {
            console.log('Already loading conversations, skipping...');
            return;
          }
          
          this.isLoadingConversations = true;
          conversations = await this.fetchConversations();
          this.isLoadingConversations = false;
          
          // Cache the results (only if not searching)
          if (!searchQuery) {
            this.conversationsCache = conversations;
          }
        }
        
        // Render filtered conversations
        this.renderFilteredConversations(listContainer, countElement, conversations, tabType, searchQuery);
        
      } catch (error) {
        console.error('Error loading chat history:', error);
        this.isLoadingConversations = false;
        listContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Error loading chat history</div>';
      }
    },
    
    // Render filtered conversations (separated for reuse)
    renderFilteredConversations: function(listContainer, countElement, conversations, tabType, searchQuery) {
      // Filter by tab type
      let filteredConversations = conversations;
      if (tabType === 'starred') {
        filteredConversations = conversations.filter(conv => conv.starred);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredConversations = filteredConversations.filter(conv => 
          conv.title.toLowerCase().includes(query) ||
          conv.preview.toLowerCase().includes(query)
        );
      }
      
      // Group conversations by time
      const grouped = this.groupConversationsByTime(filteredConversations);
      
      // Update count
      if (countElement) {
        countElement.textContent = `(${filteredConversations.length})`;
      }
      
      // Render conversations
      this.renderChatHistory(listContainer, grouped);
    },
    
    // Fetch conversations from API
    fetchConversations: async function() {
      try {
        if (!window.SiderChatService || !window.SiderChatService.listConversations) {
          console.error('ChatService not available');
          return [];
        }

        const result = await window.SiderChatService.listConversations();
        
        if (!result.success) {
          console.error('Failed to fetch conversations:', result.error);
          return [];
        }

        // Transform API response to match UI format
        const conversations = result.data.map(conv => {
          // Extract preview from last message or use title
          let preview = conv.title || 'New Conversation';
          if (conv.messages && conv.messages.length > 0) {
            const lastMessage = conv.messages[conv.messages.length - 1];
            if (lastMessage.content) {
              preview = typeof lastMessage.content === 'string' 
                ? lastMessage.content 
                : lastMessage.content.text || preview;
              // Truncate preview
              if (preview.length > 60) {
                preview = preview.substring(0, 60) + '...';
              }
            }
          }

          // Parse timestamp
          let timestamp = new Date();
          if (conv.created_at) {
            timestamp = new Date(conv.created_at);
          } else if (conv.updated_at) {
            timestamp = new Date(conv.updated_at);
          } else if (conv.createdAt) {
            timestamp = new Date(conv.createdAt);
          } else if (conv.updatedAt) {
            timestamp = new Date(conv.updatedAt);
          }

          return {
            id: conv.id || conv._id || conv.conversation_id || conv.cid || String(Math.random()),
            title: conv.title || 'New Conversation',
            preview: preview,
            timestamp: timestamp,
            starred: conv.starred || conv.is_starred || false
          };
        });

        // Sort by timestamp (newest first)
        conversations.sort((a, b) => b.timestamp - a.timestamp);

        return conversations;
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    
    // Group conversations by time
    groupConversationsByTime: function(conversations) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const groups = {
        'This Week': [],
        'This Month': [],
        'Earlier': []
      };
      
      conversations.forEach(conv => {
        const convDate = new Date(conv.timestamp);
        if (convDate >= weekAgo) {
          groups['This Week'].push(conv);
        } else if (convDate >= monthAgo) {
          groups['This Month'].push(conv);
        } else {
          groups['Earlier'].push(conv);
        }
      });
      
      return groups;
    },
    
    // Render chat history
    renderChatHistory: function(container, grouped) {
      container.innerHTML = '';
      
      const groupOrder = ['This Week', 'This Month', 'Earlier'];
      
      groupOrder.forEach(groupName => {
        const conversations = grouped[groupName];
        if (conversations.length === 0) return;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'sider-chat-history-group';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'sider-chat-history-group-title';
        titleDiv.textContent = groupName;
        groupDiv.appendChild(titleDiv);
        
        conversations.forEach(conv => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'sider-chat-history-item';
          itemDiv.setAttribute('data-conversation-id', conv.id);
          
          itemDiv.innerHTML = `
            <div class="sider-chat-history-item-content">
              <div class="sider-chat-history-item-title">${this.escapeHtml(conv.title)}</div>
              <div class="sider-chat-history-item-preview">${this.escapeHtml(conv.preview)}</div>
            </div>
            <div class="sider-chat-history-item-actions">
              <button class="sider-chat-history-item-more" title="More options" data-conversation-id="${conv.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              <button class="sider-chat-history-item-star ${conv.starred ? 'starred' : ''}" title="${conv.starred ? 'Unstar' : 'Star'}" data-conversation-id="${conv.id}">
                <svg viewBox="0 0 24 24" fill="${conv.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </div>
            <div class="sider-chat-history-item-menu" id="sider-chat-history-menu-${conv.id}" style="display: none;">
              <button class="sider-chat-history-menu-item" data-action="export" data-conversation-id="${conv.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Export</span>
              </button>
              <button class="sider-chat-history-menu-item" data-action="edit-title" data-conversation-id="${conv.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Edit title</span>
              </button>
              <button class="sider-chat-history-menu-item sider-chat-history-menu-item-delete" data-action="delete" data-conversation-id="${conv.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          `;
          
          // Click handler to load conversation
          itemDiv.onclick = (e) => {
            if (!e.target.closest('.sider-chat-history-item-actions') && 
                !e.target.closest('.sider-chat-history-item-menu')) {
              this.loadConversation(conv.id);
            }
          };
          
          // More button handler
          const moreBtn = itemDiv.querySelector('.sider-chat-history-item-more');
          if (moreBtn) {
            moreBtn.onclick = (e) => {
              e.stopPropagation();
              this.toggleMoreMenu(conv.id, moreBtn);
            };
          }
          
          // Star handler
          const starBtn = itemDiv.querySelector('.sider-chat-history-item-star');
          if (starBtn) {
            starBtn.onclick = (e) => {
              e.stopPropagation();
              this.toggleStar(conv.id, starBtn);
            };
          }
          
          // Menu item handlers
          const menuItems = itemDiv.querySelectorAll('.sider-chat-history-menu-item');
          menuItems.forEach(menuItem => {
            menuItem.onclick = (e) => {
              e.stopPropagation();
              const action = menuItem.getAttribute('data-action');
              const conversationId = menuItem.getAttribute('data-conversation-id');
              this.handleMenuAction(action, conversationId);
            };
          });
          
          groupDiv.appendChild(itemDiv);
        });
        
        container.appendChild(groupDiv);
      });
      
      if (container.innerHTML === '') {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">No conversations found</div>';
      }
    },
    
    // Load conversation
    loadConversation: async function(conversationId) {
      console.log('Loading conversation:', conversationId);
      
      // Close history modal
      this.closeChatHistory();
      
      // Switch to chat tab
      if (window.switchToTab) {
        window.switchToTab('chat');
      }
      
      // Show loading state
      const messagesContainer = document.getElementById('sider-chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">Loading conversation...</div>';
      }
      
      try {
        // Fetch conversation from API
        if (!window.SiderChatService || !window.SiderChatService.getConversation) {
          console.error('ChatService not available');
          if (messagesContainer) {
            messagesContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Error: Chat service not available</div>';
          }
          return;
        }
        
        const result = await window.SiderChatService.getConversation(conversationId);
        
        if (!result.success || !result.data) {
          console.error('Failed to load conversation:', result.error);
          if (messagesContainer) {
            messagesContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Error: ${result.error || 'Failed to load conversation'}</div>`;
          }
          return;
        }
        
        const conversation = result.data;
        
        // Set current conversation ID
        this.currentConversationId = conversation.id || conversationId;
        
        // Update model if available
        if (conversation.model) {
          this.currentModel = conversation.model;
        }
        
        // Clear existing messages
        if (messagesContainer) {
          messagesContainer.innerHTML = '';
        }
        
        // Hide welcome screen and show chat container
        const chatContainer = document.getElementById('sider-chat-container');
        const welcome = document.querySelector('.sider-welcome');
        const summarizeCard = document.getElementById('sider-summarize-card');
        
        if (chatContainer) {
          chatContainer.style.display = 'block';
        }
        if (welcome) {
          welcome.style.display = 'none';
        }
        if (summarizeCard) {
          summarizeCard.style.display = 'none';
        }
        
        // Load and display messages
        if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
          // First, group assistant messages that follow the same user message as versions
          const groupedMessages = [];
          let i = 0;
          
          while (i < conversation.messages.length) {
            const message = conversation.messages[i];
            const role = message.role === 'user' ? 'user' : 'assistant';
            
            if (role === 'user') {
              // User message - add as is
              groupedMessages.push({ type: 'user', message: message });
              i++;
            } else {
              // Assistant message - check if there are more consecutive assistant messages OR
              // if the next messages are user+assistant with same user content (regenerations)
              const assistantVersions = [];
              let lastUserMessage = null;
              
              // Find the last user message before this assistant message
              for (let j = groupedMessages.length - 1; j >= 0; j--) {
                if (groupedMessages[j].type === 'user') {
                  lastUserMessage = groupedMessages[j].message;
                  break;
                }
              }
              
              // Extract user message content for comparison
              let lastUserContent = '';
              if (lastUserMessage) {
                if (typeof lastUserMessage.content === 'string') {
                  lastUserContent = lastUserMessage.content;
                } else if (lastUserMessage.text) {
                  lastUserContent = lastUserMessage.text;
                }
              }
              
              // Collect all consecutive assistant messages first
              while (i < conversation.messages.length && conversation.messages[i].role === 'assistant') {
                const assistantMsg = conversation.messages[i];
                let content = '';
                
                if (typeof assistantMsg.content === 'string') {
                  content = assistantMsg.content;
                } else if (assistantMsg.content && typeof assistantMsg.content === 'object') {
                  if (Array.isArray(assistantMsg.content)) {
                    content = assistantMsg.content.map(item => {
                      if (typeof item === 'string') return item;
                      if (item.type === 'text' && item.text) return item.text;
                      if (item.text) return item.text;
                      return '';
                    }).filter(text => text).join('\n');
                  } else if (assistantMsg.content.text) {
                    content = assistantMsg.content.text;
                  } else if (assistantMsg.content.content) {
                    content = assistantMsg.content.content;
                  }
                } else if (assistantMsg.text) {
                  content = assistantMsg.text;
                }
                
                if (content) {
                  assistantVersions.push(content);
                }
                i++;
              }
              
              // Also check if next messages are duplicate user + assistant (regeneration pattern)
              // This handles cases where backend creates new user message for each regeneration
              while (i < conversation.messages.length - 1) {
                const nextUserMsg = conversation.messages[i];
                const nextAssistantMsg = conversation.messages[i + 1];
                
                if (nextUserMsg.role === 'user' && nextAssistantMsg.role === 'assistant') {
                  // Check if user message content matches the last user message
                  let nextUserContent = '';
                  if (typeof nextUserMsg.content === 'string') {
                    nextUserContent = nextUserMsg.content;
                  } else if (nextUserMsg.text) {
                    nextUserContent = nextUserMsg.text;
                  }
                  
                  if (nextUserContent === lastUserContent && lastUserContent !== '') {
                    // This is a regeneration - extract assistant content
                    let assistantContent = '';
                    if (typeof nextAssistantMsg.content === 'string') {
                      assistantContent = nextAssistantMsg.content;
                    } else if (nextAssistantMsg.content && typeof nextAssistantMsg.content === 'object') {
                      if (Array.isArray(nextAssistantMsg.content)) {
                        assistantContent = nextAssistantMsg.content.map(item => {
                          if (typeof item === 'string') return item;
                          if (item.type === 'text' && item.text) return item.text;
                          if (item.text) return item.text;
                          return '';
                        }).filter(text => text).join('\n');
                      } else if (nextAssistantMsg.content.text) {
                        assistantContent = nextAssistantMsg.content.text;
                      } else if (nextAssistantMsg.content.content) {
                        assistantContent = nextAssistantMsg.content.content;
                      }
                    } else if (nextAssistantMsg.text) {
                      assistantContent = nextAssistantMsg.text;
                    }
                    
                    if (assistantContent && !assistantVersions.includes(assistantContent)) {
                      assistantVersions.push(assistantContent);
                    }
                    
                    // Skip both user and assistant messages
                    i += 2;
                  } else {
                    break; // Different user message, stop grouping
                  }
                } else {
                  break; // Not a user+assistant pair, stop grouping
                }
              }
              
              // Add grouped assistant messages as versions
              if (assistantVersions.length > 0) {
                groupedMessages.push({ 
                  type: 'assistant', 
                  versions: assistantVersions,
                  lastUserMessage: lastUserMessage
                });
              }
            }
          }
          
          // Now render the grouped messages
          let assistantMessageIndex = 0;
          
          for (const grouped of groupedMessages) {
            if (grouped.type === 'user') {
              // Render user message
              let content = '';
              const message = grouped.message;
              
              if (typeof message.content === 'string') {
                content = message.content;
              } else if (message.content && typeof message.content === 'object') {
                if (Array.isArray(message.content)) {
                  content = message.content.map(item => {
                    if (typeof item === 'string') return item;
                    if (item.type === 'text' && item.text) return item.text;
                    if (item.text) return item.text;
                    return '';
                  }).filter(text => text).join('\n');
                } else if (message.content.text) {
                  content = message.content.text;
                } else if (message.content.content) {
                  content = message.content.content;
                }
              } else if (message.text) {
                content = message.text;
              }
              
              if (content) {
                const escapedContent = this.escapeHtml(content);
                this.addMessage('user', escapedContent);
              }
            } else if (grouped.type === 'assistant') {
              // Render assistant message with versions
              const versions = grouped.versions;
              if (versions.length > 0) {
                // Check localStorage first
                const storedVersions = this.loadResponseVersions(conversationId, assistantMessageIndex);
                const finalVersions = storedVersions && storedVersions.length > 0 ? storedVersions : versions;
                
                // Show latest version
                const currentVersion = finalVersions.length;
                const versionToShow = finalVersions[currentVersion - 1] || finalVersions[0];
                const escapedContent = this.escapeHtml(versionToShow);
                
                const messageDiv = this.addMessage('assistant', escapedContent);
                
                if (messageDiv) {
                  // Restore or set up versions with navigation
                  if (finalVersions.length > 1) {
                    this.updateMessageWithVersions(messageDiv, versionToShow, finalVersions, currentVersion, finalVersions.length);
                  } else {
                    // Even if only one version, save it so regeneration can add to it
                    messageDiv.setAttribute('data-response-versions', JSON.stringify(finalVersions));
                    messageDiv.setAttribute('data-current-version', '1');
                    messageDiv.setAttribute('data-total-versions', '1');
                    this.saveResponseVersions(messageDiv, finalVersions);
                  }
                }
                
                assistantMessageIndex++;
              }
            }
          }
          
          // Scroll to bottom after loading all messages
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        } else {
          // No messages, show empty state
          if (messagesContainer) {
            messagesContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">No messages in this conversation</div>';
          }
        }
        
        console.log('✅ Conversation loaded successfully:', conversationId);
        
      } catch (error) {
        console.error('Error loading conversation:', error);
        if (messagesContainer) {
          messagesContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Error loading conversation: ${error.message}</div>`;
        }
      }
    },
    
    // Toggle star
    toggleStar: function(conversationId, starBtn) {
      const isStarred = starBtn.classList.contains('starred');
      starBtn.classList.toggle('starred');
      
      // Update star icon
      const svg = starBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isStarred ? 'none' : 'currentColor');
      }
      
      // TODO: Call API to update star status
      console.log(`${isStarred ? 'Unstarred' : 'Starred'} conversation:`, conversationId);
    },
    
    // Toggle more menu
    toggleMoreMenu: function(conversationId, moreBtn) {
      // Close all other menus first
      const allMenus = document.querySelectorAll('.sider-chat-history-item-menu');
      allMenus.forEach(menu => {
        if (menu.id !== `sider-chat-history-menu-${conversationId}`) {
          menu.style.display = 'none';
        }
      });
      
      // Toggle current menu
      const menu = document.getElementById(`sider-chat-history-menu-${conversationId}`);
      if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
        
        // Position menu relative to button (menu is already positioned via CSS, just ensure it's visible)
        if (!isVisible) {
          // Menu is positioned via CSS relative to the item
          // No need to calculate position manually
        }
      }
      
      // Close menu when clicking outside
      if (menu && menu.style.display === 'block') {
        setTimeout(() => {
          const closeMenuHandler = (e) => {
            if (!menu.contains(e.target) && !moreBtn.contains(e.target)) {
              menu.style.display = 'none';
              document.removeEventListener('click', closeMenuHandler);
            }
          };
          document.addEventListener('click', closeMenuHandler);
        }, 0);
      }
    },
    
    // Handle menu action
    handleMenuAction: async function(action, conversationId) {
      // Close the menu
      const menu = document.getElementById(`sider-chat-history-menu-${conversationId}`);
      if (menu) {
        menu.style.display = 'none';
      }
      
      switch (action) {
        case 'delete':
          await this.deleteConversation(conversationId);
          break;
        case 'export':
          await this.exportConversation(conversationId);
          break;
        case 'edit-title':
          this.showEditTitleModal(conversationId);
          break;
        default:
          console.log('Unknown action:', action);
      }
    },
    
    // Show delete confirmation modal
    showDeleteConfirmation: function(conversationId, onConfirm) {
      // Try multiple ways to find the modal
      let modal = document.getElementById('sider-delete-confirmation-modal');
      
      if (!modal) {
        // Try to find it in panel body
        const panelBody = document.getElementById('sider-panel-body');
        if (panelBody) {
          modal = panelBody.querySelector('#sider-delete-confirmation-modal');
        }
      }
      
      if (!modal) {
        // Try to find it anywhere in document
        modal = document.querySelector('#sider-delete-confirmation-modal');
      }
      
      if (!modal) {
        console.error('Delete confirmation modal not found. Attempting to load it...');
        // Try to load it from HTML if it wasn't loaded
        this.loadDeleteConfirmationModal().then(() => {
          modal = document.getElementById('sider-delete-confirmation-modal');
          if (modal) {
            this.showDeleteConfirmationModal(modal, conversationId, onConfirm);
          } else {
            console.error('Failed to load delete confirmation modal');
          }
        });
        return;
      }
      
      this.showDeleteConfirmationModal(modal, conversationId, onConfirm);
    },
    
    // Load delete confirmation modal if not already loaded
    loadDeleteConfirmationModal: async function() {
      try {
        const url = chrome.runtime.getURL('chat-tab.html');
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load chat-tab.html: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const deleteConfirmationModal = doc.querySelector('#sider-delete-confirmation-modal');
        
        if (deleteConfirmationModal) {
          const existingModal = document.getElementById('sider-delete-confirmation-modal');
          if (!existingModal) {
            // Add to document.body for proper overlay
            document.body.appendChild(deleteConfirmationModal.cloneNode(true));
            console.log('Delete confirmation modal loaded and added to DOM');
          }
        }
      } catch (error) {
        console.error('Error loading delete confirmation modal:', error);
      }
    },
    
    // Helper function to show the modal
    showDeleteConfirmationModal: function(modal, conversationId, onConfirm) {
      if (!modal) {
        console.error('Modal is null in showDeleteConfirmationModal');
        return;
      }
      
      console.log('Showing delete confirmation modal for conversation:', conversationId);
      
      // Show modal
      modal.style.display = 'flex';
      
      // Remove existing event listeners by cloning and replacing buttons
      const cancelBtn = modal.querySelector('.sider-delete-confirmation-cancel');
      const confirmBtn = modal.querySelector('.sider-delete-confirmation-confirm');
      
      // Remove old listeners by replacing with new elements
      const newCancelBtn = cancelBtn.cloneNode(true);
      const newConfirmBtn = confirmBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      
      // Handle cancel button
      newCancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
      
      // Handle confirm button
      newConfirmBtn.onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) {
          onConfirm();
        }
      };
      
      // Close on overlay click
      const handleOverlayClick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          modal.removeEventListener('click', handleOverlayClick);
        }
      };
      modal.addEventListener('click', handleOverlayClick);
      
      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          document.removeEventListener('keydown', handleEscape);
          modal.removeEventListener('click', handleOverlayClick);
        }
      };
      document.addEventListener('keydown', handleEscape);
    },
    
    // Show edit title modal
    showEditTitleModal: function(conversationId) {
      // Try multiple ways to find the modal
      let modal = document.getElementById('sider-edit-title-modal');
      
      if (!modal) {
        // Try to find it in panel body
        const panelBody = document.getElementById('sider-panel-body');
        if (panelBody) {
          modal = panelBody.querySelector('#sider-edit-title-modal');
        }
      }
      
      if (!modal) {
        // Try to find it anywhere in document
        modal = document.querySelector('#sider-edit-title-modal');
      }
      
      if (!modal) {
        console.error('Edit title modal not found. Attempting to load it...');
        // Try to load it from HTML if it wasn't loaded
        this.loadEditTitleModal().then(() => {
          modal = document.getElementById('sider-edit-title-modal');
          if (modal) {
            this.showEditTitleModalContent(modal, conversationId);
          } else {
            console.error('Failed to load edit title modal');
          }
        });
        return;
      }
      
      this.showEditTitleModalContent(modal, conversationId);
    },
    
    // Helper function to show the edit title modal content
    showEditTitleModalContent: function(modal, conversationId) {
      if (!modal) {
        console.error('Modal is null in showEditTitleModalContent');
        return;
      }
      
      // Get current conversation title from the list
      const conversationItem = document.querySelector(`.sider-chat-history-item[data-conversation-id="${conversationId}"]`);
      let currentTitle = '';
      if (conversationItem) {
        const titleElement = conversationItem.querySelector('.sider-chat-history-item-title');
        if (titleElement) {
          currentTitle = titleElement.textContent.trim();
        }
      }
      
      // Set input value to current title
      const input = modal.querySelector('#sider-edit-title-input');
      if (input) {
        input.value = currentTitle;
        input.focus();
        input.select();
      }
      
      // Show modal
      modal.style.display = 'flex';
      
      // Remove existing event listeners by cloning and replacing buttons
      const cancelBtn = modal.querySelector('.sider-edit-title-cancel');
      const confirmBtn = modal.querySelector('.sider-edit-title-confirm');
      
      // Remove old listeners by replacing with new elements
      const newCancelBtn = cancelBtn.cloneNode(true);
      const newConfirmBtn = confirmBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      
      // Handle cancel button
      newCancelBtn.onclick = () => {
        modal.style.display = 'none';
        if (input) {
          input.value = '';
        }
      };
      
      // Handle confirm button
      newConfirmBtn.onclick = () => {
        const newTitle = input ? input.value.trim() : '';
        if (!newTitle) {
          alert('Title cannot be empty');
          return;
        }
        modal.style.display = 'none';
        this.updateConversationTitle(conversationId, newTitle);
      };
      
      // Handle Enter key in input
      if (input) {
        const handleEnter = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const newTitle = input.value.trim();
            if (!newTitle) {
              alert('Title cannot be empty');
              return;
            }
            modal.style.display = 'none';
            input.removeEventListener('keydown', handleEnter);
            this.updateConversationTitle(conversationId, newTitle);
          }
        };
        input.addEventListener('keydown', handleEnter);
      }
      
      // Close on overlay click
      const handleOverlayClick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          modal.removeEventListener('click', handleOverlayClick);
        }
      };
      modal.addEventListener('click', handleOverlayClick);
      
      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          document.removeEventListener('keydown', handleEscape);
          modal.removeEventListener('click', handleOverlayClick);
        }
      };
      document.addEventListener('keydown', handleEscape);
    },
    
    // Load edit title modal if not already loaded
    loadEditTitleModal: async function() {
      try {
        const url = chrome.runtime.getURL('chat-tab.html');
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load chat-tab.html: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const editTitleModal = doc.querySelector('#sider-edit-title-modal');
        
        if (editTitleModal) {
          const existingModal = document.getElementById('sider-edit-title-modal');
          if (!existingModal) {
            // Add to document.body for proper overlay
            document.body.appendChild(editTitleModal.cloneNode(true));
            console.log('Edit title modal loaded and added to DOM');
          }
        }
      } catch (error) {
        console.error('Error loading edit title modal:', error);
      }
    },
    
    // Update conversation title
    updateConversationTitle: async function(conversationId, newTitle) {
      try {
        if (!window.SiderChatService || !window.SiderChatService.updateConversation) {
          console.error('ChatService not available or updateConversation method not found');
          this.showNotification('Error: Chat service not available', 'error');
          return;
        }
        
        const result = await window.SiderChatService.updateConversation(conversationId, newTitle);
        
        if (result.success) {
          console.log('✅ Conversation title updated successfully:', conversationId, newTitle);
          
          // Update the title in the UI
          const conversationItem = document.querySelector(`.sider-chat-history-item[data-conversation-id="${conversationId}"]`);
          if (conversationItem) {
            const titleElement = conversationItem.querySelector('.sider-chat-history-item-title');
            if (titleElement) {
              titleElement.textContent = newTitle;
            }
          }
          
          // Update in cache
          if (this.conversationsCache && Array.isArray(this.conversationsCache)) {
            const convIndex = this.conversationsCache.findIndex(conv => conv.id === conversationId);
            if (convIndex !== -1) {
              this.conversationsCache[convIndex].title = newTitle;
            }
          }
          
          // Show success message
          this.showNotification('Title updated successfully', 'success');
        } else {
          console.error('Failed to update conversation title:', result.error);
          this.showNotification(`Error: ${result.error || 'Failed to update title'}`, 'error');
        }
      } catch (error) {
        console.error('Error updating conversation title:', error);
        this.showNotification(`Error: ${error.message || 'Failed to update title'}`, 'error');
      }
    },
    
    // Export conversation
    exportConversation: async function(conversationId) {
      if (!conversationId) {
        console.error('No conversation ID provided');
        this.showNotification('Error: No conversation ID provided', 'error');
        return;
      }
      
      try {
        if (!window.SiderChatService || !window.SiderChatService.exportConversation) {
          console.error('ChatService not available or exportConversation method not found');
          this.showNotification('Error: Chat service not available', 'error');
          return;
        }
        
        // Show loading notification
        this.showNotification('Exporting conversation...', 'info');
        
        const result = await window.SiderChatService.exportConversation(conversationId);
        
        if (result.success) {
          console.log('✅ Conversation exported successfully:', conversationId);
          
          // If there's a download URL, open it
          if (result.downloadUrl) {
            window.open(result.downloadUrl, '_blank');
            this.showNotification('Export completed. Download started.', 'success');
          } else if (result.data && result.data.filename) {
            // File was downloaded automatically
            this.showNotification(`Export completed. File saved as ${result.data.filename}`, 'success');
          } else {
            this.showNotification('Export completed successfully', 'success');
          }
        } else {
          console.error('Failed to export conversation:', result.error);
          this.showNotification(`Error: ${result.error || 'Failed to export conversation'}`, 'error');
        }
      } catch (error) {
        console.error('Error exporting conversation:', error);
        this.showNotification(`Error: ${error.message || 'Failed to export conversation'}`, 'error');
      }
    },
    
    // Delete conversation
    deleteConversation: async function(conversationId) {
      if (!conversationId) {
        console.error('No conversation ID provided');
        return;
      }
      
      // Show confirmation modal
      this.showDeleteConfirmation(conversationId, async () => {
        // This callback runs when user confirms deletion
        try {
          if (!window.SiderChatService || !window.SiderChatService.deleteConversation) {
            console.error('ChatService not available');
            this.showNotification('Error: Chat service not available', 'error');
            return;
          }
          
          const result = await window.SiderChatService.deleteConversation(conversationId);
          
          if (result.success) {
            console.log('✅ Conversation deleted successfully:', conversationId);
            
            // If the deleted conversation is currently open, clear it
            if (this.currentConversationId === conversationId) {
              this.currentConversationId = null;
              const messagesContainer = document.getElementById('sider-chat-messages');
              if (messagesContainer) {
                messagesContainer.innerHTML = '';
              }
              
              // Show welcome screen
              const chatContainer = document.getElementById('sider-chat-container');
              const welcome = document.querySelector('.sider-welcome');
              if (chatContainer) {
                chatContainer.style.display = 'none';
              }
              if (welcome) {
                welcome.style.display = 'block';
              }
            }
            
            // Remove from cache
            if (this.conversationsCache && Array.isArray(this.conversationsCache)) {
              this.conversationsCache = this.conversationsCache.filter(conv => conv.id !== conversationId);
            }
            
            // Refresh the history list
            const listContainer = document.getElementById('sider-chat-history-list');
            const countElement = document.getElementById('sider-chat-history-count');
            const activeTab = document.querySelector('.sider-chat-history-tab.active');
            const tabType = activeTab ? activeTab.getAttribute('data-tab') || 'all' : 'all';
            const searchInput = document.getElementById('sider-chat-history-search-input');
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            
            if (listContainer && countElement) {
              this.renderFilteredConversations(listContainer, countElement, this.conversationsCache, tabType, searchQuery);
            }
            
            // Show success message
            this.showNotification('Conversation deleted successfully', 'success');
          } else {
            console.error('Failed to delete conversation:', result.error);
            this.showNotification(`Error: ${result.error || 'Failed to delete conversation'}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting conversation:', error);
          this.showNotification(`Error: ${error.message || 'Failed to delete conversation'}`, 'error');
        }
      });
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
      // Try to show notification within history modal if it's open
      const historyModal = document.getElementById('sider-chat-history-modal');
      let container = document.body;
      let isInModal = false;
      
      if (historyModal && historyModal.style.display !== 'none') {
        container = historyModal;
        isInModal = true;
      }
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: ${isInModal ? 'absolute' : 'fixed'};
        ${isInModal ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : 'top: 20px; right: 20px;'}
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 8px;
        font-weight: 500;
        z-index: ${isInModal ? '10001' : '10000'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        pointer-events: none;
      `;
      notification.textContent = message;
      container.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    
    // Escape HTML
    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    // Initialize custom tooltips (hide native tooltips)
    initTooltips: function(container) {
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
  };
  
  // Export to window
  window.SiderChatTab = ChatTab;
  
  // Initialize tooltips when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ChatTab.initTooltips();
    });
  } else {
    ChatTab.initTooltips();
  }
})();

