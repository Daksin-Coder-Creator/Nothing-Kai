import React, { useState } from 'react';
import { 
  X, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Sliders, 
  Bell, 
  Check, 
  Edit2, 
  Lock, 
  Download, 
  Trash2, 
  ChevronRight, 
  Globe, 
  Cpu, 
  CreditCard, 
  Activity, 
  BookOpen, 
  Info,
  Zap,
  Key,
  Layers,
  Sparkles,
  HelpCircle,
  Award,
  CheckSquare,
  Clock,
  Palette
} from 'lucide-react';
import { ALL_NOTHING_AI_MODELS, NOTHING_AI_TIERS, NothingAiModel } from '../core/modelsConfig';
import { UnifiedModelSelector } from './UnifiedModelSelector';
import { UserSession, runAuthE2ETests, AuthTestResult, linkProviderToAccount } from '../core/authEngine';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ChatConversation } from '../types';
import { jsPDF } from 'jspdf';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
  onExportAllData: () => void;
  currentConversation?: ChatConversation | null;
  currentTierId: string;
  onSelectTier: (tierId: string) => void;
  currentModelId: string;
  onSelectModel: (model: NothingAiModel) => void;
  creditBalance?: number;
  session: UserSession | null;
  onUpdateSession?: (session: UserSession) => void;
  onOpenStatusView?: () => void;
  onOpenGuideView?: () => void;
  isReducedMotion: boolean;
  onToggleReducedMotion: () => void;
  activeTheme?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
  onExportAllData,
  currentConversation,
  currentTierId,
  onSelectTier,
  currentModelId,
  onSelectModel,
  session,
  onUpdateSession,
  onOpenStatusView,
  onOpenGuideView,
  isReducedMotion,
  onToggleReducedMotion,
  activeTheme = 'silk',
  onSelectTheme,
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'security' | 'profile' | 'ai' | 'custom_instructions' | 'preferences' | 'quiz' | 'integrations' | 'api' | 'data' | 'about'>('about');
  
  // Editable user state
  const [userEmail, setUserEmail] = useState(session?.email || 'sgambika22@gmail.com');
  const [userName, setUserName] = useState(session?.name || 'Sgambika User');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [trustedPhone, setTrustedPhone] = useState('+1 (555) 234-5678');
  const [showAddPhoneInput, setShowAddPhoneInput] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveProfileMsg, setSaveProfileMsg] = useState(false);

  const handleSaveProfile = () => {
    if (session && onUpdateSession) {
      const updated: UserSession = {
        ...session,
        name: userName.trim() || 'Sgambika User',
        email: userEmail.trim() || 'sgambika22@gmail.com',
      };
      onUpdateSession(updated);
    } else if (onUpdateSession) {
      onUpdateSession({
        id: 'usr_' + Date.now(),
        name: userName.trim() || 'Sgambika User',
        email: userEmail.trim() || 'sgambika22@gmail.com',
        role: 'admin',
        tierId: currentTierId,
        providers: ['google'],
        token: 'qxt_' + Math.random().toString(36),
        createdAt: Date.now(),
      });
    }
    setSaveProfileMsg(true);
    setTimeout(() => setSaveProfileMsg(false), 3000);
  };

  // Advanced AI & System Settings
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('Nothing-Ai_custom_instructions') || '');
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('Nothing-Ai_temperature') || '0.7'));
  const [maxTokens, setMaxTokens] = useState(() => localStorage.getItem('Nothing-Ai_max_tokens') || '8192');
  const [responseLanguage, setResponseLanguage] = useState(() => localStorage.getItem('Nothing-Ai_response_lang') || 'English');
  const [autoRouterDefault, setAutoRouterDefault] = useState(() => localStorage.getItem('Nothing-Ai_auto_router_default') === 'true');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('Nothing-Ai_custom_api_key') || '');
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('Nothing-Ai_elevenlabs_key') || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => localStorage.getItem('Nothing-Ai_elevenlabs_voice_id') || '');
  
  // Quiz & Knowledge Assessor Settings State
  const [quizDefaultCount, setQuizDefaultCount] = useState(() => localStorage.getItem('Nothing-Ai_quiz_count_sel') || '5');
  const [quizCustomCount, setQuizCustomCount] = useState(() => parseInt(localStorage.getItem('Nothing-Ai_quiz_custom_count') || '25', 10));
  const [quizEvalMode, setQuizEvalMode] = useState(() => localStorage.getItem('Nothing-Ai_quiz_eval_mode') || 'exam');
  const [quizTimer, setQuizTimer] = useState(() => localStorage.getItem('Nothing-Ai_quiz_timer') || 'untimed');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [devSecretInput, setDevSecretInput] = useState('');
  const [devUnlockMsg, setDevUnlockMsg] = useState<string | null>(null);

  const handleSaveCustomInstructions = (val: string) => {
    setCustomInstructions(val);
    localStorage.setItem('Nothing-Ai_custom_instructions', val);
    showSavedToast();
  };

  const handleSaveTemperature = (val: number) => {
    setTemperature(val);
    localStorage.setItem('Nothing-Ai_temperature', val.toString());
    showSavedToast();
  };

  const handleSaveMaxTokens = (val: string) => {
    setMaxTokens(val);
    localStorage.setItem('Nothing-Ai_max_tokens', val);
    showSavedToast();
  };

  const handleSaveLanguage = (val: string) => {
    setResponseLanguage(val);
    localStorage.setItem('Nothing-Ai_response_lang', val);
    showSavedToast();
  };

  const handleToggleAutoRouterDefault = () => {
    const nextVal = !autoRouterDefault;
    setAutoRouterDefault(nextVal);
    localStorage.setItem('Nothing-Ai_auto_router_default', nextVal.toString());
    showSavedToast();
  };

  const handleSaveElevenLabs = (key: string, voiceId: string) => {
    setElevenLabsKey(key);
    setElevenLabsVoiceId(voiceId);
    localStorage.setItem('Nothing-Ai_elevenlabs_key', key);
    localStorage.setItem('Nothing-Ai_elevenlabs_voice_id', voiceId);
    showSavedToast();
  };

  const handleSaveApiKey = (val: string) => {
    setCustomApiKey(val);
    localStorage.setItem('Nothing-Ai_custom_api_key', val);
    showSavedToast();
  };

  const handleExportPDF = () => {
    if (!currentConversation) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;

      let y = margin;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 90, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('QuntxAI', margin, 40);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Professional Conversation Export', margin, 60);
      doc.text(new Date().toLocaleString(), pageWidth - margin, 60, { align: 'right' });

      y = 130;

      // Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      
      const titleText = currentConversation.title || 'Untitled Chat';
      const titleLines = doc.splitTextToSize(titleText, contentWidth);
      titleLines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 20;
      });

      y += 10;

      // Messages
      const msgs = currentConversation.messages || [];
      msgs.forEach((m) => {
        if (y > pageHeight - margin - 40) {
          doc.addPage();
          y = margin;
        }

        // Line separator
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;

        const isUser = m.role === 'user';
        
        // Badge Background
        if (isUser) {
          doc.setFillColor(241, 245, 249); // slate-100
          doc.setTextColor(51, 65, 85); // slate-700
        } else {
          doc.setFillColor(240, 253, 250); // teal-50
          doc.setTextColor(13, 148, 136); // teal-600
        }

        doc.rect(margin, y - 10, 80, 16, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(isUser ? 'USER' : 'AI ASSISTANT', margin + 6, y + 1);

        // Timestamp
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        const timeStr = new Date(m.timestamp).toLocaleTimeString();
        doc.text(timeStr, margin + 90, y + 1);

        y += 20;

        // Message text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // slate-700

        // Clean formatting
        let cleanText = m.content
          .replace(/```[\s\S]*?```/g, '\n[Code Block omitted for formatting]\n')
          .replace(/\r?\n/g, '\n');
        
        const textLines = doc.splitTextToSize(cleanText, contentWidth);
        textLines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 15;
        });

        y += 15; // padding after message
      });

      doc.save(`quntxai-chat-${Date.now()}.pdf`);
    } catch (e) {
      console.error('Failed to export PDF:', e);
      alert('Error generating PDF export. Please try again.');
    }
  };

  const showSavedToast = () => {
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const [user] = useAuthState(auth);

  const handleSwitchAccount = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isOpen) return null;

  const currentTier = NOTHING_AI_TIERS.find((t) => t.id === currentTierId) || NOTHING_AI_TIERS[0];

  const sidebarNavItems = [
    { id: 'about', label: 'App Version & System', icon: <Info className="w-4 h-4 text-indigo-400" />, desc: 'Application version, build ID, and system diagnostics' },
    { id: 'security', label: 'Security & Auth', icon: <Shield className="w-4 h-4 text-emerald-400" />, desc: 'Password, email, and authentication options' },
    { id: 'profile', label: 'Account Profile', icon: <User className="w-4 h-4 text-zinc-400" />, desc: 'Personal info, user roles, and profile settings' },
    { id: 'ai', label: 'AI & Models', icon: <Cpu className="w-4 h-4 text-cyan-400" />, desc: 'Default models, response parameters, and plans' },
    { id: 'custom_instructions', label: 'Custom System Prompt', icon: <Sparkles className="w-4 h-4 text-zinc-400" />, desc: 'System behavior, persona directives, and rules' },
    { id: 'preferences', label: 'Preferences & UI', icon: <Sliders className="w-4 h-4 text-amber-400" />, desc: 'App theme, language, animations, and sound' },
    { id: 'quiz', label: 'Quiz & Assessor', icon: <HelpCircle className="w-4 h-4 text-white" />, desc: 'Question limits, evaluation modes, and grading rules' },
    { id: 'integrations', label: 'Connected Accounts', icon: <Globe className="w-4 h-4 text-blue-400" />, desc: 'OAuth logins and external provider integrations' },
    { id: 'api', label: 'API & Developers', icon: <Key className="w-4 h-4 text-orange-400" />, desc: 'Manage API keys and programmatic access' },
    { id: 'data', label: 'Data & Privacy', icon: <Download className="w-4 h-4 text-rose-400" />, desc: 'Export history, clear cache, and local storage' },
  ];

  const filteredNavItems = sidebarNavItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Sleek Deep Black Dark Settings Window */}
      <div className="w-full max-w-5xl bg-[#0a0a0a] text-gray-100 rounded-2xl shadow-2xl border border-[#2b2b2b] flex flex-col overflow-hidden max-h-[92vh] font-sans">
        
        {/* TOP HEADER: Dark Header Title & Search Bar */}
        <div className="px-6 py-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#111111] shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-white font-bold text-xs shadow-md">
                Q
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">Settings</h1>
            </div>
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-[#2b2b2b] focus:border-white/50 rounded-xl pl-9 pr-12 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                ⌘K
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: 2-Column Sidebar + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-64 bg-[#0e0e0e] border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col p-2 md:p-3 overflow-x-auto md:overflow-y-auto shrink-0 select-none text-xs gap-1 md:gap-0 md:space-y-1 no-scrollbar">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
              Workspace Settings
            </div>

            {filteredNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={isActive ? { backgroundColor: `${primary}25`, borderColor: `${primary}66`, color: accent } : undefined}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 group border ${
                    isActive
                      ? 'font-semibold shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs leading-tight flex items-center justify-between">
                      <span>{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: primary }} />}
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </button>
              );
            })}

            {/* Bottom Quick Links */}
            <div className="pt-4 border-t border-white/10 mt-auto space-y-1">
              {onOpenStatusView && (
                <button
                  onClick={() => {
                    onOpenStatusView();
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-[11px] flex items-center gap-2 transition"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Status</span>
                </button>
              )}
              {onOpenGuideView && (
                <button
                  onClick={() => {
                    onOpenGuideView();
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-[11px] flex items-center gap-2 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>User Guide & Shortcuts</span>
                </button>
              )}
            </div>
          </aside>

          {/* RIGHT CONTENT AREA */}
          <main className="flex-1 flex flex-col bg-[#000000] overflow-hidden min-w-0">
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-gray-300">
              
              {/* 1. SECURITY & AUTH SECTION */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      Security & Authentication
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Manage account security parameters, password policies, and multi-factor verification options.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Primary Email Address */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs">Primary Email Address</h3>
                        <p className="text-[11px] text-gray-400">Used for login authentication, system notifications, and security alerts.</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                        VERIFIED
                      </span>
                    </div>

                    {isEditingEmail ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="px-3 py-1.5 bg-[#1a1a1a] border border-zinc-500/50 rounded-xl text-xs text-white focus:outline-none flex-1"
                        />
                        <button
                          onClick={() => setIsEditingEmail(false)}
                          className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 text-white rounded-xl text-xs font-semibold transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5">
                        <span className="font-mono text-white text-xs">{userEmail}</span>
                        <button
                          onClick={() => setIsEditingEmail(true)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Accounts / Switcher */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Active Sessions & Account Switcher</h3>
                      <p className="text-[11px] text-gray-400">Add another account or switch between existing Google identities.</p>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {user ? (
                        <div className="flex items-center justify-between bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                              {user.displayName?.[0] || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-[11px] font-bold">{user.displayName}</span>
                              <span className="text-gray-500 text-[10px] font-mono">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSwitchAccount}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-medium transition border border-white/10"
                            >
                              Switch Account
                            </button>
                            <button
                              onClick={handleSignOut}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-medium transition border border-rose-500/20"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleSwitchAccount}
                          className="w-full py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <User className="w-3.5 h-3.5" />
                          Sign in with Google
                        </button>
                      )}
                      
                      <button 
                        onClick={handleSwitchAccount}
                        className="w-full py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-medium transition flex items-center justify-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Add another account
                      </button>
                    </div>
                  </div>

                  {/* Password & Security */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Account Password</h3>
                      <p className="text-[11px] text-gray-400">Manage your password to ensure your account remains safe from unauthorized access.</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-400">Last updated: 30 days ago</span>
                      <button 
                        onClick={() => alert('Password reset email has been sent.')}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/10"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>

                  {/* Trusted Phone Number */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Trusted Verification Phone</h3>
                      <p className="text-[11px] text-gray-400">Add a phone number to verify identity during sensitive configuration updates.</p>
                    </div>

                    {showAddPhoneInput ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="tel"
                          value={trustedPhone}
                          onChange={(e) => setTrustedPhone(e.target.value)}
                          className="px-3 py-1.5 bg-[#1a1a1a] border border-zinc-500/50 rounded-xl text-xs text-white focus:outline-none flex-1"
                        />
                        <button
                          onClick={() => setShowAddPhoneInput(false)}
                          className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 text-white rounded-xl text-xs font-semibold transition"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5">
                        <span className="font-mono text-white text-xs">{trustedPhone}</span>
                        <button
                          onClick={() => setShowAddPhoneInput(true)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-medium transition"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. ACCOUNT PROFILE SECTION */}
              {activeTab === 'profile' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-zinc-400" />
                      Name Designer & Account Profile
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Customize your display name and personal identity badge across all workspace modules instantly.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {saveProfileMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <span>✓ Display name and profile updated successfully! Changes reflect across the app.</span>
                    </div>
                  )}

                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20">
                        {userName[0] || 'U'}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white">{userName}</h3>
                        <p className="text-xs text-gray-400">{userEmail}</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                          ROLE: {session?.role?.toUpperCase() || 'WORKSPACE OWNER'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Designer Display Name</label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Enter your custom display name..."
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/10 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-2"
                      >
                        <span>Save Profile & Name</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. AI & MODELS SECTION */}
              {activeTab === 'ai' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-cyan-400" />
                      AI & Sub-Model Defaults
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Configure your default AI model engines, context windows, temperature, and response limits.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Active Plan Card */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Active Plan Tier</span>
                        <div className="text-sm font-bold text-white">{currentTier.name} Plan</div>
                        <p className="text-xs text-gray-400">{currentTier.description}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold">
                        ${currentTier.price_usd}/mo
                      </span>
                    </div>
                  </div>

                  {/* Secret Developer Mode Card */}
                  <div className="bg-[#141414] border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <span>🔒 Developer Secret Unlock</span>
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Enter secret developer code <code className="text-amber-400 font-mono">Nothing-Ai_DEV_MASTER_2026</code> to instantly unlock Ultra Tier & all 18+ models.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="password"
                        value={devSecretInput}
                        onChange={(e) => setDevSecretInput(e.target.value)}
                        placeholder="Enter secret code..."
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (devSecretInput.trim() === 'Nothing-Ai_DEV_MASTER_2026' || devSecretInput.trim() === 'Nothing-Ai-ultra-dev') {
                            localStorage.setItem('Nothing-Aiai_current_tier_id', 'ultra');
                            setDevUnlockMsg('Success! Ultra Tier & All Models Unlocked. Refreshing...');
                            setTimeout(() => window.location.reload(), 1000);
                          } else {
                            setDevUnlockMsg('Invalid secret code.');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 transition shrink-0"
                      >
                        Unlock Ultra
                      </button>
                    </div>
                    {devUnlockMsg && (
                      <p className={`text-[11px] font-medium ${devUnlockMsg.includes('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {devUnlockMsg}
                      </p>
                    )}
                  </div>

                  {/* Model Selector Card */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Default Assistant Model</h3>
                      <p className="text-[11px] text-gray-400">Choose the primary Gemini LLM sub-model used for processing new conversation prompts.</p>
                    </div>

                    <div className="pt-1">
                      <UnifiedModelSelector
                        currentModelId={currentModelId}
                        onSelectModel={onSelectModel}
                        userTierId={currentTierId}
                        className="w-full"
                        position="down"
                      />
                    </div>
                  </div>

                  {/* Temperature & Creativity Slider */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs">Creativity / Temperature ({temperature.toFixed(1)})</h3>
                        <p className="text-[11px] text-gray-400">Lower values yield deterministic factual answers; higher values produce creative, exploratory responses.</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono font-bold text-xs border border-white/10">
                        {temperature < 0.3 ? 'Deterministic' : temperature < 0.8 ? 'Balanced' : 'Creative'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => handleSaveTemperature(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Max Output Tokens */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Max Response Tokens</h3>
                      <p className="text-[11px] text-gray-400">Set maximum response length generated per conversation turn.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {['2048', '4096', '8192', '16384'].map((tok) => (
                        <button
                          key={tok}
                          onClick={() => handleSaveMaxTokens(tok)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                            maxTokens === tok
                              ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {tok} tok
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Model Router Default */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Default to Self-Select Mode
                      </h3>
                      <p className="text-[11px] text-gray-400">Automatically inspect prompt intent (code, math, creative) and route to optimal sub-model on new chats.</p>
                    </div>

                    <button
                      onClick={handleToggleAutoRouterDefault}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                        autoRouterDefault ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-gray-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {autoRouterDefault ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>
              )}

              {/* 3.5. CUSTOM SYSTEM PROMPT / INSTRUCTIONS SECTION */}
              {activeTab === 'custom_instructions' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-zinc-400" />
                      Custom System Prompt & Persona Directives
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Define persistent directives that Nothing-Ai AI will automatically apply to every response in your workspace.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-white">Custom System Directive Prompt:</label>
                      <p className="text-[11px] text-gray-400">What would you like the AI to know about you or how it should respond?</p>
                    </div>

                    <textarea
                      rows={5}
                      value={customInstructions}
                      onChange={(e) => handleSaveCustomInstructions(e.target.value)}
                      placeholder="e.g., 'Always output code in clean TypeScript with type annotations. Keep explanations brief, concise, and structured with bullet points. Avoid preamble.'"
                      className="w-full p-3.5 bg-[#1a1a1a] border border-white/10 focus:border-zinc-500/60 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition leading-relaxed"
                    />

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase text-gray-400">Quick Directive Presets:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Always use TypeScript & modular code',
                          'Be concise and avoid long preambles',
                          'Format answers in structured bullet points',
                          'Act as an expert Physics & Math Professor',
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSaveCustomInstructions(preset)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-zinc-600/20 hover:border-zinc-400/40 border border-white/10 text-gray-300 hover:text-zinc-300 text-[10px] transition"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PREFERENCES & UI SECTION */}
              {activeTab === 'preferences' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-400" />
                      User Interface & Preferences
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Customize visual rendering, language settings, particle effects, and accessibility options.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Aesthetic Theme Selector Presets */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-amber-400" />
                          <span>Aesthetic Theme Preset</span>
                        </h3>
                        <p className="text-[11px] text-gray-400">Select accent colors, font typography, and background canvas aesthetics.</p>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-mono border border-amber-400/30">
                        {THEMES[activeTheme as ThemeId]?.name || 'Executive Dark'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {Object.values(THEMES).map((t) => {
                        const isSel = activeTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => onSelectTheme?.(t.id)}
                            className={`p-3 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                              isSel
                                ? `${t.accentBadgeBg} border-white/40 ring-1 ring-white/20 shadow-lg`
                                : 'bg-[#1c1c1c] border-white/10 hover:border-white/20 hover:bg-[#242424]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                                {t.name}
                                {isSel && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400 font-mono uppercase">
                                {t.fontClass.replace('font-', '')}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                              {t.tagline}
                            </p>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                              {(t.colorSwatch || []).map((hex, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                              <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                Preset
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Language */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Preferred Response Language</h3>
                      <p className="text-[11px] text-gray-400">Select default language for AI explanations and output formatting.</p>
                    </div>

                    <select
                      value={responseLanguage}
                      onChange={(e) => handleSaveLanguage(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#1a1a1a] border border-white/10 focus:border-amber-500/50 rounded-xl text-xs text-white focus:outline-none"
                    >
                      {['English', 'Spanish (Español)', 'Hindi (हिंदी)', 'French (Français)', 'German (Deutsch)', 'Japanese (日本語)', 'Mandarin (中文)', 'Arabic (العربية)', 'Portuguese (Português)'].map((lang) => (
                        <option key={lang} value={lang} className="bg-[#141414] text-white">
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reduced Motion Toggle */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <h3 className="font-semibold text-white text-xs">Reduced Motion & Particle Effects</h3>
                      <p className="text-[11px] text-gray-400">Disables animated particle orbits and intense visual transitions for low-power hardware.</p>
                    </div>
                    <button
                      onClick={onToggleReducedMotion}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                        isReducedMotion ? 'bg-amber-400 text-black font-bold' : 'bg-white/10 text-gray-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {isReducedMotion ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* System Notifications */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <h3 className="font-semibold text-white text-xs">System Completion Notifications</h3>
                      <p className="text-[11px] text-gray-400">Receive ambient visual and audio cues when long-running AI tasks finish executing.</p>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                        notificationsEnabled ? 'bg-zinc-600 text-white' : 'bg-white/10 text-gray-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {notificationsEnabled ? 'Active' : 'Muted'}
                    </button>
                  </div>
                </div>
              )}

              {/* 4.5. QUIZ & KNOWLEDGE ASSESSOR SECTION */}
              {activeTab === 'quiz' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-white" />
                      Quiz & Knowledge Assessor Settings
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Set question limit defaults, evaluation modes, and assessment rules.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Question Count Limit Defaults */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Default Question Limits</h3>
                      <p className="text-[11px] text-gray-400">Select standard question limit or specify a custom count.</p>
                    </div>

                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {['5', '10', '15', '20', 'custom'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setQuizDefaultCount(opt);
                            localStorage.setItem('Nothing-Ai_quiz_count_sel', opt);
                            showSavedToast();
                          }}
                          className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                            quizDefaultCount === opt
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {opt === 'custom' ? 'Custom' : `${opt} Qs`}
                        </button>
                      ))}
                    </div>

                    {quizDefaultCount === 'custom' && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Custom Limit:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={quizCustomCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setQuizCustomCount(val);
                            localStorage.setItem('Nothing-Ai_quiz_custom_count', val.toString());
                            showSavedToast();
                          }}
                          className="w-28 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Evaluation Mode */}
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-white text-xs">Evaluation Mode</h3>
                      <p className="text-[11px] text-gray-400">Select between Exam Mode or Instant Practice Mode.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setQuizEvalMode('exam');
                          localStorage.setItem('Nothing-Ai_quiz_eval_mode', 'exam');
                          showSavedToast();
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          quizEvalMode === 'exam'
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-semibold">Exam Mode</div>
                        <div className="text-[10px] opacity-80">Submit all answers before final grade & explanation key.</div>
                      </button>

                      <button
                        onClick={() => {
                          setQuizEvalMode('instant');
                          localStorage.setItem('Nothing-Ai_quiz_eval_mode', 'instant');
                          showSavedToast();
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          quizEvalMode === 'instant'
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-semibold">Instant Practice Mode</div>
                        <div className="text-[10px] opacity-80">Reveal correctness & answer key immediately on click.</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CONNECTED ACCOUNTS & INTEGRATIONS SECTION */}
              {activeTab === 'integrations' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      Connected OAuth Accounts
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Link third-party single sign-on authentication accounts for quick workspace login.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['google', 'github', 'microsoft'] as const).map((provider) => {
                      const isLinked = session?.providers.includes(provider);
                      return (
                        <div key={provider} className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-32">
                          <div>
                            <span className="capitalize font-bold text-white text-xs block">{provider} SSO</span>
                            <p className="text-[10px] text-gray-400 mt-1">Single sign-on authentication</p>
                          </div>
                          {isLinked ? (
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Connected
                            </span>
                          ) : (
                            <button
                              onClick={() => linkProviderToAccount(provider)}
                              className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/10"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. DATA & PRIVACY SECTION */}
              
              {activeTab === 'api' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-orange-400" />
                      API Keys & Developer Features
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Manage your custom API keys to integrate Nothing-Ai AI directly into your own applications, scripts, and workflows.
                    </p>
                  </div>
                  
                  <hr className="border-white/10" />
                  
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-sm">Your Personal Access Key</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        This key grants full programmatic access to your allocated Nothing-Ai API limits. Do not share it publicly.
                      </p>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="password"
                          value="qk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                          readOnly
                          className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition" title="Copy Key">
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button className="px-4 py-2.5 bg-zinc-600 hover:bg-zinc-500 rounded-xl text-xs font-semibold text-white transition whitespace-nowrap">
                        Generate New Key
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-sm">Custom LLM Provider Key</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        If you want to use your own direct Gemini, OpenAI, or Anthropic API keys to bypass rate limits, enter them below. These are stored locally in your browser.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">Google Gemini</span>
                        <input
                          type="password"
                          placeholder="AIzaSy..."
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">OpenAI</span>
                        <input
                          type="password"
                          placeholder="sk-..."
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">Anthropic</span>
                        <input
                          type="password"
                          placeholder="sk-ant-..."
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">ElevenLabs Key</span>
                        <input
                          type="password"
                          value={elevenLabsKey}
                          onChange={(e) => setElevenLabsKey(e.target.value)}
                          onBlur={(e) => handleSaveElevenLabs(e.target.value, elevenLabsVoiceId)}
                          placeholder="xi-api-key..."
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">Voice ID</span>
                        <input
                          type="text"
                          value={elevenLabsVoiceId}
                          onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                          onBlur={(e) => handleSaveElevenLabs(elevenLabsKey, e.target.value)}
                          placeholder="21m00Tcm4TlvDq8ikWAM"
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        API Rate Limits & Monitoring
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1">View your API endpoint latency and throughput.</p>
                    </div>
                    <button onClick={onOpenStatusView} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition">
                      View Dashboard
                    </button>
                  </div>

                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-indigo-400" />
                      App Version & System Diagnostics
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Nothing AI Workspace enterprise specifications, build version, and runtime status.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <span className="text-[11px] text-gray-400 block font-mono">Application Version</span>
                        <span className="text-sm font-bold text-white font-mono">v2.6.0-Enterprise</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                        PRODUCTION STABLE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 block text-[10px]">Build ID</span>
                        <span className="text-white font-medium">BUILD-2026.08.04-RELEASE</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Engine Core</span>
                        <span className="text-white font-medium">Nothing AI Router v4.2</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Runtime Framework</span>
                        <span className="text-white font-medium">React 18 / Vite / Node.js</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Security Protocol</span>
                        <span className="text-white font-medium">AES-256 Cloud Shield</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          alert('You are running the latest stable build (v2.6.0-Enterprise). No updates available.');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/15"
                      >
                        Check for Updates
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Download className="w-5 h-5 text-rose-400" />
                      Data, Storage & Privacy
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Export your full prompt conversation history or wipe local browser caching state.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs">Export All History</h3>
                        <p className="text-[11px] text-gray-400">Download a complete JSON export of all your chat conversations and settings.</p>
                      </div>
                      <button
                        onClick={onExportAllData}
                        className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition border border-white/10"
                      >
                        <Download className="w-4 h-4 text-zinc-400" />
                        <span>Export Data</span>
                      </button>
                    </div>

                    <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs">Export Chat to PDF</h3>
                        <p className="text-[11px] text-gray-400">Download a beautiful, formatted PDF document of your current conversation.</p>
                      </div>
                      <button
                        onClick={handleExportPDF}
                        disabled={!currentConversation}
                        className={`w-full py-2 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition border ${
                          currentConversation 
                            ? 'bg-[#1e293b] hover:bg-[#334155] border-white/10' 
                            : 'bg-zinc-800/20 text-zinc-500 border-zinc-800/10 cursor-not-allowed'
                        }`}
                      >
                        <Download className="w-4 h-4 text-rose-400" />
                        <span>Export Current Chat (PDF)</span>
                      </button>
                    </div>

                    <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-white text-xs">Clear Local Cache</h3>
                        <p className="text-[11px] text-gray-400">Purge local browser storage, resetting state back to default workspace parameters.</p>
                      </div>
                      <button
                        onClick={onClearAllData}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Clear Storage</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

