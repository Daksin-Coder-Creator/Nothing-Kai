const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
/    const userMsg: ChatMessage = {[\s\S]*?updatedMessages\.push\(userMsg\);/m,
`    const userMsg: ChatMessage = {
      id: existingUserMsgId || \`msg_user_\${Date.now()}\`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      personaId: selectedModel.id as any,
      files: files,
    };

    let updatedTitle = currentConv.title;
    if (currentConv.messages.length <= 1) {
      updatedTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
    }

    let updatedMessages = baseMessages ? [...baseMessages] : [...currentConv.messages];
    const lastMessage = updatedMessages[updatedMessages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.startsWith('**Error**')) {
        updatedMessages.pop();
    }

    updatedMessages.push(userMsg);`
);

fs.writeFileSync('src/App.tsx', code);
