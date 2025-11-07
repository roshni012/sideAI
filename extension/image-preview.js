(function() {
  'use strict';

  let imageOverlays = new Map();
  let currentMenu = null;
  let currentSubMenu = null;
  let observedImages = new Set();
  let isMenuHovered = false;

  const MENU_ITEMS = [
    { id: 'chat-image', label: 'Chat with Image', icon: chrome.runtime.getURL('svg/chat-left.svg'), isSvg: true, action: 'chat' },
    { id: 'extract-text', label: 'Extract Text', icon: chrome.runtime.getURL('svg/upc-scan.svg'), isSvg: true, action: 'extract' },
    { 
      id: 'image-tools', 
      label: 'Image Tools', 
      icon: chrome.runtime.getURL('svg/brush.svg'), 
      isSvg: true,
      action: 'tools',
      hasSubmenu: true
    },
    { id: 'save-wisebase', label: 'Save to Wisebase', icon: chrome.runtime.getURL('svg/save.svg'), isSvg: true, action: 'save' }
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


  function createOverlay(img) {
    if (imageOverlays.has(img)) return imageOverlays.get(img);

    const overlay = document.createElement('div');
    overlay.className = 'sider-image-overlay';
    overlay.innerHTML = `
      <button class="sider-ai-tools-btn" title="AI Tools">
        <img src="${chrome.runtime.getURL('icons/sider_logo.png')}" alt="AI Tools" class="sider-ai-tools-icon">
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
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.2s ease';

    imageOverlays.set(img, overlay);
    attachOverlayListeners(overlay, img);
    attachImageHoverListeners(img, overlay);
    return overlay;
  }
  
  function attachImageHoverListeners(img, overlay) {
    img.addEventListener('mouseenter', () => {
      if (overlay && overlay.parentNode) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
    });
    
    // Hide overlay when mouse leaves image
    img.addEventListener('mouseleave', (e) => {
      // Don't hide if moving to overlay or menu
      if (overlay && overlay.parentNode) {
        const relatedTarget = e.relatedTarget;
        if (!overlay.contains(relatedTarget) && 
            !currentMenu?.contains(relatedTarget) && 
            !currentSubMenu?.contains(relatedTarget)) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          hideMenu();
        }
      }
    });
    
    // Also handle when leaving overlay itself
    overlay.addEventListener('mouseleave', (e) => {
      const relatedTarget = e.relatedTarget;
      // Don't hide if moving to menu or back to image
      if (!img.contains(relatedTarget) && 
          !currentMenu?.contains(relatedTarget) && 
          !currentSubMenu?.contains(relatedTarget)) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        hideMenu();
      }
    });
  }

  function attachOverlayListeners(overlay, img) {
    try {
      const aiToolsBtn = overlay.querySelector('.sider-ai-tools-btn');
      const closeBtn = overlay.querySelector('.sider-image-close-btn');

      if (!aiToolsBtn) {
        return;
      }

      // Show menu on hover over the overlay or AI Tools button
      let menuTimeout;
    
    const showMenuOnHover = () => {
      clearTimeout(menuTimeout);
      try {
        menuTimeout = setTimeout(() => {
          try {
            showMenu(overlay, img);
          } catch (err) {
            // Error in showMenuOnHover
          }
        }, 50); // Reduced delay for faster response
      } catch (err) {
        // Error setting menu timeout
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
      overlay.style.pointerEvents = 'auto';
      showMenuOnHover();
    });

    overlay.addEventListener('mouseleave', (e) => {
      if (!currentMenu?.contains(e.relatedTarget) && 
          !currentSubMenu?.contains(e.relatedTarget) &&
          !img.contains(e.relatedTarget)) {
        isMenuHovered = false;
        hideMenuOnLeave();
      }
    });

      // Also show menu on hover over the AI Tools button specifically
      aiToolsBtn.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        showMenuOnHover();
      });

      // Also allow click to show menu (don't hide on click)
      aiToolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        clearTimeout(menuTimeout);
        // Always show menu on click, don't hide it
        try {
          showMenu(overlay, img);
          // Ensure menu is visible after creation
          setTimeout(() => {
            if (currentMenu && currentMenu.parentNode) {
              currentMenu.style.display = 'block';
              currentMenu.style.visibility = 'visible';
              currentMenu.style.opacity = '1';
              currentMenu.style.zIndex = '100001';
              
              // Check if menu is actually in viewport
              const rect = currentMenu.getBoundingClientRect();
              const inViewport = rect.top >= 0 && rect.left >= 0 && 
                                rect.bottom <= window.innerHeight && 
                                rect.right <= window.innerWidth;
              
              
              // If menu is off-screen, adjust position
              if (!inViewport) {
                const overlayRect = overlay.getBoundingClientRect();
                const menuTop = overlayRect.bottom + window.scrollY + 5;
                const menuLeft = overlayRect.left + window.scrollX;
                currentMenu.style.top = `${menuTop}px`;
                currentMenu.style.left = `${menuLeft}px`;
              }
            }
          }, 50);
        } catch (err) {
          // Error in click handler
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
      // Error in attachOverlayListeners
    }
  }

  function getSidebarInfo() {
    const sidebar = document.querySelector('#sider-ai-chat-panel.sider-panel-open');
    if (!sidebar) {
      return { isOpen: false, width: 0 };
    }
    const sidebarRect = sidebar.getBoundingClientRect();
    return { 
      isOpen: true, 
      width: sidebarRect.width || (window.innerWidth <= 768 ? window.innerWidth : window.innerWidth <= 1024 ? 320 : 380),
      left: sidebarRect.left
    };
  }

  function showMenu(overlay, img) {
    try {
      // If menu already exists and is visible, ensure it's shown
      if (currentMenu && currentMenu.parentNode && currentMenu.style.display !== 'none') {
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
        <span class="sider-menu-icon ${item.isSvg ? 'sider-menu-icon-svg' : ''}">${item.isSvg ? `<img src="${item.icon}" alt="" class="sider-menu-svg-icon">` : item.icon}</span>
        <span class="sider-menu-label">${item.label}</span>
        ${item.hasSubmenu ? '<span class="sider-menu-arrow">›</span>' : ''}
      </div>
    `).join('');

    const overlayRect = overlay.getBoundingClientRect();
    const sidebarInfo = getSidebarInfo();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available width (considering sidebar if open)
    const availableWidth = sidebarInfo.isOpen 
      ? sidebarInfo.left - 20  // Available space up to sidebar minus padding
      : viewportWidth - 40;
    
    // Calculate responsive menu width
    // When sidebar is open, reduce menu width to fit available space
    const baseMenuWidth = 180;
    const menuWidth = sidebarInfo.isOpen
      ? Math.min(baseMenuWidth, Math.max(150, availableWidth))  // Min 150px when sidebar open
      : Math.min(baseMenuWidth, availableWidth);
    
    menu.style.position = 'fixed';
    menu.style.zIndex = '100001';
    menu.style.display = 'block';
    menu.style.visibility = 'visible';
    menu.style.opacity = '1';
    menu.style.pointerEvents = 'auto';
    menu.style.width = `${menuWidth}px`;
    menu.style.minWidth = `${Math.min(menuWidth, 150)}px`;
    menu.style.maxWidth = `${menuWidth}px`;
    // Use !important to override CSS defaults when sidebar is open
    if (sidebarInfo.isOpen) {
      menu.style.setProperty('width', `${menuWidth}px`, 'important');
      menu.style.setProperty('min-width', `${Math.min(menuWidth, 150)}px`, 'important');
      menu.style.setProperty('max-width', `${menuWidth}px`, 'important');
    }
    
    // Use viewport coordinates (not scroll-adjusted) for fixed positioning
    let menuTop = overlayRect.bottom + 5;  // Relative to viewport
    let menuLeft = overlayRect.left;       // Relative to viewport
    
    const menuHeight = MENU_ITEMS.length * 40 + 12; // Approximate height
    
    // Adjust horizontal position (viewport-relative, accounting for sidebar)
    const maxRight = sidebarInfo.isOpen 
      ? sidebarInfo.left - 10  // Leave gap before sidebar
      : viewportWidth - 10;
    
    if (menuLeft + menuWidth > maxRight) {
      // Try positioning to the left of overlay
      const leftPosition = overlayRect.right - menuWidth;
      if (leftPosition >= 10) {
        menuLeft = leftPosition;
      } else {
        // Position as far left as possible
        menuLeft = Math.max(10, maxRight - menuWidth);
      }
    }
    if (menuLeft < 10) {
      menuLeft = 10;
    }
    
    // Ensure menu doesn't overlap with sidebar
    if (sidebarInfo.isOpen && menuLeft + menuWidth > sidebarInfo.left - 5) {
      menuLeft = Math.max(10, sidebarInfo.left - menuWidth - 10);
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
    

    attachMenuListeners(menu, overlay, img);
    
    // Keep menu visible when hovering over it
    let menuHoverTimeout;
    menu.addEventListener('mouseenter', () => {
      menu.style.display = 'block';
      menu.style.visibility = 'visible';
      menu.style.opacity = '1';
      isMenuHovered = true;
      clearTimeout(menuHoverTimeout);
      if (overlay && overlay.parentNode) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
    });

    menu.addEventListener('mouseleave', (e) => {
      isMenuHovered = false;
      const relatedTarget = e.relatedTarget;
      if (!currentSubMenu?.contains(relatedTarget) && 
          !overlay.contains(relatedTarget) &&
          !img.contains(relatedTarget)) {
        menuHoverTimeout = setTimeout(() => {
          if (!overlay.contains(relatedTarget) && 
              !currentSubMenu?.contains(relatedTarget) &&
              !img.contains(relatedTarget)) {
            hideMenu();
            if (overlay && overlay.parentNode) {
              overlay.style.opacity = '0';
              overlay.style.pointerEvents = 'none';
            }
          }
        }, 200);
      }
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', onClickOutside, true);
    }, 0);

    
    // Double-check visibility after a brief delay
    setTimeout(() => {
      if (currentMenu && currentMenu.parentNode) {
        const computed = window.getComputedStyle(currentMenu);
        
        // Force visibility if still not showing
        if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
          currentMenu.style.display = 'block';
          currentMenu.style.visibility = 'visible';
          currentMenu.style.opacity = '1';
          currentMenu.style.zIndex = '100001';
        }
      }
    }, 50);
    } catch (err) {
      // Error in showMenu
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
    const sidebarInfo = getSidebarInfo();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available width (considering sidebar if open)
    const availableWidth = sidebarInfo.isOpen 
      ? sidebarInfo.left - 20  // Available space up to sidebar minus padding
      : viewportWidth - 40;
    
    // Calculate responsive submenu width
    // When sidebar is open, reduce submenu width to fit available space
    const baseSubMenuWidth = 180;
    const subMenuWidth = sidebarInfo.isOpen
      ? Math.min(baseSubMenuWidth, Math.max(150, availableWidth))  // Min 150px when sidebar open
      : Math.min(baseSubMenuWidth, availableWidth);
    
    subMenu.style.position = 'fixed';
    subMenu.style.width = `${subMenuWidth}px`;
    subMenu.style.minWidth = `${Math.min(subMenuWidth, 150)}px`;
    subMenu.style.maxWidth = `${subMenuWidth}px`;
    // Use !important to override CSS defaults when sidebar is open
    if (sidebarInfo.isOpen) {
      subMenu.style.setProperty('width', `${subMenuWidth}px`, 'important');
      subMenu.style.setProperty('min-width', `${Math.min(subMenuWidth, 150)}px`, 'important');
      subMenu.style.setProperty('max-width', `${subMenuWidth}px`, 'important');
    }
    
    let subMenuTop = menuRect.top;
    // Use viewport coordinates (not scroll-adjusted) for fixed positioning
    let subMenuLeft = menuRect.right + 5;
    
    const subMenuHeight = IMAGE_TOOLS_SUBMENU.length * 40 + 12;
    
    // Calculate max right position (accounting for sidebar)
    const maxRight = sidebarInfo.isOpen 
      ? sidebarInfo.left - 10  // Leave gap before sidebar
      : viewportWidth - 10;
    
    // Adjust horizontal position
    if (subMenuLeft + subMenuWidth > maxRight) {
      // Show submenu to the left instead
      subMenuLeft = Math.max(10, menuRect.left - subMenuWidth - 5);
    }
    if (subMenuLeft < 10) {
      subMenuLeft = 10;
    }
    
    // Ensure submenu doesn't overlap with sidebar
    if (sidebarInfo.isOpen && subMenuLeft + subMenuWidth > sidebarInfo.left - 5) {
      subMenuLeft = Math.max(10, sidebarInfo.left - subMenuWidth - 10);
    }
    
    // Adjust vertical position (viewport-relative)
    if (subMenuTop + subMenuHeight > viewportHeight) {
      subMenuTop = Math.max(10, viewportHeight - subMenuHeight - 10);
    }
    if (subMenuTop < 10) {
      subMenuTop = 10;
    }
    
    subMenu.style.top = `${subMenuTop}px`;
    subMenu.style.left = `${subMenuLeft}px`;
    subMenu.style.zIndex = '100002';

    document.body.appendChild(subMenu);
    currentSubMenu = subMenu;
    subMenu.addEventListener('mouseenter', () => {
      if (overlay && overlay.parentNode) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
      if (currentSubMenu && currentSubMenu.parentNode) {
        currentSubMenu.style.display = 'block';
        currentSubMenu.style.visibility = 'visible';
        currentSubMenu.style.opacity = '1';
      }
    });

    subMenu.addEventListener('mouseleave', (e) => {
      const relatedTarget = e.relatedTarget;
      if (!currentMenu?.contains(relatedTarget) && 
          !overlay.contains(relatedTarget) &&
          !img.contains(relatedTarget)) {
        setTimeout(() => {
          if (!currentMenu?.contains(relatedTarget) && 
              !overlay.contains(relatedTarget) &&
              !img.contains(relatedTarget)) {
            if (currentSubMenu) {
              currentSubMenu.remove();
              currentSubMenu = null;
            }
          }
        }, 200);
      }
    });

    attachSubMenuListeners(subMenu, img);
  }

  function attachMenuListeners(menu, overlay, img) {
    const menuItems = menu.querySelectorAll('.sider-menu-item');
    let subMenuTimeout;
    
    menuItems.forEach(item => {
      const id = item.getAttribute('data-id');
      const action = item.getAttribute('data-action');
      if (id === 'image-tools') {
        item.addEventListener('mouseenter', () => {
          clearTimeout(subMenuTimeout);
          subMenuTimeout = setTimeout(() => {
            showSubMenu(item, overlay, img);
          }, 150); // Small delay to prevent accidental triggers
        });
        
        item.addEventListener('mouseleave', (e) => {
          clearTimeout(subMenuTimeout);
          const relatedTarget = e.relatedTarget;
          if (!currentSubMenu?.contains(relatedTarget) && 
              !currentMenu?.contains(relatedTarget)) {
            subMenuTimeout = setTimeout(() => {
              if (currentSubMenu && 
                  !currentSubMenu.matches(':hover') && 
                  !currentSubMenu.contains(relatedTarget)) {
                if (currentSubMenu) {
                  currentSubMenu.remove();
                  currentSubMenu = null;
                }
              }
            }, 200);
          }
        });
      }
    });
    
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.sider-menu-item');
      if (!item) return;

      const action = item.getAttribute('data-action');
      const id = item.getAttribute('data-id');

      if (id === 'image-tools') {
        return;
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
      imageOverlays.forEach((overlay) => {
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
        }
      });
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
        // Convert image to data URL if it's not already
        if (imgSrc.startsWith('data:')) {
          // Already a data URL, send directly
          chrome.runtime.sendMessage({
            type: 'CHAT_WITH_IMAGE',
            dataUrl: imgSrc,
            alt: imgAlt
          });
        } else {
          // Need to convert to data URL
          convertImageToDataUrl(imgSrc).then(dataUrl => {
            chrome.runtime.sendMessage({
              type: 'CHAT_WITH_IMAGE',
              dataUrl: dataUrl,
              alt: imgAlt
            });
          }).catch(err => {
            console.error('Error converting image to data URL:', err);
            // Fallback: send the URL and let side panel handle it
            chrome.runtime.sendMessage({
              type: 'CHAT_WITH_IMAGE',
              imageUrl: imgSrc,
              alt: imgAlt
            });
          });
        }
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
  
  // Helper function to convert image URL to data URL
  function convertImageToDataUrl(url) {
    return new Promise((resolve, reject) => {
      // Handle CORS issues by using fetch if possible
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // Fallback: try using an image element
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function() {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = reject;
          img.src = url;
        });
    });
  }

  function handleImageToolAction(tool, img) {
    const imgSrc = img.src || img.currentSrc || img.dataset.src;
    const imgAlt = img.alt || 'Image';

    chrome.storage.sync.get(['sider_app_base_url'], (result) => {
      const baseUrl = result.sider_app_base_url || 'http://localhost:3000';
      const params = new URLSearchParams({
        tool: tool,
        imageUrl: imgSrc,
        imageAlt: imgAlt || 'Image'
      });
      const url = `${baseUrl}/image-tool?${params.toString()}`;
      window.open(url, '_blank');
    });
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

        // Skip images inside sider-input-area (extension's input area)
        const inputArea = img.closest('.sider-input-area');
        if (inputArea) return;
        
        // Skip images in sider-attachments (attachment previews)
        const attachments = img.closest('.sider-attachments');
        if (attachments) return;
        
        // Skip images in sider-image-preview-section (image preview section)
        const imagePreview = img.closest('.sider-image-preview-section');
        if (imagePreview) return;
        
        // Skip images inside sider-ai-chat-panel (entire extension panel)
        const chatPanel = img.closest('#sider-ai-chat-panel');
        if (chatPanel) return;

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

        const overlay = createOverlay(img);
        if (overlay) {
          overlay.style.display = 'flex';
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
        }
      } catch (e) {
        // Silently fail if there's an issue
        // Error processing image
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

    // Cleanup function to remove overlays for images inside extension panel
    const cleanupExtensionPanelOverlays = () => {
      imageOverlays.forEach((overlay, img) => {
        if (!img.isConnected) return;
        
        const inputArea = img.closest('.sider-input-area');
        const attachments = img.closest('.sider-attachments');
        const imagePreview = img.closest('.sider-image-preview-section');
        const chatPanel = img.closest('#sider-ai-chat-panel');
        
        if (inputArea || attachments || imagePreview || chatPanel) {
          hideOverlay(img);
        }
      });
    };

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
            
            // Cleanup overlays if extension panel elements are added
            if (node.matches && (
              node.matches('.sider-input-area') ||
              node.matches('.sider-attachments') ||
              node.matches('.sider-image-preview-section') ||
              node.matches('#sider-ai-chat-panel') ||
              node.querySelector('.sider-input-area, .sider-attachments, .sider-image-preview-section, #sider-ai-chat-panel')
            )) {
              cleanupExtensionPanelOverlays();
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

