const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf8');

code = code.replace(
/                  onRegenerate=\{msg\.role !== 'user' && onRegenerateMessage \? \(\) => onRegenerateMessage\(msg\.id\) : [\s\S]*?msg\.id === messages\[messages\.length - 1\]\?\.id \? onRegenerateLast : undefined\n                  \}/,
`                  onRegenerate={onRegenerateMessage ? () => onRegenerateMessage(msg.id) : undefined}`
);

fs.writeFileSync('src/components/ChatView.tsx', code);
