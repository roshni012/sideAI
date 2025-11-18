'use client';

import { useState, useRef } from 'react';
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
  Loader2,
  LucideIcon,
  Trash2,
  Copy,
  RotateCw,
  X,
  HelpCircle,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';

interface AIImageGeneratorProps {
  tool: string;
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
  { label: 'Nano Banana', value: 'google/nano-banana' },
  { label: 'SD 3.0 Medium', value: 'stability-ai/stable-diffusion-3-medium' },
  { label: 'SD 3.5 Large Turbo', value: 'stability-ai/stable-diffusion-3.5-large-turbo' },
  { label: 'SD 3.5 Large', value: 'stability-ai/stable-diffusion-3.5-large' },
  { label: 'Ideogram 1.0 Turbo', value: 'ideogram/ideogram-1.0-turbo' },
  { label: 'Ideogram 2.0', value: 'ideogram/ideogram-2.0' },
  { label: 'Ideogram 2.0 Turbo', value: 'ideogram/ideogram-2.0-turbo' },
  { label: 'GPT Image 1', value: 'openai/gpt-image-1' },
];

const IMAGE_GENERATION_DEFAULTS = {
  width: 1024,
  height: 1024,
  num_outputs: 1,
  guidance_scale: 7.5,
  num_inference_steps: 30,
};

const artStyles = [
  { id: 'none', name: 'None', image: null },
  { id: 'photographic', name: 'Photographic', image: '/image/girl1.png' },
  { id: 'anime', name: 'Anime', image: '/image/girl2.png' },
  { id: 'fantasy', name: 'Fantasy Art', image: '/image/girl3.png' },
  { id: 'lineart', name: 'Line Art', image: '/image/girl4.png' },
  { id: '3d', name: '3D Model', image: '/image/girl1.png' },
  { id: 'neonpunk', name: 'Neonpunk', image: '/image/girl2.png' },
  { id: 'comic', name: 'Comic Book', image: '/image/girl3.png' },
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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedArtStyle, setSelectedArtStyle] = useState('none');
  const [numImages, setNumImages] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('Auto');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showExamplePrompts, setShowExamplePrompts] = useState(true);
  const [keepPrompt, setKeepPrompt] = useState(false);

  const currentTool = toolConfig[tool] || toolConfig['ai-image-generator'];
  const isAIImageGenerator = tool === 'ai-image-generator';
  const selectedModelLabel =
    modelOptions.find((option) => option.value === selectedModel)?.label || 'Custom Model';
  const isPromptReady = prompt.trim().length > 0;

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
    // Don't clear existing images - keep them visible during regeneration

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

      const imageUrls: string[] | undefined =
        data?.data?.image_urls || data?.data?.images || data?.image_urls || data?.images;

      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        setGeneratedImages(imageUrls);
      } else {
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

    // Store the prompt and clear input field immediately
    setCurrentPrompt(trimmedPrompt);
    setPrompt('');
    // Clear existing images for a fresh generation
    setGeneratedImages([]);
    await generateImage(trimmedPrompt);
  };

  const handleCopyPrompt = async () => {
    if (!currentPrompt) return;
    try {
      await navigator.clipboard.writeText(currentPrompt);
      // Optional: Show a toast notification here
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleUsePrompt = () => {
    if (!currentPrompt) return;
    setPrompt(currentPrompt);
  };

  const handleRegenerate = async () => {
    if (!currentPrompt || isGenerating) return;
    await generateImage(currentPrompt);
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
            onClick={() => router.push('/chat')}
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
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                  Where your thoughts come alive as art. Just tell us what&apos;s on your mind, and watch as your ideas turn into awesome pictures! e.g. purple monster
                </p>

              {/* Generated Image or Example Images */}
              {generatedImages.length > 0 && currentPrompt ? (
                <div className="mb-6 p-6 rounded-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-base font-medium text-gray-900 dark:text-white">{currentPrompt}</p>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyPrompt}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Copy Prompt"
                      >
                        <Copy className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleUsePrompt}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="Use this Prompt"
                      >
                        <Type className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate"
                      >
                        <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      </motion.button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <motion.div
                        key={`${imageUrl}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-square rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {['girl1.png', 'girl2.png', 'girl3.png', 'girl4.png'].map((imageName, i) => (
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
                  ))}
                </div>
              )}

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
            <div className="fixed bottom-[96px] left-64 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm z-30">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Model Selector */}
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none pr-10 pl-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                    >
                      {modelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Icon buttons (Upload, Settings, Star) */}
                  <div className="flex items-center gap-2 ml-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title="Image to Image"
                    >
                      <Upload className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title="Adjust Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                      title="Optimize Prompt"
                    >
                      <Star className="w-4 h-4" />
                    </motion.button>
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
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="History"
                  >
                    <Clock className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="Add"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom Chat Panel */}
            <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                {currentTool && (
                  <>
                    <currentTool.icon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentTool.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">This tool is coming soon!</p>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>

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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adjust Settings</h2>
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
                  <div className="grid grid-cols-4 gap-3">
                    {artStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedArtStyle(style.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedArtStyle === style.id
                            ? 'border-purple-600 dark:border-purple-400 ring-2 ring-purple-200 dark:ring-purple-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                            ? 'bg-purple-600 dark:bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Seed</h3>
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
                      value={aspectRatios.findIndex((r) => r.value === aspectRatio)}
                      onChange={(e) => setAspectRatio(aspectRatios[parseInt(e.target.value)].value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                    />
                    <input
                      type="text"
                      value={aspectRatio}
                      onChange={(e) => {
                        const ratio = aspectRatios.find((r) => r.value === e.target.value);
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Example Prompts</span>
                  <button
                    onClick={() => setShowExamplePrompts(!showExamplePrompts)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showExamplePrompts
                        ? 'bg-purple-600 dark:bg-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        showExamplePrompts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Keep Prompt Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Keep Prompt</span>
                  <button
                    onClick={() => setKeepPrompt(!keepPrompt)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      keepPrompt
                        ? 'bg-purple-600 dark:bg-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        keepPrompt ? 'translate-x-5' : 'translate-x-0'
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
