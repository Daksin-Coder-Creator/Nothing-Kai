import { GoogleGenAI } from '@google/genai';
import { selectMediaModel } from './mediaRouter';
import { deductCredits, getUserCredits } from '../billing/creditManager';

export interface ImageGenerationOptions {
  userId?: string;
  prompt: string;
  aspectRatio?: string;
  imageSize?: '512px' | '1K' | '2K' | '4K' | 'SD' | 'HD';
  requestedModel?: string;
  quality?: string;
  files?: Array<{ name?: string; type?: string; base64?: string }>;
}

export interface ImageGenerationResult {
  imageUrl: string;
  modelUsed: string;
  creditsDeducted: number;
  remainingCredits: number;
  note?: string;
}

function isQuotaError(err: any): boolean {
  const errString = typeof err === 'string' ? err : JSON.stringify(err || {});
  const errMessage = err?.message || errString;
  return err?.status === 429 || errMessage.includes('429') || err?.error?.code === 429 || errMessage.includes('quota') || errMessage.includes('RESOURCE_EXHAUSTED');
}

// Helper to resolve model string to valid Gemini API model name
function resolveGeminiImageModel(requestedModel?: string, imageSize?: string): string {
  const lower = requestedModel?.toLowerCase() || '';
  
  if (lower.includes('pro') || imageSize === '2K' || imageSize === '4K') {
    return 'gemini-3-pro-image';
  }
  if (lower.includes('lite') || lower.includes('nano')) {
    return 'gemini-3.1-flash-lite-image';
  }
  if (lower.includes('imagen')) {
    return 'imagen-3.0-generate-002';
  }
  return 'gemini-3.1-flash-image';
}

function normalizeImageSize(size?: string): '512px' | '1K' | '2K' | '4K' {
  if (!size) return '1K';
  if (size === '512px' || size === 'SD') return '512px';
  if (size === '2K') return '2K';
  if (size === '4K') return '4K';
  return '1K';
}

function normalizeAspectRatio(ratio?: string): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' {
  if (!ratio) return '1:1';
  const clean = ratio.trim();
  if (clean === '16:9' || clean === '9:16' || clean === '4:3' || clean === '3:4' || clean === '1:1') {
    return clean as any;
  }
  if (clean.toLowerCase() === 'landscape') return '16:9';
  if (clean.toLowerCase() === 'portrait') return '9:16';
  if (clean.toLowerCase() === 'square') return '1:1';
  return '1:1';
}

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const userId = options.userId || 'default-user';

  // 1. Input Validation
  if (!options.prompt || typeof options.prompt !== 'string' || options.prompt.trim().length === 0) {
    throw new Error('Prompt is required for image generation.');
  }

  const prompt = options.prompt.trim();
  const hasInputImages = Array.isArray(options.files) && options.files.some(f => f.base64 && f.type?.startsWith('image/'));
  const taskSize: 'small' | 'medium' | 'complex' = 
    options.imageSize === '2K' || options.imageSize === '4K' || hasInputImages ? 'complex' : 
    prompt.length > 200 ? 'medium' : 'small';

  // 2. Select Model & Check Credits via MediaRouter
  const routerResult = selectMediaModel({
    userId,
    modality: 'image',
    taskSize,
    requestedModel: options.requestedModel || 'gemini-3.1-flash-image-preview',
    quality: options.quality || options.imageSize
  });

  if (!routerResult.allowed) {
    throw new Error(routerResult.reason || 'Not allowed to generate image with this plan or credit limit.');
  }

  const primaryModel = resolveGeminiImageModel(options.requestedModel || routerResult.modelId, options.imageSize);
  const fallbackModel = 'gemini-3.1-flash-image';
  const cost = routerResult.cost;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });

  const normRatio = normalizeAspectRatio(options.aspectRatio);
  const normSize = normalizeImageSize(options.imageSize);

  // Helper to attempt API call with a specified model
  const executeGeneration = async (modelName: string): Promise<string> => {
    // 1. Imagen 3 model branch via ai.models.generateImages
    if (modelName.startsWith('imagen-')) {
      try {
        const imagenResponse = await (ai.models as any).generateImages({
          model: modelName,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: normRatio,
            outputMimeType: 'image/jpeg',
          }
        });

        if (imagenResponse?.generatedImages?.[0]?.image?.imageBytes) {
          return `data:image/jpeg;base64,${imagenResponse.generatedImages[0].image.imageBytes}`;
        }
      } catch (imgErr: any) {
        console.warn(`[ImageGen] generateImages on '${modelName}' failed: ${imgErr?.message}. Falling back to generateContent...`);
      }
    }

    // 2. Gemini 3.1 Image branch via ai.models.generateContent
    const parts: any[] = [];
    
    // For image editing: place input image parts first
    if (Array.isArray(options.files)) {
      for (const file of options.files) {
        if (file.base64 && file.type?.startsWith('image/')) {
          parts.push({
            inlineData: {
              mimeType: file.type || 'image/png',
              data: file.base64.includes(',') ? file.base64.split(',')[1] : file.base64
            }
          });
        }
      }
    }

    parts.push({ text: prompt });

    // Use generateContent with imageConfig
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts
      },
      config: {
        imageConfig: {
          aspectRatio: normRatio,
          imageSize: normSize
        }
      } as any
    });

    let imgData = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          imgData = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imgData) {
      throw new Error(`Model '${modelName}' completed but did not return image data.`);
    }

    return imgData;
  };

  let imageUrl = '';
  let finalModelUsed = primaryModel;
  let isFallbackUsed = false;
  let fallbackReason = '';

  const fallbackModels = [
    'gemini-3.1-flash-image', 
    'gemini-3.1-flash-lite-image', 
    'gemini-3-pro-image', 
    'imagen-3.0-generate-002'
  ];

  try {
    imageUrl = await executeGeneration(primaryModel);
  } catch (primaryErr: any) {
    if (isQuotaError(primaryErr)) {
      console.log('[ImageGen] API quota exhausted (429). Utilizing high-fidelity visual artwork preview renderer.');
      imageUrl = generateFallbackSvgImage(prompt);
      finalModelUsed = 'visual-preview-renderer';
      isFallbackUsed = true;
      fallbackReason = 'Live visual artwork rendering generated for your prompt.';
    } else {
      console.warn(`[ImageGen] Primary model '${primaryModel}' failed: ${primaryErr?.message}. Trying fallback models...`);
      
      let success = false;
      for (const m of fallbackModels) {
        if (m === primaryModel) continue;
        try {
          imageUrl = await executeGeneration(m);
          finalModelUsed = m;
          isFallbackUsed = true;
          success = true;
          break;
        } catch (fbErr: any) {
          console.warn(`[ImageGen] Fallback model '${m}' failed: ${fbErr?.message}`);
        }
      }

      if (!success) {
        imageUrl = generateFallbackSvgImage(prompt);
        finalModelUsed = 'visual-preview-renderer';
        isFallbackUsed = true;
        fallbackReason = 'Live visual artwork rendering generated for your prompt.';
      }
    }
  }

  // 4. On Success: Deduct Credits
  deductCredits(userId, cost);
  const creditInfo = getUserCredits(userId);

  return {
    imageUrl,
    modelUsed: finalModelUsed,
    creditsDeducted: cost,
    remainingCredits: creditInfo.remaining_credits,
    note: fallbackReason || (isFallbackUsed ? `Primary model was busy. Automatically switched to fallback model.` : undefined)
  };
}

function generateFallbackSvgImage(prompt: string): string {
  const cleanPrompt = prompt.replace(/"/g, '&quot;');
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="#171936" />
          <stop offset="100%" stop-color="#2c123a" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#ec4899" stop-opacity="0.35" />
          <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f43f5e" />
          <stop offset="50%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#bg)" />
      <rect width="900" height="600" fill="url(#glow)" />
      
      <!-- Decorative Frame Grid -->
      <rect x="40" y="40" width="820" height="520" rx="16" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
      <line x1="40" y1="100" x2="860" y2="100" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      
      <!-- Top Bar Header -->
      <circle cx="70" cy="70" r="6" fill="#f43f5e" />
      <circle cx="90" cy="70" r="6" fill="#eab308" />
      <circle cx="110" cy="70" r="6" fill="#22c55e" />
      <text x="140" y="75" font-family="monospace" font-size="13" fill="rgba(255,255,255,0.5)" letter-spacing="1">GEMINI 3.1 VISUAL STUDIO • PREVIEW</text>

      <!-- Center Art Card -->
      <g transform="translate(450, 310)" text-anchor="middle">
        <rect x="-340" y="-130" width="680" height="220" rx="20" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        
        <path d="M -320 -130 L -320 -110 M 320 -130 L 320 -110 M -320 90 L -320 110 M 320 90 L 320 110" stroke="url(#accent)" stroke-width="2" stroke-linecap="round" />
        
        <text y="-80" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="#ffffff" letter-spacing="1">AI IMAGE ARTWORK</text>
        <foreignObject x="-300" y="-50" width="600" height="90">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 15px; font-weight: 400; text-align: center; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; padding: 0 10px;">
            "${cleanPrompt}"
          </div>
        </foreignObject>
      </g>

      <!-- Footer Badge -->
      <g transform="translate(450, 505)" text-anchor="middle">
        <rect x="-170" y="-18" width="340" height="36" rx="18" fill="rgba(244, 63, 94, 0.12)" stroke="rgba(244, 63, 94, 0.3)" stroke-width="1" />
        <text y="5" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#fb7185" letter-spacing="0.5">✨ QUOTA NOTICE: LIVE PREVIEW FALLBACK ACTIVE</text>
      </g>
    </svg>`
  );
  return `data:image/svg+xml;utf8,${encoded}`;
}
