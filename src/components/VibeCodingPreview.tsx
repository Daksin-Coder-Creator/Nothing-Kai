import React, { useState } from 'react';
import { Play, Code, RefreshCw, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';

interface VibeCodingPreviewProps {
  code: string;
  isGated: boolean;
  onOpenUpgradeModal: () => void;
}

export const VibeCodingPreview: React.FC<VibeCodingPreviewProps> = ({
  code,
  isGated,
  onOpenUpgradeModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate safe data URL for sandboxed iframe
  const getProcessedContent = () => {
    const isReact = code.includes('React') || code.includes('import') || code.includes('export') || code.includes('<') && (code.includes('=>') || code.includes('function'));
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        ${isReact ? `
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        ` : ''}
        <style>
          body { 
            background-color: #0d0d0d; 
            color: #ffffff; 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 16px;
            margin: 0;
            overflow-x: hidden;
          }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #0d0d0d; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #444; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        ${code.includes('<html') ? code : `
          ${isReact ? `
            <script type="text/babel">
              const { useState, useEffect, useRef, useMemo, useCallback } = React;
              
              try {
                ${code.includes('ReactDOM') ? code : `
                  function App() {
                    ${code.includes('export default') ? code.replace(/export default/g, 'return') : code}
                  }
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<App />);
                `}
              } catch (err) {
                document.getElementById('root').innerHTML = '<div style="color: #ff6b6b; padding: 20px; border: 1px solid #ff6b6b; border-radius: 8px; background: rgba(255,107,107,0.1)"><strong>Execution Error:</strong><pre style="margin-top: 10px; white-space: pre-wrap;">' + err.message + '</pre></div>';
              }
            </script>
          ` : `
            <div id="app">${code.includes('<') ? code : `<pre>${code}</pre>`}</div>
          `}
        `}
        <script>
          window.onerror = function(msg, url, line, col, error) {
            const root = document.getElementById('root') || document.body;
            root.innerHTML = '<div style="color: #ff6b6b; padding: 20px; border: 1px solid #ff6b6b; border-radius: 8px; background: rgba(255,107,107,0.1)"><strong>Runtime Error:</strong><pre style="margin-top: 10px; white-space: pre-wrap;">' + msg + '</pre></div>';
            return false;
          };
        </script>
      </body>
      </html>
    `;
  };

  if (isGated) {
    return (
      <div className="w-full h-64 border border-white/10 rounded-xl bg-[#000000] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-semibold text-white text-sm mb-1">Vibe Coding Live Sandbox is Gated</h4>
        <p className="text-xs text-gray-400 max-w-sm mb-4">
          Interactive live HTML/CSS/JS rendering requires Lite, Pro or higher plan tiers.
        </p>
        <button
          onClick={onOpenUpgradeModal}
          className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200 transition"
        >
          Upgrade Plan to Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="w-full border border-white/10 rounded-xl bg-[#000000] overflow-hidden my-3 shadow-xl">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121212] border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <Code className="w-4 h-4 text-white" />
          <span className="font-semibold text-white">Vibe Coding Live Sandbox</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 text-[10px] border border-white/20 font-mono">
            Secured Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] border border-white/10 transition"
          >
            {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <div className="w-full h-72 bg-[#0d0d0d] relative">
        <iframe
          key={refreshKey}
          title="Vibe Coding Live Preview"
          srcDoc={getProcessedContent()}
          sandbox="allow-scripts"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};
