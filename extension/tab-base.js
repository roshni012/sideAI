(function() {
  'use strict';
  
  // Base Tab Component - Template for all tabs
  window.TabBase = {
    // Load HTML content from file
    loadHTML: async function(tabName) {
      try {
        const url = chrome.runtime.getURL(`${tabName}-tab.html`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${tabName}-tab.html`);
        }
        const html = await response.text();
        return html;
      } catch (error) {
        console.error(`Error loading ${tabName} tab HTML:`, error);
        return this.createFallbackHTML(tabName);
      }
    },
    
    // Create fallback HTML if file doesn't exist
    createFallbackHTML: function(tabName) {
      const title = tabName.charAt(0).toUpperCase() + tabName.slice(1).replace(/-/g, ' ');
      return `
        <div class="sider-${tabName}-container" id="sider-${tabName}-container">
          <div class="sider-${tabName}-content">
            <h2>${title}</h2>
            <p>This is the ${title} tab. Content coming soon.</p>
          </div>
        </div>
      `;
    },
    
    // Initialize tab
    init: async function(tabName, containerId) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
      }
      
      // Hide all other tab containers
      this.hideAllTabs();
      
      // Load and inject HTML
      const html = await this.loadHTML(tabName);
      container.innerHTML = html;
      container.style.display = 'block';
      
      // Initialize tab-specific functionality
      if (window[`Sider${this.capitalize(tabName)}Tab`]) {
        const tabComponent = window[`Sider${this.capitalize(tabName)}Tab`];
        if (tabComponent.init) {
          await tabComponent.init();
        }
      }
    },
    
    // Hide all tab containers
    hideAllTabs: function() {
      const tabContainers = [
        'sider-chat-tab-container',
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
    },
    
    // Capitalize first letter
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
  };
})();

