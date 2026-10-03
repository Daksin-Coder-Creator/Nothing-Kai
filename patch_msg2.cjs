const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(
/            \{\/\* Actions \*\/\}\n            <div className="flex items-center gap-1">/,
`            {/* Actions */}
            <div className="flex items-center gap-1">
              {isUser && onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Edit Message"
                >
                  <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}`
);

code = code.replace(
/          \{\/\* Main Message Text with progressive typing animation \*\/\}\n          <div className=\{\`text-sm leading-relaxed font-normal \$\{isUser \? 'text-white text-left' : 'text-white text-left'\}\`\}>/,
`          {/* Main Message Text with progressive typing animation */}
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-24 p-3 rounded-lg bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.content);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onEdit) {
                      onEdit(editText);
                      setIsEditing(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-gray-200 transition"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
          <div className={\`text-sm leading-relaxed font-normal \${isUser ? 'text-white text-left' : 'text-white text-left'}\`}>`
);

// Close the div we opened for the isEditing ternary branch. We'll find where it closes.
code = code.replace(
/            \)\}\n          <\/div>\n        <\/div>\n      <\/div>\n      \)\}\n    <\/motion.div>/,
`            )}
          </div>
          )}
        </div>
      </div>
      )}
    </motion.div>`
);

fs.writeFileSync('src/components/MessageItem.tsx', code);
