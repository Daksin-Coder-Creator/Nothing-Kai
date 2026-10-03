import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Tooltip } from './ui/Tooltip';
import { 
  Palette,
  Sparkles,
  Book,
  User,
  Image as ImageIcon,
  Video,
  Sliders,
  BrainCircuit,
  Code,
  Globe,
  Target,
  FileText,
  X,
  Search,
  Check,
  Copy,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { NOTHING_AI_PERSONAS } from '../core/personas';
import { ChatMessage, PersonaId } from '../types';
import { 
  NothingAiModel, 
  ModelProvider, 
  getModelById,
  getModelsByProvider
} from '../core/modelsConfig';
import { UnifiedModelSelector } from './UnifiedModelSelector';
import { TokenUsageBanner } from './TokenUsageBanner';
import { getMonthlyTokenUsage } from '../core/tokenUsageEngine';
import { THEMES, ThemeId } from '../core/themeConfig';
import { ChatInput } from './chat/ChatInput';
import { EmptyChatState } from './chat/EmptyChatState';
import { MessageList } from './chat/MessageList';
import { QuizData } from './QuizRenderer';
import { FilePreview } from './FilePreview';
import { YoutubeAnalyser } from './YoutubeAnalyser';

interface ChatViewProps {
  messages: ChatMessage[];
  currentModelId: string;
  onSelectModel: (model: NothingAiModel) => void;
  isLoading: boolean;
  onSendMessage: (
    text: string, 
    files?: any[], 
    comparisonMode?: { enabled: boolean; modelAId: string; modelBId: string },
    baseMessages?: ChatMessage[],
    existingUserMsgId?: string,
    autoRefine?: boolean,
    imageSize?: string
  ) => void;
  onRegenerateLast: () => void;
  onRegenerateMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike', reason?: string, comment?: string) => void;
  searchQuery: string;
  enableWebSearch?: boolean;
  onToggleWebSearch?: () => void;
  userTierId?: string;
  usedCredits?: number;
  monthlyCredits?: number;
  onOpenUpgradeModal?: () => void;
  onOpenPromptsModal?: () => void;
  isReducedMotion?: boolean;
  activeTheme?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
  previewFile?: { id: string; name: string; mimeType: string } | null;
  onClosePreview?: () => void;
  isReopenedChat?: boolean;
  dockedVideo?: any;
  onDockVideo?: (video: any) => void;
  onCloseDock?: () => void;
  onSaveSnippet?: (text: string) => void;
  onOpenConnectors?: () => void;
  onOpenWorkspace?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentModelId,
  onSelectModel,
  onSendMessage,
  isLoading,
  onRegenerateLast,
  onRegenerateMessage,
  onEditMessage,
  onDeleteMessage,
  onFeedback,
  searchQuery,
  enableWebSearch = true,
  onToggleWebSearch,
  userTierId = 'basic',
  usedCredits = 0,
  monthlyCredits = 15000,
  onOpenUpgradeModal,
  onOpenPromptsModal,
  isReducedMotion = false,
  activeTheme,
  onSelectTheme,
  previewFile,
  onClosePreview,
  isReopenedChat = false,
  dockedVideo,
  onDockVideo,
  onCloseDock,
  onSaveSnippet,
  onOpenConnectors,
  onOpenWorkspace,
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>('gemini');
  const [behaviorMode, setBehaviorMode] = useState<'fast' | 'balanced' | 'detailed'>('balanced');
  const [creativity, setCreativity] = useState<'creative' | 'precise'>('precise');
  const [isVibeCodingMode, setIsVibeCodingMode] = useState(false);
  const [problemSolvingMode, setProblemSolvingMode] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [autoRefine, setAutoRefine] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; base64: string }[]>([]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('1K');

  const [showVideoPopover, setShowVideoPopover] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoPromptInput, setVideoPromptInput] = useState('');

  const [showQuizPopover, setShowQuizPopover] = useState(false);
  const [quizTopicInput, setQuizTopicInput] = useState('');
  const [quizCount, setQuizCount] = useState('5');
  const [quizTimer, setQuizTimer] = useState('60s');
  const [quizDifficulty, setQuizDifficulty] = useState('Intermediate');
  const [quizEvalMode, setQuizEvalMode] = useState('exam');

  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [isToolbarSpeaking, setIsToolbarSpeaking] = useState(false);

  const handleListenToSummary = () => {
    if (isToolbarSpeaking) {
      window.speechSynthesis.cancel();
      setIsToolbarSpeaking(false);
    } else {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistantMessage) {
        alert('No AI response available to read aloud.');
        return;
      }

      window.speechSynthesis.cancel();
      const plainText = lastAssistantMessage.content
        .replace(/```[\s\S]*?```/g, '[Code block]')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_\[\]\(\)]/g, '');

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => setIsToolbarSpeaking(false);
      utterance.onerror = () => setIsToolbarSpeaking(false);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
      setIsToolbarSpeaking(true);
    }
  };

  const handleAutoSummarize = () => {
    setIsSummarizing(true);
    setShowSummaryModal(true);
    setTimeout(() => {
      const userMsgs = messages.filter(m => m.role === 'user');
      const assistantMsgs = messages.filter(m => m.role === 'assistant');
      const topic = userMsgs[0]?.content.slice(0, 50) || 'General Session';
      
      const summary = `### 📚 Study Thread Summary: "${topic}"\n\n` +
        `**Key Questions & Prompts:**\n` +
        userMsgs.map((m, i) => `- **Q${i+1}:** ${m.content.slice(0, 80)}...`).join('\n') +
        `\n\n**Core Insights & Explanations:**\n` +
        assistantMsgs.slice(-3).map((m, i) => `- ${m.content.replace(/```[\s\S]*?```/g, '[Code Snippet]').slice(0, 100)}...`).join('\n') +
        `\n\n*Generated by NothingAI Study Engine.*`;
      
      setSummaryText(summary);
      setIsSummarizing(false);
    }, 600);
  };

  const allUserHistory = messages.filter(m => m.role === 'user');
  const matchingHistory = allUserHistory.filter(m => 
    historyQuery ? m.content.toLowerCase().includes(historyQuery.toLowerCase()) : true
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = getModelById(currentModelId, userTierId);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);
  const hasMessages = messages.length > 0;

  const filteredMessages = messages.filter((m) =>
    searchQuery ? m.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const lastScrollTimeRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (!isAtBottom) {
      setIsUserScrolledUp(true);
    } else {
      setIsUserScrolledUp(false);
    }
  };

  useEffect(() => {
    if (!isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleTypingScroll = () => {
      if (!isUserScrolledUp) {
        const now = Date.now();
        if (now - lastScrollTimeRef.current > 150) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          lastScrollTimeRef.current = now;
        }
      }
    };

    window.addEventListener('typing-scroll', handleTypingScroll);
    return () => {
      window.removeEventListener('typing-scroll', handleTypingScroll);
    };
  }, [isUserScrolledUp]);

  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [modelAId, setModelAId] = useState<string>(currentModelId);
  const [modelBId, setModelBId] = useState<string>('nothing-ai-3.1-pro');

  useEffect(() => {
    setModelAId(currentModelId);
  }, [currentModelId]);

  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeAgent, setActiveAgent] = useState('Design');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [generationMode, setGenerationMode] = useState<'text' | 'image' | 'video' | 'audio'>('text');

  const [voiceModeEnabled, setVoiceModeEnabled] = useState(() => {
    return localStorage.getItem('nothing-ai_voice_mode') === 'true';
  });

  const handleToggleVoiceMode = () => {
    const next = !voiceModeEnabled;
    setVoiceModeEnabled(next);
    localStorage.setItem('nothing-ai_voice_mode', next.toString());
    if (!next) {
      window.speechSynthesis.cancel();
    }
  };

  const prevIsLoading = useRef(isLoading);

  useEffect(() => {
    if (voiceModeEnabled && !isLoading && prevIsLoading.current && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        window.speechSynthesis.cancel();
        
        const plainText = lastMsg.content
          .replace(/```[\s\S]*?```/g, '[Code block]')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/[*#_\[\]\(\)]/g, '');

        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
    prevIsLoading.current = isLoading;
  }, [messages, isLoading, voiceModeEnabled]);

  const recognitionRef = useRef<any>(null);

  const suggestedPrompts = useMemo(() => {
    // 1. Try to get from Persona
    const persona = NOTHING_AI_PERSONAS[currentModelId as PersonaId];
    if (persona && persona.samplePrompts) {
      return persona.samplePrompts.slice(0, 3);
    }

    // 2. Fallback based on model purpose/name if not a specific persona
    const model = getModelById(currentModelId, userTierId);
    const purpose = (model.purpose || '').toLowerCase();
    const id = model.id.toLowerCase();

    if (purpose.includes('code') || id.includes('coding') || id.includes('sonnet') || id.includes('coder')) {
      return [
        { label: 'Debug Snippet', prompt: 'Help me debug this code snippet and fix any potential issues:\n\n```\n\n```' },
        { label: 'Explain Logic', prompt: 'Can you explain the logic behind this function step-by-step?' },
        { label: 'Refactor Code', prompt: 'Suggest some improvements to refactor this code for better performance and readability.' }
      ];
    }

    if (purpose.includes('image') || id.includes('dalle') || id.includes('flux') || id.includes('midjourney')) {
      return [
        { label: 'Artistic Photo', prompt: 'Generate a hyper-realistic cinematic photo of a futuristic city with neon lights and rainy streets.' },
        { label: 'Minimalist Icon', prompt: 'Create a minimalist, clean vector icon set for a high-end productivity app.' },
        { label: 'Abstract 3D', prompt: 'Render a complex 3D abstract sculpture made of glass and liquid metal in a desert setting.' }
      ];
    }

    if (purpose.includes('video') || id.includes('runway') || id.includes('luma')) {
      return [
        { label: 'Cinematic B-Roll', prompt: 'Generate a 5-second cinematic aerial shot of a drone flying over a misty pine forest at sunrise.' },
        { label: 'Animated Portrait', prompt: 'Create an animated portrait of a character with subtle facial expressions and flowing hair.' },
        { label: 'Product Showcase', prompt: 'Generate a slow-motion rotation shot of a sleek high-tech gadget on a dark reflective surface.' }
      ];
    }

    // 3. Default General Prompts
    return [];
  }, [currentModelId, userTierId]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handlePromptEnhance = () => {
    if (!inputText.trim()) {
      setInputText('Help me understand why users are dropping off during onboarding');
    } else {
      setInputText(`Refine and optimize this prompt for maximum precision:\n\n${inputText}\n\nPlease analyze with step-by-step reasoning, clear bullet points, and actionable deliverables.`);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setTimeout(adjustTextareaHeight, 0);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const initialText = inputText ? inputText.trim() + ' ' : '';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInputText(initialText + transcript);
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
            setTimeout(adjustTextareaHeight, 0);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          recognitionRef.current = null;
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            alert('Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        setIsListening(false);
        recognitionRef.current = null;
      }
    } else {
      alert('Voice-to-text (Speech Recognition) is not supported by this browser. Please use Google Chrome, Apple Safari, or Microsoft Edge.');
    }
  };

  const handleChipClick = (label: string, promptText: string) => {
    setInputText(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setTimeout(adjustTextareaHeight, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const base64String = event.target.result as string;
          setUploadedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: file.type,
              base64: base64String,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && uploadedFiles.length === 0) return;
    if (isLoading) return;

    let fullPrompt = inputText.trim();
    if (uploadedFiles.length > 0) {
      const fileRefs = uploadedFiles.map((f) => `[Attachment: ${f.name} (${f.size})]`).join(' ');
      fullPrompt = `${fileRefs}\n${fullPrompt}`;
    }

    if (isVibeCodingMode) {
      fullPrompt = `[Vibe Coding Mode Enabled]\n${fullPrompt}`;
    }
    if (problemSolvingMode) {
      fullPrompt = `[Problem-Solving Mode Enabled — Step-by-Step Logic with LaTeX]\n${fullPrompt}`;
    }
    if (deepResearchMode) {
      fullPrompt = `[Deep Research Mode Enabled — Comprehensive Analysis]\n${fullPrompt}`;
    }

    if (generationMode === 'image' && !fullPrompt.toLowerCase().includes('/image')) {
      fullPrompt = `/image ${fullPrompt}`;
    } else if (generationMode === 'video' && !fullPrompt.toLowerCase().includes('/video')) {
      fullPrompt = `/video ${fullPrompt}`;
    } else if (generationMode === 'audio' && !fullPrompt.toLowerCase().includes('/audio') && !fullPrompt.toLowerCase().includes('/music')) {
      fullPrompt = `/audio ${fullPrompt}`;
    }
    
    if (fullPrompt.toLowerCase().includes('/image') || fullPrompt.toLowerCase().includes('/video') || fullPrompt.toLowerCase().includes('/audio') || fullPrompt.toLowerCase().includes('/music')) {
       fullPrompt = `[Aspect: ${aspectRatio}] [Size: ${imageSize}]\n${fullPrompt}`;
    }

    onSendMessage(
      fullPrompt, 
      uploadedFiles, 
      isComparisonMode ? { enabled: true, modelAId, modelBId } : undefined,
      undefined,
      undefined,
      autoRefine,
      imageSize
    );
    setIsUserScrolledUp(false);
    setInputText('');
    setUploadedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const providerSubModels = getModelsByProvider(selectedProvider);

  // Parse latest message for code/sandbox preview or quizzes
  const lastMsg = messages[messages.length - 1];
  const isLastMsgAssistant = lastMsg?.role === 'assistant';

  // Parse Quiz data from message content
  let parsedQuiz: QuizData | null = null;
  const quizRegex = /```quiz\n([\s\S]*?)```/i;
  const quizMatch = lastMsg?.content ? lastMsg.content.match(quizRegex) : null;
  if (quizMatch) {
    try {
      parsedQuiz = JSON.parse(quizMatch[1]);
    } catch (e) {
      console.error('Failed to parse quiz json', e);
    }
  }

  // Helper to generate 3 relevant suggested follow-up prompts
  const getSuggestedFollowUps = (assistantText: string, userText: string = ''): string[] => {
    const userLower = userText.trim().toLowerCase();
    
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

    const defaultFollowUps = [
      'Can you explain this further with a practical example?',
      'What are the key pros and cons of this approach?',
      'Summarize this into 3 concise bullet points.',
      'How does this relate to industry best practices?',
      'Can you provide a step-by-step implementation guide?',
      'What are the security implications of this?',
      'Is there a more efficient way to achieve this?',
      'Can you translate this into a simpler analogy?',
      'What are the common pitfalls to avoid here?',
      'How would a professional handle this situation?',
      'Could you provide a detailed checklist for this?',
      'What are the long-term consequences of this decision?'
    ];

    if (!userLower || userLower.length < 5) {
      return shuffle(defaultFollowUps).slice(0, 3);
    }

    // Extract a topic from the user question for personalized follow-ups
    let topic = userText.trim().replace(/^(what is|who is|how to|can you|could you|explain|tell me about|what are|define)\s+/i, '');
    if (topic.endsWith('?')) topic = topic.slice(0, -1);
    
    let specificFollowUps: string[] = [];

    if (userLower.includes('code') || userLower.includes('function') || userLower.includes('bug') || userLower.includes('programming') || userLower.includes('script')) {
      specificFollowUps = [
        'Can you explain this code step-by-step with comments?',
        'How can I optimize the performance of this approach?',
        'Can you write unit tests for this implementation?',
        'What are the most common errors with this pattern?',
        'How would I handle edge cases in this code?',
        'Can you rewrite this using a different library?',
        'Is there a more modern way to implement this?',
        'How do I debug this if it fails?',
        'Could you add error handling to this snippet?'
      ];
    } else if (userLower.includes('compare') || userLower.includes('difference') || userLower.includes('vs')) {
      specificFollowUps = [
        'Could you provide a tabular comparison?',
        'Which option is generally recommended for beginners?',
        'What are the main drawbacks of each approach?',
        'How do these scale in a production environment?',
        'Are there any hidden costs associated with either?',
        'Can you rank these based on performance and ease of use?',
        'What is the industry standard choice here?'
      ];
    } else if (userLower.includes('quiz') || userLower.includes('question') || userLower.includes('test') || userLower.includes('exam')) {
      specificFollowUps = [
        'Give me 3 more practice questions on this topic.',
        'Explain the detailed reasoning behind the correct answers.',
        'Summarize key formulas and memory concepts.',
        'What are the most difficult parts of this topic?',
        'Can you create a flashcard deck for this?',
        'How should I prepare for an exam on this?',
        'What are the high-yield subtopics here?'
      ];
    } else if (userLower.includes('write') || userLower.includes('essay') || userLower.includes('article') || userLower.includes('content')) {
      specificFollowUps = [
        'Can you refine the tone of this content to be more professional?',
        'Could you expand on the second point with more detail?',
        'Can you generate a catchy title for this?',
        'Help me write an introductory paragraph for this.',
        'What are some alternative ways to phrase the conclusion?',
        'Can you check this for grammatical flow?'
      ];
    } else if (topic.length > 2 && topic.length < 40) {
      specificFollowUps = [
        `Can you give me a real-world example of ${topic}?`,
        `What are the most common misconceptions about ${topic}?`,
        `Can you summarize the core principles of ${topic}?`,
        `How has ${topic} evolved over the last decade?`,
        `What are the future trends related to ${topic}?`,
        `Who are the key figures associated with ${topic}?`,
        `Are there any controversial aspects of ${topic}?`
      ];
    }

    const pool = specificFollowUps.length > 0 ? [...specificFollowUps, ...defaultFollowUps.slice(0, 3)] : defaultFollowUps;
    return shuffle(pool).slice(0, 3);
  };

  const initialPromptPool: any[] = [];

  const [suggestionSeed, setSuggestionSeed] = useState(Date.now());
  const randomizedPrompts = useMemo(() => {
    return [...initialPromptPool].sort(() => Math.random() - 0.5).slice(0, 4);
  }, [suggestionSeed]);

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const suggestedFollowUps = lastMsg && lastMsg.role === 'assistant'
    ? getSuggestedFollowUps(lastMsg.content, lastUserMsg?.content || '')
    : [];

  return (
    <div className={`flex flex-col items-center h-[calc(100dvh-56px)] w-full ${theme.bgCanvas} ${theme.fontClass} ${theme.textMain} overflow-hidden transition-colors duration-500 relative`}>
      <div className={`w-full ${dockedVideo ? 'max-w-[1600px] flex-row gap-4 px-4' : 'max-w-5xl w-full flex-col px-4 sm:px-8'} flex h-full relative`}>
        <div className="flex-1 flex flex-col h-full relative min-w-0">

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar relative w-full pt-2 sm:pt-4"
        >
          <MessageList
            messages={filteredMessages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            onRegenerateMessage={onRegenerateMessage}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onFeedback={onFeedback}
            userTierId={userTierId}
            onOpenUpgradeModal={onOpenUpgradeModal}
            activeTheme={activeTheme as ThemeId}
            isReducedMotion={isReducedMotion}
            onDockVideo={onDockVideo}
            onEditImage={(img, prompt) => {
              setUploadedFiles([{ name: img.name || 'image.png', size: 'Image', type: img.type || 'image/png', base64: img.base64 }]);
              setGenerationMode('image');
              setInputText(prompt || 'Modify this image: ');
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            onAnimateToVideo={(img, prompt) => {
              setUploadedFiles([{ name: img.name || 'photo.png', size: 'Image', type: img.type || 'image/png', base64: img.base64 }]);
              setGenerationMode('video');
              setInputText(prompt || 'Animate this photo with cinematic camera motion');
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
          />

          {isUserScrolledUp && (
            <div className="absolute bottom-6 right-6 z-30">
              <button
                onClick={() => {
                  setIsUserScrolledUp(false);
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xl backdrop-blur-md border border-white/20 transition animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <span>↓ Jump to Bottom (New text below)</span>
              </button>
            </div>
          )}

          {/* File Preview Overlay */}
          {previewFile && (
            <FilePreview 
              fileId={previewFile.id}
              fileName={previewFile.name}
              mimeType={previewFile.mimeType}
              isOpen={!!previewFile}
              onClose={onClosePreview || (() => {})}
            />
          )}
          {!hasMessages && (
            <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex items-start justify-center p-2 pt-4 sm:pt-10 overflow-y-auto no-scrollbar">
              <div className="pointer-events-auto w-full max-w-full">
                <EmptyChatState 
                  onChipClick={handleChipClick} 
                  activeTheme={activeTheme as ThemeId} 
                />
              </div>
            </div>
          )}
        </div>

        {isComparisonMode && (
          <div className="max-w-5xl w-full mx-auto px-6 pb-3 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className={`p-2 rounded-2xl ${theme.bgInput} border ${theme.accentBorder} flex items-center justify-between gap-2 shadow-xl overflow-visible relative`}>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-3">A</span>
              <UnifiedModelSelector
                currentModelId={modelAId}
                onSelectModel={(m) => setModelAId(m.id)}
                userTierId={userTierId}
                compact
                position="up"
                activeTheme={activeTheme as ThemeId}
              />
            </div>
            <div className={`p-2 rounded-2xl ${theme.bgInput} border ${theme.accentBorder} flex items-center justify-between gap-2 shadow-xl overflow-visible relative`}>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest pl-3">B</span>
              <UnifiedModelSelector
                currentModelId={modelBId}
                onSelectModel={(m) => setModelBId(m.id)}
                userTierId={userTierId}
                compact
                position="up"
                activeTheme={activeTheme as ThemeId}
              />
            </div>
          </div>
        )}

        {showThemePicker && (
          <div className="max-w-5xl w-full mx-auto px-6 pb-4">
            <div className="p-3 rounded-2xl bg-[#080808] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-3xl ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 font-mono">Neural Interface Skins</span>
                </div>
                <button onClick={() => setShowThemePicker(false)} className="text-gray-500 hover:text-white p-1 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme?.(t.id);
                      setShowThemePicker(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 group ${
                      activeTheme === t.id 
                        ? 'bg-white/10 border-white/40 text-white shadow-xl ring-1 ring-white/10' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:border-white/20'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      {(t.colorSwatch || []).slice(0, 2).map((c, i) => (
                        <div 
                          key={i} 
                          className="w-2.5 h-2.5 rounded-full border border-black/20" 
                          style={{ backgroundColor: c }} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold whitespace-nowrap font-mono tracking-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        {!isLoading && !inputText && (
          <div className="max-w-5xl w-full mx-auto px-6 mb-1.5 flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
            {suggestedPrompts.map((p, idx) => (
              <motion.button
                key={`${currentModelId}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: idx * 0.08,
                  duration: 0.4,
                  ease: "easeOut"
                }}
                onClick={() => setInputText(p.prompt)}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-[10px] text-gray-400 hover:text-indigo-300 transition-all flex items-center gap-2 whitespace-nowrap group backdrop-blur-sm shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-indigo-500/60 group-hover:text-indigo-400 group-hover:animate-pulse transition-colors" />
                <span className="font-medium tracking-tight">{p.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        <ChatInput
          ref={textareaRef}
          inputText={inputText}
          setInputText={setInputText}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          isVibeCodingMode={isVibeCodingMode}
          setIsVibeCodingMode={setIsVibeCodingMode}
          problemSolvingMode={problemSolvingMode}
          setProblemSolvingMode={setProblemSolvingMode}
          deepResearchMode={deepResearchMode}
          setDeepResearchMode={setDeepResearchMode}
          enableWebSearch={enableWebSearch}
          onToggleWebSearch={onToggleWebSearch}
          onPromptEnhance={handlePromptEnhance}
          onVoiceInput={handleVoiceInput}
          voiceModeEnabled={voiceModeEnabled}
          onToggleVoiceMode={handleToggleVoiceMode}
          onOpenPromptsModal={onOpenPromptsModal}
          activeTheme={activeTheme as ThemeId}
          isListening={isListening}
          generationMode={generationMode}
          setGenerationMode={setGenerationMode}
          autoRefine={autoRefine}
          setAutoRefine={setAutoRefine}
          imageSize={imageSize as any}
          setImageSize={setImageSize as any}
          currentModelId={currentModelId}
          onSelectModel={onSelectModel}
          userTierId={userTierId}
          onOpenUpgradeModal={onOpenUpgradeModal}
          showThemePicker={showThemePicker}
          setShowThemePicker={setShowThemePicker}
          hasSubmitted={hasMessages}
          onOpenConnectors={onOpenConnectors}
          onOpenWorkspace={onOpenWorkspace}
        />
        </div>

        {dockedVideo && (
          <div className="w-[600px] shrink-0 border-l border-white/10 h-[calc(100vh-80px)] overflow-hidden hidden xl:block shadow-2xl rounded-l-2xl animate-in slide-in-from-right-4 duration-500 bg-[#0a0a0a]">
            <YoutubeAnalyser
              onClose={() => onCloseDock?.()}
              activeTheme={activeTheme}

              initialVideoData={dockedVideo}
            />
          </div>
        )}
      </div>

      {/* Auto-Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Auto-Summarize Thread</h3>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-[220px] max-h-[60vh] overflow-y-auto p-4 bg-zinc-900/60 rounded-2xl border border-white/5 text-xs font-mono text-zinc-300 leading-relaxed">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing conversation summary...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{summaryText}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summaryText);
                  setCopiedSummary(true);
                  setTimeout(() => setCopiedSummary(false), 2000);
                }}
                disabled={isSummarizing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-[#141414] border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Search Message & Prompt History</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Fuzzy search past questions and prompts..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 font-mono"
                autoFocus
              />
            </div>

            <div className="min-h-[220px] max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {matchingHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-zinc-500 text-xs font-mono">
                  <Clock className="w-8 h-8 mb-2 opacity-40" />
                  <span>No matching past prompts found.</span>
                </div>
              ) : (
                matchingHistory.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    onClick={() => {
                      setInputText(msg.content);
                      setShowHistoryModal(false);
                    }}
                    className="p-3 bg-zinc-900/60 border border-white/5 hover:border-white/20 rounded-xl cursor-pointer transition flex items-start justify-between gap-3 group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-zinc-200 group-hover:text-white transition">
                        {msg.content}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      Reuse ↵
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
