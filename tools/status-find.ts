// Finds status notes by word: `npm run status:find -- word [word...]`.
// Searches the frozen docs/status/INDEX.md lines plus the first line of every note file, so a PR only adds its own note
// (no shared INDEX.md edit, which conflicted on nearly every PR).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const words = process.argv.slice(2).map((w) => w.toLowerCase());
if (!words.length) {
  console.log('usage: npm run status:find -- word [word...]');
  process.exit(1);
}
const dir = 'docs/status';
const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
const out: string[] = [];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'README.md').sort()) {
  const first = readFileSync(join(dir, f), 'utf8').split('\n').find((l) => l.trim() && !l.startsWith('#')) ?? '';
  if (hit(f + ' ' + first)) out.push(`${f}: ${first.replace(/^[-*]\s*/, '').slice(0, 110)}`);
}
console.log(out.length ? out.join('\n') : 'no matching status note');
