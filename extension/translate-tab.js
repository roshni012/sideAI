(function() {
  'use strict';
  
  const TranslateTab = {
    sourceLang: 'auto',
    targetLang: 'es',
    
    init: async function() {
      console.log('Translate tab initialized');
      this.loadModeIcons();
      this.attachEventListeners();
      this.loadSavedPreferences();
      this.loadPreferences();
      this.loadModeSelections();
      this.updateModeButtonText();
      this.initializeButtonVisibility();
    },
    
    loadModeIcons: function() {
      const iconImages = document.querySelectorAll('.sider-translate-mode-icon img[data-icon]');
      iconImages.forEach(img => {
        const iconFile = img.getAttribute('data-icon');
        if (iconFile) {
          img.src = chrome.runtime.getURL(`icons/${iconFile}`);
        }
      });
    },
    
    initializeButtonVisibility: function() {
      const textInput = document.getElementById('sider-translate-text-input');
      const clearBtn = document.getElementById('sider-translate-clear-btn');
      const speakerBtn = document.getElementById('sider-translate-speaker-btn');
      const dictionaryBtn = document.getElementById('sider-translate-dictionary-btn');
      const alsoSection = document.querySelector('.sider-translate-also-section');
      
      const hasText = textInput && textInput.value.trim().length > 0;
      
      if (clearBtn) clearBtn.style.display = hasText ? 'flex' : 'none';
      if (speakerBtn) speakerBtn.style.display = hasText ? 'flex' : 'none';
      if (dictionaryBtn) dictionaryBtn.style.display = hasText ? 'flex' : 'none';
      if (alsoSection) alsoSection.style.display = hasText ? 'none' : 'flex';
    },
    
    attachEventListeners: function() {
      const sourceSelect = document.getElementById('sider-translate-source-lang');
      const targetSelect = document.getElementById('sider-translate-target-lang');
      const swapBtn = document.getElementById('sider-translate-swap-btn');
      const textInput = document.getElementById('sider-translate-text-input');
      const submitBtn = document.getElementById('sider-translate-submit-btn');
      const clearBtn = document.getElementById('sider-translate-clear-btn');
      const micBtn = document.getElementById('sider-translate-mic-btn');
      const speakerBtn = document.getElementById('sider-translate-speaker-btn');
      const dictionaryBtn = document.getElementById('sider-translate-dictionary-btn');
      const copyBtn = document.getElementById('sider-translate-copy-btn');
      const alsoSection = document.querySelector('.sider-translate-also-section');
      const resultSpeakerBtn = document.getElementById('sider-translate-result-speaker-btn');
      const modeBtn = document.getElementById('sider-translate-mode-btn');
      const preferencesBtn = document.getElementById('sider-translate-preferences-btn');
      const pdfBtn = document.getElementById('sider-translate-pdf-btn');
      const longBtn = document.getElementById('sider-translate-long-btn');
      const imageAlsoBtn = document.getElementById('sider-translate-image-also-btn');
      
      if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
          this.sourceLang = e.target.value;
          this.savePreferences();
        });
      }
      
      if (targetSelect) {
        targetSelect.addEventListener('change', (e) => {
          this.targetLang = e.target.value;
          this.savePreferences();
        });
      }
      
      if (swapBtn) {
        swapBtn.addEventListener('click', () => this.swapLanguages());
      }
      
      if (textInput) {
        textInput.addEventListener('input', () => {
          const hasText = textInput.value.trim().length > 0;
          if (submitBtn) {
            submitBtn.disabled = !hasText;
            submitBtn.style.opacity = hasText ? '1' : '0.6';
            submitBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
          }
          
          // Show/hide buttons based on text input
          if (clearBtn) {
            clearBtn.style.display = hasText ? 'flex' : 'none';
          }
          if (speakerBtn) {
            speakerBtn.style.display = hasText ? 'flex' : 'none';
          }
          if (dictionaryBtn) {
            dictionaryBtn.style.display = hasText ? 'flex' : 'none';
          }
          
          // Show/hide "also translate" section
          if (alsoSection) {
            alsoSection.style.display = hasText ? 'none' : 'flex';
          }
        });
        
        textInput.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.translate();
          }
        });
      }
      
      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.translate());
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearText());
      }
      
      if (micBtn) {
        micBtn.addEventListener('click', () => this.startVoiceInput());
      }
      
      if (speakerBtn) {
        speakerBtn.addEventListener('click', () => this.speakText(textInput?.value));
      }
      
      if (dictionaryBtn) {
        dictionaryBtn.addEventListener('click', () => this.showDictionary());
      }
      
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyResult());
      }
      
      if (resultSpeakerBtn) {
        resultSpeakerBtn.addEventListener('click', () => {
          const resultContent = document.getElementById('sider-translate-result-content');
          if (resultContent) {
            this.speakText(resultContent.textContent);
          }
        });
      }
      
      if (modeBtn) {
        modeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showModeMenu();
        });
      }
      
      // Add event listeners for mode checkboxes
      const modeCheckboxes = document.querySelectorAll('.sider-translate-mode-item input[type="checkbox"]');
      modeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          this.handleModeSelection(checkbox);
        });
      });
      
      if (preferencesBtn) {
        preferencesBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showPreferencesMenu();
        });
      }
      
      // Add event listeners for preference buttons
      const preferenceButtons = document.querySelectorAll('.sider-translate-preference-btn');
      preferenceButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handlePreferenceClick(btn);
        });
      });
      
      if (pdfBtn) {
        pdfBtn.addEventListener('click', () => this.handlePdfTranslate());
      }
      
      if (longBtn) {
        longBtn.addEventListener('click', () => this.handleLongTextTranslate());
      }
      
      if (imageAlsoBtn) {
        imageAlsoBtn.addEventListener('click', () => this.handleImageTranslate());
      }
    },
    
    swapLanguages: function() {
      const sourceSelect = document.getElementById('sider-translate-source-lang');
      const targetSelect = document.getElementById('sider-translate-target-lang');
      
      if (!sourceSelect || !targetSelect) return;
      
      const sourceValue = sourceSelect.value;
      const targetValue = targetSelect.value;
      
      if (sourceValue === 'auto') {
        return;
      }
      
      sourceSelect.value = targetValue === 'auto' ? 'en' : targetValue;
      targetSelect.value = sourceValue;
      
      this.sourceLang = sourceSelect.value;
      this.targetLang = targetSelect.value;
      
      const textInput = document.getElementById('sider-translate-text-input');
      const resultBox = document.getElementById('sider-translate-result-box');
      if (textInput && resultBox) {
        const resultContent = document.getElementById('sider-translate-result-content');
        if (resultContent && resultContent.textContent.trim()) {
          textInput.value = resultContent.textContent;
          resultBox.style.display = 'none';
        }
      }
      
      this.savePreferences();
    },
    
    translate: async function() {
      const textInput = document.getElementById('sider-translate-text-input');
      const resultBox = document.getElementById('sider-translate-result-box');
      const resultContent = document.getElementById('sider-translate-result-content');
      const resultLang = document.getElementById('sider-translate-result-lang');
      const submitBtn = document.getElementById('sider-translate-submit-btn');
      
      if (!textInput || !resultBox || !resultContent) return;
      
      const text = textInput.value.trim();
      if (!text) return;
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Translating...';
      }
      
      try {
        const sourceLang = this.sourceLang === 'auto' ? 'auto' : this.sourceLang;
        const targetLang = this.targetLang;
        
        const translatedText = await this.performTranslation(text, sourceLang, targetLang);
        
        resultContent.textContent = translatedText;
        if (resultLang) {
          const langNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese'
          };
          resultLang.textContent = langNames[targetLang] || targetLang.toUpperCase();
        }
        
        resultBox.style.display = 'flex';
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Translate';
        }
      } catch (error) {
        console.error('Translation error:', error);
        resultContent.textContent = 'Translation failed. Please try again.';
        resultBox.style.display = 'flex';
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Translate';
        }
      }
    },
    
    performTranslation: async function(text, sourceLang, targetLang) {
      if (!window.SiderAPI || !window.SiderAPI.translate) {
        return this.fallbackTranslation(text, sourceLang, targetLang);
      }
      
      try {
        const result = await window.SiderAPI.translate(text, sourceLang, targetLang);
        return result.translatedText || result;
      } catch (error) {
        console.error('API translation error:', error);
        return this.fallbackTranslation(text, sourceLang, targetLang);
      }
    },
    
    fallbackTranslation: function(text, sourceLang, targetLang) {
      return `[Translation placeholder] ${text} (${sourceLang} → ${targetLang})`;
    },
    
    clearText: function() {
      const textInput = document.getElementById('sider-translate-text-input');
      const resultBox = document.getElementById('sider-translate-result-box');
      const submitBtn = document.getElementById('sider-translate-submit-btn');
      const clearBtn = document.getElementById('sider-translate-clear-btn');
      const speakerBtn = document.getElementById('sider-translate-speaker-btn');
      const dictionaryBtn = document.getElementById('sider-translate-dictionary-btn');
      const alsoSection = document.querySelector('.sider-translate-also-section');
      
      if (textInput) {
        textInput.value = '';
        textInput.dispatchEvent(new Event('input'));
      }
      if (resultBox) resultBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
      }
      
      // Hide buttons when text is cleared
      if (clearBtn) clearBtn.style.display = 'none';
      if (speakerBtn) speakerBtn.style.display = 'none';
      if (dictionaryBtn) dictionaryBtn.style.display = 'none';
      if (alsoSection) alsoSection.style.display = 'flex';
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
      recognition.lang = this.getLanguageCode(this.sourceLang);
      
      const textInput = document.getElementById('sider-translate-text-input');
      const micBtn = document.getElementById('sider-translate-mic-btn');
      
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
      const targetLang = this.targetLang;
      utterance.lang = this.getLanguageCode(targetLang);
      
      speechSynthesis.speak(utterance);
    },
    
    getLanguageCode: function(lang) {
      const langMap = {
        'auto': 'en-US',
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh': 'zh-CN'
      };
      return langMap[lang] || 'en-US';
    },
    
    copyResult: function() {
      const resultContent = document.getElementById('sider-translate-result-content');
      if (!resultContent) return;
      
      const text = resultContent.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('sider-translate-copy-btn');
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
    
    showDictionary: function() {
      const textInput = document.getElementById('sider-translate-text-input');
      if (!textInput) return;
      
      const text = textInput.value.trim();
      if (!text) return;
      
      // Get the selected word or use the full text
      const selectedText = window.getSelection().toString() || text.split(' ')[0];
      
      console.log('Show dictionary for:', selectedText);
      // TODO: Implement dictionary lookup functionality
      // This could open a dictionary modal or show definitions
    },
    
    handleImageTranslate: function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('Image translate:', file.name);
        }
      };
      input.click();
    },
    
    handlePdfTranslate: function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('PDF translate:', file.name);
        }
      };
      input.click();
    },
    
    handleLongTextTranslate: function() {
      console.log('Long text translate');
    },
    
    showModeMenu: function() {
      const popup = document.getElementById('sider-translate-mode-popup');
      const btn = document.getElementById('sider-translate-mode-btn');
      
      if (!popup || !btn) return;
      
      const isOpen = popup.style.display !== 'none';
      
      if (isOpen) {
        popup.style.display = 'none';
        btn.classList.remove('active');
      } else {
        popup.style.display = 'block';
        btn.classList.add('active');
        
        // Close popup when clicking outside
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
    
    handleModeSelection: function(checkbox) {
      const value = checkbox.value;
      const isChecked = checkbox.checked;
      
      // Save selected modes
      this.saveModeSelection(value, isChecked);
      
      // Update button text
      this.updateModeButtonText();
      
      console.log('Mode selection changed:', value, isChecked);
    },
    
    saveModeSelection: function(mode, isSelected) {
      try {
        const savedModes = JSON.parse(localStorage.getItem('sider-translate-modes') || '[]');
        if (isSelected) {
          if (!savedModes.includes(mode)) {
            savedModes.push(mode);
          }
        } else {
          const index = savedModes.indexOf(mode);
          if (index > -1) {
            savedModes.splice(index, 1);
          }
        }
        localStorage.setItem('sider-translate-modes', JSON.stringify(savedModes));
      } catch (e) {
        console.error('Failed to save mode selection:', e);
      }
    },
    
    loadModeSelections: function() {
      try {
        const savedModes = JSON.parse(localStorage.getItem('sider-translate-modes') || '["sider-fusion"]');
        const checkboxes = document.querySelectorAll('.sider-translate-mode-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = savedModes.includes(checkbox.value);
        });
      } catch (e) {
        console.error('Failed to load mode selections:', e);
      }
    },
    
    updateModeButtonText: function() {
      const modeIconsContainer = document.getElementById('sider-translate-mode-icons');
      if (!modeIconsContainer) return;
      
      try {
        const savedModes = JSON.parse(localStorage.getItem('sider-translate-modes') || '["sider-fusion"]');
        const modeIconMap = {
          'sider-fusion': 'fusion.png',
          'gpt-5-mini': 'gpt_5mini.png',
          'claude-haiku-4.5': 'claude.png',
          'claude-3.5-haiku': 'claude.png',
          'gemini-2.5-flash': 'gemini.png',
          'kimi-k2': 'kimi.png',
          'deepseek-v3': 'deepseek.png',
          'gpt-5': 'chatgpt.png',
          'gpt-4.1': 'chatgpt.png',
          'deepseek-v3.1': 'deepseek.png',
          'claude-haiku-4.5-think': 'claude.png',
          'claude-sonnet-4.5': 'claude.png',
          'claude-3.7-sonnet': 'claude.png',
          'claude-sonnet-4': 'claude.png',
          'gemini-2.5-pro': 'gemini.png',
          'gemini-2.5-flash-think': 'gemini.png',
          'grok-4': 'grok.png'
        };
        
        // Clear existing icons
        modeIconsContainer.innerHTML = '';
        
        if (savedModes.length === 0) {
          // Show nothing or placeholder
          return;
        }
        
        // If 3 or fewer models, show all icons
        if (savedModes.length <= 3) {
          savedModes.forEach(mode => {
            const iconFile = modeIconMap[mode];
            if (iconFile) {
              const iconBadge = document.createElement('span');
              iconBadge.className = 'sider-translate-mode-icon-badge';
              iconBadge.setAttribute('data-mode', mode);
              
              const img = document.createElement('img');
              img.src = chrome.runtime.getURL(`icons/${iconFile}`);
              img.alt = mode;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'contain';
              img.style.display = 'block';
              
              iconBadge.appendChild(img);
              modeIconsContainer.appendChild(iconBadge);
            }
          });
        } else {
          // If more than 3 models, show only first 2 icons and count
          const modesToShow = savedModes.slice(0, 2);
          modesToShow.forEach(mode => {
            const iconFile = modeIconMap[mode];
            if (iconFile) {
              const iconBadge = document.createElement('span');
              iconBadge.className = 'sider-translate-mode-icon-badge';
              iconBadge.setAttribute('data-mode', mode);
              
              const img = document.createElement('img');
              img.src = chrome.runtime.getURL(`icons/${iconFile}`);
              img.alt = mode;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'contain';
              img.style.display = 'block';
              
              iconBadge.appendChild(img);
              modeIconsContainer.appendChild(iconBadge);
            }
          });
          
          // Add count badge for remaining models
          const remainingCount = savedModes.length - 2;
          const countBadge = document.createElement('span');
          countBadge.className = 'sider-translate-mode-count-badge';
          countBadge.textContent = `+${remainingCount}`;
          modeIconsContainer.appendChild(countBadge);
        }
      } catch (e) {
        console.error('Failed to update mode button icons:', e);
        modeIconsContainer.innerHTML = '';
      }
    },
    
    showPreferencesMenu: function() {
      const popup = document.getElementById('sider-translate-preferences-popup');
      const btn = document.getElementById('sider-translate-preferences-btn');
      
      if (!popup || !btn) return;
      
      const isOpen = popup.style.display !== 'none';
      
      if (isOpen) {
        popup.style.display = 'none';
        btn.classList.remove('active');
      } else {
        popup.style.display = 'block';
        btn.classList.add('active');
        
        // Close popup when clicking outside
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
    
    handlePreferenceClick: function(button) {
      const preference = button.getAttribute('data-preference');
      const value = button.getAttribute('data-value');
      
      // Remove active class from all buttons in the same group
      const group = button.closest('.sider-translate-preference-group');
      const allButtons = group.querySelectorAll('.sider-translate-preference-btn');
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Save preference
      this.savePreference(preference, value);
      
      console.log('Preference changed:', preference, value);
    },
    
    savePreference: function(preference, value) {
      try {
        localStorage.setItem(`sider-translate-preference-${preference}`, value);
      } catch (e) {
        console.error('Failed to save preference:', e);
      }
    },
    
    loadPreferences: function() {
      const preferences = ['length', 'tone', 'style', 'complexity'];
      preferences.forEach(pref => {
        const saved = localStorage.getItem(`sider-translate-preference-${pref}`);
        if (saved) {
          const button = document.querySelector(`[data-preference="${pref}"][data-value="${saved}"]`);
          if (button) {
            const group = button.closest('.sider-translate-preference-group');
            const allButtons = group.querySelectorAll('.sider-translate-preference-btn');
            allButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
          }
        }
      });
    },
    
    savePreferences: function() {
      try {
        localStorage.setItem('sider-translate-source-lang', this.sourceLang);
        localStorage.setItem('sider-translate-target-lang', this.targetLang);
      } catch (e) {
        console.error('Failed to save preferences:', e);
      }
    },
    
    loadSavedPreferences: function() {
      try {
        const savedSource = localStorage.getItem('sider-translate-source-lang');
        const savedTarget = localStorage.getItem('sider-translate-target-lang');
        
        if (savedSource) {
          this.sourceLang = savedSource;
          const sourceSelect = document.getElementById('sider-translate-source-lang');
          if (sourceSelect) sourceSelect.value = savedSource;
        }
        
        if (savedTarget) {
          this.targetLang = savedTarget;
          const targetSelect = document.getElementById('sider-translate-target-lang');
          if (targetSelect) targetSelect.value = savedTarget;
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    },
    
    switchToTranslate: function() {
      const container = document.getElementById('sider-translate-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderTranslateTab = TranslateTab;
})();
