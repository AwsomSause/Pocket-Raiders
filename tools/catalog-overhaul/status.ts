// Catalog Overhaul Pack: prints how many catalog ids each category has finished. Run: npm run co:status
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '../../src/data/catalogOverhaul');
const ledger = (JSON.parse(readFileSync(join(dir, 'ledger.json'), 'utf8')) as { rows: string[][] }).rows;
const total = new Map<string, number>();
for (const r of ledger) total.set(r[5]!, (total.get(r[5]!) ?? 0) + 1);
const done = new Map<string, number>();
const extra = new Map<string, number>();
for (const f of readdirSync(join(dir, 'status')).filter((n) => n.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(dir, 'status', f), 'utf8')) as { category: string; built?: object; merged?: object; rule?: object; scrapped?: string[]; extra?: object };
  done.set(s.category, Object.keys(s.built ?? {}).length + Object.keys(s.merged ?? {}).length + Object.keys(s.rule ?? {}).length + (s.scrapped ?? []).length);
  extra.set(s.category, Object.keys(s.extra ?? {}).length);
}
let all = 0;
for (const c of [...new Set([...total.keys(), ...done.keys()])].sort()) {
  all += done.get(c) ?? 0;
  console.log(`${c.padEnd(14)} ${String(done.get(c) ?? 0).padStart(4)} / ${String(total.get(c) ?? 0).padEnd(4)}${extra.get(c) ? `  + ${extra.get(c)} from its own docs` : ''}`);
}
console.log(`${'all'.padEnd(14)} ${String(all).padStart(4)} / ${ledger.length}`);
