const fs = require('fs');
let code = fs.readFileSync('src/components/WorkspaceDashboard.tsx', 'utf-8');

// Replace quiz description
code = code.replace(/Formulate multiple-choice practice questions dynamically from your saved Study Snippets\./g, 'Formulate multiple-choice practice questions dynamically from your recent study conversations.');
code = code.replace(/The quiz is customized based on active concepts you've highlighted and saved into your Study Snippets\./g, 'The quiz is customized based on your recent academic chat history.');

// Replace error empty state
code = code.replace(/<p className="text-xs font-bold text-amber-300">No Study Snippets Found<\/p>/g, '<p className="text-xs font-bold text-amber-300">No Chat History Found</p>');
code = code.replace(/You haven't saved any academic snippets yet! Highlight key concepts or answers in your study chat sessions to add them as clips\. Once you save a few snippets, the AI can generate practice questions\./g, 'You haven\'t had any conversations yet. Start chatting about your academic topics, and the AI will generate practice questions based on your discussions.');

// Replace label
code = code.replace(/<span className="font-bold text-zinc-300">Your Saved Study Concepts \(\{localSnippets\.length\}\)<\/span>/g, '<span className="font-bold text-zinc-300">Recent Chat Messages ({localSnippets.length})</span>');

// Replace Scholar Explorer Achievement
const scholarRegex = /\{\s*id:\s*'scholar-explorer'[\s\S]*?color:\s*'from-sky-500 to-blue-600',\s*\},\n/g;
code = code.replace(scholarRegex, '');

// remove snippet states
code = code.replace(/const localSnippetsStr = localStorage\.getItem\('nothing-ai-snippets'\);\n\s*const localSnippets = localSnippetsStr \? JSON\.parse\(localSnippetsStr\) : \[\];/g, `
    const allMessages = conversations.flatMap(c => c.messages).filter(m => m.role === 'assistant' || m.role === 'user');
    const localSnippets = allMessages.slice(-20).map(m => ({ text: m.content }));
`);

// also remove snippetsCount calculation
code = code.replace(/const snippetsStr = localStorage\.getItem\('nothing-ai-snippets'\);\n\s*const snippets = snippetsStr \? JSON\.parse\(snippetsStr\) : \[\];\n\s*const snippetsCount = snippets\.length;/g, '');

fs.writeFileSync('src/components/WorkspaceDashboard.tsx', code);
console.log('Done');
