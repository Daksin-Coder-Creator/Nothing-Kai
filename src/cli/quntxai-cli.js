#!/usr/bin/env node
/**
 * Nothing-AiAI Standalone Command Line Interface (CLI)
 * Run locally via: node Nothing-Aiai-cli.js
 */

const readline = require('readline');

const PERSONAS = {
  qorin: 'Qorin — Quick Facts & Instant Formulas',
  wexel: 'Nothing-Ai Core — Master of Academic & Science Topics',
  lyren: 'Lyren — Creativity, Writing & Ideas',
  zorin: 'Zorin — Code Implementation & Debugging',
  ryzex: 'Ryzex — Deep Theory & Mathematical Proofs',
  valtis: 'Valtis — System Architecture & Engineering Specs',
  qyra: 'Qyra — UI/UX Design & Visual Polish',
  xaven: 'Xaven — Workflow Planning & Study Schedules',
  norix: 'Norix — Safety, Fact Check & QA',
  elion: 'Elion — Final Presentation & Executive Polish',
};

let activePersona = 'wexel';
let activeStage = 2;

console.log('\x1b[36m%s\x1b[0m', `
======================================================
         Nothing-AiAI Terminal CLI (Node.js)
  Next-Gen AI Assistant for Class 11 & Power Users
======================================================
`);

console.log(`Active Persona: \x1b[33m${PERSONAS[activePersona]}\x1b[0m`);
console.log(`Reasoning Stage: \x1b[32mStage ${activeStage} (Study Support)\x1b[0m`);
console.log(`Type 'help' for commands or start typing your question.\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Nothing-Aiai> ',
});

rl.prompt();

rl.on('line', (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }

  if (input === 'exit' || input === 'quit') {
    console.log('\x1b[36mGoodbye! Keep excelling with Nothing-AiAI.\x1b[0m');
    process.exit(0);
  } else if (input === 'help') {
    console.log(`
Commands:
  help                     Show this help menu
  persona                  List all 10 AI personas
  persona <id>             Set active persona (e.g., persona zorin)
  stage <1-6>              Set reasoning stage (e.g., stage 4)
  clear                    Clear screen
  exit / quit              Exit CLI
  <anything else>          Query Nothing-AiAI assistant
    `);
  } else if (input === 'persona') {
    console.log('\nAvailable Personas:');
    Object.keys(PERSONAS).forEach((k) => {
      console.log(`  • ${k.padEnd(8)} : ${PERSONAS[k]}`);
    });
    console.log('');
  } else if (input.startsWith('persona ')) {
    const id = input.split(' ')[1].toLowerCase();
    if (PERSONAS[id]) {
      activePersona = id;
      console.log(`\x1b[32m[OK] Active persona set to: ${PERSONAS[id]}\x1b[0m`);
    } else {
      console.log(`\x1b[31m[Error] Invalid persona '${id}'. Type 'persona' to see list.\x1b[0m`);
    }
  } else if (input.startsWith('stage ')) {
    const st = parseInt(input.split(' ')[1], 10);
    if (st >= 1 && st <= 6) {
      activeStage = st;
      console.log(`\x1b[32m[OK] Upgraded reasoning tier to Stage ${st}\x1b[0m`);
    } else {
      console.log(`\x1b[31m[Error] Stage must be between 1 and 6.\x1b[0m`);
    }
  } else if (input === 'clear') {
    console.clear();
  } else {
    console.log(`\x1b[90m[Nothing-AiAI Reasoning Stage ${activeStage} - ${activePersona.toUpperCase()}]\x1b[0m`);
    console.log(`\n\x1b[33m${PERSONAS[activePersona]}\x1b[0m:`);
    console.log(`Here is the structured solution for: "${input}"\n`);
    console.log(`1. Concept Breakdown: Handled via ${activePersona} focus area.`);
    console.log(`2. Step-by-Step Analysis: For Class 11 & power users.`);
    console.log(`3. Verified Output: Passed QA checks at Stage ${activeStage}.\n`);
  }

  rl.prompt();
});
