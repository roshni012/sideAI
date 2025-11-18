'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
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
  Loader2,
} from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';

const sidebarTools = [
  { name: 'AI Image Generator', slug: 'ai-image-generator', icon: Palette },
  { name: 'Background Remover', slug: 'background-remover', icon: Square },
  { name: 'Text Remover', slug: 'text-remover', icon: Type },
  { name: 'Photo Eraser', slug: 'photo-eraser', icon: Eraser },
  { name: 'Inpaint', slug: 'inpaint', icon: ScanSearch },
  { name: 'Image Upscaler', slug: 'image-upscaler', icon: Maximize2 },
  { name: 'Background Changer', slug: 'background-changer', icon: Layers },
];

const magnificationOptions = [ '4X'];

export default function ImageUpscaler() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [cdnURL, setCdnURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const [selectedMagnification, setSelectedMagnification] = useState('4X');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);

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
      
      console.log('File uploaded successfully:', {
        fileId: uploadedFileId,
        filename: file.name,
        cdnURL: uploadedCdnURL,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setProcessedImage(null);
      setErrorMessage(null);
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setProcessedImage(null);
      setErrorMessage(null);
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const getScaleValue = (option: string) => {
    const numeric = parseInt(option, 10);
    return Number.isNaN(numeric) ? 2 : numeric;
  };

  const handleConfirm = async () => {
    if (!cdnURL || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        throw new Error('Authentication required. Please login first.');
      }

      const payload = {
        image_url: cdnURL,
        model: 'real-esrgan',
        scale: getScaleValue(selectedMagnification),
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.IMAGES.UPSCALE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data?.detail || data?.msg || 'Failed to upscale image';
        throw new Error(
          Array.isArray(detail)
            ? detail.map((item: { msg?: string; message?: string }) => item?.msg || item?.message).join(', ')
            : detail,
        );
      }

      const upscaledUrl: string | undefined =
        data?.data?.upscaled_image_url ||
        data?.data?.processed_image_url ||
        data?.upscaled_image_url ||
        data?.processed_image_url;

      if (upscaledUrl) {
        setProcessedImage(upscaledUrl);
      } else {
        setErrorMessage('Upscaling succeeded but no image was returned.');
      }
    } catch (error) {
      console.error('Error upscaling image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upscale image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
            onClick={() => (window.location.href = '/chat')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">← Home</span>
          </motion.button>

          {sidebarTools.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.slug === 'image-upscaler';
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
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
                onClick={() => !uploadedImage && !isUploading && fileInputRef.current?.click()}
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
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[300px]">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
                  </div>
                ) : uploadedImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full min-h-[300px] flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-lg"
                    />
                    {/* Overlay for re-upload */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Change Image
                      </button>
                    </div>
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
                      Each use deducts <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">1</span> Advanced Credits
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
                        src="/JPG-Enhancer-and-Upscaler.png"
                        alt="Upscaled"
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                      />
                     
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="w-full max-w-5xl mb-6 rounded-lg border border-red-200 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Image Preview and Controls Section */}
          {uploadedImage && (
            <div className="w-full max-w-5xl mb-8">
              <div className="flex items-center gap-6">
                {/* Image Preview */}
                <div className="flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Magnification and Confirm Controls */}
                <div className="flex flex-col gap-4 items-start">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      image magnification:
                    </label>
                    <div className="flex gap-2">
                      {magnificationOptions.map((option) => (
                        <motion.button
                          key={option}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedMagnification(option)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            selectedMagnification === option
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    disabled={!cdnURL || isProcessing}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    {isProcessing ? 'Processing...' : 'Confirm'}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {processedImage && (
            <div className="w-full max-w-5xl mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upscaled Result</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Original</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage ?? ''}
                    alt="Original"
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Upscaled ({selectedMagnification})</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImage}
                    alt="Upscaled"
                    className="w-full h-auto rounded-lg border border-purple-200 dark:border-purple-700 shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tool Controls Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-64 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
              {/* Left: Empty space or future controls */}
              <div className="flex items-center gap-2"></div>

              {/* Center: Magnification and Confirm */}
              <div className="flex-1 flex items-center justify-center gap-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    image magnification:
                  </label>
                  <div className="flex gap-2">
                    {magnificationOptions.map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMagnification(option)}
                        disabled={!uploadedImage}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedMagnification === option
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={!cdnURL || isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </motion.button>
              </div>

              {/* Right: Empty space */}
              <div className="flex items-center gap-2"></div>
            </div>
          </motion.div>
        </div>
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

