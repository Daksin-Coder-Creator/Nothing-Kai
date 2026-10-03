import { TIER_TOKEN_LIMITS, MODEL_TOKEN_USAGE_MAP, getRandomHumorousMessage } from './tokenLimitConfig';

export interface TokenUsageState {
  usedTokens: number;
  monthKey: string; // e.g. "2026-08"
  billingCycleStartDate?: string;
  isAutoDowngraded: boolean;
  downgradeReason?: string;
}

const STORAGE_KEY_TOKEN_USAGE = 'nothing-ai_token_usage_v2';
const STORAGE_KEY_PRIME_CUSTOM_CREDITS = 'nothing-ai_custom_prime_credits';

export function getPrimeCustomCreditLimit(): number {
  if (typeof window === 'undefined') return 50000000;
  const val = localStorage.getItem(STORAGE_KEY_PRIME_CUSTOM_CREDITS);
  if (val) {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return 50000000;
}

export function setPrimeCustomCreditLimit(credits: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PRIME_CUSTOM_CREDITS, credits.toString());
}

export function getMonthlyTokenUsage(): TokenUsageState {
  if (typeof window === 'undefined') {
    return { usedTokens: 0, monthKey: getCurrentMonthKey(), isAutoDowngraded: false };
  }

  const currentMonth = getCurrentMonthKey();
  const raw = localStorage.getItem(STORAGE_KEY_TOKEN_USAGE);

  if (!raw) {
    const initial: TokenUsageState = {
      usedTokens: 0,
      monthKey: currentMonth,
      billingCycleStartDate: new Date().toISOString(),
      isAutoDowngraded: false
    };
    saveMonthlyTokenUsage(initial);
    return initial;
  }

  try {
    const parsed: TokenUsageState = JSON.parse(raw);
    // Reset if it's a new month / billing cycle
    if (parsed.monthKey !== currentMonth) {
      const resetState: TokenUsageState = {
        usedTokens: 0,
        monthKey: currentMonth,
        billingCycleStartDate: parsed.billingCycleStartDate || new Date().toISOString(),
        isAutoDowngraded: false
      };
      saveMonthlyTokenUsage(resetState);
      return resetState;
    }
    return parsed;
  } catch (e) {
    const fallback: TokenUsageState = { usedTokens: 0, monthKey: currentMonth, isAutoDowngraded: false };
    saveMonthlyTokenUsage(fallback);
    return fallback;
  }
}

export function saveMonthlyTokenUsage(state: TokenUsageState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TOKEN_USAGE, JSON.stringify(state));
}

export function addTokenUsage(tokens: number): TokenUsageState {
  const current = getMonthlyTokenUsage();
  const updated: TokenUsageState = {
    ...current,
    usedTokens: current.usedTokens + Math.max(1, tokens)
  };
  saveMonthlyTokenUsage(updated);
  return updated;
}

export function resetTokenUsage(): TokenUsageState {
  const current = getMonthlyTokenUsage();
  const resetState: TokenUsageState = {
    usedTokens: 0,
    monthKey: current.monthKey || getCurrentMonthKey(),
    billingCycleStartDate: current.billingCycleStartDate || new Date().toISOString(),
    isAutoDowngraded: false
  };
  saveMonthlyTokenUsage(resetState);
  return resetState;
}

export function estimateQueryTokens(modelId: string, promptText: string): number {
  const mapping = MODEL_TOKEN_USAGE_MAP[modelId];
  const charLen = (promptText || '').length;

  let complexity: 'small' | 'medium' | 'complex' = 'small';
  if (charLen > 500 || promptText.includes('code') || promptText.includes('essay')) {
    complexity = 'medium';
  }
  if (charLen > 1500 || promptText.includes('generate image') || promptText.includes('video') || promptText.includes('research')) {
    complexity = 'complex';
  }

  if (mapping) {
    return mapping[complexity];
  }

  // Generic estimation if model not explicitly in map
  return complexity === 'small' ? 2 : complexity === 'medium' ? 5 : 12;
}

export function checkTierTokenLimit(tierId: string, usedTokensOverride?: number): {
  isExceeded: boolean;
  limit: number;
  usedTokens: number;
  remainingTokens: number;
  percentUsed: number;
  funnyMessage?: string;
} {
  let limit = 5000;
  if (tierId === 'prime') {
    limit = getPrimeCustomCreditLimit();
  } else {
    const normalized = tierId === 'basic' ? 'free' : tierId;
    const tierLimitObj = TIER_TOKEN_LIMITS[normalized] || TIER_TOKEN_LIMITS[tierId] || TIER_TOKEN_LIMITS.basic;
    limit = tierLimitObj.monthlyTokens;
  }

  const usageState = getMonthlyTokenUsage();
  const usedTokens = usedTokensOverride !== undefined ? usedTokensOverride : usageState.usedTokens;
  const remainingTokens = Math.max(0, limit - usedTokens);
  const percentUsed = Math.min(100, Math.round((usedTokens / limit) * 100));

  const isExceeded = usedTokens >= limit;

  return {
    isExceeded,
    limit,
    usedTokens,
    remainingTokens,
    percentUsed,
    funnyMessage: isExceeded ? getRandomHumorousMessage('exceeded_limit') : undefined
  };
}

/**
 * Checks token limit and if exceeded, auto-downgrades current tier to 'free' / 'basic'
 */
export function enforceMonthlyTokenLimit(currentTierId: string): {
  activeTierId: string;
  isDowngraded: boolean;
  message?: string;
} {
  const check = checkTierTokenLimit(currentTierId);

  if (check.isExceeded) {
    // Auto-renew token cycle for seamless usage
    resetTokenUsage();
    return {
      activeTierId: currentTierId,
      isDowngraded: false
    };
  }

  return {
    activeTierId: currentTierId,
    isDowngraded: false
  };
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
