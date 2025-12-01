'use client';

import { useState, useRef, useEffect, Dispatch, RefObject, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Home,
  Languages,
  Image as ImageIcon,
  ChevronDown,
  ArrowRight,
  Clipboard,
  Star,
  Brain,
  LucideIcon,
  Search,
  X,
  Copy,
} from 'lucide-react';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { API_ENDPOINTS, getApiUrl } from '../lib/apiConfig';

export default function TextTranslator() {
  const router = useRouter();
  const [sourceLanguage, setSourceLanguage] = useState('Auto-Detect');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [secondModel, setSecondModel] = useState('gpt-4.1-mini');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedText2, setTranslatedText2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompareEnabled, setIsCompareEnabled] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfilePosition, setUserProfilePosition] = useState({ top: 0, left: 0 });
  const userProfileButtonRef = useRef<HTMLButtonElement>(null);
  const [isSourceLangOpen, setIsSourceLangOpen] = useState(false);
  const [isTargetLangOpen, setIsTargetLangOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSecondModelDropdownOpen, setIsSecondModelDropdownOpen] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [isCopied1, setIsCopied1] = useState(false);
  const [isCopied2, setIsCopied2] = useState(false);

  const sourceLangRef = useRef<HTMLDivElement>(null);
  const targetLangRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const secondModelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceLangRef.current && !sourceLangRef.current.contains(event.target as Node)) {
        setIsSourceLangOpen(false);
      }
      if (targetLangRef.current && !targetLangRef.current.contains(event.target as Node)) {
        setIsTargetLangOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (secondModelDropdownRef.current && !secondModelDropdownRef.current.contains(event.target as Node)) {
        setIsSecondModelDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  interface AIModel {
    id: string;
    name: string;
    icon: LucideIcon | string;
    iconColor: string;
    description: string;
    cost: string;
    costType: 'basic' | 'advanced' | 'free';
  }

  const aiModels: AIModel[] = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      icon: '/image/gemini.png',
      iconColor: 'text-purple-500',
      description: "Google's first fully hybrid reasoning model, delivering a major upgrade in reasoning capabilities, while still prioritizing speed.",
      cost: 'Every 4k Characters Costs 1 Basic Credit',
      costType: 'basic',
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 mini',
      icon: '/image/chatgpt.png',
      iconColor: 'text-green-500',
      description: "OpenAI's latest model, offers fast, superior performance in chat, coding, and reasoning tasks for everyday use.",
      cost: 'Every 4k Characters Costs 3 Basic Credit',
      costType: 'basic',
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      icon: '/image/chatgpt.png',
      iconColor: 'text-blue-500',
      description: "OpenAI's flagship model for complex tasks. It is well suited for problem solving across domains.",
      cost: 'Every 4k Characters Costs 1 Advanced Credit',
      costType: 'advanced',
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      icon: '/image/deepseek.png',
      iconColor: 'text-blue-600',
      description: "DeepSeek's advanced model excelling in complex reasoning, mathematics, and coding tasks, delivering superior performance in both analytical and creative tasks.",
      cost: 'Every 4k Characters Costs 3 Basic Credits',
      costType: 'basic',
    },
    {
      id: 'claude-3.5-haiku',
      name: 'Claude 3.5 Haiku',
      icon: '/image/claude.png',
      iconColor: 'text-black',
      description: "Anthropic's most compact model, designed for near-instant responsiveness and seamless AI experiences that mimic human interactions",
      cost: 'Every 4k Characters Costs 1 Basic Credit',
      costType: 'basic',
    },
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.7 Sonnet',
      icon: '/image/claude.png',
      iconColor: 'text-orange-600',
      description: "Anthropic's most intelligent model, with visible step-by-step reasoning. Excels in real-world tasks, especially coding and web development, with significantly improved performance across all areas.",
      cost: 'Every 4k Characters Costs 1 Advanced Credit',
      costType: 'advanced',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      icon: '/image/gemini.png',
      iconColor: 'text-blue-600',
      description: "Google's best model for general performance across a wide range of tasks.",
      cost: 'Every 4k Characters Costs 1 Advanced Credit',
      costType: 'advanced',
    },
    {
      id: 'google',
      name: 'Google',
      icon: 'G',
      iconColor: 'text-blue-600',
      description: 'Free translation service powered by Google Translate.',
      cost: 'Free Translation',
      costType: 'free',
    },
    {
      id: 'bing',
      name: 'Bing',
      icon: 'b',
      iconColor: 'text-blue-600',
      description: 'Free translation service powered by Microsoft Bing Translator.',
      cost: 'Free Translation',
      costType: 'free',
    },
  ];

  const languages = [
    { code: 'auto', name: 'Auto-Detect', nativeName: 'Auto-Detect' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
    { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
    { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
    { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
    { code: 'ca', name: 'Catalan', nativeName: 'Català' },
    { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano' },
    { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)' },
    { code: 'co', name: 'Corsican', nativeName: 'Corsu' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto' },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
    { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'fy', name: 'Frisian', nativeName: 'Frysk' },
    { code: 'gl', name: 'Galician', nativeName: 'Galego' },
    { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
    { code: 'haw', name: 'Hawaiian', nativeName: 'Ōlelo Hawaiʻi' },
    { code: 'iw', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'jw', name: 'Javanese', nativeName: 'Basa Jawa' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ku', name: 'Kurdish (Kurmanji)', nativeName: 'Kurdî' },
    { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },
    { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
    { code: 'la', name: 'Latin', nativeName: 'Latine' },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
    { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
    { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
    { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
    { code: 'mi', name: 'Maori', nativeName: 'Māori' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
    { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
    { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'sm', name: 'Samoan', nativeName: 'Gagana faʻa Sāmoa' },
    { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig' },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
    { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
    { code: 'sn', name: 'Shona', nativeName: 'Chishona' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
    { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש' },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  ];


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

  const handleCopy = async (text: string, cardNumber: 1 | 2) => {
    try {
      await navigator.clipboard.writeText(text);
      if (cardNumber === 1) {
        setIsCopied1(true);
        setTimeout(() => setIsCopied1(false), 2000);
      } else {
        setIsCopied2(true);
        setTimeout(() => setIsCopied2(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = (cardNumber: 1 | 2) => {
    if (cardNumber === 1) {
      setTranslatedText('');
      setIsCopied1(false);
    } else {
      setTranslatedText2('');
      setIsCopied2(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setTranslatedText('');
    setTranslatedText2('');

    try {
      // Function to fetch translation for a single model
      const fetchTranslation = async (modelId: string) => {
        // Get auth token from localStorage
        const authToken = localStorage.getItem('authToken');

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add Authorization header if token exists
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(getApiUrl(API_ENDPOINTS.FEATURES.TRANSLATE_TEXT), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: inputText,
            target_language: targetLanguage,
            source_language: sourceLanguage === 'Auto-Detect' ? 'auto' : sourceLanguage,
            model: modelId,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();
        // Extract the translated text from the response
        // The API returns: {"code":0,"msg":"","data":{"original_text":"...","translated_text":"...","source_language":"...","target_language":"...","model":"...","tokens_used":...}}
        return data.data?.translated_text || data.translated_text || data.text || '';
      };

      // Fetch translation for the first model
      try {
        const text1 = await fetchTranslation(selectedModel);
        setTranslatedText(typeof text1 === 'string' ? text1 : JSON.stringify(text1));
      } catch (error) {
        console.error('Translation error for first model:', error);
        setTranslatedText('Error occurred during translation. Please try again.');
      }

      // If compare is enabled, fetch for the second model
      if (isCompareEnabled) {
        try {
          const text2 = await fetchTranslation(secondModel);
          setTranslatedText2(typeof text2 === 'string' ? text2 : JSON.stringify(text2));
        } catch (error) {
          console.error('Translation error for second model:', error);
          setTranslatedText2('Error occurred during translation. Please try again.');
        }
      }

    } catch (error) {
      console.error('Translation error:', error);
      // This catch is for any unexpected errors outside the translation calls
    } finally {
      setIsLoading(false);
    }
  };

  const renderModelDropdown = (
    currentModelId: string,
    setModelId: (id: string) => void,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    dropdownRef: React.RefObject<HTMLDivElement | null>,
    otherModelId?: string // Optional: the model ID selected in the other dropdown
  ) => {
    const currentModel = aiModels.find(m => m.id === currentModelId) || aiModels[0];

    return (
      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {(() => {
            const isStringIcon = typeof currentModel.icon === 'string';
            if (isStringIcon) {
              const iconStr = currentModel.icon as string;
              if (iconStr.startsWith('/')) {
                return <img src={iconStr} alt={currentModel.name} className="w-4 h-4 object-contain" />;
              }
              return (
                <span className={`text-sm font-bold ${currentModel.icon === 'G' ? 'text-[#4285F4]' : 'text-[#0078D4]'}`}>
                  {currentModel.icon as string}
                </span>
              );
            }
            const Icon = currentModel.icon as LucideIcon;
            return <Icon className={`w-4 h-4 ${currentModel.iconColor}`} />;
          })()}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{currentModel.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-1">
              {aiModels.map((model) => {
                const isSelected = currentModelId === model.id;
                const isStringIcon = typeof model.icon === 'string';
                // Check if this model is disabled (selected in the other dropdown when in compare mode)
                const isDisabled = isCompareEnabled && otherModelId === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (!isDisabled) {
                        setModelId(model.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30'
                      : isSelected
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      {isStringIcon ? (
                        (model.icon as string).startsWith('/') ? (
                          <img src={model.icon as string} alt={model.name} className={`w-4 h-4 object-contain ${isDisabled ? 'opacity-50' : ''}`} />
                        ) : (
                          <span className={`text-sm font-bold ${model.icon === 'G' ? 'text-[#4285F4]' : 'text-[#0078D4]'} ${isDisabled ? 'opacity-50' : ''}`}>
                            {model.icon as string}
                          </span>
                        )
                      ) : (
                        (() => {
                          const Icon = model.icon as LucideIcon;
                          return <Icon className={`w-4 h-4 ${model.iconColor} ${isDisabled ? 'opacity-50' : ''}`} />;
                        })()
                      )}
                    </div>
                    <span className={`text-sm ${isDisabled ? 'text-gray-400 dark:text-gray-500' : isSelected ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {model.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSlug="text-translator"
        userProfileButtonRef={userProfileButtonRef}
        handleUserProfileClick={handleUserProfileClick}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f9fafb] dark:bg-gray-900">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between shadow-sm z-20 relative">
          <div className="flex items-center gap-4" style={{ marginLeft: '50px' }}>
            {/* Source Language */}
            <div className="relative" ref={sourceLangRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsSourceLangOpen(!isSourceLangOpen);
                  setIsTargetLangOpen(false);
                  setSourceSearch('');
                }}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-w-[140px]"
              >
                <span>{sourceLanguage}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.button>
              {isSourceLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search language..."
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1">
                    {languages
                      .filter(lang =>
                        lang.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
                        lang.nativeName.toLowerCase().includes(sourceSearch.toLowerCase())
                      )
                      .map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSourceLanguage(lang.name);
                            setIsSourceLangOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between group ${sourceLanguage === lang.name
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          <span className="font-medium">{lang.nativeName}</span>
                          <span className={`text-xs ${sourceLanguage === lang.name
                            ? 'text-purple-500 dark:text-purple-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                            }`}>
                            {lang.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-gray-400" />

            {/* Target Language */}
            <div className="relative" ref={targetLangRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsTargetLangOpen(!isTargetLangOpen);
                  setIsSourceLangOpen(false);
                  setTargetSearch('');
                }}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-w-[140px]"
              >
                <span>{targetLanguage}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.button>
              {isTargetLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search language..."
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1">
                    {languages
                      .filter(lang =>
                        lang.code !== 'auto' &&
                        (lang.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
                          lang.nativeName.toLowerCase().includes(targetSearch.toLowerCase()))
                      )
                      .map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setTargetLanguage(lang.name);
                            setIsTargetLangOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between group ${targetLanguage === lang.name
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          <span className="font-medium">{lang.nativeName}</span>
                          <span className={`text-xs ${targetLanguage === lang.name
                            ? 'text-purple-500 dark:text-purple-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                            }`}>
                            {lang.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Side: Compare Toggle */}
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">Compare</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCompareEnabled(!isCompareEnabled)}
              className={`w-11 h-6 rounded-full relative transition-colors ${isCompareEnabled ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
              <motion.div
                animate={{ x: isCompareEnabled ? 20 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
              />
            </motion.button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="flex gap-6 h-full max-w-[1800px] mx-auto">
            {/* Left Card - Input */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border border-gray-100 dark:border-gray-700">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Please enter the text to be translated"
                className="w-full h-full p-8 resize-none outline-none bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-light"
                maxLength={20000}
              />
              <div className="absolute bottom-4 right-6 text-xs text-gray-400 font-medium">
                {inputText.length}/20000
              </div>
            </div>

            {/* Right Side - Output Card(s) */}
            {isCompareEnabled ? (
              <>
                {/* Output Card 1 */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-center">
                    {renderModelDropdown(selectedModel, setSelectedModel, isModelDropdownOpen, setIsModelDropdownOpen, modelDropdownRef, secondModel)}
                  </div>
                  {translatedText || isLoading ? (
                    <div className="flex-1 flex flex-col">
                      {/* Action Buttons */}
                      {translatedText && !isLoading && (
                        <div className="flex justify-end gap-2 p-4 border-gray-100 dark:border-gray-700">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(translatedText, 1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Copy"
                          >
                            {isCopied1 ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClose(1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Close"
                          >
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </motion.button>
                        </div>
                      )}
                      <div className="flex-1 p-8 overflow-y-auto">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                          </div>
                        ) : (
                          <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap font-light leading-relaxed">
                            {translatedText}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        {(() => {
                          const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0];
                          if (typeof currentModel.icon === 'string') {
                            if (currentModel.icon.startsWith('/')) {
                              return <img src={currentModel.icon} alt={currentModel.name} className="w-8 h-8 object-contain" />;
                            }
                            return (
                              <div className={`text-4xl font-bold ${currentModel.icon === 'G' ? 'text-[#4285F4]' : 'text-[#0078D4]'}`}>
                                {currentModel.icon}
                              </div>
                            );
                          }
                          const Icon = currentModel.icon;
                          return <Icon className={`w-8 h-8 ${currentModel.iconColor}`} />;
                        })()}
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1 text-center">
                        Translate using<br />{aiModels.find(m => m.id === selectedModel)?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                        {aiModels.find(m => m.id === selectedModel)?.cost}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTranslate}
                        disabled={!inputText.trim() || isLoading}
                        className="mt-6 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm rounded-full font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                      >
                        {isLoading ? 'Translating...' : 'Click to translate'}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Output Card 2 */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-center">
                    {renderModelDropdown(secondModel, setSecondModel, isSecondModelDropdownOpen, setIsSecondModelDropdownOpen, secondModelDropdownRef, selectedModel)}
                  </div>
                  {translatedText2 || isLoading ? (
                    <div className="flex-1 flex flex-col">
                      {/* Action Buttons */}
                      {translatedText2 && !isLoading && (
                        <div className="flex justify-end gap-2 p-4 border-gray-100 dark:border-gray-700">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(translatedText2, 2)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Copy"
                          >
                            {isCopied2 ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClose(2)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Close"
                          >
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </motion.button>
                        </div>
                      )}
                      <div className="flex-1 p-8 overflow-y-auto">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                          </div>
                        ) : (
                          <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap font-light leading-relaxed">
                            {translatedText2}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        {(() => {
                          const currentModel = aiModels.find(m => m.id === secondModel) || aiModels[0];
                          if (typeof currentModel.icon === 'string') {
                            if (currentModel.icon.startsWith('/')) {
                              return <img src={currentModel.icon} alt={currentModel.name} className="w-8 h-8 object-contain" />;
                            }
                            return (
                              <div className={`text-4xl font-bold ${currentModel.icon === 'G' ? 'text-[#4285F4]' : 'text-[#0078D4]'}`}>
                                {currentModel.icon}
                              </div>
                            );
                          }
                          const Icon = currentModel.icon;
                          return <Icon className={`w-8 h-8 ${currentModel.iconColor}`} />;
                        })()}
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1 text-center">
                        Translate using<br />{aiModels.find(m => m.id === secondModel)?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                        {aiModels.find(m => m.id === secondModel)?.cost}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTranslate}
                        disabled={!inputText.trim() || isLoading}
                        className="mt-6 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm rounded-full font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                      >
                        {isLoading ? 'Translating...' : 'Click to translate'}
                      </motion.button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Single Output Card */
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-start">
                  {renderModelDropdown(selectedModel, setSelectedModel, isModelDropdownOpen, setIsModelDropdownOpen, modelDropdownRef, undefined)}
                </div>
                {translatedText || isLoading ? (
                  <div className="flex-1 flex flex-col">
                    {/* Action Buttons */}
                    {translatedText && !isLoading && (
                      <div className="flex justify-end gap-2 p-4 border-gray-100 dark:border-gray-700">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(translatedText, 1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy"
                        >
                          {isCopied1 ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClose(1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Close"
                        >
                          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </motion.button>
                      </div>
                    )}
                    <div className="flex-1 p-8 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : (
                        <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap font-light leading-relaxed">
                          {translatedText}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                      {(() => {
                        const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0];
                        if (typeof currentModel.icon === 'string') {
                          if (currentModel.icon.startsWith('/')) {
                            return <img src={currentModel.icon} alt={currentModel.name} className="w-10 h-10 object-contain" />;
                          }
                          return (
                            <div className={`text-5xl font-bold ${currentModel.icon === 'G' ? 'text-[#4285F4]' : 'text-[#0078D4]'}`}>
                              {currentModel.icon}
                            </div>
                          );
                        }
                        const Icon = currentModel.icon;
                        return <Icon className={`w-10 h-10 ${currentModel.iconColor}`} />;
                      })()}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Translate using {aiModels.find(m => m.id === selectedModel)?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {aiModels.find(m => m.id === selectedModel)?.cost}
                    </p>
                  </div>
                )}

                {/* Floating Action Button */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center px-8 pointer-events-none">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTranslate}
                    disabled={!inputText.trim() || isLoading}
                    className="pointer-events-auto px-8 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
                  >
                    <span>{isLoading ? 'Translating...' : 'Click to translate'}</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Profile Dropdown */}
      <UserProfileDropdown
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        position={userProfilePosition}
      />
    </div>
  );
}
