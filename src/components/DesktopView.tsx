import React, { useState } from 'react';
import { 
  Monitor, 
  Download, 
  Keyboard, 
  CheckCircle2, 
  HardDrive, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Sparkles,
  Command
} from 'lucide-react';
import { ThemeId, THEMES, getThemeColors } from '../core/themeConfig';

interface DesktopViewProps {
  activeTheme?: ThemeId;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ activeTheme = 'silk' }) => {
  const theme = THEMES[activeTheme as ThemeId] || THEMES['silk'];
  const { primary, secondary, accent } = getThemeColors(activeTheme);
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState(true);
  const [trayEnabled, setTrayEnabled] = useState(true);
  const [globalHotkeyEnabled, setGlobalHotkeyEnabled] = useState(true);

  const downloadDesktopWrapperScript = () => {
    const code = `/**
 * Nothing-AiAI Desktop App Setup (Tauri v2 + Electron Configuration)
 * Run: npx tauri build
 */
console.log("Setting up Nothing-AiAI Desktop Wrapper Environment...");
`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Nothing-Aiai-desktop-installer.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] p-4 sm:p-6 overflow-y-auto">
      {/* Desktop App Window Container */}
      <div className="max-w-4xl mx-auto w-full bg-[#050505] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
        {/* Mock Window Header */}
        <div className="px-4 py-3 bg-[#000000] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block" />
              <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block" />
              <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block" />
            </div>
            <span className="text-xs font-bold text-zinc-300 ml-3 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-white" />
              Nothing-Ai AI Desktop Wrapper v1.0.0 (Native Environment)
            </span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
            Status: Active & Synced
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Banner */}
          <div className="p-5 rounded-2xl bg-[#101010] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#000000] text-white border border-zinc-800 flex items-center justify-center shrink-0">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Nothing-Ai AI Desktop Native Architecture</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Universal app wrapper built with Tauri v2 & Rust for sub-20MB memory footprint and zero lag.
                </p>
              </div>
            </div>

            <button
              onClick={downloadDesktopWrapperScript}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-2 transition-all border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              <span>Download Desktop Package</span>
            </button>
          </div>

          {/* Desktop Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shortcuts */}
            <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Keyboard className="w-4 h-4" />
                <span>Global Hotkeys</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Trigger Nothing-Ai AI overlay anywhere across your OS without leaving your IDE or study notes.
              </p>
              <div className="p-2.5 rounded-xl bg-[#101010] border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">Quick Palette</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">
                  Cmd + Shift + Q
                </span>
              </div>
            </div>

            {/* Offline Cache */}
            <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>Local SQLite Cache</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Save Class 11 notes, code snippets, and chat history locally on your device storage.
              </p>
              <div className="p-2.5 rounded-xl bg-[#101010] border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">Cache Size</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">
                  4.2 MB Synced
                </span>
              </div>
            </div>

            {/* Performance */}
            <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>Native Performance</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hardware accelerated webview rendering with Rust backend IPC bridge.
              </p>
              <div className="p-2.5 rounded-xl bg-[#101010] border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">RAM Usage</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">
                  ~18 MB RAM
                </span>
              </div>
            </div>
          </div>

          {/* Settings Toggles */}
          <div className="p-5 rounded-2xl bg-[#000000] border border-zinc-800 space-y-4">
            <h4 className="font-bold text-white text-sm">Desktop Preference Controls</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#101010] border border-zinc-800">
                <div>
                  <h5 className="font-semibold text-xs text-white">System Tray Quick Access</h5>
                  <p className="text-[11px] text-zinc-400">Keep Nothing-Ai AI running silently in macOS menu bar / Windows taskbar</p>
                </div>
                <input
                  type="checkbox"
                  checked={trayEnabled}
                  onChange={(e) => setTrayEnabled(e.target.checked)}
                  className="w-4 h-4 accent-zinc-500 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#101010] border border-zinc-800">
                <div>
                  <h5 className="font-semibold text-xs text-white">Local Offline Persistence</h5>
                  <p className="text-[11px] text-zinc-400">Store conversation backups locally using encrypted browser storage</p>
                </div>
                <input
                  type="checkbox"
                  checked={offlineCacheEnabled}
                  onChange={(e) => setOfflineCacheEnabled(e.target.checked)}
                  className="w-4 h-4 accent-zinc-500 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
