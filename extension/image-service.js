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

  const ImageService = {
    /**
     * Upload an image file and get file ID and URL
     * @param {File|Blob} file - The image file to upload
     * @param {Object} options - Optional upload parameters
     * @returns {Promise<{success: boolean, data?: {file_id: string, file_url: string}, error?: string}>}
     */
    async uploadImage(file, options = {}) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Add optional fields
        if (options.tz_name !== undefined) formData.append('tz_name', options.tz_name || '');
        if (options.meta !== undefined) formData.append('meta', options.meta || '');
        if (options.app_name !== undefined) formData.append('app_name', options.app_name || '');
        if (options.hash !== undefined) formData.append('hash', options.hash || '');
        if (options.tasks !== undefined) formData.append('tasks', options.tasks || '[]');
        if (options.mime !== undefined) formData.append('mime', options.mime || '');
        if (options.conversation_id !== undefined) formData.append('conversation_id', options.conversation_id || '');
        if (options.app_version !== undefined) formData.append('app_version', options.app_version || '');
        if (options.type !== undefined) formData.append('type', options.type || '');

        const response = await fetch(`${baseUrl}/api/uploader/v1/file/upload-directly`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
            // Don't set Content-Type header - browser will set it with boundary for FormData
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.detail || data.message || 'Failed to upload file'
          };
        }

        if (data.code === 0 && data.data) {
          // Extract fileID and cdnURL from response
          // Response structure: { code: 0, data: { fileID: "...", cdnURL: "...", signedCDNURL: "...", ... } }
          const fileId = data.data.fileID || data.data.file_id || data.data.id;
          const fileUrl = data.data.cdnURL || data.data.signedCDNURL || data.data.file_url || data.data.storage_url || data.data.url;
          
          return {
            success: true,
            data: {
              file_id: fileId,
              file_url: fileUrl,
              fileID: fileId, // Keep original field name for compatibility
              cdnURL: data.data.cdnURL,
              signedCDNURL: data.data.signedCDNURL,
              ...data.data
            }
          };
        }

        return {
          success: false,
          error: 'Invalid response format from server'
        };
      } catch (error) {
        console.error('Upload image error:', error);
        return {
          success: false,
          error: error.message || 'Failed to upload image'
        };
      }
    },

    /**
     * Get image URL from file ID (if needed)
     * @param {string} fileId - The file ID from upload
     * @returns {Promise<{success: boolean, data?: {image_url: string}, error?: string}>}
     */
    async getImageUrlFromFileId(fileId) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        if (!fileId) {
          return {
            success: false,
            error: 'File ID is required'
          };
        }

        // Try to get file info from uploader API
        const response = await fetch(`${baseUrl}/api/uploader/v1/file/${fileId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.code === 0 && data.data) {
            const imageUrl = data.data.file_url || data.data.storage_url || data.data.url;
            if (imageUrl) {
              return {
                success: true,
                data: { image_url: imageUrl }
              };
            }
          }
        }

        // If direct API call fails, return error
        return {
          success: false,
          error: 'Failed to get image URL from file ID'
        };
      } catch (error) {
        console.error('Get image URL error:', error);
        return {
          success: false,
          error: error.message || 'Failed to get image URL'
        };
      }
    },

    /**
     * Convert image to text using OCR API
     * @param {string} imageUrl - The URL of the uploaded image (preferred)
     * @param {string} fileId - The file ID (alternative, will fetch URL first)
     * @param {string} model - The model to use for OCR
     * @returns {Promise<{success: boolean, data?: {text: string}, error?: string}>}
     */
    async imageToText(imageUrl, fileId = null, model) {
      try {
        const baseUrl = await getApiBaseUrl();
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          return {
            success: false,
            error: 'No authentication token found'
          };
        }

        // If fileId is provided but no imageUrl, try to get URL from fileId
        if (!imageUrl && fileId) {
          const urlResult = await this.getImageUrlFromFileId(fileId);
          if (urlResult.success) {
            imageUrl = urlResult.data.image_url;
          } else {
            return {
              success: false,
              error: urlResult.error || 'Failed to get image URL from file ID'
            };
          }
        }

        if (!imageUrl) {
          return {
            success: false,
            error: 'Image URL or File ID is required'
          };
        }

        const requestBody = {
          image_url: imageUrl,
          model: model
        };
        
        // Include file_id if provided (some APIs might need it)
        if (fileId) {
          requestBody.file_id = fileId;
        }
        
        // Check if custom endpoint is configured in storage
        let customEndpoint = null;
        try {
          const storageResult = await new Promise((resolve) => {
            chrome.storage.sync.get(['sider_image_to_text_endpoint'], (result) => {
              resolve(result.sider_image_to_text_endpoint);
            });
          });
          if (storageResult) {
            customEndpoint = storageResult.startsWith('http') ? storageResult : `${baseUrl}${storageResult.startsWith('/') ? '' : '/'}${storageResult}`;
            console.log('🔧 Using custom endpoint from storage:', customEndpoint);
          }
        } catch (e) {
          // Ignore storage errors
        }
        
        // Try multiple endpoint path variations
        // Prioritize the known working endpoint (to-text with hyphen) first
        const endpoints = customEndpoint 
          ? [customEndpoint] // If custom endpoint is set, try only that
          : [
              `${baseUrl}/api/images/to-text`,     // With hyphen - known working endpoint (returns 500, not 404)
              `${baseUrl}/api/images/v1/to_text`,  // With version like other endpoints
              `${baseUrl}/api/images/to_text`,     // Plural without version
              `${baseUrl}/api/images/image_to_text`, // Full name
              `${baseUrl}/api/image/to_text`,      // Singular without version
              `${baseUrl}/api/image/v1/to_text`,   // Singular with version
              `${baseUrl}/api/images/v1/image_to_text` // Full name with version
            ];
        
        console.log('🔍 Trying image-to-text endpoints:', endpoints);
        
        let lastError = null;
        let lastResponse = null;
        
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i];
          try {
            console.log(`📤 [${i + 1}/${endpoints.length}] Trying endpoint: ${endpoint}`, {
              body: requestBody
            });

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            console.log('📥 Image-to-text API response:', {
              endpoint: endpoint,
              status: response.status,
              ok: response.ok,
              data: data
            });

            if (!response.ok) {
              lastResponse = { status: response.status, data: data, endpoint: endpoint };
              
              // Only try next endpoint if we get 404 (endpoint not found)
              // For other errors (like 500), the endpoint exists but has an error, so don't try others
              if (response.status === 404 && i < endpoints.length - 1) {
                console.log(`⚠️ Endpoint ${endpoint} returned 404 (endpoint not found), trying next endpoint...`);
                lastError = data.detail || data.message || `Endpoint not found: ${endpoint}`;
                continue;
              }
              
              // For non-404 errors (500, 400, etc.), the endpoint was found but has an error
              // Don't try other endpoints, return the error immediately
              console.error(`❌ Endpoint ${endpoint} failed with status ${response.status}:`, {
                status: response.status,
                statusText: response.statusText,
                error: data
              });
              
              return {
                success: false,
                error: data.detail || data.message || `Failed to extract text from image (Status: ${response.status})`,
                endpoint: endpoint,
                status: response.status
              };
            }

            // API returns { code: 0, data: { text: "..." }, msg: "" }
            if (data.code === 0 && data.data) {
              console.log(`✅ Success! Endpoint ${endpoint} worked!`);
              return {
                success: true,
                data: {
                  text: data.data.text || data.data.extracted_text || ''
                }
              };
            }

            console.warn(`⚠️ Endpoint ${endpoint} returned invalid response format:`, data);
            return {
              success: false,
              error: 'Invalid response format from server'
            };
          } catch (fetchError) {
            // If this is not the last endpoint, try the next one
            if (i < endpoints.length - 1) {
              console.log(`⚠️ Error with endpoint ${endpoint}, trying next endpoint...`, fetchError.message);
              lastError = fetchError.message;
              continue;
            }
            throw fetchError;
          }
        }
        
        // If we get here, all endpoints failed
        console.error('❌ All endpoints failed. Last response:', lastResponse);
        return {
          success: false,
          error: lastError || `All ${endpoints.length} endpoints failed. Please check the API documentation for the correct endpoint path.`
        };
      } catch (error) {
        console.error('Image to text error:', error);
        return {
          success: false,
          error: error.message || 'Failed to extract text from image'
        };
      }
    },

    /**
     * Complete OCR workflow: Upload image and extract text
     * @param {File|Blob} file - The image file to process
     * @param {Object} uploadOptions - Optional upload parameters
     * @param {string} model - The model to use for OCR
     * @returns {Promise<{success: boolean, data?: {text: string, file_id: string, file_url: string}, error?: string}>}
     */
    async extractTextFromImage(file, uploadOptions = {}, model) {
      try {
        // Step 1: Upload the image
        const uploadResult = await this.uploadImage(file, uploadOptions);
        
        if (!uploadResult.success) {
          return {
            success: false,
            error: uploadResult.error || 'Failed to upload image'
          };
        }

        // Get the image URL from upload response (prefer cdnURL or signedCDNURL)
        const fileUrl = uploadResult.data.cdnURL || uploadResult.data.signedCDNURL || uploadResult.data.file_url;
        const fileId = uploadResult.data.fileID || uploadResult.data.file_id;
        
        console.log('✅ Image uploaded successfully:', {
          fileID: fileId,
          cdnURL: uploadResult.data.cdnURL,
          signedCDNURL: uploadResult.data.signedCDNURL
        });
        
        if (!fileUrl) {
          return {
            success: false,
            error: 'Failed to get image URL from upload response'
          };
        }

        // Step 2: Extract text from the uploaded image using the image URL
        console.log('🔄 Calling image-to-text API with URL:', fileUrl);
        const textResult = await this.imageToText(fileUrl, fileId, model);
        
        if (!textResult.success) {
          return {
            success: false,
            error: textResult.error || 'Failed to extract text from image'
          };
        }

        // Return combined result
        return {
          success: true,
          data: {
            text: textResult.data.text,
            file_id: fileId,
            file_url: fileUrl,
            fileID: fileId,
            cdnURL: uploadResult.data.cdnURL,
            signedCDNURL: uploadResult.data.signedCDNURL
          }
        };
      } catch (error) {
        console.error('Extract text from image error:', error);
        return {
          success: false,
          error: error.message || 'Failed to extract text from image'
        };
      }
    }
  };

  // Export to window
  window.SiderImageService = ImageService;
})();

