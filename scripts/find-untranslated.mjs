#!/usr/bin/env node
// scripts/find-untranslated.mjs
//
// Batata hai ke ab tak kaun si files mein text abhi bhi seedha likha hua hai
// (yani zaban badalne par nahi badlega).
//
//   node scripts/find-untranslated.mjs            → har file ka summary
//   node scripts/find-untranslated.mjs --list     → asal strings bhi dikhao
//   node scripts/find-untranslated.mjs app/(main) → sirf ek folder
//
// Ye sirf batata hai, khud kuch badalta nahi — mehfooz hai, kabhi bhi chalao.

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'public', 'dist', 'build']);

// JSX ke andar ka nazar aane wala text + wo attributes jo user parhta hai
const TEXT_NODE = />\s*([A-Z][A-Za-z0-9][^<>{}\n]{2,60}?)\s*</g;
const ATTRS = /(?:placeholder|title|alt|aria-label)=["']([^"']{3,60})["']/g;

// Ye text kabhi tarjuma nahi hota — inhein ginti mein na lo
const IGNORE = [
  /^https?:/i, /^\//, /^\{/, /^[\d\s.,:+()-]+$/,
  /^(PKR|km|cc|OK|ID|URL|API|AI|SUV|VIN|WhatsApp|Facebook|Instagram|YouTube|TikTok|Twitter|LinkedIn)$/i,
  /^0\d{2}[X\d-]/,            // phone masks: 03XX-XXXXXXX
  /^[A-Za-z]+@/,              // emails
];

const shouldIgnore = (s) => IGNORE.some((re) => re.test(s.trim()));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(jsx|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

const showList = process.argv.includes('--list');
const filterArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const start = filterArg ? join(ROOT, filterArg) : ROOT;

const files = walk(start);
const rows = [];
let grandTotal = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const found = new Set();
  for (const m of src.matchAll(TEXT_NODE)) if (!shouldIgnore(m[1])) found.add(m[1].trim());
  for (const m of src.matchAll(ATTRS)) if (!shouldIgnore(m[1])) found.add(m[1].trim());
  if (!found.size) continue;
  grandTotal += found.size;
  rows.push({ file: relative(ROOT, file), count: found.size, wired: src.includes('useLang'), items: [...found] });
}

rows.sort((a, b) => b.count - a.count);

const done = rows.filter((r) => r.wired);
const todo = rows.filter((r) => !r.wired);

console.log(`\n  Baqi hardcoded strings: ${grandTotal}`);
console.log(`  t() lagi hui files    : ${done.length}`);
console.log(`  Baqi files            : ${todo.length}\n`);

for (const r of todo) {
  console.log(`  ${String(r.count).padStart(4)}  ${r.file}`);
  if (showList) for (const s of r.items) console.log(`        · ${s}`);
}

if (done.length) {
  console.log(`\n  t() lagi hui (in mein bache hue text ka jaiza le lein):`);
  for (const r of done) console.log(`  ${String(r.count).padStart(4)}  ${r.file}`);
}

console.log('');
