(function() {
  'use strict';
  
  const AskTab = {
    init: async function() {
      console.log('Ask tab initialized');
    },
    
    switchToAsk: function() {
      const container = document.getElementById('sider-ask-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderAskTab = AskTab;
})();

