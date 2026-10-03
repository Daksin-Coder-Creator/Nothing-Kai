export type PersonaId = 
  | 'qorin' 
  | 'wexel' 
  | 'lyren' 
  | 'zorin' 
  | 'ryzex' 
  | 'valtis' 
  | 'qyra' 
  | 'xaven' 
  | 'norix' 
  | 'elion';

export type UpgradeStageId = 1 | 2 | 3 | 4 | 5 | 6;

export type ViewMode = 'web' | 'cli' | 'desktop' | 'story';

export type AppTheme = 'dark' | 'light';

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  roleDescription: string;
  focusArea: string;
  avatarBg: string;
  badgeColor: string;
  iconName: string;
  targetUser: string;
  samplePrompts: {
    label: string;
    prompt: string;
    category: string;
  }[];
  systemPrompt: string;
}

export interface UpgradeStage {
  stage: UpgradeStageId;
  name: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  badgeBg: string;
  features: string[];
  reasoningDepth: 'Basic Speed' | 'Step-by-Step' | 'High Reasoning' | 'Pro Max Deep' | 'Agentic Planning' | 'Apex Reasoning';
  maxTokens: number;
  modelAlias: string;
  contextWindow: string;
}

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
  sourceName?: string;
}

export interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
  reasoningContent?: string;
  tokensUsed?: number;
  executionTimeMs?: number;
  webSources?: WebSource[];
  webSearchUsed?: boolean;
  isError?: boolean;
}

export interface ComparisonData {
  modelA: ModelResponse;
  modelB: ModelResponse;
  winner?: 'A' | 'B' | 'tie';
}

export interface VideoData {
  url: string;
  videoId?: string;
  thumbnailUrl?: string;
  title?: string;
  channel?: string;
  duration?: string;
  summary?: string;
  takeaways?: string[];
  chapters?: { time: string; title: string; summary?: string }[];
  transcript?: string;
  aspectRatio?: '16:9' | '9:16' | string;
}

export interface ImageData {
  url: string;
  prompt?: string;
  revisedPrompt?: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
}

export interface AudioData {
  url: string;
  title?: string;
  artist?: string;
  duration?: string;
  lyrics?: string;
  genre?: string;
  type: 'music' | 'voice';
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  personaId: PersonaId;
  reasoningContent?: string;
  tokensUsed?: number;
  isError?: boolean;
  webSources?: WebSource[];
  webSearchUsed?: boolean;
  videoData?: VideoData;
  imageData?: ImageData;
  audioData?: AudioData;
  quizData?: QuizData;
  autoRoutedModel?: string;
  autoRouteReason?: string;
  executionTimeMs?: number;
  files?: { name: string; size: string; type: string; base64: string }[];
  comparison?: ComparisonData;
  feedback?: 'like' | 'dislike';
  feedbackReason?: string;
  feedbackComment?: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  personaId: PersonaId;
  upgradeStage: UpgradeStageId;
  pinned?: boolean;
  folderId?: string;
  archived?: boolean;
}
