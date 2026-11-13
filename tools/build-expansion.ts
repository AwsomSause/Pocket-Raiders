// Builds src/data/expansion/*.json from the ten expanded scripts in tools/sources/expansion/ (Beta 0.6 slice F4/E0).
// Run: node tools/build-expansion.ts            (add --check to fail instead of writing when a file would change)
// Reads the roster tables (cast, special Pokémon, special Shadows), the world-state track (E1.2), the Siege Map
// (E7 Phase 0b), the Extended Cut phase table (E7) and the Apex Shadows (E4 + Phase 6). Every row is checked:
// ids, teams, Pokémon names against the game's own species data, Shadow tiers/abilities/moves. Problems stop the build.
// Ported from the pack's tools/build_expansion.js; the generated files are never edited by hand.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { EXPANSION_APEX_COUNT, EXPANSION_COUNTS, ExpansionFileSchemas, SHADOW_TIERS } from '../src/core/expansion/data.ts';
import type { ExpansionData, ExpansionRegion } from '../src/core/expansion/data.ts';

const root = join(import.meta.dirname, '..');
const SRC = join(root, 'tools', 'sources', 'expansion');
const OUT = join(root, 'src', 'data', 'expansion');
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const REGION_BY_NUMBER: ExpansionRegion[] = ['any', 'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'];
const norm = (s: string) => String(s).toLowerCase().replace(/’/g, "'").trim();
const c = (row: string[], i: number): string => row[i] ?? '';
const strip = (s: string) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\*([^*]+)\*/g, '$1').trim();

// The game's own Pokémon names (base dex, the director's custom forms, story and jet species).
const names = new Set<string>();
for (const list of [readJson(join(root, 'src/data/species.json')), readJson(join(root, 'src/data/customSpecies.json')), readJson(join(root, 'src/data/storySpecies.json')).species, readJson(join(root, 'src/data/jetSpecies.json')).species] as { name?: string }[][]) {
  for (const p of list) if (p.name) names.add(norm(p.name));
}
const shadow = readJson(join(SRC, 'shadow.json')) as { abilities: { name: string }[]; moves: { name: string }[] };
const teams = readJson(join(SRC, 'evil_teams.json')) as { id: string }[];
const TEAM_IDS = new Set([...teams.map((t) => t.id), 'cipher']);
const ABIL = new Set(shadow.abilities.map((a) => a.name));
const MOVES = new Set(shadow.moves.map((m) => m.name));

interface Table { header: string[]; rows: string[][] }
function tablesOf(lines: string[]): Table[] {
  const out: Table[] = [];
  const cells = (l: string) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  for (let i = 0; i < lines.length; i++) {
    if (/^\|/.test(lines[i]!) && /^\|\s*-{3}/.test(lines[i + 1] ?? '')) {
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && /^\|/.test(lines[j]!)) rows.push(cells(lines[j++]!));
      out.push({ header: cells(lines[i]!), rows });
      i = j;
    }
  }
  return out;
}
/** The lines from the first heading matching `start` to the next heading of the same or a higher level. */
function section(lines: string[], start: RegExp): string[] {
  const i = lines.findIndex((l) => start.test(l));
  if (i < 0) return [];
  const level = /^(#+)/.exec(lines[i]!)![1]!.length;
  let j = i + 1;
  while (j < lines.length && !(/^(#+) /.test(lines[j]!) && /^(#+)/.exec(lines[j]!)![1]!.length <= level)) j++;
  return lines.slice(i, j);
}

const problems: string[] = [];
const data: ExpansionData = { characters: [], specialPokemon: [], specialShadows: [], variantLines: [], signatureMoves: [], events: [], raids: [], tracks: [], siege_maps: [], climax_extended: [], apex: [] };
const seen = new Set<string>();

const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => /^\d\d_.*_EXPANDED\.md$/.test(f)).sort() : [];
if (files.length !== 10) problems.push(`expected 10 expanded scripts in tools/sources/expansion, found ${files.length}`);

for (const f of files) {
  const bad = (m: string) => problems.push(`${f}: ${m}`);
  const region = REGION_BY_NUMBER[Number(f.slice(0, 2))] as ExpansionRegion;
  const md = readFileSync(join(SRC, f), 'utf8');
  const lines = md.split('\n');

  const sigMoves = [...md.matchAll(/\*\*Signature Shadow move — ([^:*]+):\*\*\s*([^\n]+)/g)].map((m) => ({ name: m[1]!.trim(), text: m[2]!.trim(), region }));
  data.signatureMoves.push(...sigMoves);
  const localMoves = new Set(sigMoves.map((m) => m.name));
  for (const m of md.matchAll(/\*\*Line rule — \*([^*]+)\*:\*\*\s*([^\n]+)/g)) data.variantLines.push({ rule: m[1]!.trim(), text: strip(m[2]!), region });
  for (const id of new Set([...md.matchAll(/`(xe\.[a-z0-9.-]+)`/g)].map((m) => m[1]!))) data.events.push({ id, region });
  for (const id of new Set([...md.matchAll(/\*\*PR:\*\* `(pr\.[a-z0-9.-]+)`/g)].map((m) => m[1]!))) data.raids.push({ id, region });

  const reg = (id: string, kind: string) => {
    if (!new RegExp(`^${kind}\\.[a-z0-9-]+\\.[a-z0-9-]+$`).test(id)) bad(`bad id "${id}"`);
    const team = id.split('.')[1] ?? '';
    if (!TEAM_IDS.has(team)) bad(`${id}: unknown team "${team}"`);
    if (seen.has(id)) bad(`duplicate id ${id}`);
    seen.add(id);
    return team;
  };
  const species = (id: string, cell: string) => {
    const list = strip(cell).split(' / ').map((x) => x.trim()).filter(Boolean);
    for (const s of list) if (!names.has(norm(s))) bad(`${id}: species "${s}" is not in the game's species data`);
    return list;
  };
  for (const t of tablesOf(lines)) {
    const h = t.header.join('|');
    if (h.startsWith('ID|Name|Rank|Based on|Role|Ace / signature|Voice')) {
      for (const r of t.rows) {
        const id = strip(c(r, 0));
        data.characters.push({ id, team: reg(id, 'sc'), region, name: strip(c(r, 1)), rank: strip(c(r, 2)), basedOn: strip(c(r, 3)), role: strip(c(r, 4)), ace: strip(c(r, 5)), voice: strip(c(r, 6)) });
      }
    } else if (h.startsWith('ID|Name|Species|Signature trait|Where met|Can the player get it?')) {
      for (const r of t.rows) {
        const id = strip(c(r, 0));
        data.specialPokemon.push({ id, team: reg(id, 'sv'), region, name: strip(c(r, 1)), species: species(id, c(r, 2)), trait: strip(c(r, 3)), where: strip(c(r, 4)), obtainable: strip(c(r, 5)) });
      }
    } else if (h.startsWith('ID|Code|Name|Species|Tier|Shadow ability|Shadow moves|Purification key|Where met')) {
      for (const r of t.rows) {
        const id = strip(c(r, 0));
        const team = reg(id, 'ss');
        const tier = strip(c(r, 4));
        if (!(SHADOW_TIERS as readonly string[]).includes(tier)) bad(`${id}: tier "${tier}"`);
        const ability = strip(c(r, 5));
        if (!ABIL.has(ability)) bad(`${id}: Shadow ability "${ability}" is not one of the 20`);
        const moves = strip(c(r, 6)).split(',').map((x) => x.trim()).filter(Boolean);
        for (const m of moves) if (!MOVES.has(m) && !localMoves.has(m)) bad(`${id}: Shadow move "${m}" is not defined`);
        const code = strip(c(r, 1));
        const apex = /^XD\d{3}$/.test(code);
        if (code !== '—' && !apex) bad(`${id}: code "${code}"`);
        data.specialShadows.push({ id, team, region, code: apex ? code : null, apex, name: strip(c(r, 2)), species: species(id, c(r, 3)), tier: tier as (typeof SHADOW_TIERS)[number], ability, moves, purification: strip(c(r, 7)), where: strip(c(r, 8)) });
      }
    }
  }

  // E2: the world-state track.
  const trackSec = section(lines, /^### E1\.2 World-state track/);
  const trackTable = tablesOf(trackSec)[0];
  if (!trackTable) bad('no E1.2 world-state track table');
  else {
    const gain = trackSec.slice(1).map((l) => l.trim()).find((l) => l && !l.startsWith('|')) ?? null;
    data.tracks.push({
      id: `track.${region}`, region, name: strip(/—\s*(.+)$/.exec(trackSec[0] ?? '')?.[1] ?? ''), gain: gain ? strip(gain) : null,
      steps: trackTable.rows.map((r) => ({ step: strip(c(r, 0)), name: strip(c(r, 1)), rule: strip(c(r, 2)), note: strip(c(r, 3)) })),
    });
  }

  // E4/E5: the Siege Map.
  const siegeSec = section(lines, /^### E7\.\d+ Phase 0b/);
  const siegeTable = tablesOf(siegeSec)[0];
  if (!siegeTable) bad('no Phase 0b Siege Map table');
  else {
    data.siege_maps.push({
      id: `siege.${region}`, region, title: strip(/Phase 0b — (.+)$/.exec(siegeSec[0] ?? '')?.[1] ?? ''), unit: strip(c(siegeTable.header, 0)),
      rules: siegeSec.slice(1).map((l) => l.trim()).filter((l) => l && !l.startsWith('|') && !l.startsWith('>')).map(strip),
      districts: siegeTable.rows.map((r) => {
        const cell = strip(c(r, 0));
        const m = /^(.*?)\s*\((.+)\)$/.exec(cell);
        return { name: m ? m[1]! : cell, location: m ? m[2]! : null, heldIf: strip(c(r, 1)), ifLost: strip(c(r, 2)) };
      }),
    });
  }

  // E5: the Extended Cut phase table.
  const e7 = section(lines, /^## E7\. /);
  const phaseTable = tablesOf(e7).find((t) => t.header[0] === '#' && /Phase/i.test(t.header[1] ?? ''));
  if (!phaseTable) bad('no Extended Cut phase table');
  else {
    const headings = e7.filter((l) => /^### E7\.\d+ /.test(l));
    const headingFor = (phase: string) => headings.find((l) => new RegExp(`^### E7\\.\\d+ Phase ${phase} — `).test(l)) ?? (phase === '—' ? headings.find((l) => /^### E7\.\d+ Breather/.test(l)) : undefined);
    const intro = e7.slice(1).map((l) => l.trim()).find((l) => l && !l.startsWith('|')) ?? null;
    data.climax_extended.push({
      id: `climax.${region}`, region, title: strip(/Extended Cut: "(.+?)"/.exec(e7[0] ?? '')?.[1] ?? (e7[0] ?? '').replace(/^## E7\.\s*/, '')), intro: intro ? strip(intro) : null,
      phases: phaseTable.rows.map((r) => {
        const phase = strip(c(r, 0));
        const heading = headingFor(phase);
        return { phase, name: strip(c(r, 1)), format: strip(c(r, 2)), source: strip(c(r, 3)), battles: strip(c(r, 4)), heading: heading ? strip(heading.replace(/^###\s*E7\.\d+\s*/, '')) : null };
      }),
    });
  }

  // E6: Apex Shadows with their Phase 6 section.
  const p6 = section(lines, /^### E7\.\d+ Phase 6 /);
  const p6text = p6.join('\n');
  const format = /^\*\*Format[^*\n]*\*\*:?\.?\s*(.+)$/m.exec(p6text)?.[1] ?? null;
  const timerN = /\*\*Timer:?\*\*:?[^\n]*?(\d+) turns/.exec(p6text)?.[1];
  const timer = timerN ? `${timerN} turns` : null;
  for (const s of data.specialShadows.filter((x) => x.region === region && x.apex)) {
    if (p6.length === 0) { bad(`${s.id}: no Phase 6 section`); continue; }
    data.apex.push({ id: s.id, code: s.code!, team: s.team, region, name: s.name, species: s.species, tier: s.tier, ability: s.ability, moves: s.moves, purification: s.purification, where: s.where, phase: { heading: strip((p6[0] ?? '').replace(/^###\s*E7\.\d+\s*/, '')), format: format ? strip(format) : null, timer: timer ? strip(timer) : null } });
  }
}

// Cross-file checks.
for (const f of files) for (const m of readFileSync(join(SRC, f), 'utf8').matchAll(/`((?:sc|sv|ss)\.[a-z0-9-]+\.[a-z0-9-]+)`/g)) if (!seen.has(m[1]!)) problems.push(`${f}: reference to undefined id ${m[1]}`);
const codes = data.apex.map((a) => a.code);
if (new Set(codes).size !== codes.length) problems.push('duplicate Apex code');
if (data.apex.length !== EXPANSION_APEX_COUNT) problems.push(`${data.apex.length} Apex Shadows (need ${EXPANSION_APEX_COUNT})`);
const eventIds = data.events.map((e) => e.id);
if (new Set(eventIds).size !== eventIds.length) problems.push('an event id appears in two scripts');
const counts = { characters: data.characters.length, specialPokemon: data.specialPokemon.length, specialShadows: data.specialShadows.length, events: data.events.length, raids: data.raids.length };
for (const k of Object.keys(EXPANSION_COUNTS) as (keyof typeof EXPANSION_COUNTS)[]) if (counts[k] !== EXPANSION_COUNTS[k]) problems.push(`${k}: ${counts[k]} (need ${EXPANSION_COUNTS[k]})`);
for (const k of Object.keys(ExpansionFileSchemas) as (keyof typeof ExpansionFileSchemas)[]) {
  const r = ExpansionFileSchemas[k].safeParse(data[k]);
  if (!r.success) problems.push(`${k}: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
}

if (problems.length) {
  console.error('expansion data: PROBLEMS\n  ' + problems.join('\n  '));
  process.exit(1);
}
const check = process.argv.includes('--check');
mkdirSync(OUT, { recursive: true });
let stale = 0;
for (const k of Object.keys(ExpansionFileSchemas) as (keyof typeof ExpansionFileSchemas)[]) {
  const path = join(OUT, `${k}.json`);
  const text = JSON.stringify(data[k], null, 1) + '\n';
  if (check) { if (!existsSync(path) || readFileSync(path, 'utf8') !== text) { console.error(`stale: ${k}.json`); stale++; } }
  else writeFileSync(path, text);
}
if (stale) process.exit(1);
console.log(`expansion data ${check ? 'up to date' : 'written'}: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}, ${data.tracks.length} tracks, ${data.siege_maps.length} siege maps, ${data.climax_extended.length} climaxes, ${data.apex.length} apex`);
