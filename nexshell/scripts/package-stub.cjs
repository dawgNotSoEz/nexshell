#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '..', 'dist');
const outDir = path.resolve(__dirname, '..', 'release');
const artifact = path.join(outDir, 'nexshell-package.txt');

if (!fs.existsSync(distDir)) {
  console.error('package-stub: dist output missing. Run "npm run build" first.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  artifact,
  [
    'NexShell Packaging Stub',
    `Timestamp: ${new Date().toISOString()}`,
    `Contents: ${fs.readdirSync(distDir).join(', ')}`,
    'Replace this stub with electron-builder or forge when ready.'
  ].join('\n'),
  'utf8'
);

console.log(`package-stub: wrote ${artifact}`);
