(function() {
  'use strict';
  
  // Agent Tab Component
  const AgentTab = {
    // Initialize agent tab
    init: async function() {
      console.log('Agent tab initialized');
      this.setupVideo();
      this.setupEventListeners();
    },
    
    // Setup video element
    setupVideo: function() {
      const video = document.getElementById('sider-agent-video');
      if (video) {
        // Ensure video plays
        video.play().catch(err => {
          console.log('Video autoplay prevented:', err);
          // Try to play on user interaction
          document.addEventListener('click', () => {
            video.play().catch(() => {});
          }, { once: true });
        });
      }
    },
    
    // Toggle mic/send button
    toggleMicSendButton: function() {
      const agentInput = document.getElementById('sider-agent-input');
      const micBtn = document.getElementById('sider-agent-mic-btn');
      const sendBtn = document.getElementById('sider-agent-send-btn');
      
      if (!agentInput || !micBtn || !sendBtn) {
        setTimeout(() => {
          this.toggleMicSendButton();
        }, 100);
        return;
      }
      
      const hasText = agentInput.value && agentInput.value.trim().length > 0;
      
      if (hasText) {
        micBtn.style.setProperty('display', 'none', 'important');
        sendBtn.style.setProperty('display', 'flex', 'important');
      } else {
        micBtn.style.setProperty('display', 'flex', 'important');
        sendBtn.style.setProperty('display', 'none', 'important');
      }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
      const agentInput = document.getElementById('sider-agent-input');
      const micBtn = document.getElementById('sider-agent-mic-btn');
      const sendBtn = document.getElementById('sider-agent-send-btn');
      const demoLink = document.getElementById('sider-agent-demo-link');
      const upgradeLink = document.getElementById('sider-agent-upgrade-link');
      const selectBtn = document.getElementById('sider-agent-select-btn');
      const addBtn = document.getElementById('sider-agent-add-btn');
      
      const toggleMicSendButton = () => this.toggleMicSendButton();
      
      // Auto-resize textarea and toggle button
      if (agentInput) {
        agentInput.addEventListener('input', (e) => {
          this.autoResize(e.target);
          toggleMicSendButton();
        });
        
        agentInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
          } else {
            this.autoResize(e.target);
            toggleMicSendButton();
          }
        });
        
        agentInput.addEventListener('paste', () => {
          setTimeout(() => {
            this.autoResize(agentInput);
            toggleMicSendButton();
          }, 0);
        });
        
        // Initial toggle
        toggleMicSendButton();
        setTimeout(() => {
          this.autoResize(agentInput);
          toggleMicSendButton();
        }, 100);
      }
      
      // Microphone button
      if (micBtn) {
        micBtn.addEventListener('click', () => {
          console.log('Voice input clicked');
          // Add voice input functionality here
        });
      }
      
      // Send button
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          this.handleSend();
        });
      }
      
      // Demo video link - opens in new tab, no need to prevent default
      // Link is handled by href attribute
      
      
      // Agent select button
      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          console.log('Agent selected');
          // Handle agent selection
        });
      }
      
      // Add agent button - creates new chat
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.createNewChat();
        });
      }
      
      // Add agent button above input - creates new chat
      const addBtnAbove = document.getElementById('sider-agent-add-btn-above');
      if (addBtnAbove) {
        addBtnAbove.addEventListener('click', () => {
          this.createNewChat();
        });
      }
    },
    
    // Auto-resize textarea
    autoResize: function(textarea) {
      if (!textarea) return;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight + 'px';
    },
    
    // Handle send message
    handleSend: function() {
      const input = document.getElementById('sider-agent-input');
      if (!input || !input.value.trim()) return;
      
      const message = input.value.trim();
      
      // Show messages container and hide centered content
      const messagesContainer = document.getElementById('sider-agent-messages');
      const centeredContent = document.getElementById('sider-agent-centered-content');
      const agentContent = document.querySelector('.sider-agent-content');
      const selectionAboveInput = document.getElementById('sider-agent-selection-above-input');
      
      if (messagesContainer) {
        messagesContainer.style.display = 'flex';
      }
      if (centeredContent) {
        centeredContent.style.display = 'none';
      }
      if (agentContent) {
        agentContent.classList.add('has-messages');
      }
      if (selectionAboveInput) {
        selectionAboveInput.style.display = 'flex';
      }
      
      // Add user message
      this.addMessage('user', message);
      
      // Clear input
      input.value = '';
      this.autoResize(input);
      
      // Toggle button back to mic
      this.toggleMicSendButton();
      
      // Simulate agent response (you can replace this with actual API call)
      setTimeout(() => {
        this.addMessage('assistant', 'I\'m ready to help you with browser automation tasks. What would you like me to do?');
      }, 500);
    },
    
    // Add message to conversation
    addMessage: function(role, text) {
      const messagesContainer = document.getElementById('sider-agent-messages');
      if (!messagesContainer) return;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `sider-agent-message sider-agent-message-${role}`;
      
      messageDiv.innerHTML = `
        <div class="sider-agent-message-content">
          <div class="sider-agent-message-text">${this.escapeHtml(text)}</div>
        </div>
      `;
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return messageDiv;
    },
    
    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    // Create new chat
    createNewChat: function() {
      const messagesContainer = document.getElementById('sider-agent-messages');
      const centeredContent = document.getElementById('sider-agent-centered-content');
      const agentContent = document.querySelector('.sider-agent-content');
      const selectionAboveInput = document.getElementById('sider-agent-selection-above-input');
      const input = document.getElementById('sider-agent-input');
      
      // Clear messages
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
        messagesContainer.style.display = 'none';
      }
      
      // Show centered content
      if (centeredContent) {
        centeredContent.style.display = 'flex';
      }
      
      // Hide selection above input
      if (selectionAboveInput) {
        selectionAboveInput.style.display = 'none';
      }
      
      // Remove has-messages class
      if (agentContent) {
        agentContent.classList.remove('has-messages');
      }
      
      // Clear input
      if (input) {
        input.value = '';
        this.autoResize(input);
      }
    },
    
    // Switch to agent view
    switchToAgent: function() {
      const container = document.getElementById('sider-agent-tab-container');
      if (container) {
        container.style.display = 'block';
      }
    }
  };
  
  // Make globally accessible
  window.SiderAgentTab = AgentTab;
})();
