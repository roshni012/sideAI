import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FileText, List, File, HelpCircle, ArrowRight } from 'lucide-react';
import { type Note } from '../../../services/notesService';
import MarkdownRenderer from '../../../components/MarkdownRenderer';

interface AIWriteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
}

type WritingMode = 'fast-drafting' | 'outline-mode' | 'briefing-doc' | 'faq';

const AIWriteDialog: React.FC<AIWriteDialogProps> = ({ isOpen, onClose, notes }) => {
    const [selectedNoteIds, setSelectedNoteIds] = React.useState<Set<string>>(new Set());
    const [writingMode, setWritingMode] = React.useState<WritingMode>('fast-drafting');
    const [requirements, setRequirements] = React.useState('');
    const [hoveredMode, setHoveredMode] = React.useState<WritingMode | null>(null);

    const toggleNoteSelection = (noteId: string) => {
        const newSet = new Set(selectedNoteIds);
        if (newSet.has(noteId)) {
            newSet.delete(noteId);
        } else {
            newSet.add(noteId);
        }
        setSelectedNoteIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedNoteIds.size === notes.length) {
            setSelectedNoteIds(new Set());
        } else {
            setSelectedNoteIds(new Set(notes.map(n => n.id)));
        }
    };

    const handleStartWriting = () => {
        console.log('Start writing with:', {
            selectedNotes: Array.from(selectedNoteIds),
            mode: writingMode,
            requirements
        });
        onClose();
    };

    const modes: { id: WritingMode; label: string; icon: React.FC<any>; tooltip: string }[] = [
        { id: 'fast-drafting', label: 'Fast Drafting', icon: FileText, tooltip: 'Write an article based on my notes' },
        { id: 'outline-mode', label: 'Outline Mode', icon: List, tooltip: 'Generate a structured outline' },
        { id: 'briefing-doc', label: 'Briefing Doc', icon: File, tooltip: 'Create a briefing document' },
        { id: 'faq', label: 'FAQ', icon: HelpCircle, tooltip: 'Generate Frequently Asked Questions' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] h-[540px] flex overflow-hidden z-10 relative"
            >
                <div className="absolute top-5 right-5 z-20">
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex w-full h-full">
                    {/* Left Panel - Note Selection */}
                    <div className="w-[70%] border-r border-gray-100 p-6 flex flex-col bg-white">
                        <h2 className="text-xl font-bold mb-6 text-gray-900">Select Notes</h2>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                            {notes.length === 0 ? (
                                <div className="text-center text-gray-400 mt-20">
                                    No notes available
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {notes.map((note) => (
                                        <div
                                            key={note.id}
                                            onClick={() => toggleNoteSelection(note.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer relative group h-[150px] flex flex-col border-gray-200  ${selectedNoteIds.has(note.id)
                                                ? 'bg-white shadow-sm'
                                                : 'hover:border-gray-300 hover:shadow-md bg-white'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${selectedNoteIds.has(note.id)
                                                    ? 'bg-purple-600 border-purple-600'
                                                    : 'border-gray-300 group-hover:border-purple-400'
                                                    }`}>
                                                    {selectedNoteIds.has(note.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <h3 className="font-semibold text-sm text-gray-900 truncate w-full">{note.title}</h3>
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs text-gray-500 line-clamp-3 overflow-hidden leading-relaxed">
                                                <MarkdownRenderer content={note.content.replace(/\n/g, ' ')} />
                                            </div>
                                            <div className="mt-2 text-[10px] text-gray-300 font-medium">
                                                {new Date(note.updated_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 flex items-center gap-2">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black cursor-pointer group"
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${selectedNoteIds.size === notes.length && notes.length > 0
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'border-gray-300 group-hover:border-purple-400'
                                    }`}>
                                    {selectedNoteIds.size === notes.length && notes.length > 0 && <Check className="w-3 h-3" />}
                                </div>
                                <span className={selectedNoteIds.size > 0 ? "text-gray-900" : "text-gray-500"}>
                                    {selectedNoteIds.size === notes.length && notes.length > 0 ? "Unselect All" : `Select ${selectedNoteIds.size}`}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - AI Write Options */}
                    <div className="w-[30%] p-6 flex flex-col relative bg-white">
                        <div className="mb-8 pt-2">
                            <h2 className="text-xl font-bold mb-3 text-gray-900">AI Write</h2>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                The intelligent writing assistant will generate an article based on the notes you select.
                            </p>
                        </div>

                        <div className="space-y-8 flex-1">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Writing Mode</label>
                                <div className="grid grid-cols-2 gap-2.5 relative">
                                    {modes.map((mode) => (
                                        <div key={mode.id} className="relative">
                                            <button
                                                onClick={() => setWritingMode(mode.id)}
                                                onMouseEnter={() => setHoveredMode(mode.id)}
                                                onMouseLeave={() => setHoveredMode(null)}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${writingMode === mode.id
                                                    ? 'border-purple-600 text-purple-700 bg-white ring-1 ring-purple-600 shadow-sm'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <mode.icon className={`w-3.5 h-3.5 ${writingMode === mode.id ? 'text-purple-600' : 'text-gray-500'}`} />
                                                <span className="truncate">{mode.label}</span>
                                            </button>

                                            {/* Tooltip */}
                                            {hoveredMode === mode.id && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none">
                                                    {mode.tooltip}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Writing Requirements</label>
                                <textarea
                                    value={requirements}
                                    onChange={(e) => setRequirements(e.target.value)}
                                    placeholder="Input your writing requirements"
                                    className="w-full h-full min-h-[100px] p-4 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 bg-gray-50/30 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleStartWriting}
                                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer group"
                            >
                                Start Writing
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AIWriteDialog;
