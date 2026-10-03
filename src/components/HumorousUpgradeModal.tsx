import React from 'react';
import { Sparkles, Zap, AlertTriangle, Lock, ArrowRight, X, Flame } from 'lucide-react';
import { TIER_TOKEN_LIMITS } from '../core/tokenLimitConfig';
import { NothingAiModel, getTierById } from '../core/modelsConfig';

interface HumorousUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullUpgradeModal: () => void;
  targetModel?: NothingAiModel | null;
  currentTierId: string;
  funnyMessage: string;
  reason: 'quota_exceeded' | 'tier_mismatch';
  usedTokens?: number;
}

export const HumorousUpgradeModal: React.FC<HumorousUpgradeModalProps> = ({
  isOpen,
  onClose,
  onOpenFullUpgradeModal,
  targetModel,
  currentTierId,
  funnyMessage,
  reason,
  usedTokens = 0,
}) => {
  if (!isOpen) return null;

  const currentTier = getTierById(currentTierId);
  const currentTierLimit = TIER_TOKEN_LIMITS[currentTierId]?.monthlyTokens || 10000;
  const targetTier = targetModel ? getTierById(targetModel.tierId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0c0c0e] border border-amber-500/30 shadow-2xl shadow-amber-500/10">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* Badge & Title */}
          <div className="flex items-center gap-2">
            {reason === 'quota_exceeded' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                <Flame className="w-3.5 h-3.5" />
                <span>Monthly Limit Exhausted</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Higher Tier Required</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {reason === 'quota_exceeded' ? (
                <>Out of Token Gas! ⛽</>
              ) : (
                <>Model Locked: {targetModel?.displayName || 'Power Model'} 🔒</>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              {reason === 'quota_exceeded' 
                ? 'Your monthly token quota has been depleted. We switched you to the Free tier.'
                : `You are on the ${currentTier.name} tier, but this model requires ${targetTier?.name || 'a higher'} clearance.`
              }
            </p>
          </div>

          {/* Funny Quote Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 text-amber-200 text-sm leading-relaxed italic relative">
            <span className="text-2xl text-amber-500/40 absolute top-1 left-2 select-none">“</span>
            <p className="pl-4 pr-1">{funnyMessage}</p>
          </div>

          {/* Token Status / Tier Comparison */}
          {reason === 'quota_exceeded' ? (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Consumed Tokens</span>
                <span className="font-mono text-red-400 font-semibold">{usedTokens.toLocaleString()} / {currentTierLimit.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 w-full" />
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Upgrade your tier to instantly refill up to 50M monthly tokens!
              </p>
            </div>
          ) : (
            targetModel && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-gray-400 text-[11px] block">Your Current Tier</span>
                  <p className="font-bold text-white text-sm">{currentTier.name}</p>
                  <span className="text-[10px] text-gray-400 font-mono">Limit: {(TIER_TOKEN_LIMITS[currentTierId]?.monthlyTokens || 10000).toLocaleString()} tok</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-amber-400 text-[11px] block font-semibold">Required Tier</span>
                  <p className="font-bold text-amber-300 text-sm">{targetTier?.name || 'Higher Tier'}</p>
                  <span className="text-[10px] text-amber-200/70 font-mono">Limit: {(TIER_TOKEN_LIMITS[targetModel.tierId]?.monthlyTokens || 500000).toLocaleString()} tok</span>
                </div>
              </div>
            )
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-xs font-medium transition"
            >
              Continue on Free
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenFullUpgradeModal();
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Tier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
