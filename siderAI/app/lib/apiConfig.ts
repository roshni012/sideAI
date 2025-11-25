export const API_BASE_URL = 'https://webby-sider-backend-175d47f9225b.herokuapp.com';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GOOGLE: '/auth/google',
  },
  // Chat endpoints
  CHAT: {
    SEND: '/api/chat/send',
    COMPLETIONS: '/api/chat/v1/completions',
  },
  // Conversation endpoints
  CONVERSATIONS: {
    CREATE: '/api/conversations',
    GET: '/api/conversations', // GET /api/conversations/{conversation_id}
    LIST: '/api/conversations',
    UPDATE: '/api/conversations', // PUT/PATCH /api/conversations/{conversation_id}
    DELETE: '/api/conversations', // DELETE /api/conversations/{conversation_id}
    DELETE_ALL: '/api/conversations/all', // DELETE /api/conversations/all
  },
  // File endpoints
  FILES: {
    UPLOAD: '/api/files/upload',
    UPLOAD_DIRECTLY: '/api/uploader/v1/file/upload-directly',
  },
  // Image processing endpoints
  IMAGES: {
    REMOVE_BACKGROUND: '/api/images/remove-background',
    GENERATE: '/api/images/generate',
    UPSCALE: '/api/images/upscale',
    HISTORY: '/api/images/history/generate',
    OPTIMIZE_PROMPT: '/api/images/optimize_prompt',
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

