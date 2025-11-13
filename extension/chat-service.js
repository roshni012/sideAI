(function() {
  'use strict';

  // Get API base URL from storage or use default
  const getApiBaseUrl = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['sider_api_base_url'], (result) => {
        let baseUrl = result.sider_api_base_url || 'https://webby-sider-backend-175d47f9225b.herokuapp.com';
        // Remove /docs if present
        baseUrl = baseUrl.replace(/\/docs\/?$/, '');
        resolve(baseUrl);
      });
    });
  };

  const ChatService = {
    async createConversation(title, model = 'gpt-4o-mini') {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        const response = await fetch(`${baseUrl}/api/conversations`, {
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
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
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

    async deleteConversation(conversationId) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
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

    async sendMessage(conversationId, message, model) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        const response = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
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
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        const response = await fetch(`${baseUrl}/api/conversations`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
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

    async chatCompletions(cid, message, model = 'gpt-4o-mini', options = {}) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
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

        const response = await fetch(`${baseUrl}/api/chat/v1/completions`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to get chat completion'
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
      } catch (error) {
        console.error('Chat completions error:', error);
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

