import React, { useState } from 'react';
import { X, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { PersonaId } from '../types';
import { PERSONA_LIST } from '../core/personas';
import { THEMES, ThemeId, getThemeColors } from '../core/themeConfig';

interface PersonasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePersonaId: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  onSelectPrompt?: (promptText: string) => void;
  activeTheme?: ThemeId;
}

export const PersonasDrawer: React.FC<PersonasDrawerProps> = ({
  isOpen,
  onClose,
  activePersonaId,
  onSelectPersona,
  onSelectPrompt,
  activeTheme = 'silk',
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);

  if (!isOpen) return null;

  const categories = ['All', 'Science & Theory', 'Coding & Systems', 'Design & Writing', 'Planning & QA'];

  const filteredPersonas = PERSONA_LIST.filter((p) => {
    if (filterCategory === 'Science & Theory') return ['wexel', 'qorin', 'ryzex'].includes(p.id);
    if (filterCategory === 'Coding & Systems') return ['zorin', 'valtis'].includes(p.id);
    if (filterCategory === 'Design & Writing') return ['lyren', 'qyra', 'elion'].includes(p.id);
    if (filterCategory === 'Planning & QA') return ['xaven', 'norix'].includes(p.id);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#050505] border border-[#1a1a1a] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between bg-[#000000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white border border-[#1a1a1a] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Nothing-Ai AI Personas Gallery
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#101010] text-zinc-300 font-mono border border-[#1a1a1a]">
                  10 Personas
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Single-purpose AI personas optimized for science, theory, coding, design, and reasoning.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#101010] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-[#1a1a1a] bg-[#000000] flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={filterCategory === cat ? { backgroundColor: `${primary}33`, borderColor: primary, color: accent } : undefined}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterCategory === cat
                  ? 'border'
                  : 'bg-[#050505] text-zinc-400 hover:text-white border-[#1a1a1a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Personas Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#000000]">
          {filteredPersonas.map((p) => {
            const isActive = p.id === activePersonaId;
            return (
              <div
                key={p.id}
                style={isActive ? { borderColor: primary, backgroundColor: `${primary}10` } : undefined}
                className={`
                  p-4 rounded-2xl border transition-all flex flex-col justify-between
                  ${isActive
                    ? 'border shadow-md'
                    : 'bg-[#050505] border-[#1a1a1a] hover:border-zinc-700'
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#1a1a1a] flex items-center justify-center text-white font-extrabold text-base" style={isActive ? { color: primary } : undefined}>
                        {p.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          {p.name}
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: `${primary}20`, borderColor: primary, color: primary }}>
                              Active
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">{p.tagline}</p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded border border-[#1a1a1a] bg-[#101010] text-zinc-300 font-mono">
                      {p.focusArea}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {p.roleDescription}
                  </p>

                  <div className="text-[11px] text-zinc-400 bg-[#000000] p-2 rounded-xl border border-[#1a1a1a] mb-3">
                    <strong className="text-zinc-200">Target Use:</strong> {p.targetUser}
                  </div>

                  {p.samplePrompts && p.samplePrompts.length > 0 && (
                    <div className="space-y-1 mb-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">Sample Prompts:</span>
                      <div className="space-y-1">
                        {p.samplePrompts.slice(0, 2).map((sp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onSelectPersona(p.id);
                              if (onSelectPrompt) onSelectPrompt(sp.prompt);
                              onClose();
                            }}
                            className="w-full text-left p-1.5 rounded-lg bg-[#101010] hover:bg-[#181818] border border-[#1a1a1a] hover:border-zinc-700 text-[11px] text-zinc-300 hover:text-white transition-all truncate block"
                          >
                            <span className="font-semibold text-white">[{sp.label}]</span> {sp.prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    onSelectPersona(p.id);
                    onClose();
                  }}
                  className={`
                    w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border
                    ${isActive
                      ? 'bg-zinc-800 border-zinc-700 text-white cursor-default'
                      : 'bg-[#101010] border-[#1a1a1a] hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    }
                  `}
                >
                  {isActive ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Currently Active</span>
                    </>
                  ) : (
                    <>
                      <span>Activate {p.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
