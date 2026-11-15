// Catalog Overhaul, anime row: writes the files that describe what the anime modules built.
//   src/data/catalogOverhaul/status/anime.json     built catalog ids + every questline (AN1.., AQ1..) -> its first event
//   src/data/catalogOverhaul/placement/anime.json  the placement block of each questline (the lead thread's placer reads it)
//   src/data/catalogOverhaul/flags/anime.json      every remembered flag: who sets it, who reads it; flags other threads own
//   docs/status/co-anime.md                        status note: re-read table and real limits
// Run after `npm run co:build`: node tools/catalog-overhaul/anime-report.ts
//   ANIME_ONLY=anime-3 node tools/catalog-overhaul/anime-report.ts   one module only, written under node_modules/.anime-report/anime-3/
//   (so several modules can be checked at once without touching the shared files; the gate test reads it with the same ANIME_ONLY).
//   tests/unit/fixtures/coAnimeNotButtons.json                     each module's NOT_A_BUTTON exceptions (doc choices that are not buttons, with a reason)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Json = Record<string, unknown>;
interface Mod { QUESTLINES?: Record<string, string>; PLACEMENT?: Record<string, Json>; LIMITS?: Record<string, string[]>; CHECKED?: Record<string, string>; NOT_A_BUTTON?: Record<string, Record<string, string>> }
const root = join(import.meta.dirname, '../..');
const coDir = join(root, 'tools/events/co');
const only = process.env.ANIME_ONLY;
const names = readdirSync(coDir).filter((f) => /^anime-.*\.ts$/.test(f)).map((f) => f.slice(0, -3)).filter((n) => !only || n === only).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
if (only && !names.length) throw new Error(`no module tools/events/co/${only}.ts`);
const outRoot = only ? join(root, 'node_modules/.anime-report', only) : root;
const order = (a: string, b: string) => a.slice(0, 2).localeCompare(b.slice(0, 2)) || Number(a.slice(2)) - Number(b.slice(2));

const questlines: Record<string, string> = {};
const placement: Record<string, Json> = {};
const limits: Record<string, string[]> = {};
const checked: Record<string, string> = {};
const notButtons: Record<string, Record<string, string>> = {};
const moduleOf: Record<string, string> = {};
const events: (Json & { id: string })[] = [];
for (const name of names) {
  const mod = (await import(join(coDir, `${name}.ts`))) as Mod;
  for (const [q, id] of Object.entries(mod.QUESTLINES ?? {})) {
    if (questlines[q]) throw new Error(`${q} is in two modules`);
    questlines[q] = id;
    moduleOf[q] = name;
  }
  Object.assign(placement, mod.PLACEMENT ?? {});
  Object.assign(limits, mod.LIMITS ?? {});
  Object.assign(checked, mod.CHECKED ?? {});
  Object.assign(notButtons, mod.NOT_A_BUTTON ?? {});
  events.push(...(JSON.parse(readFileSync(join(root, `src/data/events/co-${name}.json`), 'utf8')) as { events: (Json & { id: string })[] }).events);
}
const ids = new Set(events.map((e) => e.id));
for (const [q, id] of Object.entries(questlines)) if (!ids.has(id)) throw new Error(`${q} points at ${id}, which no anime module builds (run co:build first)`);
for (const id of Object.keys(placement)) if (!ids.has(id)) throw new Error(`placement for unknown event ${id}`);

// ---- status ----
const ledger = (JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/ledger.json'), 'utf8')) as { rows: string[][] }).rows;
const mine = ledger.filter((r) => r[5] === 'anime').map((r) => r[0]!);
/** The questline each catalog id of this category is built into (see docs/status/co-anime.md). */
const CATALOG_HOME: Record<string, string> = { 'ash-training': 'AQ1', 'brock-cooking': 'AQ43', 'lillie-nebby': 'AQ51' };
const built: Record<string, string> = {};
for (const id of mine) if (ids.has(id) && checked[CATALOG_HOME[id] ?? '']) built[id] = checked[CATALOG_HOME[id]!]!;
const sorted = Object.keys(questlines).sort(order);
const write = (file: string, data: unknown) => {
  mkdirSync(join(outRoot, file, '..'), { recursive: true });
  writeFileSync(join(outRoot, file), typeof data === 'string' ? data : JSON.stringify(data, null, 1) + '\n');
};
write('src/data/catalogOverhaul/status/anime.json', { category: 'anime', built, merged: {}, rule: {}, scrapped: [], extra: Object.fromEntries(sorted.map((q) => [q, questlines[q]])) });
write('src/data/catalogOverhaul/placement/anime.json', Object.fromEntries(sorted.filter((q) => placement[questlines[q]!]).map((q) => [questlines[q], placement[questlines[q]!]])));

write('tests/unit/fixtures/coAnimeNotButtons.json', Object.fromEntries(Object.keys(notButtons).sort(order).map((q) => [q, notButtons[q]])));

// ---- flags ----
const sets = new Map<string, Set<string>>();
const reads = new Map<string, Set<string>>();
const note = (map: Map<string, Set<string>>, key: string, id: string) => (map.get(key) ?? map.set(key, new Set()).get(key)!).add(id);
const walk = (v: unknown, id: string, reading: boolean): void => {
  if (Array.isArray(v)) return v.forEach((x) => walk(x, id, reading));
  if (!v || typeof v !== 'object') return;
  const o = v as Json;
  if ((o.kind === 'flag' || o.kind === 'flagAge') && typeof o.key === 'string') note(reading || o.kind === 'flagAge' ? reads : sets, o.key, id);
  for (const [k, x] of Object.entries(o)) walk(x, id, reading || k === 'requires' || k === 'when' || k === 'secret');
};
for (const e of events) walk(e, e.id, false);
const keys = [...new Set([...sets.keys(), ...reads.keys()])].sort();
write('src/data/catalogOverhaul/flags/anime.json', {
  note: 'Generated by tools/catalog-overhaul/anime-report.ts. `flags`: set by an anime event. `external`: read by an anime event, set by another thread\'s event (or not yet by anyone). Pack flag `a.b_c` is key `a-b-c`.',
  flags: keys.filter((k) => sets.has(k)).map((key) => ({ key, setBy: [...sets.get(key)!].sort(), readBy: [...(reads.get(key) ?? [])].sort() })),
  external: keys.filter((k) => !sets.has(k)).map((key) => ({ key, readBy: [...reads.get(key)!].sort() })),
});

// ---- status note ----
const fixture = JSON.parse(readFileSync(join(root, 'tests/unit/fixtures/coAnimeChoices.json'), 'utf8')) as { questlines: Record<string, { title: string }> };
const DEEP1 = new Set(['AN5', 'AN9', 'AN28', 'AN35']);
const DEEP2 = new Set(['AQ16', 'AQ17', 'AQ19', 'AQ24', 'AQ26', 'AQ27', 'AQ32', 'AQ38', 'AQ39', 'AQ40', 'AQ41', 'AQ49']);
const docOf = (q: string) => (DEEP1.has(q) ? 'QUESTLINES_DEEPENED_1' : DEEP2.has(q) ? 'QUESTLINES_DEEPENED_2' : q.startsWith('AN') ? 'QUESTLINES_ANIME_INSPIRED' : 'QUESTLINES_ASH');
const prefix = (q: string) => `${q.slice(0, 2).toLowerCase()}${q.slice(2).padStart(2, '0')}-`;
const count = (q: string) => events.filter((e) => e.id.startsWith(prefix(q)) || Object.entries(CATALOG_HOME).some(([id, home]) => home === q && e.id === id)).length;
const all = Object.keys(fixture.questlines).sort(order);
const lines: string[] = [
  '# Catalog Overhaul: anime and Pokémon-anime questlines (row 14)',
  '',
  'Generated by `node tools/catalog-overhaul/anime-report.ts` from `tools/events/co/anime-*.ts`. Do not edit by hand: change the module (its `CHECKED` and `LIMITS` lists) and run the tool.',
  '',
  `- Source docs (pack \`catalog_overhaul/\`): \`QUESTLINES_ANIME_INSPIRED.md\` (AN1 to AN36), \`QUESTLINES_ASH.md\` (AQ1 to AQ60), \`QUESTLINES_DEEPENED_1.md\` (the full AN5, AN9, AN28, AN35) and \`QUESTLINES_DEEPENED_2.md\` (twelve full AQ stories). The Alphas, Past Champions, Gym Leaders and Future parts of DEEPENED_1 belong to the legends, people, families-c and families-b rows.`,
  `- Built: **${sorted.length} of ${all.length} questlines**, ${events.length} events in ${names.length} modules. Catalog ids: ${mine.map((id) => `\`${id}\` (${ids.has(id) ? `in ${CATALOG_HOME[id]}` : 'pending'})`).join(', ')}.`,
  '- Engine pieces added for these questlines: `src/core/events/questline.ts` (`flagAge`, `partyLine`, `friendshipLine`, `laterEvent`), tests `tests/unit/questline.test.ts`. Items: `src/data/itemCatalog/anime.json`.',
  '- How a questline is laid out: every beat is its own event; beats are chained by remembered flags. A Stage-Three\'s later beats open a few nodes on (`laterEvent`); a Companion\'s small scenes come as its Bond rises (`partyLine`), its turning point two stages after the meeting (`flagAge`). Placement blocks for the lead thread\'s placer: `src/data/catalogOverhaul/placement/anime.json`.',
  '- Every story fight is marked so a loss never ends the run. Nothing here crosses runs: "in later runs" afterstories, **Save** flags and "on this save" variants are not built (Kice, 2026-11-14).',
  '- Gate: `tests/unit/coAnime.test.ts` (every choice label the docs list is offered, rooms reachable, species and moves exist, flags registered, no fight can end a run).',
  '',
  '## Re-read table',
  '',
  '| Questline | Title | Doc | Module | Events | Re-read against the doc |',
  '|---|---|---|---|---|---|',
  ...all.map((q) => `| ${q} | ${fixture.questlines[q]!.title} | ${docOf(q)} | ${moduleOf[q] ?? '-'} | ${questlines[q] ? count(q) : 0} | ${checked[q] ?? (questlines[q] ? 'built, not yet re-read' : 'pending')} |`),
  '',
  '## Known limits (what the doc asks for that the game cannot do yet)',
  '',
  ...sorted.filter((q) => limits[q]?.length).flatMap((q) => [`**${q}. ${fixture.questlines[q]?.title ?? ''}**`, ...limits[q]!.map((l) => `- ${l}`), '']),
];
write('docs/status/co-anime.md', lines.join('\n') + '\n');
console.log(`anime: ${sorted.length}/${all.length} questlines, ${events.length} events, ${keys.length} flags (${keys.filter((k) => !sets.has(k)).length} external), ${Object.keys(built).length}/${mine.length} catalog ids`);
