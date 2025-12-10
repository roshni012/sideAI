import { getApiUrl } from './apiConfig';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}): Promise<Response> {
    const authToken = localStorage.getItem('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(getApiUrl(endpoint), config);

        if (response.status === 401) {
            // Token expired or invalid
            console.warn('Authentication expired. Logging out...');

            // Clear auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // Redirect to home page
            // Use window.location to force a full page reload and clear state
            if (window.location.pathname !== '/') {
                window.location.href = '/?expired=true';
            }

            throw new Error('Session expired. Please login again.');
        }

        return response;
    } catch (error) {
        throw error;
    }
}
