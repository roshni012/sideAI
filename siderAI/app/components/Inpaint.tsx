'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Paintbrush,
  Undo2,
  Redo2,
  Loader2,
  Eraser,
} from 'lucide-react';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';



interface Stroke {
  points: { x: number; y: number }[];
  size: number;
  tool: 'brush' | 'eraser';
}

export default function Inpaint() {
  const searchParams = useSearchParams();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [cdnURL, setCdnURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  // Replaced paintedAreas with strokes for Canvas rendering
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [imageBounds, setImageBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const imageUrl = searchParams?.get('imageUrl');
    if (imageUrl) {
      setUploadedImage(imageUrl);
      setCdnURL(imageUrl);
      setFileId('url-provided');
    }
  }, [searchParams]);

  // Canvas Rendering Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageContainerRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Match canvas size to image container
    canvas.width = imageContainerRef.current.clientWidth;
    canvas.height = imageContainerRef.current.clientHeight;

    // Clear with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.lineWidth = stroke.size;

      if (stroke.tool === 'eraser') {
        // Eraser removes the painted strokes, revealing the image underneath
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Fully opaque for complete removal
      } else {
        // Brush paints purple strokes
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'; // Purple with opacity
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }, [strokes, imageBounds]);

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

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const objectURL = URL.createObjectURL(file);
    setUploadedImage(objectURL); // Show preview immediately

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required. Please login first.');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
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
        setIsUploading(false);
        return;
      }

      const data = await response.json();
      const uploadedFileId = data?.data?.fileID || data?.data?.id;
      const uploadedCdnURL = data?.data?.cdnURL || data?.data?.signedCDNURL;

      setFileId(uploadedFileId);
      setCdnURL(uploadedCdnURL);

      // Use CDN URL if available, otherwise keep object URL
      if (uploadedCdnURL) {
        setUploadedImage(uploadedCdnURL);
        URL.revokeObjectURL(objectURL);
      }

      // Reset state on new upload
      setStrokes([]);
      setHistory([]);
      setHistoryIndex(-1);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const updateImageBounds = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setImageBounds({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  };

  // Update bounds on window resize
  useEffect(() => {
    window.addEventListener('resize', updateImageBounds);
    return () => window.removeEventListener('resize', updateImageBounds);
  }, []);

  const isPointInImage = (x: number, y: number): boolean => {
    return (
      x >= imageBounds.x &&
      x <= imageBounds.x + imageBounds.width &&
      y >= imageBounds.y &&
      y <= imageBounds.y + imageBounds.height
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!uploadedImage || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only allow drawing if click is within image bounds
    if (!isPointInImage(x, y)) return;

    setIsDrawing(true);

    // Start a new stroke
    const newStroke: Stroke = {
      points: [{ x, y }],
      size: brushSize,
      tool: selectedTool
    };

    setStrokes(prev => [...prev, newStroke]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });

    if (isDrawing && uploadedImage) {
      // Add point to the last stroke
      setStrokes(prev => {
        const lastStroke = prev[prev.length - 1];
        if (!lastStroke) return prev;

        const updatedStroke = {
          ...lastStroke,
          points: [...lastStroke.points, { x, y }]
        };

        return [...prev.slice(0, -1), updatedStroke];
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);

      // Save to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(strokes);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleMouseEnter = () => {
    setIsMouseOverImage(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOverImage(false);
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setStrokes([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  };

  const handleRedraw = async () => {
    if (!uploadedImage || !prompt.trim()) return;

    setIsProcessing(true);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required. Please login first.');
        setIsProcessing(false);
        return;
      }

      const requestBody = {
        image_url: cdnURL || uploadedImage,
        instruction: prompt.trim(),
        model: 'instruct-pix2pix', // Default model
        image_guidance_scale: 1.5,
        num_inference_steps: 100
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.IMAGES.EDIT), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.trim()}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to edit image' }));
        console.error('Error editing image:', errorData);
        alert(`Error: ${errorData.detail || errorData.msg || 'Failed to edit image'}`);
        setIsProcessing(false);
        return;
      }

      const data = await response.json();

      // The API returns: { code, msg, data: { edited_image_url, original_image_url, instruction, model } }
      if (data.code === 0 && data.data?.edited_image_url) {
        // Replace the original image with the edited one
        setUploadedImage(data.data.edited_image_url);
        setCdnURL(data.data.edited_image_url);
        setProcessedImage(data.data.edited_image_url);

        // Clear the strokes and history after successful processing
        setStrokes([]);
        setHistory([]);
        setHistoryIndex(-1);

        // Clear the prompt
        setPrompt('');

        // Show success message
        console.log('Image edited successfully:', data.data);
      } else {
        console.error('Unexpected response format:', data);
        alert('Failed to process image. Please try again.');
      }
    } catch (error) {
      console.error('Error calling image edit API:', error);
      alert('An error occurred while processing the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar
        activeSlug="inpaint"
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto pb-24">
          {/* Upload Zone */}
          <div className="w-full max-w-5xl mb-4 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !uploadedImage && !isUploading && fileInputRef.current?.click()}
                /* fixed upload zone height so layout doesn't change after image upload */
                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-purple-50/30 dark:bg-purple-900/10 transition-all duration-200 group overflow-hidden relative
                  h-[300px] md:h-[400px]
                  ${uploadedImage ? 'p-4 cursor-default' : 'flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-100/50 dark:hover:bg-purple-900/20 hover:shadow-lg'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
                  </div>
                ) : uploadedImage ? (
                  <motion.div
                    ref={imageContainerRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    className="relative w-full h-full flex items-center justify-center cursor-crosshair select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      src={uploadedImage}
                      alt="Uploaded"
                      onLoad={updateImageBounds}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      /* constrain image to the upload zone (no parent resize) */
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg pointer-events-none"
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
                    {/* Brush Cursor Circle */}
                    {isMouseOverImage && (isDrawing || strokes.length > 0) && (
                      <div
                        className={`absolute pointer-events-none border-2 rounded-full transition-all duration-100 ${selectedTool === 'brush'
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
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
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
            <div className="w-full max-w-2xl mb-4 flex-shrink-0">
              <div className="flex items-center gap-8 justify-center">
                {/* Before Image */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-48 flex-shrink-0"
                >
                  <img
                    src="/eraser.jpg"
                    alt="Original Image"
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  />
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
                  className="w-48 flex-shrink-0"
                >
                  <img
                    src="/inpaint removed.jpg"
                    alt="Inpainted"
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  />
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
              <div className="relative flex items-center rounded-lg bg-white dark:bg-gray-700 shadow-sm" style={{ marginLeft: '55px' }}>
                {/* Highlight slider */}
                <div
                  className="absolute top-0 bottom-0 w-1/2 bg-purple-100 dark:bg-purple-900/30 rounded-lg transition-all duration-300"
                  style={{
                    left: selectedTool === 'brush' ? '0%' : '50%',
                  }}
                />

                {/* Brush */}
                <button
                  onClick={() => setSelectedTool('brush')}
                  disabled={!uploadedImage}
                  className="relative z-10 px-4 py-2 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50"
                >
                  <Paintbrush className="w-5 h-5" />
                </button>

                {/* Eraser */}
                <button
                  onClick={() => setSelectedTool('eraser')}
                  disabled={!uploadedImage}
                  className="relative z-10 px-4 py-2 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50"
                >
                  <Eraser className="w-5 h-5" />
                </button>
              </div>
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
                  background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((brushSize - 10) / (100 - 10)) * 100}%, rgb(229, 231, 235) ${((brushSize - 10) / (100 - 10)) * 100}%, rgb(229, 231, 235) 100%)`, width: '70%',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  const percentage = ((Number(target.value) - 10) / (100 - 10)) * 100;
                  target.style.background = `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${percentage}%, rgb(229, 231, 235) ${percentage}%, rgb(229, 231, 235) 100%)`;
                }}
              />
              <style dangerouslySetInnerHTML={{
                __html: `
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
                disabled={!uploadedImage || !prompt.trim() || isProcessing}
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
