import React from 'react';
import { Sparkles, Zap, Flame, AlertCircle } from 'lucide-react';
import { TIER_TOKEN_LIMITS } from '../core/tokenLimitConfig';
import { getTierById } from '../core/modelsConfig';

interface TokenUsageBannerProps {
  currentTierId: string;
  usedTokens: number;
  onOpenUpgradeModal: () => void;
  isCompact?: boolean;
}

export const TokenUsageBanner: React.FC<TokenUsageBannerProps> = ({
  currentTierId,
  usedTokens,
  onOpenUpgradeModal,
  isCompact = false,
}) => {
  const currentTier = getTierById(currentTierId);
  const tierLimit = TIER_TOKEN_LIMITS[currentTierId]?.monthlyTokens || 10000;
  const remainingTokens = Math.max(0, tierLimit - usedTokens);
  const percentUsed = Math.min(100, Math.round((usedTokens / tierLimit) * 100));

  const isWarning = percentUsed >= 80;
  const isExceeded = percentUsed >= 100;

  function formatTokens(val: number): string {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  }

  if (isCompact) {
    return (
      <button
        onClick={onOpenUpgradeModal}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
          isExceeded
            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            : isWarning
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
        }`}
        title={`Monthly Token Usage: ${usedTokens.toLocaleString()} / ${tierLimit.toLocaleString()}`}
      >
        <Zap className="w-3 h-3 text-amber-400" />
        <span>{formatTokens(usedTokens)} / {formatTokens(tierLimit)}</span>
        <span className={`text-[10px] px-1 rounded ${isExceeded ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-gray-400'}`}>
          {percentUsed}%
        </span>
      </button>
    );
  }

  return (
    <div className={`w-full p-3 rounded-xl border transition-all ${
      isExceeded 
        ? 'bg-red-950/30 border-red-500/30 text-red-200' 
        : isWarning 
        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
        : 'bg-[#111114] border-white/10 text-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          {isExceeded ? (
            <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          ) : isWarning ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400" />
          )}
          <span className="font-semibold">{currentTier.name} Monthly Token Usage</span>
        </div>
        <button
          onClick={onOpenUpgradeModal}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
        >
          <Sparkles className="w-3 h-3" />
          <span>Upgrade Tier</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isExceeded
                ? 'bg-red-500'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-gray-400">
          <span>{usedTokens.toLocaleString()} used ({percentUsed}%)</span>
          <span>{remainingTokens.toLocaleString()} tokens left</span>
        </div>
      </div>
    </div>
  );
};
