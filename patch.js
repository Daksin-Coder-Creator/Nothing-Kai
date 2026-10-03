const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleSendMessage = async \([^)]*\) => \{/;
// Wait, I can just rewrite it exactly.
