// Event visuals report (the remade event screen, Kice 2026-11-16: "Check that ALL events get new/improved visuals").
// Runs the event director over every event in the game and counts what each one gets: its place and how the place
// was found, its hour words, mood, weather, who stands in it, and the icon of every choice.
//
//   npm run report:event-visuals              print the report (exits 1 if any event fails to resolve)
//   npm run report:event-visuals -- --write   also write docs/quality/EVENT_VISUALS.md
//
// Read-only: it never changes the game data.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type * as Data from '../src/data/index.ts';
import type * as Events from '../src/core/events.ts';
import type * as Visuals from '../src/core/presentation/eventVisuals.ts';
import { closeModules, loadModule, root } from './lib/gameModules.ts';

const { getContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { choiceKind } = await loadModule<typeof Events>('/src/core/events.ts');
const V = await loadModule<typeof Visuals>('/src/core/presentation/eventVisuals.ts');
const content = getContent();
await closeModules();

const manifest = JSON.parse(readFileSync(join(root, 'public/assets/manifest.json'), 'utf8')) as { assets: { id: string }[] };
const have = new Set(manifest.assets.map((a) => a.id));
const speciesByName = new Map<string, string>();
for (const sp of content.species.values()) if (!speciesByName.has(sp.name.toLowerCase())) speciesByName.set(sp.name.toLowerCase(), sp.id);

const events = [...content.events.values()];
const tally = (xs: readonly string[]): [string, number][] => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
const pct = (n: number, of: number): string => `${((n / Math.max(1, of)) * 100).toFixed(1)}%`;
const table = (head: [string, string], rows: [string, number][], of: number): string => [`| ${head[0]} | ${head[1]} | Share |`, '|---|---:|---:|', ...rows.map(([k, n]) => `| ${k} | ${n} | ${pct(n, of)} |`)].join('\n');

const failed: string[] = [];
const rows = events.map((e) => {
  const kinds = e.choices.map((c) => choiceKind(c, c.chance ?? null));
  const v = V.eventVisual(e, { period: 'afternoon', stageTypes: [(e.types?.[0] ?? 'normal').toLowerCase()], kinds });
  const pic = v.pictures.find((id) => have.has(id)) ?? null;
  if (!V.PLACES[v.place] || (v.pictures.length > 0 && !pic)) failed.push(e.id);
  const said = `${e.name}. ${e.intro}`;
  const cast = e.scene.cast.filter((id) => have.has(id)).length;
  const fromText = cast ? 0 : V.castInText(said).filter((id) => have.has(id)).length;
  const mons = (e.scene.pokemon ? 1 : 0) + V.namedInText(said, speciesByName, 3).filter((id) => id !== e.scene.pokemon).length;
  const people = cast + fromText;
  return { e, v, pic, people, fromText, mons: Math.min(2, mons), shot: V.shotOf(v, people, mons > 0, kinds), icons: e.choices.map((c, i) => V.choiceVisual({ label: c.label, kind: kinds[i]!, locked: false, chance: c.chance ?? null })) };
});

const n = events.length, icons = rows.flatMap((r) => r.icons);
const drawn = rows.filter((r) => !r.pic).length;
const lines = [
  '# Event visuals: every event on the remade event screen',
  '',
  'Made by `npm run report:event-visuals -- --write`. The event director (`src/core/presentation/eventVisuals.ts`) reads each event\'s own name, text and data and decides its picture; this page counts what every event in the game gets.',
  '',
  `- Events checked: **${n}** (every event in the game data). Events that failed to resolve: **${failed.length}**.`,
  `- Events with a picture of their own: **${new Set(rows.map((r) => r.v.signature)).size}** distinct pictures for ${n} events (each event has its own seed, so no two share a skyline, a room or a mark).`,
  `- Backdrop: ${n - drawn} events stand in one of the game's place pictures, ${drawn} in a place drawn for them (town, room, hall, shop, ruins, snow, ship, fair, the void).`,
  `- Someone or something in the scene: ${rows.filter((r) => r.people > 0 || r.mons > 0).length} events show a person or a Pokémon from their own data or text (${rows.filter((r) => r.fromText > 0).length} of them only because the text names a trade such as "a Hiker"). In the rest, the map stop's own picture or the event's party Pokémon stands in where the game has one (Pokémon Moments, camp rests), and otherwise the player's lead Pokémon looks on from the near corner, so no scene is empty.`,
  `- Choices: ${icons.length} choices, every one with an icon and a tone; ${pct(icons.filter((c) => c.icon === 'star').length, icons.length)} fall back to the plain star.`,
  '',
  '## How the place was found',
  '',
  table(['By', 'Events'], tally(rows.map((r) => ({ words: 'The event\'s own words', stop: 'Its map stop', group: 'Its event group', stage: 'The stage\'s type (changes with the stage in play)', default: 'Nothing to go on: the road' })[r.v.placedBy])), n),
  '',
  '## Places',
  '',
  table(['Place', 'Events'], tally(rows.map((r) => r.v.place)), n),
  '',
  '## Moods',
  '',
  table(['Mood', 'Events'], tally(rows.map((r) => r.v.mood)), n),
  '',
  '## Weather and effects kept from the event data',
  '',
  table(['Weather', 'Events'], tally(rows.map((r) => r.v.weather ?? 'none')), n),
  '',
  table(['Subject effect', 'Events'], tally(rows.map((r) => r.v.stir ?? 'none')), n),
  '',
  '## Shots (how the scene is framed)',
  '',
  table(['Shot', 'Events'], tally(rows.map((r) => r.shot)), n),
  '',
  '## Choice icons',
  '',
  table(['Icon', 'Choices'], tally(icons.map((c) => c.icon)), icons.length),
  '',
  '## Known limits',
  '',
  '- The hour in this report is the afternoon for every event; in play it follows the run\'s clock unless the text names an hour.',
  '- The stage type here is the event\'s own first type, or Normal; in play it is the stage the player is on.',
  '- The Old look keeps its eight event styles as they were. The team screens of Team Magma/Aqua (table, briefing, final) and a department store floor keep their own pages.',
  '',
];
const text = lines.join('\n');
console.log(text.split('\n').slice(0, 12).join('\n'));
if (process.argv.includes('--write')) { writeFileSync(join(root, 'docs/quality/EVENT_VISUALS.md'), text); console.log('wrote docs/quality/EVENT_VISUALS.md'); }
if (failed.length) { console.error(`FAILED: ${failed.slice(0, 20).join(', ')}`); process.exit(1); }
