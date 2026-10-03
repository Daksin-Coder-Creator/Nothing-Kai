import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Home, 
  Settings, 
  MessageSquare, 
  Trash2, 
  Monitor, 
  Activity, 
  BookOpen, 
  ShieldCheck, 
  X,
  HelpCircle,
  Pin,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Archive,
  CheckSquare,
  Square,
  Target,
  Bookmark,
  Award,
  Sparkles,
  Lock,
  Youtube,
  Gamepad2,
  Zap
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ChatConversation, ViewMode, ChatFolder } from '../types';
import { IconAtom } from './IconAtom';
import { Tooltip } from './ui/Tooltip';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';

interface SidebarProps {
  conversations: ChatConversation[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
  onDeleteConv: (id: string) => void;
  onTogglePin?: (id: string) => void;
  folders: ChatFolder[];
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (convId: string, folderId?: string) => void;
  onDeleteMultipleConvs?: (ids: string[]) => void;
  onMoveMultipleToFolder?: (ids: string[], folderId?: string) => void;
  onArchiveMultipleConvs?: (ids: string[], archived: boolean) => void;
  onOpenSettings: () => void;
  onOpenPromptsModal: () => void;
  onOpenStatusView: () => void;
  onOpenGuideView: () => void;
  onOpenWorkspace: () => void;
  onOpenConnectors?: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userRole?: 'user' | 'admin';
  isReducedMotion?: boolean;
  isCollapsed?: boolean;
  activeTheme?: ThemeId;

  // Daily learning goals
  dailyGoalType?: 'tokens' | 'questions';
  dailyGoalTarget?: number;
  dailyGoalProgress?: number;
  onSetDailyGoal?: (type: 'tokens' | 'questions', target: number) => void;}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConv,
  onNewChat,
  onDeleteConv,
  onTogglePin,
  folders = [],
  onCreateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onDeleteMultipleConvs,
  onMoveMultipleToFolder,
  onArchiveMultipleConvs,
  onOpenSettings,
  onOpenStatusView,
  onOpenGuideView,
  onOpenWorkspace,
  onOpenConnectors,
  viewMode,
  onChangeViewMode,
  isMobileOpen,
  onCloseMobile,
  userRole = 'user',
  isCollapsed = false,
  activeTheme = 'silk',

  // Daily learning goals
  dailyGoalType = 'questions',
  dailyGoalTarget = 5,
  dailyGoalProgress = 0,
  onSetDailyGoal,}) => {
  const [user] = useAuthState(auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activeMoveDropdown, setActiveMoveDropdown] = useState<string | null>(null);

  // Drag and Drop & Bulk Selection States
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverUncategorized, setDragOverUncategorized] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [showBulkMoveMenu, setShowBulkMoveMenu] = useState(false);

  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMoveDropdown(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);

  const filteredConversations = (conversations || [])
    .filter(c => (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => showArchivedOnly ? !!c.archived : !c.archived)
    .sort((a, b) => {
      const aPinned = !!a.pinned;
      const bPinned = !!b.pinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  // Bulk actions helpers
  const toggleSelectConv = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredConversations.map(c => c.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const unique = new Set([...prev, ...visibleIds]);
        return Array.from(unique);
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected conversations?`)) {
      onDeleteMultipleConvs?.(selectedIds);
      setSelectedIds([]);
      setIsBulkMode(false);
    }
  };

  const handleBulkMove = (folderId?: string) => {
    if (selectedIds.length === 0) return;
    onMoveMultipleToFolder?.(selectedIds, folderId);
    setSelectedIds([]);
    setIsBulkMode(false);
    setShowBulkMoveMenu(false);
  };

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return;
    onArchiveMultipleConvs?.(selectedIds, !showArchivedOnly);
    setSelectedIds([]);
    setIsBulkMode(false);
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const renderConversationItem = (conv: ChatConversation) => {
    const isActive = conv.id === activeConvId;
    const isMoveDropdownOpen = activeMoveDropdown === conv.id;
    const isSelected = selectedIds.includes(conv.id);

    return (
      <div
        key={conv.id}
        draggable={!isBulkMode}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', conv.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={(e) => {
          if (isBulkMode) {
            e.stopPropagation();
            toggleSelectConv(conv.id);
          } else {
            onSelectConv(conv.id);
            if (isMobileOpen) onCloseMobile();
          }
        }}
        style={isActive ? { backgroundColor: `${primary}33`, borderColor: primary, color: accent } : undefined}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition border relative select-none ${
          isActive 
            ? 'shadow-sm border-white/20' 
            : `border-transparent ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5`
        } ${isSelected && isBulkMode ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-1 flex-1">
          {isBulkMode ? (
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={() => toggleSelectConv(conv.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 focus:ring-offset-0 shrink-0 cursor-pointer"
            />
          ) : (
            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'opacity-60'}`} style={isActive ? { color: primary } : undefined} />
          )}
          <span className="truncate">{conv.title}</span>
        </div>
        
        {!isBulkMode && (
          <div className="flex items-center gap-1 shrink-0 relative">
            {/* Move to Folder Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMoveDropdown(isMoveDropdownOpen ? null : conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-400 transition"
              title="Move to folder"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>

            {/* Pin Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.(conv.id);
              }}
              className={`p-1 transition duration-150 ${
                conv.pinned 
                  ? 'text-amber-400 opacity-100' 
                  : 'opacity-0 group-hover:opacity-100 p-1 opacity-60 hover:text-amber-400 transition'
              }`}
              title={conv.pinned ? "Unpin conversation" : "Pin conversation"}
            >
              <Pin className={`w-3.5 h-3.5 ${conv.pinned ? 'fill-current' : ''}`} />
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConv(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 opacity-60 hover:text-rose-400 transition"
              title="Delete conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Folder dropdown menu */}
            {isMoveDropdownOpen && (
              <div 
                className="absolute bottom-full right-0 mb-1 z-50 bg-[#161618] border border-white/10 rounded-xl p-1.5 shadow-2xl min-w-[150px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
                  Move to Folder
                </div>
                {folders.length === 0 ? (
                  <div className="px-2 py-2 text-[10px] text-gray-500 italic">
                    No folders created yet.
                  </div>
                ) : (
                  folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onMoveToFolder(conv.id, f.id);
                        setActiveMoveDropdown(null);
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-medium transition flex items-center justify-between ${
                        conv.folderId === f.id 
                          ? 'bg-indigo-500/20 text-indigo-300' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{f.name}</span>
                      {conv.folderId === f.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                    </button>
                  ))
                )}
                {conv.folderId && (
                  <button
                    onClick={() => {
                      onMoveToFolder(conv.id, undefined);
                      setActiveMoveDropdown(null);
                    }}
                    className="w-full mt-1.5 px-2 py-1.5 rounded-lg text-left text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 transition border-t border-white/5"
                  >
                    Remove from folder
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed && !isMobileOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 ${theme.bgCard} ${theme.accentBorder} border-r flex flex-col justify-between pt-6 pb-4 px-3
        lg:static lg:translate-x-0 transition-transform duration-200 shadow-xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* TOP HEADER: Branding & New Chat */}
        <div className="flex flex-col gap-3 pt-4 sm:pt-6 shrink-0">
          <div className="flex items-center justify-between px-2 pt-2 pb-1.5 mt-2">
            <button
              onClick={() => {
                onChangeViewMode('web');
                onNewChat();
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="animate-float-gentle transition-transform duration-200 group-hover:scale-105 shrink-0">
                <IconAtom variant="header" size={32} />
              </div>
              <div className="pt-0.5">
                <span className={`font-bold text-sm ${theme.textMain} tracking-tight block leading-tight`}>Nothing-Ai Atom</span>
                <span className={`block text-[10px] ${theme.textSecondary} font-mono mt-0.5`}>Nothing Engine v2.6</span>
              </div>
            </button>
          </div>

          <Tooltip content="New Chat Session" position="right">
            <button
              onClick={() => {
                onNewChat();
                if (isMobileOpen) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition shadow-md active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat Session</span>
            </button>
          </Tooltip>

          {/* Search Bar */}
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 opacity-50 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search past chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.accentBorder} border rounded-xl pl-9 pr-3 py-2 text-xs ${theme.textMain} placeholder-gray-400 focus:outline-none focus:border-white/30 transition`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons under Search */}
          <div className="flex items-center justify-between px-1 mt-1 shrink-0 gap-1.5">
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedIds([]);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1.5 ${
                isBulkMode 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:text-white text-zinc-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBulkMode ? 'Exit Select' : 'Select'}</span>
            </button>

            <button
              onClick={() => {
                setShowArchivedOnly(!showArchivedOnly);
                setSelectedIds([]);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1.5 ${
                showArchivedOnly 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:text-white text-zinc-400'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchivedOnly ? 'Active' : 'Archived'}</span>
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Navigation, Folders & Chats */}
        <div className="flex-1 overflow-y-auto my-3 space-y-4 pr-0.5 scrollbar-thin">
          {/* Core Views */}
          <div className="space-y-1">
            <div className={`px-2 pb-1 text-[10px] font-semibold ${theme.textSecondary} uppercase tracking-wider`}>Navigation</div>
            <button
              onClick={() => {
                onChangeViewMode('web');
                if (isMobileOpen) onCloseMobile();
              }}
              style={viewMode === 'web' ? { backgroundColor: `${primary}33`, borderColor: primary, color: accent } : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                viewMode === 'web' 
                  ? 'font-semibold border shadow-sm' 
                  : `${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" style={viewMode === 'web' ? { color: primary } : undefined} />
                <span>Assistant Hub</span>
              </div>
              {viewMode === 'web' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />}
            </button>

            <button
              onClick={() => {
                onChangeViewMode('desktop');
                if (isMobileOpen) onCloseMobile();
              }}
              style={viewMode === 'desktop' ? { backgroundColor: `${primary}33`, borderColor: primary, color: accent } : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                viewMode === 'desktop' 
                  ? 'font-semibold border shadow-sm' 
                  : `${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4" style={viewMode === 'desktop' ? { color: primary } : undefined} />
                <span>Desktop Workbench</span>
              </div>
              {viewMode === 'desktop' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />}
            </button>

            <button
              onClick={() => {
                onChangeViewMode('story');
                if (isMobileOpen) onCloseMobile();
              }}
              style={viewMode === 'story' ? { backgroundColor: `${primary}33`, borderColor: primary, color: accent } : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                viewMode === 'story' 
                  ? 'font-semibold border shadow-sm' 
                  : `${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" style={viewMode === 'story' ? { color: primary } : undefined} />
                <span>Anime Story Mode</span>
              </div>
              {viewMode === 'story' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />}
            </button>

            <button
              onClick={() => {
                onOpenWorkspace();
                if (isMobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5 transition`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" style={{ color: primary }} />
                <span>Workspace Hub</span>
              </div>
              {!user && <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />}
            </button>

            <button
              onClick={() => {
                onOpenConnectors?.();
                if (isMobileOpen) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition shadow-sm"
              title="Connect external tools & automate workflows"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Connectors & Auto</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                Automate
              </span>
            </button>


          </div>



          {/* Folders and Categorization Section */}
          <div className={`space-y-1.5 pt-2 border-t ${theme.accentBorder}`}>
            <div className="flex items-center justify-between px-2">
              <span className={`text-[10px] font-semibold ${theme.textSecondary} uppercase tracking-wider`}>Folders</span>
              <button 
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className={`p-1 rounded hover:bg-white/5 text-xs transition ${theme.textSecondary} hover:${theme.textMain}`}
                title="Create folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolderSubmit} className="px-2 py-1 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`flex-1 ${theme.bgInput} ${theme.accentBorder} border rounded-lg px-2 py-1 text-[11px] ${theme.textMain} placeholder-gray-500 focus:outline-none`}
                  autoFocus
                />
                <button type="submit" className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold">
                  Add
                </button>
              </form>
            )}

            <div className="space-y-1">
              {(folders || []).map((folder) => {
                const isFolderOpen = openFolders[folder.id] !== false; // default to true
                const folderConvs = filteredConversations.filter(c => c.folderId === folder.id);
                const isDragOver = dragOverFolderId === folder.id;

                return (
                  <div 
                    key={folder.id} 
                    className={`space-y-0.5 rounded-xl transition-all duration-150 ${
                      isDragOver ? 'bg-indigo-500/10 border border-dashed border-indigo-500/35 p-1' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={() => {
                      setDragOverFolderId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const convId = e.dataTransfer.getData('text/plain');
                      if (convId) {
                        onMoveToFolder(convId, folder.id);
                      }
                      setDragOverFolderId(null);
                    }}
                  >
                    {/* Folder Row */}
                    <div 
                      onClick={() => toggleFolder(folder.id)}
                      className={`group/folder flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/5 transition text-gray-300 font-medium`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isFolderOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                        {isFolderOpen ? <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        <span className="truncate text-zinc-300 text-xs font-semibold">{folder.name}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">({folderConvs.length})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete folder "${folder.name}"? Conversations inside will be uncategorized.`)) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                        className="opacity-0 group-hover/folder:opacity-100 p-1 text-gray-500 hover:text-rose-400 transition"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Folder Conversations list */}
                    {isFolderOpen && (
                      <div className="pl-4 space-y-0.5 border-l border-white/5 ml-3.5">
                        {folderConvs.length === 0 ? (
                          <div className="py-2 px-2 text-center">
                            <p className="text-[10px] text-gray-500 italic">Empty folder</p>
                          </div>
                        ) : (
                          folderConvs.map((conv) => renderConversationItem(conv))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Conversations / Uncategorized */}
          <div 
            className={`space-y-1.5 pt-2 border-t ${theme.accentBorder} transition-all duration-150 ${
              dragOverUncategorized ? 'bg-zinc-800/40 p-1.5 border border-dashed border-zinc-500/40 rounded-xl' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverUncategorized(true);
            }}
            onDragLeave={() => {
              setDragOverUncategorized(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const convId = e.dataTransfer.getData('text/plain');
              if (convId) {
                onMoveToFolder(convId, undefined);
              }
              setDragOverUncategorized(false);
            }}
          >
            <div className="flex items-center justify-between px-2">
              <span className={`text-[10px] font-semibold ${theme.textSecondary} uppercase tracking-wider`}>Conversations</span>
              <span className={`text-[10px] ${theme.textSecondary} font-mono`}>
                {filteredConversations.filter(c => !c.folderId).length}
              </span>
            </div>

            <div className="space-y-0.5">
              {filteredConversations.filter(c => !c.folderId).length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className={`text-xs ${theme.textSecondary} italic`}>No other conversations</p>
                </div>
              ) : (
                filteredConversations.filter(c => !c.folderId).map((conv) => renderConversationItem(conv))
              )}
            </div>
          </div>
        </div>

        {/* BULK ACTION CONTROL BAR */}
        {isBulkMode && (
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-3 mb-2 mx-1 space-y-2 shadow-2xl shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Bulk Selection
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-[10px] font-bold text-zinc-400 hover:text-white transition"
              >
                {filteredConversations.every(c => selectedIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="text-[11px] text-zinc-300 font-semibold flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
              <span>Selected items:</span>
              <span className="font-mono bg-indigo-500 text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                {selectedIds.length}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1 relative">
              <button
                onClick={handleBulkArchive}
                disabled={selectedIds.length === 0}
                className="py-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-white/5 active:scale-95"
                title={showArchivedOnly ? "Restore to active chats" : "Archive selected chats"}
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>{showArchivedOnly ? 'Restore' : 'Archive'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBulkMoveMenu(!showBulkMoveMenu);
                  }}
                  disabled={selectedIds.length === 0}
                  className="w-full py-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-white/5 active:scale-95"
                  title="Move selected chats to a folder"
                >
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Move</span>
                </button>
                {showBulkMoveMenu && (
                  <div 
                    className="absolute bottom-full left-0 mb-1.5 z-50 bg-[#161618] border border-white/10 rounded-2xl p-1.5 shadow-2xl min-w-[160px] max-h-[180px] overflow-y-auto scrollbar-thin"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
                      Choose Target Folder
                    </div>
                    {folders.length === 0 ? (
                      <div className="px-2.5 py-2 text-[10px] text-gray-500 italic">No folders created</div>
                    ) : (
                      folders.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleBulkMove(f.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                        >
                          {f.name}
                        </button>
                      ))
                    )}
                    <button
                      onClick={() => handleBulkMove(undefined)}
                      className="w-full text-left mt-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 border-t border-white/5 transition-colors"
                    >
                      Remove from folder
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0}
                className="py-2 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 disabled:opacity-40 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-rose-500/20 active:scale-95"
                title="Permanently delete selected chats"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* FOOTER SECTION: System, Status, Admin & Settings */}
        <div className={`pt-3 border-t ${theme.accentBorder} space-y-1 shrink-0`}>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onOpenStatusView}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5 transition`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status</span>
            </button>

            <button
              onClick={onOpenGuideView}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/5 transition`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Guide</span>
            </button>
          </div>

          <Tooltip content="Settings & Tiers" position="right">
            <button
              onClick={onOpenSettings}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${theme.textSecondary} hover:${theme.textMain} hover:bg-white/10 transition mt-1`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 opacity-70" />
                <span>Settings & Tiers</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white">Pro</span>
            </button>
          </Tooltip>

          <div className={`pt-2 px-1 flex items-center justify-between text-[10px] ${theme.textSecondary} font-mono opacity-80`}>
            <span>App Version</span>
            <span>v2.6.0-Enterprise</span>
          </div>
        </div>
      </aside>
    </>
  );
};
