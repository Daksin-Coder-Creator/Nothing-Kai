import { NOTHING_AI_PLANS } from '../plans/quntxPlans';

// Tier Token Limits and Model Token Usage Configuration
export interface TierTokenLimit {
  id: string;
  name: string;
  monthlyTokens: number;
  description: string;
  isCustomEnterprise?: boolean;
}

export const TIER_TOKEN_LIMITS: Record<string, TierTokenLimit> = Object.fromEntries(
  Object.entries(NOTHING_AI_PLANS).map(([id, plan]) => [
    id,
    {
      id: plan.id,
      name: plan.name,
      monthlyTokens: plan.monthly_credits,
      description: plan.description,
      isCustomEnterprise: plan.is_custom_enterprise
    }
  ])
);
TIER_TOKEN_LIMITS.basic = TIER_TOKEN_LIMITS.free;

export interface ModelTokenUsage {
  modelId: string;
  requiredTier: string;
  small: number;   // credit cost for small query
  medium: number;  // credit cost for medium query
  complex: number; // credit cost for complex query
  category: 'text' | 'image' | 'video' | 'voice' | 'coding' | 'science';
  notes?: string;
}

export const MODEL_TOKEN_USAGE_MAP: Record<string, ModelTokenUsage> = {
  // Free / Nano Tier Models
  'gpt-4o-mini': { modelId: 'gpt-4o-mini', requiredTier: 'free', small: 1, medium: 3, complex: 8, category: 'text', notes: 'Fast, affordable intelligence' },
  'claude-3-5-haiku': { modelId: 'claude-3-5-haiku', requiredTier: 'free', small: 1, medium: 3, complex: 7, category: 'text', notes: 'Fastest Claude model' },
  'claude-3.5-haiku': { modelId: 'claude-3.5-haiku', requiredTier: 'free', small: 1, medium: 3, complex: 7, category: 'text', notes: 'Fastest Claude model' },
  'gemini-2-5-flash': { modelId: 'gemini-2-5-flash', requiredTier: 'free', small: 1, medium: 3, complex: 8, category: 'text', notes: 'Speed & multimodal' },
  'gemini-2.0-flash': { modelId: 'gemini-2.0-flash', requiredTier: 'free', small: 1, medium: 3, complex: 8, category: 'text', notes: 'Speed & multimodal' },
  'gemini-nano': { modelId: 'gemini-nano', requiredTier: 'nano', small: 1, medium: 2, complex: 5, category: 'text', notes: 'On-device minimal tokens' },
  'mistral-small': { modelId: 'mistral-small', requiredTier: 'nano', small: 1, medium: 2, complex: 6, category: 'text', notes: 'Efficient small model' },
  'sd-1-5': { modelId: 'sd-1-5', requiredTier: 'free', small: 3, medium: 8, complex: 20, category: 'image', notes: 'SD 1.5 standard image' },
  'sd-2-1': { modelId: 'sd-2-1', requiredTier: 'free', small: 3, medium: 8, complex: 20, category: 'image', notes: 'SD 2.1 standard image' },
  'sd-3-5-medium': { modelId: 'sd-3-5-medium', requiredTier: 'free', small: 3, medium: 8, complex: 20, category: 'image', notes: 'SD 3.5 medium image' },
  'runway-gen-2': { modelId: 'runway-gen-2', requiredTier: 'free', small: 5, medium: 15, complex: 40, category: 'video', notes: 'Gen-2 basic video' },
  'pika-basic': { modelId: 'pika-basic', requiredTier: 'free', small: 5, medium: 15, complex: 40, category: 'video', notes: 'Pika basic video' },
  'veo-lowres': { modelId: 'veo-lowres', requiredTier: 'free', small: 5, medium: 15, complex: 40, category: 'video', notes: 'Veo low-res video' },
  'eleven-turbo-v2-5': { modelId: 'eleven-turbo-v2-5', requiredTier: 'free', small: 3, medium: 8, complex: 20, category: 'voice', notes: 'Eleven Flash voice' },
  'suno-v3': { modelId: 'suno-v3', requiredTier: 'free', small: 3, medium: 8, complex: 20, category: 'voice', notes: 'Suno V3 music' },

  // Lite Tier Models
  'grok-3-mini': { modelId: 'grok-3-mini', requiredTier: 'lite', small: 1, medium: 3, complex: 7, category: 'text', notes: 'Fast research mini' },
  'qwen-turbo': { modelId: 'qwen-turbo', requiredTier: 'lite', small: 1, medium: 3, complex: 7, category: 'text', notes: 'Qwen high speed' },
  'deepseek-r1-distill': { modelId: 'deepseek-r1-distill', requiredTier: 'lite', small: 1, medium: 3, complex: 8, category: 'text', notes: 'Distilled reasoning' },
  'sd-3-5-large': { modelId: 'sd-3-5-large', requiredTier: 'lite', small: 4, medium: 10, complex: 25, category: 'image', notes: 'SD 3.5 Large' },
  'dall-e-2': { modelId: 'dall-e-2', requiredTier: 'lite', small: 4, medium: 10, complex: 25, category: 'image', notes: 'DALL-E 2 creation' },
  'runway-gen-3-turbo': { modelId: 'runway-gen-3-turbo', requiredTier: 'lite', small: 6, medium: 18, complex: 45, category: 'video', notes: 'Gen-3 Turbo video' },
  'suno-v3-5': { modelId: 'suno-v3-5', requiredTier: 'lite', small: 5, medium: 12, complex: 30, category: 'voice', notes: 'Suno V3.5 music' },

  // Student Tier Models
  'gpt-5': { modelId: 'gpt-5', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'text', notes: 'Baseline GPT-5' },
  'claude-3-5-sonnet': { modelId: 'claude-3-5-sonnet', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'text', notes: 'Student helper Sonnet' },
  'claude-3.5-sonnet': { modelId: 'claude-3.5-sonnet', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'text', notes: 'Student helper Sonnet' },
  'gemini-3-1-flash': { modelId: 'gemini-3-1-flash', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'text', notes: '3.1 Flash vision' },
  'deepseek-v3': { modelId: 'deepseek-v3', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'coding', notes: 'DeepSeek V3 reasoning' },
  'qwen-coder': { modelId: 'qwen-coder', requiredTier: 'student', small: 2, medium: 5, complex: 12, category: 'coding', notes: 'Qwen Coder model' },
  'dall-e-3': { modelId: 'dall-e-3', requiredTier: 'student', small: 5, medium: 12, complex: 30, category: 'image', notes: 'DALL-E 3 creative' },
  'midjourney-v5-2': { modelId: 'midjourney-v5-2', requiredTier: 'student', small: 5, medium: 12, complex: 30, category: 'image', notes: 'MJ V5.2 style' },
  'runway-gen-3': { modelId: 'runway-gen-3', requiredTier: 'student', small: 8, medium: 25, complex: 60, category: 'video', notes: 'Gen-3 video' },
  'eleven-v3': { modelId: 'eleven-v3', requiredTier: 'student', small: 5, medium: 12, complex: 30, category: 'voice', notes: 'Eleven v3 natural voice' },
  'suno-v4': { modelId: 'suno-v4', requiredTier: 'student', small: 5, medium: 12, complex: 30, category: 'voice', notes: 'Suno V4 music' },

  // Pro Tier Models
  'gpt-5-2': { modelId: 'gpt-5-2', requiredTier: 'pro', small: 3, medium: 7, complex: 16, category: 'text', notes: 'GPT-5.2 advanced logic' },
  'gpt-5.2': { modelId: 'gpt-5.2', requiredTier: 'pro', small: 3, medium: 7, complex: 16, category: 'text', notes: 'GPT-5.2 advanced logic' },
  'claude-3-7-sonnet': { modelId: 'claude-3-7-sonnet', requiredTier: 'pro', small: 3, medium: 7, complex: 16, category: 'text', notes: 'Claude 3.7 Pro Sonnet' },
  'claude-3.7-sonnet': { modelId: 'claude-3.7-sonnet', requiredTier: 'pro', small: 3, medium: 7, complex: 16, category: 'text', notes: 'Claude 3.7 Pro Sonnet' },
  'deepseek-v4': { modelId: 'deepseek-v4', requiredTier: 'pro', small: 3, medium: 7, complex: 16, category: 'coding', notes: 'DeepSeek V4 Pro' },
  'grok-4-fast': { modelId: 'grok-4-fast', requiredTier: 'pro', small: 3, medium: 7, complex: 15, category: 'text', notes: 'Grok 4 Fast' },
  'midjourney-v6': { modelId: 'midjourney-v6', requiredTier: 'pro', small: 6, medium: 15, complex: 40, category: 'image', notes: 'Midjourney V6' },
  'gpt-image-base': { modelId: 'gpt-image-base', requiredTier: 'pro', small: 6, medium: 15, complex: 40, category: 'image', notes: 'GPT Image Base' },
  'runway-gen-4-turbo': { modelId: 'runway-gen-4-turbo', requiredTier: 'pro', small: 10, medium: 30, complex: 80, category: 'video', notes: 'Gen-4 Turbo video' },
  'suno-v4-5': { modelId: 'suno-v4-5', requiredTier: 'pro', small: 8, medium: 20, complex: 50, category: 'voice', notes: 'Suno V4.5 Pro' },

  // Max Tier Models
  'gpt-5-4': { modelId: 'gpt-5-4', requiredTier: 'max', small: 4, medium: 10, complex: 22, category: 'text', notes: 'GPT-5.4 heavy depth' },
  'gpt-5.4': { modelId: 'gpt-5.4', requiredTier: 'max', small: 4, medium: 10, complex: 22, category: 'text', notes: 'GPT-5.4 heavy depth' },
  'claude-4-opus': { modelId: 'claude-4-opus', requiredTier: 'max', small: 4, medium: 10, complex: 22, category: 'text', notes: 'Claude 4 Opus' },
  'gemini-3-pro': { modelId: 'gemini-3-pro', requiredTier: 'max', small: 4, medium: 10, complex: 22, category: 'text', notes: 'Gemini 3 Pro' },
  'midjourney-v6-1': { modelId: 'midjourney-v6-1', requiredTier: 'max', small: 8, medium: 20, complex: 50, category: 'image', notes: 'Midjourney V6.1' },
  'gpt-image-2': { modelId: 'gpt-image-2', requiredTier: 'max', small: 8, medium: 20, complex: 50, category: 'image', notes: 'GPT Image 2' },
  'veo-3-1': { modelId: 'veo-3-1', requiredTier: 'max', small: 10, medium: 30, complex: 80, category: 'video', notes: 'Veo 3.1 video' },
  'suno-v5': { modelId: 'suno-v5', requiredTier: 'max', small: 8, medium: 20, complex: 50, category: 'voice', notes: 'Suno V5' },

  // Expert Tier Models
  'gpt-5-5': { modelId: 'gpt-5-5', requiredTier: 'expert', small: 5, medium: 12, complex: 28, category: 'text', notes: 'GPT-5.5 Expert reasoning' },
  'gpt-5.5': { modelId: 'gpt-5.5', requiredTier: 'expert', small: 5, medium: 12, complex: 28, category: 'text', notes: 'GPT-5.5 Expert reasoning' },
  'claude-opus-4-8': { modelId: 'claude-opus-4-8', requiredTier: 'expert', small: 5, medium: 12, complex: 28, category: 'text', notes: 'Claude Opus 4.8' },
  'claude-4.8-opus': { modelId: 'claude-4.8-opus', requiredTier: 'expert', small: 5, medium: 12, complex: 28, category: 'text', notes: 'Claude Opus 4.8' },
  'deepseek-v4-pro': { modelId: 'deepseek-v4-pro', requiredTier: 'expert', small: 5, medium: 12, complex: 28, category: 'coding', notes: 'DeepSeek V4 Pro' },
  'midjourney-v7': { modelId: 'midjourney-v7', requiredTier: 'expert', small: 10, medium: 25, complex: 60, category: 'image', notes: 'Midjourney V7 photorealism' },
  'runway-gen-4': { modelId: 'runway-gen-4', requiredTier: 'expert', small: 12, medium: 35, complex: 100, category: 'video', notes: 'Runway Gen-4' },
  'sora-2-beta': { modelId: 'sora-2-beta', requiredTier: 'expert', small: 12, medium: 35, complex: 100, category: 'video', notes: 'Sora 2 beta' },
  'voice-design': { modelId: 'voice-design', requiredTier: 'expert', small: 10, medium: 25, complex: 60, category: 'voice', notes: 'Voice Design studio' },
  'alphafold-3': { modelId: 'alphafold-3', requiredTier: 'expert', small: 20, medium: 50, complex: 150, category: 'science', notes: 'AlphaFold 3 science engine' },

  // Ultra Tier Models
  'gpt-5-6-sol': { modelId: 'gpt-5-6-sol', requiredTier: 'ultra', small: 6, medium: 15, complex: 35, category: 'text', notes: 'GPT-5.6 Sol peak AI' },
  'gpt-5.6': { modelId: 'gpt-5.6', requiredTier: 'ultra', small: 6, medium: 15, complex: 35, category: 'text', notes: 'GPT-5.6 Sol peak AI' },
  'claude-opus-4-8-max': { modelId: 'claude-opus-4-8-max', requiredTier: 'ultra', small: 6, medium: 15, complex: 35, category: 'text', notes: 'Claude Opus 4.8 Max' },
  'llama-4-behemoth': { modelId: 'llama-4-behemoth', requiredTier: 'ultra', small: 6, medium: 15, complex: 35, category: 'text', notes: 'Llama 4 Behemoth' },
  'grok-4-5': { modelId: 'grok-4-5', requiredTier: 'ultra', small: 6, medium: 15, complex: 35, category: 'text', notes: 'Grok 4.5' },
  'midjourney-v7-top': { modelId: 'midjourney-v7-top', requiredTier: 'ultra', small: 12, medium: 30, complex: 80, category: 'image', notes: 'Midjourney V7 Top' },
  'sora-2': { modelId: 'sora-2', requiredTier: 'ultra', small: 15, medium: 45, complex: 120, category: 'video', notes: 'Sora 2' },
  'eleven-music-top': { modelId: 'eleven-music-top', requiredTier: 'ultra', small: 12, medium: 30, complex: 80, category: 'voice', notes: 'Eleven Music Top' },

  // Prime Enterprise Tier Models
  'gpt-5-6-ent': { modelId: 'gpt-5-6-ent', requiredTier: 'prime', small: 6, medium: 15, complex: 35, category: 'text', notes: 'GPT-5.6 Enterprise' },
  'claude-opus-4-8-ent': { modelId: 'claude-opus-4-8-ent', requiredTier: 'prime', small: 6, medium: 15, complex: 35, category: 'text', notes: 'Claude Opus 4.8 Enterprise' },
  'gemini-3-1-pro-ent': { modelId: 'gemini-3-1-pro-ent', requiredTier: 'prime', small: 6, medium: 15, complex: 35, category: 'text', notes: 'Gemini 3.1 Pro Enterprise' },
  'runway-gen-4-ent': { modelId: 'runway-gen-4-ent', requiredTier: 'prime', small: 15, medium: 45, complex: 120, category: 'video', notes: 'Runway Gen-4 Enterprise' },
  'sora-2-ent': { modelId: 'sora-2-ent', requiredTier: 'prime', small: 15, medium: 45, complex: 120, category: 'video', notes: 'Sora 2 Enterprise' },
  'eleven-ent': { modelId: 'eleven-ent', requiredTier: 'prime', small: 12, medium: 30, complex: 80, category: 'voice', notes: 'Eleven Enterprise Voice' },
  'alphafold-3-ent': { modelId: 'alphafold-3-ent', requiredTier: 'prime', small: 20, medium: 50, complex: 150, category: 'science', notes: 'AlphaFold 3 Enterprise' },
};

export const HUMOROUS_UPGRADE_MESSAGES: Record<string, string[]> = {
  exceeded_limit: [
    "Whoa there, credit speed-demon! You've officially burned through your monthly token allowance! 🏎️💨 Downgraded to Free tier — click Upgrade to refuel your brainiac engine!",
    "Your monthly token tank just hit EMPTY! 🪹 Time to level up your Nothing-Ai tier before your AI starts calculating pie recipes on an abacus!",
    "Alert! You've consumed more credits than a gamer on an energy drink binge! ⚡ Switched to Free Tier. Hit Upgrade to unleash the beast again!",
    "Quota limit reached! The AI servers need a coffee break. ☕ Upgrade your tier to keep the supercomputer spinning at maximum RPM!",
  ],
  tier_mismatch_prime: [
    "Enterprise Clearance Required! The Prime tier grants unlimited access to all system models & dedicated clusters! 🚀👑",
  ],
  tier_mismatch_expert: [
    "Whoa! Trying to drive an Expert-tier Ferrari with a bicycle license? 🏎️ Upgrade to Expert tier to command this quantum mind!",
    "Nice try, rocket scientist! This model belongs to the Expert Tier mind-palace. Upgrade to unlock this brainiac! 🧠🔥",
  ],
  tier_mismatch_ultra: [
    "Attempting to launch an Ultra-tier model? That's like trying to run Crysis on a toaster! 🍞⚡ Upgrade to Ultra Tier to witness true magic!",
    "Access Denied! Ultra Tier clearance needed. Step up to Ultra Tier to wield unrivaled cognitive depth! 🚀",
  ],
  tier_mismatch_pro: [
    "Looks like you're tapping into Pro-tier intelligence! Upgrade to Pro to unlock deep reasoning models without sweating your limits. 🔮",
  ],
  tier_mismatch_general: [
    "Whoopsie! This model demands a higher security clearance! Upgrade your Nothing-Ai tier to unlock this powerhouse! 🔑🚀",
  ]
};

export function getRandomHumorousMessage(type: keyof typeof HUMOROUS_UPGRADE_MESSAGES): string {
  const list = HUMOROUS_UPGRADE_MESSAGES[type] || HUMOROUS_UPGRADE_MESSAGES.tier_mismatch_general;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}
