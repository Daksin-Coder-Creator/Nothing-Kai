import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  ChevronDown, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Search, 
  X, 
  Zap,
  Bot,
  Brain,
  Cpu,
  Globe,
  Music,
  Image as ImageIcon,
  Video,
  Code,
  Atom,
  Cloud,
  Users,
  Wind,
  Infinity
} from 'lucide-react';
import { 
  ALL_NOTHING_AI_MODELS, 
  PROVIDERS_LIST,
  NothingAiModel, 
  ModelProvider,
  getModelById, 
  isModelLockedForTier,
  formatContextTokens,
  getModelsByProvider,
  AUTO_MODEL
} from '../core/modelsConfig';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface UnifiedModelSelectorProps {
  currentModelId: string;
  onSelectModel: (model: NothingAiModel) => void;
  userTierId?: string;
  className?: string;
  compact?: boolean;
  position?: 'up' | 'down';
  onOpenUpgradeModal?: () => void;
  activeTheme?: ThemeId;
}

export const UnifiedModelSelector: React.FC<UnifiedModelSelectorProps> = ({
  currentModelId,
  onSelectModel,
  userTierId = 'basic',
  className = '',
  compact = false,
  position = 'up',
  onOpenUpgradeModal,
  activeTheme = 'silk',
}) => {
  const [user] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>('gemini');
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const currentModel = getModelById(currentModelId, userTierId);

  useEffect(() => {
    if (isOpen && currentModel) {
      setSelectedProvider(currentModel.provider);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, currentModel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAttemptSelect = (model: NothingAiModel) => {
    if (!user && model.id !== 'auto' && model.tierId !== 'free' && model.tierId !== 'basic') {
      setLockWarning(`Please Sign In to access standard & premium models.`);
      return;
    }

    const isLocked = isModelLockedForTier(model.tierId, userTierId);
    if (isLocked) {
      setLockWarning(`${model.displayName} requires ${model.tierId.toUpperCase()} tier.`);
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
        setIsOpen(false);
      }
      return;
    }

    onSelectModel(model);
    setIsOpen(false);
    setLockWarning(null);
  };

  const filteredProviderModels = getModelsByProvider(selectedProvider).filter((m) =>
    (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.providerName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const globalSearchModels = searchQuery.length > 1 && filteredProviderModels.length === 0
    ? ALL_NOTHING_AI_MODELS.filter((m) =>
        (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.providerName || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const providerModels = filteredProviderModels.length > 0 ? filteredProviderModels : globalSearchModels;

  const popupPositionClasses = position === 'up'
    ? 'bottom-full mb-2 left-0'
    : 'top-full mt-2 left-0';

  return (
    <div className={`relative inline-block ${isOpen ? 'z-50' : 'z-20'}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select intelligence model and provider"
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full ${theme.bgCard} hover:opacity-90 ${theme.accentBorder} border transition-all text-[10px] ${theme.textSecondary} hover:${theme.textMain} w-full active:scale-[0.98] group relative backdrop-blur-xl shadow-lg h-[32px] ${
          compact ? 'min-w-[130px]' : 'min-w-[160px]'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 relative z-10">
          <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-white/20 transition-colors">
            {selectedProvider === 'gpt' && <Bot className="w-3 h-3 text-emerald-400" />}
            {selectedProvider === 'claude' && <Brain className="w-3 h-3 text-orange-400" />}
            {selectedProvider === 'gemini' && <Sparkles className="w-3 h-3 text-blue-400" />}
            {selectedProvider === 'grok' && <Zap className="w-3 h-3 text-white" />}
            {selectedProvider === 'deepseek' && <Cpu className="w-3 h-3 text-indigo-400" />}
            {selectedProvider === 'meta' && <Users className="w-3 h-3 text-blue-500" />}
            {selectedProvider === 'mistral' && <Wind className="w-3 h-3 text-orange-300" />}
            {selectedProvider === 'qwen' && <Infinity className="w-3 h-3 text-purple-400" />}
            {['perplexity', 'copilot', 'other'].includes(selectedProvider) && <Globe className="w-3 h-3 text-gray-300" />}
            {selectedProvider === 'image' && <ImageIcon className="w-3 h-3 text-pink-400" />}
            {selectedProvider === 'video' && <Video className="w-3 h-3 text-purple-400" />}
            {selectedProvider === 'coding' && <Code className="w-3 h-3 text-blue-500" />}
            {selectedProvider === 'science' && <Atom className="w-3 h-3 text-green-400" />}
            {selectedProvider === 'voice' && <Music className="w-3 h-3 text-rose-400" />}
          </div>
          <span className={`font-bold ${theme.textMain} truncate tracking-tight`}>
            {currentModel.displayName}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 opacity-60 group-hover:opacity-100 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Lock Notice Banner */}
      {lockWarning && (
        <div className={`absolute ${position === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 z-50 p-2 rounded-lg ${theme.bgCard} ${theme.accentBorder} border ${theme.textMain} text-[10px] flex items-center justify-between gap-2 backdrop-blur-xl shadow-2xl`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className={`truncate ${theme.textSecondary}`}>{lockWarning}</span>
          </div>
          {onOpenUpgradeModal && (
            <button
              type="button"
              onClick={() => {
                onOpenUpgradeModal?.();
                setLockWarning(null);
              }}
              className="px-2 py-0.5 rounded bg-white text-black hover:bg-gray-200 text-[9px] font-bold uppercase shrink-0"
            >
              Upgrade
            </button>
          )}
        </div>
      )}

      {/* Dropdown / Dropup Panel */}
      {isOpen && (
        <div className={`absolute ${popupPositionClasses} z-50 w-[calc(100vw-24px)] max-w-[340px] sm:w-80 max-h-[70vh] sm:max-h-[400px] flex flex-col ${theme.bgCard} ${theme.accentBorder} border rounded-xl shadow-2xl overflow-hidden backdrop-blur-3xl ring-1 ring-white/5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200`}>
          {/* Header */}
          <div className="p-2.5 bg-white/[0.02] border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className={`text-[9px] font-bold ${theme.textSecondary} uppercase font-mono tracking-[0.15em] flex items-center gap-1.5`}>
                Neural Router
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 opacity-50 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find model..."
                className={`w-full ${theme.bgInput} text-[11px] ${theme.textMain} placeholder-gray-500 rounded-lg pl-8 pr-3 py-1.5 border ${theme.accentBorder} focus:outline-none focus:border-white/30 transition-all font-mono`}
              />
            </div>

            {/* AUTO MODEL */}
            <button
              type="button"
              onClick={() => handleAttemptSelect(AUTO_MODEL)}
              className={`w-full p-2 rounded-lg text-left transition border ${
                currentModel.id === 'auto'
                  ? 'bg-amber-500/10 text-amber-100 border-amber-500/40 shadow-inner'
                  : `bg-white/5 ${theme.textSecondary} border-white/5 hover:bg-white/10 hover:text-white`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-3 h-3 ${currentModel.id === 'auto' ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span className="text-[11px] font-bold font-mono tracking-tight">Self-Select</span>
                </div>
                {currentModel.id === 'auto' && <Check className="w-3 h-3 text-amber-400" />}
              </div>
            </button>
          </div>

          {/* Providers */}
          <div className="p-2 bg-black/20 border-b border-white/5 overflow-x-auto no-scrollbar">
            <div className="flex gap-1">
              {PROVIDERS_LIST.map((p) => {
                const isProvActive = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id)}
                    style={isProvActive ? { backgroundColor: primary, borderColor: primary, color: '#000000' } : undefined}
                    className={`py-1 px-2.5 rounded-lg font-bold text-[9px] transition-all border whitespace-nowrap font-mono ${
                      isProvActive
                        ? 'shadow-md'
                        : `bg-white/5 ${theme.textSecondary} border-white/5 hover:text-white hover:bg-white/10`
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className={`flex-1 overflow-y-auto p-1.5 space-y-1 ${theme.bgCard}`}>
            {providerModels.length === 0 ? (
              <div className={`p-6 text-center ${theme.textSecondary} font-mono text-[10px]`}>No matches found</div>
            ) : (
              providerModels.map((m) => {
                const isSelected = m.id === currentModel.id;
                const isLocked = !user 
                  ? (m.tierId !== 'free' && m.tierId !== 'basic')
                  : isModelLockedForTier(m.tierId, userTierId);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAttemptSelect(m)}
                    style={isSelected ? { backgroundColor: `${primary}25`, borderColor: primary, color: accent } : undefined}
                    className={`w-full p-2 rounded-lg text-left transition group border ${
                      isLocked
                        ? 'opacity-40 bg-white/5 border-white/5 cursor-not-allowed'
                        : isSelected
                        ? 'shadow-xl'
                        : `bg-white/[0.02] ${theme.textSecondary} border-white/5 hover:bg-white/[0.06] hover:text-white`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isLocked && <Lock className="w-3 h-3 text-gray-500 shrink-0" />}
                        <span className={`text-[10px] font-bold font-mono truncate ${isSelected ? 'text-white' : ''}`}>{m.displayName}</span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />}
                      </div>
                      <span className={`text-[8px] font-mono px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                        {formatContextTokens(m.max_context_tokens)}
                      </span>
                    </div>
                    <p className={`text-[9px] font-mono line-clamp-1 ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>
                      {m.purpose}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

