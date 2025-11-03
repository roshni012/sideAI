(function() {
  'use strict';

  let modal = null;
  let backdrop = null;

  function createModal() {
    if (modal) return modal;

    // Create backdrop
    backdrop = document.createElement('div');
    backdrop.className = 'sider-modal-backdrop';
    backdrop.id = 'sider-ai-modules-backdrop';

    // Create modal wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'sider-ai-modules-modal';
    wrapper.innerHTML = `
      <div class="sider-modal" role="dialog" aria-modal="true" aria-labelledby="sider-modal-title">
        <div class="sider-modal-header">
          <h3 id="sider-modal-title">Select AI Provider</h3>
        </div>
        <div class="sider-modal-body">
          <div class="sider-model-list">
            <div class="sider-model-section">
              <div class="sider-model-section-title">Basic Models</div>
              <label class="sider-model-item">
                <span class="sider-model-info">
                  <span class="sider-model-icon">🤖</span>
                  <span class="sider-model-name">OpenAI (ChatGPT)</span>
                </span>
                <input type="radio" name="sider-model" value="chatgpt" />
              </label>
              <label class="sider-model-item">
                <span class="sider-model-info">
                  <span class="sider-model-icon">🧠</span>
                  <span class="sider-model-name">OpenAI (GPT-4)</span>
                </span>
                <input type="radio" name="sider-model" value="gpt4" />
              </label>
              <label class="sider-model-item">
                <span class="sider-model-info">
                  <span class="sider-model-icon">⭐</span>
                  <span class="sider-model-name">Google Gemini</span>
                </span>
                <input type="radio" name="sider-model" value="gemini" />
              </label>
            </div>
            <div class="sider-model-section">
              <div class="sider-model-section-title">Advanced Models</div>
              <label class="sider-model-item">
                <span class="sider-model-info">
                  <span class="sider-model-icon">🌟</span>
                  <span class="sider-model-name">Anthropic Claude</span>
                </span>
                <input type="radio" name="sider-model" value="claude" />
              </label>
              <label class="sider-model-item">
                <span class="sider-model-info">
                  <span class="sider-model-icon">⚡</span>
                  <span class="sider-model-name">Groq (Llama 3.x)</span>
                </span>
                <input type="radio" name="sider-model" value="groq" />
              </label>
            </div>
          </div>
          <div class="sider-keys-section">
            <div class="sider-field">
              <label for="sider-key-openai">OpenAI API Key</label>
              <input id="sider-key-openai" type="password" placeholder="sk-..." />
            </div>
            <div class="sider-field">
              <label for="sider-key-gemini">Gemini API Key</label>
              <input id="sider-key-gemini" type="password" placeholder="AI..." />
            </div>
            <div class="sider-field">
              <label for="sider-key-claude">Claude API Key</label>
              <input id="sider-key-claude" type="password" placeholder="sk-ant-..." />
            </div>
            <div class="sider-field">
              <label for="sider-key-groq">Groq API Key</label>
              <input id="sider-key-groq" type="password" placeholder="gsk_..." />
            </div>
          </div>
        </div>
        <div class="sider-modal-actions">
          <button class="sider-btn" id="sider-ai-modules-cancel">Cancel</button>
          <button class="sider-btn" id="sider-ai-modules-test">Test</button>
          <button class="sider-btn sider-btn-primary" id="sider-ai-modules-save">Save</button>
        </div>
      </div>`;

    backdrop.appendChild(wrapper);
    document.body.appendChild(backdrop);
    modal = wrapper.querySelector('.sider-modal');
    return modal;
  }

  function open() {
    const modalEl = createModal();
    if (!modalEl) return;

    // Load saved keys and selected model
    chrome.storage.sync.get([
      'openai_key',
      'gemini_key',
      'claude_key',
      'groq_key',
      'sider_selected_model'
    ], (result) => {
      // Set API keys
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
      };
      setValue('sider-key-openai', result.openai_key || '');
      setValue('sider-key-gemini', result.gemini_key || '');
      setValue('sider-key-claude', result.claude_key || '');
      setValue('sider-key-groq', result.groq_key || '');

      // Set selected model
      const selected = result.sider_selected_model || 'chatgpt';
      const radio = document.querySelector(`input[name="sider-model"][value="${selected}"]`);
      if (radio) radio.checked = true;
    });

    // Show modal and backdrop
    backdrop.style.display = 'block';
    modalEl.style.display = 'block';

    // Focus first input
    setTimeout(() => {
      const firstInput = modalEl.querySelector('input[type="password"]');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function close() {
    if (backdrop) backdrop.style.display = 'none';
    if (modal) modal.style.display = 'none';
  }

  function attachHandlers(onModelChange, onTestResult) {
    const modalEl = createModal();
    if (!modalEl) return;

    // Save button
    const saveBtn = document.getElementById('sider-ai-modules-save');
    saveBtn?.addEventListener('click', () => {
      const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      const keys = {
        openai_key: getValue('sider-key-openai'),
        gemini_key: getValue('sider-key-gemini'),
        claude_key: getValue('sider-key-claude'),
        groq_key: getValue('sider-key-groq')
      };

      const selectedModel = document.querySelector('input[name="sider-model"]:checked')?.value || 'chatgpt';

      // Save to storage
      chrome.storage.sync.set({
        ...keys,
        sider_selected_model: selectedModel
      }, () => {
        // Notify model change
        if (onModelChange) {
          onModelChange(selectedModel);
        }
        close();
      });
    });

    // Test button
    const testBtn = document.getElementById('sider-ai-modules-test');
    testBtn?.addEventListener('click', () => {
      const selectedModel = document.querySelector('input[name="sider-model"]:checked')?.value || 'chatgpt';
      const testMessage = 'Say hello from SiderAI test.';

      chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        message: testMessage,
        model: selectedModel
      }, (response) => {
        const text = response?.text || response?.error || 'No response';
        if (onTestResult) {
          onTestResult(selectedModel, text);
        }
      });
    });

    // Cancel/Close buttons
    const cancelBtn = document.getElementById('sider-ai-modules-cancel');
    cancelBtn?.addEventListener('click', close);

    // Close on backdrop click
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop?.style.display === 'block') {
        close();
      }
    });
  }

  function init(onModelChange, onTestResult) {
    createModal();
    attachHandlers(onModelChange, onTestResult);
  }

  // Export API
  window.SiderAIModules = {
    open,
    close,
    init
  };
})();

