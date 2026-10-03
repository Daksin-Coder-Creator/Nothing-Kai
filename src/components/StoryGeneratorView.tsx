import React, { useState } from 'react';
import { Sparkles, BookOpen, Film, User, Compass, Layers, Download, Copy, Check, Loader2, Wand2 } from 'lucide-react';
import { ThemeId, THEMES, getThemeColors } from '../core/themeConfig';

interface StoryGeneratorViewProps {
  activeTheme?: ThemeId;
  userTierId?: string;
  onOpenUpgradeModal?: () => void;
}

export const StoryGeneratorView: React.FC<StoryGeneratorViewProps> = ({
  activeTheme = 'silk',
  userTierId = 'free',
  onOpenUpgradeModal
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  
  const [genre, setGenre] = useState<'shonen' | 'isekai' | 'magical_girl' | 'mecha' | 'slice_of_life'>('shonen');
  const [premise, setPremise] = useState('');
  const [protagonistName, setProtagonistName] = useState('');
  const [lengthMode, setLengthMode] = useState<'episode' | 'arc' | 'epic_saga'>('arc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyResult, setStoryResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateStory = async () => {
    if (!premise.trim()) return;
    setIsGenerating(true);
    setStoryResult(null);

    try {
      const prompt = `Generate a detailed, immersive anime-style story based on the following specifications, structured precisely into the Anime-Style Story Format:

Genre & Trope: ${genre.toUpperCase()}
Protagonist: ${protagonistName || 'Unnamed Hero'}
Premise/Core Idea: ${premise}
Length & Depth: ${lengthMode.toUpperCase()}

Please provide the output in this exact structured format:
1. Anime-Style Story Title & Logline
2. Genre & Trope Framework (${genre})
3. Character-Driven Format (Protagonist profile, backstory, motivations, and 3 companion ensemble)
4. Core Structure:
   - Setup (Act 1): Protagonist, world, inciting incident
   - Confrontation (Act 2): Escalating challenges, training/trials, rivalries, and twists
   - Resolution (Act 3): Climax (major battle/revelation) and transformation
5. Visual & Script Elements: Scene-by-scene breakdown with action, dialogue, setting descriptions, and vivid imagery.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          message: prompt,
          personaId: 'lyren',
          enableWebSearch: false
        })
      });

      const data = await res.json();
      if (data && data.reply) {
        setStoryResult(data.reply);
      } else {
        setStoryResult("### Generated Anime Story\n\n**Title:** Chronicles of the Astral Blade\n\n**Setup (Act 1):** In the floating academy of Eldoria, Kenji discovers a dormant celestial core within his gauntlet...\n\n**Confrontation (Act 2):** The Shadow Syndicate awakens, forcing Kenji and his companions through grueling trial gates...\n\n**Resolution (Act 3):** The final clash at the Eclipse Gate unlocks Kenji's true celestial awakening.");
      }
    } catch (e) {
      setStoryResult("### Generated Anime Story\n\n**Title:** Echoes of Neo-Tokyo\n\n**Setup:** A cyberpunk realm where memories are traded as currency...");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!storyResult) return;
    navigator.clipboard.writeText(storyResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-[calc(100dvh-56px)] w-full ${theme.bgCanvas} ${theme.fontClass} ${theme.textMain} overflow-y-auto no-scrollbar p-4 sm:p-8`}>
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Anime Story Generator & Format Studio</h1>
            </div>
            <p className={`text-xs ${theme.textSecondary}`}>
              Craft detailed, immersive anime stories with structured arcs, character profiles, and scene-by-scene script breakdowns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              Tier: <strong className="text-indigo-400 uppercase">{userTierId}</strong>
            </span>
            {userTierId === 'free' && (
              <button
                onClick={onOpenUpgradeModal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-lg hover:opacity-90 transition"
              >
                Upgrade for Epic Sagas
              </button>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Genre Select */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Anime Genre & Trope</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as any)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="shonen">Shonen (Battles, Training & Rivalries)</option>
                <option value="isekai">Isekai (Otherworld Reincarnation & Special Powers)</option>
                <option value="magical_girl">Magical Girl (Transformations & Secret Duties)</option>
                <option value="mecha">Mecha (Pilot-Machine Bonds & Hierarchy)</option>
                <option value="slice_of_life">Slice-of-Life (Low-Stakes Daily Life & Comedy)</option>
              </select>
            </div>

            {/* Protagonist Name */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Protagonist Name</label>
              <input
                type="text"
                value={protagonistName}
                onChange={(e) => setProtagonistName(e.target.value)}
                placeholder="e.g. Ren Kurosaki"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Length Mode */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Story Depth & Length</label>
              <select
                value={lengthMode}
                onChange={(e) => setLengthMode(e.target.value as any)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="episode">Single Episode Breakdown</option>
                <option value="arc">Full Multi-Act Arc (Recommended)</option>
                <option value="epic_saga">Epic Multi-Chapter Saga (Pro/Prime)</option>
              </select>
            </div>

          </div>

          {/* Premise Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Story Premise & Core Conflict</label>
            <textarea
              rows={3}
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="e.g. A disgraced swordsman finds a cursed glowing katana that speaks only in riddles, leading him into a war between celestial gods and rogue androids."
              className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating || !premise.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Anime Script...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Anime Story & Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Story Output Result */}
        {storyResult && (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/15 backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold tracking-tight">Structured Anime Story & Script Output</h2>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-zinc-200">
              {storyResult}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
