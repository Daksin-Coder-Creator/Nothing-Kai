import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Table, 
  Presentation, 
  ClipboardList, 
  MessageSquare, 
  ExternalLink, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  BarChart3,
  Flame,
  Award,
  Sparkles,
  CheckSquare,
  StickyNote,
  Mail
} from 'lucide-react';
import { auth, googleAuthProvider, db } from '../lib/firebase.ts';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';
import { DailyStreaks } from './DailyStreaks';
import { StudyAnalytics } from './StudyAnalytics';
import { ChatConversation } from '../types';

interface WorkspaceDashboardProps {
  onClose: () => void;
  onPreviewFile: (file: { id: string, name: string, mimeType: string }) => void;
  activeTheme?: ThemeId;
  conversations?: ChatConversation[];
}

export function WorkspaceDashboard({ onClose, onPreviewFile, activeTheme = 'silk', conversations = [] }: WorkspaceDashboardProps) {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const [activeTab, setActiveTab] = useState<'docs' | 'sheets' | 'slides' | 'forms' | 'chat' | 'tasks' | 'keep' | 'gmail' | 'collaborative' | 'analytics' | 'streaks' | 'achievements' | 'quiz'>('docs');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const tabs = [
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'sheets', label: 'Sheets', icon: Table },
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'forms', label: 'Forms', icon: ClipboardList },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'keep', label: 'Keep', icon: StickyNote },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'collaborative', label: 'Collaborative', icon: Users },
    { id: 'analytics', label: 'Study Analytics', icon: BarChart3 },
    { id: 'streaks', label: 'Daily Streaks', icon: Flame },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'quiz', label: 'Quiz Generator', icon: Sparkles },
  ];

  // Calculate Student Achievements Trend Badges
  const achievementsList = useMemo(() => {
    let earlyBirdUnlocked = false;
    let earlyBirdProgress = 0;
    let deepThinkerUnlocked = false;
    let deepThinkerProgress = 0;
    
    // Streak from local storage
    const currentStreakStr = localStorage.getItem('nothing-ai-streak-current') || '0';
    const currentStreak = parseInt(currentStreakStr, 10);
    const consistentLearnerUnlocked = currentStreak >= 3;
    const consistentLearnerProgress = currentStreak;

    let totalQuestions = 0;
    conversations.forEach((conv) => {
      (conv.messages || []).forEach((msg) => {
        if (msg.role === 'user') {
          totalQuestions++;
          const date = new Date(msg.timestamp);
          // Studied before 8 AM local time
          if (date.getHours() < 8) {
            earlyBirdUnlocked = true;
            earlyBirdProgress = 1;
          }
        } else if (msg.role === 'assistant') {
          // Deep thinker: received response with substantial token length (>= 1000)
          if (msg.tokensUsed && msg.tokensUsed >= 1000) {
            deepThinkerUnlocked = true;
            deepThinkerProgress = 1;
          }
        }
      });
    });

    // Snippets saved from local storage
    
    // Model Master: used 3+ distinct personas
    const usedModels = new Set<string>();
    conversations.forEach(c => {
      if (c.personaId) usedModels.add(c.personaId);
    });
    const modelMasterUnlocked = usedModels.size >= 3;

    return [
      {
        id: 'early-bird',
        name: 'Early Bird 🌅',
        description: 'Completed a study segment or asked a question before 8:00 AM local time.',
        requirement: 'Ask a question before 8 AM',
        progress: earlyBirdProgress,
        target: 1,
        unlocked: earlyBirdUnlocked,
        icon: '🌅',
        color: 'from-amber-500 to-orange-500',
        points: 50
      },
      {
        id: 'deep-thinker',
        name: 'Deep Thinker 🧠',
        description: 'Initiated a complex problem-solving thread that produced a comprehensive reasoning breakdown (>1,000 tokens).',
        requirement: 'Obtain a reasoning reply of 1,000+ tokens',
        progress: deepThinkerProgress,
        target: 1,
        unlocked: deepThinkerUnlocked,
        icon: '🧠',
        color: 'from-indigo-500 to-purple-600',
        points: 100
      },
      {
        id: 'consistent-learner',
        name: 'Consistent Learner 🔥',
        description: 'Maintained a persistent streak of 3 consecutive daily sessions.',
        requirement: 'Achieve a 3-day daily streak',
        progress: consistentLearnerProgress,
        target: 3,
        unlocked: consistentLearnerUnlocked,
        icon: '🔥',
        color: 'from-rose-500 to-red-600',
        points: 150
      },
      {
        id: 'curious-scientist',
        name: 'Curious Scholar 🧪',
        description: 'Asked at least 10 scientific, mathematical, or humanities questions.',
        requirement: 'Ask at least 10 questions total',
        progress: totalQuestions,
        target: 10,
        unlocked: totalQuestions >= 10,
        icon: '🧪',
        color: 'from-emerald-500 to-teal-600',
        points: 80
      },
            {
        id: 'model-master',
        name: 'Model Specialist 🤖',
        description: 'Consulted at least 3 distinct specialized AI personas to tackle study material.',
        requirement: 'Use 3+ different specialized personas',
        progress: usedModels.size,
        target: 3,
        unlocked: modelMasterUnlocked,
        icon: '🤖',
        color: 'from-fuchsia-500 to-pink-600',
        points: 60
      }
    ];
  }, [conversations]);

  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Quiz Generator state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizStage, setQuizStage] = useState<'welcome' | 'loading' | 'quiz' | 'result'>('welcome');
  const [quizError, setQuizError] = useState<string | null>(null);

  const localSnippets = useMemo(() => {
    try {
      const allMessages = conversations.flatMap(c => c.messages).filter(m => m.role === 'assistant' || m.role === 'user');
      return allMessages.slice(-20).map(m => ({ text: m.content }));
    } catch (_) {
      return [];
    }
  }, [conversations, activeTab]);

  const generateQuiz = async () => {
    if (localSnippets.length === 0) return;
    setQuizStage('loading');
    setQuizError(null);
    try {
      const snippetTexts = localSnippets.map((s: any) => s.text);
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snippets: snippetTexts })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate quiz questions.');
      }

      const data = await res.json();
      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error('AI returned an empty quiz. Please try again.');
      }

      setQuizQuestions(data.quiz);
      setCurrentQuizIndex(0);
      setQuizScore(0);
      setSelectedAnswers({});
      setQuizStage('quiz');
    } catch (err: any) {
      setQuizError(err.message || 'An error occurred while generating the quiz.');
      setQuizStage('welcome');
    }
  };

  const sendChatMessage = async () => {
    if (!selectedSpace || !chatMessage.trim() || !accessToken) return;
    setSendingChat(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/workspace/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-workspace-token': accessToken
        },
        body: JSON.stringify({
          spaceId: selectedSpace.replace('spaces/', ''),
          text: chatMessage
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send message');
      }

      setChatMessage('');
      alert('Message sent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingChat(false);
    }
  };

  const fetchWorkspaceData = async (tab: string, token: string) => {
    if (tab === 'collaborative') {
      setLoading(true);
      try {
        const q = query(collection(db, 'shared_conversations'), where('isPublic', '==', true));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No ID token found");

      const endpoint = tab === 'gmail' 
        ? '/api/workspace/gmail/list' 
        : `/api/workspace/${tab}/${tab === 'chat' ? 'spaces' : 'list'}`;
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'x-workspace-token': token
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
      }

      const data = await res.json();
      if (tab === 'chat') {
        setItems(data.spaces || []);
      } else if (tab === 'tasks') {
        setItems(data.items || []);
      } else if (tab === 'keep') {
        setItems(data.notes || data.items || []);
      } else if (tab === 'gmail') {
        setItems(data.messages || []);
      } else {
        setItems(data.files || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        fetchWorkspaceData(activeTab, credential.accessToken);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchWorkspaceData(activeTab, accessToken);
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono">Workspace Integration</h2>
        {!accessToken && (
          <button 
            onClick={handleLogin}
            className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-white/90 transition"
          >
            Connect Workspace
          </button>
        )}
      </div>

      <div className="flex border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? { borderBottomColor: primary, color: accent, backgroundColor: `${primary}20` } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold transition ${
                isActive ? 'border-b-2' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="w-4 h-4" style={isActive ? { color: primary } : undefined} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'quiz' ? (
          <div className="space-y-6 animate-fadeIn pb-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>AI Smart Quiz Generator</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Formulate multiple-choice practice questions dynamically from your recent study conversations.
                </p>
              </div>
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block font-mono">Academic Quiz Engine</span>
                <span className="text-sm font-bold text-white block mt-0.5">Gemini 3.6 Flash</span>
              </div>
            </div>

            {/* Stage: Welcome */}
            {quizStage === 'welcome' && (
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-200">Prepare Your Class 11 Practice Session</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Test your understanding of complex definitions, formulas, and concepts. 
                    The quiz is customized based on your recent academic chat history.
                  </p>
                </div>

                {quizError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{quizError}</p>
                  </div>
                )}

                {localSnippets.length === 0 ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center space-y-3">
                    <p className="text-xs font-bold text-amber-300">No Chat History Found</p>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                      You haven't had any conversations yet. Start chatting about your academic topics, and the AI will generate practice questions based on your discussions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-300">Recent Chat Messages ({localSnippets.length})</span>
                      <span className="text-zinc-500">Selected for practice generation</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-white/5 rounded-xl bg-black/20 p-4 space-y-3 divide-y divide-white/5">
                      {localSnippets.map((snip: any, idx: number) => (
                        <div key={snip.id || idx} className="pt-2 first:pt-0 text-xs text-zinc-300 leading-relaxed font-mono">
                          <span className="text-amber-500 mr-2">📌</span>
                          {snip.text}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={generateQuiz}
                        className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 transition shadow-lg flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Custom Study Quiz ⚡</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stage: Loading */}
            {quizStage === 'loading' && (
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="p-3 bg-amber-500/10 rounded-full text-amber-400"
                >
                  <RefreshCw className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Analyzing Saved Concepts...</p>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Our AI is formulating 5 rigorous multiple-choice questions to test your comprehension.
                  </p>
                </div>
              </div>
            )}

            {/* Stage: Active Quiz */}
            {quizStage === 'quiz' && quizQuestions.length > 0 && (
              <div className="space-y-6">
                {/* Question Info & Progress */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="font-bold">Progress:</span>
                    <span>Question {currentQuizIndex + 1} of {quizQuestions.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Correct:</span>
                    <span className="font-bold text-green-400">{quizScore}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuizIndex) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-6">
                  <p className="text-sm font-bold text-white leading-relaxed">
                    {quizQuestions[currentQuizIndex].question}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quizQuestions[currentQuizIndex].options.map((opt: string, optIdx: number) => {
                      const answered = selectedAnswers[currentQuizIndex] !== undefined;
                      const isSelected = selectedAnswers[currentQuizIndex] === optIdx;
                      const isCorrect = quizQuestions[currentQuizIndex].correctIndex === optIdx;

                      let btnStyle = "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-200";
                      if (answered) {
                        if (isCorrect) {
                          btnStyle = "bg-green-500/20 border-green-500/40 text-green-200";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/20 border-red-500/40 text-red-200";
                        } else {
                          btnStyle = "bg-white/5 opacity-50 border-white/5 text-zinc-400";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={answered}
                          onClick={() => {
                            setSelectedAnswers(prev => ({ ...prev, [currentQuizIndex]: optIdx }));
                            const correct = quizQuestions[currentQuizIndex].correctIndex === optIdx;
                            if (correct) {
                              setQuizScore(score => score + 1);
                              // Increment Questions Answered goal progress
                              try {
                                const currentProgress = parseInt(localStorage.getItem('nothing-ai-goal-progress') || '0', 10);
                                localStorage.setItem('nothing-ai-goal-progress', String(currentProgress + 1));
                                // Dispatch storage event to alert Sidebar
                                window.dispatchEvent(new Event('storage'));
                              } catch (_) {}
                            }
                          }}
                          className={`p-4 rounded-xl text-left text-xs font-medium border transition duration-150 flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {answered && isCorrect && <span className="text-green-400 font-bold ml-2">✓</span>}
                          {answered && isSelected && !isCorrect && <span className="text-red-400 font-bold ml-2">✗</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Answer Explanation */}
                  {selectedAnswers[currentQuizIndex] !== undefined && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-2 animate-fadeIn">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-amber-400 font-mono">AI Concept Review</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {quizQuestions[currentQuizIndex].explanation}
                      </p>
                    </div>
                  )}

                  {/* Next / Finish action */}
                  {selectedAnswers[currentQuizIndex] !== undefined && (
                    <div className="flex justify-end pt-2">
                      {currentQuizIndex < quizQuestions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-black hover:bg-zinc-200 transition flex items-center gap-2"
                        >
                          <span>Next Question</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setQuizStage('result')}
                          className="px-6 py-3 rounded-xl font-bold text-xs bg-green-500 text-black hover:bg-green-400 transition shadow-lg"
                        >
                          View Results 🎉
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage: Results */}
            {quizStage === 'result' && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 text-center space-y-6">
                  <div className="max-w-md mx-auto space-y-3">
                    <span className="text-5xl">
                      {quizScore === 5 ? '🏆' : quizScore >= 3 ? '👏' : '📚'}
                    </span>
                    <h4 className="text-lg font-bold text-white">Quiz Completed!</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {quizScore === 5 
                        ? 'Exceptional! You answered all questions correctly and showed total mastery of your saved academic concepts!' 
                        : quizScore >= 3 
                        ? 'Great job! You have a solid grasp on these concepts. Keep reviewing to hit a perfect score!' 
                        : 'Good effort! Study your snippets further in your chat and take the quiz again to master the material.'}
                    </p>
                  </div>

                  {/* Score circle */}
                  <div className="flex justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-amber-500/20 flex flex-col justify-center items-center bg-amber-500/5">
                      <span className="text-3xl font-black text-amber-400">{quizScore}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">of {quizQuestions.length}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setQuizStage('welcome')}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-200 transition"
                    >
                      Quiz Setup Page
                    </button>
                    <button
                      onClick={() => {
                        setCurrentQuizIndex(0);
                        setQuizScore(0);
                        setSelectedAnswers({});
                        setQuizStage('quiz');
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 transition shadow-md"
                    >
                      Retake Quiz
                    </button>
                  </div>
                </div>

                {/* Question Review List */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-zinc-300">Detailed Question Review</p>
                  <div className="space-y-4">
                    {quizQuestions.map((q, idx) => {
                      const userAns = selectedAnswers[idx];
                      const isUserCorrect = userAns === q.correctIndex;

                      return (
                        <div key={idx} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                              isUserCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-200 leading-relaxed">{q.question}</p>
                              <div className="space-y-1 pt-1">
                                <p className="text-[11px] text-zinc-400">
                                  Your answer: <span className={isUserCorrect ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                    {q.options[userAns] || 'Unanswered'}
                                  </span>
                                </p>
                                {!isUserCorrect && (
                                  <p className="text-[11px] text-zinc-400">
                                    Correct answer: <span className="text-green-400 font-bold">{q.options[q.correctIndex]}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 text-[11px] text-zinc-400 leading-relaxed">
                            <span className="font-bold text-amber-500 font-mono block mb-1 uppercase tracking-wider text-[9px]">Explanation</span>
                            {q.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'streaks' ? (
          <DailyStreaks userId={auth.currentUser?.uid} activeTheme={activeTheme} />
        ) : activeTab === 'analytics' ? (
          <StudyAnalytics conversations={conversations} activeTheme={activeTheme} />
        ) : activeTab === 'achievements' ? (
          <div className="space-y-6 animate-fadeIn pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Student Academic Achievements</span>
                </h3>
                <p className="text-xs text-zinc-400">Awarding Class 11 students with certified academic digital badges for active learning habits.</p>
              </div>
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block font-mono">Total Study Points</span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {achievementsList.reduce((sum, ach) => sum + (ach.unlocked ? ach.points : 0), 0)} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementsList.map((badge) => {
                const percent = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between ${
                      badge.unlocked 
                        ? 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-zinc-700/60 shadow-xl' 
                        : 'bg-zinc-950/40 border-white/5 opacity-60'
                    }`}
                  >
                    {/* Glowing background light for unlocked badges */}
                    {badge.unlocked && (
                      <div className={`absolute -right-12 -top-12 w-24 h-24 bg-gradient-to-br ${badge.color} rounded-full filter blur-2xl opacity-20 pointer-events-none`} />
                    )}

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner ${badge.unlocked ? 'animate-pulse' : ''}`}>
                          {badge.icon}
                        </div>
                        {badge.unlocked ? (
                          <span className="text-[9px] font-bold uppercase font-mono tracking-widest px-2 py-1 rounded bg-amber-500/10 border border-amber-400/20 text-amber-400">
                            +{badge.points} PTS
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold uppercase font-mono tracking-widest px-2 py-1 rounded bg-white/5 text-zinc-500">
                            Locked
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {badge.name}
                          {badge.unlocked && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{badge.description}</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">Requirement: {badge.requirement}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-zinc-400 font-bold">{badge.progress} / {badge.target}</span>
                          <span className="text-zinc-500">{percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${badge.color} transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : !accessToken ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-white/5">
              <RefreshCw className="w-12 h-12 text-white/20" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Workspace not connected</p>
              <p className="text-xs text-white/40 max-w-xs">Connect your Google account to browse and use your Docs, Sheets, and more.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-white/40" />
            </motion.div>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'chat' && selectedSpace && (
              <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">Send message to space</span>
                  </div>
                  <button 
                    onClick={() => setSelectedSpace(null)}
                    className="text-[10px] text-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                  <button 
                    onClick={sendChatMessage}
                    disabled={sendingChat || !chatMessage.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
                  >
                    {sendingChat ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (activeTab === 'chat') setSelectedSpace(item.name);
                  }}
                  className={`bg-white/5 border rounded-xl p-4 transition group cursor-pointer ${
                    selectedSpace === item.name ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition">
                        {activeTab === 'docs' && <FileText className="w-5 h-5 text-blue-400" />}
                        {activeTab === 'sheets' && <Table className="w-5 h-5 text-emerald-400" />}
                        {activeTab === 'slides' && <Presentation className="w-5 h-5 text-orange-400" />}
                        {activeTab === 'forms' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                        {activeTab === 'chat' && <MessageSquare className="w-5 h-5 text-cyan-400" />}
                        {activeTab === 'tasks' && <CheckSquare className="w-5 h-5 text-blue-300" />}
                        {activeTab === 'keep' && <StickyNote className="w-5 h-5 text-yellow-400" />}
                        {activeTab === 'gmail' && <Mail className="w-5 h-5 text-rose-400" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">
                          {activeTab === 'gmail' ? `Message ID: ${item.id}` : (item.name || item.displayName || item.title || 'Untitled')}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {activeTab === 'gmail' ? `Thread ID: ${item.threadId}` : item.id}
                        </p>
                        {activeTab === 'chat' && <p className="text-[9px] text-cyan-400/60 mt-1 uppercase tracking-wider font-mono">{item.spaceType}</p>}
                        {activeTab === 'keep' && item.body?.text && <p className="text-[10px] text-white/60 mt-1 line-clamp-2">{item.body.text}</p>}
                        {activeTab === 'tasks' && <p className="text-[10px] text-white/60 mt-1 line-clamp-2">{item.updated ? new Date(item.updated).toLocaleDateString() : 'Task List'}</p>}
                        {activeTab === 'gmail' && <p className="text-[10px] text-rose-400/80 mt-1 font-mono">Gmail Message</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {(activeTab === 'docs' || activeTab === 'sheets') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewFile({ id: item.id, name: item.name, mimeType: item.mimeType });
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 transition text-emerald-400"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.webViewLink && (
                        <a 
                          href={item.webViewLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="col-span-full text-center py-12 text-xs text-white/40 font-mono">No items found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
