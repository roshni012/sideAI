'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock } from 'lucide-react';
import { loginUser, loginWithGoogle } from '../lib/authService';

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      console.log('Login success - full response:', res);
      
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
      
      console.log('Extracted token:', token ? 'Token found' : 'No token found');
      console.log('Response keys:', Object.keys(res || {}));
      if (res?._headers) {
        console.log('Response headers:', Array.from(res._headers.entries()));
      }
      
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('Token stored in localStorage');
      } else {
        console.warn('No token found in response. Response structure:', JSON.stringify(res, null, 2));
      }
      
      // Store user data
      const userData = res?.user || res?.data?.user || {
        name: email.split('@')[0] || 'User',
        email: email,
        username: email.split('@')[0] || 'User',
      };
      localStorage.setItem('user', JSON.stringify(userData));
      showToast('Login successful', 'success', () => {
        onClose();
        router.push('/chat');
      });
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleBackdropClick}
          />

          <motion.div
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loginWithGoogle}
                  className="w-full relative px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-3 shadow-lg"
                >
                  <svg className="w-5 h-5 bg-white rounded-full p-1" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25..."></path>
                  </svg>
                  <span>Continue with Google</span>
                </motion.button>

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
            className={`fixed left-1/2 transform -translate-x-1/2 top-6 z-[10000] rounded-md px-4 py-2 shadow-lg ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
