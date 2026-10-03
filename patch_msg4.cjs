const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/export const MessageItem: React\.FC<MessageItemProps> = \(\{ message, onRegenerate, onFeedback, activeTheme = 'midnight' \}\) => \{/,
`export const MessageItem: React.FC<MessageItemProps> = ({ message, onRegenerate, onEdit, onFeedback, activeTheme = 'midnight' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);`
);
fs.writeFileSync('src/components/MessageItem.tsx', code);
