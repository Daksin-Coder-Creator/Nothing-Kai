import React from 'react';
import { motion } from 'motion/react';
import { 
  Wand2, 
  Telescope, 
  Lightbulb, 
  Code,
  Zap,
  Globe,
  Bot
} from 'lucide-react';
import { Rotating3DAtom } from '../Rotating3DAtom';
import { ThemeId, THEMES } from '../../core/themeConfig';

interface EmptyChatStateProps {
  onChipClick: (label: string, promptText: string) => void;
  activeTheme?: ThemeId;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ 
  onChipClick, 
  activeTheme = 'silk' 
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];

  const SUGGESTIONS = [
    {
      label: 'Design System',
      prompt: 'Help me design a clean, modern design system for a mobile web application.',
      icon: <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
    },
    {
      label: 'UI Components',
      prompt: 'Create a responsive React component for a dashboard analytics card using Tailwind CSS.',
      icon: <Code className="w-3.5 h-3.5 text-emerald-400" />
    },
    {
      label: 'Deep Research',
      prompt: 'Provide a comprehensive research overview of multimodal AI architectures.',
      icon: <Telescope className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      label: 'Creative Ideas',
      prompt: 'Brainstorm 5 innovative UI features for a developer workspace.',
      icon: <Lightbulb className="w-3.5 h-3.5 text-rose-400" />
    },
    {
      label: 'Auto-Sync & Tasks',
      prompt: 'Generate an action checklist for launching a web app with automated tasks and deployment steps.',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 p-3 sm:p-6 text-center max-w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mt-2 sm:mt-4 mb-3 sm:mb-6 relative"
      >
        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative transform hover:scale-110 transition-transform duration-700">
          <Rotating3DAtom size={80} monochrome={false} themeId={activeTheme} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="w-6 h-6 sm:w-10 sm:h-10 text-white/20" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto px-2"
      >
        <h1 className={`text-2xl sm:text-4xl md:text-5xl font-black ${theme.textMain} tracking-tight mb-2 sm:mb-4`}>
          Hello, <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientHeader}`}>Designer</span>
        </h1>
        <p className={`${theme.textSecondary} text-xs sm:text-base md:text-xl font-medium leading-relaxed mb-4 sm:mb-8`}>
          I'm NothingAi, your next-generation creative intelligence. How can I accelerate your vision today?
        </p>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3">
          {SUGGESTIONS.map((s, idx) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              onClick={() => onChipClick(s.label, s.prompt)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs sm:text-sm font-bold group"
            >
              <span className="group-hover:scale-110 transition-transform">{s.icon}</span>
              {s.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="mt-6 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-8 max-w-2xl w-full px-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Ultra Fast</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Live Search</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Code className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Vibe Coding</p>
        </div>
      </div>
    </div>
  );
};
