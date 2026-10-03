const fs = require('fs');
let code = fs.readFileSync('src/components/WorkspaceDashboard.tsx', 'utf-8');

const oldUseMemo = `  const localSnippets = useMemo(() => {
    try {
      const saved = localStorage.getItem('nothing-ai-snippets');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  }, [activeTab]);`;

const newUseMemo = `  const localSnippets = useMemo(() => {
    try {
      const allMessages = conversations.flatMap(c => c.messages).filter(m => m.role === 'assistant' || m.role === 'user');
      return allMessages.slice(-20).map(m => ({ text: m.content }));
    } catch (_) {
      return [];
    }
  }, [conversations, activeTab]);`;

code = code.replace(oldUseMemo, newUseMemo);
fs.writeFileSync('src/components/WorkspaceDashboard.tsx', code);
console.log('Done');
