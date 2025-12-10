(function () {
  'use strict';

  let toolbarEl = null;
  let selectedText = '';
  let pinned = new Set();
  let currentMenu = null;
  let isUpdatingMenu = false;
  let toolbarHtmlCache = null;
  let isCreatingPopup = false; // Flag to prevent mousedown handler from interfering

  // State for text replacement
  let lastRange = null;
  let lastActiveElement = null;
  let lastSelectionStart = 0;
  let lastSelectionEnd = 0;

  const ACTIONS = [
    'copy', 'highlight', 'readaloud', 'explain', 'translate', 'summarize', 'answer', 'explaincodes',
    'improvewriting', 'fixgrammar', 'writeprofessionally', 'writefunny'
  ];

  const ACTION_ICONS = {
    copy: `<img src="${chrome.runtime.getURL('svg/copy.svg')}" style="width: 14px; height: 14px;">`,
    highlight: `<img src="${chrome.runtime.getURL('svg/highlight.svg')}" style="width: 14px; height: 14px;">`,
    readaloud: `<img src="${chrome.runtime.getURL('svg/volume.svg')}" style="width: 14px; height: 14px;">`,
    explain: `<img src="${chrome.runtime.getURL('svg/explain.svg')}" style="width: 14px; height: 14px;">`,
    translate: `<img src="${chrome.runtime.getURL('svg/translate.svg')}" style="width: 14px; height: 14px;">`,
    summarize: `<img src="${chrome.runtime.getURL('svg/summary.svg')}" style="width: 14px; height: 14px;">`,
    answer: `<img src="${chrome.runtime.getURL('svg/question.svg')}" style="width: 14px; height: 14px;">`,
    explaincodes: `<img src="${chrome.runtime.getURL('svg/code.svg')}" style="width: 14px; height: 14px;">`,
    improvewriting: `<img src="${chrome.runtime.getURL('svg/stars.svg')}" style="width: 14px; height: 14px;">`,
    fixgrammar: `<img src="${chrome.runtime.getURL('svg/grammer.svg')}" style="width: 14px; height: 14px;">`,
    writeprofessionally: `<img src="${chrome.runtime.getURL('svg/write.svg')}" style="width: 14px; height: 14px;">`,
    writefunny: `<img src="${chrome.runtime.getURL('svg/funny.svg')}" style="width: 14px; height: 14px;">`
  };

  // Comprehensive list of world languages with native names
  const WORLD_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'he', name: 'Hebrew', native: 'עברית' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'sv', name: 'Swedish', native: 'Svenska' },
    { code: 'da', name: 'Danish', native: 'Dansk' },
    { code: 'no', name: 'Norwegian', native: 'Norsk' },
    { code: 'fi', name: 'Finnish', native: 'Suomi' },
    { code: 'cs', name: 'Czech', native: 'Čeština' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar' },
    { code: 'ro', name: 'Romanian', native: 'Română' },
    { code: 'bg', name: 'Bulgarian', native: 'Български' },
    { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
    { code: 'sr', name: 'Serbian', native: 'Српски' },
    { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
    { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    { code: 'tl', name: 'Filipino', native: 'Filipino' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
    { code: 'zu', name: 'Zulu', native: 'isiZulu' },
    { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ' },
    { code: 'fa', name: 'Persian', native: 'فارسی' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली' },
    { code: 'si', name: 'Sinhala', native: 'සිංහල' },
    { code: 'my', name: 'Myanmar', native: 'မြန်မာ' },
    { code: 'km', name: 'Khmer', native: 'ខ្មែរ' },
    { code: 'lo', name: 'Lao', native: 'ລາວ' },
    { code: 'ka', name: 'Georgian', native: 'ქართული' },
    { code: 'hy', name: 'Armenian', native: 'Հայերեն' },
    { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan' },
    { code: 'kk', name: 'Kazakh', native: 'Қазақ' },
    { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча' },
    { code: 'uz', name: 'Uzbek', native: 'Oʻzbek' },
    { code: 'mn', name: 'Mongolian', native: 'Монгол' },
    { code: 'be', name: 'Belarusian', native: 'Беларуская' },
    { code: 'et', name: 'Estonian', native: 'Eesti' },
    { code: 'lv', name: 'Latvian', native: 'Latviešu' },
    { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
    { code: 'is', name: 'Icelandic', native: 'Íslenska' },
    { code: 'ga', name: 'Irish', native: 'Gaeilge' },
    { code: 'cy', name: 'Welsh', native: 'Cymraeg' },
    { code: 'mt', name: 'Maltese', native: 'Malti' },
    { code: 'eu', name: 'Basque', native: 'Euskara' },
    { code: 'ca', name: 'Catalan', native: 'Català' },
    { code: 'gl', name: 'Galician', native: 'Galego' },
    { code: 'sq', name: 'Albanian', native: 'Shqip' },
    { code: 'mk', name: 'Macedonian', native: 'Македонски' },
    { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
    { code: 'mk', name: 'Macedonian', native: 'Македонски' }
  ];

  async function loadToolbarHtml() {
    if (toolbarHtmlCache) return toolbarHtmlCache;

    try {
      // Check if chrome.runtime is available
      if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
        console.error('loadToolbarHtml: chrome.runtime.getURL not available');
        toolbarHtmlCache = '';
        return toolbarHtmlCache;
      }

      const htmlUrl = chrome.runtime.getURL('toolbar.html');
      const response = await fetch(htmlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch toolbar.html: ${response.status} ${response.statusText}`);
      }
      const htmlContent = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent.trim();
      const toolbarContent = tempDiv.querySelector('#sider-selection-toolbar');
      toolbarHtmlCache = toolbarContent ? toolbarContent.innerHTML : htmlContent;
    } catch (error) {
      console.error('Failed to load toolbar.html:', error);
      toolbarHtmlCache = '';
    }

    return toolbarHtmlCache;
  }

  function showToolbar() {
    // Don't update toolbar if we're in the middle of updating menu
    if (isUpdatingMenu) return;

    const selection = window.getSelection();

    // Capture selection state for later replacement
    if (selection && selection.rangeCount > 0) {
      lastRange = selection.getRangeAt(0).cloneRange();
    }
    lastActiveElement = document.activeElement;
    if (lastActiveElement && (lastActiveElement.tagName === 'INPUT' || lastActiveElement.tagName === 'TEXTAREA')) {
      lastSelectionStart = lastActiveElement.selectionStart;
      lastSelectionEnd = lastActiveElement.selectionEnd;
    }

    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      if (!isUpdatingMenu) hide();
      return;
    }

    const range = selection.getRangeAt(0);

    // Check if selection is inside input field - exclude selections within input textarea
    const input = document.getElementById('sider-chat-input');
    const inputArea = document.querySelector('.sider-input-area');

    // Check if the selection's common ancestor container is inside the input field
    const commonAncestor = range.commonAncestorContainer;

    // Helper function to check if a node is inside the input field
    function isInsideInputField(node) {
      if (!node) return false;
      if (node === input || node === inputArea) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        return input && input.contains(node.parentElement);
      }
      return input && input.contains(node);
    }

    // Check both start and end containers of the selection
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // If selection is inside input field (textarea or input area), don't show toolbar
    if (isInsideInputField(startContainer) || isInsideInputField(endContainer) ||
      isInsideInputField(commonAncestor)) {
      if (!isUpdatingMenu) hide();
      return;
    }

    selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      if (!isUpdatingMenu) hide();
      return;
    }

    const rect = range.getBoundingClientRect();
    const el = createToolbar();
    const toolbarHeight = 40;
    const toolbarPadding = 8;

    let top = rect.top - toolbarHeight - toolbarPadding;
    let left = rect.left + (rect.width / 2) - (el.offsetWidth / 2);
    if (top < 10) top = rect.bottom + toolbarPadding;
    if (left + el.offsetWidth > window.innerWidth - 10) left = window.innerWidth - el.offsetWidth - 10;
    el.style.top = `${top + window.scrollY}px`;
    el.style.left = `${left + window.scrollX}px`;
    el.style.display = 'flex';
    renderPinnedButtons();

    // Dispatch event to update input box with selected text
    window.dispatchEvent(new CustomEvent('sider:text-selected', {
      detail: { text: selectedText }
    }));
  }

  function hide() {
    if (isUpdatingMenu) return; // Don't hide during menu updates

    // Check if user is typing in the input area or clicking inside the panel
    const input = document.getElementById('sider-chat-input');
    const panel = document.getElementById('sider-ai-chat-panel');
    const isTypingInInput = input && document.activeElement === input;
    const isInsidePanel = panel && panel.contains(document.activeElement);

    if (toolbarEl) toolbarEl.style.display = 'none';

    // Only dispatch event to clear input box if user is not typing in it
    // and not clicking inside the panel - don't hide selected text section
    if (!isTypingInInput && !isInsidePanel) {
      window.dispatchEvent(new CustomEvent('sider:text-cleared', {
        detail: { hideSelectedText: false } // Don't hide selected text section when toolbar hides
      }));
    }

    selectedText = '';
  }

  function highlightSelected() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Try to use stored selectedText if selection is already cleared
      if (selectedText && selectedText.trim().length > 0) {
        console.warn('highlightSelected: Selection already cleared, cannot highlight');
        return;
      }
      return;
    }

    const range = selection.getRangeAt(0);
    if (!range || range.collapsed) return;

    const span = document.createElement('span');
    span.style.cssText = 'background-color: #fef08a; padding: 2px 0;';
    span.className = 'sider-highlight';

    try {
      range.surroundContents(span);
    } catch (_) {
      // If surroundContents fails, use extractContents approach
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }

    // Clear selection after highlighting
    selection.removeAllRanges();
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

  function getModelIcon(model) {
    try {
      // Check if chrome.runtime is available
      if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
        console.warn('getModelIcon: chrome.runtime.getURL not available');
        return 'icons/fusion.png';
      }

      const getIconUrl = (path) => {
        try {
          return chrome.runtime.getURL(path);
        } catch (error) {
          console.warn('getModelIcon: Error getting URL for', path, error);
          return path;
        }
      };

      const iconMap = {
        'webby fusion': getIconUrl('icons/fusion.png'),
        'gpt -5 mini': getIconUrl('icons/gpt_5mini.png'),
        'claude haiku 4.5': getIconUrl('icons/claude.png'),
        'gemini 2.5 flash': getIconUrl('icons/gemini.png'),
        'gpt -5': getIconUrl('icons/chatgpt.png'),
        'gpt -4.1': getIconUrl('icons/chatgpt.png'),
        'gpt -5.1': getIconUrl('icons/chatgpt.png'),
        'deepseek v3.1': getIconUrl('icons/deepseek.png'),
        'claude sonnet 4.5': getIconUrl('icons/claude.png'),
        'gemini 2.5 pro': getIconUrl('icons/gemini.png'),
        'grok 4': getIconUrl('icons/grok.png'),
        'claude 3.5 haiku': getIconUrl('icons/claude.png'),
        'kimi k2': getIconUrl('icons/kimi.png'),
        'deepseek v3': getIconUrl('icons/deepseek.png'),
        'claude 3.7 sonnet': getIconUrl('icons/claude.png'),
        'claude sonnet 4': getIconUrl('icons/claude.png'),
        'claude opus 4.1': getIconUrl('icons/claude.png'),
        'chatgpt': getIconUrl('icons/fusion.png'),
        'gpt4': getIconUrl('icons/chatgpt.png'),
        'gemini': getIconUrl('icons/gemini.png'),
        'claude': getIconUrl('icons/claude.png'),
        'groq': getIconUrl('icons/grok.png')
      };
      return iconMap[model] || getIconUrl('icons/fusion.png');
    } catch (error) {
      console.error('getModelIcon: Error getting model icon', error);
      return 'icons/fusion.png';
    }
  }

  function updateAnalyzeButtonIcon() {
    const analyzeBtnIcon = document.getElementById('sider-analyze-btn-icon');
    if (!analyzeBtnIcon) return;

    getCurrentModel((model) => {
      const iconUrl = model ? getModelIcon(model) : chrome.runtime.getURL('icons/fusion.png');
      analyzeBtnIcon.src = iconUrl;
      analyzeBtnIcon.alt = model || 'AI Model';
    });
  }

  function createToolbar() {
    if (toolbarEl) return toolbarEl;

    const el = document.createElement('div');
    el.id = 'sider-selection-toolbar';
    el.innerHTML = toolbarHtmlCache || '';
    document.body.appendChild(el);
    toolbarEl = el;

    // Update analyze button icon after toolbar is created
    updateAnalyzeButtonIcon();

    return el;
  }

  function formatModelName(model) {
    if (!model) return 'AI Models';
    // Capitalize first letter of each word
    return model.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  function getCurrentModel(callback) {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.sync) {
        console.warn('getCurrentModel: chrome.storage.sync not available, using fallback');
        const fallbackModel = (window.SiderChatTab && typeof window.SiderChatTab.getActiveModel === 'function')
          ? window.SiderChatTab.getActiveModel()
          : null;
        callback(fallbackModel);
        return;
      }

      chrome.storage.sync.get(['sider_selected_model'], (result) => {
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          console.warn('getCurrentModel: chrome.storage error:', chrome.runtime.lastError.message);
          const fallbackModel = (window.SiderChatTab && typeof window.SiderChatTab.getActiveModel === 'function')
            ? window.SiderChatTab.getActiveModel()
            : null;
          callback(fallbackModel);
          return;
        }

        try {
          const model = result.sider_selected_model || null;
          // Fallback to ChatTab's active model if available
          if (!model && window.SiderChatTab && typeof window.SiderChatTab.getActiveModel === 'function') {
            callback(window.SiderChatTab.getActiveModel());
          } else {
            callback(model);
          }
        } catch (error) {
          console.error('getCurrentModel: Error processing result', error);
          callback(null);
        }
      });
    } catch (error) {
      console.error('getCurrentModel: Error accessing chrome.storage', error);
      const fallbackModel = (window.SiderChatTab && typeof window.SiderChatTab.getActiveModel === 'function')
        ? window.SiderChatTab.getActiveModel()
        : null;
      callback(fallbackModel);
    }
  }

  function buildMenuItems(targetMenu) {
    // Use provided menu, or currentMenu, or create new
    const menu = targetMenu || currentMenu || document.createElement('div');
    menu.className = 'sider-more-menu';

    // Only update innerHTML if menu is already in DOM or if we're updating existing menu
    const wasInDOM = menu.parentNode !== null;
    menu.innerHTML = '';

    const addItem = (action, label) => {
      const btn = document.createElement('button');
      btn.className = 'sider-more-menu-item';
      btn.setAttribute('data-action', action);
      const isPinned = pinned.has(action);
      btn.innerHTML = `
        <span class="sider-more-menu-icon">${ACTION_ICONS[action] || ''}</span>
        <span>${label}</span>
        <span class="sider-more-menu-right">
          <span class="sider-pin-toggle ${isPinned ? 'active' : ''}" data-pin="${action}" title="${isPinned ? 'Unpin' : 'Pin'}">📌</span>
        </span>`;
      menu.appendChild(btn);
    };
    addItem('copy', 'Copy');
    addItem('highlight', 'Highlight');
    addItem('readaloud', 'Read aloud');
    const sep = document.createElement('div'); sep.className = 'sider-more-menu-sep'; menu.appendChild(sep);
    addItem('improvewriting', 'Improve writing');
    addItem('fixgrammar', 'Fix grammar');
    addItem('writeprofessionally', 'Write professionally');
    addItem('writefunny', 'Write in a funny tone');
    const sep1_5 = document.createElement('div'); sep1_5.className = 'sider-more-menu-sep'; menu.appendChild(sep1_5);
    addItem('explain', 'Explain');
    addItem('translate', 'Translate');
    addItem('summarize', 'Summarize');
    addItem('answer', 'Answer this question');
    addItem('explaincodes', 'Explain codes');

    // Add separator before AI Models option
    const sep2 = document.createElement('div');
    sep2.className = 'sider-more-menu-sep';
    menu.appendChild(sep2);

    // Add AI Models menu item (special item, not pinable)
    const aiModelBtn = document.createElement('button');
    aiModelBtn.className = 'sider-more-menu-item';
    aiModelBtn.setAttribute('data-action', 'ai-models');
    aiModelBtn.id = 'sider-toolbar-ai-models-btn';

    // Load current model and update button content
    getCurrentModel((model) => {
      const modelText = model ? formatModelName(model) : 'AI Models';
      const iconUrl = model ? getModelIcon(model) : chrome.runtime.getURL('icons/fusion.png');

      aiModelBtn.innerHTML = `
      <span class="sider-more-menu-icon">
        <img src="${iconUrl}" alt="${model || 'AI Model'}" style="width: 18px; height: 18px; object-fit: contain; display: block;" />
      </span>
      <span class="sider-ai-model-text">${modelText}</span>
      <span class="sider-more-menu-right">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-dropdown-arrow" style="width: 12px; height: 12px; color: #6b7280;">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    `;
    });

    menu.appendChild(aiModelBtn);

    if (!targetMenu && !currentMenu) {
      currentMenu = menu;
    }
    return menu;
  }

  function updateAIModelMenuItem() {
    const aiModelBtn = document.getElementById('sider-toolbar-ai-models-btn');
    if (!aiModelBtn) return;

    getCurrentModel((model) => {
      const modelText = model ? formatModelName(model) : 'AI Models';
      const iconUrl = model ? getModelIcon(model) : chrome.runtime.getURL('icons/fusion.png');

      // Update icon
      const iconSpan = aiModelBtn.querySelector('.sider-more-menu-icon');
      if (iconSpan) {
        iconSpan.innerHTML = `<img src="${iconUrl}" alt="${model || 'AI Model'}" style="width: 18px; height: 18px; object-fit: contain; display: block;" />`;
      }

      // Update text
      const textSpan = aiModelBtn.querySelector('.sider-ai-model-text');
      if (textSpan) {
        textSpan.textContent = modelText;
      } else {
        // Rebuild if structure changed
        const icon = aiModelBtn.querySelector('.sider-more-menu-icon');
        const right = aiModelBtn.querySelector('.sider-more-menu-right');
        if (icon && right) {
          const textSpan = document.createElement('span');
          textSpan.className = 'sider-ai-model-text';
          textSpan.textContent = modelText;
          icon.parentNode.insertBefore(textSpan, right);
        }
      }
    });
  }

  function attachMenuListeners(menu, btn) {
    const speak = (text) => {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (_) { }
    };

    // Use event delegation - attach to menu once, works even after innerHTML changes
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent default behavior

      const pinBtn = e.target.closest('.sider-pin-toggle');
      if (pinBtn) {
        e.stopPropagation();
        e.preventDefault();
        isUpdatingMenu = true;
        const action = pinBtn.getAttribute('data-pin');

        // Toggle pin state
        if (pinned.has(action)) {
          pinned.delete(action);
        } else {
          pinned.add(action);
        }

        // Save to storage
        chrome.storage.sync.set({ sider_pinned_actions: Array.from(pinned) }, () => {
          // Update toolbar pinned buttons immediately
          renderPinnedButtons();

          // Update menu to reflect new pin state
          const menuItem = pinBtn.closest('.sider-more-menu-item');
          if (menuItem) {
            const isPinned = pinned.has(action);
            const newPinBtn = menuItem.querySelector('.sider-pin-toggle');
            if (newPinBtn) {
              if (isPinned) {
                newPinBtn.classList.add('active');
                newPinBtn.setAttribute('title', 'Unpin');
              } else {
                newPinBtn.classList.remove('active');
                newPinBtn.setAttribute('title', 'Pin');
              }
            }
          }

          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingMenu = false;
          }, 100);
        });
        return;
      }

      const target = e.target.closest('.sider-more-menu-item');
      if (!target) return;
      e.stopPropagation();
      e.preventDefault(); // Prevent default to avoid interference
      const action = target.getAttribute('data-action');

      // Don't handle clicks on AI Models menu item (it's handled separately)
      if (action === 'ai-models') {
        // Create temporary button at menu item position for SiderAIModules.open()
        const menuItemRect = target.getBoundingClientRect();
        const tempButton = document.createElement('button');
        tempButton.id = 'sider-ai-selector-btn';
        tempButton.style.position = 'fixed';
        tempButton.style.top = `${menuItemRect.top}px`;
        tempButton.style.left = `${menuItemRect.left}px`;
        tempButton.style.width = `${menuItemRect.width}px`;
        tempButton.style.height = `${menuItemRect.height}px`;
        tempButton.style.opacity = '0';
        tempButton.style.pointerEvents = 'none';
        tempButton.style.zIndex = '-1';
        document.body.appendChild(tempButton);

        // Open AI model selector
        if (window.SiderAIModules && typeof window.SiderAIModules.open === 'function') {
          window.SiderAIModules.open();

          // Remove temporary button after modal opens
          setTimeout(() => {
            if (tempButton && tempButton.parentNode) {
              tempButton.remove();
            }
          }, 100);
        } else {
          console.warn('SiderAIModules not available');
          tempButton.remove();
        }

        // Close the menu
        menu.remove();
        currentMenu = null;
        return;
      }

      // For all other actions - keep toolbar and input visible
      // IMPORTANT: Preserve selectedText before any clearing happens
      // The selectedText variable should already be set from showToolbar()
      if (!selectedText || selectedText.trim().length === 0) {
        // Try to get it from current selection as fallback
        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.rangeCount > 0) {
          selectedText = currentSelection.toString().trim();
        }
      }

      // Set flag to prevent mousedown handler from interfering
      isCreatingPopup = true;

      // Trigger the action (it will use selectedText)
      triggerAction(action);

      // Close menu after a small delay to ensure action completes
      setTimeout(() => {
        menu.remove();
        currentMenu = null;

        // Clear flag after popup should be created
        setTimeout(() => {
          isCreatingPopup = false;
        }, 300);

        // Clear selection AFTER action has been triggered (with delay for highlight action)
        setTimeout(() => {
          window.getSelection()?.removeAllRanges();
        }, action === 'highlight' ? 150 : 50);
      }, 10);
    });

    let onClickOutsideHandler = null;
    onClickOutsideHandler = (ev) => {
      // Don't close if we're updating the menu or clicking on menu-related elements
      if (isUpdatingMenu) return;

      // Don't close if clicking on menu, button, pin toggle, or toolbar
      const isMenuClick = menu && menu.contains(ev.target);
      const isButtonClick = ev.target === btn || btn.contains(ev.target);
      const isPinToggle = ev.target.closest('.sider-pin-toggle');
      const isToolbarClick = toolbarEl && toolbarEl.contains(ev.target);

      if (!isMenuClick && !isButtonClick && !isPinToggle && !isToolbarClick) {
        if (menu && menu.parentNode) {
          menu.remove();
        }
        currentMenu = null;
        document.removeEventListener('mousedown', onClickOutsideHandler);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', onClickOutsideHandler), 0);
  }

  function showMoreOptions() {
    // Remove any existing menu first
    document.querySelectorAll('.sider-more-menu').forEach(m => m.remove());

    const btn = document.getElementById('sider-more-btn');
    if (!btn) return;

    const menu = buildMenuItems();
    currentMenu = menu;
    document.body.appendChild(menu);

    // Position relative to the button
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 6 + window.scrollY;
    const left = Math.min(
      rect.left + window.scrollX,
      window.scrollX + window.innerWidth - 240
    );
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    // Attach event listeners
    attachMenuListeners(menu, btn);
  }

  function attachActions() {
    const el = createToolbar();
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling to document mousedown
      const btn = e.target.closest('.sider-selection-btn');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (!action) return;
      if (action === 'more') {
        showMoreOptions();
      } else if (action === 'close') {
        hide();
        window.getSelection()?.removeAllRanges();
      } else if (action === 'notes') {
        window.dispatchEvent(new CustomEvent('sider:add-note', { detail: { text: selectedText } }));
        // Don't hide or clear when using notes action
        window.getSelection()?.removeAllRanges();
      } else if (action === 'analyze') {
        window.dispatchEvent(new CustomEvent('sider:analyze-text', { detail: { text: selectedText } }));
        // Don't hide or clear when using analyze action
        window.getSelection()?.removeAllRanges();
      } else {
        // Store selection before clearing (for actions that need it)
        const currentSelection = window.getSelection();
        const selectionRange = currentSelection && currentSelection.rangeCount > 0 ? currentSelection.getRangeAt(0).cloneRange() : null;

        triggerAction(action);

        // Clear selection AFTER action has been triggered (with small delay for highlight action)
        setTimeout(() => {
          window.getSelection()?.removeAllRanges();
        }, action === 'highlight' ? 100 : 0);
      }
    });

    document.addEventListener('mouseup', showToolbar);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') hide();
      else showToolbar();
    });
    document.addEventListener('mousedown', (e) => {
      // Don't hide toolbar if we're updating the menu
      if (isUpdatingMenu) return;

      // Don't hide if we're creating a popup (prevents immediate closure)
      if (isCreatingPopup) {
        console.log('mousedown: Ignoring because popup is being created');
        return;
      }

      // Don't hide if there's a popup open (let popup handle its own outside clicks)
      if (currentPopup) {
        console.log('mousedown: Ignoring because popup is open');
        return;
      }

      // Don't hide if clicking on menu, toolbar, popup, or any toolbar-related elements
      if (currentMenu && currentMenu.contains(e.target)) return;
      if (toolbarEl && toolbarEl.contains(e.target)) return;
      if (e.target.closest('.sider-pin-btn')) return;
      if (e.target.closest('.sider-selection-btn')) return;
      if (e.target.closest('.sider-more-menu')) return;
      if (e.target.closest('.sider-action-popup')) return;

      // Don't hide if clicking inside the input area or selected text section
      const input = document.getElementById('sider-chat-input');
      const inputArea = document.querySelector('.sider-input-area');
      const selectedTextSection = document.getElementById('sider-selected-text-section');
      const panel = document.getElementById('sider-ai-chat-panel');

      // Don't hide if clicking inside the extension panel
      if (panel && panel.contains(e.target)) return;

      if (input && input.contains(e.target)) return;
      if (inputArea && inputArea.contains(e.target)) return;
      if (selectedTextSection && selectedTextSection.contains(e.target)) return;

      // Only hide if clicking outside AND selection is actually cleared
      // Use a small delay to allow button clicks to complete first
      setTimeout(() => {
        // Double-check that we're not inside toolbar or panel (button click might have triggered)
        if (toolbarEl && !toolbarEl.contains(e.target)) {
          // Also check if click is outside the panel
          if (panel && panel.contains(e.target)) return;

          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            // Only hide if toolbar is still visible (wasn't already hidden by action)
            if (toolbarEl && toolbarEl.style.display !== 'none') {
              hide();
            }
          }
        }
      }, 50);
    });
  }

  let currentPopup = null;
  let pinnedPopups = new Set();

  function getActionTitle(action) {
    const titles = {
      'explain': 'Explain',
      'translate': 'Translate',
      'summarize': 'Summarize',
      'answer': 'Answer this question',
      'explaincodes': 'Explain codes',
      'improvewriting': 'Improve writing',
      'fixgrammar': 'Fix grammar',
      'writeprofessionally': 'Write professionally',
      'writefunny': 'Write in a funny tone'
    };
    return titles[action] || action;
  }

  function getActionPrompt(action, text) {
    const prompts = {
      'explain': `Explain this text: "${text}"`,
      'translate': `Translate to English: "${text}"`,
      'summarize': `Summarize this text: "${text}"`,
      'answer': `Answer this question: "${text}"`,
      'explaincodes': `Explain this code: "${text}"`,
      'improvewriting': `Improve the writing of this text: "${text}"`,
      'fixgrammar': `Fix the grammar and spelling errors in this text: "${text}"`,
      'writeprofessionally': `Rewrite this text in a professional tone: "${text}"`,
      'writefunny': `Rewrite this text in a funny and humorous tone: "${text}"`
    };
    return prompts[action] || `${action}: "${text}"`;
  }

  function formatModelNameForPopup(model) {
    if (!model) return 'Sider Fusion';
    return model.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  function createActionPopup(action, text) {
    console.log('🔵 createActionPopup START:', { action, text: text?.substring(0, 50), textLength: text?.length });
    isCreatingPopup = true; // Set flag immediately to prevent mousedown handler interference

    // Validate inputs
    if (!action) {
      console.error('createActionPopup: Invalid action', { action });
      return null;
    }

    // For 'answer' action and popup actions (explain, translate, etc.), allow empty text
    // User can enter text manually in the popup if needed
    const popupActions = ['answer', 'explain', 'translate', 'summarize', 'explaincodes', 'improvewriting', 'fixgrammar', 'writeprofessionally', 'writefunny'];
    if (popupActions.includes(action)) {
      // Ensure text is at least a string (can be empty)
      if (text === null || text === undefined) {
        text = '';
      }
      if (typeof text !== 'string') {
        text = String(text || '');
      }
    } else {
      // For other actions, require non-empty text
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.error('createActionPopup: Invalid text for action', { action, text });
        return null;
      }
    }

    // Ensure document.body exists
    if (!document.body) {
      console.error('createActionPopup: document.body not available, retrying...');
      setTimeout(() => createActionPopup(action, text), 100);
      return null;
    }

    // Remove existing popup (but not pinned ones - check both Sets)
    if (currentPopup) {
      const currentAction = currentPopup.getAttribute('data-action');
      const isPinnedInToolbar = pinned.has(currentAction);
      const isPinnedPopup = pinnedPopups.has(currentAction);
      if (!isPinnedInToolbar && !isPinnedPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
    }

    const popup = document.createElement('div');
    popup.className = 'sider-action-popup';
    popup.setAttribute('data-action', action);

    const title = getActionTitle(action);
    const isPinned = pinned.has(action); // Use same pinned Set as menu

    // Use default model if getCurrentModel fails
    const defaultModel = 'webby fusion';
    let defaultModelIcon;
    try {
      defaultModelIcon = chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL('icons/fusion.png')
        : 'icons/fusion.png';
    } catch (error) {
      console.warn('createActionPopup: Error getting icon URL', error);
      defaultModelIcon = 'icons/fusion.png';
    }

    // Set currentPopup immediately so mousedown handler knows popup is being created
    currentPopup = popup;

    // Set a timeout to ensure popup is created even if getCurrentModel hangs
    let modelLoaded = false;
    const timeoutId = setTimeout(() => {
      if (!modelLoaded) {
        console.warn('createActionPopup: getCurrentModel timeout, using default model');
        buildAndShowPopup(popup, action, text, title, isPinned, defaultModel, defaultModelIcon);
      }
    }, 1000);

    try {
      getCurrentModel((model) => {
        if (modelLoaded) return; // Already handled by timeout
        modelLoaded = true;
        clearTimeout(timeoutId);

        try {
          let modelIconUrl = defaultModelIcon;
          try {
            modelIconUrl = model ? getModelIcon(model) : defaultModelIcon;
          } catch (iconError) {
            console.warn('createActionPopup: Error getting model icon, using default', iconError);
            // Continue with default icon
          }
          buildAndShowPopup(popup, action, text, title, isPinned, model || defaultModel, modelIconUrl);
        } catch (error) {
          console.error('createActionPopup: Error in getCurrentModel callback', error);
          // Fallback: use default model and still show popup
          buildAndShowPopup(popup, action, text, title, isPinned, defaultModel, defaultModelIcon);
        }
      });
    } catch (error) {
      console.error('createActionPopup: Error calling getCurrentModel', error);
      // Fallback: use default model
      buildAndShowPopup(popup, action, text, title, isPinned, defaultModel, defaultModelIcon);
    }

    console.log('createActionPopup: Returning popup element', { popup, currentPopup });
    return popup;
  }

  function buildAndShowPopup(popup, action, text, title, isPinned, model, modelIconUrl) {
    console.log('🟢 buildAndShowPopup START:', { action, text: text?.substring(0, 30), popupExists: !!popup });
    try {
      const modelName = formatModelNameForPopup(model || 'webby fusion');

      popup.innerHTML = `
        <div class="sider-action-popup-header">
          <h3 class="sider-action-popup-title">${title}</h3>
          <div class="sider-action-popup-header-actions">
            <button class="sider-action-popup-pin-btn ${pinned.has(action) ? 'active' : ''}" data-pin="${action}" title="${pinned.has(action) ? 'Unpin' : 'Pin'}">📌</button>
            <button class="sider-action-popup-close-btn" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="sider-action-popup-body">
          ${action === 'translate' ? `
            <div class="sider-action-popup-translate-language">
              <span style="font-size: 13px; color: #6b7280;">Translate into:</span>
              <div class="sider-language-dropdown-container">
                <div class="sider-language-dropdown-trigger" id="sider-language-dropdown-trigger">
                  <span class="sider-language-selected-text">Select language</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-language-dropdown-arrow">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div class="sider-language-dropdown-menu" id="sider-language-dropdown-menu" style="display: none;">
                  <div class="sider-language-search-container">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sider-language-search-icon">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input type="text" class="sider-language-search-input" id="sider-language-search-input" placeholder="Search" />
                  </div>
                  <div class="sider-language-list" id="sider-language-list"></div>
                </div>
              </div>
              <input type="hidden" id="sider-translate-language-select" value="" />
            </div>
          ` : ''}
          ${action === 'answer' ? `
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
              Please provide the question you would like me to answer.
            </div>
          ` : (!text || text.trim().length === 0) ? `
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
              Please enter the text you would like to ${action === 'explain' ? 'explain' : action === 'translate' ? 'translate' : action === 'summarize' ? 'summarize' : 'explain'}.
            </div>
          ` : ''}
          <div class="sider-action-popup-nav-buttons" id="sider-action-popup-nav-buttons" style="display: none;">
            <button class="sider-action-popup-back-btn" id="sider-action-popup-back-btn" title="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button class="sider-action-popup-next-btn" id="sider-action-popup-next-btn" title="Next">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <input type="text" class="sider-action-popup-input" id="sider-action-popup-input" placeholder="${action === 'answer' ? 'Enter your question...' : (!text || text.trim().length === 0) ? `Enter text to ${action === 'explain' ? 'explain' : action === 'translate' ? 'translate' : action === 'summarize' ? 'summarize' : 'explain'}...` : ''}" value="${text || ''}" ${(action === 'answer' || !text || text.trim().length === 0) ? '' : 'readonly'} />
          <div class="sider-action-popup-response loading" id="sider-action-popup-response">Processing...</div>
          <div class="sider-action-popup-chat-container" id="sider-action-popup-chat-container" style="display: none;">
            <div class="sider-action-popup-chat-actions">
              <button class="sider-action-popup-insert-btn" id="sider-action-popup-insert-btn" title="Insert response into text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Insert
              </button>
            </div>
            <div class="sider-action-popup-chat-input-wrapper">
              <textarea class="sider-action-popup-chat-input" id="sider-action-popup-chat-input" placeholder="Type your message..." rows="1"></textarea>
              <button class="sider-action-popup-chat-send-btn" id="sider-action-popup-chat-send-btn" title="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="sider-action-popup-footer">
          <div class="sider-action-popup-attribution">
            <span class="sider-action-popup-model-name">By ${modelName}</span>
          </div>
          <div class="sider-action-popup-actions">
            <div class="sider-action-popup-actions-left">
              <button class="sider-action-popup-btn sider-action-popup-btn-primary" id="sider-action-popup-chat-btn">
                <svg class="sider-action-popup-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Continue in Chat
              </button>
            </div>
            <div class="sider-action-popup-actions-right">
              <button class="sider-action-popup-icon-btn" id="sider-action-popup-replace-btn" title="Replace Selection">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="sider-action-popup-icon-btn" id="sider-action-popup-refresh-btn" title="Refresh">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
              <button class="sider-action-popup-icon-btn" id="sider-action-popup-speaker-btn" title="Read aloud">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
              <button class="sider-action-popup-icon-btn" id="sider-action-popup-copy-btn" title="Copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      if (document.body) {
        console.log('buildAndShowPopup: Appending popup to DOM', { action, text: text?.substring(0, 50) });

        // Ensure popup is visible with explicit positioning BEFORE appending
        popup.style.display = 'flex';
        popup.style.visibility = 'visible';
        popup.style.opacity = '1';
        popup.style.position = 'fixed';
        popup.style.zIndex = '2147483647';
        popup.style.width = '420px';
        popup.style.maxWidth = 'calc(100vw - 40px)';

        // Append to body
        document.body.appendChild(popup);
        currentPopup = popup;
        isCreatingPopup = false; // Clear flag once popup is in DOM

        // Force a reflow to ensure element is in DOM
        void popup.offsetHeight;

        // Check visibility using rect instead of offsetParent (offsetParent can be null for fixed elements)
        const initialRect = popup.getBoundingClientRect();
        const computed = window.getComputedStyle(popup);
        console.log('buildAndShowPopup: Popup appended, positioning...', {
          popupInDOM: document.body.contains(popup),
          popupDisplay: popup.style.display,
          computedPosition: computed.position,
          computedDisplay: computed.display,
          rectWidth: initialRect.width,
          rectHeight: initialRect.height
        });

        // Position the popup
        positionPopup(popup);

        // Force another reflow after positioning
        void popup.offsetHeight;

        // Verify positioning after a brief delay
        setTimeout(() => {
          const rect = popup.getBoundingClientRect();
          const computed = window.getComputedStyle(popup);
          console.log('buildAndShowPopup: Popup position verification', {
            top: popup.style.top,
            left: popup.style.left,
            rectTop: rect.top,
            rectLeft: rect.left,
            rectWidth: rect.width,
            rectHeight: rect.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            computedDisplay: computed.display,
            computedPosition: computed.position,
            computedVisibility: computed.visibility,
            computedOpacity: computed.opacity,
            computedZIndex: computed.zIndex,
            offsetParent: popup.offsetParent,
            isVisible: rect.width > 0 && rect.height > 0 && rect.top >= -100 && rect.left >= -100 && rect.top <= window.innerHeight + 100 && rect.left <= window.innerWidth + 100
          });

          // Check if popup is actually visible (offsetParent can be null for fixed elements)
          // Use rect dimensions instead of offsetParent for fixed positioned elements
          const isActuallyVisible = rect.width > 0 && rect.height > 0 &&
            rect.top >= -100 && rect.left >= -100 &&
            rect.top <= window.innerHeight + 100 && rect.left <= window.innerWidth + 100;

          if (!isActuallyVisible) {
            console.warn('buildAndShowPopup: Popup may not be visible, attempting to force visibility');
            popup.style.display = 'flex';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
            popup.style.position = 'fixed';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            void popup.offsetHeight; // Force reflow
          }
        }, 100);
        attachPopupListeners(popup, action, text);

        // Verify popup is still in DOM after positioning
        setTimeout(() => {
          if (!document.body.contains(popup)) {
            console.error('buildAndShowPopup: Popup was removed from DOM!');
          } else {
            const rect = popup.getBoundingClientRect();
            const computed = window.getComputedStyle(popup);
            // Use rect dimensions to determine visibility (more reliable than offsetParent for fixed elements)
            const isVisible = rect.width > 0 && rect.height > 0;
            console.log('buildAndShowPopup: Popup verified in DOM', {
              isVisible: isVisible,
              computedDisplay: computed.display,
              computedPosition: computed.position,
              computedVisibility: computed.visibility,
              zIndex: computed.zIndex,
              rectWidth: rect.width,
              rectHeight: rect.height,
              rectTop: rect.top,
              rectLeft: rect.left
            });

            // Final check - use rect dimensions instead of offsetParent for fixed elements
            const isActuallyVisible = rect.width > 0 && rect.height > 0 &&
              rect.top >= -100 && rect.left >= -100 &&
              rect.top <= window.innerHeight + 100 && rect.left <= window.innerWidth + 100;

            // Only force if popup is truly not visible (has no dimensions or is way off-screen)
            if (!isActuallyVisible && (rect.width === 0 || rect.height === 0)) {
              console.warn('buildAndShowPopup: Popup has no dimensions, forcing center position');
              popup.style.cssText = `
                position: fixed !important;
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 2147483647 !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 420px !important;
                max-width: calc(100vw - 40px) !important;
                background: #ffffff !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
                border: 1px solid #e5e7eb !important;
                flex-direction: column !important;
                overflow: hidden !important;
              `;
              void popup.offsetHeight; // Force reflow
            }
          }
        }, 200);

        // Dispatch event to show selected text in chat-tab input area
        // Only dispatch if there's actual text AND sidepanel is open
        if (text && text.trim().length > 0) {
          const panel = document.getElementById('sider-ai-chat-panel');
          const isPanelOpen = panel && panel.classList.contains('sider-panel-open');

          if (isPanelOpen) {
            window.dispatchEvent(new CustomEvent('sider:text-selected', {
              detail: { text: text.trim() }
            }));
          }
        }

        // For popup actions with empty text, don't call getAIResponse immediately
        // User will enter their text and it will be triggered by the debounced input handler
        const popupActions = ['answer', 'explain', 'translate', 'summarize', 'explaincodes'];
        if (popupActions.includes(action) && (!text || text.trim().length === 0)) {
          // Show a message when no text is provided
          const responseEl = popup.querySelector('#sider-action-popup-response');
          if (responseEl) {
            const actionText = action === 'answer' ? 'question' : action === 'explain' ? 'text to explain' : action === 'translate' ? 'text to translate' : action === 'summarize' ? 'text to summarize' : 'code to explain';
            responseEl.textContent = `Please enter your ${actionText} above.`;
            responseEl.classList.remove('loading');
          }
        } else if (action === 'translate') {
          // For translate action, don't call API immediately - wait for user to select language
          const responseEl = popup.querySelector('#sider-action-popup-response');
          if (responseEl) {
            responseEl.textContent = 'Please select a target language above.';
            responseEl.classList.remove('loading');
          }
        } else {
          getAIResponse(action, text, popup);
        }
      } else {
        console.error('buildAndShowPopup: document.body not available');
      }
    } catch (error) {
      console.error('buildAndShowPopup: Error building popup', error);
    }
  }

  function positionPopup(popup) {
    // Ensure popup has fixed positioning
    popup.style.position = 'fixed';

    if (!toolbarEl || toolbarEl.style.display === 'none' || !document.body.contains(toolbarEl)) {
      // Center on screen if toolbar not visible
      console.log('positionPopup: Toolbar not visible, centering popup');
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      popup.style.right = 'auto';
      popup.style.bottom = 'auto';
      return;
    }

    const toolbarRect = toolbarEl.getBoundingClientRect();
    const popupWidth = 420;
    const popupHeight = 400;
    const spacing = 8;

    // Try to position below toolbar, or above if no space
    // Use getBoundingClientRect values directly (already relative to viewport)
    let top = toolbarRect.bottom + spacing;
    let left = toolbarRect.left;

    // Check if there's enough space below
    if (toolbarRect.bottom + popupHeight + spacing > window.innerHeight) {
      // Position above toolbar
      top = toolbarRect.top - popupHeight - spacing;
    }

    // Ensure popup doesn't go off-screen horizontally
    if (left + popupWidth > window.innerWidth - 20) {
      left = window.innerWidth - popupWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // Ensure popup doesn't go off-screen vertically
    if (top < 20) {
      top = 20;
    }
    if (top + popupHeight > window.innerHeight - 20) {
      top = window.innerHeight - popupHeight - 20;
    }

    console.log('positionPopup: Setting popup position', { top, left, toolbarRect });

    // Set position using fixed positioning (no scrollY/scrollX needed)
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.transform = 'none'; // Remove any transform
    popup.style.right = 'auto';
    popup.style.bottom = 'auto';

    // Force a reflow to ensure styles are applied
    void popup.offsetHeight;
  }

  // Store conversation IDs for each popup action
  const popupConversations = new Map(); // action -> conversationId

  async function getAIResponse(action, text, popup) {
    const responseEl = popup.querySelector('#sider-action-popup-response');
    if (!responseEl) return;

    responseEl.textContent = 'Processing...';
    responseEl.classList.add('loading');

    try {
      getCurrentModel(async (model) => {
        const modelName = model || 'webby fusion';
        let prompt = getActionPrompt(action, text);

        // Handle translate language
        if (action === 'translate') {
          const langSelect = popup.querySelector('#sider-translate-language-select');
          const targetLangCode = langSelect ? langSelect.value : 'en';
          const selectedLang = WORLD_LANGUAGES.find(lang => lang.code === targetLangCode);
          const targetLangName = selectedLang ? selectedLang.name : 'English';
          prompt = `Translate to ${targetLangName}: "${text}"`;
        }

        // Route API calls through background script to appear in extension's Network tab
        try {
          // Step 1: Create conversation if it doesn't exist for this action
          let conversationId = popupConversations.get(action);

          if (!conversationId) {
            console.log('🔄 Creating conversation for action:', action);
            const title = getActionTitle(action);

            // Send message to background script to create conversation
            const conversationResult = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                type: 'API_CREATE_CONVERSATION',
                title: `${title}: ${text.substring(0, 30)}...` || `${title}: New Conversation`,
                model: modelName
              }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            });

            if (conversationResult.success && conversationResult.data) {
              // Extract conversation ID from response (check multiple possible field names)
              conversationId = conversationResult.data.id ||
                conversationResult.data.conversation_id ||
                conversationResult.data.cid ||
                conversationResult.data._id;

              if (conversationId) {
                popupConversations.set(action, conversationId);
                // Store conversation ID in popup data attribute for "Continue in Chat" button
                popup.setAttribute('data-conversation-id', conversationId);
                console.log('✅ Conversation created for action:', action, conversationId);
              } else {
                throw new Error('Failed to get conversation ID from response');
              }
            } else {
              throw new Error(conversationResult.error || 'Failed to create conversation');
            }
          }

          // Step 2: Call chatCompletions with the conversation ID via background script
          console.log('🔄 Calling chatCompletions for action:', action, 'conversationId:', conversationId);
          const result = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              type: 'API_CHAT_COMPLETIONS',
              cid: conversationId,
              message: prompt,
              model: modelName,
              options: {
                stream: false,
                from: 'toolbar_action'
              }
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });

          if (result.success && result.data) {
            let responseText = '';
            // Extract response text from various possible response structures
            if (result.data.choices && result.data.choices[0]) {
              responseText = result.data.choices[0].message?.content ||
                result.data.choices[0].text ||
                result.data.choices[0].content || '';
            } else if (result.data.content) {
              responseText = result.data.content;
            } else if (result.data.text) {
              responseText = result.data.text;
            } else if (typeof result.data === 'string') {
              responseText = result.data;
            }

            if (responseText) {
              responseEl.textContent = responseText;
              responseEl.classList.remove('loading');

              // Initialize history with the first state
              if (!popup._history || popup._history.length === 0) {
                const topInput = popup.querySelector('#sider-action-popup-input');
                popup._history = [{
                  prompt: topInput ? topInput.value : text,
                  responseHTML: responseEl.innerHTML
                }];
                popup._currentIndex = 0;
              }

              // Show chat container after response
              const chatContainer = popup.querySelector('#sider-action-popup-chat-container');
              if (chatContainer) {
                chatContainer.style.display = 'flex';
              }

              console.log('✅ Response received for action:', action);
            } else {
              throw new Error('No response text found in API response');
            }
          } else {
            throw new Error(result.error || 'Failed to get response from API');
          }
        } catch (error) {
          console.error('API error:', error);
          responseEl.textContent = `Error: ${error.message || 'Failed to get response. Click "Continue in Chat" to send to chat panel.'}`;
          responseEl.classList.remove('loading');
        }
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      const responseEl = popup.querySelector('#sider-action-popup-response');
      if (responseEl) {
        responseEl.textContent = `Error: ${error.message || 'Failed to get response'}`;
        responseEl.classList.remove('loading');
      }
    }
  }

  function initLanguageDropdown(popup) {
    const trigger = popup.querySelector('#sider-language-dropdown-trigger');
    const menu = popup.querySelector('#sider-language-dropdown-menu');
    const searchInput = popup.querySelector('#sider-language-search-input');
    const languageList = popup.querySelector('#sider-language-list');
    const hiddenInput = popup.querySelector('#sider-translate-language-select');
    const selectedTextSpan = popup.querySelector('.sider-language-selected-text');

    if (!trigger || !menu || !searchInput || !languageList || !hiddenInput) return;

    let selectedLanguage = null;
    let filteredLanguages = [...WORLD_LANGUAGES];

    // Render language list
    function renderLanguages(languages) {
      languageList.innerHTML = '';
      languages.forEach(lang => {
        const item = document.createElement('div');
        item.className = 'sider-language-item';
        if (selectedLanguage && selectedLanguage.code === lang.code) {
          item.classList.add('selected');
        }
        item.innerHTML = `
          <div class="sider-language-item-name">${lang.name}</div>
          <div class="sider-language-item-native">${lang.native}</div>
        `;
        item.addEventListener('click', () => {
          selectLanguage(lang);
          closeDropdown();
        });
        languageList.appendChild(item);
      });
    }

    // Select language
    function selectLanguage(lang) {
      selectedLanguage = lang;
      hiddenInput.value = lang.code;
      selectedTextSpan.textContent = lang.name;

      // Update selected state in list
      languageList.querySelectorAll('.sider-language-item').forEach(item => {
        item.classList.remove('selected');
      });
      const selectedItem = Array.from(languageList.children).find(item => {
        const nameDiv = item.querySelector('.sider-language-item-name');
        return nameDiv && nameDiv.textContent === lang.name;
      });
      if (selectedItem) {
        selectedItem.classList.add('selected');
      }

      // Trigger change event for language select handler
      const event = new Event('change', { bubbles: true });
      hiddenInput.dispatchEvent(event);
    }

    // Filter languages based on search
    function filterLanguages(query) {
      const lowerQuery = query.toLowerCase().trim();
      if (!lowerQuery) {
        filteredLanguages = [...WORLD_LANGUAGES];
      } else {
        filteredLanguages = WORLD_LANGUAGES.filter(lang =>
          lang.name.toLowerCase().includes(lowerQuery) ||
          lang.native.toLowerCase().includes(lowerQuery) ||
          lang.code.toLowerCase().includes(lowerQuery)
        );
      }
      renderLanguages(filteredLanguages);
    }

    // Open dropdown
    function openDropdown() {
      menu.style.display = 'flex';
      trigger.classList.add('active');
      searchInput.focus();
      renderLanguages(filteredLanguages);
    }

    // Close dropdown
    function closeDropdown() {
      menu.style.display = 'none';
      trigger.classList.remove('active');
      searchInput.value = '';
      filteredLanguages = [...WORLD_LANGUAGES];
    }

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.style.display === 'none' || !menu.style.display) {
        openDropdown();
      } else {
        closeDropdown();
      }
    });

    // Search input handler
    searchInput.addEventListener('input', (e) => {
      filterLanguages(e.target.value);
    });

    // Close dropdown when clicking outside
    const handleOutsideClick = (e) => {
      if (!popup.contains(e.target) && !menu.contains(e.target)) {
        closeDropdown();
        document.removeEventListener('click', handleOutsideClick);
      }
    };

    // Add listener when dropdown opens
    const originalOpenDropdown = openDropdown;
    openDropdown = function () {
      originalOpenDropdown();
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, 0);
    };

    // Prevent closing when clicking inside dropdown
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Initialize with default selection (English)
    const defaultLang = WORLD_LANGUAGES.find(lang => lang.code === 'en') || WORLD_LANGUAGES[0];
    if (defaultLang) {
      selectLanguage(defaultLang);
    }

    renderLanguages(filteredLanguages);
  }

  async function sendChatMessage(popup, message, action) {
    if (!message || !message.trim()) return;

    const chatInput = popup.querySelector('#sider-action-popup-chat-input');
    const topInput = popup.querySelector('#sider-action-popup-input');
    const responseEl = popup.querySelector('#sider-action-popup-response');
    const navButtons = popup.querySelector('#sider-action-popup-nav-buttons');
    const conversationId = popupConversations.get(action);

    if (!conversationId) {
      console.error('No conversation ID found for action:', action);
      return;
    }

    // Initialize history if needed
    if (!popup._history) {
      popup._history = [];
      popup._currentIndex = -1;
    }

    // If we're not at the end of history, truncate future states
    if (popup._currentIndex < popup._history.length - 1) {
      popup._history = popup._history.slice(0, popup._currentIndex + 1);
    }

    // Add NEW State
    popup._history.push({
      prompt: message,
      responseHTML: 'Thinking...'
    });
    popup._currentIndex = popup._history.length - 1;

    // Update UI for New State
    if (chatInput) chatInput.value = ''; // Clear chat input
    topInput.value = message; // Replace top prompt with new message

    // Show navigation buttons
    if (navButtons) navButtons.style.display = 'flex';

    // Reset response area
    responseEl.innerHTML = 'Thinking...';
    responseEl.classList.add('loading');
    responseEl.scrollTop = 0;

    // Update navigation button states
    updateNavButtons(popup);

    try {
      getCurrentModel(async (model) => {
        const modelName = model || 'webby fusion';

        console.log('🔄 Sending chat message:', message, 'conversationId:', conversationId);
        const result = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'API_CHAT_COMPLETIONS',
            cid: conversationId,
            message: message,
            model: modelName,
            options: {
              stream: false,
              from: 'toolbar_action'
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (result.success && result.data) {
          let responseText = '';
          if (result.data.choices && result.data.choices[0]) {
            responseText = result.data.choices[0].message?.content ||
              result.data.choices[0].text ||
              result.data.choices[0].content || '';
          } else if (result.data.content) {
            responseText = result.data.content;
          } else if (result.data.text) {
            responseText = result.data.text;
          } else if (typeof result.data === 'string') {
            responseText = result.data;
          }

          if (responseText) {
            responseEl.textContent = responseText;
            responseEl.classList.remove('loading');

            // Update history with actual response
            if (popup._history && popup._currentIndex >= 0) {
              popup._history[popup._currentIndex].responseHTML = responseEl.innerHTML;
            }

            console.log('✅ Chat response received');
          } else {
            responseEl.textContent = 'Error: No response text found';
            responseEl.classList.remove('loading');
            // Update history with error
            if (popup._history && popup._currentIndex >= 0) {
              popup._history[popup._currentIndex].responseHTML = responseEl.innerHTML;
            }
          }
        } else {
          responseEl.textContent = `Error: ${result.error || 'Failed to get response'}`;
          responseEl.classList.remove('loading');
          // Update history with error
          if (popup._history && popup._currentIndex >= 0) {
            popup._history[popup._currentIndex].responseHTML = responseEl.innerHTML;
          }
        }
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      responseEl.textContent = `Error: ${error.message}`;
      responseEl.classList.remove('loading');
      // Update history with error
      if (popup._history && popup._currentIndex >= 0) {
        popup._history[popup._currentIndex].responseHTML = responseEl.innerHTML;
      }
    }
  }

  function updateNavButtons(popup) {
    const backBtn = popup.querySelector('#sider-action-popup-back-btn');
    const nextBtn = popup.querySelector('#sider-action-popup-next-btn');

    if (!popup._history || popup._currentIndex === undefined) return;

    // Disable/enable back button
    if (backBtn) {
      if (popup._currentIndex > 0) {
        backBtn.disabled = false;
        backBtn.style.opacity = '1';
        backBtn.style.cursor = 'pointer';
      } else {
        backBtn.disabled = true;
        backBtn.style.opacity = '0.3';
        backBtn.style.cursor = 'not-allowed';
      }
    }

    // Disable/enable next button
    if (nextBtn) {
      if (popup._currentIndex < popup._history.length - 1) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
      } else {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.3';
        nextBtn.style.cursor = 'not-allowed';
      }
    }
  }

  function attachPopupListeners(popup, action, text) {
    // Drag functionality
    const header = popup.querySelector('.sider-action-popup-header');
    if (header) {
      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let popupStartX = 0;
      let popupStartY = 0;

      const handleMouseDown = (e) => {
        // Don't start drag if clicking on buttons
        if (e.target.closest('.sider-action-popup-pin-btn') ||
          e.target.closest('.sider-action-popup-close-btn')) {
          return;
        }

        isDragging = true;
        popup.classList.add('dragging');

        const rect = popup.getBoundingClientRect();
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        popupStartX = rect.left;
        popupStartY = rect.top;

        e.preventDefault();
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        let newX = popupStartX + deltaX;
        let newY = popupStartY + deltaY;

        // Keep popup within viewport bounds
        const popupRect = popup.getBoundingClientRect();
        const minX = 0;
        const minY = 0;
        const maxX = window.innerWidth - popupRect.width;
        const maxY = window.innerHeight - popupRect.height;

        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        popup.style.left = `${newX}px`;
        popup.style.top = `${newY}px`;
        popup.style.transform = 'none';
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
      };

      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          popup.classList.remove('dragging');
        }
      };

      header.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Clean up listeners when popup is removed
      const originalRemove = popup.remove.bind(popup);
      popup.remove = function () {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        originalRemove();
      };
    }

    // Close button
    const closeBtn = popup.querySelector('.sider-action-popup-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popup.remove();
        if (currentPopup === popup) {
          currentPopup = null;
        }
      });
    }

    // Pin button - sync with menu pin toggle
    const pinBtn = popup.querySelector('.sider-action-popup-pin-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const action = pinBtn.getAttribute('data-pin');

        // Toggle pin state in the same Set used by menu
        if (pinned.has(action)) {
          pinned.delete(action);
        } else {
          pinned.add(action);
        }

        // Save to storage
        chrome.storage.sync.set({ sider_pinned_actions: Array.from(pinned) }, () => {
          // Update toolbar pinned buttons immediately
          renderPinnedButtons();

          // Update popup pin button state
          const isPinned = pinned.has(action);
          if (isPinned) {
            pinBtn.classList.add('active');
            pinBtn.setAttribute('title', 'Unpin');
          } else {
            pinBtn.classList.remove('active');
            pinBtn.setAttribute('title', 'Pin');
          }

          // Also update pinnedPopups for popup persistence
          if (isPinned) {
            pinnedPopups.add(action);
          } else {
            pinnedPopups.delete(action);
          }
        });
      });
    }

    // Copy button
    const copyBtn = popup.querySelector('#sider-action-popup-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const responseEl = popup.querySelector('#sider-action-popup-response');
        if (responseEl && !responseEl.classList.contains('loading')) {
          navigator.clipboard.writeText(responseEl.textContent).then(() => {
            // Show copied feedback by changing icon temporarily
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            `;
            setTimeout(() => {
              copyBtn.innerHTML = originalHTML;
            }, 2000);
          });
        }
      });
    }

    // Helper function to replace selection
    const replaceSelectionWithText = (text) => {
      // Try to use stored state first
      if (lastActiveElement && document.body.contains(lastActiveElement)) {
        if (lastActiveElement.tagName === 'INPUT' || lastActiveElement.tagName === 'TEXTAREA') {
          try {
            lastActiveElement.focus();
            const start = lastSelectionStart;
            const end = lastSelectionEnd;
            const val = lastActiveElement.value;
            lastActiveElement.value = val.substring(0, start) + text + val.substring(end);
            lastActiveElement.selectionStart = lastActiveElement.selectionEnd = start + text.length;
            lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          } catch (e) { console.error('Replace input error', e); }
        } else if (lastActiveElement.isContentEditable) {
          try {
            lastActiveElement.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            if (lastRange) {
              selection.addRange(lastRange);
            }
            document.execCommand('insertText', false, text);
            return true;
          } catch (e) { console.error('Replace contenteditable error', e); }
        }
      }

      // Fallback to lastRange
      if (lastRange) {
        try {
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(lastRange);
          if (document.designMode === 'on' || (lastRange.startContainer.parentElement && lastRange.startContainer.parentElement.isContentEditable)) {
            document.execCommand('insertText', false, text);
          } else {
            lastRange.deleteContents();
            lastRange.insertNode(document.createTextNode(text));
          }
          return true;
        } catch (e) { console.error('Replace range error', e); }
      }

      // Fallback to current selection if everything else fails
      try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          return true;
        }
      } catch (e) { console.error('Replace fallback error', e); }

      return false;
    };

    // Replace/Insert button handler (Main Footer)
    const replaceBtn = popup.querySelector('#sider-action-popup-replace-btn');
    if (replaceBtn) {
      replaceBtn.addEventListener('click', () => {
        const responseEl = popup.querySelector('#sider-action-popup-response');
        if (responseEl && !responseEl.classList.contains('loading')) {
          const text = responseEl.textContent;
          if (replaceSelectionWithText(text)) {
            // Show success feedback
            const originalHTML = replaceBtn.innerHTML;
            replaceBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            `;
            setTimeout(() => {
              replaceBtn.innerHTML = originalHTML;
            }, 2000);
          }
        }
      });
    }

    // Insert button - Replace selected text with AI response (Chat Container)
    const insertBtn = popup.querySelector('#sider-action-popup-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const responseEl = popup.querySelector('#sider-action-popup-response');
        if (responseEl && !responseEl.classList.contains('loading')) {
          const responseText = responseEl.textContent;

          if (replaceSelectionWithText(responseText)) {
            // Show success feedback
            const originalHTML = insertBtn.innerHTML;
            insertBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              `;
            setTimeout(() => {
              insertBtn.innerHTML = originalHTML;
            }, 2000);
          }
        }
      });
    }

    // Continue in Chat button
    const chatBtn = popup.querySelector('#sider-action-popup-chat-btn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        const inputEl = popup.querySelector('#sider-action-popup-input');
        const text = inputEl ? inputEl.value : selectedText;
        const conversationId = popup.getAttribute('data-conversation-id');

        // Dispatch event with conversation ID if available
        window.dispatchEvent(new CustomEvent('sider:prompt-text', {
          detail: {
            text: text,
            prompt: getActionPrompt(action, text),
            conversationId: conversationId || null
          }
        }));

        popup.remove();
        if (currentPopup === popup) {
          currentPopup = null;
        }
      });
    }


    // Initialize language dropdown for translate action
    if (action === 'translate') {
      initLanguageDropdown(popup);

      // Language change handler
      const langSelect = popup.querySelector('#sider-translate-language-select');
      if (langSelect) {
        langSelect.addEventListener('change', () => {
          const inputEl = popup.querySelector('#sider-action-popup-input');
          const text = inputEl ? inputEl.value.trim() : (selectedText ? selectedText.trim() : '');

          if (!text || text.length === 0) {
            const responseEl = popup.querySelector('#sider-action-popup-response');
            if (responseEl) {
              responseEl.textContent = 'Please enter text to translate above.';
              responseEl.classList.remove('loading');
            }
            return;
          }

          // Call API when language is selected and text is available
          getAIResponse(action, text, popup);
        });
      }
    }

    // Back button listener
    const backBtn = popup.querySelector('#sider-action-popup-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (popup._history && popup._currentIndex > 0) {
          popup._currentIndex--;
          const prevState = popup._history[popup._currentIndex];

          const topInput = popup.querySelector('#sider-action-popup-input');
          const responseEl = popup.querySelector('#sider-action-popup-response');

          if (topInput && responseEl) {
            topInput.value = prevState.prompt;
            responseEl.innerHTML = prevState.responseHTML;
            responseEl.classList.remove('loading');

            updateNavButtons(popup);
          }
        }
      });
    }

    // Next button listener
    const nextBtn = popup.querySelector('#sider-action-popup-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (popup._history && popup._currentIndex < popup._history.length - 1) {
          popup._currentIndex++;
          const nextState = popup._history[popup._currentIndex];

          const topInput = popup.querySelector('#sider-action-popup-input');
          const responseEl = popup.querySelector('#sider-action-popup-response');

          if (topInput && responseEl) {
            topInput.value = nextState.prompt;
            responseEl.innerHTML = nextState.responseHTML;
            responseEl.classList.remove('loading');

            updateNavButtons(popup);
          }
        }
      });
    }

    // Chat input listeners
    const chatInput = popup.querySelector('#sider-action-popup-chat-input');
    const chatSendBtn = popup.querySelector('#sider-action-popup-chat-send-btn');

    if (chatInput && chatSendBtn) {
      // Send on button click
      chatSendBtn.addEventListener('click', () => {
        sendChatMessage(popup, chatInput.value, action);
      });

      // Send on Enter (Shift+Enter for new line)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage(popup, chatInput.value, action);
        }
      });
    }

    // For popup actions with editable input, trigger on input change
    const inputEl = popup.querySelector('#sider-action-popup-input');
    if (inputEl && !inputEl.hasAttribute('readonly')) {
      let timeoutId = null;
      inputEl.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const inputText = inputEl.value.trim();

          // For translate action, don't auto-trigger - wait for language selection
          if (action === 'translate') {
            const langSelect = popup.querySelector('#sider-translate-language-select');
            if (!langSelect || !langSelect.value) {
              const responseEl = popup.querySelector('#sider-action-popup-response');
              if (responseEl) {
                responseEl.textContent = 'Please select a target language above.';
                responseEl.classList.remove('loading');
              }
              return;
            }

            // If language is selected and text is sufficient, trigger translation
            if (inputText.length > 0) {
              getAIResponse(action, inputText, popup);
            } else {
              const responseEl = popup.querySelector('#sider-action-popup-response');
              if (responseEl) {
                responseEl.textContent = 'Please enter text to translate above.';
                responseEl.classList.remove('loading');
              }
            }
            return;
          }

          // For other actions, trigger AI response when user enters sufficient text (minimum 10 characters)
          if (inputText.length > 10) {
            getAIResponse(action, inputText, popup);
          } else if (inputText.length === 0) {
            // Clear response when input is empty
            const responseEl = popup.querySelector('#sider-action-popup-response');
            if (responseEl) {
              const actionText = action === 'answer' ? 'question' : action === 'explain' ? 'text to explain' : action === 'summarize' ? 'text to summarize' : 'code to explain';
              responseEl.textContent = `Please enter your ${actionText} above.`;
              responseEl.classList.remove('loading');
            }
          }
        }, 1000);
      });
    }

    // Refresh button
    const refreshBtn = popup.querySelector('#sider-action-popup-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const inputEl = popup.querySelector('#sider-action-popup-input');
        const text = inputEl ? inputEl.value.trim() : (selectedText ? selectedText.trim() : '');

        if (action === 'translate') {
          // For translate, check if language is selected
          const langSelect = popup.querySelector('#sider-translate-language-select');
          if (!langSelect || !langSelect.value || langSelect.value === '') {
            const responseEl = popup.querySelector('#sider-action-popup-response');
            if (responseEl) {
              responseEl.textContent = 'Please select a target language above.';
              responseEl.classList.remove('loading');
            }
            return;
          }

          if (!text || text.length === 0) {
            const responseEl = popup.querySelector('#sider-action-popup-response');
            if (responseEl) {
              responseEl.textContent = 'Please enter text to translate above.';
              responseEl.classList.remove('loading');
            }
            return;
          }
        }

        getAIResponse(action, text, popup);
      });
    }

    // Speaker button (read aloud)
    const speakerBtn = popup.querySelector('#sider-action-popup-speaker-btn');
    if (speakerBtn) {
      speakerBtn.addEventListener('click', () => {
        const responseEl = popup.querySelector('#sider-action-popup-response');
        if (responseEl && !responseEl.classList.contains('loading')) {
          const text = responseEl.textContent;
          if (text && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }
      });
    }

    // Close on outside click - use longer delay to prevent immediate closure
    setTimeout(() => {
      const handleOutsideClick = (e) => {
        // Don't close if clicking on popup, toolbar, menu, or any toolbar-related elements
        if (!popup || popup.contains(e.target)) return;
        if (toolbarEl && toolbarEl.contains(e.target)) return;
        if (currentMenu && currentMenu.contains(e.target)) return;
        if (e.target.closest('.sider-action-popup')) return;
        if (e.target.closest('.sider-more-menu')) return;
        if (e.target.closest('.sider-selection-btn')) return;

        // Only close if clicking outside AND popup is not pinned (check both Sets)
        const isPinnedInToolbar = pinned.has(action);
        const isPinnedPopup = pinnedPopups.has(action);
        if (!isPinnedInToolbar && !isPinnedPopup) {
          console.log('handleOutsideClick: Closing popup', { action });
          popup.remove();
          if (currentPopup === popup) {
            currentPopup = null;
          }
          document.removeEventListener('mousedown', handleOutsideClick);
        }
      };
      // Use longer delay to prevent immediate closure from menu click
      setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
      }, 200);
    }, 200);
  }

  function triggerAction(action) {

    const speak = (text) => {
      try { const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (_) { }
    };

    // Helper function to get current text selection
    // IMPORTANT: Use stored selectedText first, as selection may be cleared
    const getCurrentSelection = () => {
      // First try the stored selectedText (most reliable)
      if (selectedText && selectedText.trim().length > 0) {
        return selectedText.trim();
      }
      // Fallback: try to get current selection from DOM
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const text = selection.toString().trim();
          if (text.length > 0) {
            // Update stored selectedText for future use
            selectedText = text;
            return text;
          }
        }
      } catch (error) {
        console.warn('triggerAction: Error getting current selection', error);
      }
      return null;
    };

    console.log('triggerAction called:', { action, selectedText, hasSelection: !!window.getSelection()?.rangeCount });

    switch (action) {
      case 'copy':
        const copyText = getCurrentSelection();
        if (copyText) {
          navigator.clipboard.writeText(copyText).then(showCopyFeedback);
        } else {
          console.warn('triggerAction: No text to copy');
        }
        break;
      case 'highlight':
        // Highlight needs the actual selection range, not just text
        highlightSelected();
        break;
      case 'readaloud':
        const readText = getCurrentSelection();
        if (readText) {
          speak(readText);
        } else {
          console.warn('triggerAction: No text to read');
        }
        break;
      case 'explain':
      case 'translate':
      case 'summarize':
      case 'explaincodes':
      case 'improvewriting':
      case 'fixgrammar':
      case 'writeprofessionally':
      case 'writefunny':
        // Use stored selectedText if available, otherwise try to get current selection, or use empty string
        const textForAction = getCurrentSelection() || (selectedText && selectedText.trim().length > 0 ? selectedText.trim() : '');
        // Always open popup - user can enter text manually if needed
        const actionPopup = createActionPopup(action, textForAction || '');
        if (!actionPopup) {
        }
        break;
      case 'answer':
        // For 'answer' action, allow opening popup even without selected text
        // User will enter their question in the popup
        const answerText = getCurrentSelection() || '';
        const answerPopup = createActionPopup(action, answerText);
        if (!answerPopup) {
        }
        break;
    }
  }

  function renderPinnedButtons() {
    const container = document.getElementById('sider-pinned-actions');
    if (!container) {
      return;
    }
    container.innerHTML = '';
    if (!pinned || pinned.size === 0) {
      return;
    }
    const showText = pinned.size < 3;

    Array.from(pinned).forEach(action => {
      if (!ACTIONS.includes(action)) {
        return;
      }
      const b = document.createElement('button');
      b.className = 'sider-pin-btn';
      const name = action.charAt(0).toUpperCase() + action.slice(1);
      b.title = name;

      if (showText) {
        b.innerHTML = `${ACTION_ICONS[action] || '★'} <span style="margin-left: 6px; font-size: 13px; font-weight: 500;">${name}</span>`;
        b.style.width = 'auto';
        b.style.padding = '0 10px';
        b.style.height = '32px'; // Match toolbar height better
      } else {
        b.innerHTML = ACTION_ICONS[action] || '★';
      }

      b.setAttribute('data-action', action);

      // Store action in closure to prevent issues if button is recreated
      const actionToTrigger = action;
      let isHandlingClick = false; // Flag to prevent duplicate calls

      // Add mousedown handler
      b.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to document mousedown
      });

      // Trigger action on mouseup (more reliable than click when buttons might be recreated)
      b.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Prevent duplicate calls if already handling
        if (isHandlingClick) {
          return;
        }

        isHandlingClick = true;
        triggerAction(actionToTrigger);

        // Reset flag after a short delay
        setTimeout(() => {
          isHandlingClick = false;
        }, 500);

        // Keep toolbar and input visible - don't clear
        window.getSelection()?.removeAllRanges();
      });

      // Remove click handler since mouseup is working - or keep it but check the flag
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Prevent duplicate calls if already handling
        if (isHandlingClick) {
          return;
        }

        // Only trigger if mouseup didn't already handle it
        // This is a backup in case mouseup doesn't fire
        setTimeout(() => {
          if (!isHandlingClick) {
            isHandlingClick = true;
            triggerAction(actionToTrigger);
            setTimeout(() => {
              isHandlingClick = false;
            }, 500);
          }
        }, 10);

        // Keep toolbar and input visible - don't clear
        window.getSelection()?.removeAllRanges();
      });

      container.appendChild(b);
    });
  }

  function loadPinned() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.sync) {
        console.warn('loadPinned: chrome.storage.sync not available');
        pinned = new Set();
        renderPinnedButtons();
        return;
      }

      chrome.storage.sync.get(['sider_pinned_actions'], (r) => {
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          console.warn('loadPinned: chrome.storage error:', chrome.runtime.lastError.message);
          pinned = new Set();
          renderPinnedButtons();
          return;
        }

        try {
          const list = Array.isArray(r.sider_pinned_actions) ? r.sider_pinned_actions : [];
          pinned = new Set(list.filter(a => ACTIONS.includes(a)));
          renderPinnedButtons();
        } catch (error) {
          console.error('loadPinned: Error processing pinned actions', error);
          pinned = new Set();
          renderPinnedButtons();
        }
      });
    } catch (error) {
      console.error('loadPinned: Error accessing chrome.storage', error);
      pinned = new Set();
      renderPinnedButtons();
    }
  }

  async function init() {
    // Add global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection in toolbar:', event.reason);
      // Don't prevent default - let it log but don't break the popup
      // The error might be from other parts of the extension
    });

    // Add error handler for general errors
    window.addEventListener('error', (event) => {
      // Only log if it's related to our code
      if (event.filename && event.filename.includes('toolbar')) {
        console.error('Error in toolbar:', event.error);
      }
    });

    try {
      await loadToolbarHtml();
      createToolbar();
      attachActions();
      loadPinned();
    } catch (error) {
      console.error('init: Error initializing toolbar', error);
      // Try to continue anyway
      try {
        createToolbar();
        attachActions();
      } catch (e) {
        console.error('init: Failed to recover from initialization error', e);
      }
    }

    // Listen for model changes
    try {
      if (chrome && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          try {
            if (area === 'sync' && changes.sider_selected_model) {
              updateAIModelMenuItem();
              updateAnalyzeButtonIcon();
            }
          } catch (error) {
            console.error('Storage change listener error:', error);
          }
        });
      }
    } catch (error) {
      console.warn('init: Could not set up storage listener', error);
    }

    // Update AI model menu item when menu is shown
    const originalShowMoreOptions = showMoreOptions;
    showMoreOptions = function () {
      originalShowMoreOptions();
      // Update model text and icon after menu is created
      setTimeout(() => {
        updateAIModelMenuItem();
      }, 50);
    };
  }

  // Keep pins in sync across tabs and windows
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.sider_pinned_actions) {
        const newVal = changes.sider_pinned_actions.newValue || [];
        pinned = new Set(Array.isArray(newVal) ? newVal.filter(a => ACTIONS.includes(a)) : []);
        renderPinnedButtons();
      }
    });
  }

  window.SiderToolbar = { init, open: showToolbar, hide };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
