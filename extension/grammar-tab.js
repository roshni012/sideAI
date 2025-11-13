(function() {
  'use strict';
  
  const GrammarTab = {
    currentModel: 'gpt-4.1',
    
    init: async function() {
      console.log('Grammar tab initialized');
      this.loadModeIcons();
      this.loadSavedModel();
      this.attachEventListeners();
      this.initializeButtonVisibility();
    },
    
    loadModeIcons: function() {
      const iconImages = document.querySelectorAll('.sider-grammar-mode-icon img[data-icon]');
      iconImages.forEach(img => {
        const iconFile = img.getAttribute('data-icon');
        if (iconFile) {
          img.src = chrome.runtime.getURL(`icons/${iconFile}`);
        }
      });
      
      // Load initial model icon
      this.updateModelIcon(this.currentModel);
    },
    
    loadSavedModel: function() {
      try {
        const savedModel = localStorage.getItem('sider-grammar-model');
        if (savedModel) {
          this.currentModel = savedModel;
          const radio = document.querySelector(`input[name="grammar-mode"][value="${savedModel}"]`);
          if (radio) {
            radio.checked = true;
            this.updateModelIcon(savedModel);
            this.updateModelText(savedModel);
          }
        } else {
          // Set default to GPT-4.1
          const defaultRadio = document.querySelector('input[name="grammar-mode"][value="gpt-4.1"]');
          if (defaultRadio) {
            defaultRadio.checked = true;
            this.updateModelIcon('gpt-4.1');
            this.updateModelText('gpt-4.1');
          }
        }
      } catch (e) {
        console.error('Failed to load saved model:', e);
      }
    },
    
    updateModelIcon: function(model) {
      const iconMap = {
        'gpt-5-mini': 'gpt_5mini.png',
        'gpt-5': 'chatgpt.png',
        'gpt-4.1': 'chatgpt.png'
      };
      
      const iconImg = document.getElementById('sider-grammar-mode-icon-img');
      if (iconImg) {
        const iconFile = iconMap[model] || 'chatgpt.png';
        iconImg.src = chrome.runtime.getURL(`icons/${iconFile}`);
      }
    },
    
    updateModelText: function(model) {
      const modelNames = {
        'gpt-5-mini': 'GPT-5 mini',
        'gpt-5': 'GPT-5',
        'gpt-4.1': 'GPT-4.1'
      };
      
      const modeText = document.getElementById('sider-grammar-mode-text');
      if (modeText) {
        modeText.textContent = modelNames[model] || 'GPT-4.1';
      }
    },
    
    initializeButtonVisibility: function() {
      const textInput = document.getElementById('sider-grammar-text-input');
      const clearBtn = document.getElementById('sider-grammar-clear-btn');
      const copyBtn = document.getElementById('sider-grammar-copy-btn');
      
      const hasText = textInput && textInput.value.trim().length > 0;
      
      if (clearBtn) clearBtn.style.display = hasText ? 'flex' : 'none';
      if (copyBtn) copyBtn.style.display = hasText ? 'flex' : 'none';
    },
    
    attachEventListeners: function() {
      const modeBtn = document.getElementById('sider-grammar-mode-btn');
      const textInput = document.getElementById('sider-grammar-text-input');
      const submitBtn = document.getElementById('sider-grammar-submit-btn');
      const clearBtn = document.getElementById('sider-grammar-clear-btn');
      const copyBtn = document.getElementById('sider-grammar-copy-btn');
      const micBtn = document.getElementById('sider-grammar-mic-btn');
      const resultCopyBtn = document.getElementById('sider-grammar-result-copy-btn');
      const resultSpeakerBtn = document.getElementById('sider-grammar-result-speaker-btn');
      
      // Mode selection
      if (modeBtn) {
        modeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showModeMenu();
        });
      }
      
      // Radio button changes
      const modeRadios = document.querySelectorAll('input[name="grammar-mode"]');
      modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.currentModel = e.target.value;
            this.updateModelIcon(this.currentModel);
            this.updateModelText(this.currentModel);
            this.saveModel();
          }
        });
      });
      
      // Text input
      if (textInput) {
        textInput.addEventListener('input', () => {
          const hasText = textInput.value.trim().length > 0;
          
          if (submitBtn) {
            submitBtn.disabled = !hasText;
          }
          
          if (clearBtn) {
            clearBtn.style.display = hasText ? 'flex' : 'none';
          }
          if (copyBtn) {
            copyBtn.style.display = hasText ? 'flex' : 'none';
          }
        });
        
        textInput.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.improveText();
          }
        });
      }
      
      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.improveText());
        submitBtn.disabled = true;
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearText());
      }
      
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyText());
      }
      
      if (micBtn) {
        micBtn.addEventListener('click', () => this.startVoiceInput());
      }
      
      if (resultCopyBtn) {
        resultCopyBtn.addEventListener('click', () => this.copyResult());
      }
      
      if (resultSpeakerBtn) {
        resultSpeakerBtn.addEventListener('click', () => {
          const resultContent = document.getElementById('sider-grammar-result-content');
          if (resultContent) {
            this.speakText(resultContent.textContent);
          }
        });
      }
    },
    
    showModeMenu: function() {
      const popup = document.getElementById('sider-grammar-mode-popup');
      const btn = document.getElementById('sider-grammar-mode-btn');
      
      if (!popup || !btn) return;
      
      const isOpen = popup.style.display !== 'none';
      
      if (isOpen) {
        popup.style.display = 'none';
        btn.classList.remove('active');
      } else {
        popup.style.display = 'block';
        btn.classList.add('active');
        
        setTimeout(() => {
          const closeOnOutsideClick = (e) => {
            if (!popup.contains(e.target) && !btn.contains(e.target)) {
              popup.style.display = 'none';
              btn.classList.remove('active');
              document.removeEventListener('click', closeOnOutsideClick);
            }
          };
          document.addEventListener('click', closeOnOutsideClick);
        }, 0);
      }
    },
    
    improveText: async function() {
      const textInput = document.getElementById('sider-grammar-text-input');
      const resultBox = document.getElementById('sider-grammar-result-box');
      const resultContent = document.getElementById('sider-grammar-result-content');
      const submitBtn = document.getElementById('sider-grammar-submit-btn');
      
      if (!textInput || !resultBox || !resultContent) return;
      
      const text = textInput.value.trim();
      if (!text) return;
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Improving...';
      }
      
      try {
        const improvedText = await this.performGrammarCheck(text);
        
        resultContent.textContent = improvedText;
        resultBox.style.display = 'flex';
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Improve';
        }
      } catch (error) {
        console.error('Grammar check error:', error);
        resultContent.textContent = 'Grammar check failed. Please try again.';
        resultBox.style.display = 'flex';
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Improve';
        }
      }
    },
    
    performGrammarCheck: async function(text) {
      // Placeholder for API call
      // This should be replaced with actual grammar checking API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`[Grammar checked] ${text}`);
        }, 1000);
      });
    },
    
    clearText: function() {
      const textInput = document.getElementById('sider-grammar-text-input');
      const resultBox = document.getElementById('sider-grammar-result-box');
      const submitBtn = document.getElementById('sider-grammar-submit-btn');
      const clearBtn = document.getElementById('sider-grammar-clear-btn');
      const copyBtn = document.getElementById('sider-grammar-copy-btn');
      
      if (textInput) {
        textInput.value = '';
        textInput.dispatchEvent(new Event('input'));
      }
      if (resultBox) resultBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (clearBtn) clearBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';
    },
    
    copyText: function() {
      const textInput = document.getElementById('sider-grammar-text-input');
      if (!textInput) return;
      
      const text = textInput.value.trim();
      if (!text) return;
      
      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('sider-grammar-copy-btn');
        if (copyBtn) {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    },
    
    copyResult: function() {
      const resultContent = document.getElementById('sider-grammar-result-content');
      if (!resultContent) return;
      
      const text = resultContent.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('sider-grammar-result-copy-btn');
        if (copyBtn) {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
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
      
      const textInput = document.getElementById('sider-grammar-text-input');
      const micBtn = document.getElementById('sider-grammar-mic-btn');
      
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
    
    speakText: function(text) {
      if (!text || !('speechSynthesis' in window)) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    },
    
    saveModel: function() {
      try {
        localStorage.setItem('sider-grammar-model', this.currentModel);
      } catch (e) {
        console.error('Failed to save model:', e);
      }
    },
    
    switchToGrammar: function() {
      const container = document.getElementById('sider-grammar-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderGrammarTab = GrammarTab;
})();
