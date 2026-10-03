export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic' | 'meta' | 'deepseek' | 'mistral' | 'stability' | 'runway' | 'elevenlabs' | 'suno' | 'other';
  category: 'text' | 'image' | 'audio' | 'video' | 'coding' | 'science';
  requiredTier: string;
  apiEndpoint?: string;
  fallbackModelId?: string;
  supportsStreaming?: boolean;
  capabilities: string[];
}

export const MODELS_CONFIG: Record<string, ModelConfig> = {
  // Text & Multimodal
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    category: 'text',
    requiredTier: 'free',
    fallbackModelId: 'gemini-2-5-flash',
    supportsStreaming: true,
    capabilities: ['chat', 'reasoning', 'multimodal']
  },
  'gemini-2-5-flash': {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    category: 'text',
    requiredTier: 'free',
    fallbackModelId: 'gemini-3.1-flash-lite',
    supportsStreaming: true,
    capabilities: ['chat', 'web_search', 'multimodal', 'fast']
  },
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    category: 'text',
    requiredTier: 'free',
    supportsStreaming: true,
    capabilities: ['chat', 'fast', 'quota_spared']
  },
  'claude-3-5-haiku': {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    category: 'text',
    requiredTier: 'free',
    fallbackModelId: 'gpt-4o-mini',
    supportsStreaming: true,
    capabilities: ['chat', 'fast_text']
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    category: 'text',
    requiredTier: 'student',
    fallbackModelId: 'claude-3-5-sonnet',
    supportsStreaming: true,
    capabilities: ['chat', 'advanced_reasoning', 'multimodal']
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: 'text',
    requiredTier: 'student',
    fallbackModelId: 'gemini-3-1-flash',
    supportsStreaming: true,
    capabilities: ['chat', 'coding', 'reasoning']
  },
  'gpt-5-2': {
    id: 'gpt-5-2',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    category: 'text',
    requiredTier: 'pro',
    fallbackModelId: 'claude-3-7-sonnet',
    supportsStreaming: true,
    capabilities: ['deep_reasoning', 'agentic', 'math']
  },
  'claude-3-7-sonnet': {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    category: 'text',
    requiredTier: 'pro',
    fallbackModelId: 'deepseek-v4',
    supportsStreaming: true,
    capabilities: ['hybrid_reasoning', 'coding', 'architecture']
  },

  // Image Models
  'sd-1-5': {
    id: 'sd-1-5',
    name: 'Stable Diffusion 1.5',
    provider: 'stability',
    category: 'image',
    requiredTier: 'free',
    fallbackModelId: 'sd-2-1',
    capabilities: ['text_to_image', 'fast']
  },
  'sd-2-1': {
    id: 'sd-2-1',
    name: 'Stable Diffusion 2.1',
    provider: 'stability',
    category: 'image',
    requiredTier: 'free',
    capabilities: ['text_to_image']
  },
  'gemini-3.1-flash-image-preview': {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash Image',
    provider: 'google',
    category: 'image',
    requiredTier: 'free',
    fallbackModelId: 'sd-1-5',
    capabilities: ['text_to_image', 'fast', 'high_resolution']
  },
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'google',
    category: 'image',
    requiredTier: 'max',
    fallbackModelId: 'gemini-3.1-flash-image-preview',
    capabilities: ['text_to_image', '2k_4k', 'photorealism']
  },
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    category: 'image',
    requiredTier: 'student',
    fallbackModelId: 'sd-3-5-large',
    capabilities: ['text_to_image', 'creative', 'detailed_prompt_following']
  },
  'midjourney-v6': {
    id: 'midjourney-v6',
    name: 'Midjourney V6',
    provider: 'other',
    category: 'image',
    requiredTier: 'pro',
    fallbackModelId: 'dall-e-3',
    capabilities: ['artistic_image', 'photorealism']
  },

  // Audio / Music / TTS
  'eleven-turbo-v2-5': {
    id: 'eleven-turbo-v2-5',
    name: 'Eleven Turbo v2.5',
    provider: 'elevenlabs',
    category: 'audio',
    requiredTier: 'free',
    fallbackModelId: 'gemini-3.1-flash-tts-preview',
    capabilities: ['tts', 'voice_synthesis']
  },
  'gemini-3.1-flash-tts-preview': {
    id: 'gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash TTS',
    provider: 'google',
    category: 'audio',
    requiredTier: 'free',
    capabilities: ['tts', 'multilingual']
  },
  'lyria-3-clip-preview': {
    id: 'lyria-3-clip-preview',
    name: 'Lyria 3 Music Clip',
    provider: 'google',
    category: 'audio',
    requiredTier: 'free',
    fallbackModelId: 'suno-v3',
    capabilities: ['music_clip', 'short_audio']
  },
  'lyria-3-pro-preview': {
    id: 'lyria-3-pro-preview',
    name: 'Lyria 3 Pro Full Song',
    provider: 'google',
    category: 'audio',
    requiredTier: 'student',
    fallbackModelId: 'lyria-3-clip-preview',
    capabilities: ['full_music_generation']
  },
  'suno-v3': {
    id: 'suno-v3',
    name: 'Suno V3 Music',
    provider: 'suno',
    category: 'audio',
    requiredTier: 'free',
    capabilities: ['music_synthesis']
  },

  // Video Models
  'veo-3.1-fast-generate-preview': {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Video Preview',
    provider: 'google',
    category: 'video',
    requiredTier: 'free',
    fallbackModelId: 'runway-gen-2',
    capabilities: ['text_to_video', 'image_to_video']
  },
  'runway-gen-2': {
    id: 'runway-gen-2',
    name: 'Runway Gen-2',
    provider: 'runway',
    category: 'video',
    requiredTier: 'free',
    capabilities: ['text_to_video']
  },
  'runway-gen-3': {
    id: 'runway-gen-3',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    category: 'video',
    requiredTier: 'student',
    fallbackModelId: 'runway-gen-2',
    capabilities: ['hd_video', 'camera_control']
  },
  'veo-3-1': {
    id: 'veo-3-1',
    name: 'Veo 3.1 Pro Video',
    provider: 'google',
    category: 'video',
    requiredTier: 'max',
    fallbackModelId: 'veo-3.1-fast-generate-preview',
    capabilities: ['cinematic_video', 'high_fps']
  },

  // Coding & Science
  'deepseek-v3': {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    category: 'coding',
    requiredTier: 'free',
    fallbackModelId: 'qwen-coder',
    capabilities: ['code_generation', 'debugging']
  },
  'qwen-coder': {
    id: 'qwen-coder',
    name: 'Qwen 2.5 Coder',
    provider: 'other',
    category: 'coding',
    requiredTier: 'free',
    capabilities: ['code_synthesis']
  },
  'alphafold-3': {
    id: 'alphafold-3',
    name: 'AlphaFold 3',
    provider: 'google',
    category: 'science',
    requiredTier: 'expert',
    capabilities: ['biomolecular_folding', 'molecular_structure']
  }
};

export function getModelConfig(modelId: string): ModelConfig | undefined {
  const norm = modelId ? modelId.toLowerCase() : '';
  return MODELS_CONFIG[norm] || MODELS_CONFIG[modelId];
}
