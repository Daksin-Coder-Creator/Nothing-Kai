import React from 'react';
import { BookOpen, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { IconAtom } from './IconAtom';

interface GuideViewProps {
  onBackToChat?: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onBackToChat }) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#000000] text-white p-6 md:p-12 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-6">
        {onBackToChat && (
          <button
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat Workspace</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
            <IconAtom variant="inline" size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Guide & Essay</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Minimalist Productivity with AI</h1>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Published by Nothing Engine Research — How distraction-free, multi-model AI workflows reclaim cognitive focus.
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. The Noise of Too Many Interfaces</h2>
          <p>
            Modern knowledge workers and developers spend hours context-switching between separate LLM subscriptions, custom playgrounds, and bloated chat applications. Each interface brings its own notification banners, cluttered sidebars, and forced recommendations.
          </p>
          <p>
            Minimalist productivity begins by stripping away visual noise and unifying your model access into a single, cohesive canvas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Selecting the Right Model for the Task</h2>
          <p>
            Not every prompt requires a 2-trillion parameter reasoning engine. Matching your problem to the appropriate model provider and price tier maximizes both speed and output quality:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
            <li><strong>Instant Lookups & Flashcards:</strong> Use fast models like <em>Gemini 2.0 Flash</em> or <em>Nano Banana</em>.</li>
            <li><strong>Conversational Code Iteration:</strong> Enable <em>Vibe Coding Mode</em> with live sandboxed previews using <em>Claude 3.5 Sonnet</em> or <em>GPT-4o</em>.</li>
            <li><strong>Complex Math & Logic Proofs:</strong> Switch to reasoning variants like <em>Gemini Thinking</em>, <em>o3-mini</em>, or <em>DeepSeek R1</em>.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Building Incremental Context with Vibe Coding</h2>
          <p>
            Instead of rewriting entire prompts or copy-pasting code snippets back and forth, Vibe Coding allows you to describe visual or functional changes in plain language ("make it darker", "add a search filter"). The engine maintains file context across turns so edits build incrementally.
          </p>
        </section>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <h3 className="font-semibold text-white text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Key Takeaways for Deep Focus</span>
          </h3>
          <p className="text-xs text-gray-300">
            Keep your workspace monochrome, rely on keyboard shortcuts, and leverage structured outputs (bullet summaries, quizzes, step-by-step solutions) to turn raw AI generation into immediate action.
          </p>
        </div>
      </div>
    </div>
  );
};
