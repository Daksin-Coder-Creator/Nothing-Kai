const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
const searchStr = "`\\n\\n[CONTEXT] The user provided a YouTube link (${videoUrl}). Here is the extracted video metadata to help you answer any questions they have about it:";
const replaceStr = "`\\n\\n[CRITICAL SYSTEM INSTRUCTION: YOU HAVE BEEN PROVIDED WITH THE EXACT VIDEO TRANSCRIPT AND METADATA BELOW. DO NOT TELL THE USER YOU CANNOT WATCH VIDEOS OR EXTRACT TRANSCRIPTS. YOU MUST ANSWER THEIR QUESTIONS DIRECTLY USING THE PROVIDED YOUTUBE CONTEXT.]\\n\\n[EXTRACTED YOUTUBE VIDEO DATA]";
code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', code);
console.log('Done');
