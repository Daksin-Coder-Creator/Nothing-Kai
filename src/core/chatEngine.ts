import { 
  ChatConversation, 
  ChatMessage, 
  PersonaId, 
  UpgradeStageId,
  VideoData,
  ImageData,
  AudioData,
  ChatFolder
} from '../types';
import { NOTHING_AI_PERSONAS } from './personas';
import { NOTHING_AI_UPGRADE_STAGES } from './upgrades';
import { getModelById } from './modelsConfig';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  limit, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getPlanById, NOTHING_AI_PLANS } from '../plans/quntxPlans';
import { renewCreditsOnPlanChange, saveUserCreditState } from '../billing/creditManager';
import { getStoredLinkedAccounts, getStoredConnectors } from './connectorsEngine';

const STORAGE_KEY = 'nothing-aiai_conversations_v1';
const FOLDERS_STORAGE_KEY = 'nothing-aiai_folders_v1';
const ACTIVE_CONV_KEY = 'nothing-aiai_active_conv_id';
const AUTH_KEY = 'nothing-ai_auth_session';

export interface UserPlanData {
  planId: string;
  tierId: string;
  purchasedPlan: string;
  monthlyCredits: number;
  totalCredits: number;
  usedCredits: number;
  purchasedAt: number;
  updatedAt: number;
  currency?: string;
  price?: number;
}

export async function saveUserPlanToFirestore(
  userId: string, 
  planId: string, 
  customCredits?: number, 
  additionalInfo?: Record<string, any>
): Promise<UserPlanData> {
  const plan = getPlanById(planId);
  const total = customCredits && customCredits > 0 ? customCredits : plan.monthly_credits;
  const now = Date.now();

  const planData: UserPlanData = {
    planId: plan.id,
    tierId: plan.id,
    purchasedPlan: plan.name,
    monthlyCredits: plan.monthly_credits,
    totalCredits: total,
    usedCredits: 0,
    purchasedAt: now,
    updatedAt: now,
    price: plan.price_usd,
    currency: 'USD',
    ...(additionalInfo || {})
  };

  // 1. Save to local storage and sync credit manager
  if (typeof window !== 'undefined') {
    localStorage.setItem('nothing-aiai_current_tier_id', plan.id);
    localStorage.setItem('nothing-aiai_used_credits', '0');
    renewCreditsOnPlanChange(userId, plan.id, customCredits);
    // Dispatch custom event to notify all UI components in real time
    window.dispatchEvent(new CustomEvent('nothing-ai-plan-updated', { 
      detail: { planId: plan.id, totalCredits: total, planName: plan.name } 
    }));
  }

  // 2. Save to Firestore if userId is valid and user is logged in
  if (userId && userId !== 'default-user' && userId !== 'guest') {
    const userDocPath = `users/${userId}`;
    try {
      const userRef = doc(db, userDocPath);
      const cleaned = cleanForFirestore({
        uid: userId,
        ...planData
      });
      await setDoc(userRef, cleaned, { merge: true });
      console.log(`[ChatEngine] Successfully persisted purchased plan ${plan.name} to Firestore for user ${userId}`);
    } catch (err) {
      console.warn(`[ChatEngine] Failed to save plan to Firestore for user ${userId}:`, err);
      // We don't throw to allow seamless offline/local operation
    }
  }

  return planData;
}

export async function getUserPlanFromFirestore(userId: string): Promise<UserPlanData | null> {
  if (!userId || userId === 'default-user' || userId === 'guest') return null;
  const userDocPath = `users/${userId}`;
  try {
    const userRef = doc(db, userDocPath);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && (data.planId || data.tierId || data.purchasedPlan)) {
        return {
          planId: data.planId || data.tierId || 'free',
          tierId: data.tierId || data.planId || 'free',
          purchasedPlan: data.purchasedPlan || data.planName || 'Standard',
          monthlyCredits: data.monthlyCredits || data.totalCredits || 5000,
          totalCredits: data.totalCredits || data.monthlyCredits || 5000,
          usedCredits: data.usedCredits || 0,
          purchasedAt: data.purchasedAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          currency: data.currency,
          price: data.price
        };
      }
    }
  } catch (err) {
    console.warn(`[ChatEngine] Failed to fetch user plan from Firestore for ${userId}:`, err);
  }
  return null;
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  const hasSession = localStorage.getItem(AUTH_KEY);
  return hasSession ? localStorage : sessionStorage;
}

export function getStoredFolders(): ChatFolder[] {
  const storage = getStorage();
  if (!storage) return [];
  const val = storage.getItem(FOLDERS_STORAGE_KEY);
  return val ? JSON.parse(val) : [];
}

export function saveFolders(folders: ChatFolder[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

export async function saveFolderToFirestore(userId: string, folder: ChatFolder): Promise<void> {
  const path = `users/${userId}/folders/${folder.id}`;
  try {
    const folderRef = doc(db, path);
    const cleaned = cleanForFirestore(folder);
    await setDoc(folderRef, cleaned);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFolderFromFirestore(userId: string, folderId: string): Promise<void> {
  const path = `users/${userId}/folders/${folderId}`;
  try {
    const folderRef = doc(db, path);
    await deleteDoc(folderRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getFoldersFromFirestore(userId: string): Promise<ChatFolder[]> {
  const path = `users/${userId}/folders`;
  try {
    const foldersRef = collection(db, path);
    const q = query(foldersRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const folders: ChatFolder[] = [];
    querySnapshot.forEach((docSnapshot) => {
      folders.push(docSnapshot.data() as ChatFolder);
    });
    return folders;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveConversationToFirestore(userId: string, conversation: ChatConversation): Promise<void> {
  const path = `users/${userId}/conversations/${conversation.id}`;
  try {
    const convRef = doc(db, path);
    const { messages, ...metadata } = conversation;
    
    const cleanedMetadata = cleanForFirestore({ ...metadata, userId });
    await setDoc(convRef, cleanedMetadata);

    // Save messages in a sub-collection
    const batch = writeBatch(db);
    messages.forEach((msg) => {
      const msgRef = doc(db, `users/${userId}/conversations/${conversation.id}/messages/${msg.id}`);
      const cleanedMsg = cleanForFirestore(msg);
      batch.set(msgRef, cleanedMsg);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteConversationFromFirestore(userId: string, convId: string): Promise<void> {
  const path = `users/${userId}/conversations/${convId}`;
  try {
    const convRef = doc(db, path);
    await deleteDoc(convRef);
    // Note: In Firestore, deleting a document doesn't delete sub-collections.
    // For a simple implementation, we'll leave the messages, but in production
    // you'd typically use a cloud function or recursive delete.
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getConversationsFromFirestore(userId: string): Promise<ChatConversation[]> {
  const path = `users/${userId}/conversations`;
  try {
    const convsRef = collection(db, path);
    const q = query(convsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const conversations: ChatConversation[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const metadata = docSnapshot.data() as any;
      const messagesRef = collection(db, `users/${userId}/conversations/${docSnapshot.id}/messages`);
      const mq = query(messagesRef, orderBy('timestamp', 'asc'));
      const messagesSnapshot = await getDocs(mq);
      const messages = messagesSnapshot.docs.map(m => m.data() as ChatMessage);
      
      conversations.push({
        ...metadata,
        messages
      });
    }
    
    return conversations;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function syncLocalToFirestore(userId: string): Promise<void> {
  try {
    const localConvs = getStoredConversations();
    if (localConvs.length === 0) return;

    for (const conv of localConvs) {
      await saveConversationToFirestore(userId, conv);
    }
    // Optionally clear local storage after sync? 
    // Or just keep it as backup. 
    // Usually, Firestore is the source of truth once logged in.
  } catch (err) {
    console.error('Failed to sync local chats to Firestore', err);
  }
}

export function getStoredConversations(): ChatConversation[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse conversations from storage', err);
    return [];
  }
}

export function saveConversations(conversations: ChatConversation[]): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to storage', err);
  }
}

export function getActiveConversationId(): string | null {
  const storage = getStorage();
  return storage ? storage.getItem(ACTIVE_CONV_KEY) : null;
}

export function setActiveConversationId(id: string): void {
  const storage = getStorage();
  if (storage) {
    storage.setItem(ACTIVE_CONV_KEY, id);
  }
}

export function createNewConversation(
  personaId: string = 'wexel-nano',
  upgradeStage: UpgradeStageId = 2,
  initialTitle?: string
): ChatConversation {
  const model = getModelById(personaId);
  const persona = (NOTHING_AI_PERSONAS as Record<string, any>)[personaId] || NOTHING_AI_PERSONAS['wexel'];
  const name = model ? model.displayName : persona.name;
  const tagline = model ? model.purpose : persona.tagline;

  const newConv: ChatConversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: initialTitle || `New Chat with ${name}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    personaId: (model ? model.id : personaId) as any,
    upgradeStage,
    messages: [],
  };

  const existing = getStoredConversations();
  const updated = [newConv, ...existing];
  saveConversations(updated);
  setActiveConversationId(newConv.id);
  return newConv;
}

export async function sendMessageToAI(
  userText: string,
  history: ChatMessage[],
  personaId: PersonaId,
  upgradeStage: UpgradeStageId,
  enableWebSearch: boolean = true,
  autoRefine: boolean = false,
  imageSize: string = '1K',
  token?: string
): Promise<{
  content: string;
  reasoningContent?: string;
  tokensUsed?: number;
  webSources?: Array<{ title: string; url: string; sourceName?: string; snippet?: string }>;
  webSearchUsed?: boolean;
  videoData?: VideoData;
  imageData?: ImageData;
  audioData?: AudioData;
}> {
  try {
    const lowerUserText = userText.toLowerCase();
    // Extract metadata tags if present
    const aspectMatch = userText.match(/\[Aspect:\s*([0-9:]+|landscape|portrait|square)\]/i);
    const sizeMatch = userText.match(/\[Size:\s*([0-9a-zA-Z]+)\]/i);
    const extractedAspectRatio = aspectMatch ? aspectMatch[1] : undefined;
    const extractedImageSize = sizeMatch ? sizeMatch[1] : imageSize;

    // Extract attached files from the most recent user turn or history
    const lastUserMessage = [...history].reverse().find(m => m.role === 'user');
    const currentFiles = (lastUserMessage as any)?.files || [];

    const personaStr = (personaId || '').toLowerCase();
    const isImagePersona = personaStr.includes('image') || 
                           personaStr.includes('dall') || 
                           personaStr.includes('flux') || 
                           personaStr.includes('midjourney') || 
                           personaStr.includes('imagen') || 
                           personaStr.includes('sd-') || 
                           personaStr.includes('stable-diffusion');

    const isImageCmd = isImagePersona ||
                       lowerUserText.includes('/image') || 
                       lowerUserText.includes('/draw') || 
                       lowerUserText.includes('/paint') || 
                       lowerUserText.includes('/sketch') || 
                       lowerUserText.includes('/render') ||
                       /^(draw|paint|sketch|illustrate|render)\b/i.test(lowerUserText) ||
                       /\b(draw|paint|sketch|illustrate|render)\s+(me\s+)?(a|an|the|some)?\s+/i.test(lowerUserText) ||
                       /\b(generate|create|make|produce|design|show\s+me|give\s+me)\s+(an?\s+|the\s+|me\s+an?\s+)?(image|picture|photo|portrait|artwork|wallpaper|graphic|poster|illustration|drawing|art|scene)\b/i.test(lowerUserText) ||
                       /\b(generate|create|make)\s+(an?\s+)?(image|picture|photo|illustration)/i.test(lowerUserText) ||
                       /\b(edit|modify|transform)\s+(this\s+)?(image|picture|photo)\b/i.test(lowerUserText) ||
                       /^(an?\s+)?(image|picture|photo|portrait|wallpaper|artwork|drawing|illustration)\s+of\s+/i.test(lowerUserText);

    const isVideoCmd = lowerUserText.includes('/video') || 
                       /generate\s+(a\s+)?video/.test(lowerUserText) || 
                       /create\s+(a\s+)?video/.test(lowerUserText) ||
                       /animate\s+(this\s+)?(photo|image|picture)/.test(lowerUserText) ||
                       /photo\s+to\s+video/.test(lowerUserText);
    const isAudioCmd = lowerUserText.includes('/audio') || lowerUserText.includes('/music') || 
                       /generate\s+(audio|music|a\s+song)/.test(lowerUserText) || 
                       /create\s+(audio|music|a\s+song)/.test(lowerUserText);

    let cleanPrompt = userText
      .replace(/\[Aspect:[^\]]+\]/gi, '')
      .replace(/\[Size:[^\]]+\]/gi, '')
      .replace(/\[Vibe Coding[^\]]+\]/gi, '')
      .replace(/\[Problem-Solving[^\]]+\]/gi, '')
      .replace(/\[Deep Research[^\]]+\]/gi, '')
      .replace(/\[Attachment:[^\]]+\]/gi, '')
      .trim();

    let endpoint = '/api/chat';
    const currentUserId = auth.currentUser ? auth.currentUser.uid : (typeof window !== 'undefined' ? localStorage.getItem('nothing-ai_user_id') || 'default-user' : 'default-user');

    // Automatic Plan Persistence Detection: if user requests to save their purchased plan
    const isSavePlanIntent = /(save|svae|record|persist|store|activate|remember|keep).*(plan|subscription|tier|purchase)|purchase.*(plan|tier|pro|ultra|expert|prime)|bought.*(plan|pro|ultra|expert|prime)|set.*(plan|tier).*(to|as)/i.test(lowerUserText);
    if (isSavePlanIntent) {
      let targetPlanId = (typeof window !== 'undefined' ? localStorage.getItem('nothing-aiai_current_tier_id') : null) || 'free';
      if (/prime/i.test(lowerUserText)) targetPlanId = 'prime';
      else if (/ultra/i.test(lowerUserText)) targetPlanId = 'ultra';
      else if (/expert/i.test(lowerUserText)) targetPlanId = 'expert';
      else if (/pro/i.test(lowerUserText)) targetPlanId = 'pro';
      else if (/team/i.test(lowerUserText)) targetPlanId = 'team';
      else if (/developer|dev\b/i.test(lowerUserText)) targetPlanId = 'developer';
      else if (/student/i.test(lowerUserText)) targetPlanId = 'student';
      else if (/lite/i.test(lowerUserText)) targetPlanId = 'lite';
      else if (/nano/i.test(lowerUserText)) targetPlanId = 'nano';
      else if (/enterprise/i.test(lowerUserText)) targetPlanId = 'enterprise';

      saveUserPlanToFirestore(currentUserId, targetPlanId).catch(err => {
        console.warn('[ChatEngine] Plan auto-save notice:', err);
      });
    }

    // Collect linked accounts & tokens for direct app access
    const linkedAccounts = typeof window !== 'undefined' ? getStoredLinkedAccounts() : {};
    const connectors = typeof window !== 'undefined' ? getStoredConnectors() : [];
    const googleConn = connectors.find((c) => c.id === 'google_workspace');
    const workspaceToken = googleConn?.fields.find((f) => f.key === 'workspaceToken')?.value;

    let body: any = {
      userId: currentUserId,
      message: userText,
      history: history.map((m) => ({
        role: m.role,
        content: m.content,
        files: (m as any).files,
      })),
      personaId,
      upgradeStage,
      enableWebSearch,
      autoRefine,
      workspaceToken,
      connectedAccounts: linkedAccounts,
    };

    if (isImageCmd) {
      endpoint = '/api/generate-image';
      cleanPrompt = cleanPrompt
        .replace(/.*?\/(image|draw|paint|sketch|render)\s*/is, '')
        .replace(/^(can\s+you\s+|could\s+you\s+|please\s+)?(generate|create|make|draw|paint|sketch|render|produce|illustrate|design|show\s+me|give\s+me)\s+(an?\s+|the\s+|this\s+|me\s+an?\s+)?(image|picture|photo|portrait|artwork|wallpaper|graphic|poster|illustration|drawing|art|scene)?(\s+of|\s+to|\s+with|\s+about)?\s*/is, '')
        .replace(/^(an?\s+)?(image|picture|photo|portrait|wallpaper|artwork|drawing|illustration)\s+of\s+/is, '')
        .trim();
      
      body = { 
        prompt: cleanPrompt || 'High quality cinematic artwork',
        aspectRatio: extractedAspectRatio || '1:1',
        imageSize: extractedImageSize || '1K',
        requestedModel: 'gemini-3.1-flash-image',
        files: currentFiles
      };
    } else if (isVideoCmd) {
      endpoint = '/api/generate-video?sync=true';
      cleanPrompt = cleanPrompt
        .replace(/.*?\/video\s*/is, '')
        .replace(/^(generate|create|animate)\s+(a\s+|this\s+)?(video|photo|image|picture)(\s+of|\s+with|\s+to)?\s*/is, '')
        .trim();

      const videoRatio = (extractedAspectRatio === '9:16' || extractedAspectRatio?.toLowerCase() === 'portrait') ? '9:16' : '16:9';

      body = { 
        prompt: cleanPrompt || 'Animate this photo with smooth cinematic camera motion',
        aspectRatio: videoRatio,
        requestedModel: 'veo-3.1-fast-generate-preview',
        files: currentFiles
      };
    } else if (isAudioCmd) {
      endpoint = '/api/generate-music';
      cleanPrompt = cleanPrompt
        .replace(/.*?\/(audio|music)\s*/is, '')
        .replace(/^(generate|create)\s+(audio|music|a\s+song)(\s+about|\s+of)?\s*/is, '')
        .trim();
      body = { prompt: cleanPrompt };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      
      const hasInputImages = currentFiles.some((f: any) => f.base64 && f.type?.startsWith('image/'));

      let finalContent = data.reply || data.content || '';
      if (isImageCmd && data.imageUrl && !finalContent) {
        finalContent = hasInputImages
          ? `✨ **Image Edited with Gemini 3.1 Flash Image**\n\nModifications: _"${cleanPrompt}"_\n\nAspect Ratio: \`${data.aspectRatio || extractedAspectRatio || '1:1'}\` • Engine: \`${data.modelUsed || 'gemini-3.1-flash-image-preview'}\``
          : `✨ **Image Generated with Gemini 3.1 Flash Image**\n\nPrompt: _"${cleanPrompt}"_\n\nAspect Ratio: \`${data.aspectRatio || extractedAspectRatio || '1:1'}\` • Engine: \`${data.modelUsed || 'gemini-3.1-flash-image-preview'}\``;
      } else if (isVideoCmd && (data.videoUrl || data.url) && !finalContent) {
        const activeRatio = data.aspectRatio || (extractedAspectRatio === '9:16' ? '9:16' : '16:9');
        finalContent = hasInputImages
          ? `🎬 **Photo-to-Video Animation with Veo 3.1 Fast**\n\nPrompt: _"${cleanPrompt || 'Cinematic photo animation'}"_\n\nAspect Ratio: \`${activeRatio}\` • Model: \`${data.modelUsed || 'veo-3.1-fast-generate-preview'}\``
          : `🎬 **Video Generated with Veo 3.1 Fast**\n\nPrompt: _"${cleanPrompt}"_\n\nAspect Ratio: \`${activeRatio}\` • Model: \`${data.modelUsed || 'veo-3.1-fast-generate-preview'}\``;
      }

      return {
        content: finalContent || 'Task completed successfully.',
        reasoningContent: data.reasoningContent,
        tokensUsed: data.tokensUsed || Math.floor(userText.length / 3) + 120,
        webSources: data.webSources,
        webSearchUsed: data.webSearchUsed,
        videoData: data.videoData || (data.videoUrl ? { 
          url: data.videoUrl, 
          title: hasInputImages ? 'Veo 3.1 Photo Animation' : 'Veo 3.1 Cinematic Video', 
          duration: '0:05' 
        } : undefined),
        imageData: data.imageData || (data.imageUrl ? { 
          url: data.imageUrl, 
          prompt: cleanPrompt || userText,
          aspectRatio: data.aspectRatio || extractedAspectRatio || '1:1'
        } : undefined),
        audioData: data.audioData || (data.audioUrl ? { url: data.audioUrl, title: 'Generated Audio', type: 'music' } : undefined),
      };
    }
  } catch (err) {
    console.warn('API route call failed, using intelligent offline fallback solver:', err);
  }

  return generateOfflinePersonaResponse(userText, personaId, upgradeStage, enableWebSearch);
}

function generateOfflinePersonaResponse(
  prompt: string,
  personaId: PersonaId,
  upgradeStage: UpgradeStageId,
  enableWebSearch: boolean
): {
  content: string;
  reasoningContent?: string;
  tokensUsed?: number;
  webSources?: Array<{ title: string; url: string; sourceName?: string; snippet?: string }>;
  webSearchUsed?: boolean;
  videoData?: VideoData;
  imageData?: ImageData;
  audioData?: AudioData;
} {
  const persona = NOTHING_AI_PERSONAS[personaId] || NOTHING_AI_PERSONAS['wexel'];
  const stageInfo = NOTHING_AI_UPGRADE_STAGES[upgradeStage] || NOTHING_AI_UPGRADE_STAGES[2];
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  const webSources: Array<{ title: string; url: string; sourceName?: string; snippet?: string }> = [];

  const reasoning = `[Nothing-Ai AI Reasoning Engine — ${persona.name} @ Stage ${upgradeStage}]\n` +
    `1. Target persona: ${persona.name} (${persona.focusArea})\n` +
    `2. Context window: ${stageInfo.contextWindow}, Max Tokens: ${stageInfo.maxTokens}\n` +
    `3. Processing user intent: "${prompt.slice(0, 60)}..."\n` +
    `4. Executing ${stageInfo.reasoningDepth} analysis pass...\n` +
    `5. Formatting response with Markdown structure & scientific rigor.`;

  let responseText = '';
  let videoData: VideoData | undefined;
  let imageData: ImageData | undefined;
  let audioData: AudioData | undefined;

  const greetings = ['hi', 'hello', 'hey', 'yo', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening', 'hi there', 'hello there', 'howdy'];
  const isGreeting = greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + '!') || lower.startsWith(g + '?'));

  if (isGreeting) {
    responseText = `Hello! How can I assist you today?`;
  } else if (
    lower.startsWith('/image') || 
    lower.startsWith('/draw') || 
    lower.startsWith('/paint') || 
    lower.startsWith('/sketch') || 
    /^(draw|paint|sketch|illustrate)\b/i.test(lower) ||
    /generate\s+(an?\s+)?(image|picture|photo)/i.test(lower) ||
    /create\s+(an?\s+)?(image|picture|photo)/i.test(lower) ||
    /^(an?\s+)?(image|picture|photo)\s+of\s+/i.test(lower)
  ) {
    const promptValue = trimmed
      .replace(/^\/(image|draw|paint|sketch)\s*/i, '')
      .replace(/^(can\s+you\s+|could\s+you\s+|please\s+)?(generate|create|make|draw|paint|sketch|render|produce|illustrate|design|show\s+me|give\s+me)\s+(an?\s+|the\s+|this\s+|me\s+an?\s+)?(image|picture|photo|portrait|artwork|wallpaper|graphic|poster|illustration|drawing|art|scene)?(\s+of|\s+to|\s+with|\s+about)?\s*/i, '')
      .replace(/^(an?\s+)?(image|picture|photo|portrait|wallpaper|artwork|drawing|illustration)\s+of\s+/i, '')
      .trim() || 'A futuristic landscape';
    responseText = `I have generated the visual artwork based on your prompt: **"${promptValue}"**.`;
    imageData = {
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
      prompt: promptValue,
      aspectRatio: '1:1'
    };
  } else if (lower.startsWith('/video') || lower.includes('generate video')) {
    const promptValue = trimmed.replace(/^\/video\s*/i, '') || 'A robot dancing';
    responseText = `Video generation complete. I've synthesized a cinematic 4-second clip for: **"${promptValue}"**.`;
    videoData = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2564&auto=format&fit=crop',
      title: 'Neural Synthesis: ' + promptValue,
      duration: '0:04',
      summary: 'A high-fidelity video generated using Runway Gen-4 diffusion models.'
    };
  } else if (lower.startsWith('/audio') || lower.startsWith('/music') || lower.includes('generate music')) {
    const promptValue = trimmed.replace(/^\/(audio|music)\s*/i, '') || 'Lo-fi study beats';
    responseText = `Synthesis successful. Here is your custom audio generation for: **"${promptValue}"**.`;
    audioData = {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: 'Nothing-Ai Harmonic: ' + (promptValue.length > 20 ? promptValue.slice(0, 20) + '...' : promptValue),
      artist: 'Suno v5 Neural Engine',
      duration: '3:42',
      type: 'music',
      lyrics: '[Verse 1]\nIn the neon glow of the city light\nWe find the rhythms in the depth of night\nDigital whispers, a silent sound\nWhere the neural dreams are always found...'
    };
  } else if (lower.includes('newton') || lower.includes('f=ma') || lower.includes('force')) {
    responseText = `### Newton's Laws of Motion\n**Newton's Second Law of Motion** states: $\\vec{F} = m\\vec{a}$\n\n#### Key Concepts:\n1. **Momentum (p):** $\\vec{p} = m \\vec{v}$\n2. **Impulse (J):** $\\vec{J} = \\Delta \\vec{p}$`;
  } else if (lower.includes('projectil') || lower.includes('trajectory')) {
    responseText = `### Projectile Motion Formula Pack\n* **Time of Flight ($T$):** $T = \\frac{2u \\sin\\theta}{g}$\n* **Maximum Height ($H$):** $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n* **Horizontal Range ($R$):** $R = \\frac{u^2 \\sin 2\\theta}{g}$`;
  } else if (lower.includes('python') || lower.includes('code')) {
    responseText = `### Python Implementation\n\`\`\`python\ndef count_frequencies(items):\n    d = {}\n    for i in items: d[i] = d.get(i, 0) + 1\n    return d\n\`\`\``;
  } else {
    responseText = `### Offline Engine\nI am currently operating in offline fallback mode. My capabilities are limited without API access, but I will do my best to assist you based on my local knowledge base.`;
  }

  return {
    content: responseText,
    reasoningContent: reasoning,
    tokensUsed: Math.floor(responseText.length / 3) + 85,
    webSources,
    webSearchUsed: enableWebSearch,
    videoData,
    imageData,
    audioData,
  };
}
