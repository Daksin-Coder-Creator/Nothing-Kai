const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf8');

code = code.replace(
/  onRegenerateMessage\?: \(messageId: string\) => void;/,
`  onRegenerateMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;`
);

code = code.replace(
/  onRegenerateMessage,/,
`  onRegenerateMessage,
  onEditMessage,`
);

code = code.replace(
/                  message=\{msg\}\n                  onRegenerate=\{/g,
`                  message={msg}
                  onEdit={onEditMessage ? (newContent) => onEditMessage(msg.id, newContent) : undefined}
                  onRegenerate={msg.role !== 'user' && onRegenerateMessage ? () => onRegenerateMessage(msg.id) : `
);

fs.writeFileSync('src/components/ChatView.tsx', code);
