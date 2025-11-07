'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Sparkles,
  FileText,
  Layout,
  PenTool,
  Presentation,
  ChevronRight,
  ChevronDown,
  Bell,
  Folder,
  Settings,
  Mic,
  Search,
  Lightbulb,
  Paperclip,
  Split,
  Zap,
  Grid3x3,
  Palette,
  Square,
  Type,
  Eraser,
  ScanSearch,
  Maximize2,
  Layers,
  Languages,
  Image as ImageIcon,
  Video,
  Square as SquareIcon,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';

interface DropdownPosition {
  top: number;
  left: number;
  direction: 'up' | 'down';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isGenerating?: boolean;
}

interface Model {
  id: string;
  name: string;
}

interface UserData {
  name?: string;
  email?: string;
  username?: string;
}

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState('Sider Fusion');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMoreHovered, setIsMoreHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    direction: 'down',
  });
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const [userData, setUserData] = useState<UserData | null>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMoreHovered && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 360; // estimated dropdown height
      const viewportHeight = window.innerHeight;
      
      // Calculate button center
      const buttonCenterY = rect.top + rect.height / 2;
      
      // Calculate dropdown top position to center it vertically with the button
      const dropdownTop = buttonCenterY - dropdownHeight / 2;
      
      // Check if dropdown would go outside viewport
      const wouldGoAbove = dropdownTop < 0;
      const wouldGoBelow = dropdownTop + dropdownHeight > viewportHeight;
      
      let finalTop = dropdownTop;
      if (wouldGoAbove) {
        finalTop = 8; // Position near top with small margin
      } else if (wouldGoBelow) {
        finalTop = viewportHeight - dropdownHeight - 8; // Position near bottom with small margin
      }

      setDropdownPosition({
        top: finalTop,
        left: rect.right + 8,
        direction: 'down',
      });
    }
  }, [isMoreHovered]);

  const agents = [
    { name: 'Deep Research', icon: FileText },
    { name: 'Web Creator', icon: Layout },
    { name: 'AI Writer', icon: PenTool },
    { name: 'AI Slides', icon: Presentation },
  ];

  const wisebaseItems = [
    { name: 'Demo: Introduction...' },
    { name: 'Demo: Research on...' },
    { name: 'Demo: NVIDIA Busin...' },
    { name: 'AI Inbox' },
  ];

  const suggestedPrompts = [
    'Write a Shakespearean-style sonnet about smartphones',
    'Suggest 10 creative Halloween costumes for kids',
    "Outline a beginner's roadmap for learning personal finance",
    'Explain to a 10-year-old child why the sky is blue',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleUserProfileClick = () => {
    if (userProfileButtonRef.current) {
      const rect = userProfileButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      const dropdownHeight = 400;
      const viewportWidth = window.innerWidth;

      // Position dropdown above the button
      let top = rect.top - dropdownHeight - 8;
      let left = rect.left - dropdownWidth + rect.width;

      // Adjust if dropdown would go outside viewport
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

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/chat/models');
        if (response.ok) {
          const data = await response.json();
          if (data.code === 0 && data.data) {
            // Assuming data.data is an array of models or an object with models
            const models = Array.isArray(data.data) ? data.data : data.data.models || [];
            setAvailableModels(models);
            // Set default model if none selected and models are available
            if (models.length > 0 && selectedModel === 'Sider Fusion') {
              const defaultModel = models.find((m: Model) => m.name === 'Sider Fusion') || models[0];
              setSelectedModel(defaultModel.name || defaultModel.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsGenerating(true);

    // Create AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isGenerating: true,
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          model: selectedModel,
          conversation_id: conversationId,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle SSE streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, isGenerating: false } : msg
        )
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted
        return;
      }
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Sorry, an error occurred. Please try again.', isGenerating: false }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.isGenerating ? { ...msg, isGenerating: false } : msg))
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="relative w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sider
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-6">
          {/* Chat */}
          <div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Chat</span>
            </div>
          </div>

          {/* Agents */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
              Agents
            </h3>
            <div className="space-y-1">
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                return (
                  <motion.button
                    key={agent.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{agent.name}</span>
                  </motion.button>
                );
              })}

              {/* More Dropdown */}
              <div
                ref={moreButtonRef}
                className="relative"
                onMouseEnter={() => setIsMoreHovered(true)}
                onMouseLeave={() => setIsMoreHovered(false)}
              >
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: agents.length * 0.1 }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="text-sm">More</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </motion.button>

                {isMoreHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed min-w-[260px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[9999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                    }}
                    onMouseEnter={() => setIsMoreHovered(true)}
                    onMouseLeave={() => setIsMoreHovered(false)}
                  >
                    {/* IMAGE SECTION */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                        Image
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {[
                          { name: 'AI Image Generator', icon: Palette },
                          { name: 'Background Remover', icon: Square },
                          { name: 'Text Remover', icon: Type },
                          { name: 'Photo Eraser', icon: Eraser },
                          { name: 'Inpaint', icon: ScanSearch },
                          { name: 'Image Upscaler', icon: Maximize2 },
                          { name: 'Background Changer', icon: Layers },
                        ].map((item, i) => {
                          const Icon = item.icon;
                          return (
                            <motion.button
                              key={item.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-200">
                                {item.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TRANSLATOR SECTION */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                        Translator
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {[
                          { name: 'AI Translator', icon: Languages },
                          { name: 'Image Translator', icon: ImageIcon },
                        ].map((item, i) => {
                          const Icon = item.icon;
                          return (
                            <motion.button
                              key={item.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 + i * 0.05 }}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-200">
                                {item.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* VIDEO SECTION */}
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                        Video
                      </h4>
                      <div className="flex flex-col gap-2">
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Video className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            AI Video Shortener
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Wisebase */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
              Wisebase
            </h3>
            <div className="space-y-1">
              {wisebaseItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (agents.length + 1 + index) * 0.1 }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-sm">{item.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="px-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Zap className="w-4 h-4" />
                <span>+30</span>
                <span className="mx-1">+0</span>
                <span>0</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                Upgrade to get more credits
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Upgrade 35% OFF
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer Icons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around">
          <motion.button
            ref={userProfileButtonRef}
            onClick={handleUserProfileClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center transition-all hover:shadow-lg w-9"
          >
            <span className="text-white font-semibold text-sm">
              {getUserInitial()}
            </span>
          </motion.button>
          {[Folder, MessageCircle, Settings].map((Icon, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Icon className="w-5 h-5" />
            </motion.button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>
        </header>

        {/* Chat */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-5xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  Hi,
                </motion.h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                  How can I assist you today?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInputValue(prompt)}
                      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
                    >
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {prompt}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 inline-block ml-2 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flex items-start gap-3 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Sider Fusion
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-gray-900 dark:text-white shadow-sm">
                            {message.content}
                            {message.isGenerating && (
                              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full ml-1 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
                        <p className="text-gray-900 dark:text-white">{message.content}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
                {isGenerating && (
                  <div className="flex justify-center mt-4">
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleStopGenerating}
                      className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      <SquareIcon className="w-4 h-4" />
                      Stop generating
                    </motion.button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div ref={modelDropdownRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                  </div>
                  {selectedModel}
                  <ChevronDown className="w-4 h-4" />
                </motion.button>

                {/* Model Dropdown */}
                {isModelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                  >
                    {availableModels.length > 0 ? (
                      <div className="p-2">
                        {availableModels.map((model) => (
                          <motion.button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.name || model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                              selectedModel === (model.name || model.id)
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="text-sm font-medium">
                              {model.name || model.id}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No models available
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              {[FileText, Split, Paperclip].map((Icon, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              ))}
            </div>

             <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex items-end gap-2">
                 <input
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Ask anything, @models, / prompts"
                   className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                 />
                 <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2">
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                     >
                       <Lightbulb className="w-3.5 h-3.5" />
                       Think
                     </motion.button>
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                     >
                       <Search className="w-3.5 h-3.5" />
                       Search
                     </motion.button>
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={handleSendMessage}
                     disabled={!inputValue.trim() || isGenerating}
                     className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <Mic className="w-5 h-5" />
                   </motion.button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </main>

      {/* User Profile Dropdown */}
      <UserProfileDropdown
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        position={userProfilePosition}
      />
    </div>
  );
}
