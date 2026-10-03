import React, { useState, useRef, useEffect } from 'react';
import { Menu, Zap, Cpu, Info, ChevronDown, ArrowUpRight, Sparkles, Clock, Lock, Sliders } from 'lucide-react';
import { getModelById, formatContextTokens, NothingAiModel } from '../core/modelsConfig';
import { AuthButton } from './AuthButton';
import { Tooltip } from './ui/Tooltip';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserSession } from '../core/authEngine';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  currentPlan?: string;
  currentTierId?: string;
  currentModelId: string;
  onSelectModel: (model: NothingAiModel) => void;
  usedCredits: number;
  monthlyCredits: number;
  onOpenUpgradeModal?: () => void;
  activeTheme?: ThemeId;
  onFocusModeToggle?: (isFocusActive: boolean) => void;
  onOpenConnectors?: () => void;
  session?: UserSession | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onToggleSidebar,
  currentPlan = 'Standard',
  currentTierId = 'standard',
  currentModelId,
  onSelectModel,
  usedCredits = 0,
  monthlyCredits = 12000,
  onOpenUpgradeModal,
  activeTheme = 'silk',
  onFocusModeToggle,
  onOpenConnectors,
  session,
}) => {
  const [user] = useAuthState(auth);
  const [showLimitsPopover, setShowLimitsPopover] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [silenceNotifications, setSilenceNotifications] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const pomodoroRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const currentModel = getModelById(currentModelId, currentTierId);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);
  const percentageLeft = Math.min(100, Math.max(0, Math.round((remainingCredits / monthlyCredits) * 100)));

  // Trigger focus mode parent update when pomodoro run state changes
  useEffect(() => {
    if (onFocusModeToggle) {
      onFocusModeToggle(isPomodoroRunning && pomodoroMode === 'work');
    }
  }, [isPomodoroRunning, pomodoroMode, onFocusModeToggle]);

  useEffect(() => {
    let interval: any = null;
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0 && isPomodoroRunning) {
      setIsPomodoroRunning(false);
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroSeconds(5 * 60);
      } else {
        setPomodoroMode('work');
        setPomodoroSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroSeconds, pomodoroMode]);

  const formatPomodoroTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowLimitsPopover(false);
      }
      if (pomodoroRef.current && !pomodoroRef.current.contains(e.target as Node)) {
        setShowPomodoro(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`flex justify-between items-center h-12 mx-3 sm:mx-6 mt-3 mb-1 px-4 sm:px-5 ${theme.bgCard}/90 ${theme.accentBorder} border rounded-full ${theme.textMain} gap-3 z-30 relative shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out`}>
      {/* Left: Mobile Toggle & Header Logo */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className={`p-1.5 rounded-full ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/10 border border-transparent hover:${theme.accentBorder} lg:hidden transition-all duration-200 ease-in-out`}
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`hidden lg:flex p-1.5 rounded-full ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/10 border border-transparent hover:${theme.accentBorder} transition-all duration-200 ease-in-out`}
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center empty space */}
      <div className="sm:hidden flex-1 min-w-0 max-w-[140px]">
      </div>

      {/* Right: Limits & Quota Badge + Pomodoro Timer + Auth + Upgrade */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Pomodoro Focus Timer */}
        <div className="relative" ref={pomodoroRef}>
          <button
            onClick={() => setShowPomodoro(!showPomodoro)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.bgCard} hover:bg-white/10 ${theme.accentBorder} border transition-all duration-200 ease-in-out text-xs ${theme.textMain} font-mono`}
            title="Pomodoro Study Focus Timer"
          >
            <Clock className={`w-3.5 h-3.5 ${isPomodoroRunning ? 'text-amber-400 animate-spin' : theme.textSecondary}`} />
            <span className="font-bold">{formatPomodoroTime(pomodoroSeconds)}</span>
            {silenceNotifications && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Notifications Muted" />}
          </button>

          {showPomodoro && (
            <div className={`absolute right-0 top-full mt-2 w-72 ${theme.bgCard} ${theme.accentBorder} border rounded-2xl shadow-2xl p-4 z-50 text-xs ${theme.textMain} space-y-3 backdrop-blur-xl animate-fadeIn`}>
              {!user ? (
                <div className="text-center py-4 space-y-3">
                  <Lock className="w-6 h-6 mx-auto text-amber-500/80 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Focus Mode Gated</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Study Focus intervals are academic features. Please Sign In to activate Focus Mode.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pomodoro Focus ({pomodoroMode === 'work' ? 'Study' : 'Break'})</span>
                    </div>
                    <button onClick={() => setShowPomodoro(false)} className="text-zinc-400 hover:text-white font-bold text-sm">×</button>
                  </div>

                  <div className="text-center py-3 space-y-2">
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        disabled={isPomodoroRunning}
                        onClick={() => setPomodoroSeconds(prev => Math.max(60, prev - 60))}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none font-bold text-sm"
                        title="Subtract 1 minute"
                      >
                        -
                      </button>
                      <div className="text-3xl font-black font-mono tracking-wider">{formatPomodoroTime(pomodoroSeconds)}</div>
                      <button 
                        disabled={isPomodoroRunning}
                        onClick={() => setPomodoroSeconds(prev => prev + 60)}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none font-bold text-sm"
                        title="Add 1 minute"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-400">{pomodoroMode === 'work' ? 'Focus on your academic project' : 'Take a short relaxing break'}</div>
                  </div>

                  {/* Quick Preset Selections */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Focus Presets</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[10, 15, 25, 45].map((mins) => (
                        <button
                          key={mins}
                          disabled={isPomodoroRunning}
                          onClick={() => {
                            setPomodoroMode('work');
                            setPomodoroSeconds(mins * 60);
                          }}
                          className={`py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-300 transition disabled:opacity-30 ${
                            pomodoroSeconds === mins * 60 ? 'border-amber-400 bg-amber-500/10 text-amber-300' : ''
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition duration-200 ${isPomodoroRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white text-black hover:bg-neutral-200'}`}
                    >
                      {isPomodoroRunning ? 'Pause Timer' : 'Start Focus'}
                    </button>
                    <button
                      onClick={() => {
                        setIsPomodoroRunning(false);
                        setPomodoroSeconds(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition duration-200"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Silence AI Notifications</span>
                    <input
                      type="checkbox"
                      checked={silenceNotifications}
                      onChange={(e) => setSilenceNotifications(e.target.checked)}
                      className="rounded bg-black border-white/20 text-indigo-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Limits & Quota Tracker Button */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowLimitsPopover(!showLimitsPopover)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme.bgCard} hover:bg-white/10 ${theme.accentBorder} border transition-all duration-200 ease-in-out text-xs ${theme.textMain} font-mono group`}
            title="Click to view remaining limits and token quota"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className={`text-[11px] font-bold ${theme.textMain} flex items-center gap-1`}>
                <span>{remainingCredits.toLocaleString()}</span>
                <span className={`text-[9px] ${theme.textSecondary}`}>/ {monthlyCredits.toLocaleString()} Cr</span>
              </span>
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${percentageLeft}%`, backgroundColor: primary }}
                />
              </div>
            </div>
            <ChevronDown className={`w-3 h-3 ${theme.textSecondary} transition-transform duration-200 ${showLimitsPopover ? 'rotate-180 text-white' : ''}`} />
          </button>

          {/* Limits & Quota Popover Card */}
          {showLimitsPopover && (
            <div className={`absolute right-0 top-full mt-2 w-80 ${theme.bgCard} ${theme.accentBorder} border rounded-2xl shadow-2xl p-4 z-50 text-xs ${theme.textMain} space-y-3 animate-fadeIn backdrop-blur-xl`}>
              <div className={`flex items-center justify-between pb-2 border-b ${theme.accentBorder}`}>
                <div className={`flex items-center gap-1.5 font-bold ${theme.textMain} text-xs`}>
                  <Info className="w-4 h-4" />
                  <span>Limits & Quota Balance</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold border border-white/20">
                  {percentageLeft}% Left
                </span>
              </div>

              {/* Credit Quota Progress */}
              <div className={`p-3 rounded-xl ${theme.bgInput} border ${theme.accentBorder} space-y-2`}>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className={theme.textSecondary}>Monthly Credits</span>
                  <span className={`font-bold ${theme.textMain}`}>
                    {remainingCredits.toLocaleString()} / {monthlyCredits.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-white" 
                    style={{ width: `${percentageLeft}%` }}
                  />
                </div>
                <p className={`text-[10px] ${theme.textSecondary} leading-relaxed`}>
                  Credits reset at the start of your monthly billing cycle.
                </p>
              </div>

              {/* Model Context Limit */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className={`p-2.5 rounded-xl ${theme.bgInput} border ${theme.accentBorder}`}>
                  <span className={`text-[10px] ${theme.textSecondary} block`}>Active Model</span>
                  <span className={`font-bold ${theme.textMain} truncate block mt-0.5`}>{currentModel.displayName}</span>
                </div>
                <div className={`p-2.5 rounded-xl ${theme.bgInput} border ${theme.accentBorder}`}>
                  <span className={`text-[10px] ${theme.textSecondary} block`}>Context Window</span>
                  <span className={`font-bold ${theme.textMain} block mt-0.5`}>
                    {formatContextTokens(currentModel.max_context_tokens)} tokens
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl ${theme.bgInput} border ${theme.accentBorder} flex items-center justify-between font-mono text-[11px]`}>
                <span className={theme.textSecondary}>Session Tokens Used</span>
                <span className={`font-bold ${theme.textMain}`}>{usedCredits.toLocaleString()} tokens</span>
              </div>

              {/* Upgrade CTA */}
              <button
                onClick={() => {
                  setShowLimitsPopover(false);
                  if (onOpenUpgradeModal) onOpenUpgradeModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md active:scale-95"
              >
                <span>Upgrade Plan for Higher Limits</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          )}
        </div>

        {/* Connectors & Integrations */}
        <Tooltip content="External Connectors & Automations">
          <button
            onClick={onOpenConnectors}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.bgCard} hover:opacity-90 ${theme.accentBorder} border text-xs font-medium ${theme.textSecondary} hover:${theme.textMain} transition-all active:scale-95 shadow-sm`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Connectors</span>
          </button>
        </Tooltip>

        {/* Auth Button */}
        <AuthButton session={session} />

        {/* Upgrade Button */}
        <Tooltip content="Upgrade your plan for higher limits">
          <button
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-200 text-black font-bold text-xs shadow-md transition-all duration-200 ease-in-out active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
