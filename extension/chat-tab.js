(function() {
  'use strict';
  
  // Chat Tab Component
  const ChatTab = {
    currentModel: 'gpt-4o-mini',
    currentConversationId: null,
    pendingAttachments: [],
    currentTab: null,
    messageListenerSetup: false,
    conversationsCache: null,
    isLoadingConversations: false,
    historyModalEventsSetup: false,
    
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
        const chatContainer = doc.querySelector('.sider-chat-container');
        const footerContainer = doc.querySelector('.sider-panel-footer');
        const historyModal = doc.querySelector('.sider-chat-history-modal');
        
        const chatTabContainer = document.getElementById('sider-chat-tab-container');
        const chatFooterContainer = document.getElementById('sider-chat-footer-container');
        
        if (chatTabContainer) {
          let htmlContent = '';
          
          // Add welcome section if it exists
          if (welcomeSection) {
            htmlContent += welcomeSection.outerHTML;
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
                      <button class="sider-image-action-btn" data-action="translate-image" style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-size: 10px; font-weight: 500; color: #111827; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
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
        `;
      }
    },
    
    // Initialize chat tab
    init: async function(dependencies) {
      this.currentModel = dependencies.currentModel || 'chatgpt';
      this.currentTab = dependencies.currentTab || null;
      this.requireAuth = dependencies.requireAuth || (async () => true);
      this.getCurrentTab = dependencies.getCurrentTab || (async () => null);
      this.updatePageTitle = dependencies.updatePageTitle || (() => {});
      
      // Load HTML content first
      await this.loadHTML();
      
      // Initialize AI selector icon after HTML is loaded
      if (window.updateAISelectorIcon) {
        window.updateAISelectorIcon(this.currentModel);
      }
      
      this.setupEventListeners();
      this.setupMessageListeners();
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
        if (att.type === 'image') {
          const chip = document.createElement('div');
          chip.className = 'sider-attachment-chip';
          chip.innerHTML = `
            <img class="sider-attachment-thumb" src="${att.dataUrl}" alt="attachment" />
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:12px;color:#374151;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${att.name}</span>
              <span style="font-size:11px;color:#6b7280;">${att.width || ''}×${att.height || ''}</span>
            </div>
            <button class="sider-attachment-remove" title="Remove">✕</button>
          `;
          chip.querySelector('.sider-attachment-remove').addEventListener('click', () => {
            this.pendingAttachments.splice(idx, 1);
            this.renderAttachments();
          });
          container.appendChild(chip);
        }
      });
      this.updateInputPaddingForAttachments();
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
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const attachment = {
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            size: file.size,
            dataUrl
          };
          
          if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              attachment.width = img.width;
              attachment.height = img.height;
              this.pendingAttachments.push(attachment);
              this.renderAttachments();
            };
            img.src = dataUrl;
          } else {
            this.pendingAttachments.push(attachment);
            this.renderAttachments();
          }
        };
        reader.readAsDataURL(file);
      });
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
          const input = document.getElementById('sider-chat-input');
          if (input) {
            const pageText = `📖 Read this page: ${response.content.title}\nURL: ${response.content.url}\n\n${response.content.text.substring(0, 500)}...`;
            input.value = pageText + (input.value ? '\n\n' + input.value : '');
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }
          
          this.addMessage('user', `📖 Reading page: ${response.content.title}`);
          
          const summaryPrompt = `Please summarize this page: ${response.content.title}\n\nContent preview: ${response.content.text.substring(0, 1000)}`;
          setTimeout(() => {
            const input = document.getElementById('sider-chat-input');
            if (input) {
              input.value = summaryPrompt;
              this.sendMessage();
            }
          }, 500);
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
      
      const message = input.value.trim();
      const model = this.currentModel || 'gpt-4o-mini';
      
      input.value = '';
      this.autoResize(input);
      if (window.toggleMicSendButton) window.toggleMicSendButton();
      
      if (chatContainer) {
        chatContainer.style.display = 'flex';
      }
      if (welcome) {
        welcome.style.display = 'none';
      }
      
      const imagePreviewSection = document.getElementById('sider-image-preview-section');
      const imageThumb = document.getElementById('sider-image-preview-thumb');
      let hasImagePreview = false;
      
      if (imagePreviewSection && imagePreviewSection.style.display !== 'none' && imageThumb && imageThumb.src) {
        hasImagePreview = true;
      }
      
      if (this.pendingAttachments.length > 0) {
        const attachedHint = this.pendingAttachments
          .map(att => att.type === 'image' ? `📎 [image] ${att.name}` : `📎 ${att.name}`)
          .join('\n');
        this.addMessage('user', `${attachedHint}\n\n${message}`);
        this.pendingAttachments = [];
        this.renderAttachments();
        this.updateInputPaddingForAttachments();
      } else if (hasImagePreview) {
        const imageAlt = imageThumb.alt || 'Screenshot';
        this.addMessage('user', `${message}\n\n📎 [image] ${imageAlt}`);
      } else {
        this.addMessage('user', message);
      }
      
      if (hasImagePreview && imagePreviewSection) {
        imagePreviewSection.style.display = 'none';
        if (imageThumb) {
          imageThumb.src = '';
          imageThumb.alt = '';
        }
      }
      
      const thinkingMsg = this.addMessage('assistant', 'Thinking...', true);
      
      try {
        // If no conversation ID exists, create a new conversation first
        if (!this.currentConversationId) {
          if (window.SiderChatService) {
            console.log('🔄 Creating new conversation...');
            const conversationResult = await window.SiderChatService.createConversation(
              message.substring(0, 50) || 'New Conversation',
              'gpt-4o-mini' // Always use gpt-4o-mini for conversation creation
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
        
        // Send message using chat completions API if available
        if (window.SiderChatService && this.currentConversationId) {
          console.log('🔄 Calling chat completions API...');
          const completionsResult = await window.SiderChatService.chatCompletions(
            this.currentConversationId,
            message,
            model
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
              this.updateMessage(thinkingMsg, 'assistant', responseText);
            } else {
              this.updateMessage(thinkingMsg, 'assistant', 'Response received but no content found');
            }

            // Call GET conversation API after successful chatCompletions
            if (this.currentConversationId && window.SiderChatService) {
              try {
                const conversationResult = await window.SiderChatService.getConversation(this.currentConversationId);
                if (conversationResult.success && conversationResult.data) {
                  console.log('✅ Conversation data fetched:', conversationResult.data);
                  // You can use conversationResult.data here to update UI if needed
                } else {
                  console.warn('⚠️ Failed to fetch conversation:', conversationResult.error);
                }
              } catch (error) {
                console.error('Error fetching conversation:', error);
              }
            }
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
        this.updateMessage(thinkingMsg, 'assistant', `Error: ${error.message}`);
      }
    },
    
    // Create new chat
    createNewChat: function() {
      // Reset conversation ID for new chat
      this.currentConversationId = null;
      
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
        setTimeout(() => {
          if (this.updatePageTitle) this.updatePageTitle();
        }, 100);
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
    addMessage: function(role, text, isThinking = false) {
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
        const model = this.currentModel || 'gpt-4o-mini';
        const iconUrl = iconMap[model] || iconMap['gpt-4o-mini'] || chrome.runtime.getURL('icons/chatgpt.png');
        avatarContent = `<img src="${iconUrl}" alt="${model}" style="width: 20px; height: 20px; object-fit: contain;" />`;
      }
      
      messageDiv.innerHTML = `
        <div class="sider-message-avatar">
          ${avatarContent}
        </div>
        <div class="sider-message-content">
          <div class="sider-message-text">${text}</div>
        </div>
      `;
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return messageDiv;
    },
    
    // Update message
    updateMessage: function(messageDiv, role, text) {
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
      
      chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'summarize'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting page summary:', chrome.runtime.lastError);
          return;
        }
        
        const summarizePrompt = response && response.summary 
          ? response.summary 
          : `Summarize this page: ${pageTitle}\n\nURL: ${pageUrl}`;
        
        this.addMessage('user', `📄 Summarize: ${pageTitle}`);
        
        const thinkingMsg = this.addMessage('assistant', 'Thinking...', true);
        
        chrome.runtime.sendMessage({
          type: 'CHAT_REQUEST',
          message: summarizePrompt,
          model: this.currentModel || 'chatgpt'
        }, (response) => {
          if (response && response.error) {
            this.updateMessage(thinkingMsg, 'assistant', `Error: ${response.error}`);
          } else if (response && response.text) {
            this.updateMessage(thinkingMsg, 'assistant', response.text);
          } else {
            this.updateMessage(thinkingMsg, 'assistant', 'Unable to generate summary. Please try again.');
          }
        });
      });
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
        
        const imageActionBtns = imagePreviewSection.querySelectorAll('.sider-image-action-btn');
        imageActionBtns.forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const allImages = Array.from(imagesContainer.querySelectorAll('.sider-image-preview-item')).map(item => ({
              src: item.getAttribute('data-image-src'),
              alt: item.getAttribute('data-image-alt')
            }));
            this.handleImageAction(action, allImages.length === 1 ? allImages[0].src : allImages, allImages.length === 1 ? allImages[0].alt : 'Images');
          };
        });
      }
    },
    
    // Handle image action
    handleImageAction: function(action, src, alt) {
      const input = document.getElementById('sider-chat-input');
      if (!input) return;
      
      switch (action) {
        case 'extract-text':
          input.value = 'Extract all text from this image';
          this.autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
          break;
        case 'math-solver':
          input.value = 'Solve the math problems in this image';
          this.autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
          break;
        case 'translate-image':
          input.value = 'Translate all text in this image to English';
          this.autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
          break;
      }
      input.focus();
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
      
      switch (action) {
        case 'explain':
          if (input) {
            input.value = `Explain this text: "${text}"`;
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
            setTimeout(() => this.sendMessage(), 200);
          }
          break;
        case 'translate':
          if (input) {
            input.value = `Translate to English: "${text}"`;
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
            setTimeout(() => this.sendMessage(), 200);
          }
          break;
        case 'summarize':
          if (input) {
            input.value = `Summarize this text: "${text}"`;
            this.autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
            setTimeout(() => this.sendMessage(), 200);
          }
          break;
      }
    },
    
    // Show more selection actions
    showMoreSelectionActions: function(text) {
      const menu = document.createElement('div');
      menu.className = 'sider-more-actions-menu';
      menu.style.cssText = `
        position: fixed;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 8px;
        z-index: 1000;
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
          this.handleSelectionAction(item.action, text);
          if (menu.parentNode) {
            document.body.removeChild(menu);
          }
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
      
      // Toggle mic/send button
      window.toggleMicSendButton = () => {
        const input = document.getElementById('sider-chat-input');
        const micButton = document.getElementById('sider-mic-btn');
        const sendButton = document.getElementById('sider-send-btn');
        
        if (!input || !micButton || !sendButton) {
          setTimeout(() => {
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          }, 100);
          return;
        }
        
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
        const files = Array.from(e.target.files);
        this.handleFileAttachments(files);
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
              <button class="sider-chat-history-menu-item" data-action="delete" data-conversation-id="${conv.id}">
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
          for (const message of conversation.messages) {
            // Determine role (user or assistant)
            const role = message.role === 'user' ? 'user' : 'assistant';
            
            // Extract content
            let content = '';
            if (typeof message.content === 'string') {
              content = message.content;
            } else if (message.content && typeof message.content === 'object') {
              // Handle multi-content format
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
              // Escape HTML to prevent XSS and ensure proper display
              const escapedContent = this.escapeHtml(content);
              this.addMessage(role, escapedContent);
            }
          }
          
          // Scroll to bottom after loading all messages
          if (messagesContainer) {
            setTimeout(() => {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
          }
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
          console.log('Export conversation:', conversationId);
          // TODO: Implement export functionality
          break;
        case 'edit-title':
          console.log('Edit title for conversation:', conversationId);
          // TODO: Implement edit title functionality
          break;
        default:
          console.log('Unknown action:', action);
      }
    },
    
    // Delete conversation
    deleteConversation: async function(conversationId) {
      if (!conversationId) {
        console.error('No conversation ID provided');
        return;
      }
      
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this conversation?')) {
        return;
      }
      
      try {
        if (!window.SiderChatService || !window.SiderChatService.deleteConversation) {
          console.error('ChatService not available');
          alert('Error: Chat service not available');
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
          alert(`Error: ${result.error || 'Failed to delete conversation'}`);
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert(`Error: ${error.message || 'Failed to delete conversation'}`);
      }
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
        font-size: 10px;
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
    }
  };
  
  // Export to window
  window.SiderChatTab = ChatTab;
})();

