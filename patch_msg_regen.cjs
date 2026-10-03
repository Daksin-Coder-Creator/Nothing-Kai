const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/              \{isUser && onEdit && \(\n                <button\n                  type="button"\n                  onClick=\{\(\) => setIsEditing\(!isEditing\)\}\n                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"\n                  title="Edit Message"\n                >\n                  <Edit3 className="w-3\.5 h-3\.5 text-neutral-400" \/>\n                <\/button>\n              \)\}/,
`              {isUser && onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Edit Message"
                >
                  <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}
              {isUser && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Regenerate from this message"
                >
                  <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}`
);

fs.writeFileSync('src/components/MessageItem.tsx', code);
