(function() {
  'use strict';
  
  let currentModel = 'chatgpt';
  let fileInput = null;
  let pendingAttachments = [];
  let currentTab = null;
  
  // Get current tab info
  async function getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (e) {
      return null;
    }
  }
  
  // Update page title in summarize card
  async function updatePageTitle() {
    currentTab = await getCurrentTab();
    if (!currentTab) return;
    
    const summarizeCard = document.getElementById('sider-summarize-card');
    const siteNameSpan = document.getElementById('sider-summarize-site-name');
    
    if (summarizeCard && siteNameSpan) {
      let siteName = currentTab.title || 'Page';
      try {
        const url = new URL(currentTab.url);
        siteName = url.hostname.replace('www.', '');
        const parts = siteName.split('.');
        if (parts.length > 1) {
          siteName = parts[0];
        }
        siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        
        if (currentTab.title && currentTab.title.length < 50 && currentTab.title.length > siteName.length) {
          siteName = currentTab.title.substring(0, 40);
          if (currentTab.title.length > 40) {
            siteName += '...';
          }
        }
      } catch (e) {
        siteName = (currentTab.title || 'Page').substring(0, 40);
        if ((currentTab.title || '').length > 40) {
          siteName += '...';
        }
      }
      
      siteNameSpan.textContent = siteName;
      summarizeCard.style.display = 'flex';
    }
  }
  
  function autoResize(textarea) {
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
  }
  
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
    if (popup) {
      popup.style.display = 'block';
    }
  }
  
  function hideSidebarPopup() {
    const popup = document.getElementById('sider-sidebar-popup');
    if (popup) {
      popup.style.display = 'none';
    }
  }
  
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
  
  function handleAction(action) {
    const chatContainer = document.getElementById('sider-chat-container');
    const welcome = document.querySelector('.sider-welcome');
    
    switch(action) {
      case 'fullscreen':
        if (chatContainer) {
          chatContainer.style.display = 'flex';
        }
        if (welcome) {
          welcome.style.display = 'none';
        }
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
      'chatgpt': chrome.runtime.getURL('icons/fusion.png'),
      'gpt4': chrome.runtime.getURL('icons/chatgpt.png'),
      'gemini': chrome.runtime.getURL('icons/gemini.png'),
      'claude': chrome.runtime.getURL('icons/claude.png'),
      'groq': chrome.runtime.getURL('icons/grok.png')
    };
    
    const aiIconImg = document.getElementById('sider-ai-icon-img');
    if (aiIconImg) {
      const imageUrl = iconMap[model] || iconMap['chatgpt'] || chrome.runtime.getURL('icons/fusion.png');
      aiIconImg.src = imageUrl;
      aiIconImg.alt = model;
    }
  }
  
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
            <span style="font-size:11px;color:#6b7280;">${att.width || ''}×${att.height || ''}</span>
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
    const basePadding = 12;
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
        
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            attachment.width = img.width;
            attachment.height = img.height;
            pendingAttachments.push(attachment);
            renderAttachments();
          };
          img.src = dataUrl;
        } else {
          pendingAttachments.push(attachment);
          renderAttachments();
        }
      };
      reader.readAsDataURL(file);
    });
  }
  
  async function readCurrentPage() {
    if (!currentTab || !currentTab.id) return;
    
    // Request page content from content script
    chrome.tabs.sendMessage(currentTab.id, {
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
          autoResize(input);
          if (window.toggleMicSendButton) window.toggleMicSendButton();
        }
        
        addMessage('user', `📖 Reading page: ${response.content.title}`);
        
        const summaryPrompt = `Please summarize this page: ${response.content.title}\n\nContent preview: ${response.content.text.substring(0, 1000)}`;
        setTimeout(() => {
          const input = document.getElementById('sider-chat-input');
          if (input) {
            input.value = summaryPrompt;
            sendMessage();
          }
        }, 500);
      }
    });
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
    
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const imageThumb = document.getElementById('sider-image-preview-thumb');
    let hasImagePreview = false;
    
    if (imagePreviewSection && imagePreviewSection.style.display !== 'none' && imageThumb && imageThumb.src) {
      hasImagePreview = true;
    }
    
    if (pendingAttachments.length > 0) {
      const attachedHint = pendingAttachments
        .map(att => att.type === 'image' ? `📎 [image] ${att.name}` : `📎 ${att.name}`)
        .join('\n');
      addMessage('user', `${attachedHint}\n\n${message}`);
      pendingAttachments = [];
      renderAttachments();
      updateInputPaddingForAttachments();
    } else if (hasImagePreview) {
      const imageAlt = imageThumb.alt || 'Screenshot';
      addMessage('user', `${message}\n\n📎 [image] ${imageAlt}`);
    } else {
      addMessage('user', message);
    }
    
    if (hasImagePreview && imagePreviewSection) {
      imagePreviewSection.style.display = 'none';
      if (imageThumb) {
        imageThumb.src = '';
        imageThumb.alt = '';
      }
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
    const messagesContainer = document.getElementById('sider-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    const chatInput = document.getElementById('sider-chat-input');
    if (chatInput) {
      chatInput.value = '';
      autoResize(chatInput);
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
    
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
    if (welcome) {
      welcome.style.display = 'block';
    }
    if (summarizeCard) {
      setTimeout(() => {
        updatePageTitle();
      }, 100);
    }
    
    const aiDropdown = document.getElementById('sider-ai-dropdown');
    if (aiDropdown) {
      aiDropdown.style.display = 'none';
    }
    
    if (fileInput) {
      fileInput.value = '';
    }
    
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
  
  function handleSummarizeClick() {
    if (!currentTab || !currentTab.id) return;
    
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
    
    const pageTitle = currentTab.title || 'Page';
    const pageUrl = currentTab.url || '';
    
    chrome.tabs.sendMessage(currentTab.id, {
      action: 'summarize'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting page summary:', chrome.runtime.lastError);
        return;
      }
      
      const summarizePrompt = response && response.summary 
        ? response.summary 
        : `Summarize this page: ${pageTitle}\n\nURL: ${pageUrl}`;
      
      addMessage('user', `📄 Summarize: ${pageTitle}`);
      
      const thinkingMsg = addMessage('assistant', 'Thinking...', true);
      
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
    });
  }
  
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
        console.log('What\'s new clicked');
        break;
      case 'rewards':
        console.log('Rewards center clicked');
        break;
      case 'help':
        console.log('Help center clicked');
        break;
      case 'feedback':
        console.log('Feedback clicked');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
  
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
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      newCloseBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        imagePreviewSection.style.display = 'none';
        imageThumb.src = '';
        imageThumb.alt = '';
      };
    }
  }
  
  function showImagePreview(src, alt = 'Image') {
    const imagePreviewSection = document.getElementById('sider-image-preview-section');
    const selectedTextSection = document.getElementById('sider-selected-text-section');
    const input = document.getElementById('sider-chat-input');
    
    if (selectedTextSection) {
      selectedTextSection.style.display = 'none';
    }
    
    if (imagePreviewSection) {
      const imagesContainer = imagePreviewSection.querySelector('div:first-child');
      if (!imagesContainer) return;
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
        autoResize(input);
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
          handleImageAction(action, allImages.length === 1 ? allImages[0].src : allImages, allImages.length === 1 ? allImages[0].alt : 'Images');
        };
      });
    }
  }
  
  // Listen for screenshot and chat with image from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SCREENSHOT_CAPTURED' && request.dataUrl) {
      showImagePreview(request.dataUrl, `screenshot-${Date.now()}.png`);
    } else if (request.type === 'CHAT_WITH_IMAGE') {
      if (request.dataUrl) {
        // Image is already a data URL
        showImagePreview(request.dataUrl, request.alt || 'Image');
      } else if (request.imageUrl) {
        // Image is a URL, need to convert to data URL
        convertImageUrlToDataUrl(request.imageUrl).then(dataUrl => {
          showImagePreview(dataUrl, request.alt || 'Image');
        }).catch(err => {
          console.error('Error loading image:', err);
          // Fallback: try to show the URL directly (may not work due to CORS)
          showImagePreview(request.imageUrl, request.alt || 'Image');
        });
      }
    }
    return false;
  });
  
  // Helper function to convert image URL to data URL
  function convertImageUrlToDataUrl(url) {
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
  }
  
  // Listen for text action from toolbar
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TEXT_ACTION') {
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
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        setTimeout(() => sendMessage(), 200);
      } else if (request.action === 'prompt' && request.prompt) {
        // Show selected text section and set up with prompt
        const selectedTextSection = document.getElementById('sider-selected-text-section');
        const selectedTextDisplay = document.getElementById('sider-selected-text-display');
        if (selectedTextSection && selectedTextDisplay) {
          selectedTextDisplay.textContent = request.text;
          selectedTextSection.style.display = 'block';
        }
        input.value = `${request.prompt}: "${request.text}"`;
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
        setTimeout(() => sendMessage(), 200);
      } else if (request.action === 'add-note') {
        // Handle add to notes action
        const selectedTextSection = document.getElementById('sider-selected-text-section');
        const selectedTextDisplay = document.getElementById('sider-selected-text-display');
        if (selectedTextSection && selectedTextDisplay) {
          selectedTextDisplay.textContent = request.text;
          selectedTextSection.style.display = 'block';
        }
        input.value = `Add to notes: "${request.text}"`;
        autoResize(input);
        if (window.toggleMicSendButton) window.toggleMicSendButton();
      }
      return false;
    }
    
    if (request.type === 'TEXT_SELECTED' && request.text) {
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
            autoResize(input);
            if (window.toggleMicSendButton) window.toggleMicSendButton();
          };
        }
        
        actionButtons.forEach(btn => {
          if (btn.id !== 'sider-more-actions-btn') {
            btn.onclick = (e) => {
              e.stopPropagation();
              const action = btn.getAttribute('data-action');
              if (action && request.text) {
                handleSelectionAction(action, request.text);
              }
            };
          }
        });
        
        if (moreActionsBtn) {
          moreActionsBtn.onclick = (e) => {
            e.stopPropagation();
            showMoreSelectionActions(request.text);
          };
        }
      }
    }
    return false;
  });
  
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
    }
  }
  
  function showMoreSelectionActions(text) {
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
        handleSelectionAction(item.action, text);
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
  }
  
  function initializePanel() {
    // Get current tab
    getCurrentTab().then(tab => {
      currentTab = tab;
      updatePageTitle();
    });
    
    // Set icon sources
    const aiIconImg = document.getElementById('sider-ai-icon-img');
    if (aiIconImg) {
      aiIconImg.src = chrome.runtime.getURL('icons/fusion.png');
    }
    const screenshotIcon = document.getElementById('sider-screenshot-icon');
    if (screenshotIcon) {
      screenshotIcon.src = chrome.runtime.getURL('icons/cut.png');
    }
    
    const chatInput = document.getElementById('sider-chat-input');
    const aiSelectorBtn = document.getElementById('sider-ai-selector-btn');
    const aiDropdown = document.getElementById('sider-ai-dropdown');
    const screenshotBtn = document.getElementById('sider-screenshot-btn');
    const attachBtn = document.getElementById('sider-attach-btn');
    const readPageBtn = document.getElementById('sider-read-page-btn');
    const newChatBtn = document.getElementById('sider-new-chat-btn');
    const micBtn = document.getElementById('sider-mic-btn');
    fileInput = document.getElementById('sider-file-input');
    
    // New Chat button
    newChatBtn?.addEventListener('click', () => {
      createNewChat();
    });
    
    // Bottom action buttons
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
    
    // Toggle mic/send button
    window.toggleMicSendButton = function() {
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
      autoResize(e.target);
      toggleMicSendButton();
    });
    
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else {
        autoResize(e.target);
        setTimeout(() => {
          toggleMicSendButton();
        }, 0);
      }
    });
    
    chatInput?.addEventListener('paste', (e) => {
      setTimeout(() => {
        autoResize(e.target);
        toggleMicSendButton();
      }, 0);
    });
    
    if (chatInput) {
      toggleMicSendButton();
      setTimeout(() => {
        autoResize(chatInput);
        toggleMicSendButton();
      }, 100);
    } else {
      toggleMicSendButton();
    }
    
    // AI Model Selector
    aiSelectorBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.SiderAIModules) {
        window.SiderAIModules.open();
      } else {
        const isVisible = aiDropdown.style.display !== 'none';
        aiDropdown.style.display = isVisible ? 'none' : 'block';
      }
    });
    
    // AI dropdown options
    const aiOptions = aiDropdown?.querySelectorAll('.sider-ai-option');
    aiOptions?.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const model = option.getAttribute('data-model');
        currentModel = model;
        updateAISelectorIcon(model);
        aiDropdown.style.display = 'none';
        chrome.storage.sync.set({ sider_selected_model: model });
      });
    });
    
    // Initialize AI Modules if available
    if (window.SiderAIModules) {
      window.SiderAIModules.init(
        (model) => {
          currentModel = model;
          updateAISelectorIcon(model);
        },
        (model, text) => {
          addMessage('assistant', `[${model}] ${text}`);
        }
      );
    }
    
    // Load previously selected model
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
    
    // Screenshot button
    screenshotBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      startScreenshotMode();
    });
    
    // Chat control button
    const filterBtn = document.getElementById('sider-filter-btn');
    const chatControlsPopup = document.getElementById('sider-chat-controls-popup');
    
    filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (chatControlsPopup) {
        const isVisible = chatControlsPopup.style.display !== 'none';
        chatControlsPopup.style.display = isVisible ? 'none' : 'block';
      }
    });
    
    document.addEventListener('click', (e) => {
      if (chatControlsPopup && chatControlsPopup.style.display !== 'none') {
        if (!chatControlsPopup.contains(e.target) && !filterBtn?.contains(e.target)) {
          chatControlsPopup.style.display = 'none';
        }
      }
    });
    
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
    
    if (generationModelOptions && generationModelOptions.length > 0) {
      generationModelOptions[0].classList.add('sider-generation-model-option-selected');
    }
    
    // Collapse Nav Bar button
    const collapseNavbarBtn = document.getElementById('sider-collapse-navbar-btn');
    collapseNavbarBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNavbar();
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
      
      // Popup items click handlers
      const popupItems = sidebarPopup.querySelectorAll('.sider-sidebar-popup-item');
      popupItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          handleSidebarAction(action);
          hideSidebarPopup();
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
      
      const showMoreOptionsPopup = () => {
        clearTimeout(moreOptionsTimeout);
        if (moreOptionsIcon && moreOptionsPopup) {
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
      moreOptionsItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          console.log('More Options action:', action);
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
    
    // Summarize button
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
        if (currentTab && currentTab.url) {
          navigator.clipboard.writeText(currentTab.url).then(() => {
            const originalTitle = summarizeCopyBtn.getAttribute('title');
            summarizeCopyBtn.setAttribute('title', 'Copied!');
            setTimeout(() => {
              summarizeCopyBtn.setAttribute('title', originalTitle || 'Copy URL');
            }, 2000);
          }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = currentTab.url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          });
        }
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
    
    // Close AI dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (aiDropdown && aiDropdown.style.display !== 'none') {
        if (!aiDropdown.contains(e.target) && !aiSelectorBtn?.contains(e.target)) {
          aiDropdown.style.display = 'none';
        }
      }
    });
    
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          currentTab = tab;
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
          if (changeInfo.status === 'complete' || changeInfo.title) {
            currentTab = tab;
            updatePageTitle();
          }
        }
      } catch (e) {
        console.error('Error updating tab on update:', e);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePanel);
  } else {
    initializePanel();
  }
})();
