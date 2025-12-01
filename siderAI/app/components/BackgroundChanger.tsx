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



export default function BackgroundChanger() {
  const searchParams = useSearchParams();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [cdnURL, setCdnURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const imageUrl = searchParams?.get('imageUrl');
    if (imageUrl) {
      setUploadedImage(imageUrl);
      setCdnURL(imageUrl);
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
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChange = async () => {
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
        instruction: `Change the background to: ${prompt.trim()}`,
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
        const errorData = await response.json().catch(() => ({ detail: 'Failed to change background' }));
        console.error('Error changing background:', errorData);
        alert(`Error: ${errorData.detail || errorData.msg || 'Failed to change background'}`);
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

        // Clear the prompt
        setPrompt('');

        // Show success message
        console.log('Background changed successfully:', data.data);
      } else {
        console.error('Unexpected response format:', data);
        alert('Failed to change background. Please try again.');
      }
    } catch (error) {
      console.error('Error calling background change API:', error);
      alert('An error occurred while changing the background. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSlug="background-changer"
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />

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
                onClick={() => !uploadedImage && !isUploading && fileInputRef.current?.click()}
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
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
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 group-hover:scale-110 transition-transform duration-200 relative">
                      <ImageIcon className="w-10 h-10 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                      <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400 absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      Click or drag image here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      Each use deducts <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">8</span> Advanced Credits
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Example/Preview Section */}
          {
            !uploadedImage && (
              <div className="w-full max-w-2xl mb-8">
                <div className="flex items-center gap-4 justify-center">
                  {/* Before Image */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-48"
                  > <img
                      src="/individuals-a.png"
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
                    className="w-48"
                  >
                    <img
                      src="/background replace.jpeg"
                      alt="Background Changed"
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                    />
                  </motion.div>
                </div>
              </div>
            )
          }

          {/* Tool Controls Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-64 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 z-50"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              {/* Re-upload Button */}
              {uploadedImage && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm flex-shrink-0"
                  title="Upload new image"
                >
                  <div className="relative">
                    <ImageIcon className="w-5 h-5" />
                    <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-white dark:bg-gray-700 rounded-full" />
                  </div>
                </motion.button>
              )}

              {/* Left: Text Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What do you want to change the background to?"
                  disabled={!uploadedImage}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Right: Change Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleChange}
                disabled={!uploadedImage || !prompt.trim() || isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-white" />
                {isProcessing ? 'Processing...' : 'Change'}
              </motion.button>
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

