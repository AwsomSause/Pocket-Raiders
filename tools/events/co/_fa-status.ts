// Writes src/data/catalogOverhaul/status/families-a.json from the built co-families-a-*.json files.
// Run: node tools/events/co/_fa-status.ts   (after npm run co:build and after re-reading the doc section).
// Hand-kept parts live in _fa-retired.json: { merged: { old: live }, rule: { old: system }, scrapped: [] }.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../../..');
const dir = join(root, 'src/data/events');
const out = join(root, 'src/data/catalogOverhaul/status/families-a.json');
const ledger = new Set((JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/ledger.json'), 'utf8')) as { rows: string[][] }).rows.filter((r) => r[5] === 'families-a').map((r) => r[0]!));
const retired = JSON.parse(readFileSync(join(import.meta.dirname, '_fa-retired.json'), 'utf8')) as { merged: Record<string, string>; rule: Record<string, string>; scrapped: string[] };
let before: { built?: Record<string, string> } = {};
try { before = JSON.parse(readFileSync(out, 'utf8')) as typeof before; } catch { /* first run */ }
const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const built: Record<string, string> = {};
const extra: Record<string, string> = {};
for (const f of readdirSync(dir).filter((n) => n.startsWith('co-families-a-')).sort()) {
  for (const e of (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { events: { id: string }[] }).events) {
    if (ledger.has(e.id)) built[e.id] = before.built?.[e.id] ?? today;
    else extra[`scene:${e.id}`] = e.id;
  }
}
writeFileSync(out, JSON.stringify({ category: 'families-a', built, merged: retired.merged, rule: retired.rule, scrapped: retired.scrapped, extra }, null, 1) + '\n');
const done = Object.keys(built).length + Object.keys(retired.merged).length + Object.keys(retired.rule).length + retired.scrapped.length;
console.log(`families-a: ${Object.keys(built).length} built, ${Object.keys(retired.merged).length} merged, ${Object.keys(retired.rule).length} rule, ${retired.scrapped.length} scrapped, ${Object.keys(extra).length} extra scenes; ${ledger.size - done} of ${ledger.size} pending`);
