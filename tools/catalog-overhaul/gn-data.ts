// Greenneedle: writes the placement and pseudo-stage files from the PLACEMENT and CHAINS exports of tools/events/co/greenneedle-*.ts.
// Run: npm run co:gn   (after npm run co:build). Outputs are committed; never edit them by hand.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const dir = join(root, 'tools/events/co');
const placement: Record<string, unknown> = {};
const chains: unknown[] = [];
for (const f of readdirSync(dir).filter((x) => /^greenneedle-.*\.ts$/.test(x)).sort()) {
  const mod = (await import(join(dir, f))) as { PLACEMENT?: Record<string, unknown>; CHAINS?: unknown[] };
  Object.assign(placement, mod.PLACEMENT ?? {});
  chains.push(...(mod.CHAINS ?? []));
}
writeFileSync(join(root, 'src/data/catalogOverhaul/placement/greenneedle.json'), JSON.stringify(placement, null, 1) + '\n');
writeFileSync(join(root, 'src/data/catalogOverhaul/pseudo/greenneedle.json'), JSON.stringify({ category: 'greenneedle', note: 'Greenneedle pseudo stages (chains): the map is drawn from each door event\'s rooms. Built by tools/catalog-overhaul/gn-data.ts.', chains }, null, 1) + '\n');
console.log(`greenneedle: ${Object.keys(placement).length} placements, ${chains.length} chains`);
