import { GoogleGenAI } from '@google/genai';
import { checkCanUseModel, deductCredits, getUserCredits } from '../billing/creditManager';

export interface ResearchServiceOptions {
  userId?: string;
  topic: string;
  depth?: 'standard' | 'deep' | 'academic';
  requestedModel?: string;
  includeCitations?: boolean;
}

export interface ResearchServiceResult {
  report: string;
  citations: Array<{ title: string; url: string; sourceName: string }>;
  modelUsed: string;
  creditsDeducted: number;
  remainingCredits: number;
}

export async function processResearchRequest(options: ResearchServiceOptions): Promise<ResearchServiceResult> {
  const userId = options.userId || 'default-user';

  if (!options.topic || typeof options.topic !== 'string') {
    throw new Error('Research topic is required.');
  }

  let modelId = options.requestedModel || (options.depth === 'academic' ? 'alphafold-3' : 'gemini-2-5-flash');
  const taskSize: 'small' | 'medium' | 'complex' = options.depth === 'academic' || options.depth === 'deep' ? 'complex' : 'medium';

  let check = checkCanUseModel(userId, modelId, taskSize);
  if (!check.canUse) {
    modelId = 'gemini-2-5-flash';
    check = checkCanUseModel(userId, modelId, taskSize);
  }

  if (!check.canUse) {
    throw new Error(check.reason || 'Insufficient credits or plan permission for research model.');
  }

  const cost = check.cost;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const prompt = `Conduct a comprehensive, highly rigorous ${options.depth || 'deep'} research investigation on: "${options.topic}". 
Structure your report with:
- Executive Summary
- Key Academic & Industry Insights
- Detailed Theoretical & Empirical Findings
- Strategic Takeaways & References`;

  let response: any;
  let providerModel = 'gemini-3.7-flash';

  try {
    response = await ai.models.generateContent({
      model: providerModel,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      } as any
    });
  } catch (err: any) {
    console.warn(`[ResearchService] Primary research call failed. Trying fallback...`, err?.message);
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      });
      providerModel = 'gemini-3.1-flash-lite';
    } catch (fallbackErr: any) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt
        });
        providerModel = 'gemini-flash-latest';
      } catch (finalErr: any) {
        // DO NOT DEDUCT CREDITS ON FAILURE
        throw new Error(`Research request failed after retries: ${finalErr?.message || fallbackErr?.message || err?.message}`);
      }
    }
  }

  const reportText = response?.text || 'No research report generated.';
  const citations: Array<{ title: string; url: string; sourceName: string }> = [];

  const groundingChunks = (response?.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      if (chunk?.web?.uri) {
        try {
          const urlObj = new URL(chunk.web.uri);
          citations.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
            sourceName: urlObj.hostname.replace(/^www\./, '')
          });
        } catch {
          citations.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
            sourceName: 'web-citation'
          });
        }
      }
    }
  }

  // Deduct credits on success
  deductCredits(userId, cost);
  const creditInfo = getUserCredits(userId);

  return {
    report: reportText,
    citations,
    modelUsed: modelId,
    creditsDeducted: cost,
    remainingCredits: creditInfo.remaining_credits
  };
}
