const fs = require('fs');
let code = fs.readFileSync('src/components/YoutubeAnalyser.tsx', 'utf-8');

// replace the snippet saver panel
const regex = /\{\/\* Study Snippet Saver Interactive Panel \*\/\}(.|\n)*?\{snippetMessage && \((.|\n)*?<\/div>\s*\)\}/;
code = code.replace(regex, '');

// replace the instruction text
code = code.replace(/<p className="text-\[10px\] text-zinc-500">\s*Highlight any text to save it as a <strong className="text-rose-400">Study Snippet<\/strong>\. Timestamps are fully clickable to play from that moment!\s*<\/p>/, '<p className="text-[10px] text-zinc-500">Timestamps are fully clickable to play from that moment!</p>');

fs.writeFileSync('src/components/YoutubeAnalyser.tsx', code);
console.log('Done');
