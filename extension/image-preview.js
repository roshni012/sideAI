(function () {
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
    {
      id: 'bg-remover',
      label: 'Background Remover',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
      isSvg: true
    },
    {
      id: 'text-remover',
      label: 'Text Remover',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
      isSvg: true
    },
    {
      id: 'inpaint',
      label: 'Inpaint',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
      isSvg: true
    },
    {
      id: 'photo-eraser',
      label: 'Photo Eraser',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>',
      isSvg: true
    },
    {
      id: 'bg-changer',
      label: 'Background Changer',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
      isSvg: true
    },
    {
      id: 'upscaler',
      label: 'Image Upscaler',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
      isSvg: true
    },
    {
      id: 'variations',
      label: 'Create Variations',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      isSvg: true
    }
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

      // Track mouse movement over menu to keep it open
      menu.addEventListener('mousemove', () => {
        isMenuHovered = true;
        clearTimeout(menuHoverTimeout);
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'auto';
        }
      });

      menu.addEventListener('mouseleave', (e) => {
        const relatedTarget = e.relatedTarget;
        // Don't close if moving to submenu, overlay, or image
        if (currentSubMenu?.contains(relatedTarget) ||
          overlay.contains(relatedTarget) ||
          img.contains(relatedTarget)) {
          isMenuHovered = true;
          return;
        }

        // Check if mouse is still over menu or submenu (with gap tolerance)
        const checkMousePosition = () => {
          const menuRect = currentMenu?.getBoundingClientRect();
          const subMenuRect = currentSubMenu?.getBoundingClientRect();
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const gapTolerance = 10; // Allow 10px gap between menu and submenu

          // Check if mouse is within menu bounds (with tolerance)
          const isOverMenu = menuRect &&
            mouseX >= menuRect.left - gapTolerance &&
            mouseX <= menuRect.right + gapTolerance &&
            mouseY >= menuRect.top - gapTolerance &&
            mouseY <= menuRect.bottom + gapTolerance;

          // Check if mouse is within submenu bounds (with tolerance)
          const isOverSubMenu = subMenuRect &&
            mouseX >= subMenuRect.left - gapTolerance &&
            mouseX <= subMenuRect.right + gapTolerance &&
            mouseY >= subMenuRect.top - gapTolerance &&
            mouseY <= subMenuRect.bottom + gapTolerance;

          // Check if mouse is in the gap between menu and submenu
          const isInGap = menuRect && subMenuRect && (
            (mouseX >= Math.min(menuRect.right, subMenuRect.left) - gapTolerance &&
              mouseX <= Math.max(menuRect.right, subMenuRect.left) + gapTolerance &&
              mouseY >= Math.min(menuRect.top, subMenuRect.top) - gapTolerance &&
              mouseY <= Math.max(menuRect.bottom, subMenuRect.bottom) + gapTolerance)
          );

          if (isOverMenu || isOverSubMenu || isInGap) {
            isMenuHovered = true;
            return;
          }

          isMenuHovered = false;
          menuHoverTimeout = setTimeout(() => {
            // Double check before closing
            if (!isMenuHovered &&
              !currentSubMenu?.matches(':hover') &&
              !currentMenu?.matches(':hover') &&
              !overlay.matches(':hover')) {
              hideMenu();
              if (overlay && overlay.parentNode) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
              }
            }
          }, 400);
        };

        // Use a small delay to allow mouse to move to submenu
        setTimeout(checkMousePosition, 100);
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
        <span class="sider-menu-icon ${item.isSvg ? 'sider-menu-icon-svg' : ''}">${item.isSvg ? item.icon : item.icon}</span>
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

    subMenu.addEventListener('mouseenter', () => {
      // Keep menu and submenu open when hovering over submenu
      if (currentMenu && currentMenu.parentNode) {
        currentMenu.style.display = 'block';
        currentMenu.style.visibility = 'visible';
        currentMenu.style.opacity = '1';
      }
      if (overlay && overlay.parentNode) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
      isMenuHovered = true;
    });

    // Track mouse movement over submenu to keep it open
    subMenu.addEventListener('mousemove', () => {
      isMenuHovered = true;
      if (currentMenu && currentMenu.parentNode) {
        currentMenu.style.display = 'block';
        currentMenu.style.visibility = 'visible';
        currentMenu.style.opacity = '1';
      }
      if (overlay && overlay.parentNode) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
    });

    subMenu.addEventListener('mouseleave', (e) => {
      const relatedTarget = e.relatedTarget;

      // Don't close if moving to menu, overlay, or image
      if (currentMenu?.contains(relatedTarget) ||
        overlay.contains(relatedTarget) ||
        img.contains(relatedTarget)) {
        return;
      }

      // Check if mouse is still over menu or submenu (with gap tolerance)
      const checkMousePosition = () => {
        const menuRect = currentMenu?.getBoundingClientRect();
        const subMenuRect = currentSubMenu?.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const gapTolerance = 10; // Allow 10px gap between menu and submenu

        // Check if mouse is within menu bounds (with tolerance)
        const isOverMenu = menuRect &&
          mouseX >= menuRect.left - gapTolerance &&
          mouseX <= menuRect.right + gapTolerance &&
          mouseY >= menuRect.top - gapTolerance &&
          mouseY <= menuRect.bottom + gapTolerance;

        // Check if mouse is within submenu bounds (with tolerance)
        const isOverSubMenu = subMenuRect &&
          mouseX >= subMenuRect.left - gapTolerance &&
          mouseX <= subMenuRect.right + gapTolerance &&
          mouseY >= subMenuRect.top - gapTolerance &&
          mouseY <= subMenuRect.bottom + gapTolerance;

        // Check if mouse is in the gap between menu and submenu
        const isInGap = menuRect && subMenuRect && (
          (mouseX >= Math.min(menuRect.right, subMenuRect.left) - gapTolerance &&
            mouseX <= Math.max(menuRect.right, subMenuRect.left) + gapTolerance &&
            mouseY >= Math.min(menuRect.top, subMenuRect.top) - gapTolerance &&
            mouseY <= Math.max(menuRect.bottom, subMenuRect.bottom) + gapTolerance)
        );

        if (isOverMenu || isOverSubMenu || isInGap) {
          return;
        }

        // Only close submenu if mouse is truly outside both
        setTimeout(() => {
          if (!currentMenu?.matches(':hover') &&
            !currentSubMenu?.matches(':hover') &&
            !overlay.matches(':hover')) {
            if (currentSubMenu) {
              currentSubMenu.remove();
              currentSubMenu = null;
            }
          }
        }, 400);
      };

      // Use a small delay to allow mouse to move to menu
      setTimeout(checkMousePosition, 100);
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

          // Don't close submenu if moving to it
          if (currentSubMenu?.contains(relatedTarget)) {
            return;
          }

          // Check if mouse is still over submenu (with gap tolerance)
          const checkMousePosition = () => {
            const subMenuRect = currentSubMenu?.getBoundingClientRect();
            const menuRect = currentMenu?.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const gapTolerance = 10; // Allow 10px gap between menu and submenu

            // Check if mouse is within submenu bounds (with tolerance)
            const isOverSubMenu = subMenuRect &&
              mouseX >= subMenuRect.left - gapTolerance &&
              mouseX <= subMenuRect.right + gapTolerance &&
              mouseY >= subMenuRect.top - gapTolerance &&
              mouseY <= subMenuRect.bottom + gapTolerance;

            // Check if mouse is within menu bounds (with tolerance)
            const isOverMenu = menuRect &&
              mouseX >= menuRect.left - gapTolerance &&
              mouseX <= menuRect.right + gapTolerance &&
              mouseY >= menuRect.top - gapTolerance &&
              mouseY <= menuRect.bottom + gapTolerance;

            // Check if mouse is in the gap between menu and submenu
            const isInGap = menuRect && subMenuRect && (
              (mouseX >= Math.min(menuRect.right, subMenuRect.left) - gapTolerance &&
                mouseX <= Math.max(menuRect.right, subMenuRect.left) + gapTolerance &&
                mouseY >= Math.min(menuRect.top, subMenuRect.top) - gapTolerance &&
                mouseY <= Math.max(menuRect.bottom, subMenuRect.bottom) + gapTolerance)
            );

            if (isOverSubMenu || isOverMenu || isInGap) {
              return;
            }

            subMenuTimeout = setTimeout(() => {
              // Double check before closing
              if (currentSubMenu &&
                !currentSubMenu.matches(':hover') &&
                !currentMenu?.matches(':hover')) {
                if (currentSubMenu) {
                  currentSubMenu.remove();
                  currentSubMenu = null;
                }
              }
            }, 400);
          };

          // Use a small delay to allow mouse to move to submenu
          setTimeout(checkMousePosition, 100);
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
        // Convert image to data URL if it's not already
        if (imgSrc.startsWith('data:')) {
          // Already a data URL, send directly
          chrome.runtime.sendMessage({
            type: 'EXTRACT_TEXT',
            dataUrl: imgSrc,
            alt: imgAlt
          });
        } else {
          // Need to convert to data URL
          convertImageToDataUrl(imgSrc).then(dataUrl => {
            chrome.runtime.sendMessage({
              type: 'EXTRACT_TEXT',
              dataUrl: dataUrl,
              alt: imgAlt
            });
          }).catch(err => {
            console.error('Error converting image to data URL:', err);
            // Fallback: send the URL and let side panel handle it
            chrome.runtime.sendMessage({
              type: 'EXTRACT_TEXT',
              imageUrl: imgSrc,
              alt: imgAlt
            });
          });
        }
        // Also dispatch the event for backward compatibility
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
          img.onload = function () {
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

  function buildImageToolUrl(tool, imgSrc, imgAlt, baseUrl) {
    const params = new URLSearchParams({
      imageUrl: imgSrc,
      imageAlt: imgAlt || 'Image'
    });

    if (tool === 'bg-remover') {
      return `${baseUrl}/create/image/background-remover?${params.toString()}`;
    } else if (tool === 'text-remover') {
      return `${baseUrl}/create/image/text-remover?${params.toString()}`;
    } else if (tool === 'inpaint') {
      return `${baseUrl}/create/image/inpaint?${params.toString()}`;
    } else if (tool === 'photo-eraser') {
      return `${baseUrl}/create/image/photo-eraser?${params.toString()}`;
    } else if (tool === 'bg-changer') {
      return `${baseUrl}/create/image/background-changer?${params.toString()}`;
    } else if (tool === 'upscaler') {
      return `${baseUrl}/create/image/image-upscaler?${params.toString()}`;
    } else if (tool === 'variations') {
      return `${baseUrl}/create/image/ai-image-generator?${params.toString()}`;
    } else {
      params.set('tool', tool);
      return `${baseUrl}/image-tool?${params.toString()}`;
    }
  }

  function handleImageToolAction(tool, img) {
    const imgSrc = img.src || img.currentSrc || img.dataset.src;
    const imgAlt = img.alt || 'Image';
    const defaultBaseUrl = 'http://localhost:3000';

    const openUrl = (baseUrl) => {
      try {
        const url = buildImageToolUrl(tool, imgSrc, imgAlt, baseUrl);
        console.log('Opening URL for tool:', tool, 'URL:', url);
        window.open(url, '_blank');
      } catch (err) {
        console.error('Error building URL:', err);
        const url = buildImageToolUrl(tool, imgSrc, imgAlt, defaultBaseUrl);
        window.open(url, '_blank');
      }
    };

    try {
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['sider_app_base_url'], (result) => {
          if (chrome.runtime.lastError) {
            openUrl(defaultBaseUrl);
            return;
          }
          try {
            const baseUrl = result.sider_app_base_url || defaultBaseUrl;
            openUrl(baseUrl);
          } catch (err) {
            openUrl(defaultBaseUrl);
          }
        });
      } else {
        openUrl(defaultBaseUrl);
      }
    } catch (err) {
      openUrl(defaultBaseUrl);
    }

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

    // Watch for new images (SPA support) - Optimized
    let mutationTimeout;
    const pendingImages = new Set();

    const processPendingImages = () => {
      if (pendingImages.size === 0) return;

      pendingImages.forEach(img => {
        if (!observedImages.has(img) && img.isConnected) {
          processImage(img);
        }
      });
      pendingImages.clear();
    };

    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG') {
                pendingImages.add(node);
                shouldProcess = true;
              } else if (node.querySelectorAll) {
                // Only query if the node is substantial enough to contain images
                // Avoid querying small text nodes or simple wrappers if possible, but hard to know
                const images = node.querySelectorAll('img');
                if (images.length > 0) {
                  images.forEach(img => pendingImages.add(img));
                  shouldProcess = true;
                }
              }

              // Cleanup check - only if we suspect panel changes
              if (node.classList && (
                node.classList.contains('sider-input-area') ||
                node.classList.contains('sider-attachments') ||
                node.id === 'sider-ai-chat-panel'
              )) {
                cleanupExtensionPanelOverlays();
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          if (mutation.attributeName === 'src' || mutation.attributeName === 'data-src') {
            pendingImages.add(mutation.target);
            shouldProcess = true;
          }
        }
      });

      if (shouldProcess) {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(processPendingImages, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src']
    });

    // IntersectionObserver for lazy loaded images - much more efficient than a second MutationObserver
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.tagName === 'IMG') {
            if (!observedImages.has(entry.target)) {
              processImage(entry.target);
            }
            // Once processed, we can stop observing if we want, but keeping it allows re-check
            // For now, let's keep it simple
          }
        });
      });

      // We don't need a separate MutationObserver just to add to IntersectionObserver
      // We can add them in the main observer loop or just rely on the main observer calling processImage
      // which sets up the overlay.

      // However, if processImage relies on visibility, we might need this.
      // Let's hook into the main observer to add to lazy observer if needed.
    }

    // Re-process on scroll (throttled)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        // Only check images that we haven't successfully processed yet
        // or that might have become visible
        // For now, just rely on the initial scan and mutation observer
      }, 500);
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

