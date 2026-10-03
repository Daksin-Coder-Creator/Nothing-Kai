const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// replace daily learning goals props
code = code.replace(/\s*\/\/ Daily learning goals\n\s*dailyGoalType\?: 'tokens' \| 'questions';\n\s*dailyGoalTarget\?: number;\n\s*dailyGoalProgress\?: number;\n\s*onSetDailyGoal\?: \(type: 'tokens' \| 'questions', target: number\) => void;\n/s, '');
code = code.replace(/\s*\/\/ Daily learning goals\n\s*dailyGoalType = 'questions',\n\s*dailyGoalTarget = 5,\n\s*dailyGoalProgress = 0,\n\s*onSetDailyGoal,\n/s, '');

// just double checking the UI if there are any references
fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Done');
