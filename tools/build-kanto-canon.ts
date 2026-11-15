// Catalog Overhaul Pack, category `kanto-canon`: everything generated from tools/events/co/kanto-canon-*.ts besides the
// events themselves (those are `npm run co:build`). Run: npm run co:kanto-canon
//   src/data/expansion/canonKantoPlaced.json            follow-up scenes and road spaces (core/expansion/canonKantoPlaced.ts)
//   src/data/catalogOverhaul/placement/kanto-canon.json  the shared placement format (STANDARDS.md), keyed by event id
//   src/data/catalogOverhaul/pseudo/kanto-canon.json     chain pseudo-stages (Door shapes), one per Pseudo Stage space
//   src/data/catalogOverhaul/status/kanto-canon.json     `extra`: space id -> the event that plays it (kept: `checked` dates)
// The catalog itself (canonSpacesKanto.json) is `npm run data:canon-spaces`, which reads the same modules.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(import.meta.dirname, '..');
const coDir = join(root, 'tools', 'events', 'co');
for (const f of readdirSync(coDir).filter((x) => /^kanto-canon-.*\.ts$/.test(x)).sort()) await import(join(coDir, f));
const kc = (await import(join(coDir, '_kc.ts'))) as typeof import('./events/co/_kc.ts');

const write = (rel: string, data: unknown) => { const p = join(root, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(data, null, 1) + '\n'); };
const lvl = (n: number | null) => (n === null ? null : `A${n < 0 ? '-' : '+'}${Math.abs(n)}`);
const SITS = { must: 'must-see', optional: 'optional', town: 'optional', plus: 'optional', door: 'side-branch', hub: 'optional' } as const;
const ATTACH = { before: 'before', instead: 'instead', after: 'after', town: 'town', plus: 'rest' } as const;

write('src/data/expansion/canonKantoPlaced.json', { followups: kc.FOLLOWUPS, routes: kc.ROUTES });

const placement: Record<string, unknown> = {};
for (const s of kc.SPACES) {
  const p = s.placed;
  placement[kc.eid(s.id)] = {
    shape: s.kind === 'PS' ? 'Door' : 'Single', earliest: `A${Math.min(...p.stage)}`, home: p.home, ...(p.window ? { window: p.window } : {}),
    sits: SITS[p.sits], attaches: ATTACH[p.attaches], tags: [p.badge], level: lvl(p.level), often: 'region',
    // Kanto only, by Kanto stage; placed today by core/expansion/canonRun.ts, and every battle already carries its own level offset.
    canon: s.id, kantoStages: p.stage, levelApplied: true,
  };
}
write('src/data/catalogOverhaul/placement/kanto-canon.json', placement);

const chains = kc.SPACES.filter((s) => s.ps).map((s) => ({ id: `ps_${kc.eid(s.id).replace(/-/g, '_')}`, name: s.ps!.name, entry: kc.eid(s.id), themeId: s.ps!.themeId, tint: kc.TINTS[s.town] ?? kc.TINTS.route, mood: s.ps!.mood }));
write('src/data/catalogOverhaul/pseudo/kanto-canon.json', chains);

const statusPath = 'src/data/catalogOverhaul/status/kanto-canon.json';
const prev = existsSync(join(root, statusPath)) ? JSON.parse(readFileSync(join(root, statusPath), 'utf8')) : {};
write(statusPath, { category: 'kanto-canon', built: prev.built ?? {}, merged: prev.merged ?? {}, rule: prev.rule ?? {}, scrapped: prev.scrapped ?? [], extra: Object.fromEntries(kc.SPACES.map((s) => [s.id, kc.eid(s.id)])) });
console.log(`kanto-canon: ${kc.SPACES.length} spaces, ${chains.length} pseudo-stages, ${kc.FOLLOWUPS.length} follow-ups, ${kc.ROUTES.length} road spaces`);
