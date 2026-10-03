import quntxModelsRaw from '../quntx_models.json';
import { getPlanById } from '../plans/quntxPlans';

export type ModelProvider = 
  | 'gemini' 
  | 'claude' 
  | 'gpt' 
  | 'grok' 
  | 'deepseek' 
  | 'perplexity'
  | 'copilot'
  | 'meta'
  | 'mistral'
  | 'qwen'
  | 'image'
  | 'video'
  | 'coding'
  | 'science'
  | 'voice'
  | 'other';

export interface NothingAiModel {
  id: string;
  displayName: string;
  provider: ModelProvider;
  providerName: string;
  tierId: string;
  purpose: string;
  max_context_tokens: number;
  speed: 'fast' | 'balanced' | 'deep';
  default: boolean;
  providerModelId: string;
}

export interface NothingAiTier {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_inr: number;
  priceInInr?: number;
  monthlyCredits: number;
  monthly_credits?: number;
  is_paid?: boolean;
  is_custom_enterprise?: boolean;
  allowed_models?: string[];
  features: string[];
  models: NothingAiModel[];
}

// 9 Tier Rank order
export const TIER_RANK: Record<string, number> = {
  free: 1,
  basic: 1,
  nano: 2,
  lite: 3,
  student: 4,
  pro: 5,
  max: 6,
  expert: 7,
  ultra: 8,
  prime: 9,
};

export const PROVIDERS_LIST: { id: ModelProvider; name: string; icon: string }[] = [
  { id: 'gemini', name: 'Google Gemini', icon: 'Sparkles' },
  { id: 'claude', name: 'Claude', icon: 'Brain' },
  { id: 'gpt', name: 'OpenAI / GPT', icon: 'Bot' },
  { id: 'grok', name: 'Grok / xAI', icon: 'Zap' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'Cpu' },
  { id: 'perplexity', name: 'Perplexity', icon: 'Globe' },
  { id: 'copilot', name: 'Microsoft Copilot', icon: 'Cloud' },
  { id: 'meta', name: 'Meta Llama', icon: 'Users' },
  { id: 'mistral', name: 'Mistral', icon: 'Wind' },
  { id: 'qwen', name: 'Qwen', icon: 'Infinity' },
  { id: 'image', name: 'Image Models', icon: 'Image' },
  { id: 'video', name: 'Video Models', icon: 'Video' },
  { id: 'coding', name: 'Coding Models', icon: 'Code' },
  { id: 'science', name: 'Science & Ent', icon: 'Atom' },
  { id: 'voice', name: 'Voice & Music', icon: 'Music' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal' },
];

const rawTiersList = (quntxModelsRaw as any)?.plans || (quntxModelsRaw as any)?.tiers || [];

export const NOTHING_AI_TIERS: NothingAiTier[] = rawTiersList.map((t: any) => {
  const plan = getPlanById(t.id);
  const models = (t?.models || []).map((m: any) => ({
    ...m,
    displayName: m.display_name || m.displayName || m.id || '',
    purpose: m.purpose || '',
    provider: m.provider || 'other',
    providerName: m.provider_name || m.providerName || 'Other',
    tierId: t.id,
    max_context_tokens: m.max_context_tokens || 16000,
    speed: m.speed || 'balanced',
    default: m.default || false,
    providerModelId: m.provider_model_id || m.id || ''
  }));

  return {
    ...t,
    name: plan.name || t.name,
    description: plan.description || t.description,
    priceInInr: plan.price_inr ?? t.price_inr ?? 0,
    price_usd: plan.price_usd ?? t.price_usd ?? 0,
    monthlyCredits: plan.monthly_credits,
    is_paid: plan.is_paid,
    is_custom_enterprise: plan.is_custom_enterprise,
    allowed_models: plan.allowed_models,
    features: plan.features && plan.features.length ? plan.features : (t.features || []),
    models
  };
});

export const ALL_NOTHING_AI_MODELS: NothingAiModel[] = (NOTHING_AI_TIERS || []).flatMap((t) => t?.models || []);

export function isModelLockedForTier(modelTierId: string, userTierId: string, modelId?: string): boolean {
  if (userTierId === 'prime') return false; // Prime tier unlocks ALL models!
  if (typeof window !== 'undefined' && localStorage.getItem('quntxai_current_tier_id') === 'prime') return false;
  if (modelTierId === 'free' || modelTierId === 'basic' || modelTierId === 'standard') return false;
  
  const modelRank = TIER_RANK[modelTierId] || 1;
  const userRank = TIER_RANK[userTierId] || 1;

  return modelRank > userRank;
}

export const AUTO_MODEL: NothingAiModel = {
  id: 'auto',
  displayName: 'Self-Select',
  provider: 'gemini',
  providerName: 'Self-Select',
  tierId: 'basic',
  purpose: 'Automatically routes your prompt to the optimal AI sub-model based on intent and complexity.',
  max_context_tokens: 2000000,
  speed: 'fast',
  default: false,
  providerModelId: 'auto-select',
};

export function routePromptToBestModel(promptText: string): { selectedModel: NothingAiModel; reason: string } {
  const text = promptText.toLowerCase();

  // Coding / Bug fix / Script intent
  if (text.includes('code') || text.includes('function') || text.includes('python') || text.includes('typescript') || text.includes('react') || text.includes('bug') || text.includes('algorithm') || text.includes('html') || text.includes('sql') || text.includes('api')) {
    const model = getModelById('claude-3.7-sonnet') || getModelById('gemini-2.5-pro') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Code & Software Engineering Intent',
    };
  }

  // Math, Physics, Complex Logic Derivation
  if (text.includes('solve') || text.includes('calculus') || text.includes('derivative') || text.includes('integral') || text.includes('physics') || text.includes('equation') || text.includes('theorem') || text.includes('formula') || text.includes('proof')) {
    const model = getModelById('deepseek-r1-pro') || getModelById('o3') || getModelById('gemini-2.5-pro') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Math & Quantum Derivation Intent',
    };
  }

  // Creative Writing / Essay / Summarization
  if (text.includes('essay') || text.includes('write') || text.includes('draft') || text.includes('story') || text.includes('article') || text.includes('letter') || text.includes('poem')) {
    const model = getModelById('claude-3.7-sonnet') || getModelById('gpt-5') || getModelById('gpt-4o') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Creative Content Generation Intent',
    };
  }

  // Image Generation Intent
  if (text.includes('image') || text.includes('generate image') || text.includes('picture') || text.includes('photo') || text.includes('drawing') || text.includes('illustration') || text.includes('painting')) {
    const model = getModelById('midjourney-v7') || getModelById('dalle-3') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Image Generation Intent',
    };
  }

  // Video Generation Intent
  if (text.includes('video') || text.includes('generate video') || text.includes('animation') || text.includes('movie') || text.includes('film')) {
    const model = getModelById('runway-gen-4') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Video Generation Intent',
    };
  }

  // Audio / Music Generation Intent
  if (text.includes('audio') || text.includes('music') || text.includes('song') || text.includes('voice') || text.includes('speech') || text.includes('sound')) {
    const model = getModelById('suno-v5') || getModelById('eleven-v3') || ALL_NOTHING_AI_MODELS[0];
    return {
      selectedModel: model,
      reason: 'Audio & Music Synthesis Intent',
    };
  }

  // Default Fast Quick Response
  const model = getModelById('gemini-2.0-flash') || ALL_NOTHING_AI_MODELS[0];
  return {
    selectedModel: model,
    reason: 'Real-Time General Intelligence Intent',
  };
}

export function formatContextTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(tokens % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  return `${tokens}`;
}

export function getModelById(id: string, userTierId?: string): NothingAiModel {
  if (!id) return getDefaultModel();
  const search = id.trim().toLowerCase();
  if (search === 'auto' || search === 'auto-select') return AUTO_MODEL;

  const exact = ALL_NOTHING_AI_MODELS.find((m) => m.id.toLowerCase() === search);
  if (exact) return exact;

  const nameMatch = ALL_NOTHING_AI_MODELS.find((m) => m.displayName.toLowerCase() === search);
  if (nameMatch) return nameMatch;

  if (userTierId) {
    const tierMatch = ALL_NOTHING_AI_MODELS.find(
      (m) => m.tierId.toLowerCase() === userTierId.toLowerCase() &&
             (m.id.toLowerCase().startsWith(search) || m.displayName.toLowerCase().startsWith(search))
    );
    if (tierMatch) return tierMatch;
  }

  const prefix = ALL_NOTHING_AI_MODELS.find((m) => 
    m.id.toLowerCase().startsWith(search + '-') || 
    m.id.toLowerCase().includes(search) ||
    m.displayName.toLowerCase().includes(search)
  );
  if (prefix) return prefix;

  return getDefaultModel();
}

export function getModelsByProvider(provider: ModelProvider): NothingAiModel[] {
  return ALL_NOTHING_AI_MODELS.filter((m) => m.provider === provider);
}

export function getDefaultModel(): NothingAiModel {
  return ALL_NOTHING_AI_MODELS.find((m) => m.default) || ALL_NOTHING_AI_MODELS[0];
}

export function getTierById(tierId: string): NothingAiTier {
  const found = NOTHING_AI_TIERS.find((t) => t.id === tierId);
  return found || NOTHING_AI_TIERS[0]; // Default to basic tier
}
