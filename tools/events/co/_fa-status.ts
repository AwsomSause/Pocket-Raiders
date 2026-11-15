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

// The re-read table in docs/status/co-families-a.md (between the two markers): one row per ledger id.
const notePath = join(root, 'docs/status/co-families-a.md');
const rows = (JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/ledger.json'), 'utf8')) as { rows: string[][] }).rows.filter((r) => r[5] === 'families-a');
const lineOf = (r: string[]): string => {
  const id = r[0]!;
  const state = built[id] ? `built, re-read ${built[id]}` : retired.merged[id] ? `merged into \`${retired.merged[id]}\`, re-read ${today}` : retired.rule[id] ? `rule: ${retired.rule[id]}` : retired.scrapped.includes(id) ? 'scrapped' : 'pending';
  return `| \`${id}\` | ${r[3]!.replace('.md', '')} ${r[4]} | ${state} |`;
};
try {
  const note = readFileSync(notePath, 'utf8');
  const [head, rest] = note.split('<!-- table:start -->');
  const tail = rest!.split('<!-- table:end -->')[1];
  const table = ['| Id | Doc section | State |', '|---|---|---|', ...rows.map(lineOf)].join('\n');
  writeFileSync(notePath, `${head}<!-- table:start -->\n${table}\n<!-- table:end -->${tail}`);
} catch { console.log('(no status note yet: docs/status/co-families-a.md)'); }
