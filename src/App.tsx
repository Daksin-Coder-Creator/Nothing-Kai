import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChatConversation, 
  ChatMessage, 
  ViewMode,
  ChatFolder
} from './types';
import { 
  getStoredConversations, 
  saveConversations, 
  getActiveConversationId, 
  setActiveConversationId, 
  createNewConversation, 
  sendMessageToAI,
  getConversationsFromFirestore,
  saveConversationToFirestore,
  deleteConversationFromFirestore,
  syncLocalToFirestore,
  getStoredFolders,
  saveFolders,
  getFoldersFromFirestore,
  saveFolderToFirestore,
  deleteFolderFromFirestore,
  saveUserPlanToFirestore,
  getUserPlanFromFirestore
} from './core/chatEngine';
import { auth, db } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { UpgradeModal } from './components/UpgradeModal';
import { TerminalView } from './components/TerminalView';
import { DesktopView } from './components/DesktopView';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SavedPromptsModal } from './components/SavedPromptsModal';
import { StatusView } from './components/StatusView';
import { GuideView } from './components/GuideView';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { ConnectorsStudio } from './components/ConnectorsStudio';
import { YoutubeAnalyser } from './components/YoutubeAnalyser';
import { StoryGeneratorView } from './components/StoryGeneratorView';
import { PersonasDrawer } from './components/PersonasDrawer';
import { AuthButton } from './components/AuthButton';
import { Lock } from 'lucide-react';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getDefaultModel, getModelById, getTierById, routePromptToBestModel, isModelLockedForTier, NothingAiModel } from './core/modelsConfig';
import { getStoredSession, saveSession, loginWithProvider, UserSession } from './core/authEngine';
import { getStoredTheme, saveStoredTheme, ThemeId, THEMES } from './core/themeConfig';
import { HumorousUpgradeModal } from './components/HumorousUpgradeModal';
import { 
  getMonthlyTokenUsage, 
  addTokenUsage, 
  resetTokenUsage,
  enforceMonthlyTokenLimit, 
  estimateQueryTokens,
  getPrimeCustomCreditLimit 
} from './core/tokenUsageEngine';
import { getRandomHumorousMessage } from './core/tokenLimitConfig';
import { getPlanById } from './plans/quntxPlans';

export function App() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeConvId, setActiveConvIdState] = useState<string | null>(null);
  const [isReopenedChat, setIsReopenedChat] = useState<boolean>(true);
  const [user] = useAuthState(auth);

  // User session state
  const [session, setSession] = useState<UserSession | null>(() => {
    return getStoredSession();
  });

  const handleUpdateSession = (updatedSession: UserSession) => {
    setSession(updatedSession);
    saveSession(updatedSession);
  };

  // Current selected model & tier
  const [currentModelId, setCurrentModelId] = useState<string>(() => {
    const saved = localStorage.getItem('nothing-aiai_current_model_id');
    if (saved) {
      const found = getModelById(saved);
      if (found) return found.id;
    }
    return getDefaultModel().id;
  });

  const [currentTierId, setCurrentTierId] = useState<string>(() => {
    const saved = localStorage.getItem('nothing-aiai_current_tier_id');
    return saved || 'free';
  });

  const [usedCredits, setUsedCredits] = useState<number>(() => {
    const saved = localStorage.getItem('nothing-aiai_used_credits');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('nothing-ai_reduced_motion');
    return saved === 'true';
  });

  const [activeTheme, setActiveTheme] = useState<ThemeId>(getStoredTheme);

  const handleSelectTheme = (themeId: ThemeId) => {
    setActiveTheme(themeId);
    saveStoredTheme(themeId);
  };

  const activeTier = getTierById(currentTierId);
  const activePlan = getPlanById(currentTierId);
  const monthlyCredits = currentTierId === 'prime' ? getPrimeCustomCreditLimit() : activePlan.monthly_credits;
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);

  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [activeRoute, setActiveRoute] = useState<'chat' | 'status' | 'guide' | 'workspace' | 'connectors'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [autoRefine, setAutoRefine] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isDevMode, setIsDevMode] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; mimeType: string } | null>(null);
  const [dockedVideo, setDockedVideo] = useState<any | null>(null);
  const [isPersonasDrawerOpen, setIsPersonasDrawerOpen] = useState(false);

  // Focus Mode State
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);

  // Daily learning goals state
  const [dailyGoalType, setDailyGoalType] = useState<'tokens' | 'questions'>(() => {
    return (localStorage.getItem('nothing-ai-goal-type') as any) || 'questions';
  });
  const [dailyGoalTarget, setDailyGoalTarget] = useState<number>(() => {
    const saved = localStorage.getItem('nothing-ai-goal-target');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [dailyGoalProgress, setDailyGoalProgress] = useState<number>(() => {
    const saved = localStorage.getItem('nothing-ai-goal-progress');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleSetDailyGoal = useCallback((type: 'tokens' | 'questions', target: number) => {
    setDailyGoalType(type);
    setDailyGoalTarget(target);
    localStorage.setItem('nothing-ai-goal-type', type);
    localStorage.setItem('nothing-ai-goal-target', String(target));
  }, []);

  const updateDailyGoalProgress = useCallback((amount: number, type: 'questions' | 'tokens') => {
    setDailyGoalProgress((prev) => {
      const next = prev + amount;
      localStorage.setItem('nothing-ai-goal-progress', next.toString());
      return next;
    });
  }, []);

  // Daily reset check
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastGoalDate = localStorage.getItem('nothing-ai-goal-date');
    if (lastGoalDate !== todayStr) {
      localStorage.setItem('nothing-ai-goal-date', todayStr);
      setDailyGoalProgress(0);
      localStorage.setItem('nothing-ai-goal-progress', '0');
    }
  }, []);

  // Snippets state
  const [snippets, setSnippets] = useState<{ id: string; text: string; createdAt: number }[]>(() => {
    try {
      const saved = localStorage.getItem('nothing-ai-snippets');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const handleSaveSnippet = useCallback((textToSave: string) => {
    if (!textToSave.trim()) return;
    const newSnippet = {
      id: Math.random().toString(36).substring(2, 9),
      text: textToSave.trim(),
      createdAt: Date.now()
    };
    setSnippets((prev) => {
      const updated = [newSnippet, ...prev];
      localStorage.setItem('nothing-ai-snippets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('nothing-ai-snippets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Highlight Selection
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 1) {
        const text = selection.toString().trim();
        setSelectedText(text);
        
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionCoords({
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY - 40
          });
        } catch (_) {
          setSelectionCoords(null);
        }
      } else {
        // Delay resetting selection so the click on floating button can go through
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.toString().trim().length === 0) {
            setSelectedText('');
            setSelectionCoords(null);
          }
        }, 150);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  useEffect(() => {
    const handleOpenPersonas = () => setIsPersonasDrawerOpen(true);
    window.addEventListener('open-personas-drawer', handleOpenPersonas);
    return () => window.removeEventListener('open-personas-drawer', handleOpenPersonas);
  }, []);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      ctrl: true,
      key: 'k',
      action: () => {
        window.dispatchEvent(new CustomEvent('toggle-model-selector'));
      }
    },
    {
      ctrl: true,
      shift: true,
      key: 'n',
      action: () => {
        handleNewChat();
      }
    }
  ]);

  // Real-time listener for active conversation
  useEffect(() => {
    if (!user || !activeConvId) return;

    try {
      const convRef = doc(db, `users/${user.uid}/conversations/${activeConvId}`);
      const messagesRef = collection(db, `users/${user.uid}/conversations/${activeConvId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const messagesData = snapshot.docs.map(doc => doc.data() as ChatMessage);
          
          setConversations(prev => prev.map(conv => {
            if (conv.id === activeConvId) {
              // Only update if the messages actually changed to avoid re-render loops
              if (JSON.stringify(conv.messages) !== JSON.stringify(messagesData)) {
                return { ...conv, messages: messagesData };
              }
            }
            return conv;
          }));
        },
        (error) => {
          console.warn('Firestore subscription fallback (using local state):', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore initialization warning:', err);
    }
  }, [user, activeConvId]);
  const [isAskingForDevCode, setIsAskingForDevCode] = useState(false);

  // Modals & Drawers
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedPromptsOpen, setIsSavedPromptsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('nothing-ai_onboarding_completed') !== 'true';
  });

  // Initialize stored conversations on mount
  useEffect(() => {
    const loadData = async () => {
      let finalConvs: ChatConversation[] = [];
      let finalFolders: ChatFolder[] = [];
      
      if (user) {
        // Sync local to firestore if not done before for this user
        const hasSynced = localStorage.getItem(`nothing-ai_synced_${user.uid}`);
        if (!hasSynced) {
          await syncLocalToFirestore(user.uid);
          localStorage.setItem(`nothing-ai_synced_${user.uid}`, 'true');
        }

        // Sync user to Cloud SQL
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.error('Failed to sync user to Cloud SQL:', err);
        }

        // Load persisted plan from Firestore
        try {
          const persistedPlan = await getUserPlanFromFirestore(user.uid);
          if (persistedPlan && persistedPlan.planId) {
            setCurrentTierId(persistedPlan.planId);
            localStorage.setItem('nothing-aiai_current_tier_id', persistedPlan.planId);
            if (persistedPlan.usedCredits !== undefined) {
              setUsedCredits(persistedPlan.usedCredits);
              localStorage.setItem('nothing-aiai_used_credits', String(persistedPlan.usedCredits));
            }
            console.log(`[App] Loaded user plan from Firestore: ${persistedPlan.purchasedPlan} (${persistedPlan.planId})`);
          } else {
            // Save current plan to Firestore for new user
            const currentPlan = localStorage.getItem('nothing-aiai_current_tier_id') || 'free';
            await saveUserPlanToFirestore(user.uid, currentPlan);
          }
        } catch (err) {
          console.warn('Error loading user plan from Firestore:', err);
        }
        
        try {
          finalConvs = await getConversationsFromFirestore(user.uid);
        } catch (err) {
          console.error('Error loading conversations from Firestore:', err);
        }
        if (finalConvs.length === 0) {
          finalConvs = getStoredConversations();
        }

        try {
          finalFolders = await getFoldersFromFirestore(user.uid);
        } catch (err) {
          console.error('Error loading folders from Firestore:', err);
        }
        if (finalFolders.length === 0) {
          finalFolders = getStoredFolders();
        }
      } else {
        finalConvs = getStoredConversations();
        finalFolders = getStoredFolders();
      }

      if (finalConvs.length === 0) {
        const initial = createNewConversation(currentModelId as any, 2, 'Welcome to Nothing-Ai');
        finalConvs = [initial];
      }

      setConversations(finalConvs);
      setFolders(finalFolders);
      const activeId = getActiveConversationId() || finalConvs[0].id;
      setActiveConvIdState(activeId);
    };

    loadData();
  }, [user]);

  // Listen for plan updates across components or chat events in real-time
  useEffect(() => {
    const handlePlanUpdated = (e: any) => {
      if (e.detail?.planId) {
        setCurrentTierId(e.detail.planId);
        setUsedCredits(0);
      }
    };
    window.addEventListener('nothing-ai-plan-updated', handlePlanUpdated);
    return () => window.removeEventListener('nothing-ai-plan-updated', handlePlanUpdated);
  }, []);

  // Real-time Firestore synchronization for user's purchased plan
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, `users/${user.uid}`);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData && (userData.planId || userData.tierId)) {
            const savedPlan = userData.planId || userData.tierId;
            setCurrentTierId(savedPlan);
            localStorage.setItem('nothing-aiai_current_tier_id', savedPlan);
            if (userData.usedCredits !== undefined) {
              setUsedCredits(userData.usedCredits);
              localStorage.setItem('nothing-aiai_used_credits', String(userData.usedCredits));
            }
          }
        }
      },
      (error) => {
        console.warn('[App] User plan snapshot error:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Enforce unauthenticated user restrictions (free tier and free/basic model only)
  useEffect(() => {
    if (!user) {
      setCurrentTierId('free');
      const model = getModelById(currentModelId);
      if (model.tierId !== 'free' && model.tierId !== 'basic') {
        const defaultModel = getDefaultModel();
        setCurrentModelId(defaultModel.id);
      }
    }
  }, [user, currentModelId]);

  const handleCreateFolder = async (name: string) => {
    const newFolder: ChatFolder = {
      id: `folder_${Date.now()}`,
      name,
      createdAt: Date.now()
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    saveFolders(updated);
    if (user) {
      await saveFolderToFirestore(user.uid, newFolder);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const updated = folders.filter(f => f.id !== folderId);
    setFolders(updated);
    saveFolders(updated);
    if (user) {
      await deleteFolderFromFirestore(user.uid, folderId);
    }
    // Also, clear folderId of conversations in this folder
    const updatedConvs = conversations.map(c => {
      if (c.folderId === folderId) {
        const updatedConv = { ...c };
        delete updatedConv.folderId;
        if (user) {
          saveConversationToFirestore(user.uid, updatedConv);
        }
        return updatedConv;
      }
      return c;
    });
    setConversations(updatedConvs);
    saveConversations(updatedConvs);
  };

  const handleMoveToFolder = async (convId: string, folderId?: string) => {
    const updated = conversations.map(c => {
      if (c.id === convId) {
        const updatedConv = { ...c, folderId: folderId || undefined };
        if (!folderId) {
          delete updatedConv.folderId;
        }
        if (user) {
          saveConversationToFirestore(user.uid, updatedConv);
        }
        return updatedConv;
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
  };

  const handleDeleteMultipleConvs = async (ids: string[]) => {
    const updated = conversations.filter((c) => !ids.includes(c.id));
    setConversations(updated);
    saveConversations(updated);
    if (user) {
      for (const id of ids) {
        await deleteConversationFromFirestore(user.uid, id);
      }
    }

    if (activeConvId && ids.includes(activeConvId)) {
      if (updated.length > 0) {
        handleSelectConv(updated[0].id);
      } else {
        const newConv = createNewConversation(currentModelId as any, 2);
        setConversations([newConv]);
        setActiveConvIdState(newConv.id);
      }
    }
  };

  const handleMoveMultipleToFolder = async (ids: string[], folderId?: string) => {
    const updated = conversations.map((c) => {
      if (ids.includes(c.id)) {
        const updatedConv = { ...c, folderId: folderId || undefined };
        if (!folderId) {
          delete updatedConv.folderId;
        }
        if (user) {
          saveConversationToFirestore(user.uid, updatedConv);
        }
        return updatedConv;
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
  };

  const handleArchiveMultipleConvs = async (ids: string[], archived: boolean) => {
    const updated = conversations.map((c) => {
      if (ids.includes(c.id)) {
        const updatedConv = { ...c, archived };
        if (user) {
          saveConversationToFirestore(user.uid, updatedConv);
        }
        return updatedConv;
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
  };

  const handleToggleReducedMotion = () => {
    const next = !isReducedMotion;
    setIsReducedMotion(next);
    localStorage.setItem('nothing-ai_reduced_motion', next.toString());
  };

  const handleCloseOnboarding = (selectedUseCase: string) => {
    localStorage.setItem('nothing-ai_onboarding_completed', 'true');
    localStorage.setItem('nothing-ai_use_case', selectedUseCase);
    setIsOnboardingOpen(false);
  };

  const handleSelectConv = (id: string) => {
    setActiveConvIdState(id);
    setActiveConversationId(id);
    setIsReopenedChat(true);
    setActiveRoute('chat');
    setIsMobileOpen(false);
  };

  const handleNewChat = async () => {
    const newConv = createNewConversation(currentModelId as any, 2);
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    if (user) {
      await saveConversationToFirestore(user.uid, newConv);
    }
    setActiveConvIdState(newConv.id);
    setIsReopenedChat(false);
    setActiveRoute('chat');
    setIsMobileOpen(false);
    setViewMode('web');
  };

  const handleDeleteConv = async (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (user) {
      await deleteConversationFromFirestore(user.uid, id);
    }

    if (activeConvId === id) {
      if (updated.length > 0) {
        handleSelectConv(updated[0].id);
      } else {
        const newConv = createNewConversation(currentModelId as any, 2);
        setConversations([newConv]);
        setActiveConvIdState(newConv.id);
      }
    }
  };

  const handleTogglePin = async (id: string) => {
    const updated = conversations.map((c) => {
      if (c.id === id) {
        return { ...c, pinned: !c.pinned };
      }
      return c;
    });
    setConversations(updated);
    saveConversations(updated);
    if (user) {
      const targetConv = updated.find((c) => c.id === id);
      if (targetConv) {
        await saveConversationToFirestore(user.uid, targetConv);
      }
    }
  };

  // Humorous Upgrade Modal state
  const [humorousModal, setHumorousModal] = useState<{
    isOpen: boolean;
    reason: 'quota_exceeded' | 'tier_mismatch';
    funnyMessage: string;
    targetModel?: NothingAiModel | null;
  }>({
    isOpen: false,
    reason: 'quota_exceeded',
    funnyMessage: '',
    targetModel: null,
  });

  const handleSelectModel = (model: NothingAiModel) => {
    // Check if model is locked for current user tier
    const isLocked = isModelLockedForTier(model.tierId, currentTierId);
    if (isLocked) {
      let jokeCategory: 'tier_mismatch_ultra' | 'tier_mismatch_expert' | 'tier_mismatch_pro' | 'tier_mismatch_general' = 'tier_mismatch_general';
      if (model.tierId === 'ultra') jokeCategory = 'tier_mismatch_ultra';
      else if (model.tierId === 'expert') jokeCategory = 'tier_mismatch_expert';
      else if (model.tierId === 'pro') jokeCategory = 'tier_mismatch_pro';

      setHumorousModal({
        isOpen: true,
        reason: 'tier_mismatch',
        funnyMessage: getRandomHumorousMessage(jokeCategory),
        targetModel: model,
      });
      return;
    }

    setCurrentModelId(model.id);
    localStorage.setItem('nothing-aiai_current_model_id', model.id);
  };

  const handleSelectTier = async (tierId: string) => {
    setCurrentTierId(tierId);
    localStorage.setItem('nothing-aiai_current_tier_id', tierId);
    resetTokenUsage(); // Refill/reset token usage so user gets full credit quota on selected tier
    setUsedCredits(0);
    localStorage.setItem('nothing-aiai_used_credits', '0');
    try {
      await saveUserPlanToFirestore(user ? user.uid : 'default-user', tierId);
    } catch (err) {
      console.warn('[App] Could not persist plan to Firestore:', err);
    }
  };

  const handleClearChat = () => {
    const newConv = createNewConversation(currentModelId as any, 2, 'New Chat');
    setConversations([newConv]);
    setActiveConvIdState(newConv.id);
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike', reason?: string, comment?: string) => {
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConvId) {
          const updatedConv = {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, feedback, feedbackReason: reason, feedbackComment: comment }
                : msg
            ),
          };
          if (user) {
            saveConversationToFirestore(user.uid, updatedConv);
          }
          return updatedConv;
        }
        return conv;
      });
      saveConversations(updated);
      return updated;
    });
  };

  // Sync user to Cloud SQL on login
  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              displayName: user.displayName,
              photoURL: user.photoURL,
            }),
          });
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      };
      syncUser();
    }
  }, [user]);

  const handleSendMessage = async (
    userText: string, 
    files?: any[], 
    comparisonMode?: { enabled: boolean; modelAId: string; modelBId: string },
    baseMessages?: ChatMessage[],
    existingUserMsgId?: string,
    autoRefineParam?: boolean,
    imageSizeParam?: string
  ) => {
    if (userText.trim().toLowerCase() === '/sys-access-dev') {
      setIsAskingForDevCode(true);
      // Add system message asking for code
      const systemMsg: ChatMessage = {
        id: `msg_sys_${Date.now()}`,
        role: 'assistant',
        content: 'Code?',
        timestamp: Date.now(),
        personaId: currentModelId as any,
      };
      const currentConv = conversations.find((c) => c.id === activeConvId);
      if (currentConv) {
        const updatedList = conversations.map((c) => (c.id === currentConv.id ? { ...c, messages: [...c.messages, systemMsg] } : c));
        setConversations(updatedList);
      }
      return;
    }

    if (isAskingForDevCode) {
      if (userText.trim() === '28122712') {
        setIsDevMode(true);
        setIsAskingForDevCode(false);
        const systemMsg: ChatMessage = {
          id: `msg_sys_${Date.now()}`,
          role: 'assistant',
          content: 'Confirmed.',
          timestamp: Date.now(),
          personaId: currentModelId as any,
        };
        const currentConv = conversations.find((c) => c.id === activeConvId);
        if (currentConv) {
          const updatedList = conversations.map((c) => (c.id === currentConv.id ? { ...c, messages: [...c.messages, systemMsg] } : c));
          setConversations(updatedList);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: 'Access denied.',
          timestamp: Date.now(),
          personaId: currentModelId as any,
        };
        const currentConv = conversations.find((c) => c.id === activeConvId);
        if (currentConv) {
          const updatedList = conversations.map((c) => (c.id === currentConv.id ? { ...c, messages: [...c.messages, errorMsg] } : c));
          setConversations(updatedList);
        }
        setIsAskingForDevCode(false);
      }
      return;
    }

    if (remainingCredits <= 0) {
      setIsUpgradeModalOpen(true);
      return;
    }

    let selectedModel = getModelById(currentModelId, currentTierId);

    // Check if current tier limit is exceeded BEFORE sending
    enforceMonthlyTokenLimit(currentTierId);

    let autoRouteInfo: { selectedModel: NothingAiModel; reason: string } | null = null;

    if (selectedModel.id === 'auto') {
      autoRouteInfo = routePromptToBestModel(userText);
      selectedModel = autoRouteInfo.selectedModel;
    }

    const startTime = performance.now();

    let currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) {
      currentConv = createNewConversation(selectedModel.id as any, 2);
      setConversations([currentConv, ...conversations]);
      setActiveConvIdState(currentConv.id);
    }

    const userMsg: ChatMessage = {
      id: existingUserMsgId || `msg_user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      personaId: selectedModel.id as any,
      files: files,
    };

    let updatedTitle = currentConv.title;
    if (currentConv.messages.length <= 1) {
      updatedTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
    }

    let updatedMessages = baseMessages ? [...baseMessages] : [...currentConv.messages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.startsWith('**Error**')) {
        updatedMessages.pop();
    }

    updatedMessages.push(userMsg);

    // Update Daily Goals questions tracker
    if (dailyGoalType === 'questions') {
      updateDailyGoalProgress(1, 'questions');
    }
    
    const tempConv: ChatConversation = {
      ...currentConv,
      title: updatedTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    const updatedList = conversations.map((c) => (c.id === tempConv.id ? tempConv : c));
    setConversations(updatedList);
    saveConversations(updatedList);
    setIsLoading(true);

    try {
      if (comparisonMode?.enabled) {
        const modelA = getModelById(comparisonMode.modelAId, currentTierId);
        const modelB = getModelById(comparisonMode.modelBId, currentTierId);

        const startA = performance.now();
        const idToken = user ? await user.getIdToken() : undefined;
        const promiseA = sendMessageToAI(userText, updatedMessages, modelA.id as any, 2, enableWebSearch, autoRefineParam, imageSizeParam, idToken)
          .then((res) => ({ res, time: Math.round(performance.now() - startA) }));

        const startB = performance.now();
        const promiseB = sendMessageToAI(userText, updatedMessages, modelB.id as any, 2, enableWebSearch, autoRefineParam, imageSizeParam, idToken)
          .then((res) => ({ res, time: Math.round(performance.now() - startB) }));

        const [settledA, settledB] = await Promise.all([promiseA, promiseB]);

        const tokensAdded = (settledA.res.tokensUsed || 180) + (settledB.res.tokensUsed || 180);
        setUsedCredits((prev) => {
          const next = prev + tokensAdded;
          localStorage.setItem('nothing-aiai_used_credits', next.toString());
          return next;
        });

        const assistantMsg: ChatMessage = {
          id: `msg_ai_cmp_${Date.now()}`,
          role: 'assistant',
          content: `Side-by-Side Model Comparison: ${modelA.displayName} vs ${modelB.displayName}`,
          timestamp: Date.now(),
          personaId: modelA.id as any,
          comparison: {
            modelA: {
              modelId: modelA.id,
              modelName: modelA.displayName,
              content: settledA.res.content,
              reasoningContent: settledA.res.reasoningContent,
              tokensUsed: settledA.res.tokensUsed || 180,
              executionTimeMs: settledA.time,
              webSources: settledA.res.webSources,
              webSearchUsed: settledA.res.webSearchUsed,
            },
            modelB: {
              modelId: modelB.id,
              modelName: modelB.displayName,
              content: settledB.res.content,
              reasoningContent: settledB.res.reasoningContent,
              tokensUsed: settledB.res.tokensUsed || 180,
              executionTimeMs: settledB.time,
              webSources: settledB.res.webSources,
              webSearchUsed: settledB.res.webSearchUsed,
            },
          },
        };

        const finalConv: ChatConversation = {
          ...tempConv,
          updatedAt: Date.now(),
          messages: [...updatedMessages, assistantMsg],
        };

        const finalUpdatedList = conversations.map((c) => (c.id === finalConv.id ? finalConv : c));
        setConversations(finalUpdatedList);
        saveConversations(finalUpdatedList);
        if (user) {
          await saveConversationToFirestore(user.uid, finalConv);
        }
        setIsLoading(false);
        return;
      }

      const idToken = user ? await user.getIdToken() : undefined;
      const result = await sendMessageToAI(
        userText,
        updatedMessages,
        selectedModel.id as any,
        2,
        enableWebSearch,
        autoRefineParam,
        imageSizeParam,
        idToken
      );

      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      const tokensAdded = result.tokensUsed || 180;
      addTokenUsage(tokensAdded);

      // Update Daily Goals tokens tracker
      if (dailyGoalType === 'tokens') {
        updateDailyGoalProgress(tokensAdded, 'tokens');
      }
      
      setUsedCredits((prev) => {
        const next = prev + tokensAdded;
        localStorage.setItem('nothing-aiai_used_credits', next.toString());
        return next;
      });

      // Post-response limit enforcement
      enforceMonthlyTokenLimit(currentTierId);

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        personaId: selectedModel.id as any,
        reasoningContent: result.reasoningContent,
        tokensUsed: result.tokensUsed,
        webSources: result.webSources,
        webSearchUsed: result.webSearchUsed,
        autoRoutedModel: autoRouteInfo ? selectedModel.displayName : undefined,
        autoRouteReason: autoRouteInfo ? autoRouteInfo.reason : undefined,
        executionTimeMs,
        videoData: result.videoData,
        imageData: result.imageData,
        audioData: result.audioData,
      };

      const finalConv: ChatConversation = {
        ...tempConv,
        updatedAt: Date.now(),
        messages: [...updatedMessages, assistantMsg],
      };

      const finalList = conversations.map((c) => (c.id === finalConv.id ? finalConv : c));
      setConversations(finalList);
      saveConversations(finalList);
      if (user) {
        await saveConversationToFirestore(user.uid, finalConv);
      }
    } catch (err: any) {
      const isRateLimited = err.message?.includes('Rate limit') || err.message?.includes('429');
      if (!isRateLimited) {
        console.error('Failed to get response', err);
      }
      
      const errorMessage = isRateLimited 
        ? 'You have reached the API usage limit. Please try again in a few minutes or upgrade your plan to increase your quota.' 
        : (err.message || 'Failed to process request. Please try again.');
      
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `**Error**: ${errorMessage}`,
        timestamp: Date.now(),
        personaId: selectedModel.id as any,
      };
      
      const finalConv: ChatConversation = {
        ...tempConv,
        updatedAt: Date.now(),
        messages: [...updatedMessages, errorMsg],
      };

      const finalList = conversations.map((c) => (c.id === finalConv.id ? finalConv : c));
      setConversations(finalList);
      saveConversations(finalList);
      if (user) {
        await saveConversationToFirestore(user.uid, finalConv);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;
    const msgIndex = currentConv.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const baseMessages = currentConv.messages.slice(0, msgIndex);
    await handleSendMessage(newContent, undefined, undefined, baseMessages);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;
    const updatedMessages = currentConv.messages.filter((m) => m.id !== messageId);
    const updatedConv: ChatConversation = {
      ...currentConv,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };
    const finalList = conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c));
    setConversations(finalList);
    saveConversations(finalList);
    if (user) {
      await saveConversationToFirestore(user.uid, updatedConv);
    }
  };

  const handleRegenerateMessage = async (targetMessageId: string) => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;
    const msgIndex = currentConv.messages.findIndex((m) => m.id === targetMessageId);
    if (msgIndex === -1) return;

    let userMsgIndex = msgIndex;
    while (userMsgIndex >= 0 && currentConv.messages[userMsgIndex].role !== 'user') {
      userMsgIndex--;
    }
    if (userMsgIndex < 0) return;

    const userMsg = currentConv.messages[userMsgIndex];
    const baseMessages = currentConv.messages.slice(0, userMsgIndex);
    
    // Trigger regeneration using the existing user message ID and content
    await handleSendMessage(userMsg.content, userMsg.files, undefined, baseMessages, userMsg.id);
  };

  const handleRegenerateLast = () => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv || currentConv.messages.length === 0) return;
    const lastMsg = currentConv.messages[currentConv.messages.length - 1];
    if (lastMsg.role === 'assistant') {
      handleRegenerateMessage(lastMsg.id);
    } else {
      handleSendMessage(lastMsg.content, lastMsg.files);
    }
  };

  const handleExportCurrentChat = () => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;

    const currentModel = getModelById(currentModelId);

    let md = `# ${currentConv.title}\n\n`;
    md += `*Engine:* Nothing-Ai — Nothing\n`;
    md += `*Model:* ${currentModel.displayName}\n`;
    md += `*Tier:* ${getTierById(currentTierId).name}\n`;
    md += `*Export Date:* ${new Date().toLocaleString()}\n\n---\n\n`;

    currentConv.messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'User' : currentModel.displayName} (${new Date(m.timestamp).toLocaleTimeString()})\n\n`;
      md += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nothing-ai-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    localStorage.clear();
    const newConv = createNewConversation(currentModelId, 2, 'New Chat');
    setConversations([newConv]);
    setActiveConvIdState(newConv.id);
    setIsSettingsOpen(false);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const theme = THEMES[activeTheme] || THEMES['silk'];

  return (
    <div className={`h-[100dvh] w-full max-w-full flex overflow-hidden ${theme.bgCanvas} ${theme.textMain}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        onDeleteConv={handleDeleteConv}
        onTogglePin={handleTogglePin}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveToFolder={handleMoveToFolder}
        onDeleteMultipleConvs={handleDeleteMultipleConvs}
        onMoveMultipleToFolder={handleMoveMultipleToFolder}
        onArchiveMultipleConvs={handleArchiveMultipleConvs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPromptsModal={() => setIsSavedPromptsOpen(true)}
        onOpenStatusView={() => setActiveRoute('status')}
        onOpenGuideView={() => setActiveRoute('guide')}
        onOpenWorkspace={() => setActiveRoute('workspace')}
        onOpenConnectors={() => setActiveRoute('connectors')}
        viewMode={viewMode}
        onChangeViewMode={(m) => {
          setViewMode(m);
          setActiveRoute('chat');
        }}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        userRole={session?.role || 'admin'} // Admin role enabled for full functionality testing
        isReducedMotion={isReducedMotion}
        isCollapsed={isSidebarCollapsed || isFocusModeActive}
        activeTheme={activeTheme}

      />

      {/* Main Canvas Area */}
      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${theme.bgCanvas}`}>
        <Navbar
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentPlan={activeTier.name}
          currentTierId={currentTierId}
          currentModelId={currentModelId}
          onSelectModel={handleSelectModel}
          usedCredits={usedCredits}
          monthlyCredits={monthlyCredits}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          activeTheme={activeTheme}
          onFocusModeToggle={setIsFocusModeActive}
          onOpenConnectors={() => setActiveRoute('connectors')}
          session={session}
        />

        {/* View Routing */}
        {activeRoute === 'status' ? (
          <StatusView />
        ) : activeRoute === 'guide' ? (
          <GuideView onBackToChat={() => setActiveRoute('chat')} />
        ) : activeRoute === 'workspace' ? (
          !user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-6">
              <div className="p-4 bg-amber-500/10 rounded-full text-amber-400 border border-amber-500/20">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Workspace Hub Gated</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your personalized Workspace Dashboard contains saved study snippets, AI Quizzes, and study targets. Sign in to synchronize your progress and customize questions.
                </p>
              </div>
              <div className="pt-2">
                <AuthButton session={session} />
              </div>
            </div>
          ) : (
            <WorkspaceDashboard 
              onClose={() => setActiveRoute('chat')} 
              onPreviewFile={(file) => {
                setPreviewFile(file);
                setActiveRoute('chat');
              }}
              activeTheme={activeTheme}
              conversations={conversations}
            />
          )
        ) : activeRoute === 'connectors' ? (
          <ConnectorsStudio 
            onClose={() => setActiveRoute('chat')} 
            activeTheme={activeTheme}
            onSelectTheme={handleSelectTheme}
          />
        ) : (
          <>
            {viewMode === 'web' && (
              <ChatView
                messages={activeConv?.messages || []}
                currentModelId={currentModelId}
                onSelectModel={handleSelectModel}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onRegenerateLast={handleRegenerateLast}
                onRegenerateMessage={handleRegenerateMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onFeedback={handleFeedback}
                searchQuery=""
                enableWebSearch={enableWebSearch}
                onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
                userTierId={currentTierId}
                usedCredits={usedCredits}
                monthlyCredits={monthlyCredits}
                onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
                onOpenPromptsModal={() => setIsSavedPromptsOpen(true)}
                isReducedMotion={isReducedMotion}
                activeTheme={activeTheme}
                onSelectTheme={handleSelectTheme}
                onOpenConnectors={() => setActiveRoute('connectors')}
                onOpenWorkspace={() => setActiveRoute('workspace')}
                previewFile={previewFile}
                onClosePreview={() => setPreviewFile(null)}
                isReopenedChat={isReopenedChat}
                dockedVideo={dockedVideo}
                onDockVideo={setDockedVideo}
                onCloseDock={() => setDockedVideo(null)}
                onSaveSnippet={handleSaveSnippet}
              />
            )}

            {viewMode === 'cli' && (
              <TerminalView activePersonaId="wexel" upgradeStage={2} activeTheme={activeTheme} />
            )}

            {viewMode === 'desktop' && (
              <DesktopView activeTheme={activeTheme} />
            )}

            {viewMode === 'story' && (
              <StoryGeneratorView activeTheme={activeTheme} userTierId={currentTierId} onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)} />
            )}
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      <PersonasDrawer
        isOpen={isPersonasDrawerOpen}
        onClose={() => setIsPersonasDrawerOpen(false)}
        activePersonaId="wexel"
        onSelectPersona={(pId) => {
          handleSelectModel(pId as any);
        }}
        onSelectPrompt={(pText) => {
          handleSendMessage(pText);
        }}
        activeTheme={activeTheme}
      />

      <HumorousUpgradeModal
        isOpen={humorousModal.isOpen}
        onClose={() => setHumorousModal((prev) => ({ ...prev, isOpen: false }))}
        onOpenFullUpgradeModal={() => {
          setHumorousModal((prev) => ({ ...prev, isOpen: false }));
          setIsUpgradeModalOpen(true);
        }}
        targetModel={humorousModal.targetModel}
        currentTierId={currentTierId}
        funnyMessage={humorousModal.funnyMessage}
        reason={humorousModal.reason}
        usedTokens={getMonthlyTokenUsage().usedTokens}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      <SavedPromptsModal
        isOpen={isSavedPromptsOpen}
        onClose={() => setIsSavedPromptsOpen(false)}
        onSelectPrompt={(pText) => {
          handleSendMessage(pText);
        }}
        activeTheme={activeTheme}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTierId={currentTierId}
        onSelectTier={handleSelectTier}
        creditBalance={remainingCredits}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearAllData={handleClearAllData}
        onExportAllData={handleExportCurrentChat}
        currentConversation={activeConv}
        currentTierId={currentTierId}
        onSelectTier={handleSelectTier}
        currentModelId={currentModelId}
        onSelectModel={handleSelectModel}
        creditBalance={remainingCredits}
        session={session}
        onUpdateSession={handleUpdateSession}
        onOpenStatusView={() => setActiveRoute('status')}
        onOpenGuideView={() => setActiveRoute('guide')}
        isReducedMotion={isReducedMotion}
        onToggleReducedMotion={handleToggleReducedMotion}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Floating Save Snippet Action Badge */}
      <AnimatePresence>
        {selectionCoords && selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-[9999] pointer-events-auto bg-zinc-900 border border-amber-500/40 text-amber-200 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer hover:bg-zinc-800 transition duration-150 text-xs font-bold"
            style={{
              left: `${selectionCoords.x}px`,
              top: `${selectionCoords.y}px`,
              transform: 'translateX(-50%)',
            }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveSnippet(selectedText);
              // Clear selection
              window.getSelection()?.removeAllRanges();
              setSelectedText('');
              setSelectionCoords(null);
            }}
          >
            <span>Save Study Snippet 📌</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
