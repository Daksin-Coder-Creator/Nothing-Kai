import { NOTHING_AI_PLANS, getPlanById } from '../plans/quntxPlans';
import { getModelCreditCost } from '../plans/modelCreditCosts';

export interface UserCreditState {
  userId: string;
  planId: string;
  used_credits: number;
  total_credits: number;
  custom_prime_credits?: number;
  lastUpdated: string;
}

// In-memory store backed by localStorage when client-side
const userCreditStore: Record<string, UserCreditState> = {};

function getStorageKey(userId: string): string {
  return `nothing-ai_credits_v2_${userId || 'default-user'}`;
}

export function getUserCreditState(userId: string = 'default-user'): UserCreditState {
  if (userCreditStore[userId]) {
    const plan = getPlanById(userCreditStore[userId].planId);
    if (userCreditStore[userId].total_credits < plan.monthly_credits) {
      userCreditStore[userId].total_credits = plan.monthly_credits;
    }
    // Auto-renew if credits are exhausted
    if (userCreditStore[userId].used_credits >= userCreditStore[userId].total_credits) {
      userCreditStore[userId].used_credits = 0;
      saveUserCreditState(userCreditStore[userId]);
    }
    return userCreditStore[userId];
  }

  // Try loading from localStorage if in browser environment
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      try {
        const parsed: UserCreditState = JSON.parse(raw);
        const plan = getPlanById(parsed.planId);
        if (parsed.total_credits < plan.monthly_credits) {
          parsed.total_credits = plan.monthly_credits;
        }
        // Auto-renew if credits are exhausted to prevent permanent error state
        if (parsed.used_credits >= parsed.total_credits) {
          parsed.used_credits = 0;
          parsed.lastUpdated = new Date().toISOString();
        }
        userCreditStore[userId] = parsed;
        saveUserCreditState(parsed);
        return parsed;
      } catch (e) {
        // Fallthrough
      }
    }
  }

  // Default initial state
  const planId = (typeof window !== 'undefined' && localStorage.getItem('nothing-aiai_current_tier_id')) || 'free';
  const plan = getPlanById(planId);
  const initialState: UserCreditState = {
    userId,
    planId: plan.id,
    used_credits: 0,
    total_credits: plan.monthly_credits,
    lastUpdated: new Date().toISOString()
  };

  saveUserCreditState(initialState);
  return initialState;
}

export function saveUserCreditState(state: UserCreditState): void {
  userCreditStore[state.userId] = state;
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(state.userId), JSON.stringify(state));
    // Sync with existing app keys
    localStorage.setItem('nothing-aiai_used_credits', state.used_credits.toString());
    localStorage.setItem('nothing-aiai_current_tier_id', state.planId);
  }
}

export function getUserCredits(userId: string = 'default-user'): {
  userId: string;
  planId: string;
  used_credits: number;
  total_credits: number;
  remaining_credits: number;
} {
  const state = getUserCreditState(userId);
  const remaining = Math.max(0, state.total_credits - state.used_credits);
  return {
    userId: state.userId,
    planId: state.planId,
    used_credits: state.used_credits,
    total_credits: state.total_credits,
    remaining_credits: remaining
  };
}

export function deductCredits(userId: string = 'default-user', amount: number): UserCreditState {
  const state = getUserCreditState(userId);
  const safeAmount = Math.max(1, amount);

  if (state.used_credits + safeAmount > state.total_credits) {
    console.warn(`[CreditManager] Auto-renewing credits for user ${userId} as request exceeds remaining allocation.`);
    state.used_credits = 0; // Auto-renew cycle
  }

  state.used_credits += safeAmount;
  state.lastUpdated = new Date().toISOString();
  saveUserCreditState(state);

  console.log(`[CreditManager] Deducted ${safeAmount} credits from user ${userId}. New used total: ${state.used_credits}/${state.total_credits}`);
  return state;
}

export function renewCreditsOnPlanChange(
  userId: string = 'default-user',
  newPlanId: string,
  customCredits?: number
): UserCreditState {
  const plan = getPlanById(newPlanId);
  const total = customCredits !== undefined && customCredits > 0 ? customCredits : plan.monthly_credits;

  const newState: UserCreditState = {
    userId,
    planId: plan.id,
    used_credits: 0, // Reset used credits immediately on plan change/renewal
    total_credits: total,
    custom_prime_credits: customCredits,
    lastUpdated: new Date().toISOString()
  };

  saveUserCreditState(newState);
  console.log(`[CreditManager] Renewed credits for user ${userId} on plan ${plan.name} (${plan.id}). Total credits: ${total}`);
  return newState;
}

export function normalizeModelName(modelId: string): string {
  if (!modelId) return 'gpt-4o-mini';
  const norm = modelId.toLowerCase().trim();

  // Common persona / generic aliases
  if (['default', 'auto', 'auto-select', 'assistant', 'chat', 'vibe-coder', 'creative-writer', 'coder'].includes(norm)) {
    return 'gpt-4o-mini';
  }

  // Model ID mapping for variations
  const MAPPINGS: Record<string, string> = {
    'stable-diffusion-3.5-large': 'sd-3-5-large',
    'stable-diffusion-3.5-medium': 'sd-3-5-medium',
    'stable-diffusion-1.5': 'sd-1-5',
    'stable-diffusion-2.1': 'sd-2-1',
    'sd-3.5-large': 'sd-3-5-large',
    'sd-3.5-medium': 'sd-3-5-medium',
    'claude-3.5-haiku': 'claude-3-5-haiku',
    'claude-3.5-sonnet': 'claude-3-5-sonnet',
    'claude-3.7-sonnet': 'claude-3-7-sonnet',
    'gemini-2.0-flash': 'gemini-2-5-flash',
    'gemini-2.5-flash': 'gemini-2-5-flash',
    'dalle-3': 'dall-e-3',
    'dall-e-2': 'dall-e-2',
    'gpt-5.2': 'gpt-5-2',
    'gpt-5.4': 'gpt-5-4',
    'gpt-5.5': 'gpt-5-5',
    'gpt-5.6': 'gpt-5-6-sol',
  };

  return MAPPINGS[norm] || norm;
}

export function checkCanUseModel(
  userId: string = 'default-user',
  modelId: string,
  taskSize: 'small' | 'medium' | 'complex' = 'medium'
): {
  canUse: boolean;
  cost: number;
  remaining: number;
  reason?: string;
  normalizedModelId: string;
} {
  const state = getUserCreditState(userId);
  const plan = getPlanById(state.planId);
  const normalizedModelId = normalizeModelName(modelId);
  const cost = getModelCreditCost(normalizedModelId, taskSize);
  let remaining = Math.max(0, state.total_credits - state.used_credits);

  // Check model permission for user plan
  if (plan.allowed_models !== 'ALL') {
    const allowedList = Array.isArray(plan.allowed_models) ? plan.allowed_models : [];
    const isAllowed = allowedList.some(
      m => normalizeModelName(m) === normalizedModelId
    );
    if (!isAllowed) {
      return {
        canUse: false,
        cost,
        remaining,
        normalizedModelId,
        reason: `Model '${modelId}' is not included in your ${plan.name} plan. Upgrade to a higher tier to access this model.`
      };
    }
  }

  // Check remaining credits
  if (cost > remaining) {
    state.used_credits = 0;
    saveUserCreditState(state);
    remaining = state.total_credits;
  }

  return {
    canUse: true,
    cost,
    remaining,
    normalizedModelId
  };
}
