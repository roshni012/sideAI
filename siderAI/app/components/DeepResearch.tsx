'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface DeepResearchProps {
  activeTab: 'general' | 'scholar';
  setActiveTab: (tab: 'general' | 'scholar') => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
}

export default function DeepResearch({
  activeTab,
  setActiveTab,
  inputValue,
  setInputValue,
  onSend,
}: DeepResearchProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleTabClick = (tab: 'general' | 'scholar') => {
    if (tab === 'general') {
      router.push('/wisebase/deep-research');
    } else {
      router.push('/wisebase/scholar-research');
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ willChange: 'contents' }}>
      {/* Header */}
      <header className="w-full flex items-center justify-center px-6 py-4 border-gray-100">
        {/* Logo and Title - Centered */}
        <div className="flex items-center gap-3">
          {/* Logo - Interconnected gears/knot design */}
          <div className="w-8 h-8 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-black"
            >
              <path
                d="M14 4L6 8L14 12L22 8L14 4Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 20L14 24L22 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 14L14 18L22 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="8" r="1.5" fill="currentColor" />
              <circle cx="14" cy="14" r="1.5" fill="currentColor" />
              <circle cx="14" cy="20" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black">Deep Research</h1>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
            Beta
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py4 overflow-auto">
        {/* Tab Selection */}
        <div className="flex items-center gap-0 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabClick('general')}
            className={`px-6 py-2.5 rounded-l-lg font-medium text-sm transition-all relative ${
              activeTab === 'general'
                ? 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                : 'bg-gray-100 border border-gray-300 border-r-0 text-gray-600'
            }`}
          >
            General
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabClick('scholar')}
            className={`px-6 py-2.5 rounded-r-lg font-medium text-sm transition-all relative ${
              activeTab === 'scholar'
                ? 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                : 'bg-gray-100 border border-gray-300 border-l-0 text-gray-600'
            }`}
          >
            Scholar
          </motion.button>
        </div>

        {/* Input Field */}
        <div className="w-2/3 max-w-4xl">
          <div className="relative bg-white rounded-3xl border border-gray-200 shadow-sm min-h-[100px] flex flex-col">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="What do you want to research today?"
              className="w-full px-6 py-4 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-base"
              rows={1}
              style={{ minHeight: '100px', maxHeight: '200px', height: '100px' }}
            />
            
            {/* Send Button - Light gray circular icon with arrow */}
            <div className="absolute bottom-4 right-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSend}
                disabled={!inputValue.trim()}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  inputValue.trim()
                    ? 'bg-gray-300 text-white hover:bg-gray-400'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M1 7L13 1M13 1L9 13L7 7M13 1L1 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

