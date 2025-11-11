(function() {
  'use strict';
  
  const GrammarTab = {
    init: async function() {
      console.log('Grammar tab initialized');
    },
    
    switchToGrammar: function() {
      const container = document.getElementById('sider-grammar-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderGrammarTab = GrammarTab;
})();

