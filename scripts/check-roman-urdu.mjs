#!/usr/bin/env node

import { readFileSync } from 'fs';

const file = './lib/i18n.js';
const source = readFileSync(file, 'utf8');

const romanWords = new Set([
  'aap', 'apni', 'apna', 'aur', 'abhi', 'bhi', 'hai', 'ho', 'hoga', 'hoon',
  'jo', 'koi', 'kuch', 'ki', 'ka', 'ke', 'ko', 'mein', 'par', 'pehle', 'sahi',
  'se', 'sirf', 'taake', 'yahan', 'ye', 'woh', 'nahi', 'nahin', 'gaya', 'gaye',
  'kar', 'karein', 'karna', 'karke', 'ja', 'jayein', 'jaiye', 'jata', 'jati',
  'wapis', 'dobara', 'ham', 'hum', 'aayi', 'aaye', 'is', 'yeh', 'aur', 'samajh',
  'thori', 'bas', 'sab', 'bina', 'lakin', 'hamesha', 'kahin', 'nah', 'kya', 'kya',
  'to', 'bata', 'batain', 'dikh', 'dikha', 'dikhayein', 'rakhein', 'rakhna'
]);

const entries = [...source.matchAll(/'([^']+)':\s*\[([\s\S]*?)\]/g)];
const hits = [];

for (const [, key, valueBlock] of entries) {
  const values = [...valueBlock.matchAll(/'((?:\\'|[^'])*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
  if (values.length < 3) continue;

  const en = values[1] || '';
  const tokens = en.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const found = [...new Set(tokens.filter((token) => romanWords.has(token)))];

  if (found.length) {
    hits.push({ key, en, found });
  }
}

if (!hits.length) {
  console.log('No Roman Urdu words detected in the English translation values.');
  process.exit(0);
}

console.log(`Roman Urdu words found in English values (${hits.length}):`);
for (const { key, en, found } of hits) {
  console.log(`- ${key}: ${en}`);
  console.log(`  hits: ${found.join(', ')}`);
}
process.exit(0);
