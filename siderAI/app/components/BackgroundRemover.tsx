'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiConfig';



export default function BackgroundRemover() {
  const searchParams = useSearchParams();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [cdnURL, setCdnURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const imageUrl = searchParams?.get('imageUrl');
    if (imageUrl) {
      setUploadedImage(imageUrl);
      setCdnURL(imageUrl);
      // Set a placeholder fileId to enable the confirm button, as the API only needs the URL
      setFileId('url-provided');
    }
  }, [searchParams]);

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
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setProcessedImage(null);
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleConfirm = async () => {
    if (!uploadedImage || !cdnURL || isProcessing) return;
    setIsProcessing(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || !authToken.trim()) {
        console.error('Authentication required. Please login first.');
        setIsProcessing(false);
        return;
      }
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.trim()}`,
      };
      const response = await fetch(getApiUrl(API_ENDPOINTS.IMAGES.REMOVE_BACKGROUND), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image_url: cdnURL,
          model: 'rembg',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to remove background' }));
        console.error('Error removing background:', errorData);
        setIsProcessing(false);
        return;
      }
      const data = await response.json();
      console.log('Background removal response:', data);

      let processedImageUrl: string | null = null;
      if (data.code === 0 && data.data) {
        processedImageUrl = data.data.processed_url || data.data.url || data.data.image_url || data.data.cdnURL || data.data.signedCDNURL;
      } else if (data.processed_url) {
        processedImageUrl = data.processed_url;
      } else if (data.url) {
        processedImageUrl = data.url;
      } else if (data.image_url) {
        processedImageUrl = data.image_url;
      }

      if (processedImageUrl) {
        setProcessedImage(processedImageUrl);
      } else {
        console.error('No processed image URL found in response:', data);
      }
    } catch (error) {
      console.error('Error removing background:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSlug="background-remover"
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />

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
                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-purple-50/30 dark:bg-purple-900/10 min-h-[300px] transition-all duration-200 group ${uploadedImage
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
                ) : isProcessing ? (
                  <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[300px]">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Removing background...</span>
                  </div>
                ) : processedImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full min-h-[300px] flex items-center justify-center"
                  >
                    {/* Checkerboard pattern for transparency */}
                    <div
                      className="absolute inset-0 opacity-30 rounded-lg"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={processedImage}
                      alt="Background Removed"
                      className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-lg relative z-10"
                    />
                  </motion.div>
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
                      Each use deducts <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">2</span> Advanced Credits
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
                        src="/individuals-a.png"
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
                      {/* Checkerboard pattern for transparency */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/individuals-removed.png"
                        alt="Background Removed"
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg relative z-10"
                      />
                      <div className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1 z-20">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Background Removed</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Confirm Button and Change Image Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-4 mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setProcessedImage(null);
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              className="p-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
              title={processedImage ? "Upload New Image" : "Change Image"}
            >
              <div className="relative">
                <ImageIcon className="w-5 h-5" />
                <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full" />
              </div>
            </motion.button>
            {!processedImage && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                disabled={!uploadedImage || !fileId || isProcessing}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Confirm
                  </>
                )}
              </motion.button>
            )}
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

