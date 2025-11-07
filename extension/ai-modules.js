(function() {
  'use strict';

  function createModal() {
    const modalEl = document.createElement('div');
    modalEl.className = 'sider-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'sider-modal-title');
    modalEl.innerHTML = `
      <div class="sider-modal-header">
        <h3 id="sider-modal-title">Select AI Provider</h3>
      </div>
      <div class="sider-modal-body">
        <div class="sider-model-list">
          <div class="sider-model-section">
            <div class="sider-model-section-title">Basic</div>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/fusion.png')}" alt="Fusion" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Sider Fusion</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Sider Fusion" />
            </label>
             <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/gpt_5mini.png')}" alt="GPT-5 mini" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">GPT-5 mini</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="GPT-5 mini" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude Haiku" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Cloude Haiku 4.5</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Cloude Haiku 4.5" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/gemini.png')}" alt="Gemini 2.5 Flash" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Gemini 2.5 Flash</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Gemini 2.5 Flash" />
            </label>
          </div>
          <div class="sider-model-section">
            <div class="sider-model-section-title">Advanced</div>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/chatgpt.png')}" alt="GPT-5" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">GPT-5</span>
                  <span class="sider-model-subtitle">Best for Chat</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="GPT-5" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/chatgpt.png')}" alt="GPT-4.0" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">GPT-4.0</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="GPT-4.0" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/deepseek.png')}" alt="DeepSeek V3.1" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">DeepSeek V3.1</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="DeepSeek V3.1" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude Sonnet" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Cloude Sonnet 4.5</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Cloude Sonnet 4.5" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/gemini.png')}" alt="Gemini 2.5 Pro" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Gemini 2.5 Pro</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Gemini 2.5 Pro" />
            </label>
            <label class="sider-model-item">
              <span class="sider-model-info">
                <span class="sider-model-icon">
                  <img src="${chrome.runtime.getURL('icons/grok.png')}" alt="Grok 4" style="width: 20px; height: 20px; object-fit: contain;" />
                </span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Grok 4</span>
                </span>
              </span>
              <input type="radio" name="sider-model" value="Grok 4" />
            </label>
            <div class="sider-more-options-item" id="sider-more-options-btn">
              <span class="sider-model-info">
                <span class="sider-model-icon">⋯</span>
                <span class="sider-model-text">
                  <span class="sider-model-name">Other models</span>
                </span>
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #9ca3af;">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>`;
    return modalEl;
  }

  function createMoreOptionsModal() {
    const modalEl = document.createElement('div');
    modalEl.className = 'sider-modal sider-more-options-modal';
    modalEl.innerHTML = `
      <div class="sider-modal-body">
        <div class="sider-model-list">
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude 3.5 Haiku" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">Claude 3.5 Haiku</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="claude-3.5-haiku" />
          </label>
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/kimi.png')}" alt="Kimi K2" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">Kimi K2</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="kimi-k2" />
          </label>
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/deepseek.png')}" alt="DeepSeek V3" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">DeepSeek V3</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="deepseek-v3" />
          </label>
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude 3.7 Sonnet" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">Claude 3.7 Sonnet</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="claude-3.7-sonnet" />
          </label>
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude Sonnet 4" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">Claude Sonnet 4</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="claude-sonnet-4" />
          </label>
          <label class="sider-model-item">
            <span class="sider-model-info">
              <span class="sider-model-icon">
                <img src="${chrome.runtime.getURL('icons/claude.png')}" alt="Claude Opus 4.1" style="width: 20px; height: 20px; object-fit: contain;" />
              </span>
              <span class="sider-model-text">
                <span class="sider-model-name">Claude Opus 4.1</span>
              </span>
            </span>
            <input type="radio" name="sider-model" value="claude-opus-4.1" />
          </label>
        </div>
      </div>`;
    return modalEl;
  }

  function open() {
    // Find the AI selector button
    const aiSelectorBtn = document.getElementById('sider-ai-selector-btn');
    if (!aiSelectorBtn) {
      return;
    }

    // Find chat panel for positioning context
    const chatPanel = document.getElementById('sider-ai-chat-panel');
    if (!chatPanel) {
      return;
    }

    // Remove existing modal if any
    const existingWrapper = document.getElementById('sider-ai-modules-modal');
    if (existingWrapper) {
      existingWrapper.remove();
    }

    // Get button position
    const buttonRect = aiSelectorBtn.getBoundingClientRect();
    const modalHeight = 500; // Approximate modal height
    const modalWidth = 320;
    const spacing = 4;

    // Create modal wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'sider-ai-modules-modal';
    
    // Create and append modal
    const modalEl = createModal();
    wrapper.appendChild(modalEl);
    document.body.appendChild(wrapper);

    // Calculate position - try below first, then above if no space
    let top = buttonRect.bottom + spacing;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // If not enough space below, position above button
    if (spaceBelow < modalHeight && spaceAbove > spaceBelow) {
      top = buttonRect.top - modalHeight - spacing;
    }
    
    // Ensure modal doesn't go off-screen
    top = Math.max(8, Math.min(top, window.innerHeight - modalHeight - 8));
    
    // Position horizontally - align to button left, but ensure it doesn't go off-screen
    let left = buttonRect.left;
    if (left + modalWidth > window.innerWidth - 8) {
      left = window.innerWidth - modalWidth - 8;
    }
    left = Math.max(8, left);

    // Position modal relative to viewport
    wrapper.style.position = 'fixed';
    wrapper.style.top = `${top}px`;
    wrapper.style.left = `${left}px`;
    wrapper.style.zIndex = '2147483647';

    // Load saved selected model
    chrome.storage.sync.get(['sider_selected_model'], (result) => {
      const selected = result.sider_selected_model || 'chatgpt';
      const radio = modalEl.querySelector(`input[name="sider-model"][value="${selected}"]`);
      if (radio) radio.checked = true;
    });

    // Show modal
    modalEl.style.display = 'block';

    // Attach handlers
    attachHandlers();

    // Close on outside click
    setTimeout(() => {
      const handleOutsideClick = (e) => {
        const moreOptionsModal = document.getElementById('sider-more-options-modal');
        if (modalEl && !modalEl.contains(e.target) && 
            !aiSelectorBtn.contains(e.target) &&
            (!moreOptionsModal || !moreOptionsModal.contains(e.target)) &&
            modalEl.style.display === 'block') {
          close();
          closeMoreOptions();
          document.removeEventListener('click', handleOutsideClick);
        }
      };
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  function close() {
    const wrapper = document.getElementById('sider-ai-modules-modal');
    if (wrapper) {
      wrapper.remove();
    }
    closeMoreOptions();
  }

  function openMoreOptions() {
    // Close existing more options modal if any
    closeMoreOptions();

    // Find the main modal
    const mainWrapper = document.getElementById('sider-ai-modules-modal');
    if (!mainWrapper) return;

    const mainModal = mainWrapper.querySelector('.sider-modal');
    if (!mainModal) return;

    // Get main modal position
    const mainRect = mainWrapper.getBoundingClientRect();
    const modalWidth = 320;
    const spacing = 8;

    // Create more options wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'sider-more-options-modal';
    
    // Create and append modal
    const modalEl = createMoreOptionsModal();
    wrapper.appendChild(modalEl);
    document.body.appendChild(wrapper);

    // Position to the right of main modal, slightly overlapping
    const left = mainRect.right - spacing;
    const top = mainRect.top;

    // Ensure it doesn't go off-screen
    let finalLeft = left;
    if (finalLeft + modalWidth > window.innerWidth - 8) {
      finalLeft = window.innerWidth - modalWidth - 8;
    }

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${top}px`;
    wrapper.style.left = `${finalLeft}px`;
    wrapper.style.zIndex = '2147483648';

    // Show modal
    modalEl.style.display = 'block';

    // Load saved selected model
    chrome.storage.sync.get(['sider_selected_model'], (result) => {
      const selected = result.sider_selected_model || 'chatgpt';
      const radio = modalEl.querySelector(`input[name="sider-model"][value="${selected}"]`);
      if (radio) radio.checked = true;
    });

    // Attach handlers for more options modal - click on entire item
    const modelItems = modalEl.querySelectorAll('.sider-model-item');
    modelItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          const selectedModel = radio.value;
          chrome.storage.sync.set({ sider_selected_model: selectedModel }, () => {
            if (onModelChangeCallback) {
              onModelChangeCallback(selectedModel);
            }
            close();
            closeMoreOptions();
          });
        }
      });
    });

    // Also handle radio change event as backup
    const radioButtons = modalEl.querySelectorAll('input[name="sider-model"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener('change', () => {
        const selectedModel = radio.value;
        chrome.storage.sync.set({ sider_selected_model: selectedModel }, () => {
          if (onModelChangeCallback) {
            onModelChangeCallback(selectedModel);
          }
          close();
          closeMoreOptions();
        });
      });
    });
  }

  function closeMoreOptions() {
    const wrapper = document.getElementById('sider-more-options-modal');
    if (wrapper) {
      wrapper.remove();
    }
  }

  let onModelChangeCallback = null;
  let onTestResultCallback = null;

  function attachHandlers() {
    const wrapper = document.getElementById('sider-ai-modules-modal');
    if (!wrapper) return;
    
    const modalEl = wrapper.querySelector('.sider-modal');
    if (!modalEl) return;

    // Handle model selection change - click on entire item
    const modelItems = modalEl.querySelectorAll('.sider-model-item');
    modelItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          const selectedModel = radio.value;
          chrome.storage.sync.set({ sider_selected_model: selectedModel }, () => {
            if (onModelChangeCallback) {
              onModelChangeCallback(selectedModel);
            }
            close();
            closeMoreOptions();
          });
        }
      });
    });

    // Also handle radio change event as backup
    const radioButtons = modalEl.querySelectorAll('input[name="sider-model"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener('change', () => {
        const selectedModel = radio.value;
        chrome.storage.sync.set({ sider_selected_model: selectedModel }, () => {
          if (onModelChangeCallback) {
            onModelChangeCallback(selectedModel);
          }
          close();
          closeMoreOptions();
        });
      });
    });

    // Handle "More options" button click
    const moreOptionsBtn = modalEl.querySelector('#sider-more-options-btn');
    if (moreOptionsBtn) {
      moreOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMoreOptions();
      });
    }

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        const moreOptionsModal = document.getElementById('sider-more-options-modal');
        if (moreOptionsModal) {
          closeMoreOptions();
        } else if (modalEl.style.display === 'block') {
          close();
        }
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  function init(onModelChange, onTestResult) {
    onModelChangeCallback = onModelChange;
    onTestResultCallback = onTestResult;
  }

  // Export API
  window.SiderAIModules = {
    open,
    close,
    init
  };
})();


