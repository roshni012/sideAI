'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Share2,
    FileText,
    HelpCircle,
    PanelRight,
    CloudUpload,
    Mic,
    Clock,
    Plus,
    Send,
    MoreVertical,
    Search,
    Bot,
    ChevronDown,
    Download,
    Sparkles,
    Layout,
    X,
    Globe,
    GraduationCap,
    Book,
    Check,
    File,
    MessageCircle,
    List,
    MoreHorizontal,
    Trash2,
    ArrowRightLeft,
    Loader2,
    ChevronUp
} from 'lucide-react';
import RichTextEditor from './components/RichTextEditor';
import HoverSidebar from '../../components/HoverSidebar';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { fetchNotes as fetchNotesService, deleteNote as deleteNoteService, type Note } from '../../services/notesService';
import AIWriteDialog from './components/AIWriteDialog';

const AIInbox = () => {
    const [isInstructionModalOpen, setIsInstructionModalOpen] = React.useState(false);
    const [isInstructionEnabled, setIsInstructionEnabled] = React.useState(false);
    const [isAIWriteDialogOpen, setIsAIWriteDialogOpen] = React.useState(false);
    const [isLinkInputOpen, setIsLinkInputOpen] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState('');
    const [linkError, setLinkError] = React.useState('');
    const [isNotesPanelOpen, setIsNotesPanelOpen] = React.useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = React.useState(false);
    const [isEditingNote, setIsEditingNote] = React.useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
    const [selectedModel, setSelectedModel] = React.useState('Sider Fusion');
    const [isFilePanelOpen, setIsFilePanelOpen] = React.useState(true);
    const [showFileContent, setShowFileContent] = React.useState(true);
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [expandedNoteIds, setExpandedNoteIds] = React.useState<Set<string>>(new Set());
    const [hoveredNoteId, setHoveredNoteId] = React.useState<string | null>(null);
    const [activeMenuNoteId, setActiveMenuNoteId] = React.useState<string | null>(null);
    const [deleteConfirmationNoteId, setDeleteConfirmationNoteId] = React.useState<string | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearchActive, setIsSearchActive] = React.useState(false);

    // Chat Source State
    const [isChatSourceOpen, setIsChatSourceOpen] = React.useState(false);
    const [chatSource, setChatSource] = React.useState({
        webSearch: true,
        knowledge: true,
        webType: 'general' as 'general' | 'scholar'
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const modelDropdownRef = React.useRef<HTMLDivElement>(null);
    const chatSourceRef = React.useRef<HTMLDivElement>(null);

    // Model definitions
    const availableModels = [
        // Basic models
        { id: 'sider-fusion', name: 'Sider Fusion', category: 'basic', image: '/image/fusion.png' },
        { id: 'gpt-5-mini', name: 'GPT-5 mini', category: 'basic', image: '/image/gpt_5mini.png' },
        { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', category: 'basic', image: '/image/claude.png' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'basic', image: '/image/gemini.png' },
        { id: 'kimi-k2', name: 'Kimi K2', category: 'basic', image: '/image/kimi.png' },
        { id: 'deepseek-v3', name: 'DeepSeek V3', category: 'basic', image: '/image/deepseek.png' },
        // Advanced models
        { id: 'gpt-5.1', name: 'GPT-5.1', category: 'advanced', image: '/image/chatgpt.png' },
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro', category: 'advanced', image: '/image/gemini.png' },
        { id: 'gpt-5', name: 'GPT-5', category: 'advanced', image: '/image/chatgpt.png' },
        { id: 'gpt-4.1', name: 'GPT-4.1', category: 'advanced', image: '/image/chatgpt.png' },
        { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', category: 'advanced', image: '/image/claude.png' },
        { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', category: 'advanced', image: '/image/claude.png' },
    ];

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
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

    const validateUrl = (url: string) => {
        if (!url.trim()) {
            setLinkError('');
            return false;
        }

        try {
            new URL(url);
            setLinkError('');
            return true;
        } catch {
            setLinkError('Invalid URL');
            return false;
        }
    };

    const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLinkUrl(value);
        validateUrl(value);
    };

    const handleAddLink = () => {
        if (validateUrl(linkUrl)) {
            console.log('Adding link:', linkUrl);
            // Add your link handling logic here
            setLinkUrl('');
            setIsLinkInputOpen(false);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            console.log('Selected files:', files);
            // Add your file upload logic here
        }
    };

    // Handle content visibility timing for expand
    React.useEffect(() => {
        if (isFilePanelOpen) {
            const timer = setTimeout(() => {
                setShowFileContent(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isFilePanelOpen]);

    // Close chat source dialog on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chatSourceRef.current && !chatSourceRef.current.contains(event.target as Node)) {
                setIsChatSourceOpen(false);
            }
        };

        if (isChatSourceOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isChatSourceOpen]);

    // Close note action menu on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if click is outside the menu
            if (activeMenuNoteId && !target.closest('.note-action-menu')) {
                setActiveMenuNoteId(null);
            }
        };

        if (activeMenuNoteId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenuNoteId]);

    const fetchNotes = async () => {
        const notes = await fetchNotesService();
        setNotes(notes);
    };

    const handleDeleteNote = async () => {
        if (!deleteConfirmationNoteId) return;

        setIsDeleting(true);
        try {
            const result = await deleteNoteService(deleteConfirmationNoteId);
            if (result.code === 0) {
                setDeleteConfirmationNoteId(null);
                setShowDeleteSuccess(true);
                setTimeout(() => setShowDeleteSuccess(false), 3000);
                fetchNotes();
            }
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setIsDeleting(false);
        }
    };

    React.useEffect(() => {
        fetchNotes();
    }, []);

    React.useEffect(() => {
        if (isNotesPanelOpen) {
            fetchNotes();
        }
    }, [isNotesPanelOpen]);

    return (
        <div className="h-screen flex flex-col bg-white text-gray-900 font-sans relative overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <HoverSidebar activeItem="ai-inbox" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white">
                            <span className="text-xs font-bold">AI</span>
                        </div>
                        <span className="font-semibold text-sm">AI Inbox</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-full flex items-center gap-1 cursor-not-allowed">
                        <Share2 className="w-3 h-3" />
                        Share the wisebase
                    </button>
                    <button
                        onClick={() => setIsInstructionModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                        <FileText className="w-3 h-3" />
                        Instruction
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Help Center
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar with Animation */}
                <AnimatePresence>
                    {isFilePanelOpen && (
                        <motion.aside
                            initial={{ width: 0 }}
                            animate={{ width: 320 }}
                            exit={{ width: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="border-r border-gray-200 p-4 flex flex-col bg-white shrink-0 overflow-hidden"
                        >
                            {showFileContent && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-semibold text-sm">File</h2>
                                        <button
                                            onClick={() => {
                                                setShowFileContent(false); // Hide content immediately
                                                setTimeout(() => {
                                                    setIsFilePanelOpen(false); // Then start collapse animation after a tiny delay
                                                }, 10);
                                            }}
                                            className="p-1 rounded cursor-pointer"
                                        >
                                            <PanelRight className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
                                        <div className="w-10 h-10 mb-4 text-gray-400">
                                            <CloudUpload className="w-full h-full" />
                                        </div>
                                        <p className="text-sm font-medium text-blue-600 mb-2">
                                            Click or drag file to this page to upload
                                        </p>
                                        <p className="text-xs text-gray-400 mb-6 max-w-[200px]">
                                            Supported file types include: File, Web page, Image, Audio and Video
                                        </p>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            multiple
                                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                                        />

                                        <button
                                            onClick={handleFileSelect}
                                            className="bg-black text-white text-xs font-medium px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors mb-3 w-full max-w-[200px] cursor-pointer"
                                        >
                                            Select file
                                        </button>

                                        {!isLinkInputOpen ? (
                                            <button
                                                onClick={() => setIsLinkInputOpen(true)}
                                                className="text-xs font-medium text-gray-600 hover:text-black cursor-pointer"
                                            >
                                                Enter link
                                            </button>
                                        ) : (
                                            <div className="w-full max-w-[240px]">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={linkUrl}
                                                        onChange={handleLinkChange}
                                                        placeholder="Paste URL here"
                                                        className={`flex-1 px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${linkError
                                                            ? 'border-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:border-blue-500'
                                                            }`}
                                                    />
                                                    <button
                                                        onClick={handleAddLink}
                                                        disabled={!linkUrl.trim() || !!linkError}
                                                        className={`p-2 rounded-lg transition-colors ${!linkUrl.trim() || !!linkError
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-black text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {linkError && (
                                                    <p className="text-xs text-red-500 mt-1 text-left">{linkError}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.aside>
                    )}
                </AnimatePresence >

                {/* Main Content */}
                < main className="flex-1 flex flex-col relative bg-white" >


                    {/* Top Right Toggle */}
                    {
                        !isNotesPanelOpen && (
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => {
                                        setIsNotesPanelOpen(true);
                                        setIsHistoryPanelOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    <Layout className="w-4 h-4" />
                                    Notes
                                </button>
                            </div>
                        )
                    }

                    <div className="flex-1 flex flex-col items-center justify-center p-8 pb-32">
                        <h1 className="text-3xl font-bold mb-12">AI Inbox</h1>

                        <div className="flex gap-4 w-full max-w-3xl">
                            {/* Card 1 */}
                            <div className="flex-1 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer group">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-red-50 rounded-md text-red-500">
                                        <Mic className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-sm">REC Note</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Instantly generate complete notes from your recordings.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="flex-1 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer group">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-green-50 rounded-md text-green-500">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-sm">Gamify File</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Generate interactive demos for easier understanding
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Input Area */}
                    <div className="w-full max-w-4xl mx-auto px-6 pb-8">
                        {/* Chat Source Bar (Collapsed State) */}
                        {!isFilePanelOpen && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm w-full mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">Chat Source</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-medium">0 Files</span>
                                </div>
                                <button
                                    onClick={() => setIsFilePanelOpen(true)}
                                    className="text-sm font-semibold text-gray-900 hover:text-gray-700 cursor-pointer"
                                >
                                    View
                                </button>
                            </div>
                        )}

                        {/* Controls Bar */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2 relative" ref={modelDropdownRef}>
                                <button
                                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200"
                                >
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                        <Sparkles className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    {selectedModel}
                                    <ChevronDown className="w-3 h-3 text-gray-500" />
                                </button>

                                {/* Model Dropdown */}
                                {isModelDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
                                    >
                                        <div className="p-2">
                                            {/* Basic Models */}
                                            <div className="mb-4">
                                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Basic
                                                </div>
                                                {availableModels
                                                    .filter((model) => model.category === 'basic')
                                                    .map((model) => {
                                                        const isSelected = selectedModel === model.name;
                                                        return (
                                                            <button
                                                                key={model.id}
                                                                onClick={() => {
                                                                    setSelectedModel(model.name);
                                                                    setIsModelDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${isSelected
                                                                    ? 'bg-purple-50 text-purple-700'
                                                                    : 'hover:bg-gray-50 text-gray-700'
                                                                    }`}
                                                            >
                                                                {model.image && (
                                                                    <img src={model.image} alt={model.name} className="w-5 h-5 rounded" />
                                                                )}
                                                                <span className="text-sm font-medium">{model.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                            </div>

                                            {/* Advanced Models */}
                                            <div>
                                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Advanced
                                                </div>
                                                {availableModels
                                                    .filter((model) => model.category === 'advanced')
                                                    .map((model) => {
                                                        const isSelected = selectedModel === model.name;
                                                        return (
                                                            <button
                                                                key={model.id}
                                                                onClick={() => {
                                                                    setSelectedModel(model.name);
                                                                    setIsModelDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${isSelected
                                                                    ? 'bg-purple-50 text-purple-700'
                                                                    : 'hover:bg-gray-50 text-gray-700'
                                                                    }`}
                                                            >
                                                                {model.image && (
                                                                    <img src={model.image} alt={model.name} className="w-5 h-5 rounded" />
                                                                )}
                                                                <span className="text-sm font-medium">{model.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative" ref={chatSourceRef}>
                                    <button
                                        onClick={() => setIsChatSourceOpen(!isChatSourceOpen)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                        {(() => {
                                            if (chatSource.webSearch && chatSource.knowledge) {
                                                return chatSource.webType === 'scholar' ? 'Scholar Search & All Files' : 'General Search & All Files';
                                            }
                                            if (!chatSource.webSearch && chatSource.knowledge) {
                                                return 'All Files';
                                            }
                                            if (chatSource.webSearch && !chatSource.knowledge) {
                                                return chatSource.webType === 'scholar' ? 'Scholar Search' : 'General Search';
                                            }
                                            return 'Source';
                                        })()}
                                    </button>

                                    <AnimatePresence>
                                        {isChatSourceOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute bottom-full right-0 mb-3 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5"
                                                style={{ transformOrigin: 'bottom right' }}
                                            >
                                                <h3 className="font-semibold text-lg mb-4 text-gray-900">Chat Source</h3>

                                                {/* Web Search Section */}
                                                <div className="mb-6">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm text-gray-500 font-medium">Web Search</span>
                                                        <button
                                                            onClick={() => {
                                                                setChatSource(prev => ({ ...prev, webSearch: !prev.webSearch }));
                                                                setIsChatSourceOpen(false);
                                                            }}
                                                            className={`w-10 h-6 rounded-full transition-colors relative ${chatSource.webSearch ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${chatSource.webSearch ? 'left-5' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    <div className={`bg-gray-50 rounded-xl p-1 ${!chatSource.webSearch ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <button
                                                            onClick={() => {
                                                                setChatSource(prev => ({ ...prev, webType: 'general' }));
                                                                setIsChatSourceOpen(false);
                                                            }}
                                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Globe className="w-4 h-4 text-gray-700" />
                                                                <span className="text-gray-700 font-medium">General</span>
                                                            </div>
                                                            {chatSource.webType === 'general' && <Check className="w-4 h-4 text-purple-600" />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setChatSource(prev => ({ ...prev, webType: 'scholar' }));
                                                                setIsChatSourceOpen(false);
                                                            }}
                                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <GraduationCap className="w-4 h-4 text-gray-700" />
                                                                <span className="text-gray-700 font-medium">Scholar</span>
                                                            </div>
                                                            {chatSource.webType === 'scholar' && <Check className="w-4 h-4 text-purple-600" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-gray-100 my-5" />

                                                {/* Knowledge Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm text-gray-500 font-medium">Knowledge</span>
                                                        <button
                                                            onClick={() => {
                                                                setChatSource(prev => ({ ...prev, knowledge: !prev.knowledge }));
                                                                setIsChatSourceOpen(false);
                                                            }}
                                                            className={`w-10 h-6 rounded-full transition-colors relative ${chatSource.knowledge ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${chatSource.knowledge ? 'left-5' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    <div className={`bg-gray-50 rounded-xl p-1 ${!chatSource.knowledge ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <div
                                                            onClick={() => setIsChatSourceOpen(false)}
                                                            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <File className="w-4 h-4 text-gray-700" />
                                                                <span className="text-gray-700 font-medium">Files <span className="text-purple-500 font-normal ml-1">All Sources</span></span>
                                                            </div>
                                                            <Check className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div
                                                            onClick={() => setIsChatSourceOpen(false)}
                                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                                        >
                                                            <Book className="w-4 h-4 text-gray-700" />
                                                            <span className="text-gray-700 font-medium">Notes</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsHistoryPanelOpen(true);
                                        setIsNotesPanelOpen(false);
                                    }}
                                    className={`p-1.5 hover:bg-gray-100 rounded-md ${isHistoryPanelOpen ? 'text-black bg-gray-100' : 'text-gray-500'}`}
                                >
                                    <Clock className="w-4 h-4" />
                                </button>
                                <button className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Input Box */}
                        <div className="relative border border-gray-200 rounded-2xl shadow-sm bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                            <textarea
                                placeholder="Ask anything, / prompts"
                                className="w-full min-h-[120px] p-4 pr-12 resize-none outline-none text-sm text-gray-800 placeholder:text-gray-300 rounded-2xl"
                            />

                            <div className="absolute bottom-3 left-3">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                    <Bot className="w-3.5 h-3.5" />
                                    Deep Research
                                    <MoreVertical className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>

                            <div className="absolute bottom-3 right-3">
                                <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main >

                {/* Notes Side Panel */}
                {
                    isNotesPanelOpen && (
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 h-full"
                        >
                            {isEditingNote ? (
                                <RichTextEditor
                                    onClose={() => setIsEditingNote(false)}
                                    onNoteSaved={() => {
                                        fetchNotes();
                                        setIsEditingNote(false);
                                    }}
                                />
                            ) : (
                                <>
                                    {/* Panel Header */}
                                    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-semibold text-sm">Note ({notes.length})</h2>
                                            <button className="p-1 hover:bg-gray-100 rounded-md">
                                                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setIsNotesPanelOpen(false)}
                                            className="p-1 hover:bg-gray-100 rounded-md"
                                        >
                                            <PanelRight className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Sub-header (Search & Add) */}
                                    {/* Sub-header (Search & Add) */}
                                    <div className="px-4 py-3 shrink-0">
                                        {isSearchActive ? (
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                                <Search className="w-4 h-4 text-gray-500" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search notes..."
                                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => {
                                                        setIsSearchActive(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="p-1 hover:bg-gray-200 rounded-md"
                                                >
                                                    <X className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setIsSearchActive(true)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                                    <List className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingNote(true)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Note
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes List */}
                                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0">
                                        {notes.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                                <div className="w-20 h-20 mb-4 flex items-center justify-center">
                                                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="20" y="15" width="40" height="50" rx="2" stroke="#D1D5DB" strokeWidth="2" fill="white" />
                                                        <path d="M28 25 L52 25" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                                                        <path d="M28 32 L48 32" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                                                        <path d="M28 39 L45 39" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                                                        <circle cx="40" cy="40" r="15" fill="#F3F4F6" opacity="0.5" />
                                                        <path d="M35 40 L38 43 L45 36" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <h3 className="font-semibold text-base mb-2">Start taking notes</h3>
                                                <p className="text-xs text-gray-500 mb-6 max-w-[200px] leading-relaxed">
                                                    Highlight, save the conversation as notes, or click Add note.
                                                </p>
                                            </div>
                                        ) : (
                                            notes
                                                .filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((note) => (
                                                    <div
                                                        key={note.id}
                                                        className={`border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer bg-white relative group ${expandedNoteIds.has(note.id) ? 'pb-8' : ''}`}
                                                        onMouseEnter={() => setHoveredNoteId(note.id)}
                                                        onMouseLeave={() => setHoveredNoteId(null)}
                                                    >
                                                        <h3 className="font-semibold text-sm mb-2 pr-6">{note.title}</h3>
                                                        <div className={`text-xs text-gray-500 mb-3 [&_*]:m-0 ${expandedNoteIds.has(note.id) ? '' : 'line-clamp-2'}`}>
                                                            <MarkdownRenderer content={note.content.replace(/\n/g, '  \n')} />
                                                        </div>
                                                        <div className="text-[10px] text-gray-400">
                                                            {new Date(note.updated_at).toLocaleString()}
                                                        </div>

                                                        {/* Expand/Collapse Button */}
                                                        {(hoveredNoteId === note.id || expandedNoteIds.has(note.id)) && (
                                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newSet = new Set(expandedNoteIds);
                                                                        if (newSet.has(note.id)) {
                                                                            newSet.delete(note.id);
                                                                        } else {
                                                                            newSet.add(note.id);
                                                                        }
                                                                        setExpandedNoteIds(newSet);
                                                                    }}
                                                                    className="w-8 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-200 shadow-sm transition-colors cursor-pointer"
                                                                >
                                                                    {expandedNoteIds.has(note.id) ? (
                                                                        <ChevronUp className="w-3 h-3 text-gray-600" />
                                                                    ) : (
                                                                        <ChevronDown className="w-3 h-3 text-gray-600" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Hover Menu */}
                                                        {(hoveredNoteId === note.id || activeMenuNoteId === note.id) && (
                                                            <div className="absolute top-2 right-2 note-action-menu">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                                                                    }}
                                                                    className="p-1 hover:bg-gray-100 rounded-md bg-white shadow-sm border border-gray-100 transition-colors cursor-pointer"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                                </button>

                                                                {/* Dropdown */}
                                                                {activeMenuNoteId === note.id && (
                                                                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden py-1">
                                                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors">
                                                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                            Move
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveMenuNoteId(null);
                                                                                setDeleteConfirmationNoteId(note.id);
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-4 border-t border-gray-200 flex gap-3 shrink-0 bg-white">
                                        <button className="flex-1 flex items-center justify-center gap-2 p-2 rounded-full border text-purple-600 text-xs font-medium transition-colors cursor-pointer">
                                            <MessageCircle className="w-4 h-4" />
                                            Chat with Notes
                                        </button>
                                        <button
                                            onClick={() => setIsAIWriteDialogOpen(true)}
                                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-full border text-purple-600 text-xs font-medium transition-colors cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            AI Write
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.aside>
                    )
                }

            </div >

            {/* History Side Panel Overlay */}
            <AnimatePresence>
                {
                    isHistoryPanelOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsHistoryPanelOpen(false)}
                                className="absolute inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
                            />

                            {/* Panel */}
                            <motion.aside
                                initial={{ x: '100%', opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '100%', opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="absolute right-4 top-4 bottom-4 w-[400px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100"
                            >
                                {/* Panel Header */}
                                <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-lg">History <span className="text-gray-400 font-normal text-sm">(0)</span></h2>
                                    </div>
                                    <button
                                        onClick={() => setIsHistoryPanelOpen(false)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="p-5 pb-0">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="w-full bg-gray-50/80 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Empty State */}
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-24 h-24 mb-4 flex items-center justify-center">
                                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M30 35H70V75H30V35Z" fill="white" stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
                                            <path d="M30 35L40 25H80V65L70 75" stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
                                            <path d="M70 35V75" stroke="#1F2937" strokeWidth="2" />
                                            <path d="M30 35H70" stroke="#1F2937" strokeWidth="2" />
                                            <circle cx="75" cy="70" r="3" fill="white" stroke="#1F2937" strokeWidth="2" />
                                            <path d="M45 50H55" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M45 60H60" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />

                                            {/* Floating elements for "empty" feel */}
                                            <path d="M25 30L28 27" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M22 38L25 38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M78 22L81 19" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        No chat history.
                                    </p>
                                </div>
                            </motion.aside>
                        </>
                    )
                }
            </AnimatePresence >

            {/* Instruction Modal */}
            {
                isInstructionModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-xl w-[600px] max-w-full overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-base">Set Wisebase instructions</h3>
                                <button
                                    onClick={() => setIsInstructionModalOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Enable instruction</span>
                                    <button
                                        onClick={() => setIsInstructionEnabled(!isInstructionEnabled)}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${isInstructionEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${isInstructionEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                    You can give the AI special instructions and context to use for all conversations in this Wisebase, so its responses are better aligned with your expectations.
                                </p>

                                <textarea
                                    className="w-full h-48 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder={`Example of filled-in content:
• Context about your Wisebase
• Special instructions for how Sider should respond
• Any specific knowledge Sider should reference
• Guidelines for the tone and approach you prefer`}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsInstructionModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={isInstructionEnabled}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isInstructionEnabled
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-black hover:bg-gray-800'
                                        }`}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI Write Dialog */}
            <AnimatePresence>
                {isAIWriteDialogOpen && (
                    <AIWriteDialog
                        isOpen={isAIWriteDialogOpen}
                        onClose={() => setIsAIWriteDialogOpen(false)}
                        notes={notes}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {deleteConfirmationNoteId && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-base">Are you sure you want to delete this note?</h3>
                            <button onClick={() => setDeleteConfirmationNoteId(null)} className="p-1 hover:bg-gray-100 rounded-md">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setDeleteConfirmationNoteId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteNote}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            <AnimatePresence>
                {showDeleteSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-[70] text-sm font-medium flex items-center gap-2"
                    >
                        <Check className="w-4 h-4 text-green-400" />
                        Deleted successfully
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AIInbox;
