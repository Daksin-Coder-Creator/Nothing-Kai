import { getPlanById } from '../plans/quntxPlans';
import { getModelCreditCost } from '../plans/modelCreditCosts';
import { getUserCreditState } from '../billing/creditManager';
import { getModelConfig } from '../config/models';

export interface MediaRouterRequest {
  userId?: string;
  modality: 'image' | 'audio' | 'video';
  taskSize?: 'small' | 'medium' | 'complex';
  requestedModel?: string;
  quality?: string;
}

export interface MediaRouterResult {
  modelId: string;
  fallbackModelId?: string;
  cost: number;
  allowed: boolean;
  reason?: string;
}

// Default primary & fallback models for modalities by tier rank
const DEFAULT_MODALITY_MODELS: Record<string, { primary: string; fallback: string }> = {
  image: {
    primary: 'gemini-3.1-flash-lite-image',
    fallback: 'sd-1-5'
  },
  audio: {
    primary: 'gemini-3.1-flash-tts-preview',
    fallback: 'eleven-turbo-v2-5'
  },
  video: {
    primary: 'veo-3.1-lite-generate-preview',
    fallback: 'runway-gen-2'
  }
};

export function selectMediaModel(request: MediaRouterRequest): MediaRouterResult {
  const userId = request.userId || 'default-user';
  const modality = request.modality;
  const taskSize = request.taskSize || 'medium';
  const userState = getUserCreditState(userId);
  const plan = getPlanById(userState.planId);

  let chosenModel = request.requestedModel;

  // If pro/2K/4K requested for image, adjust default model recommendation
  if (modality === 'image' && !chosenModel && (request.quality === '2K' || request.quality === '4K' || request.quality === 'pro')) {
    if (plan.id === 'max' || plan.id === 'expert' || plan.id === 'ultra' || plan.id === 'prime') {
      chosenModel = 'gemini-3-pro-image';
    }
  }

  // Fallback to standard modality default if model not specified
  if (!chosenModel) {
    const defaults = DEFAULT_MODALITY_MODELS[modality] || DEFAULT_MODALITY_MODELS.image;
    chosenModel = defaults.primary;
  }

  // Check if chosen model is permitted by the plan
  let isAllowed = true;
  if (plan.allowed_models !== 'ALL') {
    const allowedList = Array.isArray(plan.allowed_models) ? plan.allowed_models : [];
    isAllowed = allowedList.some(m => m.toLowerCase() === chosenModel?.toLowerCase());
    
    // If requested model isn't allowed, switch to default allowed model for this modality
    if (!isAllowed) {
      console.warn(`[MediaRouter] Requested model '${chosenModel}' not allowed on plan '${plan.name}'. Selecting allowed fallback model.`);
      const defaults = DEFAULT_MODALITY_MODELS[modality] || DEFAULT_MODALITY_MODELS.image;
      chosenModel = defaults.primary;
      // Double check if default primary is allowed, else secondary fallback
      const stillAllowed = allowedList.some(m => m.toLowerCase() === (chosenModel || '').toLowerCase());
      if (!stillAllowed) {
        chosenModel = defaults.fallback;
      }
      isAllowed = true;
    }
  }

  const modelCfg = getModelConfig(chosenModel);
  const fallbackModelId = modelCfg?.fallbackModelId || DEFAULT_MODALITY_MODELS[modality]?.fallback || 'sd-1-5';
  const cost = getModelCreditCost(chosenModel, taskSize);

  const remaining = Math.max(0, userState.total_credits - userState.used_credits);
  if (cost > remaining) {
    return {
      modelId: chosenModel,
      fallbackModelId,
      cost,
      allowed: false,
      reason: `Insufficient credits for ${modality} generation. Required: ${cost} credits, Remaining: ${remaining} credits. Please upgrade your plan.`
    };
  }

  return {
    modelId: chosenModel,
    fallbackModelId,
    cost,
    allowed: true
  };
}
