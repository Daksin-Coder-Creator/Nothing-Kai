const fs = require('fs');
let code = fs.readFileSync('src/components/WorkspaceDashboard.tsx', 'utf-8');

// remove Scholar Explorer
const scholarRegex = /\{\s*id:\s*'scholar-explorer'[\s\S]*?points:\s*40\s*\},\n/g;
code = code.replace(scholarRegex, '');

// remove snippet count logic
code = code.replace(/const snippetsStr = localStorage\.getItem\('nothing-ai-snippets'\) \|\| '\[\]';\n\s*let snippetsCount = 0;\n\s*try \{\n\s*snippetsCount = JSON\.parse\(snippetsStr\)\.length;\n\s*\} catch \(\_\) \{\}\n\s*const scholarExplorerUnlocked = snippetsCount >= 1;\n/g, '');

fs.writeFileSync('src/components/WorkspaceDashboard.tsx', code);
console.log('Done');
