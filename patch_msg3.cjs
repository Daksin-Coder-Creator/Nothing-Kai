const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/import \{([\s\S]*?)Copy,/,
`import {$1Copy, Edit3,`
);

code = code.replace(
/<Code2 className="w-3\.5 h-3\.5 text-neutral-400" \/>/,
`<Edit3 className="w-3.5 h-3.5 text-neutral-400" />`
);

fs.writeFileSync('src/components/MessageItem.tsx', code);
