(function(){
  'use strict';

  // Don't initialize on our own website
  const currentUrl = window.location.href;
  const isOwnWebsite = currentUrl.includes('localhost:4200') || currentUrl.includes('127.0.0.1:4200');
  if (isOwnWebsite) {
    return; // Exit early, don't initialize toolbar on our own website
  }

  let toolbarEl = null;
  let selectedText = '';
  let pinned = new Set();
  let currentMenu = null;
  let isUpdatingMenu = false;

  const ACTIONS = [
    'copy', 'highlight', 'readaloud', 'explain', 'translate', 'summarize', 'answer', 'explaincodes'
  ];

  const ACTION_ICONS = {
    copy: '📄',
    highlight: '🔦',
    readaloud: '🗣️',
    explain: '📝',
    translate: '🌐',
    summarize: '🧾',
    answer: '❓',
    explaincodes: '💻'
  };

  function createToolbar() {
    if (toolbarEl) return toolbarEl;
    const el = document.createElement('div');
    el.id = 'sider-selection-toolbar';
    el.innerHTML = `
      <button class="sider-selection-btn" data-action="analyze" title="Ask AI about this text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.12"/>
          <circle cx="12" cy="12" r="6" fill="#3b82f6"/>
        </svg>
      </button>
      <div class="sider-pinned" id="sider-pinned-actions"></div>
      <button class="sider-selection-btn" data-action="notes" title="Add to Notes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="16" y2="11"/>
          <line x1="8" y1="15" x2="12" y2="15"/>
        </svg>
      </button>
      <button class="sider-selection-btn" id="sider-more-btn" data-action="more" title="More options">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
      <button class="sider-selection-btn" data-action="close" title="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    document.body.appendChild(el);
    toolbarEl = el;
    return el;
  }

  function showToolbar() {
    // Don't update toolbar if we're in the middle of updating menu
    if (isUpdatingMenu) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      if (!isUpdatingMenu) hide();
      return;
    }
    selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      if (!isUpdatingMenu) hide();
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const el = createToolbar();
    const toolbarHeight = 40;
    const toolbarPadding = 8;

    let top = rect.top - toolbarHeight - toolbarPadding;
    let left = rect.left + (rect.width / 2) - (el.offsetWidth / 2);
    if (top < 10) top = rect.bottom + toolbarPadding;
    if (left < 10) left = 10;
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
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.cssText = 'background-color: #fef08a; padding: 2px 0;';
    span.className = 'sider-highlight';
    try { range.surroundContents(span); } catch (_) {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
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
    addItem('copy','Copy');
    addItem('highlight','Highlight');
    addItem('readaloud','Read aloud');
    const sep = document.createElement('div'); sep.className='sider-more-menu-sep'; menu.appendChild(sep);
    addItem('explain','Explain');
    addItem('translate','Translate to English');
    addItem('summarize','Summarize');
    addItem('answer','Answer this question');
    addItem('explaincodes','Explain codes');
    
    if (!targetMenu && !currentMenu) {
      currentMenu = menu;
    }
    return menu;
  }

  function attachMenuListeners(menu, btn) {
    const speak = (text) => {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (_) {}
    };

    // Use event delegation - attach to menu once, works even after innerHTML changes
    menu.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling to document mousedown
      const pinBtn = e.target.closest('.sider-pin-toggle');
      if (pinBtn) {
        e.stopPropagation();
        e.preventDefault();
        isUpdatingMenu = true;
        const a = pinBtn.getAttribute('data-pin');
        if (pinned.has(a)) {
          pinned.delete(a);
        } else {
          pinned.add(a);
        }
        // Preserve selection and toolbar state before updates
        const selection = window.getSelection();
        let selectionRange = null;
        if (selection && selection.rangeCount > 0) {
          selectionRange = selection.getRangeAt(0).cloneRange();
        }
        
        // Update storage and immediately reflect changes
        chrome.storage.sync.set({ sider_pinned_actions: Array.from(pinned) }, () => {
          // Restore selection first to prevent any issues
          if (selectionRange && selection) {
            try {
              selection.removeAllRanges();
              selection.addRange(selectionRange);
            } catch(_) {}
          }
          
          // Save menu and toolbar state before updates
          const menuRect = menu.getBoundingClientRect();
          const menuTop = menuRect.top + window.scrollY;
          const menuLeft = menuRect.left + window.scrollX;
          
          const el = createToolbar();
          const toolbarTop = el.style.top;
          const toolbarLeft = el.style.left;
          const toolbarWasVisible = el.style.display !== 'none';
          
          // Explicitly keep toolbar visible during update
          if (el && selectedText) {
            el.style.display = 'flex';
          }
          
          // Update toolbar immediately - show/hide pinned buttons
          renderPinnedButtons();
          
          // Rebuild menu items in place (updates same menu element's innerHTML)
          buildMenuItems(menu);
          
          // Restore menu position (menu is the same element, just innerHTML was updated)
          if (menu.parentNode) {
            menu.style.top = `${menuTop}px`;
            menu.style.left = `${menuLeft}px`;
          }
          
          // Ensure toolbar stays visible and maintain position
          if (el && selectedText) {
            el.style.display = 'flex';
            if (toolbarTop) el.style.top = toolbarTop;
            if (toolbarLeft) el.style.left = toolbarLeft;
            
            // If toolbar width changed due to pinned buttons, reposition if needed
            if (selection && selection.rangeCount > 0) {
              try {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const toolbarHeight = 40;
                const toolbarPadding = 8;
                let top = rect.top - toolbarHeight - toolbarPadding;
                let left = rect.left + (rect.width / 2) - (el.offsetWidth / 2);
                if (top < 10) top = rect.bottom + toolbarPadding;
                if (left < 10) left = 10;
                if (left + el.offsetWidth > window.innerWidth - 10) left = window.innerWidth - el.offsetWidth - 10;
                el.style.top = `${top + window.scrollY}px`;
                el.style.left = `${left + window.scrollX}px`;
              } catch(_) {}
            }
          }
          
          // Reset flag after a short delay to allow DOM updates
          setTimeout(() => {
            isUpdatingMenu = false;
          }, 150);
        });
        return;
      }
      const target = e.target.closest('.sider-more-menu-item');
      if (!target) return;
      e.stopPropagation(); // Prevent event from bubbling to document handlers
      const action = target.getAttribute('data-action');
      
      // For all actions - keep toolbar and input visible
      triggerAction(action);
      menu.remove();
      currentMenu = null;
      // Don't hide toolbar or clear input for any toolbar action
      window.getSelection()?.removeAllRanges();
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
        triggerAction(action);
        // Don't hide toolbar or clear input for toolbar actions (copy, highlight, etc.)
        // Only clear selection ranges
        window.getSelection()?.removeAllRanges();
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
      
      // Don't hide if clicking on menu, toolbar, or any toolbar-related elements
      if (currentMenu && currentMenu.contains(e.target)) return;
      if (toolbarEl && toolbarEl.contains(e.target)) return;
      if (e.target.closest('.sider-pin-btn')) return;
      if (e.target.closest('.sider-selection-btn')) return;
      if (e.target.closest('.sider-more-menu')) return;
      
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

  function triggerAction(action) {
    const speak = (text) => {
      try { const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch(_) {}
    };
    switch (action) {
      case 'copy':
        if (selectedText) navigator.clipboard.writeText(selectedText).then(showCopyFeedback);
        // Keep toolbar and input visible after copy
        break;
      case 'highlight':
        highlightSelected();
        // Keep toolbar and input visible after highlight
        break;
      case 'readaloud':
        if (selectedText) speak(selectedText);
        // Keep toolbar and input visible after read aloud
        break;
      case 'explain':
        window.dispatchEvent(new CustomEvent('sider:prompt-text', { detail: { text: selectedText, prompt: 'Explain this text' } }));
        break;
      case 'translate':
        window.dispatchEvent(new CustomEvent('sider:prompt-text', { detail: { text: selectedText, prompt: 'Translate to English' } }));
        break;
      case 'summarize':
        window.dispatchEvent(new CustomEvent('sider:prompt-text', { detail: { text: selectedText, prompt: 'Summarize this text' } }));
        break;
      case 'answer':
        window.dispatchEvent(new CustomEvent('sider:prompt-text', { detail: { text: selectedText, prompt: 'Answer this question' } }));
        break;
      case 'explaincodes':
        window.dispatchEvent(new CustomEvent('sider:prompt-text', { detail: { text: selectedText, prompt: 'Explain the code' } }));
        break;
    }
  }

  function renderPinnedButtons() {
    const container = document.getElementById('sider-pinned-actions');
    if (!container) return;
    container.innerHTML = '';
    if (!pinned || pinned.size === 0) return;
    Array.from(pinned).forEach(action => {
      if (!ACTIONS.includes(action)) return;
      const b = document.createElement('button');
      b.className = 'sider-pin-btn';
      b.title = action.charAt(0).toUpperCase() + action.slice(1);
      b.textContent = ACTION_ICONS[action] || '★';
      b.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to document mousedown
        triggerAction(action);
        // Keep toolbar and input visible - don't clear
        window.getSelection()?.removeAllRanges();
      });
      container.appendChild(b);
    });
  }

  function loadPinned() {
    chrome.storage.sync.get(['sider_pinned_actions'], (r) => {
      const list = Array.isArray(r.sider_pinned_actions) ? r.sider_pinned_actions : [];
      pinned = new Set(list.filter(a => ACTIONS.includes(a)));
      renderPinnedButtons();
    });
  }

  function init() { createToolbar(); attachActions(); loadPinned(); }
  
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
})();


