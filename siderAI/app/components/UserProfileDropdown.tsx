'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, HelpCircle, CheckSquare, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

interface UserData {
  name?: string;
  email?: string;
  username?: string;
}

export default function UserProfileDropdown({
  isOpen,
  onClose,
  position,
}: UserProfileDropdownProps) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch {
        // Handle parse error
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getUserInitial = () => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    if (userData?.username) {
      return userData.username.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    return userData?.name || userData?.username || 'User';
  };

  const getUserEmail = () => {
    return userData?.email || '';
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[10000] min-w-[320px] max-w-[360px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="p-6">
          {/* User Info Section */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {getUserInitial()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                  {getUserName()}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 whitespace-nowrap">
                  Free
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {getUserEmail()}
              </p>
            </div>
          </div>

          {/* Invite Friends Section */}
          <div className="relative mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 dark:bg-purple-800/20 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200/30 dark:bg-pink-800/20 rounded-full -ml-8 -mb-8"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-full h-full"
                >
                  <rect
                    x="4"
                    y="4"
                    width="6"
                    height="6"
                    rx="1"
                    fill="#8B5CF6"
                    opacity="0.8"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="6"
                    height="6"
                    rx="1"
                    fill="#EC4899"
                    opacity="0.8"
                  />
                  <rect
                    x="4"
                    y="14"
                    width="6"
                    height="6"
                    rx="1"
                    fill="#F59E0B"
                    opacity="0.8"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="6"
                    height="6"
                    rx="1"
                    fill="#3B82F6"
                    opacity="0.8"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                  Invite Friends
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Earn Free Credits
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <motion.button
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium">My Account</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium">Help Center</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <CheckSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium">Feedback</span>
            </motion.button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

