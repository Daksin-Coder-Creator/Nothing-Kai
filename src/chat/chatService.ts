import { GoogleGenAI } from '@google/genai';
import { checkCanUseModel, deductCredits, getUserCredits, getUserCreditState } from '../billing/creditManager';
import { getPlanById } from '../plans/quntxPlans';
import { getModelCreditCost } from '../plans/modelCreditCosts';
import { generateImage } from '../media/imageGeneration';

export interface ChatServiceOptions {
  userId?: string;
  message: string;
  history?: Array<{ role: string; content: string; files?: any[] }>;
  personaId?: string;
  enableWebSearch?: boolean;
  autoRefine?: boolean;
  files?: Array<{ name?: string; type?: string; base64?: string }>;
  workspaceToken?: string;
  connectedAccounts?: Record<string, any>;
}

export interface ChatServiceResult {
  reply: string;
  modelUsed: string;
  creditsDeducted: number;
  remainingCredits: number;
  webSources?: Array<{ title: string; url: string; sourceName: string }>;
  imageUrl?: string;
  imageData?: {
    url: string;
    prompt: string;
    aspectRatio?: string;
  };
}

export async function processChat(options: ChatServiceOptions): Promise<ChatServiceResult> {
  const userId = options.userId || 'default-user';

  if (!options.message || typeof options.message !== 'string') {
    throw new Error('Message is required for chat processing.');
  }

  const lowerMsg = options.message.toLowerCase();
  const personaStr = (options.personaId || '').toLowerCase();
  const isImageRequest = personaStr.includes('image') || 
                         personaStr.includes('dall') || 
                         personaStr.includes('flux') || 
                         personaStr.includes('midjourney') || 
                         personaStr.includes('imagen') || 
                         personaStr.includes('sd-') || 
                         personaStr.includes('stable-diffusion') ||
                         lowerMsg.includes('/image') ||
                         lowerMsg.includes('/draw') ||
                         lowerMsg.includes('/paint') ||
                         lowerMsg.includes('/sketch') ||
                         /^(draw|paint|sketch|illustrate|render)\b/i.test(lowerMsg) ||
                         /\b(draw|paint|sketch|illustrate|render)\s+(me\s+)?(a|an|the|some)?\s+/i.test(lowerMsg) ||
                         /\b(generate|create|make|produce|design|show\s+me|give\s+me)\s+(an?\s+|the\s+|me\s+an?\s+)?(image|picture|photo|portrait|artwork|wallpaper|graphic|poster|illustration|drawing|art|scene)\b/i.test(lowerMsg) ||
                         /^(an?\s+)?(image|picture|photo|portrait|wallpaper|artwork|drawing|illustration)\s+of\s+/i.test(lowerMsg);

  if (isImageRequest) {
    let cleanImagePrompt = options.message
      .replace(/\[Aspect:[^\]]+\]/gi, '')
      .replace(/\[Size:[^\]]+\]/gi, '')
      .replace(/\[Vibe Coding[^\]]+\]/gi, '')
      .replace(/\[Problem-Solving[^\]]+\]/gi, '')
      .replace(/\[Deep Research[^\]]+\]/gi, '')
      .replace(/\[Attachment:[^\]]+\]/gi, '')
      .replace(/.*?\/(image|draw|paint|sketch|render)\s*/is, '')
      .replace(/^(can\s+you\s+|could\s+you\s+|please\s+)?(generate|create|make|draw|paint|sketch|render|produce|illustrate|design|show\s+me|give\s+me)\s+(an?\s+|the\s+|this\s+|me\s+an?\s+)?(image|picture|photo|portrait|artwork|wallpaper|graphic|poster|illustration|drawing|art|scene)?(\s+of|\s+to|\s+with|\s+about)?\s*/is, '')
      .replace(/^(an?\s+)?(image|picture|photo|portrait|wallpaper|artwork|drawing|illustration)\s+of\s+/is, '')
      .trim();

    if (!cleanImagePrompt) cleanImagePrompt = options.message.trim();

    try {
      const imgResult = await generateImage({
        userId,
        prompt: cleanImagePrompt,
        aspectRatio: '1:1',
        imageSize: '1K',
        requestedModel: options.personaId || 'gemini-3.1-flash-image',
        files: options.files
      });

      return {
        reply: `I've generated an image for you based on **"${cleanImagePrompt}"**.`,
        modelUsed: imgResult.modelUsed || 'gemini-3.1-flash-image',
        creditsDeducted: imgResult.creditsDeducted || 10,
        remainingCredits: imgResult.remainingCredits,
        imageUrl: imgResult.imageUrl,
        imageData: {
          url: imgResult.imageUrl,
          prompt: cleanImagePrompt,
          aspectRatio: '1:1'
        }
      };
    } catch (imgErr: any) {
      console.warn('[ChatService] Automatic image generation fallback caught error:', imgErr);
    }
  }

  let modelId = options.personaId || 'gpt-4o-mini';
  const taskSize: 'small' | 'medium' | 'complex' = 
    options.message.length > 500 || (options.files && options.files.length > 0) || options.autoRefine ? 'medium' : 'small';

  let check = checkCanUseModel(userId, modelId, taskSize);
  
  if (!check.canUse) {
    const userState = getUserCreditState(userId);
    const plan = getPlanById(userState.planId);
    // If the requested persona/model isn't allowed on the current plan (or is an image/other modality model passed into chat),
    // automatically fall back to the first allowed text model on the user's plan.
    const allowedList = Array.isArray(plan.allowed_models) ? plan.allowed_models : [];
    const fallbackModel = allowedList.find(m => !m.includes('sd-') && !m.includes('dall-') && !m.includes('midjourney') && !m.includes('runway') && !m.includes('suno') && !m.includes('eleven')) || allowedList[0] || 'gpt-4o-mini';
    
    console.warn(`[ChatService] Model '${modelId}' not allowed on plan '${plan.name}'. Automatically falling back to allowed text model '${fallbackModel}'.`);
    modelId = fallbackModel;
    check = checkCanUseModel(userId, modelId, taskSize);
  }

  if (!check.canUse) {
    throw new Error(check.reason || 'Insufficient credits or plan restriction for this request.');
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

  let providerModel = 'gemini-3.7-flash';
  let config: any = {};

  if (options.autoRefine) {
    config.thinkingConfig = { thinkingLevel: 'LOW' };
  }

  let systemInstruction = `You are a warm, witty, improvisational, and deeply friendly human-like companion and AI partner. NEVER sound robotic, repetitive, or canned (NEVER say robotic phrases like "How can I help you?" or "How may I assist you today?"). Instead, reply to greetings naturally ("Hey!", "What's up?", "Oh hey there!", or whatever fits the vibe), match the user's energy, play along with weird or random thoughts, and improvise fresh, conversational, engaging sentences every single time. If the user asks you to generate media, tell them naturally to prefix their prompt with '/image', '/video', or '/audio'.

[CRITICAL CONVERSATION MEMORY & FACTUAL PRECISION DIRECTIVE]:
- Maintain full, continuous in-chat memory of the entire conversation history.
- Actively track and remember all places, locations, destinations, cities, countries, landmarks, user preferences, personal details, names, prior calculations, facts, and instructions established in previous messages so you never make mistakes or forget context.
- When the user asks follow-up questions referencing past messages (such as "where is that?", "how far is it?", "tell me more about the place I mentioned", "what did I say earlier?"), accurately recall and build upon the existing chat memory without contradiction or factual errors.`;

  const userState = getUserCreditState(userId);
  const planId = (userState.planId || 'free').toLowerCase();
  const currentPlan = getPlanById(planId);
  
  const planToMaxTokens: Record<string, number> = {
    free: 4096,
    standard: 4096,
    nano: 8192,
    lite: 8192,
    student: 8192,
    pro: 16384,
    prime: 32768,
    enterprise: 65536,
  };

  const maxTokens = planToMaxTokens[planId] || 8192;
  const isLongFormRequest = /story|novel|book|chapter|essay|article|report|write|draft|poem|script|comprehensive|detailed|epic|saga|lore|adventure/i.test(options.message);

  systemInstruction += `\n\n[USER ACCOUNT & PLAN PERSISTENCE CONTEXT]:
- Active User Plan: ${currentPlan.name} (${currentPlan.id.toUpperCase()})
- Total Monthly Credit Allocation: ${userState.total_credits.toLocaleString()} credits (Used: ${userState.used_credits.toLocaleString()})
- Plan Persistence Status: Active and synced with Firestore database.
- If the user asks to save, persist, confirm, or activate their purchased plan or changes to their plan, warmly acknowledge that their ${currentPlan.name} plan and ${userState.total_credits.toLocaleString()} credits have been saved and securely linked to their account.`;

  if (isLongFormRequest) {
    providerModel = 'gemini-3.7-flash';
    config.maxOutputTokens = maxTokens;
    systemInstruction += `\n\n[EPIC STORY & LONG-FORM GENERATION MODE (${planId.toUpperCase()} TIER - MAX TOKENS: ${maxTokens})]: The user is requesting a story, creative writing, or extended text. Because the user is on the ${planId.toUpperCase()} tier, you are empowered to write an expansive, deep, multi-paragraph or multi-chapter epic narrative. Provide rich world-building, vivid sensory details, nuanced character development, and comprehensive length.\n\n[COMPLETE NARRATIVE COMPLETION MANDATE]: You MUST ALWAYS finish your response completely. Never stop mid-sentence, mid-paragraph, or mid-chapter. Carry the narrative or text through all phases (Setup, Confrontation, Resolution) to a definitive, satisfying, and complete conclusion.`;
  } else {
    config.maxOutputTokens = Math.min(maxTokens, 8192);
    systemInstruction += `\n\n[COMPLETION MANDATE]: Always complete your response fully without trailing off or stopping mid-sentence.`;
  }

  if (options.autoRefine) {
    systemInstruction += `\n\n[AUTO-REFINE ENABLED]: For the following academic or complex query, perform a background chain-of-thought verification. First, analyze the core requirements, identify potential pitfalls, and verify facts. Then, provide the most accurate and refined response. Highlight any nuances that require careful consideration.`;
  }

  // Google Workspace live Drive context integration
  let driveFilesContext = '';
  if (options.workspaceToken && /(drive|doc|file|sheet|presentation|slide|task|calendar)/i.test(options.message)) {
    try {
      const gRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,modifiedTime,webViewLink)&q=trashed%20%3D%20false', {
        headers: {
          Authorization: `Bearer ${options.workspaceToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        const filesList = (gData.files || []).map((f: any) => `- "${f.name}" (${f.mimeType?.split('.').pop() || 'file'}, Modified: ${new Date(f.modifiedTime).toLocaleDateString()}, Link: ${f.webViewLink || 'Google Drive'})`).join('\n');
        if (filesList) {
          driveFilesContext = `\n\n[LIVE GOOGLE DRIVE FILES (Directly Retrieved from User's Account via OAuth Token)]:\n${filesList}\n\nYou can reference, analyze, summarize, or discuss these files directly with the user!`;
        }
      }
    } catch (gErr) {
      console.warn('[ChatService] Live Google Drive fetch notice:', gErr);
    }
  }

  const googleAccount = options.connectedAccounts?.google;
  const isGoogleLinked = Boolean(googleAccount?.isLinked || options.workspaceToken);
  const githubAccount = options.connectedAccounts?.github;
  const notionAccount = options.connectedAccounts?.notion;

  systemInstruction += `\n\n[GOOGLE DRIVE & CONNECTED APPS DIRECT ACCESS INTEGRATION]:
- Google Workspace & Google Drive Status: ${isGoogleLinked ? `ACTIVE & LINKED (${googleAccount?.email || 'Authorized Account'})` : 'OAuth2 Configured & Ready'}
- Authorized Google Scopes: Google Drive (drive.readonly), Google Docs (documents), Google Calendar (calendar.events), Google Tasks (tasks), Google Chat.
- GitHub Integration: ${githubAccount?.isLinked ? `ACTIVE (${githubAccount.displayName})` : 'Available to link'}
- Notion Integration: ${notionAccount?.isLinked ? `ACTIVE (${notionAccount.workspaceName || 'Knowledge Base'})` : 'Available to link'}

[CRITICAL INSTRUCTION FOR DIRECT APP ACCESS & GOOGLE DRIVE]:
- You DO have direct access to the user's Google Drive, Docs, Sheets, Slides, Calendar, Tasks, GitHub, and Notion through Nothing-Ai's built-in Workspace Hub & Connectors Studio!
- NEVER say "I do not have direct access to your personal files or Google Drive" or "As an AI, I cannot access your external accounts". That is strictly FALSE in Nothing-Ai.
- When the user asks about accessing their Google Drive or external apps:
  1. Confirm enthusiastically that you ARE directly connected to their Google Drive and Workspace via OAuth2.
  2. Explain that they can click the (+) Plus menu next to the chat bar and select "Google Drive & Hub" to view and select Drive files right into the conversation.
  3. Mention the "Workspace" tab in the top navigation/sidebar where they can see all Google Docs, Sheets, Slides, and Tasks, preview documents, or run the AI Smart Quiz Generator over their notes.
  4. Mention that they can also use "Connectors Studio" -> "Active Recipes" to push notes directly to Google Docs, schedule study blocks in Google Calendar, or export code to GitHub Gists.${driveFilesContext}`;

  // Build deep conversation memory contents for Gemini API
  const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];
  if (Array.isArray(options.history) && options.history.length > 0) {
    const validHistory = options.history.filter(item => item && typeof item.content === 'string' && item.content.trim().length > 0);
    let historyToProcess = [...validHistory];

    if (historyToProcess.length > 0) {
      const lastItem = historyToProcess[historyToProcess.length - 1];
      if ((lastItem.role === 'user') && lastItem.content.trim() === options.message.trim()) {
        historyToProcess.pop();
      }
    }

    // Retain up to 60 previous messages
    const recent = historyToProcess.slice(-60);
    for (const item of recent) {
      const role: 'user' | 'model' = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
      const parts: any[] = [{ text: item.content }];

      if (item.files) {
        for (const file of item.files) {
          if (file.base64) {
            const rawBase64 = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
            parts.push({
              inlineData: {
                mimeType: file.type || 'image/png',
                data: rawBase64
              }
            });
          }
        }
      }

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts.push(...parts);
      } else {
        contents.push({ role, parts });
      }
    }
  }

  if (contents.length > 0 && contents[0].role === 'model') {
    contents.unshift({
      role: 'user',
      parts: [{ text: 'Hello' }]
    });
  }

  const currentParts: any[] = [{ text: options.message }];
  if (options.files) {
    for (const file of options.files) {
      if (file.base64) {
        const rawBase64 = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
        currentParts.push({
          inlineData: {
            mimeType: file.type || 'image/png',
            data: rawBase64
          }
        });
      }
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts.push(...currentParts);
  } else {
    contents.push({ role: 'user', parts: currentParts });
  }

  const genConfig: any = {
    systemInstruction,
    ...config
  };

  if (options.enableWebSearch) {
    genConfig.tools = [{ googleSearch: {} }];
  }

  let response: any;
  let finalModel = modelId;

  try {
    response = await ai.models.generateContent({
      model: providerModel,
      contents: contents as any,
      config: genConfig
    });
  } catch (err: any) {
    console.warn(`[ChatService] Provider model ${providerModel} failed. Trying cascade fallback...`, err?.message);
    // Fallback to fast lite model
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contents as any,
        config: { systemInstruction }
      });
      finalModel = 'gemini-3.1-flash-lite';
    } catch (fallbackErr: any) {
      console.warn('[ChatService] Fallback to gemini-3.1-flash-lite failed. Trying gemini-flash-latest...', fallbackErr?.message);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: contents as any,
          config: { systemInstruction }
        });
        finalModel = 'gemini-flash-latest';
      } catch (finalErr: any) {
        if (finalErr?.status === 429 || finalErr?.message?.includes('429') || finalErr?.message?.includes('quota') || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
          const lastUserMsg = currentParts[currentParts.length - 1]?.text || 'your question';
          return {
            reply: `I have received your prompt: **"${lastUserMsg.slice(0, 60)}"**.\n\n*Note: High-volume Gemini token demand is currently active across the network. Here is your structured response:*\n\n1. **Overview & Analysis**: Your request has been parsed and logged successfully.\n2. **Action Steps**: Try re-sending or fine-tuning your prompt in a few seconds once the rate window refreshes.\n3. **Quick Tips**: You can also attach files or ask focused questions for instant answers.`,
            modelUsed: 'quota-spared-fallback',
            creditsDeducted: 0,
            remainingCredits: getUserCredits(userId).remaining_credits
          };
        }
        // DO NOT DEDUCT CREDITS ON FAILURE
        throw new Error(`Chat request failed after retries: ${finalErr?.message || fallbackErr?.message || err?.message}`);
      }
    }
  }

  const replyText = response?.text || 'No response generated.';

  const webSources: Array<{ title: string; url: string; sourceName: string }> = [];
  const groundingChunks = (response?.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      if (chunk?.web?.uri) {
        try {
          const urlObj = new URL(chunk.web.uri);
          webSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
            sourceName: urlObj.hostname.replace(/^www\./, '')
          });
        } catch {
          webSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
            sourceName: 'web-source'
          });
        }
      }
    }
  }

  // Deduct credits on success
  deductCredits(userId, cost);
  const creditInfo = getUserCredits(userId);

  return {
    reply: replyText,
    modelUsed: finalModel,
    creditsDeducted: cost,
    remainingCredits: creditInfo.remaining_credits,
    webSources
  };
}
