// Save Inspector CLI (S330/S331): `node tools/save-inspect.ts <file>...` prints what each save record is, the upgrade
// steps a load would take, and what is wrong with it. Read-only.
import { readFileSync } from 'node:fs';
import type * as Inspector from '../src/save/saveInspector.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const files = process.argv.slice(2);
if (files.length === 0) { console.log('Usage: node tools/save-inspect.ts <save-record.json>...'); process.exit(0); }
const { inspectSave, reportLines } = await loadModule<typeof Inspector>('/src/save/saveInspector.ts');
await closeModules();
let bad = 0;
for (const f of files) {
  const r = inspectSave(readFileSync(f, 'utf8'));
  if (r.verdict === 'broken') bad++;
  console.log(`${f}\n  ${reportLines(r).join('\n  ')}`);
}
process.exit(bad ? 1 : 0);
