const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/  onRegenerate\?: \(\) => void;/,
`  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;`
);

code = code.replace(
/export const MessageItem: React.FC<MessageItemProps> = \(\{ message, onRegenerate, onFeedback, activeTheme = 'midnight' \}\) => \{/,
`export const MessageItem: React.FC<MessageItemProps> = ({ message, onRegenerate, onEdit, onFeedback, activeTheme = 'midnight' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
`
);

// We need to add the edit button to the user message, and when isEditing is true, we render a textarea instead of the content.
