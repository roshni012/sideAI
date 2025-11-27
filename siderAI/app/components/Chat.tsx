'use client';

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Sparkles,
  Layout,
  PenTool,
  Presentation,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Folder,
  Settings,
  Mic,
  Search,
  Lightbulb,
  Zap,
  Grid3x3,
  Palette,
  Square,
  Type,
  Eraser,
  ScanSearch,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Languages,
  Image as ImageIcon,
  Video,
  Square as SquareIcon,
  Send,
  Star,
  X,
  Paperclip,
  Upload,
  Calculator,
  FileText,
  ChevronDown as ChevronDownIcon,
  History,
  Plus,
  Trash2,
  Globe,
  AlertCircle,
  FolderPlus,
  BarChart3,
  Brain,
  Edit,
  Sliders,
  Loader2,
  MoreVertical,
  Download,
  Copy,
  RotateCw,
  Quote,
  Share2,
  Volume2,
  SquarePlus,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import DeepResearch from './DeepResearch';
import ScholarResearch from './ScholarResearch';
import WebCreator from './WebCreator';
import AIWriter from './AIWriter';
import AISlides from './AISlides';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';
import MarkdownRenderer from './MarkdownRenderer';

interface DropdownPosition {
  top: number;
  left: number;
  direction: 'up' | 'down';
}

interface CompletionRequestBody {
  cid: string | null;
  model: string;
  multi_content: Array<{ type: string; text: string }>;
  file_ids?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isGenerating?: boolean;
  images?: string[]; // Array of image preview URLs for user messages
  files?: Array<{ name: string; url: string; type: string }>; // Array of file info (PDFs, etc.) for user messages
  model?: string; // Model name used for assistant messages
}

interface Model {
  id: string;
  name: string;
  displayName?: string;
  icon?: React.ReactNode;
  category?: 'basic' | 'advanced' | 'other';
}

type FilePreview = {
  file: File;
  preview: string;
  fileId?: string;
  cdnURL?: string;
  isUploading?: boolean;
  isImage: boolean;
};

const AVAILABLE_MODELS: Model[] = [
  // Basic models
  { id: 'webby-fusion', name: 'webby fusion', displayName: 'webby fusion', category: 'basic' },
  { id: 'gpt-5-mini', name: 'gpt -5 mini', displayName: 'gpt -5 mini', category: 'basic' },
  { id: 'claude-haiku-4.5', name: 'claude haiku 4.5', displayName: 'claude haiku 4.5', category: 'basic' },
  { id: 'gemini-2.5-flash', name: 'gemini 2.5 flash', displayName: 'gemini 2.5 flash', category: 'basic' },
  { id: 'gpt-5.1', name: 'gpt -5.1', displayName: 'gpt -5.1', category: 'basic' },
  { id: 'gpt-4.1', name: 'gpt -4.1', displayName: 'gpt -4.1', category: 'basic' },
  // Advanced models
  { id: 'deepseek-v3.1', name: 'deepseek v3.1', displayName: 'deepseek v3.1', category: 'advanced' },
  { id: 'claude-sonnet-4.5', name: 'claude sonnet 4.5', displayName: 'claude sonnet 4.5', category: 'advanced' },
  { id: 'gemini-2.5-pro', name: 'gemini 2.5 pro', displayName: 'gemini 2.5 pro', category: 'advanced' },
  { id: 'grok-4', name: 'grok 4', displayName: 'grok 4', category: 'advanced' },
  { id: 'gpt-5', name: 'gpt -5', displayName: 'gpt -5', category: 'advanced' },
];

const OTHER_MODELS: Model[] = [
  { id: 'claude-3.5-haiku', name: 'claude 3.5 haiku', displayName: 'claude 3.5 haiku', category: 'other' },
  { id: 'kimi-k2', name: 'kimi k2', displayName: 'kimi k2', category: 'other' },
  { id: 'deepseek-v3', name: 'deepseek v3', displayName: 'deepseek v3', category: 'other' },
  { id: 'claude-3.7-sonnet', name: 'claude 3.7 sonnet', displayName: 'claude 3.7 sonnet', category: 'other' },
  { id: 'claude-sonnet-4', name: 'claude sonnet 4', displayName: 'claude sonnet 4', category: 'other' },
  { id: 'claude-opus-4.1', name: 'claude opus 4.1', displayName: 'claude opus 4.1', category: 'other' },
];

const getModelIcon = (modelId: string) => {
  const iconClass = 'w-4 h-4';
  if (modelId.includes('gpt-4o-mini')) {
    return <Sparkles className={iconClass} />;
  }
  if (modelId.includes('sider-fusion')) {
    return <Zap className={iconClass} />;
  }
  if (modelId.includes('claude')) {
    return <Star className={iconClass} />;
  }
  if (modelId.includes('gemini')) {
    return <Star className={iconClass} />;
  }
  if (modelId.includes('deepseek')) {
    return <Star className={iconClass} />;
  }
  if (modelId.includes('grok')) {
    return <X className={iconClass} />;
  }
  if (modelId.includes('kimi')) {
    return <X className={iconClass} />;
  }
  return <Sparkles className={iconClass} />;
};

const getModelImagePath = (modelId: string): string | null => {
  const imageMap: Record<string, string> = {
    'webby-fusion': '/image/fusion.png',
    'gpt-5-mini': '/image/gpt_5mini.png',
    'gpt-5.1': '/image/chatgpt.png',
    'gpt-4.1': '/image/chatgpt.png',
    'gpt-5': '/image/chatgpt.png',
    'claude-haiku-4.5': '/image/claude.png',
    'claude-sonnet-4.5': '/image/claude.png',
    'claude-3.5-haiku': '/image/claude.png',
    'claude-3.7-sonnet': '/image/claude.png',
    'claude-sonnet-4': '/image/claude.png',
    'claude-opus-4.1': '/image/claude.png',
    'gemini-2.5-flash': '/image/gemini.png',
    'gemini-2.5-pro': '/image/gemini.png',
    'deepseek-v3.1': '/image/deepseek.png',
    'deepseek-v3': '/image/deepseek.png',
    'grok-4': '/image/grok.png',
    'kimi-k2': '/image/kimi.png',
  };
  return imageMap[modelId] || null;
};

const getSelectedModelImagePath = (modelName: string): string | null => {
  const model = AVAILABLE_MODELS.find((m) => m.name === modelName) || 
                OTHER_MODELS.find((m) => m.name === modelName);
  if (model) {
    return getModelImagePath(model.id);
  }
  return null;
};

interface UserData {
  name?: string;
  email?: string;
  username?: string;
}

// Helper function to get initial activeView from pathname
const getInitialActiveView = (pathname: string | null): 'chat' | 'deep-research' | 'scholar-research' | 'web-creator' | 'ai-writer' | 'ai-slides' => {
  if (!pathname) return 'chat';
  if (pathname.startsWith('/wisebase/scholar-research')) return 'scholar-research';
  if (pathname.startsWith('/wisebase/deep-research')) return 'deep-research';
  if (pathname.startsWith('/agents/web-creator')) return 'web-creator';
  if (pathname.startsWith('/agents/ai-writer')) return 'ai-writer';
  if (pathname.startsWith('/agents/ai-slides')) return 'ai-slides';
  return 'chat';
};

export default function Chat() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Get pathname synchronously from window if available (for immediate initialization)
  const getPathnameSync = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return pathname;
  };
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPositions, setTooltipPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [selectedModel, setSelectedModel] = useState('webby fusion');
  const [activeView, setActiveView] = useState<'chat' | 'deep-research' | 'scholar-research' | 'web-creator' | 'ai-writer' | 'ai-slides'>(() => {
    const syncPathname = getPathnameSync();
    return getInitialActiveView(syncPathname);
  });
  const [deepResearchTab, setDeepResearchTab] = useState<'general' | 'scholar'>('general');
  const [deepResearchInput, setDeepResearchInput] = useState('');
  const [scholarResearchInput, setScholarResearchInput] = useState('');
  const [webCreatorInput, setWebCreatorInput] = useState('');
  const [aiWriterInput, setAIWriterInput] = useState('');
  const [aiSlidesInput, setAISlidesInput] = useState('');
  const availableModels = AVAILABLE_MODELS;
  const availableModelNames = useMemo(() => new Set(availableModels.map((model) => model.name)), [availableModels]);
  const filteredOtherModels = useMemo(
    () => OTHER_MODELS.filter((model) => !availableModelNames.has(model.name)),
    [availableModelNames]
  );
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelDropdownOpen1, setIsModelDropdownOpen1] = useState(false);
  const [isOtherModelsHovered, setIsOtherModelsHovered] = useState(false);
  const [otherModelsDropdownPosition, setOtherModelsDropdownPosition] = useState({ top: 0, left: 0 });
  const otherModelsRef = useRef<HTMLButtonElement>(null);
  // Panel 1 Other Models state
  const [isOtherModelsHovered1, setIsOtherModelsHovered1] = useState(false);
  const [otherModelsDropdownPosition1, setOtherModelsDropdownPosition1] = useState({ top: 0, left: 0 });
  const otherModelsRef1 = useRef<HTMLButtonElement>(null);
  // Panel 2 Other Models state
  const [isOtherModelsHovered2, setIsOtherModelsHovered2] = useState(false);
  const [otherModelsDropdownPosition2, setOtherModelsDropdownPosition2] = useState({ top: 0, left: 0 });
  const otherModelsRef2 = useRef<HTMLButtonElement>(null);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Second panel state for double view
  const [selectedModel2, setSelectedModel2] = useState('gpt -5 mini');
  const [messages2, setMessages2] = useState<Message[]>([]);
  const [isGenerating2, setIsGenerating2] = useState(false);
  const [conversationId2, setConversationId2] = useState<string | null>(null);
  const [isModelDropdownOpen2, setIsModelDropdownOpen2] = useState(false);
  const [isPanel2Open, setIsPanel2Open] = useState(true);
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
  const abortController1Ref = useRef<AbortController | null>(null);
  const abortController2Ref = useRef<AbortController | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef1 = useRef<HTMLDivElement>(null);
  const modelDropdownRef2 = useRef<HTMLDivElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const otherModelsDropdownRef = useRef<HTMLDivElement>(null);
  // Panel 1 Other Models ref
  const otherModelsDropdownRef1 = useRef<HTMLDivElement>(null);
  // Panel 2 Other Models ref
  const otherModelsDropdownRef2 = useRef<HTMLDivElement>(null);
  const [isAttachmentDropdownOpen, setIsAttachmentDropdownOpen] = useState(false);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isTranslateDropdownOpen, setIsTranslateDropdownOpen] = useState<number | null>(null);

  // Debug: Log filePreviews changes
  useEffect(() => {
    console.log('filePreviews state changed:', filePreviews.length, 'files');
    if (filePreviews.length > 0) {
      console.log('File previews:', filePreviews.map(p => ({ name: p.file.name, preview: p.preview })));
    }
  }, [filePreviews]);
  const translateDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageMinimized, setIsImageMinimized] = useState(false);
  const [isImageMaximized, setIsImageMaximized] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const imageModalRef = useRef<HTMLDivElement>(null);
  const [isChatControlsOpen, setIsChatControlsOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [chatHistoryTab, setChatHistoryTab] = useState<'all' | 'starred'>('all');
  const [chatHistorySearch, setChatHistorySearch] = useState('');
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [conversationToEdit, setConversationToEdit] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const chatControlsRef = useRef<HTMLDivElement>(null);
  const chatControlsButtonRef = useRef<HTMLButtonElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [isImageModelDropdownOpen, setIsImageModelDropdownOpen] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState('Medium');
  const imageModelDropdownRef = useRef<HTMLDivElement>(null);
  const imageModelButtonRef = useRef<HTMLButtonElement>(null);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Auto');
  const [languageSearch, setLanguageSearch] = useState('');
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const imagePreviewItems = useMemo(
    () =>
      filePreviews
        .map((preview, idx) =>
          preview.isImage ? { filePreview: preview, originalIndex: idx } : null
        )
        .filter(
          (item): item is { filePreview: FilePreview; originalIndex: number } => item !== null
        ),
    [filePreviews]
  );
  const currentImageItem =
    selectedImageIndex !== null ? imagePreviewItems[selectedImageIndex] : null;
  
  // Chat history data structure
  interface ChatHistoryItem {
    id: string;
    title: string;
    preview: string;
    timestamp: Date;
    starred: boolean;
  }
  
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Languages list for translate dropdown
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'cs', name: 'Czech' },
  ];

  useEffect(() => {
    const updatePosition = () => {
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
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isMoreHovered]);

  useEffect(() => {
    const updateOtherModelsPosition = () => {
      if (isOtherModelsHovered && otherModelsRef.current && modelDropdownRef.current) {
        const buttonRect = otherModelsRef.current.getBoundingClientRect();
        const mainDropdownRect = modelDropdownRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 384; // max-h-96 = 384px
        let top = buttonRect.top;
        if (buttonRect.top + dropdownHeight > viewportHeight) {
          top = viewportHeight - dropdownHeight - 8;
          if (top < 8) {
            top = 8;
          }
        }
        
        const left = mainDropdownRect.left - 8;
        setOtherModelsDropdownPosition({
          top: top,
          left: left,
        });
      }
    };

    updateOtherModelsPosition();
    
    window.addEventListener('scroll', updateOtherModelsPosition, true);
    window.addEventListener('resize', updateOtherModelsPosition);
    
    return () => {
      window.removeEventListener('scroll', updateOtherModelsPosition, true);
      window.removeEventListener('resize', updateOtherModelsPosition);
    };
  }, [isOtherModelsHovered]);

  // Panel 1 Other Models position calculation
  useEffect(() => {
    const updateOtherModelsPosition1 = () => {
      if (isOtherModelsHovered1 && otherModelsRef1.current && modelDropdownRef1.current) {
        const buttonRect = otherModelsRef1.current.getBoundingClientRect();
        const mainDropdownRect = modelDropdownRef1.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 256; // max-h-64 = 256px
        let top = buttonRect.top;
        if (buttonRect.top + dropdownHeight > viewportHeight) {
          top = viewportHeight - dropdownHeight - 8;
          if (top < 8) {
            top = 8;
          }
        }
        
        const left = mainDropdownRect.right + 8;
        setOtherModelsDropdownPosition1({
          top: top,
          left: left,
        });
      }
    };

    if (isOtherModelsHovered1) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updateOtherModelsPosition1();
      });
    }
    
    window.addEventListener('scroll', updateOtherModelsPosition1, true);
    window.addEventListener('resize', updateOtherModelsPosition1);
    
    return () => {
      window.removeEventListener('scroll', updateOtherModelsPosition1, true);
      window.removeEventListener('resize', updateOtherModelsPosition1);
    };
  }, [isOtherModelsHovered1]);

  const agents = [
    { name: 'Deep Research', icon: FileText },
    { name: 'Web Creator', icon: Layout },
    { name: 'AI Writer', icon: PenTool },
    { name: 'AI Slides', icon: Presentation },
  ];

  const wisebaseItems = [
    { name: 'Demo: Introduction...', icon: FileText, color: 'bg-purple-100 dark:bg-purple-900/30', isActive: true },
    { name: 'Demo: Research on...', icon: Folder, color: 'bg-orange-100 dark:bg-orange-900/30' },
    { name: 'Demo: NVIDIA Busin...', icon: BarChart3, color: 'bg-green-100 dark:bg-green-900/30' },
    { name: 'AI Inbox', icon: MessageCircle, color: 'bg-gray-100 dark:bg-gray-700/30' },
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

  // Sync pathname with activeView using useLayoutEffect to prevent flash
  // This runs synchronously before browser paint, preventing visual flash
  useLayoutEffect(() => {
    const syncPathname = getPathnameSync();
    const newActiveView = getInitialActiveView(syncPathname || pathname);
    if (newActiveView !== activeView) {
      setActiveView(newActiveView);
    }
    // Update deepResearchTab based on pathname
    if (pathname?.startsWith('/wisebase/scholar-research')) {
      setDeepResearchTab('scholar');
    } else if (pathname?.startsWith('/wisebase/deep-research')) {
      setDeepResearchTab('general');
    }
  }, [pathname, activeView]);

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

  // Sync activeView with pathname
  useEffect(() => {
    if (pathname === '/wisebase/deep-research') {
      setActiveView('deep-research');
    } else if (pathname === '/wisebase/web-creator') {
      setActiveView('web-creator');
    } else if (pathname === '/wisebase/ai-writer') {
      setActiveView('ai-writer');
    } else if (pathname === '/wisebase/ai-slides') {
      setActiveView('ai-slides');
    } else if (pathname === '/chat' || pathname === '/') {
      setActiveView('chat');
    }
  }, [pathname]);

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

  // Models are now hardcoded in AVAILABLE_MODELS constant

  // Close model dropdown and attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
      if (
        modelDropdownRef1.current &&
        !modelDropdownRef1.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen1(false);
      }
      if (
        modelDropdownRef2.current &&
        !modelDropdownRef2.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen2(false);
      }
      if (
        translateDropdownRef.current &&
        !translateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTranslateDropdownOpen(null);
      }
      if (
        chatControlsRef.current &&
        chatControlsButtonRef.current &&
        !chatControlsRef.current.contains(event.target as Node) &&
        !chatControlsButtonRef.current.contains(event.target as Node)
      ) {
        setIsChatControlsOpen(false);
      }
      if (
        imageModelDropdownRef.current &&
        imageModelButtonRef.current &&
        !imageModelDropdownRef.current.contains(event.target as Node) &&
        !imageModelButtonRef.current.contains(event.target as Node)
      ) {
        setIsImageModelDropdownOpen(false);
      }
      if (
        languageDropdownRef.current &&
        languageButtonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) &&
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
      
      if (openMenuId !== null && !deleteConfirmOpen) {
        const clickedInsideMenu = Object.values(menuRefs.current).some(
          (menuRef) => menuRef && menuRef.contains(event.target as Node)
        );
        if (!clickedInsideMenu) {
          setOpenMenuId(null);
        }
      }
    };

    const shouldAddListener = isModelDropdownOpen || isModelDropdownOpen1 || isModelDropdownOpen2 || isTranslateDropdownOpen !== null || isChatControlsOpen || isImageModelDropdownOpen || isLanguageDropdownOpen || openMenuId !== null;
    
    if (shouldAddListener) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Always return a cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen, isModelDropdownOpen1, isModelDropdownOpen2, isTranslateDropdownOpen, isChatControlsOpen, isImageModelDropdownOpen, isLanguageDropdownOpen, openMenuId]);

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    setIsAttachmentDropdownOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      const newPreviews = fileArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        isUploading: true,
        isImage: file.type.startsWith('image/'),
      }));
      
      // Add previews immediately with uploading state
      setFilePreviews((prev) => [...prev, ...newPreviews]);
      
      console.log('Files selected:', fileArray.length, 'Image files:', newPreviews.length);
      console.log('New previews created:', newPreviews);
      
      // Upload files immediately using upload-directly API
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required. Please login first.');
        // Remove previews if auth fails
        setFilePreviews((prev) => {
          const newPreviewNames = new Set(newPreviews.map(p => p.file.name));
          return prev.filter(p => !newPreviewNames.has(p.file.name));
        });
        return;
      }

      // Upload each file and get file IDs
      const uploadedPreviews = await Promise.all(
        newPreviews.map(async (preview) => {
          try {
            const formData = new FormData();
            formData.append('file', preview.file);
            formData.append('tz_name', '');
            formData.append('meta', '');
            formData.append('app_name', '');
            formData.append('hash', '');
            formData.append('tasks', '[]');
            formData.append('mime', '');
            formData.append('conversation_id', '');
            formData.append('app_version', '');

            const response = await fetch(getApiUrl(API_ENDPOINTS.FILES.UPLOAD_DIRECTLY), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken.trim()}`,
                'accept': 'application/json',
              },
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ detail: 'Failed to upload file' }));
              console.error('Error uploading file:', errorData);
              return { ...preview, fileId: undefined };
            }

            const data = await response.json();
            // Extract file ID and CDN URL from response: { code: 0, data: { fileID: "...", cdnURL: "...", ... } }
            const fileId = data?.data?.fileID || data?.data?.id;
            const cdnURL = data?.data?.cdnURL || data?.data?.signedCDNURL;
            console.log('File uploaded successfully:', {
              fileId,
              filename: preview.file.name,
              cdnURL,
            });
            return { ...preview, fileId, cdnURL, isUploading: false };
          } catch (error) {
            console.error(`Error uploading file ${preview.file.name}:`, error);
            return { ...preview, fileId: undefined, isUploading: false };
          }
        })
      );
      
      // Update file previews with uploaded data
      setFilePreviews((prev) => {
        const updated = prev.map((prevPreview) => {
          const uploaded = uploadedPreviews.find(
            (up) => up.file.name === prevPreview.file.name && prevPreview.isUploading
          );
          if (uploaded) {
            return { ...uploaded, isUploading: false };
          }
          return prevPreview;
        });
        console.log('Updated filePreviews:', updated.length, 'previews');
        return updated;
      });
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const preview = filePreviews[index];
    // Revoke object URL to free memory
    URL.revokeObjectURL(preview.preview);
    
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtractText = async () => {
    const message = 'Extract text from this image';
    const fileIds = filePreviews.map(preview => preview.fileId).filter((id): id is string => !!id);
    // Use CDN URLs if available, otherwise use object URLs
    const imagePreviews = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL || p.preview);
    const imageUrls = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL)
      .filter((url): url is string => !!url);
    
    // Store object URLs for cleanup later
    const objectUrlsToCleanup = filePreviews
      .filter(p => !p.cdnURL)
      .map(p => p.preview);
    
    // Clear file previews immediately when button is clicked
    if (filePreviews.length > 0) {
      setFilePreviews([]);
    }
    
    if (viewMode === 'double') {
      if (isGenerating || isGenerating2) return;
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
        sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController1, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
      if (isPanel2Open) {
        sendMessageToPanel(2, message, selectedModel2, conversationId2, setConversationId2, setMessages2, setIsGenerating2, abortController2, fileIds, imagePreviews, imageUrls, undefined);
      }
    } else {
      if (isGenerating) return;
      const abortController = new AbortController();
      await sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
    }
  };

  const handleMathSolver = async () => {
    const message = 'Solve the math problems in this image';
    const fileIds = filePreviews.map(preview => preview.fileId).filter((id): id is string => !!id);
    // Use CDN URLs if available, otherwise use object URLs
    const imagePreviews = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL || p.preview);
    const imageUrls = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL)
      .filter((url): url is string => !!url);
    
    // Store object URLs for cleanup later
    const objectUrlsToCleanup = filePreviews
      .filter(p => !p.cdnURL)
      .map(p => p.preview);
    
    // Clear file previews immediately when button is clicked
    if (filePreviews.length > 0) {
      setFilePreviews([]);
    }
    
    if (viewMode === 'double') {
      if (isGenerating || isGenerating2) return;
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
        sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController1, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
      if (isPanel2Open) {
        sendMessageToPanel(2, message, selectedModel2, conversationId2, setConversationId2, setMessages2, setIsGenerating2, abortController2, fileIds, imagePreviews, imageUrls, undefined);
      }
    } else {
      if (isGenerating) return;
      const abortController = new AbortController();
      await sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
    }
  };

  const handleTranslate = async (languageCode: string, languageName: string) => {
    setIsTranslateDropdownOpen(null);
    const message = `Translate the text in this image to ${languageName}`;
    const fileIds = filePreviews.map(preview => preview.fileId).filter((id): id is string => !!id);
    // Use CDN URLs if available, otherwise use object URLs
    const imagePreviews = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL || p.preview);
    const imageUrls = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL)
      .filter((url): url is string => !!url);
    
    // Store object URLs for cleanup later
    const objectUrlsToCleanup = filePreviews
      .filter(p => !p.cdnURL)
      .map(p => p.preview);
    
    // Clear file previews immediately when button is clicked
    if (filePreviews.length > 0) {
      setFilePreviews([]);
    }
    
    if (viewMode === 'double') {
      if (isGenerating || isGenerating2) return;
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
        sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController1, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
      if (isPanel2Open) {
        sendMessageToPanel(2, message, selectedModel2, conversationId2, setConversationId2, setMessages2, setIsGenerating2, abortController2, fileIds, imagePreviews, imageUrls, undefined);
      }
    } else {
      if (isGenerating) return;
      const abortController = new AbortController();
      await sendMessageToPanel(1, message, selectedModel, conversationId, setConversationId, setMessages, setIsGenerating, abortController, fileIds, imagePreviews, imageUrls, undefined).finally(() => {
        // Revoke object URLs after message is sent (with delay)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
    }
  };

  const handleImageClick = (filePreviewIndex: number) => {
    const imageIndex = imagePreviewItems.findIndex(
      (item) => item.originalIndex === filePreviewIndex
    );
    if (imageIndex < 0) return;
    setSelectedImageIndex(imageIndex);
    setIsImageMinimized(false);
    setIsImageMaximized(false);
    setImageZoom(1);
  };

  const handleCloseImageModal = () => {
    setSelectedImageIndex(null);
    setIsImageMinimized(false);
    setIsImageMaximized(false);
    setImageZoom(1);
  };


  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setImageZoom(1);
  };

  const handleNewChat = () => {
    setMessages([]);
    setMessages2([]);
    setConversationId(null);
    setConversationId2(null);
    setInputValue('');
    setFilePreviews([]);
    setIsChatHistoryOpen(false);
  };

  const handleStarChat = (chatId: string) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, starred: !chat.starred } : chat
      )
    );
  };

  const handleDeleteChatClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Opening delete confirmation for chat:', chatId);
    setConversationToDelete(chatId);
    setDeleteConfirmOpen(true);
  };

  // Handle edit title click - open modal
  const handleEditTitleClick = (chatId: string, currentTitle: string) => {
    setConversationToEdit(chatId);
    setEditTitleValue(currentTitle);
    setEditTitleModalOpen(true);
  };

  // Handle edit title API call
  const handleEditTitle = async () => {
    if (!conversationToEdit || !editTitleValue.trim() || isUpdatingTitle) return;

    setIsUpdatingTitle(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required');
        setIsUpdatingTitle(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      // Call update API (typically PUT or PATCH)
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.CONVERSATIONS.UPDATE)}/${conversationToEdit}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: editTitleValue.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation title updated:', data);
        
        // Update chat history with new title
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === conversationToEdit ? { ...chat, title: editTitleValue.trim() } : chat
          )
        );
        
        setEditTitleModalOpen(false);
        setConversationToEdit(null);
        setEditTitleValue('');
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update conversation title' }));
        console.error('Failed to update conversation title:', errorData);
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!conversationToDelete || isDeleting) return;

    const chatId = conversationToDelete;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required');
        setDeleteConfirmOpen(false);
        setConversationToDelete(null);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      // Call delete API
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.CONVERSATIONS.DELETE)}/${chatId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation deleted:', data);
        
        // Update chat history by removing the deleted chat
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
        
        // If the deleted conversation is currently open, clear it
        if (conversationId === chatId) {
          setConversationId(null);
          setMessages([]);
          setInputValue('');
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete conversation' }));
        console.error('Failed to delete conversation:', errorData);
        // Still remove from UI if it's a 404 (already deleted) or show error
        if (response.status === 404) {
          setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Optionally show error to user, but don't remove from UI if API call failed
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleDeleteAllConversations = async () => {
    if (isDeletingAll) return;

    setIsDeletingAll(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required');
        setDeleteAllConfirmOpen(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      // Call delete all API
      const response = await fetch(getApiUrl(API_ENDPOINTS.CONVERSATIONS.DELETE_ALL), {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('All conversations deleted:', data);
        
        // Clear chat history
        setChatHistory([]);
        
        // Clear current conversation if open
        setConversationId(null);
        setMessages([]);
        setInputValue('');
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete all conversations' }));
        console.error('Failed to delete all conversations:', errorData);
        alert(errorData.detail || 'Failed to delete all conversations');
      }
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      alert('An error occurred while deleting all conversations');
    } finally {
      setIsDeletingAll(false);
      setDeleteAllConfirmOpen(false);
    }
  };

  const getFilteredChatHistory = () => {
    let filtered = chatHistory;
    
    if (chatHistoryTab === 'starred') {
      filtered = filtered.filter((chat) => chat.starred);
    }
    
    if (chatHistorySearch.trim()) {
      const searchLower = chatHistorySearch.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.title.toLowerCase().includes(searchLower) ||
          chat.preview.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const formatChatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = today.getTime() - chatDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return 'This Month';
    return 'Earlier';
  };

  // Handle mouse wheel zoom
  useEffect(() => {
    if (selectedImageIndex !== null && imageModalRef.current) {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.deltaY < 0) {
            setImageZoom((prev) => Math.min(prev + 0.25, 5));
          } else {
            setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
          }
        }
      };
      const modalElement = imageModalRef.current;
      modalElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        modalElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [selectedImageIndex]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.preview);
      });
    };
  }, [filePreviews]);

  // Save chat to history when conversation is created or messages are sent
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      const firstUserMessage = messages.find((msg) => msg.role === 'user');
      const lastAssistantMessage = messages.filter((msg) => msg.role === 'assistant').pop();
      
      if (firstUserMessage) {
        const existingChatIndex = chatHistory.findIndex((chat) => chat.id === conversationId);
        const chatItem: ChatHistoryItem = {
          id: conversationId,
          title: firstUserMessage.content.substring(0, 50) || 'New Chat',
          preview: lastAssistantMessage?.content.substring(0, 100) || firstUserMessage.content.substring(0, 100) || 'No preview',
          timestamp: new Date(),
          starred: existingChatIndex >= 0 ? chatHistory[existingChatIndex].starred : false,
        };

        if (existingChatIndex >= 0) {
          setChatHistory((prev) =>
            prev.map((chat, index) => (index === existingChatIndex ? chatItem : chat))
          );
        } else {
          setChatHistory((prev) => [chatItem, ...prev]);
        }
      }
    }
  }, [messages, conversationId]);

  const extractImageUrls = (message: any): string[] | undefined => {
    if (!message) return undefined;
    const urls = new Set<string>();

    const addUrl = (value?: unknown) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          urls.add(trimmed);
        }
      }
    };

    const addFromArray = (value?: unknown) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string') {
            addUrl(item);
          } else if (item && typeof item === 'object') {
            addUrl((item as { url?: string }).url);
          }
        });
      }
    };

    addFromArray(message.images);
    addFromArray(message.image_urls);
    addFromArray(message.imageUrls);
    addUrl(message.image_url);
    addUrl(message.imageUrl);

    if (Array.isArray(message.attachments)) {
      message.attachments.forEach((attachment: any) => {
        if (attachment) {
          addUrl(attachment.url || attachment.image_url || attachment.imageUrl);
        }
      });
    }

    return urls.size > 0 ? Array.from(urls) : undefined;
  };

  const fetchConversation = async (conversationId: string): Promise<void> => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) return;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      const response = await fetch(`${getApiUrl(API_ENDPOINTS.CONVERSATIONS.GET)}/${conversationId}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation details fetched:', data);
        if (data.code === 0 && data.data) {
          const convData = data.data;
          setConversationId(conversationId);
          if (convData.messages && Array.isArray(convData.messages)) {
            const loadedMessages: Message[] = convData.messages.map((msg: any) => ({
              id: msg.id || `${Date.now()}-${Math.random()}`,
              role: msg.role || 'assistant',
              content: msg.content || msg.text || '',
              isGenerating: false,
              images: extractImageUrls(msg),
              model: msg.model,
            }));
            setMessages(loadedMessages);
          } else {
            setMessages([]);
          }
          setIsChatHistoryOpen(false);
        }
      } else {
        console.error('Failed to fetch conversation:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleChatHistoryItemClick = (chatId: string) => {
    setViewMode('single');
    fetchConversation(chatId);
  };

  // List all conversations
  const listConversations = async (): Promise<void> => {
    try {
      setIsLoadingChatHistory(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        setIsLoadingChatHistory(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.CONVERSATIONS.LIST), {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversations listed:', data);
        let conversations: any[] = [];
        if (data.code === 0 && data.data) {
          if (Array.isArray(data.data)) {
            conversations = data.data;
          } else if (Array.isArray(data.data.conversations)) {
            conversations = data.data.conversations;
          } else if (Array.isArray(data.data.items)) {
            conversations = data.data.items;
          }
        } else if (Array.isArray(data)) {
          conversations = data;
        } else if (data.conversations && Array.isArray(data.conversations)) {
          conversations = data.conversations;
        }
        
        if (conversations.length > 0) {
          const mappedHistory: ChatHistoryItem[] = conversations.map((conv: any) => {
            const id = conv.id || conv.conversation_id || conv._id || '';
            const title = conv.title || conv.name || 'New Chat';
            const preview = conv.preview || conv.last_message || conv.lastMessage || conv.description || title || 'No preview';
            const timestamp = conv.created_at ? new Date(conv.created_at) : 
                            (conv.createdAt ? new Date(conv.createdAt) : 
                            (conv.updated_at ? new Date(conv.updated_at) : 
                            (conv.updatedAt ? new Date(conv.updatedAt) : new Date())));
            const starred = conv.starred || conv.is_starred || false;
            
            return {
              id,
              title,
              preview: preview.substring(0, 100),
              timestamp,
              starred,
            };
          });
          
          mappedHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setChatHistory(mappedHistory);
        } else {
          setChatHistory([]);
        }
      } else {
        console.error('Failed to fetch conversations:', response.statusText);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error listing conversations:', error);
      setChatHistory([]);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  // Upload files to the API
  const uploadFiles = async (files: File[], abortController: AbortController): Promise<string[]> => {
    if (files.length === 0) return [];
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken || !authToken.trim()) {
      throw new Error('Authentication required. Please login first.');
    }

    const uploadedFileIds: string[] = [];

    // Upload each file
    for (const file of files) {
      try {
        const formData = new FormData();
        // Try different field names that APIs commonly use
        formData.append('file', file);
        // Some APIs also expect the filename explicitly
        formData.append('filename', file.name);

        const response = await fetch(getApiUrl(API_ENDPOINTS.FILES.UPLOAD), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken.trim()}`,
            // Don't set Content-Type - let browser set it automatically for FormData with correct boundary
          },
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorData;
          let errorText = '';
          try {
            errorData = await response.json();
          } catch {
            try {
              errorText = await response.text();
              errorData = { detail: errorText || `Failed to upload file: ${file.name} (Status: ${response.status})` };
            } catch {
              errorData = { detail: `Failed to upload file: ${file.name} (Status: ${response.status})` };
            }
          }
          
          if (response.status === 401 || errorData.detail === 'Authentication required') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw new Error('Session expired. Please login again.');
          }
          
          // Log the full error for debugging
          console.error('File upload error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            errorText: errorText,
            file: file.name,
            fileSize: file.size,
            fileType: file.type,
            url: getApiUrl(API_ENDPOINTS.FILES.UPLOAD)
          });
          
          // Show more detailed error message
          const errorMessage = errorData.detail || errorData.message || errorData.error || errorText || `Failed to upload file: ${file.name} (Status: ${response.status})`;
          throw new Error(errorMessage);
        }

          const data = await response.json();
        // Extract file ID from response structure: { code: 0, msg: "", data: { id: "...", ... } }
        const fileId = data?.data?.id || data?.id || data?.file_id || data?.data?.file_id;
        if (fileId) {
          uploadedFileIds.push(fileId);
          console.log('File uploaded successfully:', {
            fileId: fileId,
            filename: data?.data?.original_filename || file.name,
            fileType: data?.data?.file_type || data?.data?.mime_type
          });
        } else {
          console.warn('File uploaded but no ID returned. Full response:', data);
          throw new Error('File uploaded but no file ID returned from server');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    }

    return uploadedFileIds;
  };

  const sendMessageToPanel = async (
    panelNumber: 1 | 2,
    messageText: string,
    model: string,
    conversationIdState: string | null,
    setConversationIdState: (id: string | null) => void,
    setMessagesState: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsGeneratingState: (value: boolean) => void,
    abortController: AbortController,
    fileIds?: string[], // File IDs (files are already uploaded when attached)
    imagePreviews?: string[], // Optional preview URLs to use instead of creating new ones
    imageUrls?: string[], // CDN URLs for images (used with send API)
    pdfFiles?: Array<{ name: string; url: string; type: string }> // PDF file information
  ) => {
    // Only store CDN URLs in messages (not blob URLs that get revoked)
    // Filter out invalid/empty URLs
    const validImageUrls = imagePreviews?.filter((url): url is string => {
      if (!url || typeof url !== 'string') return false;
      // Only include CDN URLs (http/https), exclude blob URLs
      return url.startsWith('http://') || url.startsWith('https://');
    });

    if (validImageUrls && validImageUrls.length > 0) {
      console.log(`Storing images in user message (panel ${panelNumber}):`, validImageUrls);
    }

    // Filter PDF files to only include CDN URLs
    const validPdfFiles = pdfFiles?.filter((file) => {
      return file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'));
    });

    if (validPdfFiles && validPdfFiles.length > 0) {
      console.log(`Storing PDF files in user message (panel ${panelNumber}):`, validPdfFiles);
    }

    const userMessage: Message = {
      id: `${Date.now()}-${panelNumber}`,
      role: 'user',
      content: messageText,
      images: validImageUrls && validImageUrls.length > 0 ? validImageUrls : undefined,
      files: validPdfFiles && validPdfFiles.length > 0 ? validPdfFiles : undefined,
    };

    setMessagesState((prev) => [...prev, userMessage]);

    const aiMessageId = `${Date.now() + 1}-${panelNumber}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isGenerating: true,
      model: model,
    };
    setMessagesState((prev) => [...prev, aiMessage]);
    setIsGeneratingState(true);

    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken || !authToken.trim()) {
        throw new Error('Authentication required. Please login first.');
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      // Step 1: Create conversation if it doesn't exist
      let currentConversationId = conversationIdState;
      if (!currentConversationId) {
        try {
          const conversationResponse = await fetch(getApiUrl(API_ENDPOINTS.CONVERSATIONS.CREATE), {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: messageText.substring(0, 50) || 'New Conversation',
              model: model,
            }),
            signal: abortController.signal,
          });

          if (!conversationResponse.ok) {
            const errorData = await conversationResponse.json().catch(() => ({ detail: 'Failed to create conversation' }));
            if (conversationResponse.status === 422 && errorData.detail) {
              const errorMsg = Array.isArray(errorData.detail) 
                ? errorData.detail.map((e: { msg?: string; message?: string }) => e.msg || e.message).join(', ')
                : errorData.detail;
              throw new Error(`Validation error: ${errorMsg}`);
            }
            throw new Error(errorData.detail || errorData.message || 'Failed to create conversation');
          }

          const conversationData = await conversationResponse.json();
          currentConversationId = conversationData?.data?.id || conversationData?.id || conversationData?.conversation_id || conversationData?.data?.conversation_id || null;
          
          if (currentConversationId) {
            setConversationIdState(currentConversationId);
          } else {
            throw new Error('Failed to get conversation ID from response');
        }
      } catch (error) {
          // Don't throw if request was aborted
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          console.error('Error creating conversation:', error);
          throw error;
        }
      }

      // Step 2: Determine which API to use based on whether images are present
      // Step 3: Send message using appropriate API
      let response;
      let responseData;
      
      // If images are present, use /api/chat/send with image_url
      if (imageUrls && imageUrls.length > 0) {
        const requestBody = {
          message: messageText,
          model: model || 'gpt-4o-mini',
          conversation_id: currentConversationId,
          stream: false,
          image_url: imageUrls[0], // Use first image URL
        };
        
        console.log('Sending message with images using send API:', {
          message: messageText,
          model: model || 'gpt-4o-mini',
          conversation_id: currentConversationId,
          image_url: imageUrls[0],
        });
        
        response = await fetch(getApiUrl(API_ENDPOINTS.CHAT.SEND), {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
          if (response.status === 401 || errorData.detail === 'Authentication required') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw new Error('Session expired. Please login again.');
          }
          throw new Error(errorData.detail || errorData.msg || 'Failed to send message');
        }

        responseData = await response.json();
        
        // Check again if request was aborted after response
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }
        
        // Check one more time before processing response
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }
        
        // Handle send API response: { code: 0, msg: "", data: { text: "...", conversation_id: "...", tokens_used: ... } }
        if (responseData.code === 0 && responseData.data) {
          const { text, conversation_id: cid, tokens_used } = responseData.data;
          
          // Check again before updating state
          if (abortController.signal.aborted) {
            setIsGeneratingState(false);
            setMessagesState((prev) =>
              prev.filter((msg) => msg.id !== aiMessageId)
            );
            return;
          }
          
          // Update conversation ID if provided
          if (cid) {
            setConversationIdState(cid);
          }
          
          // Update message with response text (only if message still exists - wasn't removed by stop)
          setMessagesState((prev) => {
            const messageExists = prev.find((msg) => msg.id === aiMessageId);
            if (!messageExists) {
              // Message was removed by stop, don't update
              return prev;
            }
            return prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: text || '', isGenerating: false }
                : msg
            );
          });
          
          console.log('Message completed:', { cid, tokens_used });
          setIsGeneratingState(false);

        } else {
          throw new Error(responseData.msg || 'Invalid response format');
        }
      } else {
        // No images, use completions API
        const requestBody: CompletionRequestBody = {
          cid: currentConversationId,
          model: model || 'gpt-4o-mini',
          multi_content: [
            {
              type: 'text',
              text: messageText
            }
          ],
          ...(fileIds && fileIds.length > 0 ? { file_ids: fileIds } : {}),
        };
        
        console.log('Sending message without images using completions API:', {
          message: messageText,
          model: model || 'gpt-4o-mini',
          conversation_id: currentConversationId,
          file_ids: fileIds && fileIds.length > 0 ? fileIds : 'none',
          file_count: fileIds ? fileIds.length : 0
        });
        
        response = await fetch(getApiUrl(API_ENDPOINTS.CHAT.COMPLETIONS), {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
          if (response.status === 401 || errorData.detail === 'Authentication required') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw new Error('Session expired. Please login again.');
          }
          throw new Error(errorData.detail || errorData.msg || 'Failed to send message');
        }

        responseData = await response.json();
        
        // Check again if request was aborted after response
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }
        
        // Check one more time before processing response
        if (abortController.signal.aborted) {
          setIsGeneratingState(false);
          setMessagesState((prev) =>
            prev.filter((msg) => msg.id !== aiMessageId)
          );
          return;
        }
        
        // Handle completions API response: { code: 0, msg: "", data: { id, text, cid, tokens_used, model, parent_message_id } }
        if (responseData.code === 0 && responseData.data) {
          const { text, cid, id, tokens_used, model: responseModel, parent_message_id } = responseData.data;
          
          // Check again before updating state
          if (abortController.signal.aborted) {
            setIsGeneratingState(false);
            setMessagesState((prev) =>
              prev.filter((msg) => msg.id !== aiMessageId)
            );
            return;
          }
          
          // Update conversation ID if provided
          if (cid) {
            setConversationIdState(cid);
          }
          
          // Update message with response text (only if message still exists - wasn't removed by stop)
          setMessagesState((prev) => {
            const messageExists = prev.find((msg) => msg.id === aiMessageId);
            if (!messageExists) {
              // Message was removed by stop, don't update
              return prev;
            }
            return prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: text || '', isGenerating: false }
                : msg
            );
          });
          
          console.log('Message completed:', { id, cid, tokens_used, model: responseModel, parent_message_id });
          setIsGeneratingState(false);

        } else {
          throw new Error(responseData.msg || 'Invalid response format');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted - remove the message completely (no response should be shown)
        setIsGeneratingState(false);
        setMessagesState((prev) =>
          prev.filter((msg) => msg.id !== aiMessageId)
        );
        return;
      }
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, an error occurred. Please try again.';
      
      setMessagesState((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: errorMessage, isGenerating: false }
            : msg
        )
      );
      setIsGeneratingState(false);
    }
  };

  const handleSuggestedPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    
    if (viewMode === 'double') {
      // Send to both panels
      if (isGenerating || isGenerating2) return;
      
      const messageText = promptText.trim();
      
      // Abort previous requests if any
      if (abortController1Ref.current) {
        abortController1Ref.current.abort();
      }
      if (abortController2Ref.current) {
        abortController2Ref.current.abort();
      }
      
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
      abortController1Ref.current = abortController1;
      abortController2Ref.current = abortController2;
      
      // Send to panel 1
      sendMessageToPanel(
        1,
        messageText,
        selectedModel,
        conversationId,
        setConversationId,
        setMessages,
        setIsGenerating,
        abortController1,
        [],
        []
      ).finally(() => {
        abortController1Ref.current = null;
      });
      
      // Send to panel 2
      if (isPanel2Open) {
        sendMessageToPanel(
          2,
          messageText,
          selectedModel2,
          conversationId2,
          setConversationId2,
          setMessages2,
          setIsGenerating2,
          abortController2,
          [],
          []
        ).finally(() => {
          abortController2Ref.current = null;
        });
      }
    } else {
      // Single view
      if (isGenerating) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: promptText.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const messageText = promptText.trim();
      setIsGenerating(true);

      // Create AI message placeholder
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        isGenerating: true,
        model: selectedModel,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Get auth token from localStorage
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken || !authToken.trim()) {
          throw new Error('Authentication required. Please login first.');
        }
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken.trim()}`,
        };

        // Step 1: Create conversation if it doesn't exist
        let currentConversationId = conversationId;
        if (!currentConversationId) {
          try {
            const conversationResponse = await fetch(getApiUrl(API_ENDPOINTS.CONVERSATIONS.CREATE), {
              method: 'POST',
              headers,
              body: JSON.stringify({
                title: messageText.substring(0, 50) || 'New Conversation',
                model: selectedModel,
              }),
              signal: abortControllerRef.current.signal,
            });

            if (!conversationResponse.ok) {
              const errorData = await conversationResponse.json().catch(() => ({ detail: 'Failed to create conversation' }));
              if (conversationResponse.status === 422 && errorData.detail) {
                const errorMsg = Array.isArray(errorData.detail) 
                  ? errorData.detail.map((e: { msg?: string; message?: string }) => e.msg || e.message).join(', ')
                  : errorData.detail;
                throw new Error(`Validation error: ${errorMsg}`);
              }
              throw new Error(errorData.detail || errorData.message || 'Failed to create conversation');
            }

            const conversationData = await conversationResponse.json();
            currentConversationId = conversationData?.data?.id || conversationData?.id || conversationData?.conversation_id || conversationData?.data?.conversation_id || null;
            
            if (currentConversationId) {
              setConversationId(currentConversationId);
            } else {
              throw new Error('Failed to get conversation ID from response');
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              setIsGenerating(false);
              return;
            }
            console.error('Error creating conversation:', error);
            setMessages((prev) => prev.filter(m => m.id !== userMessage.id && m.id !== aiMessageId));
            setIsGenerating(false);
            throw error;
          }
        }

        // Step 2: Send message using completion API
        const requestBody: CompletionRequestBody = {
          cid: currentConversationId,
          model: selectedModel || 'webby fusion',
          multi_content: [
            {
              type: 'text',
              text: messageText
            }
          ],
        };
        
        const response = await fetch(getApiUrl(API_ENDPOINTS.CHAT.COMPLETIONS), {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
          throw new Error(errorData.detail || errorData.msg || errorData.message || 'Failed to send message');
        }

        // Step 3: Handle JSON response
        const responseData = await response.json();
        
        // Extract data from response structure: { code: 0, msg: "", data: { id, text, cid, tokens_used, model, parent_message_id } }
        if (responseData.code === 0 && responseData.data) {
          const { text, cid, id, tokens_used, model: responseModel, parent_message_id } = responseData.data;
          
          // Update conversation ID if provided
          if (cid) {
            setConversationId(cid);
          }
          
          // Update message with response text
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: text || '', isGenerating: false }
                : msg
            )
          );
          
          console.log('Message completed:', { id, cid, tokens_used, model: responseModel, parent_message_id });
          
          // Call GET APIs after successful chat completion
          const finalCid = cid || currentConversationId;
          if (finalCid) {
            // Call GET conversation details
            await fetchConversation(finalCid);
            // Call LIST conversations
            await listConversations();
          }
        } else {
          throw new Error(responseData.msg || 'Invalid response format');
        }
        
        setIsGenerating(false);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setIsGenerating(false);
          return;
        }
        console.error('Error sending message:', error);
        setMessages((prev) => prev.filter(m => m.id !== userMessage.id && m.id !== aiMessageId));
        setIsGenerating(false);
      } finally {
        abortControllerRef.current = null;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (viewMode === 'double') {
      // Send to both panels
      if (isGenerating || isGenerating2) return;
      
      const messageText = inputValue.trim();
      setInputValue('');
      
      // Abort previous requests if any
      if (abortController1Ref.current) {
        abortController1Ref.current.abort();
      }
      if (abortController2Ref.current) {
        abortController2Ref.current.abort();
      }
      
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
      abortController1Ref.current = abortController1;
      abortController2Ref.current = abortController2;
      
      // Get file IDs, image previews, and image URLs from filePreviews before clearing
      const fileIds = filePreviews.map(preview => preview.fileId).filter((id): id is string => !!id);
      // Use CDN URLs if available, otherwise use object URLs
      const imagePreviews = filePreviews
        .filter((p) => p.isImage)
        .map((p) => p.cdnURL || p.preview);
      const imageUrls = filePreviews
        .filter((p) => p.isImage)
        .map((p) => p.cdnURL)
        .filter((url): url is string => !!url);
      
      // Extract PDF file information
      const pdfFiles = filePreviews
        .filter((p) => !p.isImage && p.cdnURL)
        .map((p) => ({
          name: p.file.name,
          url: p.cdnURL!,
          type: p.file.type,
        }));
      
      // Store object URLs for cleanup later (only those without CDN URLs)
      const objectUrlsToCleanup = filePreviews
        .filter(p => !p.cdnURL)
        .map(p => p.preview);
      
      // Clear file previews immediately when send is clicked
      if (filePreviews.length > 0) {
        setFilePreviews([]);
      }
      
      // Send to panel 1
      sendMessageToPanel(
        1,
        messageText,
        selectedModel,
        conversationId,
        setConversationId,
        setMessages,
        setIsGenerating,
        abortController1,
        fileIds,
        imagePreviews,
        imageUrls,
        pdfFiles
      ).finally(() => {
        abortController1Ref.current = null;
        // Only revoke object URLs that aren't CDN URLs (after a delay to ensure message is rendered)
        setTimeout(() => {
          objectUrlsToCleanup.forEach((url) => {
            URL.revokeObjectURL(url);
          });
        }, 1000);
      });
      
      // Send to panel 2
      if (isPanel2Open) {
        sendMessageToPanel(
          2,
          messageText,
          selectedModel2,
          conversationId2,
          setConversationId2,
          setMessages2,
          setIsGenerating2,
          abortController2,
          fileIds,
          imagePreviews,
          imageUrls,
          pdfFiles
        ).finally(() => {
          abortController2Ref.current = null;
        });
      }
    } else {
      // Single view - original logic
      if (isGenerating) return;

    // Get file IDs, image previews, and image URLs from filePreviews before clearing
    const fileIds = filePreviews.map(preview => preview.fileId).filter((id): id is string => !!id);
    // Use CDN URLs if available, otherwise use object URLs
    const imagePreviews = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL || p.preview);
    const imageUrls = filePreviews
      .filter((p) => p.isImage)
      .map((p) => p.cdnURL)
      .filter((url): url is string => !!url);
    
    // Extract PDF file information
    const pdfFiles = filePreviews
      .filter((p) => !p.isImage && p.cdnURL)
      .map((p) => ({
        name: p.file.name,
        url: p.cdnURL!,
        type: p.file.type,
      }));
    
    // Only store CDN URLs in messages (not blob URLs that get revoked)
    // Filter out invalid/empty URLs
    const validImageUrls = imagePreviews?.filter((url): url is string => {
      if (!url || typeof url !== 'string') return false;
      // Only include CDN URLs (http/https), exclude blob URLs
      return url.startsWith('http://') || url.startsWith('https://');
    });

    if (validImageUrls && validImageUrls.length > 0) {
      console.log('Storing images in user message:', validImageUrls);
    }

    // Filter PDF files to only include CDN URLs
    const validPdfFiles = pdfFiles.filter((file) => {
      return file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'));
    });

    if (validPdfFiles && validPdfFiles.length > 0) {
      console.log('Storing PDF files in user message:', validPdfFiles);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      images: validImageUrls && validImageUrls.length > 0 ? validImageUrls : undefined,
      files: validPdfFiles && validPdfFiles.length > 0 ? validPdfFiles : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsGenerating(true);
    
    // Store object URLs for cleanup later (only those that aren't CDN URLs)
    const objectUrlsToCleanup = filePreviews
      .filter(p => !p.cdnURL)
      .map(p => p.preview);
    
    // Clear file previews immediately when send is clicked
    if (filePreviews.length > 0) {
      setFilePreviews([]);
    }

    // Create AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isGenerating: true,
      model: selectedModel,
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken || !authToken.trim()) {
        throw new Error('Authentication required. Please login first.');
      }
      
      const headers: HeadersInit = {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };

      // Step 1: Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        try {
          const conversationResponse = await fetch(getApiUrl(API_ENDPOINTS.CONVERSATIONS.CREATE), {
            method: 'POST',
            headers,
        body: JSON.stringify({
              title: messageText.substring(0, 50) || 'New Conversation', // Use first 50 chars of message as title
              model: selectedModel,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!conversationResponse.ok) {
            const errorData = await conversationResponse.json().catch(() => ({ detail: 'Failed to create conversation' }));
            // Handle validation errors (422)
            if (conversationResponse.status === 422 && errorData.detail) {
              const errorMsg = Array.isArray(errorData.detail) 
                ? errorData.detail.map((e: { msg?: string; message?: string }) => e.msg || e.message).join(', ')
                : errorData.detail;
              throw new Error(`Validation error: ${errorMsg}`);
            }
            throw new Error(errorData.detail || errorData.message || 'Failed to create conversation');
          }

          const conversationData = await conversationResponse.json();
          // Extract conversation_id from response structure: { code: 0, data: { id: "..." } }
          currentConversationId = conversationData?.data?.id || conversationData?.id || conversationData?.conversation_id || conversationData?.data?.conversation_id || null;
          
          if (currentConversationId) {
            setConversationId(currentConversationId);
            console.log('Conversation created with ID:', currentConversationId);
          } else {
            console.warn('Conversation created but no ID found in response:', conversationData);
            throw new Error('Failed to get conversation ID from response');
          }
        } catch (error) {
          // Don't throw if request was aborted
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          console.error('Error creating conversation:', error);
          throw new Error('Failed to create conversation. Please try again.');
        }
      }

      // Step 2: Determine which API to use based on whether images are present
      // Step 3: Send message using appropriate API
      let response;
      let responseData;

      // If images are present, use /api/chat/send with image_url
      if (imageUrls && imageUrls.length > 0) {
        const requestBody = {
          message: messageText,
          model: selectedModel || 'webby fusion',
          conversation_id: currentConversationId,
          stream: false,
          image_url: imageUrls[0], // Use first image URL
        };

        console.log('Sending message with images using send API:', {
          message: messageText,
          model: selectedModel || 'webby fusion',
          conversation_id: currentConversationId,
          image_url: imageUrls[0],
        });

          response = await fetch(getApiUrl(API_ENDPOINTS.CHAT.SEND), {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: abortControllerRef.current.signal,
          });

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
            if (response.status === 401 || errorData.detail === 'Authentication required') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(errorData.detail || errorData.msg || 'Failed to send message');
          }

          responseData = await response.json();

          // Check again if request was aborted after response
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          // Check one more time before processing response
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          // Handle send API response: { code: 0, msg: "", data: { text: "...", conversation_id: "...", tokens_used: ... } }
          if (responseData.code === 0 && responseData.data) {
            const { text, conversation_id: cid, tokens_used } = responseData.data;

            // Check again before updating state
            if (abortControllerRef.current?.signal.aborted) {
              setIsGenerating(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, isGenerating: false }
                    : msg
                )
              );
              return;
            }

            // Update conversation ID if provided
            if (cid) {
              setConversationId(cid);
            }

            // Update message with response text
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: text || '', isGenerating: false }
                  : msg
              )
            );

            console.log('Message completed:', { cid, tokens_used });

            // Call GET APIs after successful chat completion (only if not aborted)
            if (!abortControllerRef.current?.signal.aborted) {
              const finalCid = cid || currentConversationId;
              if (finalCid) {
                // Call GET conversation details
                await fetchConversation(finalCid);
              }
            }
          } else {
            throw new Error(responseData.msg || 'Invalid response format');
          }
        } else {
          // No images, use completions API
          const requestBody: CompletionRequestBody = {
            cid: currentConversationId,
            model: selectedModel || 'webby fusion',
            multi_content: [
              {
                type: 'text',
                text: messageText
              }
            ],
            ...(fileIds && fileIds.length > 0 ? { file_ids: fileIds } : {}),
          };

          console.log('Sending message without images using completions API:', {
            message: messageText,
            model: selectedModel || 'webby fusion',
            conversation_id: currentConversationId,
            file_ids: fileIds && fileIds.length > 0 ? fileIds : 'none',
            file_count: fileIds ? fileIds.length : 0
          });

          response = await fetch(getApiUrl(API_ENDPOINTS.CHAT.COMPLETIONS), {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: abortControllerRef.current.signal,
          });

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to send message' }));
            if (response.status === 401 || errorData.detail === 'Authentication required') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              throw new Error('Session expired. Please login again.');
            }
            throw new Error(errorData.detail || errorData.msg || 'Failed to send message');
          }

          responseData = await response.json();

          // Check again if request was aborted after response
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          // Check one more time before processing response
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, isGenerating: false }
                  : msg
              )
            );
            return;
          }

          // Handle completions API response: { code: 0, msg: "", data: { id, text, cid, tokens_used, model, parent_message_id } }
          if (responseData.code === 0 && responseData.data) {
            const { text, cid, id, tokens_used, model: responseModel, parent_message_id } = responseData.data;

            // Check again before updating state
            if (abortControllerRef.current?.signal.aborted) {
              setIsGenerating(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, isGenerating: false }
                    : msg
                )
              );
              return;
            }

            // Update conversation ID if provided
            if (cid) {
              setConversationId(cid);
            }

            // Update message with response text
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: text || '', isGenerating: false }
                  : msg
              )
            );

            console.log('Message completed:', { id, cid, tokens_used, model: responseModel, parent_message_id });

            // Call GET APIs after successful chat completion (only if not aborted)
            if (!abortControllerRef.current?.signal.aborted) {
              const finalCid = cid || currentConversationId;
              if (finalCid) {
                // Call GET conversation details
                await fetchConversation(finalCid);
              }
            }
          } else {
            throw new Error(responseData.msg || 'Invalid response format');
          }
        }

        // Revoke object URLs after message is sent (with delay to ensure message is rendered)
        if (objectUrlsToCleanup.length > 0) {
          setTimeout(() => {
            objectUrlsToCleanup.forEach((url) => {
              URL.revokeObjectURL(url);
            });
          }, 1000);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted - ensure state is cleaned up
          setIsGenerating(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, isGenerating: false }
                : msg
            )
          );
          abortControllerRef.current = null;
          return;
        }
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Sorry, an error occurred. Please try again.';

        // If authentication error, show specific message
        if (errorMessage.includes('Authentication') || errorMessage.includes('Session expired')) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: errorMessage, isGenerating: false }
                : msg
            )
          );
          // Optionally redirect to login after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: errorMessage, isGenerating: false }
                : msg
            )
          );
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStopGenerating = () => {
    // Immediately remove all generating messages (no response should be shown)
    setIsGenerating(false);
    setIsGenerating2(false);
    setMessages((prev) =>
      prev.filter((msg) => !msg.isGenerating)
    );
    setMessages2((prev) =>
      prev.filter((msg) => !msg.isGenerating)
    );

    // Then abort controllers
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (abortController1Ref.current) {
      abortController1Ref.current.abort();
      abortController1Ref.current = null;
    }
    if (abortController2Ref.current) {
      abortController2Ref.current.abort();
      abortController2Ref.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToolSlug = (toolName: string): string => {
    const slugMap: Record<string, string> = {
      'AI Image Generator': 'ai-image-generator',
      'Background Remover': 'background-remover',
      'Text Remover': 'text-remover',
      'Photo Eraser': 'photo-eraser',
      'Inpaint': 'inpaint',
      'Image Upscaler': 'image-upscaler',
      'Background Changer': 'background-changer',
      'AI Translator': 'ai-translator',
      'Image Translator': 'image-translator',
      'AI Video Shortener': 'ai-video-shortener',
    };
    return slugMap[toolName] || toolName.toLowerCase().replace(/\s+/g, '-');
  };

  const handleToolClick = (toolName: string) => {
    const slug = getToolSlug(toolName);
    // Check if it's a translator tool
    if (toolName === 'AI Translator' || toolName === 'Image Translator') {
      const translatorSlug = toolName === 'AI Translator' ? 'text-translator' : 'image-translator';
      const url = `/translator/${translatorSlug}`;
      window.open(url, '_blank');
    } else {
      const url = `/create/image/${slug}`;
      window.open(url, '_blank');
    }
  };

  // Action button handlers for assistant messages
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddToList = (messageId: string) => {
    console.log('Add to list:', messageId);
    // Implement add to list functionality
  };

  const handleRegenerate = (messageId: string) => {
    console.log('Regenerate:', messageId);
    // Implement regenerate functionality
  };

  const handleQuote = (content: string) => {
    console.log('Quote:', content);
    // Implement quote functionality
  };

  const handleShare = (messageId: string) => {
    console.log('Share:', messageId);
    // Implement share functionality
  };

  const handleReadAloud = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`relative ${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200 dark:border-gray-700`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Webby Sider
                </span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`${isSidebarCollapsed ? 'mx-auto' : ''} p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Layout className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto overflow-x-visible ${isSidebarCollapsed ? 'p-2' : 'p-4'} ${isSidebarCollapsed ? 'space-y-1' : 'space-y-6'}`}>
          {/* Chat */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setActiveView('chat');
                router.push('/chat');
              }}
              onMouseEnter={(e) => {
                if (isSidebarCollapsed) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltipPositions(prev => ({ ...prev, chat: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                  setHoveredItem('chat');
                }
              }}
              onMouseLeave={() => {
                setHoveredItem(null);
                setTooltipPositions(prev => {
                  const { chat: _, ...rest } = prev;
                  return rest;
                });
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'} rounded-lg ${isSidebarCollapsed ? 'mb-1' : 'mb-2'} transition-colors ${activeView === 'chat'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <MessageCircle className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
              {!isSidebarCollapsed && <span className="font-semibold">Chat</span>}
            </motion.button>
            {isSidebarCollapsed && hoveredItem === 'chat' && tooltipPositions.chat && (
              <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions.chat.top}px`, left: `${tooltipPositions.chat.left}px`, transform: 'translateY(-50%)' }}>
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                  Chat
                </div>
              </div>
            )}
          </div>

          {/* Agents */}
          <div className={isSidebarCollapsed ? 'mt-2' : ''}>
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
                Agents
              </h3>
            )}
            <div className="space-y-1">
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                const agentSlug = agent.name.toLowerCase().replace(/\s+/g, '-') as 'deep-research' | 'web-creator' | 'ai-writer' | 'ai-slides';
                // Deep Research should be active for both deep-research and scholar-research
                const isActive = agentSlug === 'deep-research'
                  ? (activeView === 'deep-research' || activeView === 'scholar-research')
                  : activeView === agentSlug;
                const handleAgentClick = () => {
                  // Use /agents/ route for web-creator, ai-writer, ai-slides
                  // Use /wisebase/ for deep-research
                  const route = agentSlug === 'deep-research'
                    ? `/wisebase/${agentSlug}`
                    : `/agents/${agentSlug}`;
                  // Set activeView immediately to prevent flash
                  setActiveView(agentSlug);
                  // Then navigate (this won't cause a full page reload in Next.js)
                  router.push(route);
                };
                return (
                  <div key={agent.name} className="relative">
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={handleAgentClick}
                      onMouseEnter={(e) => {
                        if (isSidebarCollapsed) {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltipPositions(prev => ({ ...prev, [`agent-${agent.name}`]: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                          setHoveredItem(`agent-${agent.name}`);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(null);
                        const key = `agent-${agent.name}`;
                        setTooltipPositions(prev => {
                          const { [key]: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Icon className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!isSidebarCollapsed && <span className="text-sm">{agent.name}</span>}
                    </motion.button>
                    {isSidebarCollapsed && hoveredItem === `agent-${agent.name}` && tooltipPositions[`agent-${agent.name}`] && (
                      <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions[`agent-${agent.name}`].top}px`, left: `${tooltipPositions[`agent-${agent.name}`].left}px`, transform: 'translateY(-50%)' }}>
                        <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                          {agent.name}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* More Dropdown */}
              <div
                ref={moreButtonRef}
                className="relative"
                onMouseEnter={() => {
                  setIsMoreHovered(true);
                  if (isSidebarCollapsed && moreButtonRef.current) {
                    const rect = moreButtonRef.current.getBoundingClientRect();
                    setTooltipPositions(prev => ({ ...prev, more: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                    setHoveredItem('more');
                  }
                }}
                onMouseLeave={() => {
                  setIsMoreHovered(false);
                  setHoveredItem(null);
                  setTooltipPositions(prev => {
                    const { more: _, ...rest } = prev;
                    return rest;
                  });
                }}
              >
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: agents.length * 0.1 }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3'} py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                >
                  <Grid3x3 className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="text-sm">More</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </motion.button>
                {isSidebarCollapsed && hoveredItem === 'more' && tooltipPositions.more && (
                  <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions.more.top}px`, left: `${tooltipPositions.more.left}px`, transform: 'translateY(-50%)' }}>
                    <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                      More
                    </div>
                  </div>
                )}

                {isMoreHovered && moreButtonRef.current && (
                  <>
                    {/* Invisible bridge to prevent hover loss */}
                    <div
                      className="fixed z-[9998] pointer-events-auto"
                      style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${moreButtonRef.current.getBoundingClientRect().right}px`,
                        width: '8px',
                        height: `${360}px`,
                      }}
                      onMouseEnter={() => setIsMoreHovered(true)}
                    />
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
                                onClick={() => handleToolClick(item.name)}
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
                                onClick={() => handleToolClick(item.name)}
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
                            onClick={() => handleToolClick('AI Video Shortener')}
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Wisebase */}
          <div className={isSidebarCollapsed ? 'mt-2' : ''}>
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
                Wisebase
              </h3>
            )}
            <div className="space-y-1">
              {wisebaseItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="relative">
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (agents.length + 1 + index) * 0.1 }}
                      onMouseEnter={(e) => {
                        if (isSidebarCollapsed) {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltipPositions(prev => ({ ...prev, [`wisebase-${item.name}`]: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                          setHoveredItem(`wisebase-${item.name}`);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(null);
                        const key = `wisebase-${item.name}`;
                        setTooltipPositions(prev => {
                          const { [key]: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3'} py-2 rounded-lg transition-colors ${isSidebarCollapsed
                        ? `${item.color} ${item.isActive ? 'shadow-sm' : ''} text-gray-700 dark:text-gray-300`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Icon className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!isSidebarCollapsed && <span className="text-sm">{item.name}</span>}
                    </motion.button>
                    {isSidebarCollapsed && hoveredItem === `wisebase-${item.name}` && tooltipPositions[`wisebase-${item.name}`] && (
                      <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions[`wisebase-${item.name}`].top}px`, left: `${tooltipPositions[`wisebase-${item.name}`].left}px`, transform: 'translateY(-50%)' }}>
                        <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                          {item.name}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Icons */}
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 dark:border-gray-700 flex ${isSidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-around'}`}>
          <div className="relative">
            <motion.button
              ref={userProfileButtonRef}
              onClick={handleUserProfileClick}
              onMouseEnter={(e) => {
                if (isSidebarCollapsed) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltipPositions(prev => ({ ...prev, profile: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                  setHoveredItem('profile');
                }
              }}
              onMouseLeave={() => {
                setHoveredItem(null);
                setTooltipPositions(prev => {
                  const { profile: _, ...rest } = prev;
                  return rest;
                });
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center transition-all hover:shadow-lg w-9 h-9"
            >
              <span className="text-white font-semibold text-sm">
                {getUserInitial()}
              </span>
            </motion.button>
            {isSidebarCollapsed && hoveredItem === 'profile' && tooltipPositions.profile && (
              <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions.profile.top}px`, left: `${tooltipPositions.profile.left}px`, transform: 'translateY(-50%)' }}>
                <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                  Profile
                </div>
              </div>
            )}
          </div>
          {[Folder, MessageCircle, Settings].map((Icon, i) => {
            const footerLabels = ['Folder', 'Message', 'Settings'];
            return (
              <div key={i} className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={(e) => {
                    if (isSidebarCollapsed) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltipPositions(prev => ({ ...prev, [`footer-${i}`]: { top: rect.top + rect.height / 2, left: rect.right + 8 } }));
                      setHoveredItem(`footer-${i}`);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                    const key = `footer-${i}`;
                    setTooltipPositions(prev => {
                      const { [key]: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
                {isSidebarCollapsed && hoveredItem === `footer-${i}` && tooltipPositions[`footer-${i}`] && (
                  <div className="fixed z-[9999] pointer-events-none" style={{ top: `${tooltipPositions[`footer-${i}`].top}px`, left: `${tooltipPositions[`footer-${i}`].left}px`, transform: 'translateY(-50%)' }}>
                    <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap relative">
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900 dark:border-r-gray-800"></div>
                      {footerLabels[i]}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">

        <header className="h-16 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex items-center justify-end px-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>
        </header>

        {/* Conditional Content Rendering */}
        {activeView === 'deep-research' ? (
          <DeepResearch
            activeTab={deepResearchTab}
            setActiveTab={setDeepResearchTab}
            inputValue={deepResearchInput}
            setInputValue={setDeepResearchInput}
            onSend={() => {
              if (!deepResearchInput.trim()) return;
              console.log('Sending Deep Research:', deepResearchInput);
              setDeepResearchInput('');
            }}
          />
        ) : activeView === 'scholar-research' ? (
          <ScholarResearch
            inputValue={scholarResearchInput}
            setInputValue={setScholarResearchInput}
            onSend={() => {
              if (!scholarResearchInput.trim()) return;
              console.log('Sending Scholar Research:', scholarResearchInput);
              setScholarResearchInput('');
            }}
          />
        ) : activeView === 'web-creator' ? (
          <WebCreator
            inputValue={webCreatorInput}
            setInputValue={setWebCreatorInput}
            onSend={() => {
              if (!webCreatorInput.trim()) return;
              console.log('Sending Web Creator:', webCreatorInput);
              setWebCreatorInput('');
            }}
          />
        ) : activeView === 'ai-writer' ? (
          <AIWriter
            inputValue={aiWriterInput}
            setInputValue={setAIWriterInput}
            onSend={() => {
              if (!aiWriterInput.trim()) return;
              console.log('Sending AI Writer:', aiWriterInput);
              setAIWriterInput('');
            }}
          />
        ) : activeView === 'ai-slides' ? (
          <AISlides
            inputValue={aiSlidesInput}
            setInputValue={setAISlidesInput}
            onSend={() => {
              if (!aiSlidesInput.trim()) return;
              console.log('Sending AI Slides:', aiSlidesInput);
              setAISlidesInput('');
            }}
          />
        ) : (
          /* Chat */
          <>
            {viewMode === 'double' ? (
              <div className="flex-1 flex overflow-hidden">
                {/* Panel 1 */}
                <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 relative">
                  {/* Panel Header */}
                  <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getSelectedModelImagePath(selectedModel) ? (
                          <img
                            src={getSelectedModelImagePath(selectedModel)!}
                            alt={selectedModel}
                            className="w-full h-full object-contain rounded-full"
                            width={20}
                            height={20}
                          />
                        ) : (
                          <Zap className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div ref={modelDropdownRef1} className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsModelDropdownOpen1(!isModelDropdownOpen1)}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white shadow-sm"
                        >
                          {availableModels.find((m) => m.name === selectedModel)?.displayName ||
                            OTHER_MODELS.find((m) => m.name === selectedModel)?.displayName ||
                            selectedModel}
                          {isModelDropdownOpen1 ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </motion.button>
                        {/* Model Dropdown for Panel 1 */}
                        {isModelDropdownOpen1 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                          >
                            <div className="p-2">
                              <div className="mb-4">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Basic
                                </div>
                                {availableModels
                                  .filter((model) => model.category === 'basic')
                                  .map((model) => {
                                    const isSelected = selectedModel === model.name;
                                    const isDisabled = selectedModel2 === model.name;
                                    return (
                                      <motion.button
                                        key={model.id}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            setSelectedModel(model.name);
                                            setIsModelDropdownOpen1(false);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                          : isDisabled
                                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                          }`}
                                      >
                                        <div className="flex-shrink-0">
                                          {getModelImagePath(model.id) ? (
                                            <img
                                              src={getModelImagePath(model.id)!}
                                              alt={model.displayName || model.name}
                                              className="w-4 h-4 object-contain rounded flex-shrink-0"
                                              width={16}
                                              height={16}
                                            />
                                          ) : (
                                            <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                              {getModelIcon(model.id)}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-sm font-medium flex-1">{model.displayName || model.name}</span>
                                        {isSelected && <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                      </motion.button>
                                    );
                                  })}
                              </div>
                              <div className="mb-4">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Advanced
                                </div>
                                {availableModels
                                  .filter((model) => model.category === 'advanced')
                                  .map((model) => {
                                    const isSelected = selectedModel === model.name;
                                    const isDisabled = selectedModel2 === model.name;
                                    return (
                                      <motion.button
                                        key={model.id}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            setSelectedModel(model.name);
                                            setIsModelDropdownOpen1(false);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                          : isDisabled
                                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                          }`}
                                      >
                                        <div className="flex-shrink-0">
                                          {getModelImagePath(model.id) ? (
                                            <img
                                              src={getModelImagePath(model.id)!}
                                              alt={model.displayName || model.name}
                                              className="w-4 h-4 object-contain rounded flex-shrink-0"
                                              width={16}
                                              height={16}
                                            />
                                          ) : (
                                            <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                              {getModelIcon(model.id)}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-sm font-medium flex-1">{model.displayName || model.name}</span>
                                        {isSelected && <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                      </motion.button>
                                    );
                                  })}
                              </div>

                              {/* Other Models Option */}
                              <div className="relative">
                                <motion.button
                                  ref={otherModelsRef1}
                                  onMouseEnter={() => {
                                    if (otherModelsRef1.current && modelDropdownRef1.current) {
                                      const buttonRect = otherModelsRef1.current.getBoundingClientRect();
                                      const mainDropdownRect = modelDropdownRef1.current.getBoundingClientRect();
                                      const viewportHeight = window.innerHeight;
                                      const dropdownHeight = 256;
                                      let top = buttonRect.top;
                                      if (buttonRect.top + dropdownHeight > viewportHeight) {
                                        top = viewportHeight - dropdownHeight - 8;
                                        if (top < 8) {
                                          top = 8;
                                        }
                                      }
                                      const left = mainDropdownRect.right + 8;
                                      setOtherModelsDropdownPosition1({ top, left });
                                    }
                                    setIsOtherModelsHovered1(true);
                                  }}
                                  onMouseLeave={() => setIsOtherModelsHovered1(false)}
                                  onClick={() => {
                                    setIsModelDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <span className="text-sm font-medium">... Other Models</span>
                                  <ChevronRight className="w-4 h-4" />
                                </motion.button>

                                {/* Other Models Hover Dropdown */}
                                {isOtherModelsHovered1 && otherModelsRef1.current && otherModelsDropdownPosition1.top > 0 && (
                                  <>
                                    {/* Invisible bridge to prevent hover loss */}
                                    {modelDropdownRef.current && (
                                      <div
                                        className="fixed z-[59] pointer-events-auto"
                                        style={{
                                          top: `${otherModelsDropdownPosition1.top}px`,
                                          left: `${otherModelsDropdownPosition1.left}px`,
                                          width: `${Math.max(8, otherModelsRef1.current.getBoundingClientRect().right - otherModelsDropdownPosition1.left + 8)}px`,
                                          height: `${otherModelsRef1.current.getBoundingClientRect().height}px`,
                                        }}
                                        onMouseEnter={() => setIsOtherModelsHovered1(true)}
                                      />
                                    )}
                                    <motion.div
                                      ref={otherModelsDropdownRef1}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      onMouseEnter={() => setIsOtherModelsHovered1(true)}
                                      onMouseLeave={() => setIsOtherModelsHovered1(false)}
                                      className="fixed w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] max-h-64 overflow-y-auto"
                                      style={{
                                        top: `${otherModelsDropdownPosition1.top}px`,
                                        left: `${otherModelsDropdownPosition1.left}px`,
                                      }}
                                    >
                                      <div className="p-2">
                                        {/* Additional Other Models */}
                                        {filteredOtherModels.length > 0 && (
                                          <div>
                                            {filteredOtherModels.map((model) => {
                                              const isSelected = selectedModel === model.name;
                                              const isDisabled = selectedModel2 === model.name;
                                              return (
                                                <motion.button
                                                  key={model.id}
                                                  onClick={() => {
                                                    if (!isDisabled) {
                                                      setSelectedModel(model.name);
                                                      setIsModelDropdownOpen1(false);
                                                      setIsOtherModelsHovered1(false);
                                                    }
                                                  }}
                                                  disabled={isDisabled}
                                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                    : isDisabled
                                                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                  <div className="flex-shrink-0">
                                                    {getModelImagePath(model.id) ? (
                                                      <img
                                                        src={getModelImagePath(model.id)!}
                                                        alt={model.displayName || model.name}
                                                        className="w-4 h-4 object-contain rounded flex-shrink-0"
                                                        width={16}
                                                        height={16}
                                                      />
                                                    ) : (
                                                      <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {getModelIcon(model.id)}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <span className="text-sm font-medium flex-1">
                                                    {model.displayName || model.name}
                                                  </span>
                                                  {model.id === 'claude-opus-4.1' && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-xs text-gray-500 dark:text-gray-400">10</span>
                                                      <Star className="w-3 h-3 text-purple-500" />
                                                    </div>
                                                  )}
                                                </motion.button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setViewMode('single')}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {/* Panel 1 Messages */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <div className="text-center pt-12">
                        <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                        >
                          Hi,
                        </motion.h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          How can I assist you today?
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' ? (
                              <div className="flex items-start gap-2 max-w-[85%]">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {getSelectedModelImagePath(message.model || selectedModel) ? (
                                    <img
                                      src={getSelectedModelImagePath(message.model || selectedModel)!}
                                      alt={message.model || selectedModel}
                                      className="w-full h-full object-contain rounded-full"
                                      width={24}
                                      height={24}
                                    />
                                  ) : (
                                    <Sparkles className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div className="flex-1 group">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {availableModels.find((m) => m.name === (message.model || selectedModel))?.displayName ||
                                      OTHER_MODELS.find((m) => m.name === (message.model || selectedModel))?.displayName ||
                                      message.model || selectedModel}
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-900 dark:text-white shadow-sm relative">
                                    <MarkdownRenderer content={message.content} />
                                    {message.isGenerating && (
                                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full ml-1 animate-pulse" />
                                    )}
                                  </div>
                                  {/* Action Buttons */}
                                  {!message.isGenerating && (
                                    <div className="flex justify-end items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleCopyMessage(message.content)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Copy"
                                      >
                                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>

                                      <button
                                        onClick={() => handleAddToList(message.id)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Add to list"
                                      >
                                        <SquarePlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>

                                      <button
                                        onClick={() => handleRegenerate(message.id)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Regenerate"
                                      >
                                        <RotateCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>

                                      <button
                                        onClick={() => handleQuote(message.content)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Quote"
                                      >
                                        <Quote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>

                                      <button
                                        onClick={() => handleShare(message.id)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Share"
                                      >
                                        <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>

                                      <button
                                        onClick={() => handleReadAloud(message.content)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Read aloud"
                                      >
                                        <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      </button>
                                    </div>
                                  )}

                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 max-w-[85%] text-sm">
                                {message.images && message.images.length > 0 && (
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    {message.images.map((imageUrl, idx) => (
                                      <img
                                        key={idx}
                                        src={imageUrl}
                                        alt={`Uploaded image ${idx + 1}`}
                                        className="max-w-[150px] max-h-[150px] rounded-lg object-contain cursor-pointer"
                                        onClick={() => handleImageClick(idx)}
                                        onError={(e) => {
                                          console.error('Failed to load image:', imageUrl);
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                        loading="lazy"
                                      />
                                    ))}
                                  </div>
                                )}
                                {message.files && message.files.length > 0 && (
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    {message.files.map((file, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                                      >
                                        <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[150px]">
                                          {file.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {message.content && (
                                  <p className="text-gray-900 dark:text-white">{message.content}</p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2 - GPT-5 mini */}
                {isPanel2Open && (
                  <div className="flex-1 flex flex-col relative">
                    {/* Panel Header */}
                    <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {getSelectedModelImagePath(selectedModel2) ? (
                            <img
                              src={getSelectedModelImagePath(selectedModel2)!}
                              alt={selectedModel2}
                              className="w-full h-full object-contain rounded-full"
                              width={20}
                              height={20}
                            />
                          ) : (
                            <Sparkles className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div ref={modelDropdownRef2} className="relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModelDropdownOpen2(!isModelDropdownOpen2)}
                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white shadow-sm"
                          >
                            {availableModels.find((m) => m.name === selectedModel2)?.displayName ||
                              OTHER_MODELS.find((m) => m.name === selectedModel2)?.displayName ||
                              selectedModel2}
                            {isModelDropdownOpen2 ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </motion.button>
                          {/* Model Dropdown for Panel 2 */}
                          {isModelDropdownOpen2 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                            >
                              <div className="p-2">
                                <div className="mb-4">
                                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Basic
                                  </div>
                                  {availableModels
                                    .filter((model) => model.category === 'basic')
                                    .map((model) => {
                                      const isSelected = selectedModel2 === model.name;
                                      const isDisabled = selectedModel === model.name;
                                      return (
                                        <motion.button
                                          key={model.id}
                                          onClick={() => {
                                            if (!isDisabled) {
                                              setSelectedModel2(model.name);
                                              setIsModelDropdownOpen2(false);
                                            }
                                          }}
                                          disabled={isDisabled}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : isDisabled
                                              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                          <div className="flex-shrink-0">
                                            {getModelImagePath(model.id) ? (
                                              <img
                                                src={getModelImagePath(model.id)!}
                                                alt={model.displayName || model.name}
                                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                                                width={16}
                                                height={16}
                                              />
                                            ) : (
                                              <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {getModelIcon(model.id)}
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-sm font-medium flex-1">{model.displayName || model.name}</span>
                                          {isSelected && <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                        </motion.button>
                                      );
                                    })}
                                </div>
                                <div className="mb-4">
                                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Advanced
                                  </div>
                                  {availableModels
                                    .filter((model) => model.category === 'advanced')
                                    .map((model) => {
                                      const isSelected = selectedModel2 === model.name;
                                      const isDisabled = selectedModel === model.name;
                                      return (
                                        <motion.button
                                          key={model.id}
                                          onClick={() => {
                                            if (!isDisabled) {
                                              setSelectedModel2(model.name);
                                              setIsModelDropdownOpen2(false);
                                            }
                                          }}
                                          disabled={isDisabled}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : isDisabled
                                              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                          <div className="flex-shrink-0">
                                            {getModelImagePath(model.id) ? (
                                              <img
                                                src={getModelImagePath(model.id)!}
                                                alt={model.displayName || model.name}
                                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                                                width={16}
                                                height={16}
                                              />
                                            ) : (
                                              <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {getModelIcon(model.id)}
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-sm font-medium flex-1">{model.displayName || model.name}</span>
                                          {isSelected && <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                        </motion.button>
                                      );
                                    })}
                                </div>

                                {/* Other Models Option */}
                                <div className="relative">
                                  <motion.button
                                    ref={otherModelsRef2}
                                    onMouseEnter={() => {
                                      if (otherModelsRef2.current && modelDropdownRef2.current) {
                                        const buttonRect = otherModelsRef2.current.getBoundingClientRect();
                                        const mainDropdownRect = modelDropdownRef2.current.getBoundingClientRect();
                                        const viewportHeight = window.innerHeight;
                                        const dropdownHeight = 256;
                                        let top = buttonRect.top;
                                        if (buttonRect.top + dropdownHeight > viewportHeight) {
                                          top = viewportHeight - dropdownHeight - 8;
                                          if (top < 8) {
                                            top = 8;
                                          }
                                        }
                                        const left = mainDropdownRect.right + 8;
                                        setOtherModelsDropdownPosition2({ top, left });
                                      }
                                      setIsOtherModelsHovered2(true);
                                    }}
                                    onMouseLeave={() => setIsOtherModelsHovered2(false)}
                                    onClick={() => {
                                      setIsModelDropdownOpen2(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <span className="text-sm font-medium">... Other Models</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </motion.button>

                                  {/* Other Models Hover Dropdown */}
                                  {isOtherModelsHovered2 && otherModelsRef2.current && otherModelsDropdownPosition2.top > 0 && (
                                    <>
                                      {/* Invisible bridge to prevent hover loss */}
                                      {modelDropdownRef2.current && (
                                        <div
                                          className="fixed z-[59] pointer-events-auto"
                                          style={{
                                            top: `${otherModelsDropdownPosition2.top}px`,
                                            left: `${otherModelsDropdownPosition2.left}px`,
                                            width: `${Math.max(8, otherModelsRef2.current.getBoundingClientRect().right - otherModelsDropdownPosition2.left + 8)}px`,
                                            height: `${otherModelsRef2.current.getBoundingClientRect().height}px`,
                                          }}
                                          onMouseEnter={() => setIsOtherModelsHovered2(true)}
                                        />
                                      )}
                                      <motion.div
                                        ref={otherModelsDropdownRef2}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        onMouseEnter={() => setIsOtherModelsHovered2(true)}
                                        onMouseLeave={() => setIsOtherModelsHovered2(false)}
                                        className="fixed w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] max-h-64 overflow-y-auto"
                                        style={{
                                          top: `${otherModelsDropdownPosition2.top}px`,
                                          left: `${otherModelsDropdownPosition2.left}px`,
                                        }}
                                      >
                                        <div className="p-2">
                                          {/* Additional Other Models */}
                                          {filteredOtherModels.length > 0 && (
                                            <div>
                                              {filteredOtherModels.map((model) => {
                                                const isSelected = selectedModel2 === model.name;
                                                const isDisabled = selectedModel === model.name;
                                                return (
                                                  <motion.button
                                                    key={model.id}
                                                    onClick={() => {
                                                      if (!isDisabled) {
                                                        setSelectedModel2(model.name);
                                                        setIsModelDropdownOpen2(false);
                                                        setIsOtherModelsHovered2(false);
                                                      }
                                                    }}
                                                    disabled={isDisabled}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                      : isDisabled
                                                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                      }`}
                                                  >
                                                    <div className="flex-shrink-0">
                                                      {getModelImagePath(model.id) ? (
                                                        <img
                                                          src={getModelImagePath(model.id)!}
                                                          alt={model.displayName || model.name}
                                                          className="w-4 h-4 object-contain rounded flex-shrink-0"
                                                          width={16}
                                                          height={16}
                                                        />
                                                      ) : (
                                                        <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                          {getModelIcon(model.id)}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <span className="text-sm font-medium flex-1">
                                                      {model.displayName || model.name}
                                                    </span>
                                                    {model.id === 'claude-opus-4.1' && (
                                                      <div className="flex items-center gap-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">10</span>
                                                        <Star className="w-3 h-3 text-purple-500" />
                                                      </div>
                                                    )}
                                                  </motion.button>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsPanel2Open(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                    {/* Panel 2 Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {messages2.length === 0 ? (
                        <div className="text-center pt-12">
                          <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                          >
                            Hi,
                          </motion.h2>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            How can I assist you today?
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages2.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {message.role === 'assistant' ? (
                                <div className="flex items-start gap-2 max-w-[85%]">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {getSelectedModelImagePath(message.model || selectedModel2) ? (
                                      <img
                                        src={getSelectedModelImagePath(message.model || selectedModel2)!}
                                        alt={message.model || selectedModel2}
                                        className="w-full h-full object-contain rounded-full"
                                        width={24}
                                        height={24}
                                      />
                                    ) : (
                                      <Sparkles className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      {availableModels.find((m) => m.name === (message.model || selectedModel2))?.displayName ||
                                        OTHER_MODELS.find((m) => m.name === (message.model || selectedModel2))?.displayName ||
                                        message.model || selectedModel2}
                                    </div>
                                    <div className="group">
                                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-900 dark:text-white shadow-sm">
                                        <MarkdownRenderer content={message.content} />

                                        {message.isGenerating && (
                                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full ml-1 animate-pulse" />
                                        )}
                                      </div>

                                      {!message.isGenerating && (
                                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleCopyMessage(message.content)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Copy"
                                          >
                                            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>

                                          <button
                                            onClick={() => handleAddToList(message.id)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Add to list"
                                          >
                                            <SquarePlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>

                                          <button
                                            onClick={() => handleRegenerate(message.id)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Regenerate"
                                          >
                                            <RotateCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>

                                          <button
                                            onClick={() => handleQuote(message.content)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Quote"
                                          >
                                            <Quote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>

                                          <button
                                            onClick={() => handleShare(message.id)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Share"
                                          >
                                            <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>

                                          <button
                                            onClick={() => handleReadAloud(message.content)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Read aloud"
                                          >
                                            <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 max-w-[85%] text-sm">
                                  {message.images && message.images.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      {message.images.map((imageUrl, idx) => (
                                        <img
                                          key={idx}
                                          src={imageUrl}
                                          alt={`Uploaded image ${idx + 1}`}
                                          className="max-w-[150px] max-h-[150px] rounded-lg object-contain cursor-pointer"
                                          onClick={() => handleImageClick(idx)}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {message.files && message.files.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      {message.files.map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                                        >
                                          <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                          <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[150px]">
                                            {file.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {message.content && (
                                    <p className="text-gray-900 dark:text-white">{message.content}</p>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
                            onClick={() => handleSuggestedPrompt(prompt)}
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
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {getSelectedModelImagePath(message.model || selectedModel) ? (
                                  <img
                                    src={getSelectedModelImagePath(message.model || selectedModel)!}
                                    alt={message.model || selectedModel}
                                    className="w-full h-full object-contain rounded-full"
                                    width={32}
                                    height={32}
                                  />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1 group">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {availableModels.find((m) => m.name === (message.model || selectedModel))?.displayName ||
                                    OTHER_MODELS.find((m) => m.name === (message.model || selectedModel))?.displayName ||
                                    message.model || selectedModel}
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-gray-900 dark:text-white shadow-sm relative">
                                <MarkdownRenderer content={message.content} />
                                  {message.isGenerating && (
                                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full ml-1 animate-pulse" />
                                  )}
                                </div>
                                {/* Action Buttons */}
                                {!message.isGenerating && (
                                  <div className="flex justify-end items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleCopyMessage(message.content)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Copy"
                                    >
                                      <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleAddToList(message.id)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Add to list"
                                    >
                                      <SquarePlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleRegenerate(message.id)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Regenerate"
                                    >
                                      <RotateCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleQuote(message.content)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Quote"
                                    >
                                      <Quote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleShare(message.id)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Share"
                                    >
                                      <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => handleReadAloud(message.content)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                      title="Read aloud"
                                    >
                                      <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
                              {message.images && message.images.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {message.images.map((imageUrl, idx) => (
                                    <img
                                      key={idx}
                                      src={imageUrl}
                                      alt={`Uploaded image ${idx + 1}`}
                                      className="max-w-[200px] max-h-[200px] rounded-lg object-contain cursor-pointer"
                                      onClick={() => handleImageClick(idx)}
                                      onError={(e) => {
                                        console.error('Failed to load image:', imageUrl);
                                        // Hide broken image
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                      loading="lazy"
                                    />
                                  ))}
                                </div>
                              )}
                              {message.files && message.files.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {message.files.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                      <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[200px]">
                                        {file.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.content && (
                                <p className="text-gray-900 dark:text-white">{message.content}</p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Input - Only show for chat view */}
        {activeView === 'chat' && (
          <div className="dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              {/* All buttons in one line */}
              <div className="flex items-center gap-2 mb-3">
                {viewMode === 'single' && (
                  <div ref={modelDropdownRef} className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white shadow-sm"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getSelectedModelImagePath(selectedModel) ? (
                          <img
                            src={getSelectedModelImagePath(selectedModel)!}
                            alt={selectedModel}
                            className="w-full h-full object-contain rounded-full"
                            width={20}
                            height={20}
                          />
                        ) : (
                          <Zap className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {availableModels.find((m) => m.name === selectedModel)?.displayName ||
                        OTHER_MODELS.find((m) => m.name === selectedModel)?.displayName ||
                        selectedModel}
                      {isModelDropdownOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </motion.button>
                    {/* Tooltip for Model Button */}
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Switch model
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>

                    {/* Model Dropdown */}
                    {isModelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="p-2">
                          {/* Basic Models Section */}
                          <div className="mb-4">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Basic
                            </div>
                            {availableModels
                              .filter((model) => model.category === 'basic')
                              .map((model) => {
                                const isSelected = selectedModel === model.name;
                                return (
                                  <motion.button
                                    key={model.id}
                                    onClick={() => {
                                      setSelectedModel(model.name);
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      }`}
                                  >
                                    <div className="flex-shrink-0">
                                      {getModelImagePath(model.id) ? (
                                        <img
                                          src={getModelImagePath(model.id)!}
                                          alt={model.displayName || model.name}
                                          className="w-4 h-4 object-contain rounded flex-shrink-0"
                                          width={16}
                                          height={16}
                                        />
                                      ) : (
                                        <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {getModelIcon(model.id)}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium flex-1">
                                      {model.displayName || model.name}
                                    </span>
                                    {isSelected && (
                                      <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    )}
                                  </motion.button>
                                );
                              })}
                          </div>

                          {/* Advanced Models Section */}
                          <div className="mb-4">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Advanced
                            </div>
                            {availableModels
                              .filter((model) => model.category === 'advanced')
                              .map((model) => {
                                const isSelected = selectedModel === model.name;
                                return (
                                  <motion.button
                                    key={model.id}
                                    onClick={() => {
                                      setSelectedModel(model.name);
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      }`}
                                  >
                                    <div className="flex-shrink-0">
                                      {getModelImagePath(model.id) ? (
                                        <img
                                          src={getModelImagePath(model.id)!}
                                          alt={model.displayName || model.name}
                                          className="w-4 h-4 object-contain rounded flex-shrink-0"
                                          width={16}
                                          height={16}
                                        />
                                      ) : (
                                        <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {getModelIcon(model.id)}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium flex-1">
                                      {model.displayName || model.name}
                                    </span>
                                    {isSelected && (
                                      <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    )}
                                  </motion.button>
                                );
                              })}
                          </div>

                          {/* Other Models Option */}
                          <div className="relative">
                            <motion.button
                              ref={otherModelsRef}
                              onMouseEnter={() => setIsOtherModelsHovered(true)}
                              onMouseLeave={() => setIsOtherModelsHovered(false)}
                              onClick={() => {
                                setIsModelDropdownOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <span className="text-sm font-medium">... Other Models</span>
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>

                            {/* Other Models Hover Dropdown */}
                            {isOtherModelsHovered && otherModelsRef.current && (
                              <>
                                {/* Invisible bridge to prevent hover loss */}
                                {modelDropdownRef.current && (
                                  <div
                                    className="fixed z-[59] pointer-events-auto"
                                    style={{
                                      top: `${otherModelsDropdownPosition.top}px`,
                                      left: `${otherModelsDropdownPosition.left}px`,
                                      width: `${Math.max(8, otherModelsRef.current.getBoundingClientRect().right - otherModelsDropdownPosition.left + 8)}px`,
                                      height: `${otherModelsRef.current.getBoundingClientRect().height}px`,
                                    }}
                                    onMouseEnter={() => setIsOtherModelsHovered(true)}
                                  />
                                )}
                                <motion.div
                                  ref={otherModelsDropdownRef}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  onMouseEnter={() => setIsOtherModelsHovered(true)}
                                  onMouseLeave={() => setIsOtherModelsHovered(false)}
                                  className="fixed w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] max-h-96 overflow-y-auto"
                                  style={{
                                    top: `${otherModelsDropdownPosition.top}px`,
                                    left: `${otherModelsDropdownPosition.left}px`,
                                  }}
                                >
                                  <div className="p-2">
                                    {/* Additional Other Models */}
                                    {filteredOtherModels.length > 0 && (
                                      <div>
                                        {filteredOtherModels.map((model) => {
                                          const isSelected = selectedModel === model.name;
                                          return (
                                            <motion.button
                                              key={model.id}
                                              onClick={() => {
                                                setSelectedModel(model.name);
                                                setIsModelDropdownOpen(false);
                                                setIsOtherModelsHovered(false);
                                              }}
                                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                              <div className="flex-shrink-0">
                                                {getModelImagePath(model.id) ? (
                                                  <img
                                                    src={getModelImagePath(model.id)!}
                                                    alt={model.displayName || model.name}
                                                    className="w-4 h-4 object-contain rounded flex-shrink-0"
                                                    width={16}
                                                    height={16}
                                                  />
                                                ) : (
                                                  <div className={`${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {getModelIcon(model.id)}
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-sm font-medium flex-1">
                                                {model.displayName || model.name}
                                              </span>
                                              {model.id === 'claude-opus-4.1' && (
                                                <div className="flex items-center gap-1">
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">10</span>
                                                  <Star className="w-3 h-3 text-purple-500" />
                                                </div>
                                              )}
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* View Mode Buttons and Attachment - Always visible, in one line */}
                {/* Single View Button */}
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('single')}
                    className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${viewMode === 'single'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Square className="w-5 h-5 stroke-2" />
                  </motion.button>
                  {/* Tooltip for Single View */}
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Single view
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>

                {/* Double View Button */}
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setViewMode('double');
                      setIsPanel2Open(true);
                    }}
                    className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${viewMode === 'double'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <div className="w-5 h-5 flex items-center gap-0.5">
                      <div className="flex-1 h-full border border-gray-600 dark:border-gray-400 rounded-sm" />
                      <div className="w-px h-full bg-gray-300 dark:bg-gray-500" />
                      <div className="flex-1 h-full border border-gray-600 dark:border-gray-400 rounded-sm" />
                    </div>
                  </motion.button>
                  {/* Tooltip for Double View */}
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Double view
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>

                {/* Attachment Button */}
                <div className="relative flex items-center group">
                  <motion.button
                    ref={attachmentButtonRef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAttachmentClick}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Paperclip className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Right Side Action Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Chat Controls Button */}
                  <div className="relative flex items-center group">
                    <motion.button
                      ref={chatControlsButtonRef}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsChatControlsOpen(!isChatControlsOpen)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Sliders className="w-5 h-5" />
                    </motion.button>
                    {/* Tooltip for Chat Controls */}
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Chat controls
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>

                    {/* Chat Controls Dropdown */}
                    {isChatControlsOpen && (
                      <motion.div
                        ref={chatControlsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                      >
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chat controls</h3>

                          {/* Capabilities Section */}
                          <div className="mb-6">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Capabilities</h4>

                            {/* Artifacts */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                                  <FolderPlus className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Artifacts</span>
                              </div>
                              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                              </div>
                            </div>

                            {/* Search */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                                  <Globe className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Search</span>
                              </div>
                              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                              </div>
                            </div>

                            {/* Image */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
                                  <ImageIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Image</span>
                              </div>
                              <div className="flex items-center gap-2 relative">
                                <div className="relative">
                                  <motion.button
                                    ref={imageModelButtonRef}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsImageModelDropdownOpen(!isImageModelDropdownOpen)}
                                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                                  >
                                    {selectedImageModel}
                                    <ChevronDown className="w-3 h-3" />
                                  </motion.button>

                                  {/* Image Model Dropdown */}
                                  {isImageModelDropdownOpen && (
                                    <motion.div
                                      ref={imageModelDropdownRef}
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] overflow-hidden"
                                    >
                                      <div className="p-2">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
                                          Select Generation Model
                                        </div>
                                        {[
                                          { name: 'Nano Banana', description: 'Gemini 2.5 Flash Image Preview', credits: '5', icon: Sparkles, color: 'text-purple-500' },
                                          { name: 'Low', description: 'GPT-image-1', credits: '10', icon: Zap, color: 'text-green-500' },
                                          { name: 'Medium', description: 'GPT-image-1', credits: '5', icon: Sparkles, color: 'text-purple-500' },
                                          { name: 'High', description: 'GPT-image-1', credits: '20', icon: Sparkles, color: 'text-purple-500' },
                                        ].map((model) => {
                                          const IconComponent = model.icon;
                                          return (
                                            <motion.button
                                              key={model.name}
                                              whileHover={{ scale: 1.02 }}
                                              whileTap={{ scale: 0.98 }}
                                              onClick={() => {
                                                setSelectedImageModel(model.name);
                                                setIsImageModelDropdownOpen(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors mb-1 ${selectedImageModel === model.name
                                                ? 'bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                              <div className="flex items-center gap-3 flex-1">
                                                <IconComponent className={`w-4 h-4 ${model.color}`} />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">{model.name}</div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{model.credits}</span>
                                                <Sparkles className="w-3 h-3 text-purple-500" />
                                              </div>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                  <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                                </div>
                              </div>
                            </div>

                            {/* Data Analysis */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                                  <BarChart3 className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Data Analysis</span>
                              </div>
                              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                              </div>
                            </div>

                            {/* Think (R1) */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-cyan-500 flex items-center justify-center">
                                  <Brain className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Think (R1)</span>
                              </div>
                              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                              </div>
                            </div>
                          </div>

                          {/* Personalization Section */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Personalization</h4>

                            {/* Custom Instructions */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                                  <FileText className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Custom Instructions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                                  <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                                </div>
                              </div>
                            </div>

                            {/* Response language */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                                  <Languages className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Response language</span>
                              </div>
                              <div className="relative">
                                <motion.button
                                  ref={languageButtonRef}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                  {selectedLanguage}
                                  <ChevronUp className="w-3 h-3" />
                                </motion.button>

                                {/* Language Dropdown */}
                                {isLanguageDropdownOpen && (
                                  <motion.div
                                    ref={languageDropdownRef}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full right-0 mb-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60] overflow-hidden"
                                  >
                                    {/* Search Bar */}
                                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                      <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="text"
                                          value={languageSearch}
                                          onChange={(e) => setLanguageSearch(e.target.value)}
                                          placeholder="Search"
                                          className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Language List */}
                                    <div className="max-h-64 overflow-y-auto">
                                      {[
                                        { name: 'Auto', nativeName: '' },
                                        { name: 'English', nativeName: 'English' },
                                        { name: 'Simplified Chinese', nativeName: '中文(简体)' },
                                        { name: 'Traditional Chinese', nativeName: '中文(繁體)' },
                                        { name: 'Spanish', nativeName: 'Español' },
                                        { name: 'French', nativeName: 'Français' },
                                        { name: 'German', nativeName: 'Deutsch' },
                                        { name: 'Italian', nativeName: 'Italiano' },
                                        { name: 'Portuguese', nativeName: 'Português' },
                                        { name: 'Russian', nativeName: 'Русский' },
                                        { name: 'Japanese', nativeName: '日本語' },
                                        { name: 'Korean', nativeName: '한국어' },
                                        { name: 'Arabic', nativeName: 'العربية' },
                                        { name: 'Hindi', nativeName: 'हिन्दी' },
                                        { name: 'Dutch', nativeName: 'Nederlands' },
                                        { name: 'Polish', nativeName: 'Polski' },
                                        { name: 'Turkish', nativeName: 'Türkçe' },
                                        { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
                                        { name: 'Thai', nativeName: 'ไทย' },
                                        { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
                                        { name: 'Swedish', nativeName: 'Svenska' },
                                        { name: 'Norwegian', nativeName: 'Norsk' },
                                        { name: 'Danish', nativeName: 'Dansk' },
                                        { name: 'Finnish', nativeName: 'Suomi' },
                                        { name: 'Greek', nativeName: 'Ελληνικά' },
                                        { name: 'Hebrew', nativeName: 'עברית' },
                                        { name: 'Czech', nativeName: 'Čeština' },
                                        { name: 'Romanian', nativeName: 'Română' },
                                        { name: 'Hungarian', nativeName: 'Magyar' },
                                      ]
                                        .filter((lang) => {
                                          if (!languageSearch.trim()) return true;
                                          const searchLower = languageSearch.toLowerCase();
                                          return (
                                            lang.name.toLowerCase().includes(searchLower) ||
                                            lang.nativeName.toLowerCase().includes(searchLower)
                                          );
                                        })
                                        .map((lang) => (
                                          <motion.button
                                            key={lang.name}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => {
                                              setSelectedLanguage(lang.name);
                                              setIsLanguageDropdownOpen(false);
                                              setLanguageSearch('');
                                            }}
                                            className={`w-full flex flex-col items-start px-3 py-2.5 text-left transition-colors ${selectedLanguage === lang.name
                                              ? 'bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white'
                                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                              }`}
                                          >
                                            <div className="text-sm font-medium">{lang.name}</div>
                                            {lang.nativeName && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {lang.nativeName}
                                              </div>
                                            )}
                                          </motion.button>
                                        ))}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Chat History Button */}
                  <div className="relative flex items-center group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        const newState = !isChatHistoryOpen;
                        setIsChatHistoryOpen(newState);
                        if (newState) {
                          await listConversations();
                        }
                      }}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <History className="w-5 h-5" />
                    </motion.button>
                    {/* Tooltip for Chat History */}
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Chat history
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>

                  {/* New Chat Button */}
                  <div className="relative flex items-center group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNewChat}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <MessageCircle className="w-5 h-5 text-purple-500" />
                      <Plus className="w-3 h-3 text-purple-500 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
                    </motion.button>
                    {/* Tooltip for New Chat */}
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      New chat
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[120px]">
                {/* File Previews */}
                {filePreviews.length > 0 && (
                  <div className="mb-4">
                    {/* All Images in One Section */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filePreviews.map((preview, index) => {
                        console.log(`Rendering preview ${index}:`, preview.file.name, preview.preview);
                        return (
                          <div
                            key={`${preview.file.name}-${index}`}
                            className="relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-center items-center"
                            style={{ width: '14%', minWidth: '80px', height: '128px' }}
                          >
                            {preview.isUploading ? (
                              <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                              </div>
                            ) : (
                              <>
                                {preview.isImage ? (
                                  <img
                                    src={preview.preview}
                                    alt={preview.file.name}
                                    className="max-h-32 w-auto object-contain cursor-pointer"
                                    onClick={() => handleImageClick(index)}
                                    onError={() => {
                                      console.error('Image failed to load:', preview.preview, preview.file.name);
                                    }}
                                    onLoad={() => {
                                      console.log('Image loaded successfully:', preview.file.name);
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center w-full h-full p-3 text-center gap-2">
                                    <FileText className="w-8 h-8 text-purple-500" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                                      {preview.file.name}
                                    </span>
                                  </div>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveFile(index)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-opacity"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </motion.button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons - Shared for all images */}
                    <div className="flex items-center justify-between gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleExtractText()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 transition-all"
                      >
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Extract Text
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMathSolver()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 transition-all"
                      >
                        <Calculator className="w-4 h-4 text-green-500" />
                        Math Solver
                      </motion.button>

                      <div className="relative flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setIsTranslateDropdownOpen(
                              isTranslateDropdownOpen === null ? 0 : null
                            )
                          }
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 transition-all"
                        >
                          <Languages className="w-4 h-4 text-blue-500" />
                          Translate
                          <ChevronDownIcon className="w-3 h-3" />
                        </motion.button>

                        {/* Translate Dropdown */}
                        {isTranslateDropdownOpen !== null && (
                          <motion.div
                            ref={translateDropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto"
                          >
                            <div className="p-1">
                              {languages.map((lang) => (
                                <motion.button
                                  key={lang.code}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    handleTranslate(lang.code, lang.name)
                                  }
                                  className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                  {lang.name}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

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
                        <Globe className="w-3.5 h-3.5" />
                        Search
                      </motion.button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(viewMode === 'single' ? isGenerating : isGenerating || isGenerating2) ? handleStopGenerating : handleSendMessage}
                      disabled={!inputValue.trim() && !(viewMode === 'single' ? isGenerating : isGenerating || isGenerating2)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(viewMode === 'single' ? isGenerating : isGenerating || isGenerating2) ? (
                        <SquareIcon className="w-5 h-5" />
                      ) : inputValue.trim() ? (
                        <Send className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Profile Dropdown */}
      <UserProfileDropdown
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        position={userProfilePosition}
      />

      {/* Image Modal */}
      {currentImageItem &&
        (() => {
          const { filePreview } = currentImageItem;
          const { file, preview } = filePreview;
          return (
            <motion.div
              ref={imageModalRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 bg-black/80 z-[100] flex items-center justify-center ${isImageMinimized ? 'items-end' : ''
                }`}
              onClick={(e) => {
                if (e.target === imageModalRef.current) {
                  handleCloseImageModal();
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: isImageMinimized ? 0.3 : isImageMaximized ? 1 : 1,
                  opacity: 1,
                  width: isImageMinimized ? '300px' : isImageMaximized ? '95vw' : '80vw',
                  height: isImageMinimized ? '200px' : isImageMaximized ? '95vh' : '80vh',
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden ${isImageMinimized ? 'mb-4' : ''
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">
                      {file.name}
                    </span>
                    <span className="text-white/70 text-xs">
                      {Math.round(imageZoom * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleZoomOut}
                      disabled={imageZoom <= 0.5}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleZoomIn}
                      disabled={imageZoom >= 5}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </motion.button>
                    {/* Minimize Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setIsImageMinimized(!isImageMinimized);
                        if (isImageMaximized) setIsImageMaximized(false);
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title={isImageMinimized ? "Restore" : "Minimize"}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </motion.button>
                    {/* Maximize Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setIsImageMaximized(!isImageMaximized);
                        if (isImageMinimized) setIsImageMinimized(false);
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title={isImageMaximized ? "Restore" : "Maximize"}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </motion.button>
                    {/* Close Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseImageModal}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Image Container */}
                <div className="w-full h-full flex items-center justify-center overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
                  <motion.img
                    src={preview}
                    alt={file.name}
                    style={{
                      transform: `scale(${imageZoom})`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                    className="transition-transform duration-200"
                    draggable={false}
                  />
                </div>

                {/* Navigation Arrows (if multiple images) */}
                {imagePreviewItems.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const prevIndex =
                          selectedImageIndex !== null && selectedImageIndex > 0
                            ? selectedImageIndex - 1
                            : imagePreviewItems.length - 1;
                        setSelectedImageIndex(prevIndex);
                        setImageZoom(1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white z-10 transition-colors"
                      title="Previous Image"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const nextIndex =
                          selectedImageIndex !== null && selectedImageIndex < imagePreviewItems.length - 1
                            ? selectedImageIndex + 1
                            : 0;
                        setSelectedImageIndex(nextIndex);
                        setImageZoom(1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white z-10 transition-colors"
                      title="Next Image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>
          );
        })()}

      {/* Chat History Sidebar */}
      {isChatHistoryOpen && (
        <motion.div
          ref={chatHistoryRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[90] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat history</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatHistoryOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setChatHistoryTab('all')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${chatHistoryTab === 'all'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                All
                {chatHistoryTab === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                )}
              </button>
              <button
                onClick={() => setChatHistoryTab('starred')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${chatHistoryTab === 'starred'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Starred
                {chatHistoryTab === 'starred' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                )}
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDeleteAllConfirmOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete All Conversations"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={chatHistorySearch}
                onChange={(e) => setChatHistorySearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingChatHistory ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
              </div>
            ) : getFilteredChatHistory().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  getFilteredChatHistory().reduce((acc, chat) => {
                    const dateLabel = formatChatDate(chat.timestamp);
                    if (!acc[dateLabel]) {
                      acc[dateLabel] = [];
                    }
                    acc[dateLabel].push(chat);
                    return acc;
                  }, {} as Record<string, ChatHistoryItem[]>)
                ).map(([dateLabel, chats]) => (
                  <div key={dateLabel}>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {dateLabel}
                    </h3>
                    {chats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleChatHistoryItemClick(chat.id)}
                        className={`group p-3 rounded-lg border transition-colors mb-2 ${conversationId === chat.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                              {chat.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {chat.preview}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStarChat(chat.id);
                              }}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <Star
                                className={`w-4 h-4 ${chat.starred
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-400'
                                  }`}
                              />
                            </motion.button>
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                }}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </motion.button>

                              {/* Dropdown Menu */}
                              {openMenuId === chat.id && (
                                <motion.div
                                  ref={(el) => {
                                    if (el) menuRefs.current[chat.id] = el;
                                    else delete menuRefs.current[chat.id];
                                  }}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      // TODO: Implement export functionality
                                      console.log('Export conversation:', chat.id);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleEditTitleClick(chat.id, chat.title);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>Edit title</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      // Open delete confirmation first
                                      handleDeleteChatClick(chat.id, e);
                                      // Close menu after a brief delay to ensure state is set
                                      requestAnimationFrame(() => {
                                        setOpenMenuId(null);
                                      });
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chat History Overlay */}
      {isChatHistoryOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsChatHistoryOpen(false)}
          className="fixed inset-0 bg-black/50 z-[80]"
        />
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllConfirmOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isDeletingAll) {
                setDeleteAllConfirmOpen(false);
              }
            }}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Delete All Conversations?
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. All your conversations will be permanently deleted.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={!isDeletingAll ? { scale: 1.02 } : {}}
                  whileTap={!isDeletingAll ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (!isDeletingAll) {
                      setDeleteAllConfirmOpen(false);
                    }
                  }}
                  disabled={isDeletingAll}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={!isDeletingAll ? { scale: 1.02 } : {}}
                  whileTap={!isDeletingAll ? { scale: 0.98 } : {}}
                  onClick={handleDeleteAllConversations}
                  disabled={isDeletingAll}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeletingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete All'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isDeleting) {
                setDeleteConfirmOpen(false);
                setConversationToDelete(null);
              }
            }}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Delete this conversation?
              </h3>

              {/* Warning Message */}
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={!isDeleting ? { scale: 1.02 } : {}}
                  whileTap={!isDeleting ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (!isDeleting) {
                      setDeleteConfirmOpen(false);
                      setConversationToDelete(null);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={!isDeleting ? { scale: 1.02 } : {}}
                  whileTap={!isDeleting ? { scale: 0.98 } : {}}
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Edit Title Modal */}
      {editTitleModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isUpdatingTitle) {
                setEditTitleModalOpen(false);
                setConversationToEdit(null);
                setEditTitleValue('');
              }
            }}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit title
              </h3>

              {/* Input Field */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 200) {
                        setEditTitleValue(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isUpdatingTitle && editTitleValue.trim()) {
                        handleEditTitle();
                      } else if (e.key === 'Escape' && !isUpdatingTitle) {
                        setEditTitleModalOpen(false);
                        setConversationToEdit(null);
                        setEditTitleValue('');
                      }
                    }}
                    disabled={isUpdatingTitle}
                    autoFocus
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    placeholder="Enter conversation title"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                    {editTitleValue.length} / 200
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={!isUpdatingTitle ? { scale: 1.02 } : {}}
                  whileTap={!isUpdatingTitle ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (!isUpdatingTitle) {
                      setEditTitleModalOpen(false);
                      setConversationToEdit(null);
                      setEditTitleValue('');
                    }
                  }}
                  disabled={isUpdatingTitle}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={!isUpdatingTitle ? { scale: 1.02 } : {}}
                  whileTap={!isUpdatingTitle ? { scale: 0.98 } : {}}
                  onClick={handleEditTitle}
                  disabled={isUpdatingTitle || !editTitleValue.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdatingTitle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
