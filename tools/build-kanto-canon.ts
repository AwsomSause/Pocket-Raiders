// Catalog Overhaul Pack, category `kanto-canon`: everything generated from tools/events/co/kanto-canon-*.ts besides the
// events themselves (those are `npm run co:build`). Run: npm run co:kanto-canon
//   src/data/expansion/canonKantoPlaced.json            follow-up scenes and road spaces (core/expansion/canonKantoPlaced.ts)
//   src/data/catalogOverhaul/placement/kanto-canon.json  the shared placement format (STANDARDS.md), keyed by event id
//   src/data/catalogOverhaul/pseudo/kanto-canon.json     chain pseudo-stages (Door shapes), one per Pseudo Stage space
//   src/data/catalogOverhaul/flags/kanto-canon.json      every flag the set writes, and the events (or rules) that write it
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
    sits: SITS[p.sits], attaches: ATTACH[p.attaches], badge: p.badge, tags: p.tags ?? [], level: lvl(p.level), often: 'region',
    // Kanto only, by Kanto stage; `own`: placed by core/expansion/canonRun.ts (the lead's placer skips it, attach still applies); every battle already carries its own level offset.
    canon: s.id, kantoStages: p.stage, levelApplied: true, own: true,
  };
}
write('src/data/catalogOverhaul/placement/kanto-canon.json', placement);

const chains = [
  ...kc.SPACES.filter((s) => s.ps).map((s) => ({ id: `ps_${kc.eid(s.id).replace(/-/g, '_')}`, name: s.ps!.name, entry: kc.eid(s.id), themeId: s.ps!.themeId, tint: kc.TINTS[s.town] ?? kc.TINTS.route, mood: s.ps!.mood, ...(s.ps!.start ? { start: s.ps!.start } : {}) })),
  ...kc.CHAINS.map((c) => ({ id: `ps_${c.entry.replace(/-/g, '_')}`, name: c.name, entry: c.entry, themeId: c.themeId, tint: kc.TINTS[c.town] ?? kc.TINTS.route, mood: c.mood, ...(c.start ? { start: c.start } : {}) })),
];
write('src/data/catalogOverhaul/pseudo/kanto-canon.json', { category: 'kanto-canon', note: 'Kanto Canon Spaces with a Pseudo Stage shape (KANTO_PLACED_*.md).', chains });

// Flags: read from the built event files (run after co:build), plus the ones the `kc` rules and canonRun.ts keep themselves.
const setBy = new Map<string, Set<string>>();
const walk = (x: unknown, ev: string): void => {
  if (Array.isArray(x)) { for (const y of x) walk(y, ev); return; }
  if (!x || typeof x !== 'object') return;
  const o = x as Record<string, unknown>;
  if (o.kind === 'flag' && typeof o.key === 'string' && !('atLeast' in o) && !('atMost' in o)) { if (!setBy.has(o.key)) setBy.set(o.key, new Set()); setBy.get(o.key)!.add(ev); }
  for (const v of Object.values(o)) walk(v, ev);
};
const evDir = join(root, 'src', 'data', 'events');
for (const f of readdirSync(evDir).filter((x) => /^co-kanto-canon-.*\.json$/.test(x)).sort()) {
  for (const e of JSON.parse(readFileSync(join(evDir, f), 'utf8')).events as { id: string; choices: unknown[]; remembers?: { addChoices?: unknown[] }[] }[]) walk([e.choices, (e.remembers ?? []).map((r) => r.addChoices ?? [])], e.id);
}
const RULE_FLAGS: Record<string, string> = {
  'kanto-fossil-fragment': 'kc fossilFragment (core/expansion/canonKantoRules.ts): halves of a fossil held, 0 or 1',
  'kanto-tower-gifts': 'kc partingGift: Parting Gifts the Memorial Wall has answered this run (at most 3)',
  'kc-stat-rolls': 'kc statUp: counter that keeps each random stat roll distinct',
  'kanto-kaiju-lost': 'core/expansion/canonRun.ts failCanonRaid: Kaiju Tentacruel won, the Harbor Market shows its shutters',
};
// Read here (a remembered line waits for them) but written by another set once it lands; until then the line never shows.
const HOOK_FLAGS: Record<string, string> = {
  'kanto-silph-won': 'the Silph Co. raid (Rocket story, not built yet): the Silph lobby and the Sevii Admins remember it',
  'kanto-hideout-won': 'the Rocket Hideout raid (Rocket story, not built yet): the Game Corner remembers it',
  'kanto-moon-third-fossil': 'Mt. Moon (another thread\'s space): the Pewter Museum remembers the third fossil',
  'x-rival-threw-match': 'the rivals thread: the rival at the Route 22 gate remembers a thrown match',
  'x-rival-swapped-teams': 'the rivals thread: the rival at the Route 22 gate remembers swapped teams',
  'x-met-laughing-ghost': 'another region\'s ghost story: Haunter\'s prank remembers it',
  'x-met-mimikyu': 'another region\'s Mimikyu event: Haunter\'s prank remembers it',
};
write('src/data/catalogOverhaul/flags/kanto-canon.json', {
  category: 'kanto-canon',
  note: 'Story flags (ev:<key>) written by the Kanto Canon Spaces. Same run only. A canon flag kanto.x.y is key kanto-x-y.',
  flags: [...[...setBy].sort(([a], [b]) => a.localeCompare(b)).map(([key, evs]) => ({ key, setBy: [...evs].sort() })), ...Object.entries(RULE_FLAGS).map(([key, rule]) => ({ key, rule })), ...Object.entries(HOOK_FLAGS).map(([key, hook]) => ({ key, hook }))],
});

const statusPath = 'src/data/catalogOverhaul/status/kanto-canon.json';
const prev = existsSync(join(root, statusPath)) ? JSON.parse(readFileSync(join(root, statusPath), 'utf8')) : {};
write(statusPath, { category: 'kanto-canon', built: prev.built ?? {}, merged: prev.merged ?? {}, rule: prev.rule ?? {}, scrapped: prev.scrapped ?? [], extra: Object.fromEntries(kc.SPACES.map((s) => [s.id, kc.eid(s.id)])) });
console.log(`kanto-canon: ${kc.SPACES.length} spaces, ${chains.length} pseudo-stages, ${kc.FOLLOWUPS.length} follow-ups, ${kc.ROUTES.length} road spaces`);
