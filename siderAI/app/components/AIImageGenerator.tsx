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
  Copy,
  RotateCw,
  X,
  HelpCircle,
  Zap,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';

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

const sidebarTools = [
  { name: 'AI Image Generator', slug: 'ai-image-generator', icon: Palette },
  { name: 'Background Remover', slug: 'background-remover', icon: Square },
  { name: 'Text Remover', slug: 'text-remover', icon: Type },
  { name: 'Photo Eraser', slug: 'photo-eraser', icon: Eraser },
  { name: 'Inpaint', slug: 'inpaint', icon: ScanSearch },
  { name: 'Image Upscaler', slug: 'image-upscaler', icon: Maximize2 },
  { name: 'Background Changer', slug: 'background-changer', icon: Layers },
];

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

  const generateImage = async (promptToUse: string) => {
    if (!promptToUse.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    // Ensure we have an active canvas
    let currentCanvasId = activeCanvasId;
    if (!currentCanvasId) {
      // Create a new canvas if none exists
      const newCanvasId = `canvas-${Date.now()}`;
      const newCanvas: Canvas = {
        id: newCanvasId,
        prompt: promptToUse.trim(),
        images: [],
        isNew: false,
      };
      setCanvases([newCanvas]);
      setActiveCanvasId(newCanvasId);
      currentCanvasId = newCanvasId; // Use the local variable instead of state
    }

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        throw new Error('Authentication required. Please login first.');
      }

      const payload = {
        prompt: promptToUse.trim(),
        model: selectedModel,
        width: IMAGE_GENERATION_DEFAULTS.width,
        height: IMAGE_GENERATION_DEFAULTS.height,
        num_outputs: numImages,
        guidance_scale: IMAGE_GENERATION_DEFAULTS.guidance_scale,
        num_inference_steps: IMAGE_GENERATION_DEFAULTS.num_inference_steps,
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.IMAGES.GENERATE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data?.detail || data?.msg || 'Failed to generate image';
        throw new Error(
          Array.isArray(detail)
            ? detail.map((item: { msg?: string; message?: string }) => item?.msg || item?.message).join(', ')
            : detail,
        );
      }

      // Debug: Log the response to see its structure
      console.log('API Response:', data);
      
      const imageUrls: string[] | undefined =
        data?.data?.image_urls || data?.data?.images || data?.image_urls || data?.images;

      console.log('Extracted imageUrls:', imageUrls);

      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        // Update the active canvas with new images using currentCanvasId
        setCanvases((prevCanvases) => {
          const updated = prevCanvases.map((canvas) => {
            if (canvas.id === currentCanvasId) {
              // If it's a new canvas with placeholders, replace them; otherwise append
              const updatedImages = canvas.isNew ? imageUrls : [...canvas.images, ...imageUrls];
              console.log('Updating canvas:', canvas.id, 'with images:', updatedImages);
              return {
                ...canvas,
                prompt: promptToUse.trim(),
                images: updatedImages,
                isNew: false, // Mark as no longer new after first generation
              };
            }
            return canvas;
          });
          console.log('Updated canvases:', updated);
          return updated;
        });
      } else {
        console.error('No images found in response. Response structure:', data);
        setErrorMessage('Image generation succeeded but no images were returned.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    // Clear input field immediately
    setPrompt('');
    await generateImage(trimmedPrompt);
  };

  const handleNewCanvas = () => {
    const newCanvasId = `canvas-${Date.now()}`;
    const newCanvas: Canvas = {
      id: newCanvasId,
      images: [
        '/image/girl1.png',
        '/image/girl2.png',
        '/image/girl3.png',
        '/image/girl4.png'
      ],
      isNew: true,
    };
    setCanvases((prev) => [...prev, newCanvas]);
    setActiveCanvasId(newCanvasId);
    setPrompt(''); // Clear prompt input
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
  
      const response = await fetch(
        `${getApiUrl(API_ENDPOINTS.IMAGES.HISTORY)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to load history');
      }
  
      setHistoryItems(data?.data || []);
    } catch (e) {
      console.error('History load error', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOptimizePrompt = async (promptToOptimize?: string) => {
    const promptText = promptToOptimize || optimizePromptInput.trim();
    if (!promptText || isOptimizing) return;

    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.IMAGES.OPTIMIZE_PROMPT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data?.detail || data?.msg || 'Failed to optimize prompt';
        throw new Error(
          Array.isArray(detail)
            ? detail.map((item: { msg?: string; message?: string }) => item?.msg || item?.message).join(', ')
            : detail,
        );
      }

      const optimized = data?.data?.optimized_prompt || data?.data?.prompt || data?.optimized_prompt || data?.prompt || '';
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
      <aside className="relative w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Webby Sider
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/chat")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">← Home</span>
          </motion.button>

          {sidebarTools.map((item, index) => {
            const Icon = item.icon;
            const isActive = tool === item.slug;
            return (
              <motion.button
                key={item.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/create/image/${item.slug}`)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </motion.button>
            );
          })}
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
            <span className="text-white font-semibold text-sm">U</span>
          </motion.button>
          {[Folder, MessageCircle, SettingsIcon].map((Icon, i) => (
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
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
                                className={`w-4 h-4 ${
                                  isGenerating ? "animate-spin" : ""
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
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                    isSelected
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
                                        className={`${
                                          isSelected
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
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                    isSelected
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
                                        className={`${
                                          isSelected
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
                    title="Add"
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
              <div className="space-y-6">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      {item.prompt}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {item.images?.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          className="w-full h-24 rounded-lg object-cover"
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPrompt(item.prompt)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                      >
                        Use Prompt
                      </button>

                      <button
                        onClick={() => generateImage(item.prompt)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
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
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedArtStyle === style.id
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
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                          numImages === num
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
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showExamplePrompts
                        ? "bg-purple-600 dark:bg-purple-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        showExamplePrompts ? "translate-x-5" : "translate-x-0"
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
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      keepPrompt
                        ? "bg-purple-600 dark:bg-purple-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        keepPrompt ? "translate-x-5" : "translate-x-0"
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
