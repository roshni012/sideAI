'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Image as ImageIcon,
    ListOrdered,
    List,
    MoreHorizontal,
    Copy,
    Cloud,
    X,
    Bold,
    Italic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createNote } from '../../../services/notesService';

interface RichTextEditorProps {
    onClose: () => void;
    onNoteSaved?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ onClose, onNoteSaved }) => {
    const [title, setTitle] = useState('Untitled');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    const executeCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                moreButtonRef.current &&
                !moreButtonRef.current.contains(event.target as Node)
            ) {
                setIsMoreMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const htmlToMarkdown = (html: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const processNode = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || '';
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const el = node as HTMLElement;
            let content = '';
            el.childNodes.forEach(child => {
                content += processNode(child);
            });

            const tagName = el.tagName.toLowerCase();
            switch (tagName) {
                case 'b':
                case 'strong':
                    return `**${content}**`;
                case 'i':
                case 'em':
                    return `*${content}*`;
                case 'ul':
                    return '\n' + content;
                case 'ol':
                    return '\n' + content;
                case 'li':
                    const parent = el.parentElement;
                    if (parent?.tagName.toLowerCase() === 'ol') {
                        const index = Array.from(parent.children).indexOf(el) + 1;
                        return `${index}. ${content}\n`;
                    }
                    return `- ${content}\n`;
                case 'br':
                    return '\n';
                case 'div':
                    if (!content.trim() || content === '\n') {
                        return '\n';
                    }
                    return content + '\n';
                case 'p':
                    return content + '\n';
                default:
                    return content;
            }
        };

        let result = processNode(tempDiv);
        result = result.replace(/\n{3,}/g, '\n\n');
        return result.trim();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="Insert Image">
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => executeCommand('insertOrderedList')}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => executeCommand('insertUnorderedList')}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </button>

                    <div className="relative">
                        <button
                            ref={moreButtonRef}
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className={`p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors ${isMoreMenuOpen ? 'bg-gray-100' : ''}`}
                            title="More"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {isMoreMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1"
                                >
                                    <button
                                        onClick={() => {
                                            executeCommand('bold');
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Bold className="w-4 h-4" />
                                        <span>Bold</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            executeCommand('italic');
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Italic className="w-4 h-4" />
                                        <span>Italic</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors bg-gray-50" title="Copy">
                        <Copy className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Saved">
                        <Cloud className="w-4 h-4" />
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const htmlContent = editorRef.current?.innerHTML || '';
                                const content = htmlToMarkdown(htmlContent);
                                const result = await createNote({
                                    title: title,
                                    content: content,
                                    wisebase_id: "inbox",
                                    metadata: {
                                        source: 'rich-text-editor',
                                    }
                                });

                                if (onNoteSaved) onNoteSaved();
                            } catch (error) {
                                console.error('Error saving note:', error);
                            } finally {
                                onClose();
                            }
                        }}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-4"
                    placeholder="Untitled"
                />
                <div
                    ref={editorRef}
                    contentEditable
                    className="w-full min-h-[200px] outline-none text-gray-600 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 cursor-text [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    data-placeholder="Input content"
                    onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            document.execCommand('insertHTML', false, '&#009');
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
