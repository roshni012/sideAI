import { API_BASE_URL, API_ENDPOINTS, getApiUrl } from './apiConfig';

export interface AuthResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
  };
  data?: {
    token?: string;
    access_token?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      username?: string;
    };
  };
  // Include headers in response for token extraction
  _headers?: Headers;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const endpoints = [
    '/api/auth/login',
    '/auth/login',
    '/api/login',
    '/login',
  ];

  let lastError: { message?: string; detail?: string } | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Attach headers to response for token extraction
        return { ...data, _headers: response.headers };
      } else {
        lastError = await response.json();
      }
    } catch {
      lastError = { detail: 'Network error' };
      continue;
    }
  }

  throw new Error(
    lastError?.message || lastError?.detail || 'Login failed. Please check the endpoint.'
  );
}

export async function signupUser(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.message || errorData?.detail || 'Signup failed. Please try again.'
      );
    }

    const data = await response.json();
    // Attach headers to response for token extraction
    return { ...data, _headers: response.headers };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Signup failed. Please try again.');
  }
}

export async function loginWithGoogle(): Promise<void> {
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  // Try different Google OAuth endpoint patterns
  const endpoints = [
    '/auth/google',
    '/api/auth/google',
    '/api/google',
    '/google',
  ];

  // Try the endpoint without /api first
  const popup = window.open(
    getApiUrl(endpoints[0]),
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  // Listen for message from popup
  const messageListener = (event: MessageEvent) => {
    if (event.origin !== API_BASE_URL) return;

    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      const { token, user } = event.data;
      if (token) {
        localStorage.setItem('authToken', token);
        try {
          window.postMessage({
            type: 'SIDER_AUTH_SYNC',
            source: 'app',
            token,
            refreshToken: null,
            user
          }, '*');
        } catch (pmErr) {
        }
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      window.removeEventListener('message', messageListener);
      popup?.close();
      window.location.href = '/chat';
    } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
      window.removeEventListener('message', messageListener);
      popup?.close();
      throw new Error(event.data.message || 'Google login failed');
    }
  };

  window.addEventListener('message', messageListener);

  // Check if popup was closed manually
  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', messageListener);
    }
  }, 500);
}

export async function syncAuthFromExtension(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    await new Promise(resolve => setTimeout(resolve, 100));
    const bridge = (window as any).SiderStorageBridge;
    if (!bridge) {
      return false;
    }

    const result = await bridge.syncToLocalStorage();
    if (result.token) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

let googleClientIdCache: string | null = null;

export async function getGoogleClientId(): Promise<string> {
  if (googleClientIdCache) {
    return googleClientIdCache;
  }

  try {
    const response = await fetch(getApiUrl('/api/auth/google/client-id'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Client ID');
    }

    const data = await response.json();
    // Handle the specific response structure: { code: 0, msg: "", data: { client_id: "..." } }
    const clientId = data?.data?.client_id || data?.client_id || data?.clientId;

    if (!clientId || typeof clientId !== 'string') {
      throw new Error('Invalid Client ID format');
    }

    googleClientIdCache = clientId;
    return clientId;
  } catch (err) {
    console.error('Error fetching Google Client ID:', err);
    throw err;
  }
}

export async function loginWithGoogleToken(token: string): Promise<AuthResponse> {
  try {
    const response = await fetch(getApiUrl('/api/auth/google/signin'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.message || errorData?.detail || 'Google login failed'
      );
    }

    const data = await response.json();
    return { ...data, _headers: response.headers };
  } catch (err) {
    console.error('Error logging in with Google token:', err);
    throw err;
  }
}

import { fetchWithAuth } from './fetchUtils';

export async function getCurrentUser(token: string): Promise<any> {
  try {
    // Note: fetchWithAuth automatically uses the token from localStorage if available.
    // However, if a specific token is passed (e.g. during initial sync), we might want to use that.
    // But fetchWithAuth is designed to use the stored token.
    // If we want to verify a specific token, we might need to override the header.

    const response = await fetchWithAuth('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching current user:', err);
    throw err;
  }
}
