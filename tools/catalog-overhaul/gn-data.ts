// Greenneedle: writes the placement and pseudo-stage files from the PLACEMENT and CHAINS exports of tools/events/co/greenneedle-*.ts.
// Run: npm run co:gn   (after npm run co:build). Outputs are committed; never edit them by hand.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const dir = join(root, 'tools/events/co');
const placement: Record<string, unknown> = {};
type Beat = { event?: string; stage?: string; home?: number; window?: [number, number] };
type Raw = Record<string, unknown> & { tags?: string[]; needs?: string[]; needsAll?: string[]; beats?: Beat[]; stages?: number[] };
/** Doc stage text ("S1", "S3, S6", "S2-S7") as in-region stage numbers. */
const stagesOf = (t = ''): number[] => {
  const range = /S(\d)\s*-\s*S(\d)/.exec(t);
  if (range) return Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, i) => Number(range[1]) + i);
  return [...t.matchAll(/S(\d)/g)].map((m) => Number(m[1]));
};
/**
 * The placer reads `tags` as the stage tags an event needs (core/co/placement.ts), so the doc's category labels move to `kinds`
 * and `needs` becomes `tags` (several needs = any one of them, written "cave|high"). The key event's own beat gives its step.
 */
function normalise(id: string, raw: Raw): Raw {
  const { tags, needs, needsAll, ...rest } = raw;
  const own = raw.beats?.find((b) => b.event === id);
  const stages = raw.stages ?? (own ? stagesOf(own.stage) : []);
  return {
    ...rest,
    kinds: tags ?? [],
    tags: [...(needs && needs.length > 1 ? [needs.join('|')] : (needs ?? [])), ...(needsAll ?? [])],
    ...(own?.home !== undefined && raw.home === undefined ? { home: own.home, window: own.window } : {}),
    ...(stages.length > 0 ? { stages } : {}),
  };
}
const chains: unknown[] = [];
for (const f of readdirSync(dir).filter((x) => /^greenneedle-.*\.ts$/.test(x)).sort()) {
  const mod = (await import(join(dir, f))) as { PLACEMENT?: Record<string, unknown>; CHAINS?: unknown[] };
  for (const [id, raw] of Object.entries(mod.PLACEMENT ?? {})) placement[id] = normalise(id, raw as Raw);
  chains.push(...(mod.CHAINS ?? []));
}
writeFileSync(join(root, 'src/data/catalogOverhaul/placement/greenneedle.json'), JSON.stringify(placement, null, 1) + '\n');
writeFileSync(join(root, 'src/data/catalogOverhaul/pseudo/greenneedle.json'), JSON.stringify({ category: 'greenneedle', note: 'Greenneedle pseudo stages (chains): the map is drawn from each door event\'s rooms. Built by tools/catalog-overhaul/gn-data.ts.', chains }, null, 1) + '\n');
console.log(`greenneedle: ${Object.keys(placement).length} placements, ${chains.length} chains`);
