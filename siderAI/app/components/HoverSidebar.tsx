'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    Sparkles,
    MessageCircle,
    Grid3x3,
    ChevronRight,
    Folder,
    Settings,
    FileText,
    Layout,
    PenTool,
    Presentation,
    BarChart3,
    Palette,
    Square,
    Type,
    Eraser,
    ScanSearch,
    Maximize2,
    Layers,
    Languages,
    Image as ImageIcon,
    Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfileDropdown from './UserProfileDropdown';
import { getCurrentUser } from '../lib/authService';

interface HoverSidebarProps {
    activeItem?: string;
}

const HoverSidebar = ({ activeItem = 'ai-inbox', variant = 'hover' }: HoverSidebarProps & { variant?: 'hover' | 'sidebar' }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // More Dropdown State
    const [isMoreHovered, setIsMoreHovered] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 });

    // User Profile State
    const [isUserProfileOpen, setIsUserProfileOpen] = React.useState(false);
    const [userProfilePosition, setUserProfilePosition] = React.useState({ top: 0, left: 0 });
    const [userData, setUserData] = React.useState<any>(null);

    const moreButtonRef = React.useRef<HTMLButtonElement>(null);
    const userProfileButtonRef = React.useRef<HTMLButtonElement>(null);
    const router = useRouter();

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

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    // User Data Effect
    React.useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await getCurrentUser(token);
                    // Handle potential response structures
                    const user = response.data?.user || response.user || response.data || response;
                    setUserData(user);
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (error) {
                    console.error('Failed to fetch user info:', error);
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        try {
                            setUserData(JSON.parse(storedUser));
                        } catch { }
                    }
                }
            } else {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        setUserData(JSON.parse(storedUser));
                    } catch { }
                }
            }
        };
        fetchUser();
    }, []);

    // More Dropdown Positioning Effect
    React.useEffect(() => {
        const updatePosition = () => {
            if (isMoreHovered && moreButtonRef.current) {
                const rect = moreButtonRef.current.getBoundingClientRect();
                const dropdownHeight = 360;
                const viewportHeight = window.innerHeight;
                const buttonCenterY = rect.top + rect.height / 2;
                const dropdownTop = buttonCenterY - dropdownHeight / 2;

                let finalTop = dropdownTop;
                if (dropdownTop < 0) {
                    finalTop = 8;
                } else if (dropdownTop + dropdownHeight > viewportHeight) {
                    finalTop = viewportHeight - dropdownHeight - 8;
                }

                setDropdownPosition({
                    top: finalTop,
                    left: rect.right + 8,
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

    const getUserInitial = () => {
        if (userData?.username) return userData.username.charAt(0).toUpperCase();
        if (userData?.name) return userData.name.charAt(0).toUpperCase();
        if (userData?.email) return userData.email.charAt(0).toUpperCase();
        return 'U';
    };

    const handleUserProfileClick = () => {
        if (userProfileButtonRef.current) {
            const rect = userProfileButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 320;
            const dropdownHeight = 400;
            const viewportWidth = window.innerWidth;

            let top = rect.top - dropdownHeight - 8;
            let left = rect.left;

            if (top < 8) top = rect.bottom + 8;
            if (left + dropdownWidth > viewportWidth - 8) left = viewportWidth - dropdownWidth - 8;

            setUserProfilePosition({ top, left });
            setIsUserProfileOpen(!isUserProfileOpen);
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

    const SidebarContent = (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${variant === 'sidebar' ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
            {/* Sidebar Content */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Webby Sider
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Chat */}
                <button
                    onClick={() => handleNavigation('/chat')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeItem === 'chat'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">Chat</span>
                </button>

                {/* Agents */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Agents
                    </h3>
                    <div className="space-y-1">
                        {agents.map((agent) => {
                            const Icon = agent.icon;
                            const agentSlug = agent.name.toLowerCase().replace(/\s+/g, '-');
                            const route = agentSlug === 'deep-research'
                                ? `/wisebase/${agentSlug}`
                                : `/agents/${agentSlug}`;

                            const isActive = agentSlug === 'deep-research'
                                ? (activeItem === 'deep-research' || activeItem === 'scholar-research')
                                : activeItem === agentSlug;

                            return (
                                <button
                                    key={agent.name}
                                    onClick={() => handleNavigation(route)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm">{agent.name}</span>
                                </button>
                            );
                        })}

                        <div
                            className="relative"
                            onMouseEnter={() => setIsMoreHovered(true)}
                            onMouseLeave={() => setIsMoreHovered(false)}
                        >
                            <button
                                ref={moreButtonRef}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Grid3x3 className="w-4 h-4" />
                                <span className="text-sm">More</span>
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </button>

                            {isMoreHovered && moreButtonRef.current && (
                                <>
                                    <div
                                        className="fixed z-[9998] pointer-events-auto"
                                        style={{
                                            top: `${dropdownPosition.top}px`,
                                            left: `${moreButtonRef.current.getBoundingClientRect().right}px`,
                                            width: '8px',
                                            height: '360px',
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
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Wisebase
                    </h3>
                    <div className="space-y-1">
                        {wisebaseItems.map((item) => {
                            const Icon = item.icon;
                            const isAIInbox = item.name === 'AI Inbox';
                            // Highlight based on activeItem prop
                            const isActive = isAIInbox && activeItem === 'ai-inbox';

                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        if (isAIInbox) {
                                            handleNavigation('/wisebase/ai-inbox');
                                        }
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around bg-gray-50 dark:bg-gray-800/50">
                <button
                    ref={userProfileButtonRef}
                    onClick={handleUserProfileClick}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm hover:shadow-md transition-shadow"
                >
                    {getUserInitial()}
                </button>
                <UserProfileDropdown
                    isOpen={isUserProfileOpen}
                    onClose={() => setIsUserProfileOpen(false)}
                    position={userProfilePosition}
                />
                <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                    <Folder className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    if (variant === 'sidebar') {
        return (
            <div className="w-64 h-full relative z-10">
                {SidebarContent}
            </div>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsSidebarOpen(true)}
            onMouseLeave={() => setIsSidebarOpen(false)}
        >
            <button className="p-5 hover:bg-gray-100 rounded-md">
                <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-14 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 z-[100] flex flex-col"
                    >
                        {SidebarContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HoverSidebar;
