'use client';

import { motion } from 'framer-motion';
import {
    Sparkles,
    Grid3x3,
    FileText,
    Home,
    Palette,
    Square,
    Type,
    Eraser,
    ScanSearch,
    Maximize2,
    Layers,
    Folder,
    MessageCircle,
    Settings as SettingsIcon,
    Languages,
    Image as ImageIcon,
} from 'lucide-react';
import { RefObject, useState, useEffect } from 'react';

interface UserData {
    name?: string;
    email?: string;
    username?: string;
}

const imageTools = [
    { name: 'AI Image Generator', slug: 'ai-image-generator', icon: Palette },
    { name: 'Background Remover', slug: 'background-remover', icon: Square },
    { name: 'Text Remover', slug: 'text-remover', icon: Type },
    { name: 'Photo Eraser', slug: 'photo-eraser', icon: Eraser },
    { name: 'Inpaint', slug: 'inpaint', icon: ScanSearch },
    { name: 'Image Upscaler', slug: 'image-upscaler', icon: Maximize2 },
    { name: 'Background Changer', slug: 'background-changer', icon: Layers },
];

const translatorTools = [
    { name: 'AI Translator', slug: 'text-translator', icon: Languages },
    { name: 'Image Translator', slug: 'image-translator', icon: ImageIcon },
];

interface SidebarProps {
    activeSlug: string;
    userProfileButtonRef: RefObject<HTMLButtonElement | null>;
    handleUserProfileClick: () => void;
}

export default function Sidebar({
    activeSlug,
    userProfileButtonRef,
    handleUserProfileClick,
}: SidebarProps) {
    const [userData, setUserData] = useState<UserData | null>(null);

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
        return '';
    };

    const isTranslator = activeSlug === 'text-translator' || activeSlug === 'image-translator';
    const currentTools = isTranslator ? translatorTools : imageTools;

    return (
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

                {currentTools.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.slug === activeSlug;
                    return (
                        <motion.button
                            key={item.slug}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                                if (isTranslator) {
                                    window.location.href = `/translator/${item.slug}`;
                                } else {
                                    window.location.href = `/create/image/${item.slug}`;
                                }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${isActive
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
                    <span className="text-white font-semibold text-sm">{getUserInitial()}</span>
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
    );
}
