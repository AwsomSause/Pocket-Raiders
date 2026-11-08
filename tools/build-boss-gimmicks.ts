// Designates each boss's gimmicks: the order it earns them and the Pokémon each belongs to.
//   node tools/build-boss-gimmicks.ts      (writes src/data/bossGimmicks.json; deterministic)
// Fit: Mega goes to a signature Pokémon that has a Mega form; Z-Move to a Pokémon with an attack of the boss's type;
// Dynamax to the heaviest signature Pokémon (Gigantamax forms first); Tera to a signature Pokémon sharing the boss's type.
import { writeFileSync } from 'node:fs';
import type * as Data from '../src/data/index.ts';
import type * as Transform from '../src/core/battle/transform.ts';
import { closeModules, loadModule, root } from './lib/gameModules.ts';

const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { stoneForms, gmaxFormFor } = await loadModule<typeof Transform>('/src/core/battle/transform.ts');
await closeModules();
const content = buildContent();
const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const KINDS = ['mega', 'tera', 'zmove', 'dynamax'] as const;

const out: Record<string, { order: string[]; mons: Record<string, string> }> = {};
for (const boss of [...content.bosses.values()].sort((a, b) => a.id.localeCompare(b.id))) {
  const count = new Map<string, number>();
  const attackTypes = new Map<string, Set<string>>();
  for (const role of ['gym', 'elite', 'champion'] as const) {
    for (const team of boss.teams[role]) {
      for (const m of team.members) {
        count.set(m.speciesId, (count.get(m.speciesId) ?? 0) + 1);
        for (const id of m.moves) {
          const mv = content.moves.get(id);
          if (mv && mv.category !== 'status') (attackTypes.get(m.speciesId) ?? attackTypes.set(m.speciesId, new Set()).get(m.speciesId)!).add(mv.type);
        }
      }
    }
  }
  const sig = boss.signature.filter((s) => count.has(s) || content.species.has(s));
  const pool = [...new Set([...sig, ...[...count.keys()].sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b))])].filter((s) => content.species.has(s));
  const type0 = boss.types[0]!;
  const sp = (id: string) => content.species.get(id)!;
  const cand: Record<string, string[]> = {
    mega: pool.filter((s) => stoneForms(content, s, false).length > 0),
    zmove: pool.filter((s) => attackTypes.get(s)?.size).sort((a, b) => Number(attackTypes.get(b)?.has(type0)) - Number(attackTypes.get(a)?.has(type0))),
    dynamax: [...pool].sort((a, b) => Number(sig.includes(b)) - Number(sig.includes(a)) || Number(!!gmaxFormFor(content, b)) - Number(!!gmaxFormFor(content, a)) || sp(b).baseStats.hp - sp(a).baseStats.hp),
    tera: [...sig, ...pool].filter((s) => sp(s).types.includes(type0)).concat(pool),
  };
  const score: Record<string, number> = {
    mega: cand.mega!.length === 0 ? -1 : sig.includes(cand.mega![0]!) ? 65 : 45,
    zmove: cand.zmove!.length === 0 ? -1 : attackTypes.get(cand.zmove![0]!)?.has(type0) ? 60 : 45,
    dynamax: cand.dynamax!.length === 0 ? -1 : 40 + (gmaxFormFor(content, cand.dynamax![0]!) ? 25 : 0) + (sp(cand.dynamax![0]!).baseStats.hp >= 100 ? 10 : 0),
    tera: cand.tera!.length === 0 ? -1 : 40 + (sp(cand.tera![0]!).types.includes(type0) ? 20 : 0),
  };
  const ranked = KINDS.map((k) => ({ k, s: score[k]! < 0 ? -1 : score[k]! + (hash(`${boss.id}:${k}`) % 35) })).sort((a, b) => b.s - a.s || a.k.localeCompare(b.k));
  const used = new Set<string>();
  const mons: Record<string, string> = {};
  for (const { k, s } of ranked) {
    if (s < 0) continue;
    const pick = cand[k]!.find((x) => !used.has(x)) ?? cand[k]![0]!;
    mons[k] = pick;
    used.add(pick);
  }
  out[boss.id] = { order: ranked.filter((r) => r.s >= 0).map((r) => r.k), mons };
}
writeFileSync(`${root}/src/data/bossGimmicks.json`, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${Object.keys(out).length} bosses`);
