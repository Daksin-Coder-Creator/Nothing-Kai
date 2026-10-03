import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export async function saveLinkedAccountToFirestore(provider: string, account: OAuth2LinkedAccount) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const docRef = doc(db, `users/${user.uid}/integrations/${provider}`);
    await setDoc(docRef, {
      provider,
      connected: true,
      googleAccountEmail: account.email,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      grantedScopes: account.scopes || [],
      connectedAt: account.linkedAt || Date.now(),
      updatedAt: Date.now(),
      connectionStatus: 'connected',
      lastValidatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('[ConnectorsEngine] Failed to save integration to Firestore:', err);
  }
}

export async function getLinkedAccountFromFirestore(provider: string): Promise<OAuth2LinkedAccount | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const docRef = doc(db, `users/${user.uid}/integrations/${provider}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        provider: data.provider || provider,
        isLinked: data.connected !== false,
        displayName: data.displayName || data.googleAccountEmail,
        email: data.googleAccountEmail,
        avatarUrl: data.avatarUrl,
        scopes: data.grantedScopes,
        linkedAt: data.connectedAt || Date.now()
      };
    }
  } catch (err) {
    console.warn('[ConnectorsEngine] Failed to fetch integration from Firestore:', err);
  }
  return null;
}

export async function removeLinkedAccountFromFirestore(provider: string) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const docRef = doc(db, `users/${user.uid}/integrations/${provider}`);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[ConnectorsEngine] Failed to remove integration from Firestore:', err);
  }
}

// Nothing-Ai Connectors & Automation Engine

export type ConnectorCategory = 'productivity' | 'developer' | 'team' | 'automation';

export interface ConnectorConfig {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  icon: string;
  badge?: string;
  color: string;
  enabled: boolean;
  status: 'connected' | 'needs_config' | 'idle';
  lastPingMs?: number;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder: string;
    description?: string;
    value: string;
  }[];
}

export interface AutomationRecipe {
  id: string;
  name: string;
  description: string;
  connectorId: string;
  trigger: 'on_message' | 'on_code_generated' | 'on_task_detected' | 'manual';
  triggerLabel: string;
  actionLabel: string;
  icon: string;
  enabled: boolean;
  runCount: number;
  lastRun?: number;
}

export interface AutomationLog {
  id: string;
  recipeName: string;
  connectorName: string;
  timestamp: number;
  status: 'success' | 'simulated' | 'failed';
  summary: string;
  latencyMs?: number;
  externalUrl?: string;
  payloadPreview?: string;
}

export interface OAuth2LinkedAccount {
  provider: 'google' | 'notion' | 'github';
  isLinked: boolean;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  workspaceName?: string;
  scopes?: string[];
  linkedAt: number;
}

export interface StudyTemplate {
  id: string;
  name: string;
  tool: 'Google Calendar' | 'Notion' | 'Quizlet' | 'Google Docs' | 'Anki' | 'Google Tasks';
  category: 'scheduling' | 'flashcards' | 'notes' | 'tasks';
  icon: string;
  color: string;
  badge: string;
  description: string;
  targetConnectorId: string;
  features: string[];
  suggestedRecipe: {
    name: string;
    description: string;
    trigger: 'on_message' | 'on_code_generated' | 'on_task_detected' | 'manual';
    triggerLabel: string;
    actionLabel: string;
    icon: string;
    connectorId: string;
  };
  samplePreview: string;
}

export interface SyncActivityLog {
  id: string;
  tool: 'Google Calendar' | 'Notion' | 'Quizlet' | 'Google Docs' | 'Google Tasks';
  action: string;
  itemCount?: number;
  timestamp: number;
  status: 'success' | 'staged' | 'failed';
  externalUrl?: string;
  latencyMs?: number;
}

const STORAGE_KEY_CONFIG = 'nothing_ai_connectors_config_v1';
const STORAGE_KEY_RECIPES = 'nothing_ai_connectors_recipes_v1';
const STORAGE_KEY_LOGS = 'nothing_ai_connectors_logs_v1';
const STORAGE_KEY_ACCOUNTS = 'nothing_ai_connectors_accounts_v1';
const STORAGE_KEY_SYNC_ACTIVITY = 'nothing_ai_connectors_sync_activity_v1';

export const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    category: 'productivity',
    description: 'Sync docs, export research to Google Docs, and create action items in Google Tasks.',
    icon: 'FileText',
    color: '#4285F4',
    badge: 'Official',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'workspaceToken',
        label: 'Workspace Token',
        type: 'password',
        placeholder: 'Synchronized via Google Auth',
        description: 'Auto-configured when logging in with Google account',
        value: '',
      },
      {
        key: 'defaultDocFolder',
        label: 'Default Drive Folder',
        type: 'text',
        placeholder: 'Nothing-Ai Notes',
        value: 'Nothing-Ai Notes',
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Gists & Repos',
    category: 'developer',
    description: 'Auto-export code snippets as GitHub Gists and synchronize generated project files.',
    icon: 'Github',
    color: '#6e5494',
    badge: 'Dev Favorite',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'githubToken',
        label: 'GitHub Personal Access Token (PAT)',
        type: 'password',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx (optional)',
        description: 'Leave blank to use anonymous / simulated gist exports',
        value: '',
      },
      {
        key: 'defaultVisibility',
        label: 'Default Gist Visibility',
        type: 'text',
        placeholder: 'secret or public',
        value: 'secret',
      },
    ],
  },
  {
    id: 'webhook',
    name: 'Custom Webhook (Zapier / Make / n8n)',
    category: 'automation',
    description: 'Stream AI events and completions to Zapier, Make.com, n8n, or your own HTTP backend.',
    icon: 'Zap',
    color: '#FF6F00',
    badge: 'Universal',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'webhookUrl',
        label: 'Incoming Webhook Endpoint',
        type: 'url',
        placeholder: 'https://hooks.zapier.com/hooks/catch/... or https://hook.eu1.make.com/...',
        value: 'https://webhook.site/demo-nothing-ai-stream',
      },
      {
        key: 'secretKey',
        label: 'Secret / Authorization Header (Optional)',
        type: 'password',
        placeholder: 'Bearer token or secret signature',
        value: '',
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack Team Broadcast',
    category: 'team',
    description: 'Post research summaries, generated solutions, or debug reports directly into Slack channels.',
    icon: 'Slack',
    color: '#E01E5A',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'slackWebhookUrl',
        label: 'Slack Incoming Webhook URL',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/T00/B00/XXXX',
        value: '',
      },
      {
        key: 'defaultChannel',
        label: 'Channel Name',
        type: 'text',
        placeholder: '#general or #ai-research',
        value: '#ai-research',
      },
    ],
  },
  {
    id: 'discord',
    name: 'Discord Dev Server',
    category: 'team',
    description: 'Broadcast code snippets, prompt solutions, and game assets to Discord server webhooks.',
    icon: 'MessageSquare',
    color: '#5865F2',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'discordWebhookUrl',
        label: 'Discord Webhook URL',
        type: 'url',
        placeholder: 'https://discord.com/api/webhooks/...',
        value: '',
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'productivity',
    description: 'Send conversation highlights, study outlines, and flashcards directly into Notion databases.',
    icon: 'BookOpen',
    color: '#000000',
    enabled: false,
    status: 'needs_config',
    fields: [
      {
        key: 'notionApiKey',
        label: 'Internal Integration Secret',
        type: 'password',
        placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxx',
        value: '',
      },
      {
        key: 'notionDatabaseId',
        label: 'Database or Page ID',
        type: 'text',
        placeholder: '32-character Notion Page/Database ID',
        value: '',
      },
    ],
  },
  {
    id: 'email',
    name: 'Email Digest & Alerts',
    category: 'automation',
    description: 'Receive automated summaries of key study sessions and code generation milestones via email.',
    icon: 'Mail',
    color: '#10B981',
    enabled: true,
    status: 'connected',
    fields: [
      {
        key: 'emailAddress',
        label: 'Notification Email',
        type: 'text',
        placeholder: 'your.name@example.com',
        value: 'user@example.com',
      },
    ],
  },
];

export const DEFAULT_RECIPES: AutomationRecipe[] = [
  {
    id: 'recipe_auto_gist',
    name: 'Code-to-Gist Auto-Sync',
    description: 'Whenever an AI answer contains code snippets, automatically prepare a GitHub Gist export.',
    connectorId: 'github',
    trigger: 'on_code_generated',
    triggerLabel: 'When code block is generated',
    actionLabel: 'Create GitHub Gist & link snippet',
    icon: 'Code2',
    enabled: true,
    runCount: 14,
    lastRun: Date.now() - 3600000,
  },
  {
    id: 'recipe_task_extractor',
    name: 'Smart Task & Action Item Extractor',
    description: 'Detects todo items and action checklists in AI responses, automatically routing them to Tasks.',
    connectorId: 'google_workspace',
    trigger: 'on_task_detected',
    triggerLabel: 'When action items are detected',
    actionLabel: 'Sync to Google Tasks / Task Hub',
    icon: 'CheckSquare',
    enabled: true,
    runCount: 29,
    lastRun: Date.now() - 1800000,
  },
  {
    id: 'recipe_doc_exporter',
    name: 'One-Click Research Doc Export',
    description: 'Quickly export structured research reports and conversation transcripts into Google Docs.',
    connectorId: 'google_workspace',
    trigger: 'manual',
    triggerLabel: 'On manual click in message actions',
    actionLabel: 'Generate Google Doc with title and timestamps',
    icon: 'FileText',
    enabled: true,
    runCount: 8,
    lastRun: Date.now() - 7200000,
  },
  {
    id: 'recipe_webhook_stream',
    name: 'Zapier / Make Event Streamer',
    description: 'Stream all completed AI interactions to external workflow automation platforms via HTTP POST.',
    connectorId: 'webhook',
    trigger: 'on_message',
    triggerLabel: 'When assistant response completes',
    actionLabel: 'Dispatch JSON payload to webhook',
    icon: 'Zap',
    enabled: false,
    runCount: 0,
  },
  {
    id: 'recipe_slack_broadcast',
    name: 'Slack Team Broadcast',
    description: 'Send selected prompts and solutions to team Slack channels with rich blocks.',
    connectorId: 'slack',
    trigger: 'manual',
    triggerLabel: 'On manual click in message actions',
    actionLabel: 'Broadcast to Slack #ai-research',
    icon: 'Slack',
    enabled: true,
    runCount: 5,
    lastRun: Date.now() - 86400000,
  },
  {
    id: 'recipe_discord_alerts',
    name: 'Discord Dev Server Dispatch',
    description: 'Push game logic, shaders, or debug answers directly to your Discord community.',
    connectorId: 'discord',
    trigger: 'manual',
    triggerLabel: 'On manual click in message actions',
    actionLabel: 'Dispatch embed to Discord webhook',
    icon: 'MessageSquare',
    enabled: true,
    runCount: 3,
    lastRun: Date.now() - 172800000,
  },
];

export const INITIAL_LOGS: AutomationLog[] = [
  {
    id: 'log_1',
    recipeName: 'Smart Task & Action Item Extractor',
    connectorName: 'Google Workspace',
    timestamp: Date.now() - 1800000,
    status: 'success',
    summary: 'Extracted 3 study action items and queued for sync',
    latencyMs: 145,
  },
  {
    id: 'log_2',
    recipeName: 'Code-to-Gist Auto-Sync',
    connectorName: 'GitHub Gists',
    timestamp: Date.now() - 3600000,
    status: 'success',
    summary: 'Exported TypeScript solution to Gist',
    externalUrl: 'https://gist.github.com/anonymous/react-state-hook',
    latencyMs: 312,
  },
  {
    id: 'log_3',
    recipeName: 'One-Click Research Doc Export',
    connectorName: 'Google Workspace',
    timestamp: Date.now() - 7200000,
    status: 'success',
    summary: 'Generated document "Quantum Computing Fundamentals"',
    latencyMs: 220,
  },
];

export const STUDY_TEMPLATES_LIBRARY: StudyTemplate[] = [
  {
    id: 'template_gcalendar_study_schedule',
    name: 'Exam Prep & Study Schedule Sync',
    tool: 'Google Calendar',
    category: 'scheduling',
    icon: 'Calendar',
    color: '#4285F4',
    badge: 'Popular',
    description: 'Auto-extract exam dates, study blocks, and syllabus deadlines from AI study schedules directly into Google Calendar.',
    targetConnectorId: 'google_workspace',
    features: [
      'Parses exact date, start time, and duration',
      'Auto-creates 30-min preparation reminders',
      'Color-codes study blocks vs. test dates'
    ],
    suggestedRecipe: {
      name: 'Google Calendar Study Scheduler',
      description: 'Automatically schedules study milestones and exam alerts in your Google Calendar.',
      trigger: 'manual',
      triggerLabel: 'When study schedule is generated',
      actionLabel: 'Create Google Calendar event with reminder',
      icon: 'Calendar',
      connectorId: 'google_workspace'
    },
    samplePreview: '📅 Exam Preparation: Quantum Mechanics\n⏰ Friday 3:00 PM - 5:00 PM\n🔔 Reminder: 30 minutes before\n🏷️ Tag: Study Block'
  },
  {
    id: 'template_notion_active_recall',
    name: 'Cornell Notes & Active Recall Hub',
    tool: 'Notion',
    category: 'notes',
    icon: 'BookOpen',
    color: '#000000',
    badge: 'Academic',
    description: 'Converts AI explanations into structured Cornell Notes with toggle question blocks for active recall self-testing.',
    targetConnectorId: 'notion',
    features: [
      'Formatted Cornell Cue Column & Summary',
      'Interactive Toggle Lists for self-quizzing',
      'Tagged by Subject and Confidence level'
    ],
    suggestedRecipe: {
      name: 'Notion Active Recall Sync',
      description: 'Pushes AI conceptual answers into a Notion study database with self-quiz toggles.',
      trigger: 'manual',
      triggerLabel: 'On clicking Save to Notion',
      actionLabel: 'Append Cornell Note blocks to Notion page',
      icon: 'BookOpen',
      connectorId: 'notion'
    },
    samplePreview: '▶ Concept: Photosynthesis Dark Reactions\n  Question: What is the primary role of RuBisCO?\n  [Click to reveal answer]'
  },
  {
    id: 'template_quizlet_flashcards',
    name: 'Instant Q&A Flashcard Set Exporter',
    tool: 'Quizlet',
    category: 'flashcards',
    icon: 'Sparkles',
    color: '#4257B2',
    badge: 'High Impact',
    description: 'Converts study flashcards, definitions, and AI quiz questions into Quizlet-compatible TSV/CSV format for 1-click import.',
    targetConnectorId: 'webhook',
    features: [
      'Automatic Term & Definition extraction',
      'One-click clipboard copy formatted for Quizlet',
      'Direct link to Quizlet "Create Set" studio'
    ],
    suggestedRecipe: {
      name: 'Quizlet Deck Generator',
      description: 'Extracts Q&A pairs and packages them for instant import into Quizlet flashcard sets.',
      trigger: 'manual',
      triggerLabel: 'When flashcards or quiz generated',
      actionLabel: 'Export TSV Deck & open Quizlet Import',
      icon: 'Sparkles',
      connectorId: 'webhook'
    },
    samplePreview: 'Mitochondria\tCellular powerhouse generating ATP\nRibosome\tComplex synthesizing proteins from mRNA\nGolgi Body\tOrganelle modifying and sorting proteins'
  },
  {
    id: 'template_gdocs_academic_paper',
    name: 'Academic Research & Study Guide',
    tool: 'Google Docs',
    category: 'notes',
    icon: 'FileText',
    color: '#4285F4',
    badge: 'Essential',
    description: 'Exports comprehensive research reports, thesis outlines, and mathematical formulas directly to a styled Google Doc.',
    targetConnectorId: 'google_workspace',
    features: [
      'Styled headings, executive summary, and key takeaways',
      'Preserves math notations & code algorithms',
      'Direct Google Docs edit URL generated immediately'
    ],
    suggestedRecipe: {
      name: 'Google Docs Academic Exporter',
      description: 'Generates a cloud document containing the formatted answer with date and research citations.',
      trigger: 'manual',
      triggerLabel: 'On Export to Google Docs',
      actionLabel: 'Create Google Doc and populate text',
      icon: 'FileText',
      connectorId: 'google_workspace'
    },
    samplePreview: '📄 Document: Machine Learning Architectures\n📌 Headings: Transformer Attention, Diffusion Models\n🔗 Status: Live in Google Drive'
  },
  {
    id: 'template_gtasks_revision',
    name: 'Daily Homework & Revision Checklist',
    tool: 'Google Tasks',
    category: 'tasks',
    icon: 'CheckSquare',
    color: '#10B981',
    badge: 'Productivity',
    description: 'Extracts actionable problem sets, reading assignments, and project deliverables from AI advice into your daily study task queue.',
    targetConnectorId: 'google_workspace',
    features: [
      'Detects markdown check items (- [ ]) and TODOs',
      'Direct sync to Google Tasks API',
      'Auto-tags priority levels'
    ],
    suggestedRecipe: {
      name: 'Daily Revision Task Sync',
      description: 'Extracts action points from chats and routes them into your Google Tasks list.',
      trigger: 'on_task_detected',
      triggerLabel: 'When checklist items detected',
      actionLabel: 'Push items to Google Tasks',
      icon: 'CheckSquare',
      connectorId: 'google_workspace'
    },
    samplePreview: '☑ Complete Practice Problem Set 4 (Calculus)\n☑ Read Chapter 6: Thermodynamics\n☑ Review Flashcards Deck #2'
  },
  {
    id: 'template_anki_srs',
    name: 'Anki Spaced Repetition Deck',
    tool: 'Anki',
    category: 'flashcards',
    icon: 'Brain',
    color: '#E01E5A',
    badge: 'Pro Memory',
    description: 'Generates Anki-ready TSV cards with cloze deletions and tags for optimized long-term memory retention.',
    targetConnectorId: 'github',
    features: [
      'Cloze-deletion formatting {{c1::keyword}}',
      'Tagging by difficulty level and subject',
      'Downloadable text deck ready for Anki Desktop/Mobile'
    ],
    suggestedRecipe: {
      name: 'Anki Deck Generator',
      description: 'Produces cloze deletion cards and packages them for Anki import.',
      trigger: 'manual',
      triggerLabel: 'On Anki Export request',
      actionLabel: 'Generate Anki TSV file and download',
      icon: 'Brain',
      connectorId: 'github'
    },
    samplePreview: 'The {{c1::mitochondria}} produces energy in the form of {{c2::ATP}} through oxidative phosphorylation.\tBiology::Cell'
  }
];

// Account Management Helpers
export function getStoredLinkedAccounts(): Record<string, OAuth2LinkedAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveStoredLinkedAccount(provider: string, account: OAuth2LinkedAccount) {
  try {
    const current = getStoredLinkedAccounts();
    current[provider] = account;
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(current));
    saveLinkedAccountToFirestore(provider, account);
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to save linked account:', err);
  }
}

export function unlinkStoredAccount(provider: string) {
  try {
    const current = getStoredLinkedAccounts();
    delete current[provider];
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(current));
    removeLinkedAccountFromFirestore(provider);
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to unlink account:', err);
  }
}

// Template Import Helper
export function importStudyTemplate(template: StudyTemplate): AutomationRecipe {
  const currentRecipes = getStoredRecipes();
  const newRecipe: AutomationRecipe = {
    id: `recipe_${template.id}_${Date.now()}`,
    name: template.suggestedRecipe.name,
    description: template.suggestedRecipe.description,
    connectorId: template.suggestedRecipe.connectorId,
    trigger: template.suggestedRecipe.trigger,
    triggerLabel: template.suggestedRecipe.triggerLabel,
    actionLabel: template.suggestedRecipe.actionLabel,
    icon: template.suggestedRecipe.icon,
    enabled: true,
    runCount: 0,
  };

  const updated = [newRecipe, ...currentRecipes];
  saveStoredRecipes(updated);

  addStoredLog({
    recipeName: `Import: ${template.name}`,
    connectorName: template.tool,
    timestamp: Date.now(),
    status: 'success',
    summary: `Imported study template "${template.name}" for ${template.tool}`,
  });

  addStoredSyncActivity({
    tool: template.tool as any,
    action: `Template Activated: ${template.name}`,
    itemCount: 1,
    timestamp: Date.now(),
    status: 'success',
    latencyMs: 120,
  });

  return newRecipe;
}

export const INITIAL_SYNC_ACTIVITIES: SyncActivityLog[] = [
  {
    id: 'sync_1',
    tool: 'Google Calendar',
    action: 'Exam & Study Schedule Sync: Quantum Mechanics Prep',
    itemCount: 3,
    timestamp: Date.now() - 1000 * 60 * 12,
    status: 'success',
    externalUrl: 'https://calendar.google.com/calendar',
    latencyMs: 142,
  },
  {
    id: 'sync_2',
    tool: 'Notion',
    action: 'Cornell Note Import: Photosynthesis Dark Reactions',
    itemCount: 1,
    timestamp: Date.now() - 1000 * 60 * 45,
    status: 'success',
    externalUrl: 'https://notion.so',
    latencyMs: 235,
  },
  {
    id: 'sync_3',
    tool: 'Quizlet',
    action: 'Flashcard Deck Import: Biochemistry Terminology (24 Cards)',
    itemCount: 24,
    timestamp: Date.now() - 1000 * 60 * 120,
    status: 'success',
    externalUrl: 'https://quizlet.com',
    latencyMs: 98,
  },
  {
    id: 'sync_4',
    tool: 'Google Docs',
    action: 'Academic Paper Export: Neural Architecture Search',
    itemCount: 1,
    timestamp: Date.now() - 1000 * 60 * 240,
    status: 'success',
    latencyMs: 310,
  }
];

export function getStoredSyncActivity(): SyncActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC_ACTIVITY);
    if (!raw) return INITIAL_SYNC_ACTIVITIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SYNC_ACTIVITIES;
  } catch {
    return INITIAL_SYNC_ACTIVITIES;
  }
}

export function addStoredSyncActivity(activity: Omit<SyncActivityLog, 'id'>) {
  try {
    const current = getStoredSyncActivity();
    const newEntry: SyncActivityLog = {
      ...activity,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    const updated = [newEntry, ...current].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_SYNC_ACTIVITY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to add sync activity:', err);
  }
}

export function clearStoredSyncActivity() {
  localStorage.removeItem(STORAGE_KEY_SYNC_ACTIVITY);
  window.dispatchEvent(new CustomEvent('connectors-updated'));
}

// Helper: Get Connectors
export function getStoredConnectors(): ConnectorConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONNECTORS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONNECTORS;
  } catch {
    return DEFAULT_CONNECTORS;
  }
}

// Helper: Save Connectors
export function saveStoredConnectors(connectors: ConnectorConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(connectors));
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to save connectors:', err);
  }
}

// Helper: Get Recipes
export function getStoredRecipes(): AutomationRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (!raw) return DEFAULT_RECIPES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RECIPES;
  } catch {
    return DEFAULT_RECIPES;
  }
}

// Helper: Save Recipes
export function saveStoredRecipes(recipes: AutomationRecipe[]) {
  try {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to save recipes:', err);
  }
}

// Helper: Get Logs
export function getStoredLogs(): AutomationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) return INITIAL_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_LOGS;
  } catch {
    return INITIAL_LOGS;
  }
}

// Helper: Add Log
export function addStoredLog(log: Omit<AutomationLog, 'id'>) {
  try {
    const logs = getStoredLogs();
    const newLog: AutomationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    const updated = [newLog, ...logs].slice(0, 50); // keep recent 50
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('connectors-updated'));
  } catch (err) {
    console.error('Failed to add log:', err);
  }
}

// Helper: Clear Logs
export function clearStoredLogs() {
  localStorage.removeItem(STORAGE_KEY_LOGS);
  window.dispatchEvent(new CustomEvent('connectors-updated'));
}

// Action Extraction Helper
export function extractActionItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match Markdown checklist: - [ ] Task or * [ ] Task
    const checkMatch = trimmed.match(/^[-*]\s*\[\s*\]\s+(.+)$/i);
    if (checkMatch && checkMatch[1]) {
      items.push(checkMatch[1].trim());
      continue;
    }
    // Match TODO: Task
    const todoMatch = trimmed.match(/^(?:TODO|Action Item|Next Step):\s*(.+)$/i);
    if (todoMatch && todoMatch[1]) {
      items.push(todoMatch[1].trim());
      continue;
    }
    // Match numbered list starting with action verbs: 1. Install ..., 2. Configure ...
    const numberedActionMatch = trimmed.match(/^\d+\.\s+(Create|Install|Run|Review|Configure|Deploy|Implement|Build|Test|Write|Check|Verify|Fix)\b(.+)$/i);
    if (numberedActionMatch) {
      items.push(trimmed.replace(/^\d+\.\s+/, '').trim());
    }
  }

  return items.slice(0, 10);
}

// Code Block Extraction Helper
export function extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
  const blocks: Array<{ language: string; code: string }> = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const lang = (match[1] || 'text').trim().toLowerCase();
    const code = match[2].trim();
    if (code) {
      blocks.push({ language: lang, code });
    }
  }

  return blocks;
}

// Execute Connector Dispatch
export async function executeConnectorAction(
  connectorType: 'webhook' | 'github_gist' | 'slack' | 'discord' | 'google_doc' | 'google_task' | 'google_calendar' | 'quizlet' | 'notion' | 'email',
  payload: {
    title?: string;
    content: string;
    prompt?: string;
    codeBlocks?: Array<{ language: string; code: string }>;
    actionItems?: string[];
    metadata?: any;
  }
): Promise<{ success: boolean; message: string; url?: string; latencyMs?: number }> {
  const connectors = getStoredConnectors();
  const configMap: Record<string, any> = {};

  connectors.forEach((conn) => {
    conn.fields.forEach((f) => {
      configMap[f.key] = f.value;
    });
  });

  try {
    const res = await fetch('/api/connectors/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectorType,
        config: configMap,
        payload,
      }),
    });

    const data = await res.json();

    addStoredLog({
      recipeName: `Manual / Automated ${connectorType}`,
      connectorName: connectorType.toUpperCase().replace('_', ' '),
      timestamp: Date.now(),
      status: data.success ? (data.simulated ? 'simulated' : 'success') : 'failed',
      summary: data.message || (data.success ? 'Dispatch successful' : 'Dispatch failed'),
      latencyMs: data.latencyMs,
      externalUrl: data.url,
      payloadPreview: payload.title || payload.content.slice(0, 80),
    });

    return data;
  } catch (err: any) {
    addStoredLog({
      recipeName: `Dispatch ${connectorType}`,
      connectorName: connectorType.toUpperCase().replace('_', ' '),
      timestamp: Date.now(),
      status: 'failed',
      summary: err.message || 'Network error during dispatch',
    });
    return { success: false, message: err.message || 'Execution error' };
  }
}
