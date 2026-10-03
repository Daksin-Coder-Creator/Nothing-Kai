import { PersonaId, UpgradeStageId } from '../types';
import { NOTHING_AI_PERSONAS, PERSONA_LIST } from './personas';
import { NOTHING_AI_UPGRADE_STAGES, STAGE_LIST } from './upgrades';
import { sendMessageToAI } from './chatEngine';

export interface CliOutputLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system' | 'ai';
  text: string;
  timestamp: string;
}

export class CliEngine {
  activePersonaId: PersonaId = 'wexel';
  activeUpgradeStage: UpgradeStageId = 2;
  history: CliOutputLine[] = [];

  constructor(personaId: PersonaId = 'wexel', stage: UpgradeStageId = 2) {
    this.activePersonaId = personaId;
    this.activeUpgradeStage = stage;
    this.initBanner();
  }

  initBanner() {
    const timeStr = new Date().toLocaleTimeString();
    this.history = [
      {
        id: `cli_init_1`,
        type: 'system',
        text: `┌─────────────────────────────────────────────────────────────┐
│                   Nothing-Ai AI CLI v1.0.0                        │
│        General-Purpose Multi-Interface AI Assistant         │
└─────────────────────────────────────────────────────────────┘`,
        timestamp: timeStr,
      },
      {
        id: `cli_init_2`,
        type: 'output',
        text: `Active Persona: ${NOTHING_AI_PERSONAS[this.activePersonaId].name} (${NOTHING_AI_PERSONAS[this.activePersonaId].tagline})
Active Tier: Stage ${this.activeUpgradeStage} (${NOTHING_AI_UPGRADE_STAGES[this.activeUpgradeStage].name})
Type 'help' for a list of available commands or 'chat <prompt>' to send a message.`,
        timestamp: timeStr,
      },
    ];
  }

  async execute(input: string): Promise<CliOutputLine[]> {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const timeStr = new Date().toLocaleTimeString();
    const cmdLine: CliOutputLine = {
      id: `cmd_${Date.now()}`,
      type: 'command',
      text: `$ Nothing-Aiai ${trimmed}`,
      timestamp: timeStr,
    };

    const newOutputs: CliOutputLine[] = [cmdLine];
    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const subCmd = parts[1]?.toLowerCase();

    if (mainCmd === 'help') {
      newOutputs.push({
        id: `out_${Date.now()}_1`,
        type: 'output',
        text: `AVAILABLE Nothing-Ai AI CLI COMMANDS:
  help                      - Display this help menu
  persona list              - List all 10 AI personas
  persona set <id>          - Switch active persona (e.g. persona set zorin)
  upgrade status            - View current 6-stage upgrade tier info
  upgrade set <1-6>         - Upgrade reasoning stage (e.g. upgrade set 4)
  chat <message...>         - Query active persona (e.g. chat Write a Python script)
  desktop                   - View desktop app wrapper status & shortcuts
  theme <dark|light>        - Switch application theme
  version                   - Display version & system details
  clear                     - Clear terminal console logs`,
        timestamp: timeStr,
      });
    } else if (mainCmd === 'clear') {
      this.history = [];
      return [];
    } else if (mainCmd === 'version') {
      newOutputs.push({
        id: `out_${Date.now()}`,
        type: 'output',
        text: `Nothing-Ai AI Core Architecture v1.0.0
Node Runtime: v22.14.0 | Express + Vite Engine
Nothing-Ai Model Engine: @Nothing-Ai/core v1.2.0
Build Platform: Web SPA, Desktop App Wrapper, Node.js CLI Script`,
        timestamp: timeStr,
      });
    } else if (mainCmd === 'persona') {
      if (subCmd === 'list') {
        const personaText = PERSONA_LIST.map(
          (p) => `  • [${p.id.padEnd(7)}] ${p.name.padEnd(8)} - ${p.tagline} (${p.focusArea})`
        ).join('\n');
        newOutputs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `AVAILABLE Nothing-Ai AI PERSONAS:\n${personaText}`,
          timestamp: timeStr,
        });
      } else if (subCmd === 'set' && parts[2]) {
        const targetId = parts[2].toLowerCase() as PersonaId;
        if (NOTHING_AI_PERSONAS[targetId]) {
          this.activePersonaId = targetId;
          const p = NOTHING_AI_PERSONAS[targetId];
          newOutputs.push({
            id: `out_${Date.now()}`,
            type: 'system',
            text: `[OK] Switched active persona to: ${p.name} (${p.tagline})`,
            timestamp: timeStr,
          });
        } else {
          newOutputs.push({
            id: `err_${Date.now()}`,
            type: 'error',
            text: `Invalid persona ID '${parts[2]}'. Valid IDs: ${Object.keys(NOTHING_AI_PERSONAS).join(', ')}`,
            timestamp: timeStr,
          });
        }
      } else {
        newOutputs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Current Persona: ${NOTHING_AI_PERSONAS[this.activePersonaId].name}
Usage: persona list | persona set <qorin|wexel|lyren|zorin|ryzex|valtis|qyra|xaven|norix|elion>`,
          timestamp: timeStr,
        });
      }
    } else if (mainCmd === 'upgrade') {
      if (subCmd === 'status') {
        const stage = NOTHING_AI_UPGRADE_STAGES[this.activeUpgradeStage];
        newOutputs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `CURRENT REASONING TIER:
  Stage: ${stage.stage} - ${stage.name}
  Subtitle: ${stage.subtitle}
  Model Alias: ${stage.modelAlias}
  Reasoning Depth: ${stage.reasoningDepth}
  Max Output Tokens: ${stage.maxTokens}
  Context Window: ${stage.contextWindow}`,
          timestamp: timeStr,
        });
      } else if (subCmd === 'set' && parts[2]) {
        const num = parseInt(parts[2], 10) as UpgradeStageId;
        if (num >= 1 && num <= 6) {
          this.activeUpgradeStage = num;
          const st = NOTHING_AI_UPGRADE_STAGES[num];
          newOutputs.push({
            id: `out_${Date.now()}`,
            type: 'system',
            text: `[OK] Upgraded reasoning tier to Stage ${st.stage}: ${st.name}`,
            timestamp: timeStr,
          });
        } else {
          newOutputs.push({
            id: `err_${Date.now()}`,
            type: 'error',
            text: `Invalid stage. Please choose a stage between 1 and 6.`,
            timestamp: timeStr,
          });
        }
      } else {
        const stageText = STAGE_LIST.map((s) => `  Stage ${s.stage}: ${s.name} (${s.reasoningDepth})`).join('\n');
        newOutputs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `UPGRADE TIERS:\n${stageText}\n\nUsage: upgrade status | upgrade set <1-6>`,
          timestamp: timeStr,
        });
      }
    } else if (mainCmd === 'chat') {
      const promptText = parts.slice(1).join(' ');
      if (!promptText) {
        newOutputs.push({
          id: `err_${Date.now()}`,
          type: 'error',
          text: `Usage: chat <your question or prompt here>`,
          timestamp: timeStr,
        });
      } else {
        const pName = NOTHING_AI_PERSONAS[this.activePersonaId].name;
        newOutputs.push({
          id: `out_${Date.now()}_thinking`,
          type: 'system',
          text: `[THINKING] ${pName} is analyzing prompt on Stage ${this.activeUpgradeStage}...`,
          timestamp: timeStr,
        });

        const result = await sendMessageToAI(
          promptText,
          [],
          this.activePersonaId,
          this.activeUpgradeStage
        );

        newOutputs.push({
          id: `ai_${Date.now()}`,
          type: 'ai',
          text: result.content,
          timestamp: timeStr,
        });
      }
    } else if (mainCmd === 'desktop') {
      newOutputs.push({
        id: `out_${Date.now()}`,
        type: 'output',
        text: `Nothing-Ai AI DESKTOP WRAPPER ARCHITECTURE:
  Platform Targets: macOS (Universal), Windows (x64/ARM64), Linux (AppImage/Deb)
  Framework: Tauri v2 / Electron 30 Wrapper
  Hotkey Triggers: Cmd+Shift+Q (Mac) / Ctrl+Shift+Q (Win/Linux) - Global Quick Prompt
  Offline Storage: SQLite Local Caching Enabled`,
        timestamp: timeStr,
      });
    } else {
      newOutputs.push({
        id: `err_${Date.now()}`,
        type: 'error',
        text: `Unknown command '${trimmed}'. Type 'help' for available commands.`,
        timestamp: timeStr,
      });
    }

    this.history = [...this.history, ...newOutputs];
    return this.history;
  }
}
