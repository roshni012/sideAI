'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Image as ImageIcon, Zap, ChevronDown, Send } from 'lucide-react';

interface WebCreatorProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
}

export default function WebCreator({
  inputValue,
  setInputValue,
  onSend,
}: WebCreatorProps) {
  const [selectedMode, setSelectedMode] = useState('Basic');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModeDropdownOpen(false);
      }
    };

    if (isModeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModeDropdownOpen]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to get accurate scrollHeight
    textarea.style.height = '0px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // ~5-6 lines (24px per line + padding)
    const newHeight = Math.max(100, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      adjustTextareaHeight(textarea);
    }
  }, [inputValue]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize on change
    adjustTextareaHeight(e.target);
  };

  const suggestedActions = [
    'Blog System',
    'Social Media Platform',
    'News Portal',
    'E-commerce Platform',
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ willChange: 'contents' }}>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Browser Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-black"
              >
                {/* Browser window outline */}
                <rect
                  x="8"
                  y="12"
                  width="48"
                  height="40"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Three dots (browser controls) */}
                <circle cx="16" cy="20" r="2" fill="currentColor" />
                <circle cx="24" cy="20" r="2" fill="currentColor" />
                <circle cx="32" cy="20" r="2" fill="currentColor" />
                {/* Browser content lines */}
                <line x1="16" y1="28" x2="48" y2="28" stroke="currentColor" strokeWidth="1.5" />
                <line x1="16" y1="36" x2="40" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="16" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-black mb-2">Web Creator</h1>
          <p className="text-base text-gray-600">
            Chat with AI to easily create beautiful web pages
          </p>
        </div>

        {/* Input Field */}
        <div className="w-2/3 max-w-4xl">
          <div className="relative bg-white rounded-3xl border border-gray-200 shadow-sm min-h-[100px] flex flex-col">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="What do you want to create today?"
              className="w-full px-6 pt-4 pb-16 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-base"
              rows={1}
              style={{ minHeight: '100px', maxHeight: '200px', height: '100px' }}
            />
            
            {/* Input Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Basic Dropdown */}
                <div className="relative" ref={modeDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-teal-500" />
                    <span>{selectedMode}</span>
                    <ChevronDown className="w-3 h-3" />
                  </motion.button>
                  
                  {isModeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    >
                      <div className="p-2">
                        {['Basic', 'Advanced', 'Expert'].map((mode) => (
                          <motion.button
                            key={mode}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedMode(mode);
                              setIsModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedMode === mode
                                ? 'bg-teal-50 text-teal-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {mode}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Files Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Files</span>
                </motion.button>

                {/* Images Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Images</span>
                </motion.button>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="text-sm text-gray-400">%</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onSend}
                  disabled={!inputValue.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    inputValue.trim()
                      ? 'bg-gray-300 text-white hover:bg-gray-400'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Try these:</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestedActions.map((action, index) => (
              <motion.button
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInputValue(action)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {action}
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

