import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Youtube, 
  Search, 
  Clock, 
  User, 
  FileText, 
  List, 
  Play, 
  Bookmark, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft,
  X,
  AlertCircle,
  HelpCircle,
  Download,
  Flame,
  Volume2,
  Tv,
  Globe,
  Plus
} from 'lucide-react';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';
import { MarkdownRenderer } from './chat/MarkdownRenderer';

interface Chapter {
  time: string;
  title: string;
  summary?: string;
}

interface AnalysisResult {
  url: string;
  videoId?: string;
  thumbnailUrl?: string;
  title: string;
  channel: string;
  duration: string;
  summary: string;
  takeaways: string[];
  chapters: Chapter[];
  transcript: string;
  formattedMarkdown: string;
}

interface YoutubeAnalyserProps {
  onClose: () => void;
  activeTheme?: ThemeId;
  onDockVideo?: (video: any) => void;
  initialVideoData?: any;
}

export function YoutubeAnalyser({ 
  onClose, 
  activeTheme = 'silk',
  onDockVideo,
  initialVideoData
}: YoutubeAnalyserProps) {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);

  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'chapters' | 'takeaways' | 'notes'>('summary');
  const [playerVideoId, setPlayerVideoId] = useState<string | null>(null);
  const [playerStartTime, setPlayerStartTime] = useState<number>(0);
  const [copiedText, setCopiedText] = useState(false);

  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleGenerateAISummary = async () => {
    if (!result?.transcript) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/summarize-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: result.transcript,
          title: result.title,
          channel: result.channel
        }),
      });

      if (!response.ok) {
        throw new Error('Summarization service returned an error. Please try again.');
      }

      const data = await response.json();
      setAiInsights(data.insights);
      setActiveTab('takeaways'); // Switch tab to takeaways so user sees insights instantly!
    } catch (err: any) {
      console.error(err);
      setSummaryError(err?.message || 'Failed to condense transcript. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (initialVideoData) {
      setResult({
        ...initialVideoData,
        formattedMarkdown: initialVideoData.formattedMarkdown || initialVideoData.transcript
      });
      setPlayerVideoId(initialVideoData.videoId);
      setUrl(initialVideoData.url || '');
    }
  }, [initialVideoData]);

  const loadingPhases = [
    'Connecting to YouTube gateway...',
    'Analyzing video details and captions...',
    'Passing transcript tracks to Gemini Video Intelligence...',
    'Synthesizing topics, timelines, and study outline...',
    'Finalizing interactive study guide...'
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev < loadingPhases.length - 1 ? prev + 1 : prev));
      }, 4000);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const extractYouTubeVideoId = (inputUrl: string): string | null => {
    if (!inputUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const vidId = extractYouTubeVideoId(url);
    if (!vidId) {
      setError('Please provide a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPlayerVideoId(null);

    try {
      const response = await fetch('/api/video-grabber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          prompt: prompt.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis service returned an error. Please try again.');
      }

      const data = await response.json();
      setResult(data);
      if (data.videoId) {
        setPlayerVideoId(data.videoId);
      }
      setActiveTab('summary');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to complete video analysis. Please verify the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    // Force reload player if videoId is same to start at new timestamp
    if (result?.videoId) {
      setPlayerVideoId(null);
      setTimeout(() => setPlayerVideoId(result.videoId!), 50);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Preset academic links for students to play around with
  const loadPreset = (presetUrl: string, presetPrompt = '') => {
    setUrl(presetUrl);
    setPrompt(presetPrompt);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col h-full bg-[#0a0a0d] text-zinc-100">
      {/* Upper Navigation Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-500 shrink-0" />
              YouTube Video Analyser
            </h2>
            <p className="text-[11px] text-zinc-500">
              Paste any study lecture, documentary, or tutorial. Our AI will watch it, outline key topics, and build an interactive guide.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 min-h-0 overflow-y-auto">
        {/* Left Input / Setup Form Column (span 4) */}
        <div className="lg:col-span-4 space-y-5 flex flex-col h-fit">
          <div className="bg-[#111115] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Analyze New Video
            </h3>

            <form onSubmit={handleAnalyse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Video URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all font-mono"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-2.5 text-zinc-500">
                    <Youtube className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Custom Prompt Focus (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Focus on summarizing the physics formulas, explain the main timeline, etc."
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all resize-none leading-relaxed"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                style={{ backgroundColor: url.trim() ? primary : undefined }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                  url.trim() ? 'hover:brightness-110 active:scale-98' : 'bg-white/5 border border-white/5 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Analyze Video</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Presets & Recommendations */}
          <div className="bg-[#111115] border border-white/10 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              Example Lectures & presets
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => loadPreset('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Give me a brief review of the music production, style, and iconic meme status.')}
                className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition flex flex-col gap-1"
                disabled={isLoading}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Never Gonna Give You Up (Meme & Style)</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal line-clamp-1">
                  Full production details, 80s synth breakdowns & internet lore.
                </p>
              </button>

              <button
                onClick={() => loadPreset('https://www.youtube.com/watch?v=8mP5xOg7NSA', 'Extract the core programming and database paradigms shown in this tutorial.')}
                className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition flex flex-col gap-1"
                disabled={isLoading}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Drizzle ORM Full Overview Course</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal line-clamp-1">
                  Extract SQL schemas, relationships, and queries seamlessly.
                </p>
              </button>

              <button
                onClick={() => loadPreset('https://www.youtube.com/watch?v=R9OHn5ZF4Uo', 'Focus on outlining the key study methods and techniques discussed.')}
                className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition flex flex-col gap-1"
                disabled={isLoading}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>How to Study Effectively (Scientific Methods)</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal line-clamp-1">
                  Active recall, spaced repetition, and evidence-based study hacks.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output / Dashboard Column (span 8) */}
        <div className="lg:col-span-8 flex flex-col min-h-[450px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#111115] border border-white/10 rounded-2xl space-y-6 min-h-[450px]"
              >
                {/* Custom animated player screen skeleton */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
                  <Youtube className="w-10 h-10 text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h4 className="text-sm font-bold text-white tracking-tight">AI is watching the video...</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[32px] transition-all">
                    {loadingPhases[loadingPhase]}
                  </p>
                </div>
                <div className="w-full max-w-xs bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                    style={{ width: `${((loadingPhase + 1) / loadingPhases.length) * 100}%` }}
                  />
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-6"
              >
                {/* Video Info Card & Mini Player Header */}
                <div className="bg-[#111115] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  {playerVideoId ? (
                    <div className="aspect-video w-full bg-black relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${playerVideoId}?start=${playerStartTime}&autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    result.thumbnailUrl && (
                      <div className="aspect-video w-full overflow-hidden bg-black relative">
                        <img 
                          src={result.thumbnailUrl} 
                          alt="Video Cover" 
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex items-end p-6">
                          <button
                            onClick={() => result.videoId && setPlayerVideoId(result.videoId)}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-4 shrink-0 shadow-lg active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Play className="w-6 h-6 fill-current" />
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  <div className="p-5 space-y-3 bg-gradient-to-b from-[#111115] to-[#16161c]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white leading-snug">{result.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 font-medium">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            {result.channel}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {result.duration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(onDockVideo && !initialVideoData) && (
                          <button
                            type="button"
                            onClick={() => {
                              onDockVideo({
                                ...result,
                                videoId: playerVideoId || result.videoId
                              });
                              onClose();
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                            title="Dock video player & transcript to the side of the chat screen"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Dock on Side</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(result.formattedMarkdown)}
                          className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
                          title="Copy Full Study Guide Markdown"
                        >
                          {copiedText ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Tabs bar */}
                <div className="flex border-b border-white/5 bg-[#111115] rounded-xl p-1.5 border border-white/10 gap-1.5 scrollbar-thin overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'summary' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Executive Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'chapters' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Interactive Timeline ({result.chapters.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('takeaways')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'takeaways' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Key Insights {aiInsights ? '(AI Synced)' : ''}
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'notes' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Detailed Explanation
                  </button>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'transcript' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Transcript Track
                  </button>
                </div>

                {/* Tab Views */}
                <div className="bg-[#111115] border border-white/10 rounded-2xl p-6 min-h-[250px] leading-relaxed text-xs">
                  {activeTab === 'summary' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-400" />
                        Executive Summary
                      </h4>
                      <p className="text-zinc-300 leading-relaxed text-xs font-medium bg-black/25 p-4 rounded-xl border border-white/5">
                        {result.summary}
                      </p>
                    </div>
                  )}

                  {activeTab === 'chapters' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-rose-400" />
                          Interactive Lecture Timeline
                        </h4>
                        <span className="text-[10px] text-zinc-500">Click time to play from point</span>
                      </div>

                      <div className="relative border-l border-white/10 pl-5 ml-2.5 space-y-6 py-2">
                        {result.chapters.map((chap, idx) => (
                          <div key={idx} className="relative group">
                            {/* Dot */}
                            <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 group-hover:scale-125 transition-all" />
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePlayChapter(chap.time)}
                                  className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  {chap.time}
                                </button>
                                <span className="text-xs font-bold text-white">{chap.title}</span>
                              </div>
                              {chap.summary && (
                                <p className="text-[11px] text-zinc-400 leading-normal pl-1">
                                  {chap.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}                  {activeTab === 'takeaways' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Bookmark className="w-4 h-4 text-rose-400" />
                            Key Takeaways & Insights
                          </h4>
                          <p className="text-[10px] text-zinc-500">Core concepts derived chronologically from the video captions.</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateAISummary}
                          disabled={isGeneratingSummary || !result.transcript}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-white/5 disabled:text-zinc-600 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-md"
                        >
                          {isGeneratingSummary ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>AI Condensing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              <span>Generate AI Summary</span>
                            </>
                          )}
                        </button>
                      </div>

                      {summaryError && (
                        <p className="text-red-400 text-[10px] bg-red-500/10 border border-red-500/10 p-2 rounded-lg">
                          {summaryError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(aiInsights || result.takeaways).map((takeaway, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2 flex gap-3">
                            <div className="w-5 h-5 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                              {idx + 1}
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                              {takeaway}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          Deep-Dive Explanation
                        </h4>
                        <button
                          onClick={() => handleCopy(result.formattedMarkdown)}
                          className="text-[10px] text-rose-400 flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Text
                        </button>
                      </div>

                      <div className="bg-black/25 p-5 rounded-xl border border-white/5 prose max-w-none text-zinc-300 leading-relaxed text-xs">
                        <MarkdownRenderer content={result.formattedMarkdown} />
                      </div>
                    </div>
                  )}                  {activeTab === 'transcript' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-rose-400" />
                            Interactive Transcript
                          </h4>
                          <button
                            onClick={() => handleCopy(result.transcript)}
                            className="text-[10px] text-rose-400 flex items-center gap-1.5 hover:underline font-mono font-bold"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Transcript
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500">Timestamps are fully clickable to play from that moment!</p>
                      </div>

                      

                      <div className="max-h-96 overflow-y-auto bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-zinc-400 leading-relaxed scrollbar-thin space-y-2 select-text">
                        {result.transcript ? (
                          result.transcript.split('\n').map((line, idx) => {
                            // Match timestamps like 02:15, 1:45:20, [02:15], (02:15)
                            const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
                            if (timeMatch) {
                              const timestamp = timeMatch[1];
                              const parts = line.split(timestamp);
                              return (
                                <div key={idx} className="py-1 hover:bg-white/[0.02] px-2 rounded transition flex items-start gap-2.5 group">
                                  <button
                                    type="button"
                                    onClick={() => handlePlayChapter(timestamp)}
                                    className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold hover:bg-rose-500 hover:text-white transition-all shrink-0 mt-0.5"
                                    title={`Seek player to ${timestamp}`}
                                  >
                                    <Play className="w-2 h-2 fill-current inline-block mr-1" />
                                    {timestamp}
                                  </button>
                                  <span className="text-[11px] text-zinc-300 flex-1 leading-relaxed">
                                    {parts.join('')}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className="py-1 text-zinc-400 text-[11px] leading-relaxed">
                                {line}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-zinc-600 italic">No transcript track available.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#111115] border border-white/10 rounded-2xl space-y-4 min-h-[450px]"
              >
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
                  <Youtube className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h4 className="text-sm font-bold text-white tracking-tight">Enter video URL to begin</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Paste a YouTube link in the input form on the left, add optional instructions, and click Analyze. We'll pull video details and generate a highly detailed study timeline.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
