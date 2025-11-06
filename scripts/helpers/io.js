const fs = require('fs');
const path = require('path');

function readPrompts(filePath = 'data/prompts.txt') {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  return raw.split('\n').map(s => s.trim()).filter(Boolean);
}

function saveOutput(data, prefix = 'run') {
  const dir = path.join(process.cwd(), 'data/outputs');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${prefix}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

module.exports = { readPrompts, saveOutput };
