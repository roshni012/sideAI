(function() {
  'use strict';
  
  const AskTab = {
    currentModel: 'GPT-5',
    currentPrompt: 'custom',
    
    init: async function() {
      console.log('Ask tab initialized');
      this.loadModelIcon();
      this.loadSavedModel();
      this.loadSavedPrompt();
      this.initializeAIModules();
      this.attachEventListeners();
      this.initializeButtonVisibility();
      
      // Apply icon-only class by default
      const modelBtn = document.getElementById('sider-ask-ai-selector-btn');
      if (modelBtn) {
        modelBtn.classList.add('icon-only');
      }
    },
    
    initializeAIModules: function() {
      // Listen for model changes from storage (when selected in AI modules)
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.sider_selected_model) {
          const newModel = changes.sider_selected_model.newValue;
          if (newModel) {
            this.updateModel(newModel);
          }
        }
      });
      
      // Load current model from storage
      chrome.storage.sync.get(['sider_selected_model'], (result) => {
        if (result.sider_selected_model) {
          this.updateModel(result.sider_selected_model);
        }
      });
    },
    
    loadModelIcon: function() {
      const iconImg = document.getElementById('sider-ask-ai-icon-img');
      if (iconImg) {
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
        
        const savedModel = localStorage.getItem('sider-ask-model') || 'GPT-5';
        const iconUrl = iconMap[savedModel] || iconMap['GPT-5'] || chrome.runtime.getURL('icons/chatgpt.png');
        iconImg.src = iconUrl;
      }
    },
    
    loadSavedModel: function() {
      try {
        const savedModel = localStorage.getItem('sider-ask-model');
        if (savedModel) {
          this.currentModel = savedModel;
          const modelBtn = document.getElementById('sider-ask-ai-selector-btn');
          const modelText = document.getElementById('sider-ask-model-text');
          if (modelText) {
            modelText.textContent = savedModel;
          }
          // Apply icon-only class if model is saved
          if (modelBtn && savedModel) {
            modelBtn.classList.add('icon-only');
          }
        }
      } catch (e) {
        console.error('Failed to load saved model:', e);
      }
    },
    
    updateModel: function(model) {
      this.currentModel = model;
      const modelBtn = document.getElementById('sider-ask-ai-selector-btn');
      const modelText = document.getElementById('sider-ask-model-text');
      const iconImg = document.getElementById('sider-ask-ai-icon-img');
      
      // Hide text and arrow, show only icon
      if (modelBtn) {
        modelBtn.classList.add('icon-only');
      }
      
      if (modelText) {
        modelText.textContent = model;
      }
      
      if (iconImg) {
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
        
        const iconUrl = iconMap[model] || iconMap['GPT-5'] || chrome.runtime.getURL('icons/chatgpt.png');
        iconImg.src = iconUrl;
      }
      
      this.saveModel();
    },
    
    initializeButtonVisibility: function() {
      const textInput = document.getElementById('sider-ask-text-input');
      const clearBtn = document.getElementById('sider-ask-clear-btn');
      
      const hasText = textInput && textInput.value.trim().length > 0;
      
      if (clearBtn) clearBtn.style.display = hasText ? 'flex' : 'none';
    },
    
    attachEventListeners: function() {
      const aiSelectorBtn = document.getElementById('sider-ask-ai-selector-btn');
      const customPromptBtn = document.getElementById('sider-ask-custom-prompt-btn');
      const textInput = document.getElementById('sider-ask-text-input');
      const sendBtn = document.getElementById('sider-ask-send-btn');
      const clearBtn = document.getElementById('sider-ask-clear-btn');
      const micBtn = document.getElementById('sider-ask-mic-btn');
      
      // AI Model Selector - Use SiderAIModules
      if (aiSelectorBtn) {
        aiSelectorBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          if (window.SiderAIModules) {
            // Temporarily change button ID for SiderAIModules.open()
            const originalId = aiSelectorBtn.id;
            aiSelectorBtn.id = 'sider-ai-selector-btn';
            
            window.SiderAIModules.open();
            
            // Restore original ID after modal opens
            setTimeout(() => {
              aiSelectorBtn.id = originalId;
            }, 100);
          } else {
            console.warn('SiderAIModules not available');
          }
        });
      }
      
      // Custom Prompt Button
      if (customPromptBtn) {
        customPromptBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showCustomPromptMenu();
        });
      }
      
      // Custom Prompt Items
      const customPromptItems = document.querySelectorAll('.sider-ask-custom-prompt-item');
      customPromptItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const prompt = item.getAttribute('data-prompt');
          const label = item.getAttribute('data-label');
          const icon = item.getAttribute('data-icon');
          this.selectPrompt(prompt, label, icon);
          this.hideCustomPromptMenu();
        });
      });
      
      // Text input
      if (textInput) {
        textInput.addEventListener('input', () => {
          const hasText = textInput.value.trim().length > 0;
          
          if (sendBtn) {
            sendBtn.disabled = !hasText;
          }
          
          if (clearBtn) {
            clearBtn.style.display = hasText ? 'flex' : 'none';
          }
        });
        
        textInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
      
      if (sendBtn) {
        sendBtn.addEventListener('click', () => this.sendMessage());
        sendBtn.disabled = true;
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearText());
      }
      
      if (micBtn) {
        micBtn.addEventListener('click', () => this.startVoiceInput());
      }
      
      // Close popups when clicking outside
      document.addEventListener('click', (e) => {
        const customPromptPopup = document.getElementById('sider-ask-custom-prompt-popup');
        if (customPromptPopup && customPromptPopup.style.display !== 'none') {
          if (!customPromptPopup.contains(e.target) && !customPromptBtn.contains(e.target)) {
            this.hideCustomPromptMenu();
          }
        }
      });
    },
    
    showCustomPromptMenu: function() {
      const popup = document.getElementById('sider-ask-custom-prompt-popup');
      const btn = document.getElementById('sider-ask-custom-prompt-btn');
      
      if (!popup || !btn) return;
      
      const isOpen = popup.style.display !== 'none';
      
      if (isOpen) {
        popup.style.display = 'none';
        btn.classList.remove('active');
      } else {
        popup.style.display = 'block';
        btn.classList.add('active');
      }
    },
    
    hideCustomPromptMenu: function() {
      const popup = document.getElementById('sider-ask-custom-prompt-popup');
      const btn = document.getElementById('sider-ask-custom-prompt-btn');
      
      if (popup) popup.style.display = 'none';
      if (btn) btn.classList.remove('active');
    },
    
    loadSavedPrompt: function() {
      try {
        const savedPrompt = localStorage.getItem('sider-ask-prompt') || 'custom';
        const savedLabel = localStorage.getItem('sider-ask-prompt-label') || 'Custom prompt';
        const savedIcon = localStorage.getItem('sider-ask-prompt-icon') || 'sparkle';
        this.currentPrompt = savedPrompt;
        this.updatePromptButton(savedLabel, savedIcon);
        this.updatePromptSelection(savedPrompt);
      } catch (e) {
        console.error('Failed to load saved prompt:', e);
      }
    },
    
    selectPrompt: function(prompt, label, icon) {
      this.currentPrompt = prompt;
      this.updatePromptButton(label, icon);
      this.updatePromptSelection(prompt);
      this.savePrompt(prompt, label, icon);
    },
    
    updatePromptButton: function(label, icon) {
      const promptText = document.getElementById('sider-ask-prompt-text');
      const promptIcon = document.getElementById('sider-ask-prompt-icon');
      
      if (promptText) {
        promptText.textContent = label;
      }
      
      if (promptIcon) {
        // Update icon based on icon type
        const iconSVG = this.getPromptIconSVG(icon);
        if (iconSVG) {
          promptIcon.innerHTML = iconSVG;
        }
      }
    },
    
    updatePromptSelection: function(prompt) {
      const items = document.querySelectorAll('.sider-ask-custom-prompt-item');
      items.forEach(item => {
        if (item.getAttribute('data-prompt') === prompt) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    },
    
    getPromptIconSVG: function(iconType) {
      const icons = {
        'sparkle': '<svg class="sider-ask-sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        'document': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        'arrows': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/><polyline points="15 18 21 12 15 6"/></svg>',
        'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><circle cx="11" cy="11" r="2"/><path d="M16 16l-2-2"/></svg>',
        'pen': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/><path d="M12 13l2 2 4-4"/></svg>',
        'checklist': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><polyline points="9 11 10 12 13 9"/></svg>',
        'question': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'code': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        'flag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
        'lines-short': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="16" x2="19" y2="16"/></svg>',
        'lines-long': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>',
        'text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
        'smile': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        'lightbulb': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.5 1.5 4.5 3 6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6M9 9h6"/></svg>',
        'list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        'text-bold': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9"/></svg>'
      };
      
      return icons[iconType] || icons['sparkle'];
    },
    
    savePrompt: function(prompt, label, icon) {
      try {
        localStorage.setItem('sider-ask-prompt', prompt);
        localStorage.setItem('sider-ask-prompt-label', label);
        localStorage.setItem('sider-ask-prompt-icon', icon);
      } catch (e) {
        console.error('Failed to save prompt:', e);
      }
    },
    
    sendMessage: async function() {
      const textInput = document.getElementById('sider-ask-text-input');
      const sendBtn = document.getElementById('sider-ask-send-btn');
      
      if (!textInput) return;
      
      const text = textInput.value.trim();
      if (!text) return;
      
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
      }
      
      try {
        // TODO: Implement actual API call
        console.log('Sending message:', text, 'with model:', this.currentModel);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear input after sending
        textInput.value = '';
        textInput.dispatchEvent(new Event('input'));
        
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
      }
    },
    
    clearText: function() {
      const textInput = document.getElementById('sider-ask-text-input');
      const sendBtn = document.getElementById('sider-ask-send-btn');
      const clearBtn = document.getElementById('sider-ask-clear-btn');
      
      if (textInput) {
        textInput.value = '';
        textInput.dispatchEvent(new Event('input'));
      }
      if (sendBtn) {
        sendBtn.disabled = true;
      }
      if (clearBtn) clearBtn.style.display = 'none';
    },
    
    startVoiceInput: function() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser.');
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      const textInput = document.getElementById('sider-ask-text-input');
      const micBtn = document.getElementById('sider-ask-mic-btn');
      
      if (micBtn) {
        micBtn.style.background = '#fee2e2';
        micBtn.style.color = '#dc2626';
      }
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (textInput) {
          textInput.value = transcript;
          textInput.dispatchEvent(new Event('input'));
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (micBtn) {
          micBtn.style.background = '';
          micBtn.style.color = '';
        }
      };
      
      recognition.onend = () => {
        if (micBtn) {
          micBtn.style.background = '';
          micBtn.style.color = '';
        }
      };
      
      recognition.start();
    },
    
    saveModel: function() {
      try {
        localStorage.setItem('sider-ask-model', this.currentModel);
      } catch (e) {
        console.error('Failed to save model:', e);
      }
    },
    
    switchToAsk: function() {
      const container = document.getElementById('sider-ask-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderAskTab = AskTab;
})();
