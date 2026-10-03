import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Download, Play, Trash2, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { PersonaId, UpgradeStageId } from '../types';
import { CliEngine, CliOutputLine } from '../core/cliEngine';
import { ThemeId, THEMES, getThemeColors } from '../core/themeConfig';

interface TerminalViewProps {
  activePersonaId: PersonaId;
  upgradeStage: UpgradeStageId;
  activeTheme?: ThemeId;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  activePersonaId,
  upgradeStage,
  activeTheme = 'silk',
}) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CliOutputLine[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistIndex, setCmdHistIndex] = useState<number>(-1);
  const cliRef = useRef<CliEngine | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cliRef.current = new CliEngine(activePersonaId, upgradeStage);
    setHistory(cliRef.current.history);
  }, [activePersonaId, upgradeStage]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const textStr = cmdToRun !== undefined ? cmdToRun : inputVal;
    if (!textStr.trim() || !cliRef.current) return;

    const newHist = await cliRef.current.execute(textStr);
    setHistory([...newHist]);
    setCmdHistory((prev) => [textStr, ...prev]);
    setCmdHistIndex(-1);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = Math.min(cmdHistIndex + 1, cmdHistory.length - 1);
        setCmdHistIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistIndex > 0) {
        const prevIdx = cmdHistIndex - 1;
        setCmdHistIndex(prevIdx);
        setInputVal(cmdHistory[prevIdx]);
      } else if (cmdHistIndex === 0) {
        setCmdHistIndex(-1);
        setInputVal('');
      }
    }
  };

  const downloadCliScript = () => {
    const scriptContent = `#!/usr/bin/env node
/**
 * Nothing-AiAI Standalone CLI
 */
console.log("Nothing-AiAI Terminal CLI initialized.");
`;
    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Nothing-Aiai-cli.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] font-mono text-xs overflow-hidden relative">
      {/* Terminal Top Header */}
      <div className="px-4 py-3 bg-[#111111] border-b border-[#222222] flex items-center justify-between text-neutral-300">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white/20 inline-block" />
            <span className="w-3 h-3 rounded-full bg-white/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-white/60 inline-block" />
          </div>
          <span className="font-bold text-white ml-2 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-white" />
            Nothing-Aiai-cli — developer terminal environment
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunCommand('clear')}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] flex items-center gap-1 border border-white/10"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>

          <button
            onClick={downloadCliScript}
            className="px-2.5 py-1 rounded bg-white hover:bg-gray-200 text-black text-[11px] font-semibold flex items-center gap-1 shadow"
          >
            <Download className="w-3 h-3" />
            <span>Download Node CLI</span>
          </button>
        </div>
      </div>

      {/* Quick Command Toolbar */}
      <div className="px-4 py-2 bg-[#0d0d0d] border-b border-white/10 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-gray-400 font-semibold shrink-0">Quick Commands:</span>
        {['help', 'class11 list', 'persona list', 'upgrade status', 'desktop'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white border border-white/10 shrink-0 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Console History Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 leading-relaxed">
        {history.map((line) => {
          if (line.type === 'command') {
            return (
              <div key={line.id} className="text-white font-bold flex items-center gap-2">
                <span>{line.text}</span>
                <span className="text-[10px] text-gray-500 font-normal ml-auto">{line.timestamp}</span>
              </div>
            );
          }
          if (line.type === 'system') {
            return (
              <div key={line.id} className="text-gray-300 whitespace-pre-wrap font-mono">
                {line.text}
              </div>
            );
          }
          if (line.type === 'error') {
            return (
              <div key={line.id} className="text-gray-300 font-semibold whitespace-pre-wrap border-l-2 border-white pl-2">
                {line.text}
              </div>
            );
          }
          if (line.type === 'ai') {
            return (
              <div key={line.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 whitespace-pre-wrap">
                {line.text}
              </div>
            );
          }
          return (
            <div key={line.id} className="text-neutral-300 whitespace-pre-wrap">
              {line.text}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Prompt Line */}
      <div className="p-3 bg-[#121212] border-t border-white/10 flex items-center gap-2">
        <span className="text-white font-bold shrink-0">$ Nothing-Aiai &gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 'help' or 'chat Explain Newton 2nd Law'..."
          className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs"
          autoFocus
        />
        <button
          onClick={() => handleRunCommand()}
          className="p-1.5 rounded bg-white hover:bg-gray-200 text-black font-bold"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
