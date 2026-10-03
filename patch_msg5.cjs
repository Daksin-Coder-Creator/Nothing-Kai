const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/  onRegenerate\?: \(\) => void;/,
`  onRegenerate?: () => void;\n  onEdit?: (newContent: string) => void;`
);
fs.writeFileSync('src/components/MessageItem.tsx', code);
