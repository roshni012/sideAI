(function() {
  'use strict';

  let imageOverlays = new Map();
  let currentMenu = null;
  let currentSubMenu = null;
  let observedImages = new Set();
  let isMenuHovered = false;

  const MENU_ITEMS = [
    { id: 'chat-image', label: 'Chat with Image', icon: '💬', action: 'chat' },
    { id: 'extract-text', label: 'Extract Text', icon: '↔️', action: 'extract' },
    { 
      id: 'image-tools', 
      label: 'Image Tools', 
      icon: '🖌️', 
      action: 'tools',
      hasSubmenu: true
    },
    { id: 'save-wisebase', label: 'Save to Wisebase', icon: '📚', action: 'save' }
  ];

  const IMAGE_TOOLS_SUBMENU = [
    { id: 'bg-remover', label: 'Background Remover', icon: '▭' },
    { id: 'text-remover', label: 'Text Remover', icon: '▭T' },
    { id: 'inpaint', label: 'Inpaint', icon: '🖌️' },
    { id: 'photo-eraser', label: 'Photo Eraser', icon: '🖌️' },
    { id: 'bg-changer', label: 'Background Changer', icon: '▭▭' },
    { id: 'upscaler', label: 'Image Upscaler', icon: '⬆️' },
    { id: 'variations', label: 'Create Variations', icon: '✨' }
  ];

  function createBrainIcon() {
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <!-- Brain outline - top view with two hemispheres -->
        <path d="M12 3C8.5 3 6 5.5 6 9C6 10 6.2 11 6.5 12C5.5 12.5 4.5 13.5 4.5 15C4.5 16.5 5.5 17.5 7 18C7 18.8 7.2 19.5 7.5 20C6.5 20.5 6 21.5 6 22.5C6 23.3 6.7 24 7.5 24C8.3 24 9 23.3 9 22.5C9 22 9.2 21.5 9.5 21C10.5 21.5 11.5 21.5 12.5 21C12.8 21.5 13 22 13 22.5C13 23.3 13.7 24 14.5 24C15.3 24 16 23.3 16 22.5C16 21.5 15.5 20.5 14.5 20C14.8 19.5 15 18.8 15 18C16.5 17.5 17.5 16.5 17.5 15C17.5 13.5 16.5 12.5 15.5 12C15.8 11 16 10 16 9C16 5.5 13.5 3 12 3Z" 
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
              fill="none"/>
        <!-- Central dividing line -->
        <path d="M12 5V19" 
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Left hemisphere brain folds -->
        <path d="M8 8C8 9 8.5 9.5 9 10" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
        <path d="M7 12C7 13 7.5 13.5 8 14" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
        <path d="M8 16C8 17 8.5 17.5 9 18" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
        <!-- Right hemisphere brain folds -->
        <path d="M16 8C16 9 15.5 9.5 15 10" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
        <path d="M17 12C17 13 16.5 13.5 16 14" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
        <path d="M16 16C16 17 15.5 17.5 15 18" 
              stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
      </svg>
    `;
    return svg;
  }

  function createOverlay(img) {
    if (imageOverlays.has(img)) return imageOverlays.get(img);

    const overlay = document.createElement('div');
    overlay.className = 'sider-image-overlay';
    overlay.innerHTML = `
      <button class="sider-ai-tools-btn" title="AI Tools">
        ${createBrainIcon()}
        <span class="sider-ai-tools-text">AI Tools</span>
      </button>
      <button class="sider-image-close-btn" title="Close">✕</button>
    `;

    // Create a wrapper container for the image if needed
    let wrapper = img.parentElement;
    
    // Ensure the image or its parent has relative positioning
    const imgStyle = window.getComputedStyle(img);
    if (imgStyle.position === 'static') {
      img.style.position = 'relative';
    }
    
    // If parent is static, wrap the image
    if (wrapper && window.getComputedStyle(wrapper).position === 'static') {
      const newWrapper = document.createElement('div');
      newWrapper.style.position = 'relative';
      newWrapper.style.display = 'inline-block';
      wrapper.insertBefore(newWrapper, img);
      newWrapper.appendChild(img);
      wrapper = newWrapper;
    }
    
    // Insert overlay as sibling or append to wrapper
    if (wrapper) {
      wrapper.appendChild(overlay);
    } else {
      img.parentElement.appendChild(overlay);
    }

    overlay.style.position = 'absolute';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.zIndex = '100000';

    imageOverlays.set(img, overlay);
    attachOverlayListeners(overlay, img);
    return overlay;
  }

  function attachOverlayListeners(overlay, img) {
    try {
      console.log('attachOverlayListeners called', { overlay, img, overlayHTML: overlay.innerHTML.substring(0, 200) });
      
      const aiToolsBtn = overlay.querySelector('.sider-ai-tools-btn');
      const closeBtn = overlay.querySelector('.sider-image-close-btn');
      
      console.log('Found buttons:', { aiToolsBtn: !!aiToolsBtn, closeBtn: !!closeBtn });

      if (!aiToolsBtn) {
        console.error('AI Tools button not found in overlay!', overlay.innerHTML);
        return;
      }

      // Show menu on hover over the overlay or AI Tools button
      let menuTimeout;
    
    const showMenuOnHover = () => {
      clearTimeout(menuTimeout);
      try {
        menuTimeout = setTimeout(() => {
          try {
            console.log('showMenuOnHover called for image:', img);
            showMenu(overlay, img);
          } catch (err) {
            console.error('Error in showMenuOnHover:', err);
          }
        }, 50); // Reduced delay for faster response
      } catch (err) {
        console.error('Error setting menu timeout:', err);
      }
    };

    const hideMenuOnLeave = () => {
      clearTimeout(menuTimeout);
      menuTimeout = setTimeout(() => {
        if (!isMenuHovered && !overlay.matches(':hover')) {
          hideMenu();
        }
      }, 200);
    };

    // Show menu when hovering over overlay
    overlay.addEventListener('mouseenter', () => {
      overlay.style.opacity = '1';
      showMenuOnHover();
    });

    overlay.addEventListener('mouseleave', (e) => {
      // Only reduce opacity if not moving to menu
      if (!currentMenu?.contains(e.relatedTarget) && 
          !currentSubMenu?.contains(e.relatedTarget)) {
        overlay.style.opacity = '0.9';
        isMenuHovered = false;
        hideMenuOnLeave();
      }
    });

      // Also show menu on hover over the AI Tools button specifically
      aiToolsBtn.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        console.log('AI Tools button mouseenter');
        showMenuOnHover();
      });

      // Also allow click to show menu (don't hide on click)
      aiToolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('AI Tools button clicked');
        clearTimeout(menuTimeout);
        // Always show menu on click, don't hide it
        try {
          console.log('Showing menu on click');
          showMenu(overlay, img);
          // Ensure menu is visible after creation
          setTimeout(() => {
            if (currentMenu && currentMenu.parentNode) {
              console.log('Forcing menu visibility after click');
              currentMenu.style.display = 'block';
              currentMenu.style.visibility = 'visible';
              currentMenu.style.opacity = '1';
              currentMenu.style.zIndex = '100001';
              
              // Check if menu is actually in viewport
              const rect = currentMenu.getBoundingClientRect();
              const inViewport = rect.top >= 0 && rect.left >= 0 && 
                                rect.bottom <= window.innerHeight && 
                                rect.right <= window.innerWidth;
              
              console.log('Menu state:', {
                display: currentMenu.style.display,
                visibility: currentMenu.style.visibility,
                opacity: currentMenu.style.opacity,
                zIndex: currentMenu.style.zIndex,
                parent: currentMenu.parentNode,
                computed: window.getComputedStyle(currentMenu).display,
                rect: rect,
                inViewport: inViewport,
                viewport: { width: window.innerWidth, height: window.innerHeight }
              });
              
              // If menu is off-screen, adjust position
              if (!inViewport) {
                console.warn('Menu is off-screen, adjusting position');
                const overlayRect = overlay.getBoundingClientRect();
                const menuTop = overlayRect.bottom + window.scrollY + 5;
                const menuLeft = overlayRect.left + window.scrollX;
                currentMenu.style.top = `${menuTop}px`;
                currentMenu.style.left = `${menuLeft}px`;
                console.log('Menu repositioned to:', menuTop, menuLeft);
              }
            } else {
              console.error('currentMenu is null or not in DOM after showMenu call!');
            }
          }, 50);
        } catch (err) {
          console.error('Error in click handler:', err);
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          clearTimeout(menuTimeout);
          hideOverlay(img);
        });
      }
    } catch (err) {
      console.error('Error in attachOverlayListeners:', err, err.stack);
    }
  }

  function showMenu(overlay, img) {
    try {
      console.log('showMenu called', { overlay, img, currentMenu: currentMenu?.parentNode ? 'exists' : 'none' });
      
      // If menu already exists and is visible, ensure it's shown
      if (currentMenu && currentMenu.parentNode && currentMenu.style.display !== 'none') {
        console.log('Menu already exists, making visible');
        currentMenu.style.display = 'block';
        currentMenu.style.visibility = 'visible';
        currentMenu.style.opacity = '1';
        return;
      }

      hideMenu(); // Close any existing menu

    const menu = document.createElement('div');
    menu.className = 'sider-image-menu';
    menu.innerHTML = MENU_ITEMS.map(item => `
      <div class="sider-menu-item ${item.hasSubmenu ? 'has-submenu' : ''}" 
           data-action="${item.action}" 
           data-id="${item.id}">
        <span class="sider-menu-icon">${item.icon}</span>
        <span class="sider-menu-label">${item.label}</span>
        ${item.hasSubmenu ? '<span class="sider-menu-arrow">›</span>' : ''}
      </div>
    `).join('');

    const overlayRect = overlay.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    menu.style.position = 'fixed';
    menu.style.zIndex = '100001';
    menu.style.display = 'block';
    menu.style.visibility = 'visible';
    menu.style.opacity = '1';
    menu.style.pointerEvents = 'auto';
    
    // Use viewport coordinates (not scroll-adjusted) for fixed positioning
    let menuTop = overlayRect.bottom + 5;  // Relative to viewport
    let menuLeft = overlayRect.left;       // Relative to viewport
    
    // Adjust if menu would overflow viewport (responsive)
    const menuWidth = Math.min(180, viewportWidth - 40);
    const menuHeight = MENU_ITEMS.length * 40 + 12; // Approximate height
    
    // Adjust horizontal position (viewport-relative)
    if (menuLeft + menuWidth > viewportWidth) {
      menuLeft = Math.max(10, viewportWidth - menuWidth - 10);
    }
    if (menuLeft < 10) {
      menuLeft = 10;
    }
    
    // Adjust vertical position (viewport-relative)
    if (menuTop + menuHeight > viewportHeight) {
      // Show menu above overlay instead
      menuTop = overlayRect.top - menuHeight - 5;
    }
    if (menuTop < 10) {
      menuTop = 10;
    }
    
    // For fixed positioning, use viewport coordinates (not scroll-adjusted)
    menu.style.top = `${menuTop}px`;
    menu.style.left = `${menuLeft}px`;

    // Append to body first to get accurate dimensions
    document.body.appendChild(menu);
    currentMenu = menu;

    // Force a reflow to ensure menu is rendered
    menu.offsetHeight;
    
    // Verify menu is actually visible and in viewport
    const menuRect = menu.getBoundingClientRect();
    const isVisible = menuRect.width > 0 && menuRect.height > 0;
    const inViewport = menuRect.top >= 0 && menuRect.left >= 0 && 
                      menuRect.bottom <= window.innerHeight && 
                      menuRect.right <= window.innerWidth;
    
    console.log('Menu position verification:', {
      menuRect,
      isVisible,
      inViewport,
      scrollY: window.scrollY,
      scrollX: window.scrollX
    });

    attachMenuListeners(menu, overlay, img);
    
    // Keep menu visible when hovering over it
    let menuHoverTimeout;
    menu.addEventListener('mouseenter', () => {
      menu.style.display = 'block';
      menu.style.visibility = 'visible';
      menu.style.opacity = '1';
      isMenuHovered = true;
      clearTimeout(menuHoverTimeout);
    });

    menu.addEventListener('mouseleave', (e) => {
      // Hide menu when leaving, unless moving to submenu or overlay
      isMenuHovered = false;
      if (!currentSubMenu?.contains(e.relatedTarget) && 
          !overlay.contains(e.relatedTarget) &&
          !overlay.matches(':hover')) {
        menuHoverTimeout = setTimeout(() => {
          if (!overlay.contains(e.relatedTarget) && 
              !currentSubMenu?.contains(e.relatedTarget) &&
              !overlay.matches(':hover')) {
            hideMenu();
          }
        }, 200);
      }
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', onClickOutside, true);
    }, 0);

    // Debug: log menu creation
    console.log('Menu created and appended', {
      top: menuTop,
      left: menuLeft,
      width: menuWidth,
      display: menu.style.display,
      zIndex: menu.style.zIndex,
      element: menu,
      parent: menu.parentNode,
      computedStyle: window.getComputedStyle(menu)
    });
    
    // Double-check visibility after a brief delay
    setTimeout(() => {
      if (currentMenu && currentMenu.parentNode) {
        const computed = window.getComputedStyle(currentMenu);
        console.log('Menu visibility check:', {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          top: currentMenu.style.top,
          left: currentMenu.style.left
        });
        
        // Force visibility if still not showing
        if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
          console.warn('Menu not visible, forcing visibility');
          currentMenu.style.display = 'block';
          currentMenu.style.visibility = 'visible';
          currentMenu.style.opacity = '1';
          currentMenu.style.zIndex = '100001';
        }
      }
    }, 50);
    } catch (err) {
      console.error('Error in showMenu:', err, err.stack);
    }
  }

  function showSubMenu(parentItem, overlay, img) {
    if (currentSubMenu) {
      currentSubMenu.remove();
    }

    const subMenu = document.createElement('div');
    subMenu.className = 'sider-image-submenu';
    subMenu.innerHTML = IMAGE_TOOLS_SUBMENU.map(item => `
      <div class="sider-menu-item" data-action="image-tool" data-tool="${item.id}">
        <span class="sider-menu-icon">${item.icon}</span>
        <span class="sider-menu-label">${item.label}</span>
      </div>
    `).join('');

    const menuRect = currentMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    subMenu.style.position = 'fixed';
    let subMenuTop = menuRect.top;
    let subMenuLeft = menuRect.right + window.scrollX + 5;
    
    // Adjust if submenu would overflow viewport (responsive)
    const subMenuWidth = Math.min(180, viewportWidth - 40);
    const subMenuHeight = IMAGE_TOOLS_SUBMENU.length * 40 + 12;
    
    // Adjust horizontal position
    if (subMenuLeft + subMenuWidth > viewportWidth) {
      // Show submenu to the left instead
      subMenuLeft = Math.max(10, menuRect.left + window.scrollX - subMenuWidth - 5);
    }
    if (subMenuLeft < 10) {
      subMenuLeft = 10;
    }
    
    // Adjust vertical position
    if (subMenuTop + subMenuHeight > viewportHeight + window.scrollY) {
      subMenuTop = Math.max(10, viewportHeight + window.scrollY - subMenuHeight - 10);
    }
    if (subMenuTop < 10) {
      subMenuTop = 10;
    }
    
    subMenu.style.top = `${subMenuTop}px`;
    subMenu.style.left = `${subMenuLeft}px`;
    subMenu.style.zIndex = '100002';

    document.body.appendChild(subMenu);
    currentSubMenu = subMenu;

    attachSubMenuListeners(subMenu, img);
  }

  function attachMenuListeners(menu, overlay, img) {
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.sider-menu-item');
      if (!item) return;

      const action = item.getAttribute('data-action');
      const id = item.getAttribute('data-id');

      if (id === 'image-tools') {
        showSubMenu(item, overlay, img);
      } else {
        handleMenuAction(action, img);
        hideMenu();
        // Remove focus from any active element
        if (document.activeElement) {
          document.activeElement.blur();
        }
        // Remove focus from window
        window.getSelection()?.removeAllRanges();
      }
    });
  }

  function attachSubMenuListeners(subMenu, img) {
    subMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.sider-menu-item');
      if (!item) return;

      const tool = item.getAttribute('data-tool');
      handleImageToolAction(tool, img);
      hideMenu();
      // Remove focus from any active element
      if (document.activeElement) {
        document.activeElement.blur();
      }
      // Remove focus from window
      window.getSelection()?.removeAllRanges();
    });
  }

  function onClickOutside(e) {
    if (currentMenu && !currentMenu.contains(e.target) && 
        (!currentSubMenu || !currentSubMenu.contains(e.target)) &&
        !e.target.closest('.sider-image-overlay') &&
        !e.target.closest('.sider-ai-tools-btn')) {
      hideMenu();
      document.removeEventListener('click', onClickOutside, true);
    }
  }

  function hideMenu() {
    if (currentSubMenu) {
      currentSubMenu.remove();
      currentSubMenu = null;
    }
    if (currentMenu) {
      currentMenu.remove();
      currentMenu = null;
    }
    document.removeEventListener('click', onClickOutside, true);
  }

  function handleMenuAction(action, img) {
    const imgSrc = img.src || img.currentSrc || img.dataset.src;
    const imgAlt = img.alt || 'Image';

    switch (action) {
      case 'chat':
        window.dispatchEvent(new CustomEvent('sider:chat-image', {
          detail: { src: imgSrc, alt: imgAlt, element: img }
        }));
        break;
      case 'extract':
        window.dispatchEvent(new CustomEvent('sider:extract-text', {
          detail: { src: imgSrc, element: img }
        }));
        break;
      case 'save':
        window.dispatchEvent(new CustomEvent('sider:save-wisebase', {
          detail: { src: imgSrc, alt: imgAlt, element: img }
        }));
        break;
    }
  }

  function handleImageToolAction(tool, img) {
    const imgSrc = img.src || img.currentSrc || img.dataset.src;
    const imgAlt = img.alt || 'Image';

    window.dispatchEvent(new CustomEvent('sider:image-tool', {
      detail: { tool, src: imgSrc, alt: imgAlt, element: img }
    }));
  }

  function hideOverlay(img) {
    const overlay = imageOverlays.get(img);
    if (overlay) {
      overlay.remove();
      imageOverlays.delete(img);
    }
    hideMenu();
  }

  function processImage(img) {
    if (observedImages.has(img)) return;
    observedImages.add(img);

    // Wait for image to be loaded/rendered
    const checkAndCreateOverlay = () => {
      try {
        // Check if image is actually visible in DOM
        if (!img.isConnected || !document.body.contains(img)) return;

        const rect = img.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(img);
        
        // Skip only if truly hidden
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' || 
            computedStyle.opacity === '0') {
          return;
        }

        // Skip only extremely small images (icons smaller than 30px)
        // Reduced threshold to show overlay on more images
        if (rect.width < 30 || rect.height < 30) return;

        // Skip SVG elements (but not SVG images loaded via <img src="file.svg">)
        if (img.tagName === 'svg') return;

        // Skip only if it's a data URI SVG or explicitly SVG
        if (img.src && (img.src.includes('.svg') || img.src.startsWith('data:image/svg+xml'))) {
          // Only skip if it's very small (likely an icon)
          if (rect.width < 40 || rect.height < 40) return;
        }

        // Create overlay immediately and make it visible
        const overlay = createOverlay(img);
        if (overlay) {
          overlay.style.display = 'flex';
          overlay.style.opacity = '1';
        }
      } catch (e) {
        // Silently fail if there's an issue
        console.debug('Error processing image:', e);
      }
    };

    // If image is already loaded, create overlay immediately
    if (img.complete && img.naturalWidth > 0) {
      checkAndCreateOverlay();
    } else {
      // Wait for image to load
      img.addEventListener('load', checkAndCreateOverlay, { once: true });
      img.addEventListener('error', () => {
        // Even on error, try to show overlay if dimensions are available
        checkAndCreateOverlay();
      }, { once: true });
      
      // Also check immediately in case image is already rendered
      setTimeout(checkAndCreateOverlay, 100);
    }
  }

  function initImagePreview() {
    // Process existing images with a slight delay to ensure DOM is ready
    const processExistingImages = () => {
      const allImages = document.querySelectorAll('img');
      allImages.forEach(img => {
        if (!observedImages.has(img)) {
          processImage(img);
        }
      });
    };

    // Process immediately
    processExistingImages();

    // Also process after a short delay to catch late-loading images
    setTimeout(processExistingImages, 500);
    setTimeout(processExistingImages, 1500);
    setTimeout(processExistingImages, 3000);

    // Watch for new images (SPA support)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Process if it's an image
            if (node.tagName === 'IMG') {
              processImage(node);
            }
            // Process all images within the added node
            if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              images.forEach(img => {
                if (!observedImages.has(img)) {
                  processImage(img);
                }
              });
            }
          }
        });
        
        // Also handle attribute changes (e.g., src changes)
        if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          if (mutation.attributeName === 'src' || mutation.attributeName === 'data-src') {
            if (!observedImages.has(mutation.target)) {
              processImage(mutation.target);
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src']
    });

    // Also watch for images that load via IntersectionObserver (lazy loading)
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.tagName === 'IMG') {
            if (!observedImages.has(entry.target)) {
              processImage(entry.target);
            }
          }
        });
      });

      // Observe all existing and new images
      document.querySelectorAll('img').forEach(img => {
        lazyImageObserver.observe(img);
      });

      // Re-observe when new images are added
      const lazyObserver = new MutationObserver(() => {
        document.querySelectorAll('img').forEach(img => {
          if (!observedImages.has(img)) {
            lazyImageObserver.observe(img);
          }
        });
      });

      lazyObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Re-process on scroll (for lazy-loaded images)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.querySelectorAll('img').forEach(img => {
          if (!observedImages.has(img)) {
            const rect = img.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              processImage(img);
            }
          }
        });
      }, 200);
    }, { passive: true });
  }

  // Expose API
  window.SiderImagePreview = {
    init: initImagePreview
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImagePreview);
  } else {
    initImagePreview();
  }
})();

