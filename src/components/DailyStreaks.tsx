import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Sparkles, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Zap, 
  GraduationCap,
  ArrowRight,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  activeDays: string[];   // YYYY-MM-DD[]
  rewardsClaimed: string[]; // reward ids
  points: number;
}

interface DailyStreaksProps {
  userId?: string | null;
  activeTheme?: string;
}

// Tailored Class 11 rewards and milestones
const STREAK_MILESTONES = [
  { id: '1', day: 1, title: 'First Quantum Leap', desc: 'Started Class 11 study streak! Unlocked Introductory Physics formulas.', reward: 'Kinematics cheat sheet', subject: 'Physics' },
  { id: '3', day: 3, title: 'Stoichiometry Specialist', desc: '3 consecutive study days! Balanced all chemical equations perfectly.', reward: 'Mole Concept mind-map', subject: 'Chemistry' },
  { id: '5', day: 5, title: 'Calculus Pioneer', desc: '5 consecutive study days! Mastered limits and derivatives fundamentals.', reward: 'Limits & Derivatives helper guide', subject: 'Mathematics' },
  { id: '7', day: 7, title: 'Bio-Energetics Scholar', desc: 'A full week of intense study! Deciphered the Krebs Cycle.', reward: 'Cellular Respiration audio-flashcard', subject: 'Biology' },
  { id: '14', day: 14, title: 'Thermodynamics Master', desc: '2 weeks of non-stop learning! Entropy has decreased in your study room.', reward: 'Thermodynamics visual summaries', subject: 'Physics/Chemistry' },
  { id: '30', day: 30, title: 'Ultimate Scholar Status', desc: '30-day streak! Ready to dominate IIT-JEE/NEET and Board Exams.', reward: 'All-subject premium rank booster packs', subject: 'All Subjects' }
];

const STUDY_QUOTES = [
  "Class 11 mechanics is 90% vector visualization and 10% math. Keep your vectors aligned!",
  "Organic Chemistry seems hard because of memorization; try drawing the mechanisms as stories.",
  "Calculus is the language of motion. Every limit is just getting closer and closer to your goal.",
  "Under pressure, carbon becomes diamond. Class 11 is where your high-pressure transformation begins.",
  "The laws of thermodynamics state you cannot get more energy out than you put in. Put in your best study energy today!"
];

export function DailyStreaks({ userId, activeTheme = 'silk' }: DailyStreaksProps) {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    activeDays: [],
    rewardsClaimed: [],
    points: 0
  });

  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [unlockedMilestone, setUnlockedMilestone] = useState<typeof STREAK_MILESTONES[0] | null>(null);
  const [randomQuote, setRandomQuote] = useState('');

  // Generate a random Class 11 motivational quote
  useEffect(() => {
    const idx = Math.floor(Math.random() * STUDY_QUOTES.length);
    setRandomQuote(STUDY_QUOTES[idx]);
  }, []);

  // Format today's date in local YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get yesterday's date in local YYYY-MM-DD
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load and update streak
  useEffect(() => {
    async function loadStreak() {
      setLoading(true);
      const today = getTodayString();
      const yesterday = getYesterdayString();
      let loadedData: StreakData | null = null;

      // 1. Try to load from Firestore if userId is present
      if (userId) {
        try {
          const docRef = doc(db, `users/${userId}/streak/status`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            loadedData = docSnap.data() as StreakData;
          }
        } catch (err) {
          console.error('Failed to fetch streak from Firestore:', err);
        }
      }

      // 2. Fall back to localStorage
      if (!loadedData) {
        const local = localStorage.getItem(`quntxai_streak_${userId || 'guest'}`);
        if (local) {
          try {
            loadedData = JSON.parse(local);
          } catch (e) {
            console.error('Failed parsing local streak:', e);
          }
        }
      }

      // 3. Initialize if empty
      if (!loadedData) {
        loadedData = {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: '',
          activeDays: [],
          rewardsClaimed: [],
          points: 0
        };
      }

      // 4. Update state with login frequency rules
      const activeDaysSet = new Set(loadedData.activeDays);
      let curStreak = loadedData.currentStreak;
      let longStreak = loadedData.longestStreak;
      let rewardToTrigger: typeof STREAK_MILESTONES[0] | null = null;
      let points = loadedData.points || 0;

      if (!activeDaysSet.has(today)) {
        // Logging in for the first time today!
        activeDaysSet.add(today);
        
        if (loadedData.lastActiveDate === yesterday) {
          // Consecutive study login!
          curStreak += 1;
        } else if (loadedData.lastActiveDate === today) {
          // Already logged in today, keep same streak
        } else {
          // Gap of more than 1 day, reset streak to 1
          curStreak = 1;
        }

        // Check if we unlocked any milestone today
        const milestone = STREAK_MILESTONES.find(m => m.day === curStreak);
        if (milestone && !loadedData.rewardsClaimed.includes(milestone.id)) {
          rewardToTrigger = milestone;
          loadedData.rewardsClaimed = [...loadedData.rewardsClaimed, milestone.id];
          points += curStreak * 50; // Earn points!
        }

        // Increment points for checking in
        points += 15;

        if (curStreak > longStreak) {
          longStreak = curStreak;
        }

        const updatedData: StreakData = {
          currentStreak: curStreak,
          longestStreak: longStreak,
          lastActiveDate: today,
          activeDays: Array.from(activeDaysSet).sort(),
          rewardsClaimed: loadedData.rewardsClaimed,
          points: points
        };

        setData(updatedData);
        saveStreakData(updatedData);

        if (curStreak > loadedData.currentStreak) {
          // Trigger congratulations reward animation!
          setShowAnimation(true);
          if (rewardToTrigger) {
            setUnlockedMilestone(rewardToTrigger);
          }
        }
      } else {
        // Today is already recorded
        setData(loadedData);
      }
      setLoading(false);
    }

    loadStreak();
  }, [userId]);

  // Save utility
  const saveStreakData = async (updated: StreakData) => {
    localStorage.setItem(`quntxai_streak_${userId || 'guest'}`, JSON.stringify(updated));
    if (userId) {
      try {
        await setDoc(doc(db, `users/${userId}/streak/status`), updated);
      } catch (err) {
        console.error('Failed storing streak in Firestore:', err);
      }
    }
  };

  const handleClaimReward = (milestoneId: string) => {
    if (data.rewardsClaimed.includes(milestoneId)) {
      alert("Reward already claimed and added to your Class 11 visual study vault!");
      return;
    }
    if (data.currentStreak < STREAK_MILESTONES.find(m => m.id === milestoneId)!.day) {
      alert("Study further to reach this streak milestone!");
      return;
    }

    const updated = {
      ...data,
      rewardsClaimed: [...data.rewardsClaimed, milestoneId],
      points: data.points + 100
    };
    setData(updated);
    saveStreakData(updated);
    alert(`Successfully unlocked premium Class 11 reward! (+100 XP added to study vault)`);
  };

  // Helper to generate the last 7 calendar days with status
  const getCalendarDays = () => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isCompleted = data.activeDays.includes(dateStr);
      list.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        dateStr,
        isCompleted,
        isToday: dateStr === getTodayString()
      });
    }
    return list;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const calendar = getCalendarDays();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER MOTIVATION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-black border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-40 h-40 text-amber-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              CLASS 11 STUDY ENGAGEMENT
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black font-mono tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Build Consistency. Conquer Class 11.
          </h3>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed italic border-l-2 border-amber-500/40 pl-3">
            "{randomQuote}"
          </p>
        </div>
      </div>

      {/* REWARD FIRE ANIMATION MODAL */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-[#121215] border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
            >
              {/* Particle Sparks Generator */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 220, x: 120 + Math.random() * 160, opacity: 0, scale: 0.3 }}
                    animate={{ 
                      y: -50, 
                      x: 100 + Math.random() * 200, 
                      opacity: [0, 1, 0], 
                      scale: [0.5, 1.2, 0.4] 
                    }}
                    transition={{ 
                      duration: 1.5 + Math.random() * 2, 
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                    className="absolute w-2 h-2 rounded-full bg-amber-400"
                  />
                ))}
              </div>

              <div className="relative z-10 space-y-5 py-4">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Flame className="w-12 h-12 text-amber-400 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">CONSECUTIVE DAYS LOGGED</div>
                  <h4 className="text-3xl font-black text-white font-mono">{data.currentStreak} Day Streak!</h4>
                </div>

                {unlockedMilestone ? (
                  <div className="bg-white/5 border border-indigo-500/20 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>UNLOCKED: {unlockedMilestone.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{unlockedMilestone.desc}</p>
                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">Claim Reward:</span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">{unlockedMilestone.reward}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300">
                    You earned <span className="text-amber-400 font-bold font-mono">+15 Study XP</span> for maintaining your consecutive focus streak today.
                  </p>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowAnimation(false);
                      setUnlockedMilestone(null);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Claim & Return to Workspace
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CURRENT STREAK CARD */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Current Streak</span>
            <p className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              {data.currentStreak} <span className="text-xs text-zinc-400 font-sans font-medium">days</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* LONGEST STREAK CARD */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Longest Streak</span>
            <p className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              {data.longestStreak} <span className="text-xs text-zinc-400 font-sans font-medium">days</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Trophy className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* STUDY COINS / XP CARD */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Study XP Points</span>
            <p className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              {data.points} <span className="text-xs text-zinc-400 font-sans font-medium">XP</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* 7 DAY CALENDAR ROW */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Focus Attendance (Last 7 Days)</h4>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {data.activeDays.length} Total active study days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendar.map((day, idx) => (
            <div 
              key={idx} 
              className={`rounded-xl p-3 flex flex-col items-center justify-center border text-center transition-all duration-200 ${
                day.isCompleted 
                  ? 'bg-indigo-500/10 border-indigo-500/35 text-white' 
                  : 'bg-zinc-950/40 border-white/5 text-zinc-500'
              } ${day.isToday ? 'ring-1 ring-amber-500/50' : ''}`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider mb-1.5">
                {day.name}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                day.isCompleted 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-white/5 text-zinc-400'
              }`}>
                {day.isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  day.dayNum
                )}
              </div>
              {day.isToday && (
                <span className="text-[8px] mt-1.5 font-bold text-amber-400 uppercase tracking-widest font-mono">Today</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* REWARD BOARD & MILESTONES */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Class 11 Milestone Rewards Vault</h4>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {data.rewardsClaimed.length} / {STREAK_MILESTONES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STREAK_MILESTONES.map((milestone) => {
            const isReached = data.currentStreak >= milestone.day;
            const isClaimed = data.rewardsClaimed.includes(milestone.id);

            return (
              <div 
                key={milestone.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition ${
                  isReached 
                    ? isClaimed 
                      ? 'bg-[#121215]/80 border-indigo-500/20' 
                      : 'bg-gradient-to-r from-indigo-950/20 to-black border-indigo-500/40 shadow-md shadow-indigo-500/5'
                    : 'bg-zinc-950/40 border-white/5 opacity-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-indigo-300 border border-white/5">
                      {milestone.subject}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 font-mono">
                      <Flame className="w-3.5 h-3.5" />
                      {milestone.day} Days
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-white">{milestone.title}</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{milestone.desc}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-500 uppercase font-mono font-bold">Reward Asset</span>
                    <span className="text-[10px] text-zinc-300 font-medium">{milestone.reward}</span>
                  </div>

                  {isReached ? (
                    isClaimed ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Claimed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimReward(milestone.id)}
                        className="py-1 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-[10px] transition shadow-md shadow-indigo-500/20 flex items-center gap-1"
                      >
                        Claim Reward
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )
                  ) : (
                    <span className="text-[9px] text-zinc-500 font-mono italic">
                      Needs {milestone.day - data.currentStreak} more days
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
