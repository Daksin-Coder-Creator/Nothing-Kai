export interface NothingAiPlan {
  id: string;
  name: string;
  description: string;
  monthly_credits: number;
  price_usd: number;
  price_inr: number;
  is_paid: boolean;
  is_custom_enterprise: boolean;
  allowed_models: string[] | "ALL";
  features: string[];
}

export const NOTHING_AI_PLANS: Record<string, NothingAiPlan> = {
  free: {
    id: "free",
    name: "Standard",
    description: "Essential casual queries & basic Q&A (Base standard tier)",
    monthly_credits: 5000,
    price_usd: 0,
    price_inr: 0,
    is_paid: false,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-4o-mini",
      "claude-3-5-haiku",
      "claude-3-haiku",
      "gemini-2-5-flash",
      "gemini-2-0-flash",
      "deepseek-v3",
      "qwen-coder",
      "sd-1-5",
      "sd-2-1",
      "sd-3-5-medium",
      "runway-gen-2",
      "pika-basic",
      "veo-lowres",
      "eleven-turbo-v2-5",
      "eleven-flash-v2-5",
      "suno-v3"
    ],
    features: ["5,000 Monthly Credits", "GPT-4o Mini & Haiku access", "Basic image/audio generation", "Standard speed execution"]
  },
  standard: {
    id: "free",
    name: "Standard",
    description: "Essential casual queries & basic Q&A (Base standard tier)",
    monthly_credits: 5000,
    price_usd: 0,
    price_inr: 0,
    is_paid: false,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-4o-mini",
      "claude-3-5-haiku",
      "claude-3-haiku",
      "gemini-2-5-flash",
      "gemini-2-0-flash",
      "deepseek-v3",
      "qwen-coder",
      "sd-1-5",
      "sd-2-1",
      "sd-3-5-medium",
      "runway-gen-2",
      "pika-basic",
      "veo-lowres",
      "eleven-turbo-v2-5",
      "eleven-flash-v2-5",
      "suno-v3"
    ],
    features: ["5,000 Monthly Credits", "GPT-4o Mini & Haiku access", "Basic image/audio generation", "Standard speed execution"]
  },
  nano: {
    id: "nano",
    name: "Nano",
    description: "Ultra-light, on-device & edge tasks",
    monthly_credits: 10000,
    price_usd: 1.99,
    price_inr: 99,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gemini-nano",
      "mistral-small",
      "ministral",
      "llama-3-1-8b",
      "codestral",
      "sd-1-5",
      "sd-2-1",
      "sd-3-5-medium",
      "gpt-image-low",
      "runway-gen-2",
      "pika-short",
      "eleven-flash-v2-5",
      "suno-v3"
    ],
    features: ["10,000 Monthly Credits", "On-device Gemini Nano", "Ultra-low latency models", "Edge computing priority"]
  },
  lite: {
    id: "lite",
    name: "Lite",
    description: "Balanced efficiency for regular learning & research",
    monthly_credits: 50000,
    price_usd: 3.99,
    price_inr: 199,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-4o-mini",
      "grok-3-mini",
      "qwen-turbo",
      "deepseek-r1-distill",
      "qwen-plus",
      "sd-3-5-large",
      "dall-e-2",
      "gpt-image-low",
      "runway-gen-3-turbo",
      "veo-short",
      "eleven-turbo-v2-5",
      "suno-v3-5"
    ],
    features: ["50,000 Monthly Credits", "DeepSeek-R1 Distill & Grok Mini", "SD 3.5 Large image creation", "2x faster queue priority"]
  },
  student: {
    id: "student",
    name: "Student",
    description: "Study help, notes, homework & student coding",
    monthly_credits: 150000,
    price_usd: 5.99,
    price_inr: 299,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-5",
      "gpt-5-1",
      "claude-3-5-sonnet",
      "claude-3-sonnet",
      "gemini-3-1-flash",
      "llama-3-1",
      "llama-3-2",
      "deepseek-v3",
      "qwen-coder",
      "qwen-plus",
      "qwen-2-5",
      "dall-e-3",
      "sd-3-5-large-turbo",
      "midjourney-v5-2",
      "runway-gen-3",
      "veo-standard",
      "pika",
      "eleven-v3",
      "suno-v4",
      "multilingual-v2"
    ],
    features: ["150,000 Monthly Credits", "GPT-5 & Claude 3.5 Sonnet", "DALL-E 3 & Midjourney v5.2", "Ideal for homework & STEM"]
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Regular coding, multi-step reasoning & creative media",
    monthly_credits: 500000,
    price_usd: 19.99,
    price_inr: 1199,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-5-2",
      "gpt-5-3-instant",
      "claude-3-7-sonnet",
      "claude-sonnet-4",
      "grok-4-fast",
      "deepseek-v4",
      "qwen-3",
      "qwen-coder",
      "mistral-large",
      "devstral",
      "dall-e-3",
      "midjourney-v6",
      "gpt-image-base",
      "runway-gen-3",
      "runway-gen-4-turbo",
      "veo-standard",
      "eleven-v3",
      "suno-v4-5",
      "eleven-music-basic"
    ],
    features: ["500,000 Monthly Credits", "GPT-5.2 & Claude 3.7 Sonnet", "Midjourney V6 & Runway Gen-3", "Full Vibe Coding & Agent mode"]
  },
  max: {
    id: "max",
    name: "Max",
    description: "Apex performance for massive datasets & long docs",
    monthly_credits: 1500000,
    price_usd: 39.99,
    price_inr: 2499,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-5-4",
      "claude-4-opus",
      "claude-sonnet-4-6",
      "gemini-3-pro",
      "gemini-3-1-flash",
      "llama-4-behemoth",
      "grok-4",
      "sonar-reasoning-pro",
      "qwen-3",
      "midjourney-v6-1",
      "gpt-image-2",
      "gemini-3-pro-image",
      "runway-gen-4-turbo",
      "veo-3-1",
      "kling-2-0",
      "eleven-v3-high",
      "suno-v5",
      "eleven-music"
    ],
    features: ["1,500,000 Monthly Credits", "GPT-5.4 & Claude Opus 4.6", "Gemini 3.1 Pro with 5M context", "High-capacity video & music synthesis"]
  },
  expert: {
    id: "expert",
    name: "Expert",
    description: "Specialized models for STEM, science & heavy engineering",
    monthly_credits: 5000000,
    price_usd: 79.99,
    price_inr: 4999,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-5-5",
      "claude-opus-4-8",
      "gemini-3-1-pro",
      "deepseek-r1",
      "deepseek-v4-pro",
      "midjourney-v7",
      "gpt-image-2-high",
      "gemini-3-1-flash-image",
      "runway-gen-4",
      "veo-3-1",
      "sora-2-beta",
      "eleven-music",
      "suno-v5-high",
      "voice-design",
      "alphafold-3",
      "nemotron-super"
    ],
    features: ["5,000,000 Monthly Credits", "AlphaFold 3 & Nemotron Super", "Midjourney V7 & Sora 2 beta", "Expert engineering & science suites"]
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    description: "Apex research-grade engines & maximum context windows",
    monthly_credits: 15000000,
    price_usd: 149.99,
    price_inr: 9999,
    is_paid: true,
    is_custom_enterprise: false,
    allowed_models: [
      "gpt-5-6-sol",
      "claude-opus-4-8-max",
      "llama-4-behemoth",
      "gpt-5-6",
      "claude-opus-4-8",
      "gemini-3-1-pro",
      "grok-4-5",
      "midjourney-v7-top",
      "gpt-image-2-top",
      "dall-e-3-max",
      "runway-gen-4-max",
      "veo-3-1-top",
      "sora-2",
      "eleven-music-top",
      "suno-v5-top",
      "voice-design-max",
      "alphafold-3",
      "nemotron-ultra"
    ],
    features: ["15,000,000 Monthly Credits", "GPT-5.6 Sol & Claude 4.8 Opus Max", "10M+ Context window", "Sora 2 & Runway Gen-4 Max"]
  },
  prime: {
    id: "prime",
    name: "Prime",
    description: "Flagship & Enterprise custom scale with complete system access",
    monthly_credits: 50000000,
    price_usd: 499.99,
    price_inr: 29999,
    is_paid: true,
    is_custom_enterprise: true,
    allowed_models: "ALL",
    features: [
      "50,000,000+ Custom Monthly Credits",
      "Access to ALL models in Nothing-Ai",
      "Custom enterprise API endpoints & SLAs",
      "Admin-configurable credit allocation",
      "Dedicated VPC infrastructure"
    ]
  }
};

const STORAGE_KEY_PREFIX = 'nothing-ai_plan_credits_';

export function getPlanCredits(planId: string): number {
  const normalized = planId === 'standard' ? 'free' : (planId || 'free').toLowerCase();
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY_PREFIX + normalized);
    if (custom !== null) {
      return parseInt(custom, 10);
    }
  }
  const plan = NOTHING_AI_PLANS[normalized] || NOTHING_AI_PLANS.free;
  return plan.monthly_credits;
}

export function setPlanCredits(planId: string, credits: number): void {
  const normalized = planId === 'standard' ? 'free' : (planId || 'free').toLowerCase();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PREFIX + normalized, credits.toString());
  }
}

export function getPlanList(): NothingAiPlan[] {
  const uniquePlanIds = ["free", "nano", "lite", "student", "pro", "max", "expert", "ultra", "prime"];
  return uniquePlanIds.map(id => getPlanById(id)).filter(Boolean);
}

export function getPlanById(planId: string): NothingAiPlan {
  let normalized = planId ? planId.toLowerCase() : "free";
  if (normalized === 'standard') normalized = 'free';
  const basePlan = NOTHING_AI_PLANS[normalized] || NOTHING_AI_PLANS.free;
  return {
    ...basePlan,
    monthly_credits: getPlanCredits(normalized)
  };
}
