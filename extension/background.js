// Set side panel to open when extension icon is clicked
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html'
  });
});

// Enable side panel to open when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Clicking the toolbar icon opens the side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  
  try {
    // Open side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    // Error opening side panel
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_REQUEST') {
    handleChatRequest(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'CAPTURE_SCREENSHOT') {
    captureScreenshot(request.bounds, sender.tab?.id, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'SCREENSHOT_CAPTURED' || request.type === 'TEXT_SELECTED' || request.type === 'CHAT_WITH_IMAGE' || request.type === 'TEXT_ACTION') {
    // Forward messages from content script to side panel
    // The side panel will receive these messages via chrome.runtime.onMessage
    // No need to forward explicitly as chrome.runtime.sendMessage broadcasts to all listeners
    return false;
  }
  return false;
});

async function captureScreenshot(bounds, tabId, sendResponse) {
  try {
    // Capture the visible tab as a PNG data URL
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });

    // If bounds were provided, crop on the client side (content script) if needed.
    // Here we return the full screenshot for simplicity; the content script will show a preview.
    if (sendResponse) {
      sendResponse({ success: true, dataUrl });
    }
    return true;
  } catch (error) {
    if (sendResponse) {
      sendResponse({ error: error.message });
    }
    return false;
  }
}

async function handleChatRequest(request, sendResponse) {
  const { message, model } = request;
  
  try {
    const response = await callAIModel(model, message);
    sendResponse({ text: response });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function callAIModel(model, message) {
  const apiKeys = await getAPIKeys();
  
  switch (model) {
    case 'chatgpt':
    case 'gpt4':
      return await callChatGPT(message, apiKeys.openai, model === 'gpt4');
    case 'gemini':
      return await callGemini(message, apiKeys.gemini);
    case 'claude':
      return await callClaude(message, apiKeys.claude);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

async function getAPIKeys() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openai_key', 'gemini_key', 'claude_key'], (result) => {
      resolve({
        openai: result.openai_key || '',
        gemini: result.gemini_key || '',
        claude: result.claude_key || ''
      });
    });
  });
}

async function callChatGPT(message, apiKey, isGPT4 = false) {
  if (!apiKey) {
    return 'Please set your OpenAI API key in the extension settings. You can get one from https://platform.openai.com/api-keys';
  }
  
  const model = isGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: message }
        ],
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  } catch (error) {
    throw new Error(`OpenAI API Error: ${error.message}`);
  }
}

async function callGemini(message, apiKey) {
  if (!apiKey) {
    return 'Please set your Gemini API key in the extension settings. You can get one from https://makersuite.google.com/app/apikey';
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response';
  } catch (error) {
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

async function callClaude(message, apiKey) {
  if (!apiKey) {
    return 'Please set your Claude API key in the extension settings. You can get one from https://console.anthropic.com/';
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }
    
    const data = await response.json();
    return data.content[0]?.text || 'No response';
  } catch (error) {
    throw new Error(`Claude API Error: ${error.message}`);
  }
}

