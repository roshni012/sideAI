'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Home,
  Palette,
  Square,
  Type,
  Eraser,
  ScanSearch,
  Maximize2,
  Layers,
  Upload,
  Settings,
  Brain,
  Clock,
  Plus,
  RefreshCw,
  Star,
  Folder,
  MessageCircle,
  Settings as SettingsIcon,
  Grid3x3,
  FileText,
  Flame,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  LucideIcon,
  Trash2,
  Pencil,
  Copy,
  RotateCw,
  X,
  Check,
  HelpCircle,
  Zap,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';
import Sidebar from './Sidebar';
import * as chatService from '../lib/chatService';

interface AIImageGeneratorProps {
  tool: string;
}

interface Model {
  id: string;
  name: string;
  displayName?: string;
  category?: 'basic' | 'advanced' | 'other';
}

interface Canvas {
  id: string;
  prompt?: string;
  images: string[];
  isNew: boolean; // true if canvas has placeholder images
}

const toolConfig: Record<string, { name: string; icon: LucideIcon }> = {
  'ai-image-generator': { name: 'AI Image Generator', icon: Palette },
  'background-remover': { name: 'Background Remover', icon: Square },
  'text-remover': { name: 'Text Remover', icon: Type },
  'photo-eraser': { name: 'Photo Eraser', icon: Eraser },
  'inpaint': { name: 'Inpaint', icon: ScanSearch },
  'image-upscaler': { name: 'Image Upscaler', icon: Maximize2 },
  'background-changer': { name: 'Background Changer', icon: Layers },
};

const examplePrompts = ['😊 Cute cat', '🐙 Cooking delicious octopus', 'purple monster'];

const modelOptions: Array<{ label: string; value: string }> = [
  { label: 'Nano Banana', value: 'nano banana' },
  { label: 'SD 3.0 Medium', value: 'sd3.0-medium' },
  { label: 'SD 3.5 Large Turbo', value: 'sd3.5-large-turbo' },
  { label: 'SD 3.5 Large', value: 'sd3.5-large' },
  { label: 'Ideogram 1.0 Turbo', value: 'ideogram-1.0-turbo' },
  { label: 'Ideogram 2.0', value: 'ideogram-2.0' },
  { label: 'Ideogram 2.0 Turbo', value: 'ideogram-2.0-turbo' },
  { label: 'GPT Image 1', value: 'gpt-image-1' },
];

const IMAGE_MODELS: Model[] = [
  // Basic models
  { id: 'nano-banana', name: 'nano banana', displayName: 'Nano Banana', category: 'basic' },
  { id: 'sd-3.0-medium', name: 'sd3.0-medium', displayName: 'SD 3.0 Medium', category: 'basic' },
  { id: 'ideogram-1.0-turbo', name: 'ideogram-1.0-turbo', displayName: 'Ideogram 1.0 Turbo', category: 'basic' },
  // Advanced models
  { id: 'sd-3.5-large-turbo', name: 'sd3.5-large-turbo', displayName: 'SD 3.5 Large Turbo', category: 'advanced' },
  { id: 'sd-3.5-large', name: 'sd3.5-large', displayName: 'SD 3.5 Large', category: 'advanced' },
  { id: 'ideogram-2.0', name: 'ideogram-2.0', displayName: 'Ideogram 2.0', category: 'advanced' },
  { id: 'ideogram-2.0-turbo', name: 'ideogram-2.0-turbo', displayName: 'Ideogram 2.0 Turbo', category: 'advanced' },
  { id: 'gpt-image-1', name: 'gpt-image-1', displayName: 'GPT Image 1', category: 'advanced' },
];

const getImageModelIcon = (modelId: string) => {
  const iconClass = 'w-4 h-4';
  if (modelId.includes('nano') || modelId.includes('banana')) {
    return <Sparkles className={iconClass} />;
  }
  if (modelId.includes('sd') || modelId.includes('stable')) {
    return <Palette className={iconClass} />;
  }
  if (modelId.includes('ideogram')) {
    return <Star className={iconClass} />;
  }
  if (modelId.includes('gpt')) {
    return <Sparkles className={iconClass} />;
  }
  return <Sparkles className={iconClass} />;
};

const getModelImagePath = (modelId: string): string | null => {
  const imageMap: Record<string, string> = {
    'nano-banana': '/image/gemini.png', // Google model
    'sd-3.0-medium': '/image/fusion.png', // Stability AI
    'sd-3.5-large-turbo': '/image/fusion.png', // Stability AI
    'sd-3.5-large': '/image/fusion.png', // Stability AI
    'ideogram-1.0-turbo': '/image/deepseek.png', // Ideogram
    'ideogram-2.0': '/image/deepseek.png', // Ideogram
    'ideogram-2.0-turbo': '/image/deepseek.png', // Ideogram
    'gpt-image-1': '/image/chatgpt.png', // OpenAI GPT
  };
  return imageMap[modelId] || null;
};

const getSelectedModelImagePath = (modelName: string): string | null => {
  const model = IMAGE_MODELS.find((m) => m.name === modelName);
  if (model) {
    return getModelImagePath(model.id);
  }
  return null;
};

const IMAGE_GENERATION_DEFAULTS = {
  width: 1024,
  height: 1024,
  num_outputs: 1,
  guidance_scale: 7.5,
  num_inference_steps: 30,
};

const artStyles = [
  { id: 'none', name: 'None', image: null },
  { id: 'photographic', name: 'Photographic', image: '/image/photography.jfif' },
  { id: 'anime', name: 'Anime', image: '/image/anime.jfif' },
  { id: 'fantasy', name: 'Fantasy Art', image: '/image/fantasy_art.jfif' },
  { id: 'lineart', name: 'Line Art', image: '/image/line_art.png' },
  { id: '3d', name: '3D Model', image: '/image/3D_model.jfif' },
  { id: 'neonpunk', name: 'Neonpunk', image: '/image/neonpunk.jfif' },
  { id: 'comic', name: 'Comic Book', image: '/image/comicbook.jfif' },
  { id: 'isometric', name: 'Isometric', image: '/image/isometric.jfif' },
  { id: 'lowpoly', name: 'Low Poly', image: '/image/low_Poly.jfif' },
  { id: 'origami', name: 'Origami', image: '/image/origami.jfif' },
  { id: 'cinematic', name: 'Cinematic', image: '/image/cenamatic.jfif' },
  { id: 'digitalart', name: 'Digital Art', image: '/image/digitalArt.jfif' },
];

const aspectRatios = [
  { label: '1:1', value: '1:1', width: 1024, height: 1024 },
  { label: '16:9', value: '16:9', width: 1920, height: 1080 },
  { label: '9:16', value: '9:16', width: 1080, height: 1920 },
  { label: '4:3', value: '4:3', width: 1024, height: 768 },
  { label: '3:4', value: '3:4', width: 768, height: 1024 },
];

export default function AIImageGenerator({ tool }: AIImageGeneratorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(modelOptions[0].value);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const [controlBarBottom, setControlBarBottom] = useState(96);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState('none');
  const [numImages, setNumImages] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('Auto');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showExamplePrompts, setShowExamplePrompts] = useState(true);
  const [keepPrompt, setKeepPrompt] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isOptimizePromptOpen, setIsOptimizePromptOpen] = useState(false);
  const [optimizePromptInput, setOptimizePromptInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const currentTool = toolConfig[tool] || toolConfig['ai-image-generator'];
  const isAIImageGenerator = tool === 'ai-image-generator';
  const selectedModelLabel =
    modelOptions.find((option) => option.value === selectedModel)?.label || 'Custom Model';
  const isPromptReady = prompt.trim().length > 0;

  // Calculate Control Bar position based on Bottom Panel height
  useEffect(() => {
    const updateControlBarPosition = () => {
      if (bottomPanelRef.current) {
        const height = bottomPanelRef.current.offsetHeight;
        setControlBarBottom(height - 12);
      }
    };

    updateControlBarPosition();
    window.addEventListener('resize', updateControlBarPosition);

    return () => {
      window.removeEventListener('resize', updateControlBarPosition);
    };
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

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

  // Create a new conversation for image generation
  const createConversation = async (): Promise<string | null> => {
    try {
      const conversationId = await chatService.createConversation('Image Generation', selectedModel);
      if (conversationId) {
        setConversationId(conversationId);
      }
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const generateImage = async (promptToUse: string) => {
    if (!promptToUse.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Create conversation if it doesn't exist (first time or new chat)
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation();
        if (!currentConversationId) {
          throw new Error('Failed to create conversation');
        }
      }

      const payload: chatService.ImageGenerationPayload = {
        prompt: promptToUse.trim(),
        model: selectedModel,
        width: IMAGE_GENERATION_DEFAULTS.width,
        height: IMAGE_GENERATION_DEFAULTS.height,
        num_outputs: numImages,
        guidance_scale: IMAGE_GENERATION_DEFAULTS.guidance_scale,
        num_inference_steps: IMAGE_GENERATION_DEFAULTS.num_inference_steps,
        conversation_id: currentConversationId,
      };

      // Generate images using the service
      await chatService.generateImages(payload);

      // After successful generation, fetch all images from this conversation
      await fetchAndDisplayConversationImages(currentConversationId, promptToUse.trim());

    } catch (error) {
      console.error('Error generating image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchAndDisplayConversationImages = async (convId: string, promptText: string) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(
        `${getApiUrl(`/api/images/conversation/${convId}`)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to fetch conversation images:', data);
        return;
      }

      // Get all images from the conversation
      const images = data?.data || [];

      // Clear existing canvases and create new ones for each generation
      // This ensures we show each generation separately instead of merging them
      const newCanvases: Canvas[] = [];

      // Sort images by creation time (oldest first) to display in correct order
      const sortedImages = [...images].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedImages.forEach((item: any, index: number) => {
        if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
          const canvasId = `canvas-${convId}-${index}-${Date.now()}`;
          newCanvases.push({
            id: canvasId,
            prompt: item.prompt || promptText,
            images: item.image_urls,
            isNew: false,
          });
        }
      });

      // Set all canvases at once
      if (newCanvases.length > 0) {
        setCanvases(newCanvases);
        // Set the last (newest) canvas as active
        setActiveCanvasId(newCanvases[newCanvases.length - 1].id);
      }
    } catch (error) {
      console.error('Error fetching conversation images:', error);
    }
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    // Clear input field immediately
    setPrompt('');
    await generateImage(trimmedPrompt);
  };

  const handleNewCanvas = async () => {
    // Clear current conversation state
    setConversationId(null);
    setPrompt('');
    setCanvases([]);
    setActiveCanvasId(null);

    // Create a new conversation for the new canvas
    try {
      const newConversationId = await createConversation();
      if (newConversationId) {
        console.log('New conversation created:', newConversationId);
        // The conversation ID is already set by createConversation()
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }

    // Navigate to a fresh page (reload current route)
    router.push('/create/image/ai-image-generator');
    router.refresh();
  };

  const handleCopyPrompt = async (canvasPrompt?: string) => {
    if (!canvasPrompt) return;
    try {
      await navigator.clipboard.writeText(canvasPrompt);
      // Optional: Show a toast notification here
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleUsePrompt = (canvasPrompt?: string) => {
    if (!canvasPrompt) return;
    setPrompt(canvasPrompt);
  };

  const handleRegenerate = async (canvasPrompt?: string) => {
    if (!canvasPrompt || isGenerating) return;
    await generateImage(canvasPrompt);
  };

  const handleDeleteCanvas = (canvasId: string) => {
    setCanvases((prev) => {
      const updated = prev.filter((c) => c.id !== canvasId);
      // If we deleted the active canvas, set the last one as active or null
      if (canvasId === activeCanvasId) {
        setActiveCanvasId(updated.length > 0 ? updated[updated.length - 1].id : null);
      }
      return updated;
    });
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Login required');
      }

      // Fetch conversations (for titles) AND image history (for images) in parallel
      const [conversationsRes, historyRes] = await Promise.all([
        fetch(getApiUrl('/api/conversations'), {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(getApiUrl(API_ENDPOINTS.IMAGES.HISTORY), {
          headers: { Authorization: `Bearer ${authToken}` },
        })
      ]);

      const conversationsData = await conversationsRes.json().catch(() => ({}));
      const historyData = await historyRes.json().catch(() => ({}));

      // Create a map of conversation titles
      const titlesMap = new Map<string, string>();
      const conversationsList = Array.isArray(conversationsData) ? conversationsData : (conversationsData?.data || []);

      if (Array.isArray(conversationsList)) {
        conversationsList.forEach((c: any) => {
          if (c.id && c.title) {
            titlesMap.set(c.id, c.title);
          }
        });
      }

      // Group images by conversation_id
      const images = historyData?.data || [];
      const conversationsMap = new Map();

      // Process images to group by conversation
      // We want to keep the FIRST/OLDEST image for the preview
      images.forEach((item: any) => {
        const convId = item.conversation_id;
        // Use title from map if available, otherwise item.title (if exists), otherwise item.prompt
        const realTitle = titlesMap.get(convId) || item.title || item.prompt;

        if (!conversationsMap.has(convId)) {
          // First time seeing this conversation
          conversationsMap.set(convId, {
            conversation_id: convId,
            title: realTitle,
            prompt: item.prompt,
            first_image: item.image_urls?.[0] || null,
            created_at: item.created_at,
            total_images: item.image_urls?.length || 0,
            // Store timestamp to find oldest later if needed, 
            // but API usually returns newest first, so last item in list is oldest
          });
        } else {
          // Conversation exists, update stats
          const existing = conversationsMap.get(convId);
          existing.total_images += item.image_urls?.length || 0;

          // If this item is older than what we have, use its image as the preview
          // (assuming we want the very first image generated in the conversation)
          if (new Date(item.created_at).getTime() < new Date(existing.created_at).getTime()) {
            existing.first_image = item.image_urls?.[0] || existing.first_image;
            existing.created_at = item.created_at; // Update creation time to oldest
            existing.prompt = item.prompt; // Use prompt from oldest generation
            existing.title = realTitle; // Use title from oldest generation
          }
        }
      });

      // Convert map to array and sort by created_at (newest conversation first)
      const conversations = Array.from(conversationsMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistoryItems(conversations);
    } catch (e) {
      console.error('History load error', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchConversationImages = async (conversationId: string) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Login required');
      }

      const response = await fetch(
        `${getApiUrl(`/api/images/conversation/${conversationId}`)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to load conversation images');
      }

      // Get all images from the conversation
      const images = data?.data || [];

      // Clear existing canvases and create new ones for each generation
      const newCanvases: Canvas[] = [];

      // Sort images by creation time (oldest first)
      const sortedImages = [...images].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedImages.forEach((item: any, index: number) => {
        if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
          const canvasId = `canvas-${conversationId}-${index}-${Date.now()}`;
          newCanvases.push({
            id: canvasId,
            prompt: item.prompt,
            images: item.image_urls,
            isNew: false,
          });
        }
      });

      // Set all canvases
      if (newCanvases.length > 0) {
        setCanvases(newCanvases);
        setActiveCanvasId(newCanvases[newCanvases.length - 1].id);
        setConversationId(conversationId);
        setIsHistoryOpen(false);
      }
    } catch (error) {
      console.error('Error fetching conversation images:', error);
    }
  };

  const handleEditTitle = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditTitleInput(currentTitle);
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (!editTitleInput.trim()) return;
    try {
      await chatService.updateConversation(conversationId, editTitleInput.trim());

      // Update local state immediately without refreshing from API
      setHistoryItems((prevItems) =>
        prevItems.map((item) =>
          item.conversation_id === conversationId
            ? { ...item, title: editTitleInput.trim() }
            : item
        )
      );

      setEditingConversationId(null);
      setEditTitleInput('');
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setEditTitleInput('');
  };

  const handleDeleteConversation = async () => {
    if (!deleteConfirmationId) return;
    try {
      await chatService.deleteConversation(deleteConfirmationId);

      // Optimistic update
      setHistoryItems((prev) => prev.filter((item) => item.conversation_id !== deleteConfirmationId));

      // If the deleted conversation was active, clear canvas
      if (conversationId === deleteConfirmationId) {
        handleNewCanvas();
      }

      setDeleteConfirmationId(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleOptimizePrompt = async (promptToOptimize?: string) => {
    const promptText = promptToOptimize || optimizePromptInput.trim();
    if (!promptText || isOptimizing) return;

    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      const optimized = await chatService.optimizePrompt(promptText);
      setOptimizedPrompt(optimized);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      setOptimizeError(error instanceof Error ? error.message : 'Failed to optimize prompt. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUseOptimizedPrompt = () => {
    if (optimizedPrompt) {
      setPrompt(optimizedPrompt);
      setIsOptimizePromptOpen(false);
      setOptimizePromptInput('');
      setOptimizedPrompt('');
      setOptimizeError(null);
    }
  };

  const handleRegenerateOptimizedPrompt = () => {
    if (optimizedPrompt) {
      setOptimizePromptInput(optimizedPrompt);
      setOptimizedPrompt('');
      handleOptimizePrompt(optimizedPrompt);
    }
  };

  const handleOpenOptimizePrompt = () => {
    setOptimizePromptInput(prompt);
    setOptimizedPrompt('');
    setOptimizeError(null);
    setIsOptimizePromptOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSlug={tool}
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {isAIImageGenerator ? (
          <>
            {/* Header */}
            <div className="p-8 pb-56 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to Sider Painter
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Where your thoughts come alive as art. Just tell us what&apos;s
                on your mind, and watch as your ideas turn into awesome
                pictures! e.g. purple monster
              </p>

              {/* Canvas List - Chat-like display */}
              <div className="space-y-6 mb-6">
                {canvases.length > 0 ? (
                  canvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      {canvas.prompt && (
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {canvas.prompt}
                          </p>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteCanvas(canvas.id)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete Canvas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCopyPrompt(canvas.prompt)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Copy Prompt"
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUsePrompt(canvas.prompt)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              title="Use this Prompt"
                            >
                              <Type className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRegenerate(canvas.prompt)}
                              disabled={isGenerating}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Regenerate"
                            >
                              <RotateCw
                                className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""
                                  }`}
                              />
                            </motion.button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-4">
                        {canvas.images.map((imageUrl, index) => (
                          <motion.div
                            key={`${canvas.id}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="aspect-square rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                          >
                            {imageUrl === "placeholder" ? (
                              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-900 flex items-center justify-center">
                                <div className="text-gray-400 dark:text-gray-500 text-sm">
                                  Placeholder
                                </div>
                              </div>
                            ) : (
                              <img
                                src={imageUrl}
                                alt={`Generated image ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                                loading="lazy"
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {["girl1.png", "girl2.png", "girl3.png", "girl4.png"].map(
                      (imageName, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="aspect-square rounded-lg bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-900 flex items-center justify-center overflow-hidden"
                        >
                          <img
                            src={`/image/${imageName}`}
                            alt={`Example image ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </motion.div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Play with some fun ideas to get started:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {examplePrompts.map((promptText, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPrompt(promptText)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                    >
                      {promptText}
                      {i === examplePrompts.length - 1 && (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-lg border border-red-200 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div
              className="fixed left-64 right-0 bg-white dark:bg-gray-900 px-6 py-3 z-30"
              style={{ bottom: `${controlBarBottom}px` }}
            >
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Model Selector */}
                  <div ref={modelDropdownRef} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setIsModelDropdownOpen(!isModelDropdownOpen)
                      }
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
                      {IMAGE_MODELS.find((m) => m.name === selectedModel)
                        ?.displayName ||
                        modelOptions.find((o) => o.value === selectedModel)
                          ?.label ||
                        selectedModel}
                      {isModelDropdownOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </motion.button>

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
                            {IMAGE_MODELS.filter(
                              (model) => model.category === "basic"
                            ).map((model) => {
                              const isSelected = selectedModel === model.name;
                              return (
                                <motion.button
                                  key={model.id}
                                  onClick={() => {
                                    setSelectedModel(model.name);
                                    setIsModelDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                  <div className="flex-shrink-0">
                                    {getModelImagePath(model.id) ? (
                                      <img
                                        src={getModelImagePath(model.id)!}
                                        alt={model.displayName || model.name}
                                        className="w-4 h-4 object-contain rounded"
                                      />
                                    ) : (
                                      <div
                                        className={`${isSelected
                                          ? "text-purple-600 dark:text-purple-400"
                                          : "text-gray-500 dark:text-gray-400"
                                          }`}
                                      >
                                        {getImageModelIcon(model.id)}
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
                            {IMAGE_MODELS.filter(
                              (model) => model.category === "advanced"
                            ).map((model) => {
                              const isSelected = selectedModel === model.name;
                              return (
                                <motion.button
                                  key={model.id}
                                  onClick={() => {
                                    setSelectedModel(model.name);
                                    setIsModelDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                  <div className="flex-shrink-0">
                                    {getModelImagePath(model.id) ? (
                                      <img
                                        src={getModelImagePath(model.id)!}
                                        alt={model.displayName || model.name}
                                        className="w-4 h-4 object-contain rounded"
                                      />
                                    ) : (
                                      <div
                                        className={`${isSelected
                                          ? "text-purple-600 dark:text-purple-400"
                                          : "text-gray-500 dark:text-gray-400"
                                          }`}
                                      >
                                        {getImageModelIcon(model.id)}
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
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Icon buttons (Upload, Settings, Star) */}
                  <div className="flex items-center gap-2 ml-1">
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoveredIcon("upload")}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </motion.button>
                      {hoveredIcon === "upload" && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                          Image to Image
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSettingsOpen(true)}
                        onMouseEnter={() => setHoveredIcon("settings")}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </motion.button>
                      {hoveredIcon === "settings" && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                          Adjust Settings
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleOpenOptimizePrompt}
                        onMouseEnter={() => setHoveredIcon("optimize")}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </motion.button>
                      {hoveredIcon === "optimize" && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                          Optimize Prompt
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    title="Optimize prompt"
                  >
                    <div className="w-5 h-5 rounded border-2 border-green-600 dark:border-green-400 flex items-center justify-center">
                      <Flame className="w-3 h-3" />
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    title="Style"
                  >
                    <Palette className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsHistoryOpen(true);
                      fetchHistory();
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="History"
                  >
                    <Clock className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNewCanvas}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="New Canvas"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom Chat Panel */}
            <div
              ref={bottomPanelRef}
              className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-900 px-6 py-4"
            >
              <div className="max-w-7xl mx-auto flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="Describe the image you'd like to create..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  disabled={!isPromptReady || isGenerating}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                {currentTool && (
                  <>
                    <currentTool.icon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentTool.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      This tool is coming soon!
                    </p>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>

      {isHistoryOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex justify-end"
          onClick={() => setIsHistoryOpen(false)}
        >
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[380px] h-full bg-white dark:bg-gray-900 shadow-xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Image History
              </h2>
              <X
                onClick={() => setIsHistoryOpen(false)}
                className="w-6 h-6 cursor-pointer text-gray-600 dark:text-gray-300"
              />
            </div>

            {historyLoading && (
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                Loading...
              </div>
            )}

            {!historyLoading && historyItems.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No history found.
              </div>
            )}

            {!historyLoading && historyItems.length > 0 && (
              <div className="space-y-4">
                {historyItems.map((conversation, itemIndex) => (
                  <div
                    key={itemIndex}
                    onClick={() => fetchConversationImages(conversation.conversation_id)}
                    className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Header: Title and Action Icons */}
                    <div className="flex justify-between items-start mb-1">
                      {editingConversationId === conversation.conversation_id ? (
                        <div className="flex items-center gap-1 flex-1 mr-2">
                          <input
                            type="text"
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveTitle(conversation.conversation_id);
                            }}
                            className="p-1 text-green-500 hover:text-green-600 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="p-1 text-red-500 hover:text-red-600 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 mr-2 flex-1">
                            {conversation.title || conversation.prompt}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTitle(conversation.conversation_id, conversation.title || conversation.prompt);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Edit Title"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmationId(conversation.conversation_id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {conversation.prompt}
                    </p>

                    {/* Small Image Thumbnail */}
                    {conversation.first_image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
                        <img
                          src={conversation.first_image}
                          alt="Conversation preview"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete Conversation?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optimize Prompt Modal */}
      {isOptimizePromptOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsOptimizePromptOpen(false);
            setOptimizePromptInput('');
            setOptimizedPrompt('');
            setOptimizeError(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {optimizedPrompt ? 'Improved Prompt' : 'Your Prompt'}
              </h2>
              <button
                onClick={() => {
                  setIsOptimizePromptOpen(false);
                  setOptimizePromptInput('');
                  setOptimizedPrompt('');
                  setOptimizeError(null);
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {!optimizedPrompt ? (
                <>
                  {/* Initial State: Input Prompt */}
                  <div>
                    <textarea
                      value={optimizePromptInput}
                      onChange={(e) => {
                        setOptimizePromptInput(e.target.value);
                        setOptimizeError(null);
                      }}
                      placeholder="Enter your prompt"
                      maxLength={500}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {optimizePromptInput.length} / 500
                      </div>
                    </div>
                  </div>

                  {optimizeError && (
                    <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      {optimizeError}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptimizePrompt()}
                    disabled={!optimizePromptInput.trim() || isOptimizing}
                    className="w-full px-4 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>Optimize (cost 1 Basic Credit)</>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  {/* After Optimization: Show Improved Prompt */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Improved Prompt
                    </h3>
                    <textarea
                      value={optimizedPrompt}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white resize-none"
                      rows={8}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUseOptimizedPrompt}
                      className="flex-1 px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Use
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRegenerateOptimizedPrompt}
                      disabled={isOptimizing}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-4 h-4" />
                          Regenerate
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Dropdown */}
      <UserProfileDropdown
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        position={userProfilePosition}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Adjust Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Choose Art Style */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Choose Art Style
                  </h3>
                  <div className="max-h-[180px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-4 gap-3">
                      {artStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedArtStyle(style.id)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedArtStyle === style.id
                            ? "border-purple-600 dark:border-purple-400 ring-2 ring-purple-200 dark:ring-purple-800"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                        >
                          {style.image ? (
                            <img
                              src={style.image}
                              alt={style.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full border-2 border-purple-400 dark:border-purple-500 flex items-center justify-center">
                                <X className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                            </div>
                          )}
                          {selectedArtStyle === style.id && (
                            <div className="absolute inset-0 bg-purple-600/20 dark:bg-purple-400/20 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-400 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-1 text-center truncate">
                            {style.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number of images */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Number of images
                  </h3>
                  <div className="flex gap-2">
                    {[1, 2, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumImages(num)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${numImages === num
                          ? "bg-purple-600 dark:bg-purple-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    cost {numImages * 5} Basic Credits
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Negative Prompt */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Negative Prompt
                  </h3>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Type anything you don't want in your image, e.g. wrong finger."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Seed */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Seed
                    </h3>
                    <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Aspect Ratio */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Aspect Ratio
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max={aspectRatios.length - 1}
                      value={aspectRatios.findIndex(
                        (r) => r.value === aspectRatio
                      )}
                      onChange={(e) =>
                        setAspectRatio(
                          aspectRatios[parseInt(e.target.value)].value
                        )
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                    />
                    <input
                      type="text"
                      value={aspectRatio}
                      onChange={(e) => {
                        const ratio = aspectRatios.find(
                          (r) => r.value === e.target.value
                        );
                        if (ratio) setAspectRatio(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Show Example Prompts Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show Example Prompts
                  </span>
                  <button
                    onClick={() => setShowExamplePrompts(!showExamplePrompts)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${showExamplePrompts
                      ? "bg-purple-600 dark:bg-purple-500"
                      : "bg-gray-300 dark:bg-gray-600"
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showExamplePrompts ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {/* Keep Prompt Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Keep Prompt
                  </span>
                  <button
                    onClick={() => setKeepPrompt(!keepPrompt)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${keepPrompt
                      ? "bg-purple-600 dark:bg-purple-500"
                      : "bg-gray-300 dark:bg-gray-600"
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${keepPrompt ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
