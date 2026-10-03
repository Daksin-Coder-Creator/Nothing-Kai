import React, { useState } from 'react';
import { Sparkles, BookOpen, Code, PenTool, Search, Compass, Check } from 'lucide-react';
import { IconAtom } from './IconAtom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: (selectedUseCase: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [useCase, setUseCase] = useState<string>('coding');

  if (!isOpen) return null;

  const useCases = [
    { id: 'coding', label: 'Vibe Coding & Dev', icon: Code, desc: 'Conversational code iteration & live sandbox' },
    { id: 'business', label: 'Business & Briefs', icon: Compass, desc: 'Professional reports, summaries, and strategic planning' },
    { id: 'writing', label: 'Writing & Creative', icon: PenTool, desc: 'Drafting, refining & prompt customization' },
    { id: 'research', label: 'Deep Research', icon: Search, desc: 'Web search grounding & multi-source synthesis' },
    { id: 'general', label: 'General Productivity', icon: Compass, desc: 'All-in-one multi-model AI assistant' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#2b2b2b] rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1">
            <IconAtom variant="hero" size={48} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome to Nothing-Ai</h2>
          <p className="text-xs text-gray-400">
            Premium AI Model Marketplace powered by the distraction-free Nothing engine.
          </p>
        </div>

        {/* 4 Feature Bullets */}
        <div className="space-y-2 text-xs text-gray-300 bg-white/5 p-3.5 rounded-xl border border-white/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span><strong>6 Base Providers & 18+ Models:</strong> Access Gemini, Claude, Grok, GPT, DeepSeek & Quantum Core.</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span><strong>8 Subscription Tiers:</strong> Scale from Free Basic/Student to Pro, Expert & Ultra tier power.</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span><strong>Vibe Coding Mode:</strong> Iterate code live in a sandboxed HTML/CSS/JS preview window.</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span><strong>Interactive Productivity:</strong> Quizzes, problem solving, file reference & live charts.</span>
          </div>
        </div>

        {/* Primary Use Case Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-200">Select Your Primary Focus:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              const isSelected = useCase === uc.id;
              return (
                <button
                  key={uc.id}
                  onClick={() => setUseCase(uc.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-white/10 border-white text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-200 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>{uc.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{uc.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onClose(useCase)}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition shadow-lg"
        >
          Get Started with Nothing-Ai
        </button>
      </div>
    </div>
  );
};
