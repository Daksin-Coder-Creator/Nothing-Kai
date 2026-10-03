const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
/  const handleRegenerateMessage = async \([^)]*\) => \{[\s\S]*?await handleSendMessage\(userMsg\.content, userMsg\.files\);\n  \};/,
`  const handleEditMessage = async (messageId: string, newContent: string) => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;
    const msgIndex = currentConv.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const baseMessages = currentConv.messages.slice(0, msgIndex);
    await handleSendMessage(newContent, undefined, undefined, baseMessages);
  };

  const handleRegenerateMessage = async (targetMessageId: string) => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;
    const msgIndex = currentConv.messages.findIndex((m) => m.id === targetMessageId);
    if (msgIndex === -1) return;

    let userMsgIndex = msgIndex - 1;
    while (userMsgIndex >= 0 && currentConv.messages[userMsgIndex].role !== 'user') {
      userMsgIndex--;
    }
    if (userMsgIndex < 0) return;

    const userMsg = currentConv.messages[userMsgIndex];
    const baseMessages = currentConv.messages.slice(0, userMsgIndex);
    
    // Trigger regeneration using the existing user message ID and content
    await handleSendMessage(userMsg.content, userMsg.files, undefined, baseMessages, userMsg.id);
  };`
);

fs.writeFileSync('src/App.tsx', code);
