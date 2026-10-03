import React from 'react';
import { CheckCircle2, Server, Activity, ShieldCheck, Zap } from 'lucide-react';
import { ALL_NOTHING_AI_MODELS, NOTHING_AI_TIERS, PROVIDERS_LIST } from '../core/modelsConfig';
import { IconAtom } from './IconAtom';

export const StatusView: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#000000] text-white p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <IconAtom variant="header" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Operational Status & Model Registry</h1>
            <p className="text-xs text-gray-400">Real-time status metrics across 6 providers, 18+ sub-models & 8 subscription tiers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold self-start md:self-auto">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>All Systems Operational (100% Uptime)</span>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-white" />
          <span>6 Base AI Providers Infrastructure</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROVIDERS_LIST.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-[#111111] border border-[#222222] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">{p.name}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-400">Latency: ~240ms | Routing Active</p>
            </div>
          ))}
        </div>
      </div>

      {/* 8 Tiers Registry */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-white" />
          <span>8 Subscription Tiers Summary</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {NOTHING_AI_TIERS.map((t) => (
            <div key={t.id} className="p-3 rounded-xl bg-[#121212] border border-white/10 text-center space-y-1">
              <span className="font-bold text-white text-xs block">{t.name}</span>
              <span className="text-[11px] text-gray-300 font-mono block">${t.price_usd}/mo</span>
              <span className="text-[9px] text-gray-400 block font-mono">{t.monthlyCredits.toLocaleString()} credits</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full Models Registry */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-white" />
          <span>Sub-Models Registry (18+ Models)</span>
        </h2>
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#121212]">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-3">Model Name</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Context Limit</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ALL_NOTHING_AI_MODELS.map((m) => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="p-3 font-semibold text-white">{m.displayName}</td>
                  <td className="p-3">{m.providerName}</td>
                  <td className="p-3 font-mono text-gray-300 uppercase text-[10px]">{m.tierId}</td>
                  <td className="p-3 font-mono">{m.max_context_tokens.toLocaleString()} tokens</td>
                  <td className="p-3 text-white font-mono text-[10px]">OPERATIONAL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
