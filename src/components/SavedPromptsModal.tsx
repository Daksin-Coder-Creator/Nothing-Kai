import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { ThemeId, THEMES, getThemeColors } from '../core/themeConfig';

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  prompt: string;
  isCustom?: boolean;
}

const PREBUILT_TEMPLATES: PromptTemplate[] = [
  {
    id: 't1',
    title: "Explain Like I'm New to This",
    category: 'Learning',
    prompt: 'Explain [Topic] in clear, simple terms assuming I have no prior background. Use intuitive analogies and real-world examples.',
  },
  {
    id: 't2',
    title: 'Summarize Document & Extract Key Points',
    category: 'Research',
    prompt: 'Analyze the uploaded file or provided text. Provide a 3-bullet executive summary, followed by key takeaways and actionable next steps.',
  },
  {
    id: 't3',
    title: 'Step-by-Step Problem Solving',
    category: 'Math & STEM',
    prompt: 'Solve [Problem/Equation] step-by-step in Problem-Solving Mode. Show all intermediate formulas in LaTeX math syntax, followed by the final verified solution.',
  },
  {
    id: 't4',
    title: 'Draft & Refine Writing',
    category: 'Writing',
    prompt: 'Draft an engaging piece on [Topic]. Then review and refine it for clarity, strong vocabulary, and professional tone.',
  },
  {
    id: 't5',
    title: 'Vibe Code Iteration Request',
    category: 'Coding',
    prompt: 'Build a interactive UI component in HTML/CSS/JS for [Feature]. Provide clean code blocks ready for the Vibe Coding live sandbox.',
  },
];

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
  activeTheme?: ThemeId;
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  activeTheme = 'silk',
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('nothing-ai_custom_prompts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddCustom = () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const item: PromptTemplate = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      category: 'Custom',
      prompt: newPrompt.trim(),
      isCustom: true,
    };
    const updated = [item, ...customPrompts];
    setCustomPrompts(updated);
    localStorage.setItem('nothing-ai_custom_prompts', JSON.stringify(updated));
    setNewTitle('');
    setNewPrompt('');
    setIsAdding(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customPrompts.filter((p) => p.id !== id);
    setCustomPrompts(updated);
    localStorage.setItem('nothing-ai_custom_prompts', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#2b2b2b] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white text-base">Saved Prompts & Templates</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Custom Add Form */}
          {isAdding ? (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <input
                type="text"
                placeholder="Template Title (e.g. Weekly Status Report)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
              />
              <textarea
                placeholder="Enter prompt template text..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustom}
                  className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200"
                >
                  Save Prompt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full p-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Custom Prompt Template</span>
            </button>
          )}

          {/* User Custom Prompts */}
          {customPrompts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Your Saved Custom Prompts
              </span>
              {customPrompts.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-white/20 space-y-1.5 group transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{cp.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteCustom(cp.id)}
                        className="p-1 rounded text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onSelectPrompt(cp.prompt);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white text-black hover:bg-gray-200 text-[11px] font-semibold transition"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{cp.prompt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Prebuilt Templates */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Prebuilt Standard Templates
            </span>
            {PREBUILT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3 rounded-xl bg-[#121212] border border-white/10 hover:border-white/20 space-y-1.5 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{tmpl.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 text-[10px]">
                      {tmpl.category}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectPrompt(tmpl.prompt);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition"
                  >
                    <span>Use</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{tmpl.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
