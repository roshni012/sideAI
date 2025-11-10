'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Zap,
  Star,
  Diamond,
  Folder,
  MessageCircle,
  Settings as SettingsIcon,
  Grid3x3,
  FileText,
  Home,
  Square,
  Type,
  Eraser,
  ScanSearch,
  Maximize2,
  Layers,
  Palette,
  Paintbrush,
  Undo2,
  Redo2,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';

const sidebarTools = [
  { name: 'AI Image Generator', slug: 'ai-image-generator', icon: Palette },
  { name: 'Background Remover', slug: 'background-remover', icon: Square },
  { name: 'Text Remover', slug: 'text-remover', icon: Type },
  { name: 'Photo Eraser', slug: 'photo-eraser', icon: Eraser },
  { name: 'Inpaint', slug: 'inpaint', icon: ScanSearch },
  { name: 'Image Upscaler', slug: 'image-upscaler', icon: Maximize2 },
  { name: 'Background Changer', slug: 'background-changer', icon: Layers },
];

export default function Inpaint() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const [brushSize, setBrushSize] = useState(50);
  const [selectedTool, setSelectedTool] = useState<'brush' | 'eraser'>('brush');
  const [prompt, setPrompt] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paintedAreas, setPaintedAreas] = useState<Array<{ x: number; y: number; size: number; tool: 'brush' | 'eraser' }>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [history, setHistory] = useState<Array<Array<{ x: number; y: number; size: number; tool: 'brush' | 'eraser' }>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageBounds, setImageBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const updateImageBounds = () => {
    if (imageRef.current && imageContainerRef.current) {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      setImageBounds({
        x: imgRect.left - containerRect.left,
        y: imgRect.top - containerRect.top,
        width: imgRect.width,
        height: imgRect.height,
      });
    }
  };

  const isPointInImage = (x: number, y: number): boolean => {
    return (
      x >= imageBounds.x &&
      x <= imageBounds.x + imageBounds.width &&
      y >= imageBounds.y &&
      y <= imageBounds.y + imageBounds.height
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });

      if (isDrawing && uploadedImage && isPointInImage(x, y)) {
        if (selectedTool === 'eraser') {
          // Remove painted areas as eraser moves
          setPaintedAreas((prev) =>
            prev.filter(
              (area) =>
                Math.sqrt(
                  Math.pow(area.x - x, 2) + Math.pow(area.y - y, 2)
                ) > brushSize / 2
            )
          );
        } else {
          // Add paint stroke as mouse moves
          setCurrentPath((prev) => [...prev, { x, y }]);
          setPaintedAreas((prev) => {
            const updated = [...prev, { x, y, size: brushSize, tool: 'brush' as const }];
            return updated;
          });
        }
      }
    }
  };

  const handleMouseEnter = () => {
    setIsMouseOverImage(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOverImage(false);
    setIsDrawing(false);
    if (currentPath.length > 0) {
      // Only save path points that are within image bounds
      const validPath = currentPath.filter((point) => isPointInImage(point.x, point.y));
      if (validPath.length > 0) {
        setPaintedAreas((prev) => [
          ...prev,
          ...validPath.map((point) => ({
            x: point.x,
            y: point.y,
            size: brushSize,
            tool: selectedTool,
          })),
        ]);
      }
      setCurrentPath([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!uploadedImage) return;
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Only allow drawing if click is within image bounds
      if (!isPointInImage(x, y)) return;
      
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      
      if (selectedTool === 'eraser') {
        // Remove painted areas near the click point
        setPaintedAreas((prev) =>
          prev.filter(
            (area) =>
              Math.sqrt(
                Math.pow(area.x - x, 2) + Math.pow(area.y - y, 2)
              ) > brushSize / 2
          )
        );
      } else {
        // Add paint stroke
        setPaintedAreas((prev) => {
          const updated = [...prev, { x, y, size: brushSize, tool: 'brush' as const }];
          return updated;
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 0 && selectedTool === 'brush') {
        const newAreas = currentPath.map((point) => ({
          x: point.x,
          y: point.y,
          size: brushSize,
          tool: 'brush' as const,
        }));
        setPaintedAreas((prev) => {
          const updated = [...prev, ...newAreas];
          // Save to history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push([...updated]);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          return updated;
        });
        setCurrentPath([]);
      } else if (selectedTool === 'eraser') {
        // Save current state to history when erasing
        setPaintedAreas((prev) => {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push([...prev]);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          return prev;
        });
      }
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPaintedAreas([...history[newIndex]]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setPaintedAreas([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPaintedAreas([...history[newIndex]]);
    }
  };

  const handleRedraw = () => {
    if (!uploadedImage || !prompt.trim() || paintedAreas.length === 0) return;
    setIsProcessing(true);
    // TODO: Implement inpaint API call with paintedAreas and prompt
    // The paintedAreas contain the coordinates that should be removed
    // The prompt describes what should appear in place of the removed area
    setTimeout(() => {
      // Clear painted areas and history after processing
      setPaintedAreas([]);
      setHistory([]);
      setHistoryIndex(-1);
      setProcessedImage(uploadedImage); // Placeholder - replace with actual processed image
      setIsProcessing(false);
    }, 2000);
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
                Sider
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
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">← Home</span>
          </motion.button>

          {sidebarTools.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.slug === 'inpaint';
            return (
              <motion.button
                key={item.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  window.location.href = `/create/image/${item.slug}`;
                }}
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

        {/* Credits/Upgrade Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Zap className="w-4 h-4" />
              <span>30</span>
              <span className="mx-1">0</span>
              <Star className="w-4 h-4" />
              <span>0</span>
              <Diamond className="w-4 h-4" />
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

        {/* Footer Icons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around">
          <motion.button
            ref={userProfileButtonRef}
            onClick={handleUserProfileClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center transition-all hover:shadow-lg w-9"
          >
            <span className="text-white font-semibold text-sm">P</span>
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto pb-24">
          {/* Upload Zone */}
          <div className="w-full max-w-5xl mb-8 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !uploadedImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-purple-50/30 dark:bg-purple-900/10 min-h-[300px] transition-all duration-200 group ${
                  uploadedImage
                    ? 'p-4 cursor-default'
                    : 'p-16 cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-100/50 dark:hover:bg-purple-900/20 hover:shadow-lg'
                }`}
                style={{ marginTop: '15%' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedImage ? (
                  <motion.div
                    ref={imageContainerRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    className="relative w-full h-full min-h-[300px] flex items-center justify-center cursor-crosshair"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      src={uploadedImage}
                      alt="Uploaded"
                      onLoad={updateImageBounds}
                      className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-lg pointer-events-none"
                    />
                    {/* Canvas for drawing */}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                    {/* Painted Areas Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {paintedAreas.map((area, index) => (
                        <div
                          key={index}
                          className="absolute rounded-full"
                          style={{
                            left: `${area.x}px`,
                            top: `${area.y}px`,
                            width: `${area.size}px`,
                            height: `${area.size}px`,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor:
                              area.tool === 'brush'
                                ? 'rgba(147, 51, 234, 0.3)'
                                : 'transparent',
                            border:
                              area.tool === 'brush'
                                ? '2px solid rgba(147, 51, 234, 0.6)'
                                : 'none',
                          }}
                        />
                      ))}
                    </div>
                    {/* Brush Cursor Circle */}
                    {isMouseOverImage && (isDrawing || paintedAreas.length > 0) && (
                      <div
                        className={`absolute pointer-events-none border-2 rounded-full transition-all duration-100 ${
                          selectedTool === 'brush'
                            ? 'border-purple-500'
                            : 'border-red-500'
                        }`}
                        style={{
                          left: `${mousePosition.x}px`,
                          top: `${mousePosition.y}px`,
                          width: `${brushSize}px`,
                          height: `${brushSize}px`,
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.5)',
                        }}
                      />
                    )}
                    {/* Overlay for re-upload */}
                    {/* <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Change Image
                      </button>
                    </div> */}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                    <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 group-hover:scale-110 transition-transform duration-200 relative">
                      <ImageIcon className="w-10 h-10 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                      <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400 absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      Click or drag image here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      Each use deducts <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">3</span> Advanced Credits
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Example/Preview Section */}
          {!uploadedImage && (
            <div className="w-full max-w-2xl mb-8">
              <div className="flex items-center gap-4 justify-center">
                {/* Before Image */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-48"
                >
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/eraser.jpg"
                        alt="Original Image"
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Original Image</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-shrink-0"
                >
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                    <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 w-6"></div>
                    <ArrowRight className="w-5 h-5" />
                    <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 w-6"></div>
                  </div>
                </motion.div>

                {/* After Image */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-48"
                >
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    <div className="aspect-square bg-white dark:bg-gray-800 flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/inpaint removed.jpg"
                        alt="Inpainted"
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                      />
                      <div className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Inpainted</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Tool Controls Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-64 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 z-50"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                {/* Left: Undo/Redo and Paint/Eraser */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleUndo}
                    disabled={!uploadedImage || historyIndex < 0}
                    className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
                    title="Undo"
                  >
                    <Undo2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRedo}
                    disabled={!uploadedImage || historyIndex >= history.length - 1}
                    className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
                    title="Redo"
                  >
                    <Redo2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!uploadedImage}
                    className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
                    title="Change Image"
                  >
                    <div className="relative">
                      <ImageIcon className="w-5 h-5" />
                      <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-white dark:bg-gray-700 rounded-full" />
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedTool('brush')}
                    disabled={!uploadedImage}
                    className={`p-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTool === 'brush'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    title="Paint"
                  >
                    <Paintbrush className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedTool('eraser')}
                    disabled={!uploadedImage}
                    className={`p-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTool === 'eraser'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    title="Eraser"
                  >
                    <Eraser className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Center: Slider */}
                <div className="flex-1 flex flex-col items-center gap-0 max-w-md">
                  {/* Slider */}
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    disabled={!uploadedImage}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((brushSize - 10) / (100 - 10)) * 100}%, rgb(229, 231, 235) ${((brushSize - 10) / (100 - 10)) * 100}%, rgb(229, 231, 235) 100%)`,
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      const percentage = ((Number(target.value) - 10) / (100 - 10)) * 100;
                      target.style.background = `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${percentage}%, rgb(229, 231, 235) ${percentage}%, rgb(229, 231, 235) 100%)`;
                    }}
                  />
                  <style dangerouslySetInnerHTML={{ __html: `
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background: white;
                      border: 2px solid rgb(147, 51, 234);
                      cursor: pointer;
                      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background: white;
                      border: 2px solid rgb(147, 51, 234);
                      cursor: pointer;
                      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                    }
                    input[type="range"]::-ms-thumb {
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background: white;
                      border: 2px solid rgb(147, 51, 234);
                      cursor: pointer;
                      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                    }
                  `}} />
                </div>

                {/* Right: Text Input and Redraw Button */}
                <div className="flex items-end gap-4">
                  {/* Text Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Describe how you want the marked area to be redrawn.
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe how you want the marked area to be redrawn"
                        maxLength={1000}
                        className="px-3 py-2 pr-20 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-80"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                        {prompt.length} / 1000
                      </span>
                    </div>
                  </div>

                  {/* Redraw Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRedraw}
                    disabled={!uploadedImage || !prompt.trim() || paintedAreas.length === 0 || isProcessing}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    {isProcessing ? 'Processing...' : 'Redraw'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
      </main>

      {/* Profile Dropdown */}
      <UserProfileDropdown
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        position={userProfilePosition}
      />
    </div>
  );
}

