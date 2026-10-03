import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Paperclip, 
  Plus,
  Sliders,
  Globe, 
  Wand2, 
  Mic, 
  Bot, 
  Sparkles, 
  X,
  FileText,
  Image as ImageIcon,
  Clock,
  Video as VideoIcon,
  Book,
  Music,
  ChevronDown,
  Layers,
  Palette,
  FileUp,
  FileCode,
  Film,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeId, THEMES, getThemeColors } from '../../core/themeConfig';
import { Tooltip } from '../ui/Tooltip';
import { UnifiedModelSelector } from '../UnifiedModelSelector';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  uploadedFiles: { name: string; size: string; type: string; base64: string }[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<{ name: string; size: string; type: string; base64: string }[]>>;
  isLoading: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  isVibeCodingMode: boolean;
  setIsVibeCodingMode: (val: boolean) => void;
  problemSolvingMode: boolean;
  setProblemSolvingMode: (val: boolean) => void;
  deepResearchMode: boolean;
  setDeepResearchMode: (val: boolean) => void;
  enableWebSearch: boolean;
  onToggleWebSearch?: () => void;
  onPromptEnhance: () => void;
  onVoiceInput: () => void;
  voiceModeEnabled?: boolean;
  onToggleVoiceMode?: () => void;
  onOpenPromptsModal?: () => void;
  activeTheme?: ThemeId;
  isListening?: boolean;
  generationMode: 'text' | 'image' | 'video' | 'audio';
  setGenerationMode: (mode: 'text' | 'image' | 'video' | 'audio') => void;
  autoRefine: boolean;
  setAutoRefine: (val: boolean) => void;
  imageSize: '1K' | '2K' | '4K';
  setImageSize: (val: '1K' | '2K' | '4K') => void;
  currentModelId?: string;
  onSelectModel?: (model: any) => void;
  userTierId?: string;
  onOpenUpgradeModal?: () => void;
  showThemePicker: boolean;
  setShowThemePicker: (show: boolean) => void;
  hasSubmitted?: boolean;
  onOpenConnectors?: () => void;
  onOpenWorkspace?: () => void;
}

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  inputText,
  setInputText,
  uploadedFiles,
  setUploadedFiles,
  isLoading,
  onSubmit,
  isVibeCodingMode,
  setIsVibeCodingMode,
  problemSolvingMode,
  setProblemSolvingMode,
  deepResearchMode,
  setDeepResearchMode,
  enableWebSearch,
  onToggleWebSearch,
  onPromptEnhance,
  onVoiceInput,
  voiceModeEnabled = false,
  onToggleVoiceMode,
  onOpenPromptsModal,
  activeTheme = 'silk',
  isListening = false,
  generationMode,
  setGenerationMode,
  autoRefine,
  setAutoRefine,
  imageSize,
  setImageSize,
  currentModelId,
  onSelectModel,
  userTierId,
  onOpenUpgradeModal,
  showThemePicker,
  setShowThemePicker,
  hasSubmitted = false,
  onOpenConnectors,
  onOpenWorkspace,
}, ref) => {
  const [hasSubmittedLocally, setHasSubmittedLocally] = useState(false);
  const isPromptSubmitted = hasSubmitted || hasSubmittedLocally;
  const innerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAttachDropdownOpen, setIsAttachDropdownOpen] = useState(false);
  const attachDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(event.target as Node)) {
        setIsAttachDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  useEffect(() => {
    const handleToggleModelSelector = () => {
      setIsDropdownOpen(prev => !prev);
    };
    window.addEventListener('toggle-model-selector', handleToggleModelSelector);
    return () => window.removeEventListener('toggle-model-selector', handleToggleModelSelector);
  }, []);

  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge the forwarded ref with our internal ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(innerTextareaRef.current);
    } else {
      (ref as any).current = innerTextareaRef.current;
    }
  }, [ref]);

  const adjustTextareaHeight = () => {
    if (innerTextareaRef.current) {
      innerTextareaRef.current.style.height = 'auto';
      innerTextareaRef.current.style.height = `${Math.min(innerTextareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (inputText.trim() || uploadedFiles.length > 0) {
      setHasSubmittedLocally(true);
    }
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: file.type,
              base64: event.target?.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerationClick = (type: 'image' | 'video' | 'audio') => {
    if (setGenerationMode) {
      if (generationMode === type) {
        setGenerationMode('text');
      } else {
        setGenerationMode(type);
      }
    }
    if (innerTextareaRef.current) {
      innerTextareaRef.current.focus();
    }
  };

  return (
    <div className="px-2 py-1 md:px-4 md:py-1 max-w-xl mx-auto w-full">
      <div className="relative group">
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-1.5 mb-1 px-2"
            >
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 group/file animate-in fade-in zoom-in duration-300">
                  {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3 text-indigo-400" />}
                  <span className="text-[10px] text-white/70 max-w-[100px] truncate">{file.name}</span>
                  <Tooltip content="Remove file">
                    <button onClick={() => removeUploadedFile(idx)} className="text-white/40 hover:text-rose-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 mb-1 pb-1 overflow-visible relative z-30 flex-wrap sm:flex-nowrap">
          <Tooltip content="Select intelligence model and provider">
            <UnifiedModelSelector
              currentModelId={currentModelId || ''}
              onSelectModel={onSelectModel || (() => {})}
              userTierId={userTierId}
              compact
              position="up"
              className="!h-[32px]"
              activeTheme={activeTheme}
            />
          </Tooltip>

          <div className="w-[1px] h-3 bg-white/10 mx-0.5 shrink-0" />

          <div className="relative" ref={dropdownRef}>
            <Tooltip content="Switch between different intelligence modes">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`h-[32px] px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap font-mono shadow-lg ${isDropdownOpen ? `${theme.accentBadgeBg} ring-1 ring-white/20` : `${theme.bgCard}/70 ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain} hover:brightness-110`}`}
              >
                <Layers className="w-2.5 h-2.5" />
                <span>Modes</span>
                <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </Tooltip>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute bottom-full mb-2 left-0 z-50 ${theme.bgCard} ${theme.accentBorder} border backdrop-blur-xl rounded-xl p-1 min-w-[150px] shadow-2xl flex flex-col gap-0.5`}
                >
                  <Tooltip content="Toggle real-time web search" position="right">
                    <button 
                      onClick={() => { onToggleWebSearch?.(); setIsDropdownOpen(false); }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${enableWebSearch ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : `${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}`}
                    >
                      <Globe className="w-3 h-3" />
                      <span className="flex-1 text-left">Search</span>
                      {enableWebSearch && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Enable specialized coding assistance" position="right">
                    <button 
                      onClick={() => { setIsVibeCodingMode(!isVibeCodingMode); setIsDropdownOpen(false); }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${isVibeCodingMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : `${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}`}
                    >
                      <Bot className="w-3 h-3" />
                      <span className="flex-1 text-left">Code</span>
                      {isVibeCodingMode && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Enable deep thinking for complex problems" position="right">
                    <button 
                      onClick={() => { setProblemSolvingMode(!problemSolvingMode); setIsDropdownOpen(false); }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${problemSolvingMode ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : `${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="flex-1 text-left">Deep Thinking</span>
                      {problemSolvingMode && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Enable comprehensive multi-step research" position="right">
                    <button 
                      onClick={() => { setDeepResearchMode(!deepResearchMode); setIsDropdownOpen(false); }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${deepResearchMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : `${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span className="flex-1 text-left">Deep Research</span>
                      {deepResearchMode && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Perform background chain-of-thought verification for complex academic queries" position="right">
                    <button 
                      onClick={() => { setAutoRefine(!autoRefine); setIsDropdownOpen(false); }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${autoRefine ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : `${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="flex-1 text-left">Auto-Refine</span>
                      {autoRefine && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Analyze YouTube lectures, extract chapters and key insights" position="right">
                    <button 
                      onClick={() => { 
                        setInputText("Analyze YouTube Video: https://www.youtube.com/watch?v=");
                        setIsDropdownOpen(false);
                        if (ref && 'current' in ref && ref.current) {
                          ref.current.focus();
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain}`}
                    >
                      <Youtube className="w-3 h-3 text-rose-500" />
                      <span className="flex-1 text-left text-rose-400">YouTube Analyser</span>
                    </button>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="w-[1px] h-3 bg-white/10 mx-0.5 shrink-0" />

          <Tooltip content="Switch to image generation mode">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleGenerationClick('image')}
                className={`h-[30px] px-3 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap font-mono ${
                  generationMode === 'image' 
                    ? `${theme.accentBadgeBg} font-bold shadow-sm` 
                    : `${theme.bgCard} ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain}`
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Image</span>
              </button>
              
              {generationMode === 'image' && (
                <div className={`flex ${theme.bgCard} border ${theme.accentBorder} rounded-full p-0.5 ml-1`}>
                  {(['1K', '2K', '4K'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size)}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-mono transition-all ${
                        imageSize === size 
                          ? `${theme.accentBadgeBg} font-bold` 
                          : `${theme.textSecondary} hover:${theme.textMain}`
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tooltip>
          <Tooltip content="Switch to video generation mode">
            <button 
              onClick={() => handleGenerationClick('video')}
              className={`h-[30px] px-3 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap font-mono ${
                generationMode === 'video' 
                  ? `${theme.accentBadgeBg} font-bold shadow-sm` 
                  : `${theme.bgCard} ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain}`
              }`}
            >
              <VideoIcon className="w-3 h-3" />
              <span>Video</span>
            </button>
          </Tooltip>
          <Tooltip content="Switch to audio/music generation mode">
            <button 
              onClick={() => handleGenerationClick('audio')}
              className={`h-[30px] px-3 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap font-mono ${
                generationMode === 'audio' 
                  ? `${theme.accentBadgeBg} font-bold shadow-sm` 
                  : `${theme.bgCard} ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain}`
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Audio</span>
            </button>
          </Tooltip>

          <div className="w-[1px] h-3 bg-white/10 mx-0.5 shrink-0" />

          <Tooltip content="Change visual theme and interface skins">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`h-[30px] px-3 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap font-mono ${
                showThemePicker 
                  ? `${theme.accentBadgeBg} font-bold shadow-sm` 
                  : `${theme.bgCard} ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain}`
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Theme</span>
            </button>
          </Tooltip>
        </div>

        <div className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-2xl ${
          isPromptSubmitted 
            ? `${theme.bgCard}/95 ${theme.accentBorder} ${theme.accentGlow} ring-1 ring-white/20` 
            : `${theme.bgCard}/80 ${theme.accentBorder} group-focus-within:border-white/30`
        }`}>
          <textarea
            ref={innerTextareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Message Nothing-Ai..."}
            className={`w-full bg-transparent px-3 py-2 pr-10 min-h-[36px] max-h-[120px] ${theme.textMain} placeholder:${theme.textSecondary} placeholder:opacity-50 focus:outline-none resize-none text-sm leading-tight scrollbar-none`}
            autoFocus
          />

          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
              />
              <div className="relative" ref={attachDropdownRef}>
                <Tooltip content="Add attachments & connectors">
                  <button 
                    onClick={() => setIsAttachDropdownOpen(!isAttachDropdownOpen)}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                      isAttachDropdownOpen 
                        ? `${theme.accentBadgeBg} ring-1 ring-white/20 shadow-md` 
                        : `${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain} bg-white/5 hover:bg-white/10`
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <AnimatePresence>
                  {isAttachDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute bottom-full mb-2 left-0 z-50 ${theme.bgCard} border ${theme.accentBorder} backdrop-blur-xl rounded-xl p-1 min-w-[170px] shadow-2xl flex flex-col gap-0.5`}
                    >
                      <button 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.rtf";
                            fileInputRef.current.click();
                          }
                          setIsAttachDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <FileUp className="w-3.5 h-3.5 opacity-80" />
                        <span>Documents</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = "image/*";
                            fileInputRef.current.click();
                          }
                          setIsAttachDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 opacity-80" />
                        <span>Images</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = "video/*";
                            fileInputRef.current.click();
                          }
                          setIsAttachDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <Film className="w-3.5 h-3.5 opacity-80" />
                        <span>Videos</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = "*/*";
                            fileInputRef.current.click();
                          }
                          setIsAttachDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 opacity-80" />
                        <span>Other Files</span>
                      </button>

                      {/* Google Drive & Workspace Hub */}
                      <div className={`w-full h-[1px] border-t ${theme.accentBorder} my-0.5`} />
                      <button 
                        onClick={() => {
                          setIsAttachDropdownOpen(false);
                          if (onOpenWorkspace) onOpenWorkspace();
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <FileText className="w-3.5 h-3.5 opacity-80" />
                        <span>Google Drive & Hub</span>
                      </button>

                      {/* Connectors & Automations Option inside Plus Dropdown */}
                      <button 
                        onClick={() => {
                          setIsAttachDropdownOpen(false);
                          if (onOpenConnectors) onOpenConnectors();
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 transition-all font-mono ${theme.textSecondary} hover:bg-white/10 hover:${theme.textMain} text-left`}
                      >
                        <Sliders className="w-3.5 h-3.5 opacity-80" />
                        <span>Connectors & Auto</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="w-[1px] h-3 bg-white/10 mx-0.5 shrink-0" />
              
              <Tooltip content="Optimize your prompt for better results">
                <button 
                  onClick={onPromptEnhance}
                  className={`p-1.5 rounded-lg border transition-all active:scale-95 ${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain} bg-white/5 hover:bg-white/10`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </Tooltip>
              <Tooltip content="Use voice input (Speech-to-Text)">
                <button 
                  onClick={onVoiceInput}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center active:scale-95 border ${
                    isListening 
                      ? `${theme.accentPrimary} text-white animate-pulse shadow-lg ring-2 ring-white/30 scale-105` 
                      : `${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain} bg-white/5 hover:bg-white/10`
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </Tooltip>
              <Tooltip content={voiceModeEnabled ? "Mute Voice playback (TTS)" : "Enable Voice playback (TTS)"}>
                <button 
                  onClick={onToggleVoiceMode}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center active:scale-95 border ${
                    voiceModeEnabled 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : `${theme.accentBorder} ${theme.textSecondary} hover:${theme.textMain} bg-white/5 hover:bg-white/10`
                  }`}
                >
                  {voiceModeEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Send Message">
              <button
                onClick={() => handleFormSubmit()}
                disabled={isLoading || (!inputText.trim() && uploadedFiles.length === 0)}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  inputText.trim() || uploadedFiles.length > 0 
                    ? `${theme.accentPrimary} text-slate-950 font-extrabold hover:scale-105 active:scale-95 shadow-lg ring-1 ring-white/30` 
                    : `bg-white/5 ${theme.textSecondary}/30 cursor-not-allowed border ${theme.accentBorder}`
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-center gap-4 relative">
        <p className="text-[10px] text-neutral-500 font-medium tracking-wide">
          Nothing-Ai can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
});
