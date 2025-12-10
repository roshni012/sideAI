'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock } from 'lucide-react';
import { loginUser, getGoogleClientId, loginWithGoogleToken, getCurrentUser } from '../lib/authService';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export default function LoginDialog({
  isOpen,
  onClose,
  onSwitchToSignUp,
}: LoginDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const googleButtonWrapperRef = useRef<HTMLDivElement>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Fetch Client ID
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const clientId = await getGoogleClientId();
        setGoogleClientId(clientId);
      } catch (error) {
        // Silent error
      }
    };
    fetchClientId();
  }, []);

  // Initialize Google Sign-In (GIS)
  useEffect(() => {
    if (!googleClientId) return;

    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!(window as any).google || !googleButtonWrapperRef.current) return;

      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the button inside the wrapper
      // Use a large fixed width to ensure it covers the container
      (window as any).google.accounts.id.renderButton(
        googleButtonWrapperRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 400, // Fixed pixel width
          type: 'standard',
          text: 'continue_with'
        }
      );
    };

    if (!(window as any).google) {
      loadGoogleScript();
    } else {
      initializeGoogleSignIn();
    }
  }, [googleClientId, isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const showToast = (message: string, type: 'success' | 'error', onDone?: () => void) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
      if (onDone) onDone();
    }, 3000);
  };

  const handleLoginSuccess = (res: any, userDataOverride?: any) => {
    // Check multiple possible token fields in body
    let token =
      res?.token ||
      res?.access_token ||
      res?.accessToken ||
      res?.data?.token ||
      res?.data?.access_token ||
      '';

    // Also check response headers for token
    if (!token && res?._headers) {
      token =
        res._headers.get('Authorization')?.replace('Bearer ', '') ||
        res._headers.get('X-Auth-Token') ||
        res._headers.get('X-Access-Token') ||
        res._headers.get('access-token') ||
        '';
    }

    if (token) {
      localStorage.setItem('authToken', token);
    }

    // Store user data
    const userData = userDataOverride || res?.user || res?.data?.user || {
      name: email.split('@')[0] || 'User',
      email: email,
      username: email.split('@')[0] || 'User',
    };
    localStorage.setItem('user', JSON.stringify(userData));
    showToast('Login successful', 'success', () => {
      onClose();
      router.push('/chat');
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      handleLoginSuccess(res);
    } catch (err) {
      showToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      if (response.credential) {
        const res = await loginWithGoogleToken(response.credential);

        // Extract token to fetch user info
        let token =
          res?.token ||
          res?.access_token ||
          res?.accessToken ||
          res?.data?.token ||
          res?.data?.access_token ||
          '';

        if (!token && res?._headers) {
          token = res._headers.get('Authorization')?.replace('Bearer ', '') || '';
        }

        let userInfo = null;
        if (token) {
          try {
            userInfo = await getCurrentUser(token);
          } catch (err) {
            console.error('Failed to fetch user info:', err);
          }
        }

        handleLoginSuccess(res, userInfo);
      } else {
        throw new Error("No credential received from Google");
      }
    } catch (error) {
      showToast('Google login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="login-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleBackdropClick}
          />

          <motion.div
            key="login-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <div
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                  Login
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Log in to get <span className="font-bold text-green-600">30 free</span> credits daily.
                </p>

                <form onSubmit={handleLogin} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm mb-2">Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Type your email"
                        required
                        className="w-full pl-10 pr-4 py-3 border-b-2 border-gray-300 bg-transparent focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Type your password"
                        required
                        className="w-full pl-10 pr-4 py-3 border-b-2 border-gray-300 bg-transparent focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg"
                  >
                    {loading ? 'Logging in...' : 'LOGIN'}
                  </motion.button>
                </form>

                <div className="flex items-center mb-6">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <div className="relative w-full overflow-hidden rounded-lg">
                  {/* Custom Button UI */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full relative px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed pointer-events-none"
                  >
                    <svg viewBox="0 0 488 512" className="w-5 h-5">
                      <path fill="#4285F4" d="M488 261.8c0-17.4-1.5-34.1-4.3-50.2H250v95.1h134c-5.8 31-23.4 57.2-50 74.7v61.9h81c47.3-43.5 73-107.8 73-181.5z" />
                      <path fill="#34A853" d="M250 500c67.5 0 124.2-22.5 165.6-61.3l-81-61.9c-22.5 15-51.9 24-84.6 24-65.1 0-120.1-43.4-139.8-101.8H25v63.8C66.9 449.2 152.7 500 250 500z" />
                      <path fill="#FBBC04" d="M110.2 299.8c-10.2-30-10.2-62.3 0-92.3V143.8H25c-43.8 87.4-43.8 195 0 282.4l85.2-63.8.0-.0z" />
                      <path fill="#EA4335" d="M250 97.8c35.3 0 67 12.2 92 32.3l69-69C363.1 21.1 312.7 0 250 0 152.3 0 66.9 50.8 25 143.8l85.2 63.7C129.9 141.2 184.9 97.8 250 97.8z" />
                    </svg>
                    <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                  </motion.button>

                  {/* Invisible Google Button Overlay */}
                  <div
                    ref={googleButtonWrapperRef}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>

                <div className="text-center mt-6">
                  <span className="text-gray-600">
                    Don’t have an account?{' '}
                    <button
                      onClick={onSwitchToSignUp}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      Create one
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`fixed left-1/2 transform -translate-x-1/2 top-6 z-[10000] rounded-md px-4 py-2 shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
