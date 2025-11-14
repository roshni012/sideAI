'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronDown, Plus, Link2, Check } from 'lucide-react';

interface AISlidesProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
}

export default function AISlides({
  inputValue,
  setInputValue,
  onSend,
}: AISlidesProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = '0px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 150; // ~5-6 lines (24px per line + padding)
    const newHeight = Math.max(60, Math.min(scrollHeight, maxHeight));
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
    adjustTextareaHeight(e.target);
  };

  const exampleSuggestions = [
    'Venice - Charm of the Water City',
    'Vienna Concert',
    'Japan Travel Guide',
    'Starbucks Brand Marketing Strategy',
  ];

  const features = [
    'Research-Backed',
    'AI-Designed Slides',
    'Unified Style',
    'AI-Powered',
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ willChange: 'contents' }}>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 overflow-auto">
        <div className="w-full max-w-3xl">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-4 mb-12">
            {/* Monitor Icon with Bar Chart */}
            <div className="w-12 h-12 flex items-center justify-center mb-2">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Monitor base */}
                <rect
                  x="8"
                  y="6"
                  width="32"
                  height="22"
                  rx="1.5"
                  stroke="#000000"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Monitor stand */}
                <rect
                  x="20"
                  y="28"
                  width="8"
                  height="3"
                  fill="#000000"
                />
                <rect
                  x="16"
                  y="31"
                  width="16"
                  height="2"
                  fill="#000000"
                />
                {/* Bar chart on screen */}
                <rect
                  x="13"
                  y="16"
                  width="3"
                  height="6"
                  fill="#000000"
                />
                <rect
                  x="18"
                  y="13"
                  width="3"
                  height="9"
                  fill="#000000"
                />
                <rect
                  x="23"
                  y="15"
                  width="3"
                  height="7"
                  fill="#000000"
                />
                <rect
                  x="28"
                  y="11"
                  width="3"
                  height="11"
                  fill="#000000"
                />
                <rect
                  x="33"
                  y="16"
                  width="3"
                  height="6"
                  fill="#000000"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI Slides</h1>

            {/* Features */}
            <div className="flex items-center gap-6 flex-wrap justify-center mt-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Input Field */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-2 hover:border-gray-300 transition-colors shadow-sm mb-8">
            <div className="relative pb-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="What presentation would you like to create today?"
                className="w-full px-4 py-4 pb-16 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 resize-none text-base pr-12"
                rows={1}
              />
              
              {/* Send Button */}
              <div className="absolute bottom-4 right-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onSend}
                  disabled={!inputValue.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    inputValue.trim()
                      ? 'bg-gray-300 text-white hover:bg-gray-400'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Action Buttons - Positioned at bottom */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-600"
                  >
                    <path
                      d="M7 2L3.5 5.5L7 9L10.5 5.5L7 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M3.5 8.5L7 12L10.5 8.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  Deep
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Files
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  URL
                </motion.button>
              </div>
            </div>
          </div>

          {/* Example Suggestions */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3">e.g.</p>
            <div className="flex flex-wrap gap-2">
              {exampleSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputValue(suggestion)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

