import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Copy, Edit3, 
  Check, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Play, 
  User, 
  Sparkles,
  RotateCw,
  Globe,
  ExternalLink,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  X,
  Terminal,
  FastForward,
  Video,
  ListOrdered,
  FileText,
  Volume2,
  VolumeX,
  Download,
  Music,
  Book,
  Image as ImageIcon,
  Youtube,
  Clock,
  Bookmark,
  List,
  Tv,
  Film,
  Slack,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { executeConnectorAction, extractActionItems, extractCodeBlocks } from '../core/connectorsEngine';
import { ChatMessage, PersonaId } from '../types';
import { playElevenLabsTTS } from '../core/elevenLabs';
import { NOTHING_AI_PERSONAS } from '../core/personas';
import { getModelById } from '../core/modelsConfig';
import { QuizRenderer } from './QuizRenderer';
import { THEMES, ThemeId } from '../core/themeConfig';
import { VibeCodingPreview } from './VibeCodingPreview';
import { MarkdownRenderer } from './chat/MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike', reason?: string, comment?: string) => void;
  activeTheme?: ThemeId;
  userTierId?: string;
  onOpenUpgradeModal?: () => void;
  isReducedMotion?: boolean;
  onDockVideo?: (video: any) => void;
  onEditImage?: (image: { name: string; type: string; base64: string }, prompt?: string) => void;
  onAnimateToVideo?: (image: { name: string; type: string; base64: string }, prompt?: string) => void;
}

const MessageItemBase: React.FC<MessageItemProps> = ({ 
  message, 
  onRegenerate, 
  onEdit, 
  onDelete,
  onFeedback, 
  activeTheme = 'silk',
  userTierId = 'free',
  onOpenUpgradeModal = () => {},
  isReducedMotion = false,
  onDockVideo,
  onEditImage,
  onAnimateToVideo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | 'tie' | null>(message.comparison?.winner || null);
  const [copied, setCopied] = useState(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isVideoLooping, setIsVideoLooping] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [showDislikeForm, setShowDislikeForm] = useState(false);
  const [dislikeReason, setDislikeReason] = useState<string>('');
  const [dislikeComment, setDislikeComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Interactive inline video intelligence states
  const [videoTab, setVideoTab] = useState<'summary' | 'chapters' | 'takeaways' | 'transcript'>('summary');
  const [playerStartTime, setPlayerStartTime] = useState<number>(0);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

  const parseTimestampToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const handlePlayChapter = (timeStr: string) => {
    const seconds = parseTimestampToSeconds(timeStr);
    setPlayerStartTime(seconds);
    setIsPlayerVisible(true);
    setIframeKey(prev => prev + 1);
  };

  const isUser = message.role === 'user';

  const [displayedLength, setDisplayedLength] = useState<number>(() => {
    if (isUser || Date.now() - message.timestamp > 5000) {
      return message.content.length;
    }
    return 0;
  });
  const [isTypingActive, setIsTypingActive] = useState<boolean>(() => {
    return !isUser && Date.now() - message.timestamp <= 5000;
  });

  useEffect(() => {
    if (isUser || !isTypingActive) return;
    if (displayedLength >= message.content.length) {
      setIsTypingActive(false);
      return;
    }
    const timer = setInterval(() => {
      setDisplayedLength(prev => {
        const nextLen = Math.min(message.content.length, prev + Math.max(20, Math.floor((message.content.length - prev) / 3) + 8));
        if (nextLen >= message.content.length) {
          clearInterval(timer);
          setIsTypingActive(false);
        }
        return nextLen;
      });
    }, 8);
    return () => clearInterval(timer);
  }, [message.content.length, isUser, isTypingActive]);

  useEffect(() => {
    if (isTypingActive && displayedLength > 0) {
      window.dispatchEvent(new CustomEvent('typing-scroll'));
    }
  }, [displayedLength, isTypingActive]);

  const handleSkipTyping = () => {
    setDisplayedLength(message.content.length);
    setIsTypingActive(false);
    window.dispatchEvent(new CustomEvent('typing-scroll'));
  };

  const handleLike = () => {
    const newFeedback = feedback === 'like' ? null : 'like';
    setFeedback(newFeedback);
    onFeedback?.(message.id, newFeedback as any);
  };

  const handleDislike = () => {
    if (feedback === 'dislike') {
      setFeedback(null);
      setShowDislikeForm(false);
      onFeedback?.(message.id, null as any);
    } else {
      setFeedback('dislike');
      setShowDislikeForm(true);
    }
  };

  const handleSubmitDislikeFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    onFeedback?.(message.id, 'dislike', dislikeReason, dislikeComment);
    setShowDislikeForm(false);
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  // Connector Automation State
  const [showAutomateMenu, setShowAutomateMenu] = useState(false);
  const [automateLoading, setAutomateLoading] = useState(false);
  const [automateSuccessMsg, setAutomateSuccessMsg] = useState<string | null>(null);
  const [automateResultUrl, setAutomateResultUrl] = useState<string | null>(null);

  const handleRunConnector = async (connectorType: 'github_gist' | 'google_doc' | 'google_task' | 'slack' | 'discord' | 'webhook') => {
    setShowAutomateMenu(false);
    setAutomateLoading(true);
    setAutomateSuccessMsg(null);
    setAutomateResultUrl(null);

    const codeBlocks = extractCodeBlocks(message.content);
    const actionItems = extractActionItems(message.content);

    const res = await executeConnectorAction(connectorType, {
      title: `AI Note: ${message.content.slice(0, 35)}...`,
      content: message.content,
      codeBlocks,
      actionItems,
      metadata: {
        timestamp: message.timestamp,
        model: message.personaId,
      },
    });

    setAutomateLoading(false);
    if (res.success) {
      setAutomateSuccessMsg(res.message);
      if (res.url) setAutomateResultUrl(res.url);
      setTimeout(() => {
        setAutomateSuccessMsg(null);
        setAutomateResultUrl(null);
      }, 6000);
    } else {
      setAutomateSuccessMsg(res.message || 'Automation failed');
      setTimeout(() => setAutomateSuccessMsg(null), 4000);
    }
  };

  const senderDisplayName = isUser ? 'You' : 'Nothing-Ai';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      const textToSpeak = message.content.replace(/```[\s\S]*?```/g, ' code block snippet ');
      setIsSpeaking(true);
      
      const elevenLabsKey = localStorage.getItem('Nothing-Ai_elevenlabs_key');
      if (elevenLabsKey) {
        const audio = await playElevenLabsTTS(textToSpeak, () => setIsSpeaking(false));
        if (audio) {
          audioRef.current = audio;
          return;
        }
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        alert('Text-to-speech is not supported in your browser.');
      }
    }
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(editText);
    }
    setIsEditing(false);
  };

  return (
    <motion.div 
      layout
      initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={isReducedMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={isReducedMotion ? undefined : { 
        opacity: 0, 
        scale: 0.96, 
        y: -10, 
        filter: 'blur(8px)',
        transition: { 
          duration: 0.32, 
          ease: [0.16, 1, 0.3, 1] 
        } 
      }}
      transition={{ 
        layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        duration: 0.25, 
        ease: 'easeOut' 
      }}
      className={`group flex items-start gap-4 w-full ${isUser ? 'justify-end flex-row-reverse' : 'justify-start'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
        isUser 
          ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
          : 'bg-white/5 border-white/10 text-white'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <div className="font-bold text-[10px] font-mono">N</div>}
      </div>

      {/* Content Area */}
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end ml-auto max-w-[80%]' : 'items-start mr-auto w-full max-w-full'}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
            {isUser ? 'You' : 'Nothing-Ai'}
          </span>
        </div>

        {/* Message Bubble */}
        <div className={`relative transition-all duration-300 ${
          isUser 
            ? `px-4 py-2.5 rounded-2xl ${theme.accentPrimary} ${theme.accentBorder} border ${
                ['warm_taupe', 'butter_mustard', 'calm'].includes(theme.id) ? 'text-zinc-900 font-semibold' : 'text-white'
              } shadow-md backdrop-blur-sm max-w-fit ml-auto text-right` 
            : `px-4 py-3 rounded-2xl ${theme.bgCard} ${theme.accentBorder} ${theme.textMain} shadow-xl w-full mr-auto text-left`
        }`}>
          {isEditing ? (
            <div className="space-y-3 min-w-[300px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/20 min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition">Cancel</button>
                <button onClick={handleEditSubmit} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-bold transition">Save</button>
              </div>
            </div>
          ) : (
            <div className="text-xs leading-relaxed overflow-hidden">
              <MarkdownRenderer content={isTypingActive ? message.content.slice(0, displayedLength) : message.content} />
              
              {isTypingActive && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-white animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Reasoning section removed by request */}

          {/* Web Sources */}
          {message.webSearchUsed && message.webSources && message.webSources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                <Globe className="w-3 h-3 text-blue-400" />
                Verified Sources
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.webSources.map((source, i) => (
                  <a 
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition flex flex-col gap-1"
                  >
                    <span className="text-[10px] font-bold text-zinc-200 line-clamp-1">{source.title}</span>
                    <span className="text-[9px] text-zinc-500 truncate">{source.sourceName || new URL(source.url).hostname}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Multimedia Data */}
          {message.videoData && message.videoData.videoId && (
            <div className="mt-4 bg-[#111115] rounded-2xl border border-white/10 overflow-hidden shadow-xl max-w-full">
              {/* Header with Title and Youtube badge */}
              <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Youtube className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-1">
                      {message.videoData.title || 'YouTube Video Intelligence'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {message.videoData.channel ? `${message.videoData.channel} ` : ''} 
                      {message.videoData.duration ? `• ${message.videoData.duration}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onDockVideo && (
                    <button 
                      type="button"
                      onClick={() => onDockVideo(message.videoData)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 shrink-0"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Dock on Side</span>
                    </button>
                  )}
                  <a 
                    href={message.videoData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open on YouTube</span>
                  </a>
                </div>
              </div>

              {/* Dynamic Video Player Frame */}
              {message.videoData.videoId && (
                <div className="bg-black aspect-video relative border-b border-white/5">
                  {isPlayerVisible ? (
                    <iframe
                      key={iframeKey}
                      src={`https://www.youtube.com/embed/${message.videoData.videoId}?start=${playerStartTime}&autoplay=1`}
                      title={message.videoData.title || 'YouTube Video'}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {message.videoData.thumbnailUrl ? (
                        <img 
                          src={message.videoData.thumbnailUrl} 
                          alt="Video Cover" 
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#0f0f13]" />
                      )}
                      <button
                        onClick={() => setIsPlayerVisible(true)}
                        className="relative z-10 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full p-4 shrink-0 shadow-lg transition-all flex items-center justify-center hover:scale-105"
                      >
                        <Play className="w-6 h-6 fill-current text-white translate-x-0.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Tabs bar */}
              <div className="flex border-b border-white/5 bg-black/40 p-1.5 gap-1.5 overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setVideoTab('summary')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition whitespace-nowrap ${
                    videoTab === 'summary' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Summary
                </button>
                {message.videoData.chapters && message.videoData.chapters.length > 0 && (
                  <button
                    onClick={() => setVideoTab('chapters')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition whitespace-nowrap ${
                      videoTab === 'chapters' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Timeline ({message.videoData.chapters.length})
                  </button>
                )}
                {message.videoData.takeaways && message.videoData.takeaways.length > 0 && (
                  <button
                    onClick={() => setVideoTab('takeaways')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition whitespace-nowrap ${
                      videoTab === 'takeaways' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Key Takeaways
                  </button>
                )}
                {message.videoData.transcript && (
                  <button
                    onClick={() => setVideoTab('transcript')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition whitespace-nowrap ${
                      videoTab === 'transcript' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Transcript Track
                  </button>
                )}
              </div>

              {/* Tabs Content */}
              <div className="p-4 bg-zinc-950/20 text-[11px] leading-relaxed text-zinc-300 min-h-[120px]">
                {videoTab === 'summary' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>Executive Summary</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {message.videoData.summary || 'Summary not processed.'}
                    </p>
                  </div>
                )}

                {videoTab === 'chapters' && message.videoData.chapters && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Interactive Timeline</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 lowercase">click timestamps to seek</span>
                    </div>
                    
                    <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 py-1">
                      {message.videoData.chapters.map((chap, idx) => (
                        <div key={idx} className="relative group">
                          {/* Chronological dot */}
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-rose-500 group-hover:scale-125 transition-all" />
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePlayChapter(chap.time)}
                                className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 font-mono text-[9px] font-bold hover:bg-rose-500 hover:text-white transition flex items-center gap-1"
                              >
                                <Play className="w-2 h-2 fill-current" />
                                {chap.time}
                              </button>
                              <span className="text-[11px] font-bold text-white line-clamp-1">{chap.title}</span>
                            </div>
                            {chap.summary && (
                              <p className="text-[10px] text-zinc-400 pl-1">
                                {chap.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {videoTab === 'takeaways' && message.videoData.takeaways && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      <Bookmark className="w-3.5 h-3.5 text-rose-400" />
                      <span>Key Takeaways</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {message.videoData.takeaways.map((takeaway, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex gap-2.5">
                          <div className="w-4 h-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-normal">
                            {takeaway}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {videoTab === 'transcript' && message.videoData.transcript && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>Transcript Tracks & Outline</span>
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap scrollbar-thin">
                      {message.videoData.transcript}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Veo 3.1 Fast Video Player (Direct Generated Video) */}
          {message.videoData && !message.videoData.videoId && message.videoData.url && (
            <div className="mt-4 bg-[#0d0d12] rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl max-w-full">
              <div className="p-3.5 border-b border-white/5 bg-gradient-to-r from-purple-950/30 to-black/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
                    <Film className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {message.videoData.title || 'Veo 3.1 Fast Video'}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {message.videoData.aspectRatio || '16:9'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      veo-3.1-fast-generate-preview • High Quality Video
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsVideoLooping(!isVideoLooping)}
                    className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold font-mono transition-all flex items-center gap-1 ${
                      isVideoLooping ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}
                    title="Toggle video looping"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{isVideoLooping ? 'Loop: ON' : 'Loop: OFF'}</span>
                  </button>
                  <a
                    href={message.videoData.url}
                    download="veo-3.1-generated-video.mp4"
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-purple-500 hover:text-white text-[9px] font-bold text-zinc-300 transition-all flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>

              <div className={`relative bg-black flex items-center justify-center ${
                message.videoData.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-video w-full'
              }`}>
                <video
                  src={message.videoData.url}
                  controls
                  autoPlay
                  loop={isVideoLooping}
                  playsInline
                  className="w-full h-full object-contain rounded-b-xl"
                />
              </div>
            </div>
          )}

          {/* Gemini 3.1 Flash Image Card & File Image Attachments */}
          {(message.imageData || (message.files && message.files.some(f => f.base64 && f.type?.startsWith('image/')))) && (
            <div className="mt-4 space-y-3">
              {message.imageData && (
                <div className="bg-[#0e0e14] rounded-2xl border border-pink-500/30 overflow-hidden shadow-2xl max-w-full">
                  <div className="p-3.5 border-b border-white/5 bg-gradient-to-r from-pink-950/25 to-black/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-300">
                        <ImageIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white tracking-tight">Gemini 3.1 Flash Image</h3>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            {message.imageData.aspectRatio || '1:1'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">gemini-3.1-flash-image</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={message.imageData.url}
                        download="gemini-3.1-artwork.png"
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-pink-500 hover:text-white text-[9px] font-bold text-zinc-300 transition-all flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative group/img bg-black/60 p-2 flex items-center justify-center">
                    <img
                      src={message.imageData.url}
                      alt={message.imageData.prompt || 'Generated Artwork'}
                      className="max-h-[420px] w-auto max-w-full rounded-xl object-contain shadow-lg cursor-pointer hover:brightness-105 transition-all"
                      onClick={() => setLightboxImage(message.imageData!.url)}
                    />
                  </div>

                  {/* Quick actions for image: Edit or Animate to Video */}
                  <div className="p-2.5 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {onEditImage && (
                        <button
                          type="button"
                          onClick={() => onEditImage({ name: 'gemini-edit-source.png', type: 'image/png', base64: message.imageData!.url }, 'Modify this image: ')}
                          className="px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500 hover:text-white text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Edit with Gemini 3.1</span>
                        </button>
                      )}
                      {onAnimateToVideo && (
                        <button
                          type="button"
                          onClick={() => onAnimateToVideo({ name: 'veo-animate-source.png', type: 'image/png', base64: message.imageData!.url }, 'Animate this photo with cinematic camera motion')}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-white text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Animate with Veo 3.1</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLightboxImage(message.imageData!.url)}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-mono text-zinc-400 hover:text-white transition"
                    >
                      🔍 Expand Preview
                    </button>
                  </div>
                </div>
              )}

              {message.files && message.files.filter(f => f.base64 && f.type?.startsWith('image/')).map((img, idx) => (
                <div key={idx} className="bg-[#0e0e14] rounded-2xl border border-white/10 overflow-hidden shadow-xl max-w-full">
                  <div className="p-2.5 border-b border-white/5 bg-black/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-white truncate max-w-[200px]">{img.name || `Image #${idx + 1}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onEditImage && (
                        <button
                          type="button"
                          onClick={() => onEditImage(img, 'Modify this image: ')}
                          className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white text-[9px] font-bold transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onAnimateToVideo && (
                        <button
                          type="button"
                          onClick={() => onAnimateToVideo(img, 'Animate this photo with cinematic camera motion')}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white text-[9px] font-bold transition flex items-center gap-1"
                        >
                          <Film className="w-3 h-3" />
                          <span>Animate</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-black/40 flex items-center justify-center">
                    <img
                      src={img.base64}
                      alt={img.name || 'Attached Image'}
                      className="max-h-[300px] w-auto max-w-full rounded-lg object-contain cursor-pointer"
                      onClick={() => setLightboxImage(img.base64)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comparison Mode UI */}
          {message.comparison && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border transition-all ${selectedWinner === 'A' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900/50 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Model A: {message.comparison.modelA.modelName}</span>
                  <button onClick={() => setSelectedWinner('A')} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${selectedWinner === 'A' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>Select Winner</button>
                </div>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <MarkdownRenderer content={message.comparison.modelA.content} />
                </div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${selectedWinner === 'B' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/50 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Model B: {message.comparison.modelB.modelName}</span>
                  <button onClick={() => setSelectedWinner('B')} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${selectedWinner === 'B' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>Select Winner</button>
                </div>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <MarkdownRenderer content={message.comparison.modelB.content} />
                </div>
              </div>
            </div>
          )}

          {/* Quiz Data */}
          {message.quizData && (
            <div className="mt-4">
              <QuizRenderer quiz={message.quizData} />
            </div>
          )}

          {/* Action Bar */}
          <div className={`mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
            <button 
              onClick={handleCopyMessage}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={handleToggleSpeech}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition ${isSpeaking ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-white'}`}
              title="Read Aloud"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            {/* Automate / Connectors Trigger */}
            {!isUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAutomateMenu(!showAutomateMenu)}
                  disabled={automateLoading}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition flex items-center gap-1 ${
                    showAutomateMenu ? 'text-amber-300 bg-amber-500/10' : 'text-zinc-500 hover:text-amber-300'
                  }`}
                  title="Automate with Connectors (Gists, Tasks, Docs, Slack, Webhooks)"
                >
                  {automateLoading ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-bold hidden sm:inline">Automate</span>
                </button>

                {showAutomateMenu && (
                  <div className="absolute left-0 bottom-full mb-1 z-50 w-56 bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl animate-fadeIn text-xs">
                    <div className="px-2.5 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 mb-1">
                      Run Connector Automation
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('github_gist')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Export to GitHub Gist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('google_task')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sync Tasks to Google Tasks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('google_doc')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Save to Google Docs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('slack')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <Slack className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>Broadcast to Slack</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('discord')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Post to Discord</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunConnector('webhook')}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Stream to Zapier / Make</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {onRegenerate && !isUser && (
              <button 
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition"
                title="Regenerate"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
            {isUser && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isUser && (
              <div className="flex items-center gap-1 border-l border-white/5 pl-2 ml-1">
                <button 
                  onClick={handleLike}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition ${feedback === 'like' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                  title="Like"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleDislike}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition ${feedback === 'dislike' ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-500 hover:text-white'}`}
                  title="Dislike"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete()}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition"
                title={isUser ? "Delete prompt" : "Delete reply"}
                aria-label="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Success Toast (Mini) */}
        {feedbackSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1"
          >
            Feedback Received. Optimizing Engine.
          </motion.div>
        )}

        {/* Connector Automation Toast */}
        {automateSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between gap-2 max-w-md shadow-lg"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-medium">{automateSuccessMsg}</span>
            </div>
            {automateResultUrl && (
              <a
                href={automateResultUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white hover:underline flex items-center gap-1 font-bold text-[10px] shrink-0 bg-white/10 px-2 py-0.5 rounded"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}

        {/* Dislike Form */}
        {showDislikeForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 w-full max-w-sm bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-2xl"
          >
            <form onSubmit={handleSubmitDislikeFeedback} className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Feedback Reason</span>
                <button onClick={() => setShowDislikeForm(false)} className="text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
              <select 
                value={dislikeReason}
                onChange={(e) => setDislikeReason(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">Select a reason...</option>
                <option value="inaccurate">Inaccurate information</option>
                <option value="unhelpful">Unhelpful or irrelevant</option>
                <option value="harmful">Harmful or biased</option>
                <option value="technical">Technical error</option>
                <option value="other">Other</option>
              </select>
              <textarea 
                placeholder="Optional comments..."
                value={dislikeComment}
                onChange={(e) => setDislikeComment(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 min-h-[60px]"
              />
              <button type="submit" className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition">Submit Feedback</button>
            </form>
          </motion.div>
        )}
        {/* Lightbox Preview Modal */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Full resolution preview"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const MessageItem = React.memo(MessageItemBase);
