const API_BASE_URL = 'https://webby-sider-backend-175d47f9225b.herokuapp.com';

export interface AuthResponse {
  token?: string;
  access_token?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
        return data;
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
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
    return data;
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
    `${API_BASE_URL}${endpoints[0]}`,
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

