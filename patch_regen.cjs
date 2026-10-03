const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
/    let userMsgIndex = msgIndex - 1;\n    while \(userMsgIndex >= 0 && currentConv\.messages\[userMsgIndex\]\.role !== 'user'\) \{/,
`    let userMsgIndex = msgIndex;
    while (userMsgIndex >= 0 && currentConv.messages[userMsgIndex].role !== 'user') {`
);

fs.writeFileSync('src/App.tsx', code);
