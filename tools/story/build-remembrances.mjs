// Builds src/data/story/remembrances.json from tools/story/remembrance-roster.tsv (the 74 lines of Design v2 Part II).
// Keeps any line already in the file (its id, unlock, moves, keystone and temperament) and fills in role, rarity,
// generation, affinity and stages from the roster. New lines get three starting moves from the first stage's level-up
// learnset. Run: node tools/story/build-remembrances.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const species = new Map(read('src/data/species.json').map((s) => [s.id, s]));
for (const s of read('src/data/storySpecies.json').species) species.set(s.id, { ...species.get(s.evolvesFrom ?? '') , ...s });
const out = 'src/data/story/remembrances.json';
const existing = read(out);
const byLine = new Map(existing.map((r) => [r.line[0], r]));

const rows = readFileSync(new URL('tools/story/remembrance-roster.tsv', root), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
const BRANCHING = new Set(['tuftin', 'poliwag', 'oddish', 'ralts']);
const BABY = new Set(['pichu', 'tuftin', 'magby', 'elekid', 'togepi']);
const result = [];
for (const [first, stages, rarity, role, temperament, traits, route] of rows) {
  const line = stages.split('/');
  for (const id of line) if (!species.has(id)) throw new Error(`unknown species ${id}`);
  const base = species.get(first);
  const [a, b, c] = traits.split(',');
  const affinity = { [a]: 3, [b]: 3, [c]: 2 };
  const quiz = route === 'quiz';
  const old = byLine.get(first);
  const learn = (base.learnset ?? []).filter((m) => m.level <= 12).map((m) => m.move);
  const moves = old?.moves ?? [...new Set(learn)].slice(0, 3);
  if (moves.length === 0) moves.push('tackle');
  result.push({
    v: 1,
    id: old?.id ?? `rm_${first.replace(/-/g, '_')}`,
    line,
    types: old?.types ?? base.types,
    temperament: old?.temperament ?? `tm_${temperament}`,
    affinity,
    unlock: quiz ? { kind: 'quiz', arg: rarity === 'familiar' ? 'initial' : 'low_weight' } : old?.unlock ?? { kind: 'win', arg: route },
    moves,
    keystone: old?.keystone ?? `keystone_${first.replace(/-/g, '_')}`,
    status: 'limited',
    role,
    rarity,
    generation: base.generation,
    branching: BRANCHING.has(first),
    baby: BABY.has(first),
    quizEligible: quiz,
  });
}
// 74 design lines plus Vulpix and Psyduck (director, 2026-11-07: they are Story Run starters).
if (result.length !== 76) throw new Error(`expected 76 lines, got ${result.length}`);
writeFileSync(new URL(out, root), JSON.stringify(result, null, 1) + '\n');
console.log(`remembrances: ${result.length} lines (${result.filter((r) => byLine.has(r.line[0])).length} kept)`);
