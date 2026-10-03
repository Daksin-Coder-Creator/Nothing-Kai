import { GoogleGenAI } from '@google/genai';
import { selectMediaModel } from './mediaRouter';
import { deductCredits, getUserCredits } from '../billing/creditManager';

export interface AudioGenerationOptions {
  userId?: string;
  prompt: string;
  type?: 'music' | 'tts';
  length?: 'short' | 'full';
  voice?: string;
  requestedModel?: string;
}

export interface AudioGenerationResult {
  audioUrl: string;
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

export async function generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
  const userId = options.userId || 'default-user';

  if (!options.prompt || typeof options.prompt !== 'string' || options.prompt.trim().length === 0) {
    throw new Error('Prompt is required for audio generation.');
  }

  const prompt = options.prompt.trim();
  const isMusic = options.type === 'music';
  const taskSize: 'small' | 'medium' | 'complex' = options.length === 'full' ? 'complex' : prompt.length > 200 ? 'medium' : 'small';

  const defaultModel = isMusic 
    ? (options.length === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview')
    : 'gemini-3.1-flash-tts-preview';

  const routerResult = selectMediaModel({
    userId,
    modality: 'audio',
    taskSize,
    requestedModel: options.requestedModel || defaultModel
  });

  if (!routerResult.allowed) {
    throw new Error(routerResult.reason || 'Not allowed to generate audio with your current plan or credit limit.');
  }

  const primaryModel = routerResult.modelId;
  const fallbackModel = routerResult.fallbackModelId || (isMusic ? 'suno-v3' : 'eleven-turbo-v2-5');
  const cost = routerResult.cost;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const executeGeneration = async (modelName: string): Promise<string> => {
    if (isMusic) {
      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: prompt
      });

      let audioBase64 = '';
      let mimeType = 'audio/wav';

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (!audioBase64) {
        throw new Error(`Model '${modelName}' returned empty music stream.`);
      }

      return `data:${mimeType};base64,${audioBase64}`;
    } else {
      // Text to Speech call using interactions API
      const interaction: any = await ai.interactions.create({
        model: modelName,
        input: prompt,
        response_modalities: ['AUDIO' as any],
        generation_config: {
          speech_config: {
            language: 'en-us',
            voice: options.voice || 'kore'
          }
        } as any
      });

      let audioBase64 = '';
      let mimeType = 'audio/pcm';

      if (interaction?.steps) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const audioContent = step.content?.find((c: any) => c.type === 'audio');
            if (audioContent && audioContent.data) {
              audioBase64 = audioContent.data;
              mimeType = audioContent.mime_type || 'audio/pcm';
              break;
            }
          }
        }
      }

      if (!audioBase64) {
        throw new Error(`Model '${modelName}' did not return TTS audio data.`);
      }

      return `data:${mimeType};base64,${audioBase64}`;
    }
  };

  let audioUrl = '';
  let finalModelUsed = primaryModel;
  let isFallbackUsed = false;

  try {
    audioUrl = await executeGeneration(primaryModel);
  } catch (primaryErr: any) {
    console.warn(`[AudioGen] Primary model '${primaryModel}' failed: ${primaryErr?.message}. Retrying with fallback model '${fallbackModel}'...`);

    try {
      audioUrl = await executeGeneration(fallbackModel);
      finalModelUsed = fallbackModel;
      isFallbackUsed = true;
    } catch (fallbackErr: any) {
      console.error(`[AudioGen] Fallback model '${fallbackModel}' also failed: ${fallbackErr?.message}`);

      if (isQuotaError(primaryErr) || isQuotaError(fallbackErr)) {
        const dummyWav = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJ_u3t7d3t7d3t7d3t7d3t7d3t7d3t7d3t7d3t7d";
        const creditInfo = getUserCredits(userId);
        return {
          audioUrl: dummyWav,
          modelUsed: 'quota-spared-fallback',
          creditsDeducted: 0,
          remainingCredits: creditInfo.remaining_credits,
          note: 'Google Gemini API quota reached. Displayed audio preview without deducting credits.'
        };
      }

      // DO NOT DEDUCT CREDITS ON FAILURE
      throw new Error(`Audio generation failed after 2 attempts. Details: ${fallbackErr?.message || primaryErr?.message}`);
    }
  }

  // Deduct credits on success
  deductCredits(userId, cost);
  const creditInfo = getUserCredits(userId);

  console.log(`[AudioGen] Successfully generated audio using '${finalModelUsed}' for user ${userId}. Deducted ${cost} credits. Remaining: ${creditInfo.remaining_credits}`);

  return {
    audioUrl,
    modelUsed: finalModelUsed,
    creditsDeducted: cost,
    remainingCredits: creditInfo.remaining_credits,
    note: isFallbackUsed ? `Primary model was busy. Switched to fallback model ${finalModelUsed}.` : undefined
  };
}
