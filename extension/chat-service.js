(function () {
  'use strict';

  // Use extension API config
  const getApiBaseUrl = () => {
    if (window.SiderExtensionAPI) {
      return window.SiderExtensionAPI.getBaseUrl();
    }
    // Fallback if extension_api.js is not loaded
    return new Promise((resolve) => {
      chrome.storage.sync.get(['sider_api_base_url'], (result) => {
        let baseUrl = result.sider_api_base_url || 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
        baseUrl = baseUrl.replace(/\/docs\/?$/, '');
        resolve(baseUrl);
      });
    });
  };

  // Helper function to get auth token from multiple sources
  const getAuthToken = () => {
    // Try localStorage first (works in sidepanel context)
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) return token;
    }

    // Try chrome.storage as fallback (works in content scripts)
    // Note: This is synchronous check, actual async retrieval happens in the function
    return null;
  };

  // Async helper to get auth token with fallback to chrome.storage
  const getAuthTokenAsync = () => {
    return new Promise((resolve) => {
      // First try localStorage (sidepanel context)
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
          resolve(token);
          return;
        }
      }

      // Fallback to chrome.storage (content script context)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['authToken'], (result) => {
          resolve(result.authToken || null);
        });
      } else {
        resolve(null);
      }
    });
  };

  // Helper to handle auth errors globally
  const handleAuthError = async () => {
    console.warn('Authentication expired. Logging out...');
    if (window.SiderAuthService && window.SiderAuthService.clearAuth) {
      await window.SiderAuthService.clearAuth();
    } else {
      // Fallback manual clear
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      if (typeof chrome !== 'undefined' && chrome.storage) {
        if (chrome.storage.sync) {
          chrome.storage.sync.remove(['authToken', 'refreshToken', 'sider_user_email', 'sider_user_name', 'sider_user_profile']);
        }
        if (chrome.storage.local) {
          chrome.storage.local.remove(['authToken', 'refreshToken', 'sider_user_profile', 'sider_user_logged_in']);
        }
      }
    }

    // Notify UI to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sider-auth-expired'));
    }
  };

  // Wrapper for fetch to handle 401s
  const fetchWithAuth = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        await handleAuthError();
        // Return a mocked error response to stop processing
        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: 'Session expired. Please login again.' }),
          text: async () => 'Session expired. Please login again.'
        };
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const ChatService = {
    async createConversation(title, model) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.create || '/api/conversations') : `${baseUrl}/api/conversations`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: title || 'New Conversation',
            model: model
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to create conversation'
          };
        }

        // API returns { code: 0, data: { ... }, msg: "" }
        if (data.code === 0 && data.data) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Create conversation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create conversation'
        };
      }
    },

    async getConversation(conversationId) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.get(conversationId) || `/api/conversations/${conversationId}`) : `${baseUrl}/api/conversations/${conversationId}`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to get conversation'
          };
        }

        if (data.code === 0 && data.data) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Get conversation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to get conversation'
        };
      }
    },

    async updateConversation(conversationId, title) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.update(conversationId) || `/api/conversations/${conversationId}`) : `${baseUrl}/api/conversations/${conversationId}`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: title
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to update conversation'
          };
        }

        if (data.code === 0 && data.data) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Update conversation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to update conversation'
        };
      }
    },

    async deleteConversation(conversationId) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.delete(conversationId) || `/api/conversations/${conversationId}`) : `${baseUrl}/api/conversations/${conversationId}`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'DELETE',
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to delete conversation'
          };
        }

        if (data.code === 0 && data.data) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Delete conversation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete conversation'
        };
      }
    },

    async deleteAllConversations() {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl('/api/conversations/all') : `${baseUrl}/api/conversations/all`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'DELETE',
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to delete all conversations'
          };
        }

        if (data.code === 0) {
          return {
            success: true,
            data: data.data || {}
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Delete all conversations error:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete all conversations'
        };
      }
    },

    async sendMessage(conversationId, message, model) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.messages(conversationId) || `/api/conversations/${conversationId}/messages`) : `${baseUrl}/api/conversations/${conversationId}/messages`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: message,
            model: model
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to send message'
          };
        }

        if (data.code === 0 && data.data) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Send message error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send message'
        };
      }
    },

    async listConversations() {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.list || '/api/conversations') : `${baseUrl}/api/conversations`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to list conversations'
          };
        }

        // API returns { code: 0, data: [ ... ], msg: "" }
        if (data.code === 0 && Array.isArray(data.data)) {
          return {
            success: true,
            data: data.data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('List conversations error:', error);
        return {
          success: false,
          error: error.message || 'Failed to list conversations'
        };
      }
    },

    async exportConversation(conversationId) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.conversations?.export(conversationId) || `/api/conversations/${conversationId}/export`) : `${baseUrl}/api/conversations/${conversationId}/export`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({})
        });

        if (!response.ok) {
          let errorMessage = 'Failed to export conversation';
          try {
            const errorData = await response.json();
            console.error('Export API error response:', errorData);
            errorMessage = errorData.detail || errorData.message || errorData.msg || errorMessage;

            // Handle validation errors
            if (errorData.detail && Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
            }
          } catch (e) {
            const errorText = await response.text().catch(() => '');
            console.error('Export API error text:', errorText);
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }

          return {
            success: false,
            error: errorMessage
          };
        }

        // Check if response is a file download (blob) or JSON
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          // JSON response
          const data = await response.json();

          if (data.code === 0 && data.data) {
            // If data contains a download URL
            if (data.data.download_url || data.data.url) {
              return {
                success: true,
                data: data.data,
                downloadUrl: data.data.download_url || data.data.url
              };
            }
            return {
              success: true,
              data: data.data
            };
          }

          return {
            success: false,
            error: 'Invalid response format from server'
          };
        } else {
          // File download (blob)
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          // Get filename from Content-Disposition header or use default
          const contentDisposition = response.headers.get('content-disposition');
          let filename = `conversation-${conversationId}.txt`;
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }

          // Trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          return {
            success: true,
            data: { filename: filename }
          };
        }
      } catch (error) {
        console.error('Export conversation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to export conversation'
        };
      }
    },

    async sendMessageWithImage(conversationId, message, model, imageUrl, stream = false, abortController = null) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
        }

        if (!imageUrl) {
          return {
            success: false,
            error: 'Image URL is required'
          };
        }

        const requestBody = {
          message: message,
          model: model,
          conversation_id: conversationId,
          stream: stream,
          image_url: imageUrl
        };

        const signal = abortController ? abortController.signal : null;

        const api = window.SiderExtensionAPI || {};
        const url = api.buildUrl ? await api.buildUrl(api.endpoints?.chat?.send || '/api/chat/send') : `${baseUrl}/api/chat/send`;
        const headers = api.getHeaders ? await api.getHeaders() : {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await fetchWithAuth(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: signal
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to send message with image'
          };
        }

        // API returns { code: 0, data: { ... }, msg: "" } or empty object {}
        if (data.code === 0 || (data.code === undefined && response.ok)) {
          return {
            success: true,
            data: data.data || data
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Send message with image error:', error);
        // Re-throw AbortError so it can be handled properly
        if (error.name === 'AbortError') {
          throw error;
        }
        return {
          success: false,
          error: error.message || 'Failed to send message with image'
        };
      }
    },

    async chatCompletions(cid, message, model, options = {}) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = await getAuthTokenAsync();

        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found. Please login first.'
          };
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

        // Get AbortController from options
        const abortController = options.abortController || null;
        const signal = abortController ? abortController.signal : null;

        // Retry logic for 503 and other server errors
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          // Check if aborted before retry
          if (signal && signal.aborted) {
            throw new DOMException('The operation was aborted.', 'AbortError');
          }

          try {
            const api = window.SiderExtensionAPI || {};
            const url = api.buildUrl ? await api.buildUrl(api.endpoints?.chat?.completions || '/api/chat/v1/completions') : `${baseUrl}/api/chat/v1/completions`;
            const headers = api.getHeaders ? await api.getHeaders() : {
              'accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            };

            const response = await fetchWithAuth(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody),
              signal: signal
            });

            // Handle non-JSON responses (like HTML error pages)
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
            } else {
              const text = await response.text();
              // Try to parse as JSON anyway, fallback to error message
              try {
                data = JSON.parse(text);
              } catch {
                return {
                  success: false,
                  error: `Server error (${response.status}): ${response.statusText || 'Service unavailable'}`
                };
              }
            }

            if (!response.ok) {
              // Retry on 503, 502, 504 (server errors)
              if ((response.status === 503 || response.status === 502 || response.status === 504) && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.log(`Server error ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                lastError = data.detail || data.message || `Server error: ${response.statusText}`;
                continue;
              }

              return {
                success: false,
                error: data.detail || data.message || `Server error: ${response.statusText || response.status}`
              };
            }

            // API returns { code: 0, data: { ... }, msg: "" }
            if (data.code === 0 && data.data) {
              // Call getConversation API after successful chatCompletions
              try {
                const conversationResult = await this.getConversation(cid);
                if (conversationResult.success) {
                  console.log('✅ Conversation fetched after chatCompletions:', conversationResult.data);
                } else {
                  console.warn('⚠️ Failed to fetch conversation after chatCompletions:', conversationResult.error);
                }
              } catch (error) {
                console.error('Error fetching conversation after chatCompletions:', error);
              }

              return {
                success: true,
                data: data.data
              };
            }

            return {
              success: false,
              error: 'Invalid response format from server'
            };
          } catch (fetchError) {
            // If aborted, throw immediately
            if (fetchError.name === 'AbortError') {
              throw fetchError;
            }
            // Network or parsing error - retry if not last attempt
            if (attempt < maxRetries - 1) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`Request error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`, fetchError);
              await new Promise(resolve => setTimeout(resolve, delay));
              lastError = fetchError.message;
              continue;
            }
            throw fetchError;
          }
        }

        // If we get here, all retries failed
        return {
          success: false,
          error: lastError || 'Request failed after multiple retries'
        };
      } catch (error) {
        console.error('Chat completions error:', error);
        // Re-throw AbortError so it can be handled properly
        if (error.name === 'AbortError') {
          throw error;
        }
        return {
          success: false,
          error: error.message || 'Failed to get chat completion'
        };
      }
    }
  };

  // Export to window
  window.SiderChatService = ChatService;
})();

