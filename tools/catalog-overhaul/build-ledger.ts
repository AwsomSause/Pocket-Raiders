// Catalog Overhaul Pack: builds src/data/catalogOverhaul/ledger.json (every catalog id, its verdict, the doc that scripts it and the
// category thread that owns it) from the pack's CATALOG_INDEX.md, and oldPlacement.json (where each old event sat on the map).
// Run: npm run co:ledger -- [path to CATALOG_INDEX.md] [--placement]. The placement snapshot is taken once, before any co file exists.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { closeModules, loadModule, root } from '../lib/gameModules.ts';

const args = process.argv.slice(2);
const index = args.find((a) => !a.startsWith('--')) ?? '/mnt/project-files/catalog_overhaul_pack/catalog_overhaul/CATALOG_INDEX.md';
const out = `${root}/src/data/catalogOverhaul`;

/** Which category thread owns the ids a doc scripts (plan: /mnt/project-files/plans/catalog-overhaul/PLAN.md section 3). */
export function categoryOf(doc: string): string {
  const sf = /^STORY_FAMILIES_(\d+)\.md$/.exec(doc);
  if (sf) {
    const n = Number(sf[1]);
    if (n >= 19) return 'singles';
    if ([1, 2, 3, 4, 7].includes(n)) return 'families-a';
    if (n === 6) return 'families-b';
    if (n === 9 || n === 10) return 'families-c';
    if ([14, 15, 17].includes(n)) return 'places';
    if (n === 5 || n === 8) return 'people';
    if ([11, 12, 16].includes(n)) return 'markets';
    if (n === 13 || n === 18) return 'evil-story';
  }
  if (doc === 'ROAD_ROSTER.md' || doc === 'QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md') return 'people';
  if (doc === 'QUESTLINES_RIVALS.md') return 'rivals';
  if (doc === 'QUESTLINES_ALPHAS_AND_ANOMALIES.md' || doc === 'RULE') return 'legends';
  if (doc === 'QUESTLINES_ASH.md') return 'anime';
  if (doc === 'SCRAPPED') return 'lead';
  throw new Error(`no category for ${doc}`);
}

const rows: string[][] = [];
for (const line of readFileSync(index, 'utf8').split('\n')) {
  if (!line.startsWith('| `')) continue;
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  const [id, title, verdict, doc, ...rest] = cells as [string, string, string, string, ...string[]];
  rows.push([id.replace(/`/g, ''), title, verdict, doc, rest.join('|').trim(), categoryOf(doc)]);
}
const seen = new Set<string>();
const unique = rows.filter((r) => !seen.has(r[0]!) && seen.add(r[0]!));
writeFileSync(`${out}/ledger.json`, `{"columns":["id","title","verdict","doc","section","category"],"rows":[\n${unique.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
console.log(`ledger.json: ${unique.length} ids`);

if (args.includes('--placement')) {
  if (readdirSync(`${root}/src/data/events`).some((f) => f.startsWith('co-')) && !args.includes('--force')) throw new Error('co files exist: the placement snapshot must be taken from the old events');
  const { getContent } = await loadModule<{ getContent: () => { events: Map<string, Record<string, unknown>> } }>('/src/data/index.ts');
  const KEEP = ['name', 'group', 'stop', 'rarity', 'tags', 'forced', 'priority', 'pseudo', 'types', 'minStage', 'requires', 'keyItem', 'gameEvent', 'mode', 'modeStop', 'secret', 'callback', 'room', 'scene'];
  const dull = (v: unknown) => v === undefined || v === null || v === false || (Array.isArray(v) && v.length === 0);
  const events = getContent().events;
  const lines: string[] = [];
  for (const [id] of unique) {
    const e = events.get(id!);
    if (!e) continue;
    const meta: Record<string, unknown> = {};
    for (const k of KEEP) if (!dull(e[k]) && !(k === 'minStage' && e[k] === 1) && !(k === 'stop' && e[k] === 'event') && !(k === 'rarity' && e[k] === 'common')) meta[k] = e[k];
    lines.push(`${JSON.stringify(id)}:${JSON.stringify(meta)}`);
  }
  writeFileSync(`${out}/oldPlacement.json`, `{\n${lines.join(',\n')}\n}\n`);
  console.log(`oldPlacement.json: ${lines.length} old events`);
  await closeModules();
} else if (!existsSync(`${out}/oldPlacement.json`)) console.log('no oldPlacement.json yet: run with --placement');
