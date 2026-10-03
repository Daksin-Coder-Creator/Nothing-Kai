import React, { useState } from 'react';
import { Code2, Play, Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
import { VibeCodingPreview } from '../VibeCodingPreview';
import { isModelLockedForTier } from '../../core/modelsConfig';

interface CodeBlockProps {
  code: string;
  language: string;
  index: number;
  onRun: (code: string, index: number) => void;
  activeVibeIndex: number | null;
  codeOutput: { index: number; text: string } | null;
  userTierId: string;
  onOpenUpgradeModal: () => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  index,
  onRun,
  activeVibeIndex,
  codeOutput,
  userTierId,
  onOpenUpgradeModal
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = (() => {
    const langKey = (language || '').toLowerCase();
    const grammar = Prism.languages[langKey] || Prism.languages[language] || Prism.languages.javascript || Prism.languages.markup;
    try {
      return Prism.highlight(code, grammar, language || 'javascript');
    } catch (e) {
      return code;
    }
  })();

  return (
    <div className="my-5 rounded-xl overflow-hidden border border-white/20 bg-black font-mono text-xs shadow-2xl">
      <div className="bg-neutral-900 px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-neutral-400">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-white">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          {language || 'code'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRun(code, index)}
            className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1.5 text-[11px] font-sans font-bold transition-all"
            title="Simulate Execution"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-[11px] font-sans border border-transparent hover:border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="p-5 overflow-x-auto text-neutral-200 leading-relaxed font-mono text-xs scrollbar-thin">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>

      {activeVibeIndex === index && (
        <div className="border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-500">
          <VibeCodingPreview 
            code={code}
            isGated={isModelLockedForTier('lite', userTierId)}
            onOpenUpgradeModal={onOpenUpgradeModal}
          />
        </div>
      )}

      {codeOutput?.index === index && (
        <div className="p-4 bg-neutral-950 border-t border-white/10 text-indigo-300 font-mono text-[11px] whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 mb-1 text-neutral-500 font-bold uppercase tracking-widest text-[9px]">
            <Check className="w-3 h-3" />
            Execution Output
          </div>
          {codeOutput.text}
        </div>
      )}
    </div>
  );
};
