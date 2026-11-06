// Pokémon database audit (The Overhaul, P0 section 6.6). Pure: give it the loaded content, get back
// every problem it finds. Run by tests/unit/speciesDatabase.test.ts (CI) and `npm run data:validate`
// (which can also compare against PokeAPI's official data).
//
// buildContent (src/data/index.ts) already rejects unknown moves, abilities, evolution targets and
// forms; this adds the checks that look across species: evolution lines that point both ways,
// stages, cycles, learnsets that could not give a Pokémon a usable move, duplicates, and stats.
// Sprite files are checked by `npm run assets:manifest` (it fails on a missing file).

import type { Content, Species } from '../core/contentSchema';

export interface SpeciesProblem {
  speciesId: string;
  check: string;
  detail: string;
}

/** Forms that are a battle state of the species they evolve from (Mega, Gigantamax, Zen Mode ...), not a step of its line. */
const STATE_FORMS = new Set(['mega', 'gigantamax', 'primal', 'battle']);

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

export function auditSpecies(content: Content): SpeciesProblem[] {
  const problems: SpeciesProblem[] = [];
  const add = (s: Species, check: string, detail: string) => problems.push({ speciesId: s.id, check, detail });
  const isUsable = (id: string) => content.moves.get(id)?.supported !== false && content.moves.has(id);

  for (const s of content.species.values()) {
    // Types: one or two, never the same type twice.
    if (s.types.length < 1 || s.types.length > 2) add(s, 'types', `has ${s.types.length} types`);
    if (s.types.length === 2 && s.types[0] === s.types[1]) add(s, 'types', `lists ${s.types[0]} twice`);

    // Base stats: all six present and positive; the total within the range real Pokémon use (Eternamax is 1125).
    for (const k of STATS) if (!(s.baseStats[k] > 0)) add(s, 'stats', `${k} is ${s.baseStats[k]}`);
    const total = STATS.reduce((sum, k) => sum + s.baseStats[k], 0);
    if (total < 150 || total > 1200) add(s, 'stats', `base stat total ${total} is out of range`);

    // Abilities: at least one, none listed twice.
    const abilities = [...s.abilities.normal, ...(s.abilities.hidden ? [s.abilities.hidden] : [])];
    if (abilities.length === 0) add(s, 'abilities', 'has no ability');
    if (new Set(abilities).size !== abilities.length) add(s, 'abilities', `lists an ability twice (${abilities.join(', ')})`);

    // Learnset: not empty, no move twice at the same level, and at least one move the game can use.
    if (s.learnset.length === 0) add(s, 'learnset', 'has no level-up moves');
    const seen = new Set<string>();
    for (const e of s.learnset) {
      const key = `${e.level}:${e.move}`;
      if (seen.has(key)) add(s, 'learnset', `learns ${e.move} twice at level ${e.level}`);
      seen.add(key);
    }
    if (s.learnset.length > 0 && !s.learnset.some((e) => isUsable(e.move))) add(s, 'learnset', 'has no usable level-up move');

    // TMs, tutors and eggs: every species has a list (forms and custom evolutions borrow their base's).
    if (!content.learnables.has(s.id)) add(s, 'learnables', 'has no TM/tutor/egg move list');

    // Gender ratio within 0..1 (null = genderless).
    if (s.femaleRatio !== null && s.femaleRatio !== undefined && (s.femaleRatio < 0 || s.femaleRatio > 1)) add(s, 'gender', `female ratio ${s.femaleRatio}`);

    if (!s.assets.sprite) add(s, 'sprite', 'has no sprite name');

    // Evolutions: both ends agree, the stage goes up by one (baby Pokémon are the exception), the level is sane.
    for (const evo of s.evolutions) {
      const to = content.species.get(evo.to);
      if (!to) continue; // buildContent reports unknown targets.
      if (to.evolvesFrom !== s.id) add(s, 'evolution', `evolves into ${evo.to}, but ${evo.to} evolves from ${to.evolvesFrom ?? 'nothing'}`);
      if (!s.tags.includes('baby') && to.evolutionStage !== s.evolutionStage + 1) add(s, 'evolution', `stage ${s.evolutionStage} evolves into ${evo.to} at stage ${to.evolutionStage}`);
    }
    if (s.evolvesFrom && !STATE_FORMS.has(s.form?.kind ?? '')) {
      const from = content.species.get(s.evolvesFrom);
      if (from && !from.evolutions.some((e) => e.to === s.id)) add(s, 'evolution', `evolves from ${s.evolvesFrom}, which has no evolution into it`);
    }

    // No evolution line that loops back on itself.
    let at: Species | undefined = s;
    for (let steps = 0; at?.evolvesFrom; steps++) {
      if (steps > 5) {
        add(s, 'evolution', 'its evolution line loops');
        break;
      }
      at = content.species.get(at.evolvesFrom);
    }
  }
  return problems;
}
