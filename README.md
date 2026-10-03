# QuNTXAI — Next-Gen AI Assistant System

QuNTXAI is a multi-interface AI assistant system built specifically for Class 11 students in India (CBSE/NCERT/JEE/NEET) as well as programmers, creators, and system architects. Inspired by ChatGPT, Grok, and Claude interfaces.

---

## 🌟 Key Features

1. **Multi-Interface Architecture**:
   - **Web App**: Responsive, high-craft React interface with left sidebar, persona selector, tier switcher, and markdown stream.
   - **Interactive CLI**: Embedded web terminal + standalone Node.js CLI script (`src/cli/quntxai-cli.js`).
   - **Desktop App Wrapper**: Tauri v2 / Electron application wrapper simulator with global hotkeys (`Cmd+Shift+Q`) and SQLite offline cache.
   - **Class 11 Academic Study Hub**: Physics derivations, Calculus limits, Chemistry bonding, Python CS exercises, and NCERT solved examples.

2. **10 Single-Purpose AI Personas**:
   - **Qorin**: Quick facts, instant formulas & constants.
   - **Wexel**: Master of all Class 11 CBSE study topics & doubts.
   - **Lyren**: Creativity, essay writing, debate speeches & story ideas.
   - **Zorin**: Code implementation, algorithms, debugging & Python/C++.
   - **Ryzex**: Deep theory, physics derivations & calculus proofs.
   - **Valtis**: System architecture, DB schemas & software engineering specs.
   - **Qyra**: UI/UX design, Tailwind CSS layouts & color themes.
   - **Xaven**: Workflow planning, study timetables & exam roadmaps.
   - **Norix**: Safety, fact-checking, answer verification & QA.
   - **Elion**: Final presentation, markdown polish & executive report formatting.

3. **6-Stage Upgrade Tier System**:
   - **Stage 1 (Basic Free)**: Fast definitions & basic lookups.
   - **Stage 2 (Study Support)**: Step-by-step NCERT solvers & formula sheets.
   - **Stage 3 (Pro Creator)**: Long-form essays, speeches & creative brainstorming.
   - **Stage 4 (Pro Max Power User)**: Full-stack code generation & calculus proofs.
   - **Stage 5 (Automation Agent)**: Multi-step planning & auto-persona routing.
   - **Stage 6 (Apex Enterprise)**: Maximum reasoning depth & 2M context window.

---

## 📁 Repository Folder Structure

```
QuNTXAI/
├── .env.example              # Server environment variable definitions
├── README.md                 # System documentation & setup guide
├── TEST_REPORT.md            # Comprehensive 10-test QA report
├── metadata.json             # Applet capabilities & name configuration
├── package.json              # Project scripts & npm package manifest
├── server.ts                 # Full-stack Express server with Gemini API & Vite
├── vite.config.ts            # Vite build setup with Tailwind CSS
├── index.html                # HTML entry point with Plus Jakarta Sans & JetBrains Mono fonts
├── src/
│   ├── main.tsx              # React entry point
│   ├── index.css             # Tailwind CSS global styles & custom scrollbars
│   ├── App.tsx               # Primary application state manager & viewport router
│   ├── types.ts              # Shared TypeScript interfaces for personas, stages & chats
│   ├── core/                 # Shared logic modules across Web, App & CLI
│   │   ├── personas.ts       # 10 AI Personas definitions & system prompts
│   │   ├── upgrades.ts       # 6-Stage upgrade tier system specifications
│   │   ├── chatEngine.ts     # Local storage persistence, model routing & chat engine
│   │   ├── cliEngine.ts      # Command line parser for Terminal CLI mode
│   │   └── class11Data.ts    # Class 11 CBSE chapters, formulas & solved questions
│   ├── components/           # UI Component Library
│   │   ├── Sidebar.tsx       # Collapsible left navigation bar & conversation list
│   │   ├── Navbar.tsx        # Top status header, persona indicator & search
│   │   ├── ChatView.tsx      # Main message stream & prompt input bar
│   │   ├── MessageItem.tsx   # Message bubbles with markdown, code copy & run preview
│   │   ├── PersonasDrawer.tsx# All 10 Personas gallery modal
│   │   ├── UpgradeModal.tsx  # 6-Stage tier selection modal
│   │   ├── TerminalView.tsx  # Web-embedded interactive CLI terminal
│   │   ├── DesktopView.tsx   # Desktop app simulator & keyboard shortcuts guide
│   │   ├── Class11Hub.tsx    # Academic revision hub for Class 11 students
│   │   └── SettingsModal.tsx # System settings, server status & storage export
│   └── cli/
│       └── quntxai-cli.js    # Standalone runnable Node.js CLI script
```

---

## 🚀 Setup & Execution Guide

### 1. Web & Express Server Development
```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on Port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 2. Standalone Node.js CLI Execution
```bash
# Run standalone terminal CLI locally
node src/cli/quntxai-cli.js
```

### 3. Environment Variables
To enable live Gemini AI model generation, set your API key in `.env`:
```env
GEMINI_API_KEY=your_google_ai_studio_key_here
```
*(If no API key is set, QuNTXAI operates using its intelligent offline persona solver).*

---

## 🔬 Testing & QA
Refer to `TEST_REPORT.md` for the complete 10-case test suite covering personas, reasoning tiers, CLI commands, Class 11 solvers, local storage, and server API handling.
