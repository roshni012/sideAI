'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Home,
  Languages,
  Image as ImageIcon,
  ChevronDown,
  ArrowRight,
  Clipboard,
  Upload,
  X,
} from 'lucide-react';
import Sidebar from './Sidebar';

export default function ImageTranslator() {
  const router = useRouter();
  const [sourceLanguage, setSourceLanguage] = useState('Auto-Detect');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSourceLangOpen, setIsSourceLangOpen] = useState(false);
  const [isTargetLangOpen, setIsTargetLangOpen] = useState(false);

  const languages = [
    'Auto-Detect',
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Japanese',
    'Korean',
    'Chinese',
    'Arabic',
    'Hindi',
    'Dutch',
    'Polish',
    'Turkish',
    'Vietnamese',
    'Thai',
    'Indonesian',
    'Swedish',
    'Norwegian',
    'Danish',
    'Finnish',
    'Greek',
    'Hebrew',
    'Czech',
    'Romanian',
    'Hungarian',
  ];

  const handleUserProfileClick = () => {
    if (userProfileButtonRef.current) {
      const rect = userProfileButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const dropdownHeight = 400;
      const viewportWidth = window.innerWidth;

      let top = rect.top - dropdownHeight - 8;
      let left = rect.left - dropdownWidth + rect.width;

      if (top < 8) {
        top = rect.bottom + 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }

      setUserProfilePosition({ top, left });
      setIsUserProfileOpen(!isUserProfileOpen);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSlug="image-translator"
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            {/* Source Language */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsSourceLangOpen(!isSourceLangOpen);
                  setIsTargetLangOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>{sourceLanguage}</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>
              {isSourceLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSourceLanguage(lang);
                        setIsSourceLangOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {lang}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-gray-400" />

            {/* Target Language */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsTargetLangOpen(!isTargetLangOpen);
                  setIsSourceLangOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>{targetLanguage}</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>
              {isTargetLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                >
                  {languages.filter(l => l !== 'Auto-Detect').map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setTargetLanguage(lang);
                        setIsTargetLangOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {lang}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

          </div>
        </div>

        {/* Image Upload Area */}
        <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-gray-800">
          <div className="w-full max-w-4xl">
            {!uploadedImage ? (
              <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                whileHover={{ scale: 1.01 }}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer bg-gray-50 dark:bg-gray-900 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Choose a file or drag & drop it here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      JPG, JPEG, PNG, up to 10MB
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
