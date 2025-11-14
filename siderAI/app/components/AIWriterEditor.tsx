'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronDown, 
  Rocket, 
  MessageSquare, 
  Download, 
  Share2,
  PenTool,
  MessageCircle,
  Globe,
  Send,
  Undo2,
  Redo2,
  Maximize2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIWriterEditorProps {
  documentId: string;
}

export default function AIWriterEditor({ documentId }: AIWriterEditorProps) {
  const router = useRouter();
  const [documentTitle, setDocumentTitle] = useState('Untitled');
  const [documentContent, setDocumentContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [autoComplete, setAutoComplete] = useState(true);
  const [assistantInput, setAssistantInput] = useState('');
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Notify parent component when document is created/opened
  useEffect(() => {
    const stored = localStorage.getItem('ai-writer-documents');
    const docs = stored ? JSON.parse(stored) : [];
    const existingDoc = docs.find((doc: { id: string }) => doc.id === documentId);
    
    if (!existingDoc) {
      // Create new document entry
      const newDoc = {
        id: documentId,
        title: 'Untitled',
        createdAt: new Date().toISOString(),
      };
      
      const updatedDocs = [newDoc, ...docs];
      localStorage.setItem('ai-writer-documents', JSON.stringify(updatedDocs));
      
      // Dispatch event to notify AIWriter component
      window.dispatchEvent(
        new CustomEvent('ai-writer-document-created', {
          detail: { id: documentId, title: 'Untitled' },
        })
      );
    }
  }, [documentId]);

  // Update document title in localStorage when it changes
  useEffect(() => {
    const stored = localStorage.getItem('ai-writer-documents');
    if (stored) {
      const docs = JSON.parse(stored);
      const updatedDocs = docs.map((doc: { id: string; title: string; createdAt: string }) =>
        doc.id === documentId ? { ...doc, title: documentTitle } : doc
      );
      localStorage.setItem('ai-writer-documents', JSON.stringify(updatedDocs));
    }
  }, [documentTitle, documentId]);

  // Calculate word count
  useEffect(() => {
    const words = documentContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [documentContent]);

  // Auto-resize textarea for assistant input
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = '0px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 150;
    const newHeight = Math.max(60, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      adjustTextareaHeight(textarea);
    }
  }, [assistantInput]);

  const handleAssistantChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssistantInput(e.target.value);
    adjustTextareaHeight(e.target);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/agents/ai-writer')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-base font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-gray-300 rounded px-2 py-1"
            />
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Upgrade Now
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Document Editor - Left */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-12 relative">
            <div className="max-w-3xl mx-auto min-h-full">
              {isEditorEmpty ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center w-full">
                    <h1 className="text-6xl font-light text-gray-300 mb-4">{documentTitle}</h1>
                    <p className="text-xl text-gray-400">Write something...</p>
                  </div>
                </div>
              ) : null}
              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => {
                  const content = e.currentTarget.textContent || '';
                  setDocumentContent(content);
                  setIsEditorEmpty(content.trim().length === 0);
                }}
                onFocus={() => {
                  if (isEditorEmpty && editorRef.current) {
                    editorRef.current.textContent = '';
                  }
                }}
                className="w-full text-gray-900 text-lg leading-relaxed focus:outline-none relative z-10"
                style={{ whiteSpace: 'pre-wrap', minHeight: '100%' }}
                suppressContentEditableWarning
              />
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PenTool className="w-4 h-4" />
                <span>Suggest edits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Auto-complete</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAutoComplete(!autoComplete)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    autoComplete ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                    animate={{ x: autoComplete ? 20 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <Undo2 className="w-4 h-4 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <Redo2 className="w-4 h-4 text-gray-600" />
                </motion.button>
              </div>
              <span className="text-sm text-gray-500">{wordCount} words</span>
            </div>
          </div>
        </main>

        {/* Writing Assistant Sidebar - Right */}
        <aside className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Writing Assistant</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-gray-600 rotate-45" />
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <p className="text-sm text-gray-600">
              Hi there! Tell me what you want to write, and I'll help you draft or edit.
            </p>
          </div>

          {/* Assistant Input Area */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <textarea
                ref={textareaRef}
                value={assistantInput}
                onChange={handleAssistantChange}
                placeholder="Type a message..."
                className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none resize-none"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '150px', height: '60px' }}
              />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                <PenTool className="w-4 h-4" />
                Write
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Send className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

