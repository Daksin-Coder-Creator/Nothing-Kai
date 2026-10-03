export interface ModelCreditCost {
  small: number;
  medium: number;
  complex: number;
}

export const model_credit_costs: Record<string, ModelCreditCost> = {
  // Free / Nano Tier Models
  'gpt-4o-mini': { small: 1, medium: 3, complex: 8 },
  'claude-3-5-haiku': { small: 1, medium: 3, complex: 7 },
  'claude-3.5-haiku': { small: 1, medium: 3, complex: 7 },
  'gemini-2-5-flash': { small: 1, medium: 3, complex: 8 },
  'gemini-2.0-flash': { small: 1, medium: 3, complex: 8 },
  'gemini-nano': { small: 1, medium: 2, complex: 5 },
  'mistral-small': { small: 1, medium: 2, complex: 6 },
  'sd-1-5': { small: 3, medium: 8, complex: 20 },
  'sd-2-1': { small: 3, medium: 8, complex: 20 },
  'sd-3-5-medium': { small: 3, medium: 8, complex: 20 },
  'runway-gen-2': { small: 5, medium: 15, complex: 40 },
  'pika-basic': { small: 5, medium: 15, complex: 40 },
  'veo-lowres': { small: 5, medium: 15, complex: 40 },
  'eleven-turbo-v2-5': { small: 3, medium: 8, complex: 20 },
  'eleven-flash-v2-5': { small: 3, medium: 8, complex: 20 },
  'suno-v3': { small: 3, medium: 8, complex: 20 },

  // Lite Tier Models
  'grok-3-mini': { small: 1, medium: 3, complex: 7 },
  'qwen-turbo': { small: 1, medium: 3, complex: 7 },
  'deepseek-r1-distill': { small: 1, medium: 3, complex: 8 },
  'sd-3-5-large': { small: 4, medium: 10, complex: 25 },
  'dall-e-2': { small: 4, medium: 10, complex: 25 },
  'runway-gen-3-turbo': { small: 6, medium: 18, complex: 45 },
  'suno-v3-5': { small: 5, medium: 12, complex: 30 },

  // Student Tier Models
  'gpt-5': { small: 2, medium: 5, complex: 12 },
  'claude-3-5-sonnet': { small: 2, medium: 5, complex: 12 },
  'claude-3.5-sonnet': { small: 2, medium: 5, complex: 12 },
  'gemini-3-1-flash': { small: 2, medium: 5, complex: 12 },
  'deepseek-v3': { small: 2, medium: 5, complex: 12 },
  'qwen-coder': { small: 2, medium: 5, complex: 12 },
  'dall-e-3': { small: 5, medium: 12, complex: 30 },
  'midjourney-v5-2': { small: 5, medium: 12, complex: 30 },
  'runway-gen-3': { small: 8, medium: 25, complex: 60 },
  'eleven-v3': { small: 5, medium: 12, complex: 30 },
  'suno-v4': { small: 5, medium: 12, complex: 30 },

  // Pro Tier Models
  'gpt-5-2': { small: 3, medium: 7, complex: 16 },
  'gpt-5.2': { small: 3, medium: 7, complex: 16 },
  'claude-3-7-sonnet': { small: 3, medium: 7, complex: 16 },
  'claude-3.7-sonnet': { small: 3, medium: 7, complex: 16 },
  'deepseek-v4': { small: 3, medium: 7, complex: 16 },
  'grok-4-fast': { small: 3, medium: 7, complex: 15 },
  'midjourney-v6': { small: 6, medium: 15, complex: 40 },
  'gpt-image-base': { small: 6, medium: 15, complex: 40 },
  'runway-gen-4-turbo': { small: 10, medium: 30, complex: 80 },
  'suno-v4-5': { small: 8, medium: 20, complex: 50 },

  // Max Tier Models
  'gpt-5-4': { small: 4, medium: 10, complex: 22 },
  'gpt-5.4': { small: 4, medium: 10, complex: 22 },
  'claude-4-opus': { small: 4, medium: 10, complex: 22 },
  'gemini-3-pro': { small: 4, medium: 10, complex: 22 },
  'midjourney-v6-1': { small: 8, medium: 20, complex: 50 },
  'gpt-image-2': { small: 8, medium: 20, complex: 50 },
  'gemini-3-pro-image': { small: 8, medium: 20, complex: 50 },
  'veo-3-1': { small: 10, medium: 30, complex: 80 },
  'suno-v5': { small: 8, medium: 20, complex: 50 },

  // Expert Tier Models
  'gpt-5-5': { small: 5, medium: 12, complex: 28 },
  'gpt-5.5': { small: 5, medium: 12, complex: 28 },
  'claude-opus-4-8': { small: 5, medium: 12, complex: 28 },
  'claude-4.8-opus': { small: 5, medium: 12, complex: 28 },
  'deepseek-v4-pro': { small: 5, medium: 12, complex: 28 },
  'midjourney-v7': { small: 10, medium: 25, complex: 60 },
  'runway-gen-4': { small: 12, medium: 35, complex: 100 },
  'sora-2-beta': { small: 12, medium: 35, complex: 100 },
  'voice-design': { small: 10, medium: 25, complex: 60 },
  'alphafold-3': { small: 20, medium: 50, complex: 150 },
  'nemotron-super': { small: 15, medium: 35, complex: 90 },

  // Ultra Tier Models
  'gpt-5-6-sol': { small: 6, medium: 15, complex: 35 },
  'gpt-5.6': { small: 6, medium: 15, complex: 35 },
  'claude-opus-4-8-max': { small: 6, medium: 15, complex: 35 },
  'llama-4-behemoth': { small: 6, medium: 15, complex: 35 },
  'grok-4-5': { small: 6, medium: 15, complex: 35 },
  'midjourney-v7-top': { small: 12, medium: 30, complex: 80 },
  'sora-2': { small: 15, medium: 45, complex: 120 },
  'eleven-music-top': { small: 12, medium: 30, complex: 80 },

  // Prime Enterprise Tier Models
  'gpt-5-6-ent': { small: 6, medium: 15, complex: 35 },
  'claude-opus-4-8-ent': { small: 6, medium: 15, complex: 35 },
  'gemini-3-1-pro-ent': { small: 6, medium: 15, complex: 35 },
  'runway-gen-4-ent': { small: 15, medium: 45, complex: 120 },
  'sora-2-ent': { small: 15, medium: 45, complex: 120 },
  'eleven-ent': { small: 12, medium: 30, complex: 80 },
  'alphafold-3-ent': { small: 20, medium: 50, complex: 150 },
};

const COST_STORAGE_KEY_PREFIX = 'nothing-ai_model_cost_';

export function getCustomModelCost(modelId: string): ModelCreditCost {
  const norm = modelId ? modelId.toLowerCase() : '';
  const defaultCost = model_credit_costs[norm] || model_credit_costs[modelId] || { small: 2, medium: 5, complex: 12 };
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(COST_STORAGE_KEY_PREFIX + norm);
    if (custom) {
      try {
        return JSON.parse(custom);
      } catch (e) {
        // ignore
      }
    }
  }
  return defaultCost;
}

export function setCustomModelCost(modelId: string, cost: ModelCreditCost): void {
  const norm = modelId ? modelId.toLowerCase() : '';
  if (typeof window !== 'undefined') {
    localStorage.setItem(COST_STORAGE_KEY_PREFIX + norm, JSON.stringify(cost));
  }
}

export function getModelCreditCost(modelId: string, taskSize: 'small' | 'medium' | 'complex' = 'medium'): number {
  const costObj = getCustomModelCost(modelId);
  return costObj[taskSize] || costObj.medium || 5;
}
