// Imports the director's "Overhaul content pack" (overhaul_content_pack_2.zip, uploaded
// 2026-11-06) into src/data/overhaul/. Slice 1 of the Overhaul plan: data only, nothing in the
// game reads it yet, so every file has status "disabled" until a later slice wires it in.
//
// What it does, in order:
//   1. copies the 16 hand-written catalogs and the 4 generated line files,
//   2. fixes the problems found in the review (wrong Z-Crystal text, fake items, "a Electric",
//      broken template lines, cross-run features switched off, renamed trainer types),
//   3. matches names to the game's own data (species, moves, items, bosses) so later slices know
//      what is usable, and
//   4. writes docs/quality/overhaul-import.md with every count, fix and unmatched name.
//
// The pack itself is not committed (about 7 MB). Unzip it and pass the folder that holds
// catalogs/ and generated/:
//
//   npm run data:overhaul -- /path/to/overhaul_content
//
// Running it twice on the same pack gives the same files (no randomness, sorted output).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const packDir = process.argv[2] ?? process.env.OVERHAUL_PACK;
if (!packDir || !existsSync(join(packDir, 'catalogs'))) {
  console.error('Usage: npm run data:overhaul -- <folder with catalogs/ and generated/>');
  process.exit(1);
}

type Json = Record<string, unknown>;
const read = (dir: string, name: string): unknown => JSON.parse(readFileSync(join(packDir, dir, `${name}.json`), 'utf8'));
const sha = (dir: string, name: string) => createHash('sha256').update(readFileSync(join(packDir, dir, `${name}.json`))).digest('hex').slice(0, 16);
const gameJson = <T>(name: string): T => JSON.parse(readFileSync(join(root, 'src', 'data', `${name}.json`), 'utf8')) as T;

/** Name key used to match the pack's display names to the game's ids ("Farfetch’d" = "farfetchd"). */
export const nameKey = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/♀/g, 'f').replace(/♂/g, 'm').toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------- the game's own names ----------
const species = gameJson<{ id: string; name: string }[]>('species');
const moves = gameJson<{ id: string; name: string }[]>('moves');
// Items live in three files: the catalog, the base items and the Mega Stones.
const items = [
  ...gameJson<{ id: string; name: string }[]>('itemCatalog'),
  ...gameJson<{ id: string; name: string }[]>('items'),
  ...gameJson<{ items: { id: string; name: string }[] }>('megaStones').items,
];
const bosses = gameJson<{ id: string; name: string }[]>('bosses');
const abilitiesRaw = gameJson<unknown>('abilities');
const abilities = (Array.isArray(abilitiesRaw) ? abilitiesRaw : Object.values(abilitiesRaw as Json)) as { id: string; name: string }[];
const index = (list: { id: string; name: string }[]) => {
  const m = new Map<string, string>();
  for (const e of list) {
    m.set(nameKey(e.name), e.id);
    if (!m.has(nameKey(e.id))) m.set(nameKey(e.id), e.id);
  }
  return m;
};
// Pack species names use the dex form style ("Sandshrew-Alola"); the game's ids are the same words.
const speciesIds = index(species);
const moveIds = index(moves);
const itemIds = index(items);
const bossIds = index(bosses);
const abilityIds = index(abilities);
const matchOr = (m: Map<string, string>, name: string) => m.get(nameKey(name)) ?? null;

// ---------- fix log ----------
const fixes: Record<string, number> = {};
const examples: Record<string, string> = {};
const fixed = (what: string, example?: string) => {
  fixes[what] = (fixes[what] ?? 0) + 1;
  if (example && !(what in examples)) examples[what] = example;
};

/** "a Electric" -> "an Electric", "a Ivysaur" -> "an Ivysaur". Leaves "a Unova"-style "yoo" sounds alone. */
const fixArticles = (text: string) =>
  text.replace(/\b([Aa]) ([AEIOU])(?!ni|nova|ltra|se)/g, (_m, a: string, v: string) => {
    fixed('"a" before a vowel changed to "an"', text);
    return `${a}n ${v}`;
  });
/** Capitalises a sentence that starts lowercase after ". " ("...on it. express parcels can wait."). */
const fixSentenceCase = (text: string) =>
  text.replace(/([.!?] )([a-z])/g, (_m, p: string, c: string) => {
    fixed('sentence after a full stop now starts with a capital', text);
    return p + c.toUpperCase();
  });
const tidy = (text: string) => fixSentenceCase(fixArticles(text.replace(/’/g, "'")));

const STATUS = 'disabled';
const NOTE = 'Imported in Overhaul slice 1 (data only). No game system reads this file yet.';
const out: Record<string, unknown> = {};
const counts: Record<string, number> = {};
const unmatched: Record<string, string[]> = {};
const sources: Record<string, string> = {};

function wrap(name: string, entries: unknown[], extra: Json = {}) {
  counts[name] = entries.length;
  sources[name] = sha(name.startsWith('lines/') ? 'generated' : 'catalogs', name.replace('lines/', ''));
  out[name] = { status: STATUS, note: NOTE, source: `overhaul_content_pack_2.zip (director, 2026-11-06), ${name.startsWith('lines/') ? 'generated' : 'catalogs'}/${name.replace('lines/', '')}.json`, ...extra, entries };
}

// ---------- catalogs ----------
// Cross-run features are off: the director chose "no rival memory across runs" (decision C).
const CROSS_RUN = 'Cross-run memory is off (director decision C, 2026-11-06).';

const milestones = (read('catalogs', 'milestones') as Json[]).map((m) => {
  const e: Json = { ...m, phrasings: (m.phrasings as string[]).map(tidy) };
  if (m.id === 'M-VETERAN') {
    e.disabled = CROSS_RUN;
    fixed('cross-run entry switched off', String(m.id));
  }
  return e;
});
wrap('milestones', milestones);

wrap('titles', (read('catalogs', 'titles') as Json[]).map((t) => ({ ...t, flavor: tidy(String(t.flavor)) })));
wrap('personalities', read('catalogs', 'personalities') as Json[]);
wrap('quirks', (read('catalogs', 'quirks') as Json[]).map((q) => ({ ...q, moments: (q.moments as Json[]).map((m) => ({ ...m, line: tidy(String(m.line)) })) })));
wrap('relationship_types', read('catalogs', 'relationship_types') as Json[]);
wrap('battle_environments', read('catalogs', 'battle_environments') as Json[]);
wrap('battlefield_conditions', read('catalogs', 'battlefield_conditions') as Json[]);
wrap('growth_paths', read('catalogs', 'growth_paths') as Json[]);

// Team chemistry: list the named species and match them; "~type:Fire>=3" style rules stay as they are.
wrap(
  'team_chemistry',
  (read('catalogs', 'team_chemistry') as Json[]).map((c) => {
    const req = String(c.requirement);
    const named = req.startsWith('~') ? [] : req.split('+').map((s) => s.trim());
    const ids = named.map((n) => matchOr(speciesIds, n));
    named.forEach((n, i) => {
      if (!ids[i]) (unmatched['team_chemistry species'] ??= []).push(n);
    });
    return { ...c, speciesIds: ids.filter((x): x is string => x !== null), complete: ids.every((x) => x !== null) };
  }),
);

wrap(
  'move_mastery_ideas',
  (read('catalogs', 'move_mastery_ideas') as Json[]).map((m) => {
    const moveId = matchOr(moveIds, String(m.move));
    if (!moveId) (unmatched['move_mastery moves'] ??= []).push(String(m.move));
    return { ...m, moveId };
  }),
);

const runTitles = read('catalogs', 'run_titles') as { templates: Json[]; pools: Json };
counts.run_titles = runTitles.templates.length;
sources.run_titles = sha('catalogs', 'run_titles');
out.run_titles = { status: STATUS, note: NOTE, source: 'overhaul_content_pack_2.zip (director, 2026-11-06), catalogs/run_titles.json', entries: runTitles.templates, pools: runTitles.pools };

// Trainer archetypes: two names the director asked to soften (2026-11-06, "only some").
const RENAMES: Record<string, { id: string; name: string }> = {
  assassin: { id: 'shadow-agent', name: 'Shadow Agent' },
  necromancer: { id: 'spirit-caller', name: 'Spirit Caller' },
};
wrap(
  'trainer_archetypes',
  (read('catalogs', 'trainer_archetypes') as Json[]).map((a) => {
    const r = RENAMES[String(a.id)];
    const e: Json = { ...a, acts: (a.acts as string[]).map((x) => x.replace('pouring over', 'poring over')) };
    if (r) {
      e.id = r.id;
      e.name = r.name;
      fixed('trainer type renamed (director, 2026-11-06)', `${a.name} -> ${r.name}`);
      if (a.id === 'necromancer') {
        e.things = ['spirit charms', 'a dark robe', 'hollow chants'];
        e.acts = ['calling on old spirits', 'poring over black tomes'];
        e.motto = 'The spirits owe me favors.';
      }
    }
    if ((a.acts as string[]).some((x) => x.includes('pouring over'))) fixed('"pouring over" spelling fixed to "poring over"');
    return e;
  }),
);

// Major trainers: match to the game's bosses. Facts are kept as the pack wrote them; the
// polish slice checks canon (aces, types) with the game's own boss teams.
wrap(
  'major_trainers',
  (read('catalogs', 'major_trainers') as Json[]).map((t) => {
    const bossId = bossIds.get(nameKey(String(t.id))) ?? bossIds.get(nameKey(String(t.name))) ?? null;
    if (!bossId) (unmatched['major_trainers without a game boss'] ??= []).push(String(t.name));
    const aceId = matchOr(speciesIds, String(t.ace));
    if (!aceId) (unmatched['major_trainers aces'] ??= []).push(String(t.ace));
    const traits = (t.traits as string[]).map((x) => {
      if (/\bhis\b|\bher\b/.test(x)) fixed('trainer trait made first-person ("his brother" -> "my brother")', x);
      return x.replace(/\bhis\b/g, 'my').replace(/\bher\b/g, 'my');
    });
    return { ...t, traits, bossId, aceId };
  }),
);

// Item synergies: the review found wrong Z-Crystal text, a non-existent "Stick" pairing and two
// fan-made items. Every entry is matched to the game's item list; unmatched items stay in the
// file with item "missing" so a later slice can decide (add the item, or leave it out).
const FAKE_ITEMS = new Set(['Crucibellite', 'Vile Vial']);
const synergies: Json[] = [];
for (const s of read('catalogs', 'item_synergies') as Json[]) {
  const item = String(s.item).replace(/’/g, "'");
  const partner = { ...(s.partner as { kind: string; value: string }) };
  partner.value = partner.value.replace(/’/g, "'");
  let text = String(s.text);
  if (FAKE_ITEMS.has(item)) {
    fixed('fan-made item removed (not a real item)', item);
    continue;
  }
  if (item === 'Stick') {
    fixed('"Stick" pairing removed (the item is the Leek, already listed)', String(s.id));
    continue;
  }
  if (s.source === 'dex:onPlate' && / Z$/.test(item)) {
    // Z-Crystals were written as if they were Arceus plates. A held Z-Crystal lets the holder use
    // the matching Z-Move once per battle; it does not change type or boost moves.
    const type = item.replace(/inium Z$|ium Z$/, '');
    const typeName = { Bug: 'Bug', Dark: 'Dark', Drag: 'Dragon', Dragon: 'Dragon', Electr: 'Electric', Fair: 'Fairy', Fight: 'Fighting', Fir: 'Fire', Fly: 'Flying', Ghost: 'Ghost', Grass: 'Grass', Ground: 'Ground', Ic: 'Ice', Norm: 'Normal', Poison: 'Poison', Psych: 'Psychic', Rock: 'Rock', Steel: 'Steel', Water: 'Water' }[type] ?? type;
    partner.kind = 'type';
    partner.value = typeName;
    text = `${item} lets the holder turn one ${typeName}-type move into its Z-Move, once per battle.`;
    fixed('Z-Crystal text corrected (it was written as an Arceus plate)', item);
  }
  text = tidy(text);
  // The game still uses the old name "Stick" for the Leek.
  const itemId = item === 'Leek' ? (itemIds.get('stick') ?? null) : matchOr(itemIds, item);
  let partnerId: string | null = null;
  if (partner.kind === 'species') partnerId = matchOr(speciesIds, partner.value);
  else if (partner.kind === 'move') partnerId = matchOr(moveIds, partner.value);
  else if (partner.kind === 'ability') partnerId = matchOr(abilityIds, partner.value);
  if (!itemId) (unmatched['item_synergies items not in the game'] ??= []).push(item);
  if (['species', 'move', 'ability'].includes(partner.kind) && !partnerId) (unmatched[`item_synergies ${partner.kind} partners`] ??= []).push(partner.value);
  synergies.push({ id: s.id, item, partner, text, source: s.source, itemId, partnerId, usable: itemId !== null && (partnerId !== null || !['species', 'move', 'ability'].includes(partner.kind)) });
}
wrap('item_synergies', synergies);

wrap(
  'signature_moments_library',
  (read('catalogs', 'signature_moments_library') as Json[]).map((m) => {
    const e: Json = { ...m, scene: tidy(String(m.scene)) };
    if (/\bher\b|\bhis\b|\bshe\b|\bhe\b/i.test(String(e.scene))) {
      e.scene = String(e.scene).replace(/\bher\b/g, 'their').replace(/\bhis\b/g, 'their').replace(/\bshe\b/g, 'they').replace(/\bhe\b/g, 'they');
      fixed('gendered word in a moment made neutral', String(m.id));
    }
    if (m.id === 'legend-guest') {
      e.disabled = CROSS_RUN;
      fixed('cross-run entry switched off', String(m.id));
    }
    return e;
  }),
);

wrap(
  'event_chains',
  (read('catalogs', 'event_chains') as Json[]).map((c) => ({
    ...c,
    stages: (c.stages as Json[]).map((s) => ({ ...s, scene: tidy(String(s.scene)), options: (s.options as Json[]).map((o) => ({ ...o, outcome: tidy(String(o.outcome)) })) })),
  })),
);

// ---------- generated lines ----------
// Lines from templates that read badly whatever is put in them ("even if I am just tidy desks",
// "That's the stuff rare stones dreams are made of"). Removed, not rewritten.
const BAD_TEMPLATE = [/even if I am just /, /That's the stuff .* dreams are made of/];
const cleanLines = <T extends Json>(name: string, list: T[], textKey: keyof T & string) => {
  const kept: T[] = [];
  for (const l of list) {
    const raw = String(l[textKey]);
    if (BAD_TEMPLATE.some((r) => r.test(raw.replace(/’/g, "'")))) {
      fixed(`${name}: line from a broken template removed`, raw);
      continue;
    }
    let text = tidy(raw);
    if (/\b(his|her)\b/.test(text)) {
      text = text.replace(/\bhis\b/g, 'my').replace(/\bher\b/g, 'my');
      fixed(`${name}: "his"/"her" changed to "my"`, raw);
    }
    kept.push({ ...l, [textKey]: text });
  }
  return kept;
};

const archetypeRename = (id: string) => {
  const base = id.split('.')[0]!;
  const r = RENAMES[base];
  return r ? { id: id.replace(base, r.id), archetype: r.id } : null;
};
wrap(
  'lines/archetype_lines',
  cleanLines('archetype lines', read('generated', 'archetype_lines') as Json[], 'text').map((l) => {
    const r = archetypeRename(String(l.id));
    return r ? { ...l, ...r } : l;
  }),
);
wrap('lines/major_trainer_lines', cleanLines('trainer lines', read('generated', 'major_trainer_lines') as Json[], 'text'));

// Reactions: the pack mixes "boss_intro" and "boss-intro"; one spelling (underscores) is kept.
const CONTEXT_ALIASES: Record<string, string> = { 'rain-start': 'rain', 'sunny-day': 'sunny', 'night-camp': 'night', 'boss-intro': 'boss_intro', 'rest-node': 'rest_node', 'berry-found': 'berry_found' };
wrap(
  'lines/contextual_reactions',
  cleanLines('reactions', read('generated', 'contextual_reactions') as Json[], 'text').map((r) => {
    const ctx = String(r.context);
    if (ctx in CONTEXT_ALIASES) {
      fixed('reaction context spelling unified', `${ctx} -> ${CONTEXT_ALIASES[ctx]}`);
      return { ...r, context: CONTEXT_ALIASES[ctx] };
    }
    return r;
  }),
);

wrap(
  'lines/species_signature_moments',
  cleanLines('species moments', read('generated', 'species_signature_moments') as Json[], 'scene').map((m) => {
    const speciesId = matchOr(speciesIds, String(m.species));
    if (!speciesId) (unmatched['species moments species'] ??= []).push(String(m.species));
    return { ...m, trigger: tidy(String(m.trigger)), speciesId };
  }),
);

// ---------- write ----------
const dataDir = join(root, 'src', 'data', 'overhaul');
mkdirSync(join(dataDir, 'lines'), { recursive: true });
// Catalogs stay readable; the four big line files are written compact to keep the repo small.
for (const [name, body] of Object.entries(out)) writeFileSync(join(dataDir, `${name}.json`), (name.startsWith('lines/') ? JSON.stringify(body) : JSON.stringify(body, null, 1)) + '\n');

const uniq = (xs: string[]) => [...new Set(xs)].sort();
const report = [
  '# Overhaul content pack import',
  '',
  'Written by `npm run data:overhaul` (tools/import-overhaul-pack.ts). Do not edit by hand.',
  '',
  '## Counts',
  '',
  '| File | Entries | Source hash |',
  '| --- | --- | --- |',
  ...Object.keys(counts).sort().map((k) => `| ${k} | ${counts[k]} | ${sources[k]} |`),
  '',
  '## Fixes made on import',
  '',
  '| Fix | Count | Example |',
  '| --- | --- | --- |',
  ...Object.keys(fixes).sort().map((k) => `| ${k} | ${fixes[k]} | ${(examples[k] ?? '').replace(/\|/g, '/').slice(0, 100)} |`),
  '',
  '## Names the game does not have (yet)',
  '',
  ...Object.keys(unmatched).sort().flatMap((k) => {
    const list = uniq(unmatched[k]!);
    return [`**${k}** (${list.length}): ${list.join(', ')}`, ''];
  }),
];
mkdirSync(join(root, 'docs', 'quality'), { recursive: true });
writeFileSync(join(root, 'docs', 'quality', 'overhaul-import.md'), report.join('\n') + '\n');
console.log(`Wrote ${Object.keys(out).length} files to src/data/overhaul/. Fixes: ${Object.values(fixes).reduce((a, b) => a + b, 0)}.`);
for (const k of Object.keys(unmatched).sort()) console.log(`  unmatched ${k}: ${uniq(unmatched[k]!).length}`);
