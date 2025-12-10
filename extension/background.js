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
  if (request.type === "GOOGLE_OAUTH") {
    console.log("Background: received GOOGLE_OAUTH request");
    handleGoogleOAuth(sendResponse);
    return true;
  }

  // 2) your existing handlers
  if (request.type === 'CHAT_REQUEST') {
    handleChatRequest(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'API_CREATE_CONVERSATION') {
    handleCreateConversation(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'API_CHAT_COMPLETIONS') {
    handleChatCompletions(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'CAPTURE_SCREENSHOT') {
    captureScreenshot(request.bounds, sender.tab?.id, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.type === 'CHAT_WITH_IMAGE') {
    // Handle chat with image: ensure side panel is open and switch to chat tab
    handleChatWithImage(request, sender.tab?.id);
    return false;
  } else if (request.type === 'TEXT_SELECTED' || request.type === 'TEXT_ACTION') {
    // Handle text selection: ensure side panel is open and switch to chat tab
    handleTextSelection(request, sender.tab?.id);
    return false;
  } else if (request.type === 'LOAD_CONVERSATION') {
    // Handle loading an existing conversation: ensure side panel is open and load conversation
    handleLoadConversation(request, sender.tab?.id);
    return false;
  } else if (request.type === 'SCREENSHOT_CAPTURED') {
    // Forward messages from content script to side panel
    // The side panel will receive these messages via chrome.runtime.onMessage
    // No need to forward explicitly as chrome.runtime.sendMessage broadcasts to all listeners
    return false;
  }
  return false;
});

async function handleChatWithImage(request, tabId) {
  try {
    // Ensure side panel is open
    if (tabId) {
      await chrome.sidePanel.open({ tabId: tabId });
    }

    // Wait a bit for side panel to load, then send message to switch to chat tab
    setTimeout(() => {
      // Send message to sidepanel to switch to chat tab
      chrome.runtime.sendMessage({
        type: 'SWITCH_TO_CHAT_TAB'
      }).catch(() => {
        // Side panel might not be loaded yet, try again
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'SWITCH_TO_CHAT_TAB'
          });
        }, 500);
      });

      // Send the image message after switching to chat tab
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'CHAT_WITH_IMAGE',
          dataUrl: request.dataUrl,
          imageUrl: request.imageUrl,
          alt: request.alt
        });
      }, 300);
    }, 200);
  } catch (error) {
    console.error('Error handling chat with image:', error);
    // Fallback: just send the message directly
    chrome.runtime.sendMessage({
      type: 'CHAT_WITH_IMAGE',
      dataUrl: request.dataUrl,
      imageUrl: request.imageUrl,
      alt: request.alt
    });
  }
}

async function handleTextSelection(request, tabId) {
  try {
    // Ensure side panel is open (only for actions, not just selection)
    if (tabId && request.type !== 'TEXT_SELECTED') {
      await chrome.sidePanel.open({ tabId: tabId });
    }

    // Wait a bit for side panel to load, then send message to switch to chat tab
    setTimeout(() => {
      // Send message to sidepanel to switch to chat tab
      chrome.runtime.sendMessage({
        type: 'SWITCH_TO_CHAT_TAB'
      }).catch(() => {
        // Side panel might not be loaded yet, try again
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'SWITCH_TO_CHAT_TAB'
          });
        }, 500);
      });

      // Send the text selection message after switching to chat tab
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: request.type,
          text: request.text,
          action: request.action
        });
      }, 300);
    }, 200);
  } catch (error) {
    console.error('Error handling text selection:', error);
    // Fallback: just send the message directly
    chrome.runtime.sendMessage({
      type: request.type,
      text: request.text,
      action: request.action
    });
  }
}

async function handleLoadConversation(request, tabId) {
  try {
    // Ensure side panel is open
    if (tabId) {
      await chrome.sidePanel.open({ tabId: tabId });
    }

    // Wait a bit for side panel to load, then send message to load conversation
    setTimeout(() => {
      // Send message to sidepanel to switch to chat tab
      chrome.runtime.sendMessage({
        type: 'SWITCH_TO_CHAT_TAB'
      }).catch(() => {
        // Side panel might not be loaded yet, try again
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'SWITCH_TO_CHAT_TAB'
          });
        }, 500);
      });

      // Send the load conversation message after switching to chat tab
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'LOAD_CONVERSATION',
          conversationId: request.conversationId
        });
      }, 300);
    }, 200);
  } catch (error) {
    console.error('Error handling load conversation:', error);
    // Fallback: just send the message directly
    chrome.runtime.sendMessage({
      type: 'LOAD_CONVERSATION',
      conversationId: request.conversationId
    });
  }
}

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

// Helper to get API base URL
async function getApiBaseUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sider_api_base_url'], (result) => {
      let baseUrl = result.sider_api_base_url || 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
      baseUrl = baseUrl.replace(/\/docs\/?$/, '');
      resolve(baseUrl);
    });
  });
}

async function fetchGoogleClientId() {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/auth/google/client-id`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || !json || json.code !== 0 || !json.data?.client_id) {
    throw new Error("Failed to fetch Google OAuth client id");
  }

  return json.data.client_id;
}

async function handleGoogleOAuth(sendResponse) {
  try {
    // 1) Get Google Client ID from backend
    const clientId = await fetchGoogleClientId();

    // 2) Extension redirect URL
    const redirectUri = chrome.identity.getRedirectURL("google");

    // 3) Google OAuth URL
    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(clientId)}` +
      "&response_type=token" +
      "&scope=" + encodeURIComponent("email profile") +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // 4) Open Google OAuth popup
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectedTo) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message || "Google OAuth failed"
          });
          return;
        }

        if (!redirectedTo) {
          sendResponse({ success: false, error: "Empty redirect URL" });
          return;
        }

        // 5) Extract Google access_token
        const match = redirectedTo.match(/access_token=([^&]+)/);
        if (!match) {
          sendResponse({ success: false, error: "No access_token returned" });
          return;
        }

        const googleToken = match[1];
        sendResponse({ success: true, token: googleToken });
      }
    );
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}



// Helper to get auth token from chrome.storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

// Handle createConversation API call
async function handleCreateConversation(request, sendResponse) {
  try {
    const { title, model } = request;
    const baseUrl = await getApiBaseUrl();
    const authToken = await getAuthToken();

    if (!authToken) {
      sendResponse({
        success: false,
        error: 'No authentication token found. Please login first.'
      });
      return;
    }

    const url = `${baseUrl}/api/conversations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: title || 'New Conversation',
        model: model
      })
    });

    const data = await response.json();

    if (!response.ok) {
      sendResponse({
        success: false,
        error: data.detail || data.message || 'Failed to create conversation'
      });
      return;
    }

    // API returns { code: 0, data: { ... }, msg: "" }
    if (data.code === 0 && data.data) {
      sendResponse({
        success: true,
        data: data.data
      });
    } else {
      sendResponse({
        success: false,
        error: 'Invalid response format from server'
      });
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to create conversation'
    });
  }
}

// Handle chatCompletions API call
async function handleChatCompletions(request, sendResponse) {
  try {
    const { cid, message, model, options = {} } = request;
    const baseUrl = await getApiBaseUrl();
    const authToken = await getAuthToken();

    if (!authToken) {
      sendResponse({
        success: false,
        error: 'No authentication token found. Please login first.'
      });
      return;
    }

    const requestBody = {
      stream: options.stream || false,
      cid: cid,
      model: model,
      filter_search_history: options.filter_search_history || false,
      from: options.from || 'chat',
      client_prompt: options.client_prompt || null,
      chat_models: options.chat_models || [],
      quote: options.quote || '',
      multi_content: options.multi_content || [
        {
          type: 'text',
          text: message
        }
      ],
      prompt_templates: options.prompt_templates || [],
      tools: options.tools || null
    };

    // Remove null/empty optional fields
    if (!requestBody.client_prompt) {
      delete requestBody.client_prompt;
    }
    if (!requestBody.tools) {
      delete requestBody.tools;
    }
    if (requestBody.quote === '') {
      delete requestBody.quote;
    }

    const url = `${baseUrl}/api/chat/v1/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    });

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        sendResponse({
          success: false,
          error: `Server error (${response.status}): ${response.statusText || 'Service unavailable'}`
        });
        return;
      }
    }

    if (!response.ok) {
      sendResponse({
        success: false,
        error: data.detail || data.message || `Server error: ${response.statusText || response.status}`
      });
      return;
    }

    // API returns { code: 0, data: { ... }, msg: "" }
    if (data.code === 0 && data.data) {
      sendResponse({
        success: true,
        data: data.data
      });
    } else {
      sendResponse({
        success: false,
        error: 'Invalid response format from server'
      });
    }
  } catch (error) {
    console.error('Chat completions error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to get chat completion'
    });
  }
}

