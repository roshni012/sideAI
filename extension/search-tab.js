(function() {
  'use strict';
  
  const SearchTab = {
    init: async function() {
      console.log('Search tab initialized');
    },
    
    switchToSearch: function() {
      const container = document.getElementById('sider-search-tab-container');
      if (container) container.style.display = 'block';
    }
  };
  
  window.SiderSearchTab = SearchTab;
})();

