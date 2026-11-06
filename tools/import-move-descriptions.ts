// Writes src/data/moveDescriptions.json: one in-game description per move (Beta 4.4 #26).
//
//   npx tsx tools/import-move-descriptions.ts
//
// Source: PokeAPI's move_flavor_text.csv (English, the newest game that has the move), downloaded into
// .cache/pokeapi if missing. The text is Nintendo's in-game move description, like the rest of the
// director's packs (provenance: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv).
// Our move ids follow PokeAPI's identifiers; the few that differ are mapped in ALIASES.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'pokeapi');
const ALIASES: Record<string, string> = { 'vise-grip': 'vice-grip' };

function csv(name: string): string[][] {
  const path = join(cache, name);
  if (!existsSync(path)) {
    mkdirSync(cache, { recursive: true });
    execFileSync('curl', ['-sSfL', '-o', path, `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${name}`]);
  }
  // A small CSV reader: quoted fields may hold commas and line breaks.
  const text = readFileSync(path, 'utf8');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n') row.push(field), rows.push(row), (row = []), (field = '');
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows.slice(1);
}

const ids = new Map(csv('moves.csv').map((r) => [r[1]!, r[0]!]));
const best = new Map<string, { version: number; text: string }>();
for (const [moveId, version, language, text] of csv('move_flavor_text.csv')) {
  if (language !== '9') continue;
  const v = Number(version);
  const had = best.get(moveId!);
  if (!had || v > had.version) best.set(moveId!, { version: v, text: text!.replace(/­\n/g, '').replace(/-\n/g, '-').replace(/\s+/g, ' ').trim() });
}

const moves = JSON.parse(readFileSync(join(root, 'src', 'data', 'moves.json'), 'utf8')) as { id: string }[];
const out: Record<string, string> = {};
for (const m of moves) {
  const text = best.get(ids.get(ALIASES[m.id] ?? m.id) ?? '')?.text;
  if (text) out[m.id] = text;
}
writeFileSync(join(root, 'src', 'data', 'moveDescriptions.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${Object.keys(out).length} of ${moves.length} moves described.`);
