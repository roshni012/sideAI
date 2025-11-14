'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, MessageCircle, Globe, Search, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIWriterProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
}

interface Document {
  id: string;
  title: string;
  createdAt: string;
}

export default function AIWriter({
  inputValue,
  setInputValue,
  onSend,
}: AIWriterProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load documents from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai-writer-documents');
    if (stored) {
      const docs = JSON.parse(stored);
      // Sort by creation date (most recent first)
      docs.sort((a: Document, b: Document) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDocuments(docs);
    }
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('ai-writer-documents', JSON.stringify(documents));
    }
  }, [documents]);

  // Listen for document creation events
  useEffect(() => {
    const handleDocumentCreated = (event: CustomEvent) => {
      const { id, title } = event.detail;
      const newDoc: Document = {
        id,
        title: title || 'Untitled',
        createdAt: new Date().toISOString(),
      };
      setDocuments((prev) => {
        // Check if document already exists
        if (prev.find((doc) => doc.id === id)) {
          return prev;
        }
        return [newDoc, ...prev];
      });
    };

    window.addEventListener('ai-writer-document-created' as any, handleDocumentCreated);
    return () => {
      window.removeEventListener('ai-writer-document-created' as any, handleDocumentCreated);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any menu
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const getNextDocumentId = () => {
    const stored = localStorage.getItem('ai-writer-documents');
    if (!stored) return '01';
    
    const docs: Document[] = JSON.parse(stored);
    if (docs.length === 0) return '01';
    
    const maxId = Math.max(...docs.map((doc) => parseInt(doc.id) || 0));
    const nextId = (maxId + 1).toString().padStart(2, '0');
    return nextId;
  };

  const handleCreateNewDocument = () => {
    const nextId = getNextDocumentId();
    router.push(`/agents/ai-writer/${nextId}`);
  };

  const handleDocumentClick = (id: string) => {
    router.push(`/agents/ai-writer/${id}`);
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setOpenMenuId(null);
    
    // Also remove from localStorage
    const stored = localStorage.getItem('ai-writer-documents');
    if (stored) {
      const docs: Document[] = JSON.parse(stored);
      const updated = docs.filter((doc) => doc.id !== id);
      localStorage.setItem('ai-writer-documents', JSON.stringify(updated));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Auto-resize textarea based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to get accurate scrollHeight
    textarea.style.height = '0px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 150; // ~4-5 lines (24px per line + padding)
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
    // Auto-resize on change
    adjustTextareaHeight(e.target);
  };

  return (
    <div className="flex-1 flex flex-col relative" style={{ willChange: 'contents' }}>
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center px-8 py-12 overflow-auto">
        <div className="w-full max-w-2xl">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-4 mb-12">
            {/* Diamond Logo - Purple and Black */}
            <div className="w-16 h-16 flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Diamond shape */}
                <path
                  d="M32 8L56 32L32 56L8 32L32 8Z"
                  fill="#9333EA"
                />
                <path
                  d="M32 12L52 32L32 52L12 32L32 12Z"
                  fill="#1F2937"
                />
                {/* Checkmark */}
                <path
                  d="M24 32L28 36L40 24"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI Writer</h1>
            <p className="text-base text-gray-600 text-center">
              AI helps you think clearly and write great content
            </p>
          </div>

          {/* Main Input Field */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 hover:border-gray-300 transition-colors shadow-sm">
            <div className="flex items-end gap-3 mb-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter a topic to get started"
                className="flex-1 text-base text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '150px', height: '60px' }}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0 mb-1"
              >
                <PenTool className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors"
              >
                <PenTool className="w-4 h-4" />
                Write
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Search
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Left - Recents */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="w-full">
          <h2 className="text-base font-bold text-gray-900 mb-4">Recents</h2>
          
          <div className="space-y-3 flex gap-2 flex-wrap">
            {/* Start from blank page card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateNewDocument}
              className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center">Start from a blank page</p>
              </div>
            </motion.div>

            {/* Dynamic document cards */}
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDocumentClick(doc.id)}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all relative shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{doc.title}</h3>
                    <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                  </div>
                  <div className="relative flex-shrink-0 ml-2" data-menu-container>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </motion.button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === doc.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <motion.button
                          whileHover={{ backgroundColor: '#f3f4f6' }}
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Right - Search Bar */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors shadow-sm"
          />
        </div>
      </div>
      </main>
    </div>
  );
}

