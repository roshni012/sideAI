(function() {
  'use strict';
  
  // Content script functionality - no panel creation needed (using Chrome side panel)
  
  let currentModel = 'chatgpt';
  let isScreenshotMode = false;
  let screenshotOverlay = null;
  let screenshotStartX = 0;
  let screenshotStartY = 0;
  let screenshotSelection = null;
  
  // Screenshot functionality
  function startScreenshotMode() {
    if (isScreenshotMode) {
      stopScreenshotMode();
      return;
    }
    
    isScreenshotMode = true;
    document.body.style.cursor = 'crosshair';
    
    // Create overlay - use highest z-index to work regardless of panel state
    screenshotOverlay = document.createElement('div');
    screenshotOverlay.id = 'sider-screenshot-overlay';
    screenshotOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483647 !important;
      cursor: crosshair;
      pointer-events: auto;
    `;
    document.body.appendChild(screenshotOverlay);
    
    // Create selection rectangle with matching blue gradient
    screenshotSelection = document.createElement('div');
    screenshotSelection.style.cssText = `
      position: fixed;
      border: 2px dashed #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      display: none;
      z-index: 2147483648 !important;
      box-sizing: border-box;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) inset;
      transition: none;
      will-change: transform;
    `;
    document.body.appendChild(screenshotSelection);
    
    // Only attach mousedown to overlay, mousemove and mouseup will be on document for better tracking
    screenshotOverlay.addEventListener('mousedown', handleScreenshotMouseDown);
    
    // Add cancel instruction
    const instruction = document.createElement('div');
    instruction.textContent = 'Select area to capture (Press ESC to cancel)';
    instruction.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      z-index: 2147483649 !important;
      font-size: 14px;
      pointer-events: none;
      user-select: none;
    `;
    screenshotOverlay.appendChild(instruction);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isScreenshotMode) {
        stopScreenshotMode();
      }
    });
  }
  
  function handleScreenshotMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    screenshotStartX = e.clientX;
    screenshotStartY = e.clientY;
    
    screenshotSelection.style.left = `${screenshotStartX}px`;
    screenshotSelection.style.top = `${screenshotStartY}px`;
    screenshotSelection.style.width = '0px';
    screenshotSelection.style.height = '0px';
    screenshotSelection.style.display = 'block';
    
    // Add mouse move and up listeners to document for better tracking
    document.addEventListener('mousemove', handleScreenshotMouseMove);
    document.addEventListener('mouseup', handleScreenshotMouseUp);
  }
  
  function handleScreenshotMouseMove(e) {
    if (!screenshotSelection || screenshotSelection.style.display === 'none') return;
    if (!isScreenshotMode) return;
    
    e.preventDefault();
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - screenshotStartX);
    const height = Math.abs(currentY - screenshotStartY);
    const left = Math.min(currentX, screenshotStartX);
    const top = Math.min(currentY, screenshotStartY);
    
    // Update selection rectangle smoothly
    screenshotSelection.style.left = `${left}px`;
    screenshotSelection.style.top = `${top}px`;
    screenshotSelection.style.width = `${width}px`;
    screenshotSelection.style.height = `${height}px`;
  }
  
  function handleScreenshotMouseUp(e) {
    if (!screenshotSelection || screenshotSelection.style.display === 'none') return;
    if (!isScreenshotMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Remove document listeners
    document.removeEventListener('mousemove', handleScreenshotMouseMove);
    document.removeEventListener('mouseup', handleScreenshotMouseUp);
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - screenshotStartX);
    const height = Math.abs(currentY - screenshotStartY);
    const left = Math.min(currentX, screenshotStartX);
    const top = Math.min(currentY, screenshotStartY);
    
    // Hide overlay BEFORE capturing to avoid overlay tint/border in the image
    stopScreenshotMode();
    
    if (width > 10 && height > 10) {
      // Wait a frame so the overlay is removed from the compositor, then capture
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            captureScreenshotArea(left, top, width, height);
          }, 100);
        });
      });
    }
  }
  
  function stopScreenshotMode() {
    isScreenshotMode = false;
    document.body.style.cursor = '';
    
    // Remove document listeners
    document.removeEventListener('mousemove', handleScreenshotMouseMove);
    document.removeEventListener('mouseup', handleScreenshotMouseUp);
    
    if (screenshotOverlay) {
      screenshotOverlay.remove();
      screenshotOverlay = null;
    }
    if (screenshotSelection) {
      screenshotSelection.remove();
      screenshotSelection = null;
    }
  }
  
  async function captureScreenshotArea(x, y, width, height) {
    try {
      // Wait a bit to ensure viewport is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get viewport dimensions at capture time
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Request screenshot from background script
      chrome.runtime.sendMessage({
        type: 'CAPTURE_SCREENSHOT',
        bounds: { x, y, width, height }
      }, (response) => {
        if (response && response.dataUrl) {
          const image = new Image();
          image.onload = () => {
            // Get actual screenshot dimensions
            const screenshotWidth = image.width;
            const screenshotHeight = image.height;
            
            // Calculate scale factor between viewport and screenshot
            const scaleX = screenshotWidth / viewportWidth;
            const scaleY = screenshotHeight / viewportHeight;
            
            // Calculate crop coordinates in screenshot space
            const cropX = Math.round(x * scaleX);
            const cropY = Math.round(y * scaleY);
            const cropWidth = Math.round(width * scaleX);
            const cropHeight = Math.round(height * scaleY);
            
            // Ensure crop coordinates are within bounds
            const finalX = Math.max(0, Math.min(cropX, screenshotWidth - 1));
            const finalY = Math.max(0, Math.min(cropY, screenshotHeight - 1));
            const finalWidth = Math.max(1, Math.min(cropWidth, screenshotWidth - finalX));
            const finalHeight = Math.max(1, Math.min(cropHeight, screenshotHeight - finalY));
            
            // Create canvas and crop
            const canvas = document.createElement('canvas');
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            const ctx = canvas.getContext('2d');
            
            try {
              // Draw the cropped portion
              ctx.drawImage(
                image,
                finalX, finalY, finalWidth, finalHeight,
                0, 0, finalWidth, finalHeight
              );
              const croppedUrl = canvas.toDataURL('image/png');
              
              // Send screenshot to side panel
              chrome.runtime.sendMessage({
                type: 'SCREENSHOT_CAPTURED',
                dataUrl: croppedUrl
              });
            } catch (e) {
              console.error('Error cropping screenshot:', e);
              // Fallback: use full image if cropping fails
              chrome.runtime.sendMessage({
                type: 'SCREENSHOT_CAPTURED',
                dataUrl: response.dataUrl
              });
            }
          };
          image.onerror = () => {
            console.error('Error loading screenshot image');
          };
          image.src = response.dataUrl;
        } else if (response && response.error) {
          console.error('Screenshot error:', response.error);
        }
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
    }
  }
  
  // Message listener for communication with background script and side panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.type === 'START_SCREENSHOT_MODE') {
        startScreenshotMode();
        if (sendResponse) {
          sendResponse({ success: true });
        }
        return true;
      } else if (request.type === 'READ_PAGE') {
        // Read page content for side panel
        const pageContent = {
          title: document.title,
          url: window.location.href,
          text: document.body.innerText || document.body.textContent || ''
        };
        if (sendResponse) {
          sendResponse({ content: pageContent });
        }
        return true;
      } else if (request.action === 'summarize') {
        // Extract page content for summarization
        const title = document.title;
        const text = document.body.innerText || document.body.textContent || '';
        const summary = `Page: ${title}\n\nContent preview: ${text.substring(0, 500)}...`;
        
        if (sendResponse) {
          sendResponse({ summary });
        }
        return true;
      } else if (request.action === 'deepResearch') {
        // Implement deep research functionality
        if (sendResponse) {
          sendResponse({ status: 'success' });
        }
        return true;
      }
    } catch (error) {
      if (sendResponse) {
        sendResponse({ error: error.message });
      }
    }
    return true;
  });
  
  // Text Selection - send selected text to side panel
  document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      // Send selected text to side panel
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTED',
        text: text
      });
    }
  });
  
  // Listen for toolbar custom events and forward to side panel
  window.addEventListener('sider:analyze-text', (e) => {
    if (e.detail && e.detail.text) {
      chrome.runtime.sendMessage({
        type: 'TEXT_ACTION',
        action: 'analyze',
        text: e.detail.text
      });
    }
  });
  
  window.addEventListener('sider:prompt-text', (e) => {
    if (e.detail && e.detail.text && e.detail.prompt) {
      chrome.runtime.sendMessage({
        type: 'TEXT_ACTION',
        action: 'prompt',
        text: e.detail.text,
        prompt: e.detail.prompt
      });
    }
  });
  
  window.addEventListener('sider:add-note', (e) => {
    if (e.detail && e.detail.text) {
      chrome.runtime.sendMessage({
        type: 'TEXT_ACTION',
        action: 'add-note',
        text: e.detail.text
      });
    }
  });
})();
