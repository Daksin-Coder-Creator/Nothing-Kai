import { GoogleGenAI } from '@google/genai';
import { checkCanUseModel, deductCredits, getUserCredits } from '../billing/creditManager';

export interface CodingServiceOptions {
  userId?: string;
  prompt: string;
  language?: string;
  codeSnippet?: string;
  requestedModel?: string;
}

export interface CodingServiceResult {
  code: string;
  explanation: string;
  modelUsed: string;
  creditsDeducted: number;
  remainingCredits: number;
}

export async function processCodingRequest(options: CodingServiceOptions): Promise<CodingServiceResult> {
  const userId = options.userId || 'default-user';

  if (!options.prompt || typeof options.prompt !== 'string') {
    throw new Error('Coding prompt is required.');
  }

  let modelId = options.requestedModel || 'deepseek-v3';
  const taskSize: 'small' | 'medium' | 'complex' = 
    options.prompt.length > 800 || (options.codeSnippet && options.codeSnippet.length > 1000) ? 'complex' : 'medium';

  let check = checkCanUseModel(userId, modelId, taskSize);
  if (!check.canUse) {
    modelId = 'deepseek-v3';
    check = checkCanUseModel(userId, modelId, taskSize);
  }

  if (!check.canUse) {
    throw new Error(check.reason || 'Insufficient credits or plan permission for coding model.');
  }

  const cost = check.cost;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const systemInstruction = `You are Nothing-Ai Senior Coding AI & Vibe Code Architect. 
You specialize in producing production-ready, highly optimized, bug-free TypeScript/JavaScript/Python code.
Always provide clean code blocks, clear explanation, and performance considerations.`;

  const userContent = `Task: ${options.prompt}
Language: ${options.language || 'TypeScript'}
${options.codeSnippet ? `\nExisting Code Snippet:\n\`\`\`\n${options.codeSnippet}\n\`\`\`\n` : ''}`;

  let responseText = '';
  let providerModel = 'gemini-3.1-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: providerModel,
      contents: userContent,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: 'HIGH' } as any
      } as any
    });
    responseText = response.text || '';
  } catch (err: any) {
    console.warn(`[CodingService] Thinking model call failed. Falling back to fast flash...`, err?.message);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userContent,
        config: { systemInstruction }
      });
      responseText = response.text || '';
      providerModel = 'gemini-3.1-flash-lite';
    } catch (fallbackErr: any) {
      // DO NOT DEDUCT CREDITS ON FAILURE
      throw new Error(`Coding task failed after retries: ${fallbackErr?.message || err?.message}`);
    }
  }

  // Extract code block if present
  let code = '';
  let explanation = responseText;
  const codeMatch = responseText.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
  if (codeMatch) {
    code = codeMatch[1];
  }

  // Deduct credits on success
  deductCredits(userId, cost);
  const creditInfo = getUserCredits(userId);

  return {
    code,
    explanation,
    modelUsed: modelId,
    creditsDeducted: cost,
    remainingCredits: creditInfo.remaining_credits
  };
}
